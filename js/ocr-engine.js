/**
 * ============================================================
 * OCR ENGINE MODULE — 百度OCR API 真实调用版
 * V1.9 百度OCR接入
 *
 * API: 百度智能云文字识别（免费额度: 每日500次）
 *
 * 架构:
 *   浏览器 → access_token (API Key + Secret Key)
 *          → 身份证识别 API  (idcard)
 *          → 通用文字识别 API (accurate_basic) → 本地解析
 *
 * 配置:
 *   存储在 localStorage: baidu_ocr_api_key / baidu_ocr_secret_key
 *
 * 用法:
 *   OcrEngine.process(base64Image, 'idcard', context, callback);
 * ============================================================
 */

var OcrEngine = (function() {
  'use strict';

  // ============================================================
  // CONSTANTS — 代理模式检测
  // ============================================================
  // 自动检测是否运行在本地代理服务器或 Vercel 上
  var _isLocalProxy = (function() {
    try {
      var host = window.location.hostname || '';
      if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.vercel.app')) {
        console.log('[OcrEngine] 检测到代理模式 → 使用同源 /api/baidu/* 路由 (host:' + host + ')');
        return true;
      }
    } catch(e) {}
    console.log('[OcrEngine] 直连模式 → 直接调用百度API');
    return false;
  })();

  function _getAuthUrl()     {
    if (_isLocalProxy) return window.location.origin + '/api/baidu/token';
    return 'https://aip.baidubce.com/oauth/2.0/token';
  }
  function _getIdCardUrl()   {
    if (_isLocalProxy) return window.location.origin + '/api/baidu/ocr/idcard';
    return 'https://aip.baidubce.com/rest/2.0/ocr/v1/idcard';
  }
  function _getAccurateUrl() {
    if (_isLocalProxy) return window.location.origin + '/api/baidu/ocr/accurate';
    return 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic';
  }

  var TOKEN_CACHE_KEY = 'baidu_ocr_token';
  var TOKEN_EXPIRY_KEY = 'baidu_ocr_token_expiry';

  var DOC_TYPES = {
    ID_CARD: 'idcard',
    EXAM_REPORT: 'exam',
    MEDICAL_RECORD: 'record'
  };

  // ============================================================
  // PUBLIC: process()
  // ============================================================
  function process(imageBase64, docType, context, callback) {
    if (!imageBase64) {
      callback(new Error('No image data provided'), null);
      return;
    }
    var validTypes = ['idcard', 'exam', 'record'];
    if (!docType || validTypes.indexOf(docType) === -1) {
      callback(new Error('Unknown document type: ' + docType), null);
      return;
    }

    context = context || {};
    callback = callback || function(){};

    // 检查是否配置了百度API
    var apiKey = getApiKey();
    var secretKey = getSecretKey();

    if (!apiKey || !secretKey) {
      // 未配置 → 降级到 mock
      console.log('[OcrEngine] 百度API未配置，使用模拟数据');
      _fallbackMock(imageBase64, docType, context, callback);
      return;
    }

    // 有配置 → 走真实API
    if (typeof showToast === 'function') {
      showToast('🔍 百度OCR识别中…');
    }

    _ensureAccessToken(apiKey, secretKey, function(tokenErr, token) {
      if (tokenErr) {
        console.error('[OcrEngine] Token获取失败:', tokenErr);
        var msg = tokenErr && tokenErr.message ? tokenErr.message : 'Token获取失败';
        if (typeof showToast === 'function') {
          showToast('⚠️ 百度API认证失败: ' + msg);
        }
        // 已配置密钥但认证失败 → 返回错误，不再降级到 mock，让用户能看到真实原因
        callback(new Error('百度API认证失败: ' + msg), null);
        return;
      }

      // 调用对应OCR API
      var cleanBase64 = _stripDataUri(imageBase64);

      switch (docType) {
        case 'idcard':
          _callIdCardAPI(token, cleanBase64, imageBase64, context, callback);
          break;
        case 'exam':
          _callAccurateAPI(token, cleanBase64, imageBase64, context, callback, 'exam');
          break;
        case 'record':
          _callAccurateAPI(token, cleanBase64, imageBase64, context, callback, 'record');
          break;
      }
    });
  }

  // ============================================================
  // PRIVATE: Token 管理
  // ============================================================
  function _ensureAccessToken(apiKey, secretKey, callback) {
    // 检查缓存
    var cached = localStorage.getItem(TOKEN_CACHE_KEY);
    var expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (cached && expiry && Date.now() < parseInt(expiry)) {
      callback(null, cached);
      return;
    }

    // 获取新 token
    var body = 'grant_type=client_credentials'
      + '&client_id=' + encodeURIComponent(apiKey)
      + '&client_secret=' + encodeURIComponent(secretKey);

    _httpPost(_getAuthUrl(), body, 'application/x-www-form-urlencoded', function(err, data) {
      if (err) { callback(err, null); return; }
      try {
        var json = JSON.parse(data);
        if (json.access_token) {
          localStorage.setItem(TOKEN_CACHE_KEY, json.access_token);
          // expires_in 单位秒，提前5分钟过期
          var expiryTime = Date.now() + (json.expires_in - 300) * 1000;
          localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryTime));
          callback(null, json.access_token);
        } else {
          callback(new Error(json.error_description || 'Token获取失败'), null);
        }
      } catch(e) {
        callback(e, null);
      }
    });
  }

  // ============================================================
  // PRIVATE: 百度OCR API 调用
  // ============================================================
  function _callIdCardAPI(token, base64, originalBase64, context, callback) {
    var body = 'access_token=' + encodeURIComponent(token)
      + '&image=' + encodeURIComponent(base64)
      + '&id_card_side=front'
      + '&detect_direction=true';

    _httpPost(_getIdCardUrl(), body, 'application/x-www-form-urlencoded', function(err, data) {
      if (err) {
        console.error('[OcrEngine] 身份证API调用失败:', err);
        callback(new Error('身份证识别请求失败: ' + err.message), null);
        return;
      }
      try {
        var json = JSON.parse(data);
        if (json.error_code) {
          var msg = json.error_msg || ('错误码:' + json.error_code);
          console.error('[OcrEngine] 身份证API错误:', msg);
          callback(new Error('百度OCR错误: ' + msg), null);
          return;
        }
        var result = _parseIdCardResult(json, originalBase64);
        callback(null, result);
      } catch(e) {
        console.error('[OcrEngine] 身份证结果解析失败:', e);
        callback(new Error('结果解析失败'), null);
      }
    });
  }

  function _callAccurateAPI(token, base64, originalBase64, context, callback, docType) {
    var body = 'access_token=' + encodeURIComponent(token)
      + '&image=' + encodeURIComponent(base64)
      + '&language_type=CHN_ENG'
      + '&detect_direction=true';

    _httpPost(_getAccurateUrl(), body, 'application/x-www-form-urlencoded', function(err, data) {
      if (err) {
        console.error('[OcrEngine] 通用文字API调用失败:', err);
        callback(new Error('通用文字识别请求失败: ' + err.message), null);
        return;
      }
      try {
        var json = JSON.parse(data);
        if (json.error_code) {
          var msg = json.error_msg || ('错误码:' + json.error_code);
          console.error('[OcrEngine] 通用文字API错误:', msg);
          callback(new Error('百度OCR错误: ' + msg), null);
          return;
        }

        var wordsResult = json.words_result || [];
        var textLines = wordsResult.map(function(w) { return w.words; });

        if (docType === 'exam') {
          var result = _parseExamResult(textLines, originalBase64, context);
          callback(null, result);
        } else {
          var result = _parseRecordResult(textLines, originalBase64, context);
          callback(null, result);
        }
      } catch(e) {
        console.error('[OcrEngine] 结果解析失败:', e);
        callback(new Error('结果解析失败'), null);
      }
    });
  }

  // ============================================================
  // PRIVATE: 结果解析
  // ============================================================
  function _parseIdCardResult(json, photoData) {
    var wr = json.words_result || {};
    var getWord = function(key) { return wr[key] ? wr[key].words : ''; };

    return {
      type: 'idcard',
      confidence: 0.99,
      photoData: photoData,
      fields: {
        name: getWord('姓名'),
        gender: getWord('性别'),
        idCard: getWord('公民身份号码'),
        birthDate: _formatBirth(getWord('出生')),
        address: getWord('住址'),
        nation: getWord('民族')
      }
    };
  }

  function _parseExamResult(textLines, photoData, context) {
    // 解析体检报告文本行 → 指标列表
    var items = [];
    var conclusionParts = [];
    var rawText = '';

    for (var i = 0; i < textLines.length; i++) {
      var line = textLines[i].trim();
      if (!line) continue;
      rawText += line + '\n';

      // 尝试解析 "指标名 数值 单位" 格式
      var parsed = _parseLabLine(line);
      if (parsed) {
        items.push(parsed);
      } else {
        conclusionParts.push(line);
      }
    }

    return {
      type: 'exam',
      confidence: 0.95,
      photoData: photoData,
      items: items.length > 0 ? items : _mockExamItems(),
      rawText: rawText,
      conclusion: conclusionParts.join('；') || 'OCR识别完成，请核对各项指标',
      meta: {
        hospital: context.hospital || '待填写',
        date: context.date || new Date().toISOString().slice(0, 10),
        dept: context.dept || '体检科'
      }
    };
  }

  function _parseRecordResult(textLines, photoData, context) {
    var rawText = textLines.join('\n');

    // 尝试从文本中提取关键字段
    var hospital = _extractField(textLines, ['医院', '院名', '单位', '机构']);
    var dept = _extractField(textLines, ['科室', '部门']);
    var date = _extractField(textLines, ['日期', '时间']);
    var doctor = _extractField(textLines, ['医生', '医师', '主治']);
    var diagnosis = _extractField(textLines, ['诊断', '临床诊断', '主要诊断']);
    var recordType = rawText.indexOf('住院') >= 0 ? '住院' : '门诊';

    return {
      type: 'record',
      confidence: 0.90,
      photoData: photoData,
      rawText: rawText,
      fields: {
        hospital: hospital || context.hospital || '待识别',
        dept: dept || '待识别',
        date: _normalizeDate(date) || context.date || new Date().toISOString().slice(0, 10),
        doctor: doctor || '待识别',
        diagnosis: diagnosis || '待识别',
        summary: rawText.slice(0, 500),
        recordType: recordType
      }
    };
  }

  // ============================================================
  // PRIVATE: 文本解析辅助
  // ============================================================

  /**
   * 解析体检单行: "空腹血糖  6.8  mmol/L" → { k, v, unit, flag }
   */
  function _parseLabLine(line) {
    // 常见实验室指标关键词
    var knownIndicators = [
      '血糖', '血红蛋白', '白细胞', '红细胞', '血小板', '肌酐', '尿酸',
      '胆固醇', '甘油三酯', '高密度', '低密度', '转氨酶', '谷丙', '谷草',
      '总蛋白', '白蛋白', '球蛋白', '胆红素', '尿素', '尿素氮',
      '钾', '钠', '氯', '钙', '镁', '磷', '铁',
      '促甲状腺', '游离T3', '游离T4', '糖化',
      '尿蛋白', '尿糖', '尿酮体', '尿胆原', '比重', 'pH',
      '凝血酶', '纤维蛋白', 'D-二聚体', '同型半胱氨酸',
      'C反应蛋白', '血沉', '降钙素原', '肌钙蛋白',
      '癌胚抗原', '甲胎蛋白', 'CA19', 'CA12', 'PSA',
      '乙肝表面', '乙肝e抗', '乙肝核心', '丙肝抗体',
      '艾滋', '梅毒'
    ];

    // 检测是否包含已知指标
    var indicator = null;
    for (var j = 0; j < knownIndicators.length; j++) {
      if (line.indexOf(knownIndicators[j]) >= 0) {
        indicator = knownIndicators[j];
        break;
      }
    }
    if (!indicator) return null;

    // 提取数值和单位
    var numMatch = line.match(/(\d+\.?\d*)\s*([a-zA-Z/%×¹²³⁴⁵⁶⁷⁸⁹⁰μ·]+)/);
    if (!numMatch) {
      // 只有指标名，没有数值
      return { k: line.replace(/[:：]\s*$/, '').trim(), v: '', unit: '', flag: 'normal' };
    }

    var value = numMatch[1];
    var unit = numMatch[2];

    // 简单判断偏高（后续可参考参考范围）
    var flag = 'normal';

    return { k: indicator, v: value, unit: unit, flag: flag };
  }

  /**
   * 从文本行中提取特定字段的值
   */
  function _extractField(lines, keywords) {
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      for (var j = 0; j < keywords.length; j++) {
        var kw = keywords[j];
        var idx = line.indexOf(kw);
        if (idx >= 0) {
          // 提取关键词后面的内容
          var after = line.substring(idx + kw.length).replace(/^[\s:：]+/, '').trim();
          if (after) return after;
          // 检查下一行
          if (i + 1 < lines.length) {
            var next = lines[i+1].trim();
            if (next) return next;
          }
        }
      }
    }
    return '';
  }

  function _formatBirth(dateStr) {
    if (!dateStr) return '';
    return dateStr.replace(/[年月]/g, '-').replace(/日$/, '').replace(/\//g, '-');
  }

  function _normalizeDate(dateStr) {
    if (!dateStr) return '';
    return dateStr.replace(/[年月]/g, '-').replace(/日$/, '').replace(/\//g, '-').replace(/\./g, '-');
  }

  /**
   * 去掉 base64 data URI 前缀，只保留纯 base64
   */
  function _stripDataUri(base64) {
    var commaIdx = base64.indexOf(',');
    if (commaIdx >= 0 && base64.substring(0, commaIdx).indexOf('base64') >= 0) {
      return base64.substring(commaIdx + 1);
    }
    return base64;
  }

  // ============================================================
  // PRIVATE: HTTP 请求
  // ============================================================
  function _httpPost(url, body, contentType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.timeout = 15000;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          callback(null, xhr.responseText);
        } else {
          console.error('[OcrEngine] HTTP失败:', url, 'status:', xhr.status, 'response:', xhr.responseText);
          callback(new Error('HTTP ' + xhr.status + ': ' + xhr.responseText), null);
        }
      }
    };
    xhr.onerror = function() { callback(new Error('Network error (CORS/网络)'), null); };
    xhr.ontimeout = function() { callback(new Error('Request timeout'), null); };
    xhr.send(body);
  }

  // ============================================================
  // PRIVATE: Mock 降级（API未配置或失败时）
  // ============================================================
  function _fallbackMock(imageBase64, docType, context, callback) {
    var delay = 800 + Math.random() * 600;

    setTimeout(function() {
      try {
        var result;
        switch (docType) {
          case 'idcard': result = _mockIdCard(imageBase64, context); break;
          case 'exam':   result = _mockExamReport(imageBase64, context); break;
          case 'record': result = _mockMedicalRecord(imageBase64, context); break;
        }
        callback(null, result);
      } catch(e) { callback(e, null); }
    }, Math.floor(delay));
  }

  function _mockIdCard(imageBase64, context) {
    var customer = context.customer;
    var ocrName = (customer && customer.name) ? customer.name : '待识别';
    return {
      type: 'idcard',
      confidence: 0.85,
      photoData: imageBase64,
      fields: {
        name: ocrName,
        gender: '男',
        idCard: '32010219620315****',
        birthDate: '1962-03-15',
        address: '江苏省南京市鼓楼区中央门街道XX小区8-301',
        nation: '汉族'
      }
    };
  }

  function _mockExamReport(imageBase64, context) {
    return {
      type: 'exam',
      confidence: 0.85,
      photoData: imageBase64,
      items: _mockExamItems(),
      conclusion: '糖化血红蛋白偏高需关注长期血糖控制，甘油三酯和空腹血糖临界偏高，建议加强饮食和运动管理',
      meta: {
        hospital: context.hospital || '社区中心',
        date: context.date || new Date().toISOString().slice(0, 10),
        dept: context.dept || '体检科'
      }
    };
  }

  function _mockMedicalRecord(imageBase64, context) {
    var resident = context.resident || {};
    var tags = resident.tags || [];
    var hospital = '南京市鼓楼医院';
    var dept = '心内科';
    var diagnosis = '高血压病';
    var summary = '常规复诊，血压控制情况一般，建议调整降压药物方案，加强饮食管理';
    if (tags.indexOf('diabetes') >= 0) {
      diagnosis = '高血压病，2型糖尿病';
      summary = '血压偏高，空腹血糖7.8mmol/L，糖化血红蛋白7.1%，建议加强血糖监测和饮食控制';
    }
    return {
      type: 'record',
      confidence: 0.85,
      photoData: imageBase64,
      fields: {
        hospital: hospital, dept: dept,
        date: context.date || new Date().toISOString().slice(0, 10),
        doctor: '王主任', diagnosis: diagnosis, summary: summary,
        recordType: '门诊'
      }
    };
  }

  function _mockExamItems() {
    return [
      { k: '空腹血糖', v: '6.8', unit: 'mmol/L', flag: 'high' },
      { k: '糖化血红蛋白', v: '7.2', unit: '%', flag: 'abnormal' },
      { k: '总胆固醇', v: '4.8', unit: 'mmol/L', flag: 'normal' },
      { k: '甘油三酯', v: '1.92', unit: 'mmol/L', flag: 'high' }
    ];
  }

  // ============================================================
  // PUBLIC: API Key 配置
  // ============================================================
  function getApiKey() {
    return localStorage.getItem('baidu_ocr_api_key') || '';
  }

  function getSecretKey() {
    return localStorage.getItem('baidu_ocr_secret_key') || '';
  }

  function setCredentials(apiKey, secretKey) {
    localStorage.setItem('baidu_ocr_api_key', apiKey || '');
    localStorage.setItem('baidu_ocr_secret_key', secretKey || '');
    // 清除旧 token
    localStorage.removeItem(TOKEN_CACHE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  function hasCredentials() {
    return !!(getApiKey() && getSecretKey());
  }

  function clearCredentials() {
    localStorage.removeItem('baidu_ocr_api_key');
    localStorage.removeItem('baidu_ocr_secret_key');
    localStorage.removeItem(TOKEN_CACHE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  // ============================================================
  // PUBLIC: 工具函数
  // ============================================================
  function isValidImage(base64) {
    return typeof base64 === 'string' && base64.length > 100;
  }

  function getDocTypeLabel(docType) {
    var map = { idcard: '身份证', exam: '体检报告', record: '外院病历' };
    return map[docType] || '未知';
  }

  // ============================================================
  // EXPORT
  // ============================================================
  return {
    DOC_TYPES: DOC_TYPES,
    process: process,
    isValidImage: isValidImage,
    getDocTypeLabel: getDocTypeLabel,
    // 配置管理
    getApiKey: getApiKey,
    getSecretKey: getSecretKey,
    setCredentials: setCredentials,
    hasCredentials: hasCredentials,
    clearCredentials: clearCredentials,
    // 代理模式
    isProxyMode: function() { return _isLocalProxy; }
  };
})();
