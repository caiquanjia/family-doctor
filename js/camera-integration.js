/**
 * ============================================================
 * CAMERA INTEGRATION — 将真实摄像头接入三个OCR场景
 * V1.9
 * 
 * 在 health-ui.js 之后加载，覆盖模拟拍照函数。
 * 
 * 设计原则：
 *   - 不修改原有的 UI 渲染函数（renderOcrCreate 等）
 *   - 只替换"触发拍照"那一刻的行为
 *   - OCR 结果仍然走原有的渲染函数
 * ============================================================
 */

(function() {
  'use strict';

  // 等待 Camera 和 OcrEngine 都就绪后再覆盖
  function init() {
    if (typeof Camera === 'undefined' || typeof OcrEngine === 'undefined') {
      setTimeout(init, 100);
      return;
    }

    console.log('[CameraIntegration] Camera + OcrEngine detected, installing real camera hooks...');
    installHooks();
  }

  function installHooks() {
    // ---- 1. 身份证OCR（renderOcrCreate 中的相机占位）----
    var _renderOcrCreate = window.renderOcrCreate;
    window.renderOcrCreate = function() {
      _renderOcrCreate();
      setTimeout(function() {
        var placeholder = document.querySelector('#page-ocr-create .ocr-photo-placeholder');
        if (placeholder) {
          placeholder.onclick = realOcrIdCard;
          // 添加OCR配置状态提示
          _injectOcrConfigBadge();
        }
      }, 0);
    };

    // ---- 2. 体检报告OCR ----
    var _showExamCamera = window.showExamCamera;
    window.showExamCamera = function() {
      _showExamCamera();
      setTimeout(function() {
        var frame = document.querySelector('#page-add-exam .camera-frame');
        if (frame) {
          frame.onclick = realOcrExamReport;
        }
      }, 0);
    };

    // ---- 3. 外院病历OCR ----
    var _showExternalCamera = window.showExternalCamera;
    window.showExternalCamera = function() {
      _showExternalCamera();
      setTimeout(function() {
        var frame = document.querySelector('#page-add-external .camera-frame');
        if (frame) {
          frame.onclick = realOcrMedicalRecord;
        }
      }, 0);
    };

    // ---- 4. goToOcrForm: 使用真实OCR结果预填表单 ----
    window.goToOcrForm = function() {
      window.ocrStep = 2;
      var customer = window.getCurrentCustomer ? window.getCurrentCustomer() : null;
      var f = (window._ocrIdCardResult && window._ocrIdCardResult.fields) ? window._ocrIdCardResult.fields : {};
      var ocrName = f.name || (customer ? customer.name : '新居民');
      var ocrGender = f.gender || '男';
      var ocrIdCard = f.idCard || '';
      var ocrBirth = f.birthDate || '';
      var ocrAddr = f.address || '';
      var container = document.getElementById('page-ocr-create');
      if (!container) return;
      container.innerHTML = `
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;">
          📷 <span style="background:rgba(255,125,0,0.12);color:var(--warning);font-size:10px;padding:2px 6px;border-radius:3px;font-weight:500;">OCR预填·可修正</span> 橙色边框字段为OCR自动识别，点击可修正
        </div>
        <div class="form-group">
          <label class="form-label">姓名 * <span style="font-size:10px;color:var(--warning);">(OCR预填)</span></label>
          <input class="form-input ocr-editable" id="ocr-name" value="${ocrName}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">性别 * <span style="font-size:10px;color:var(--warning);">(OCR预填)</span></label>
            <select class="form-select" id="ocr-gender" style="border-color:var(--warning);background:rgba(255,125,0,0.04);">
              <option${ocrGender==='男'?' selected':''}>男</option><option${ocrGender==='女'?' selected':''}>女</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">出生日期 * <span style="font-size:10px;color:var(--warning);">(OCR预填)</span></label>
            <input class="form-input ocr-editable" id="ocr-birth" value="${ocrBirth}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">身份证号 * <span style="font-size:10px;color:var(--warning);">(OCR预填)</span></label>
          <input class="form-input ocr-editable" id="ocr-idcard" value="${ocrIdCard}">
        </div>
        <div class="form-group">
          <label class="form-label">户籍地址 <span style="font-size:10px;color:var(--warning);">(OCR预填)</span></label>
          <input class="form-input ocr-editable" id="ocr-addr" value="${ocrAddr}">
        </div>
        <div style="margin:14px 0;border-top:1px dashed var(--border);"></div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">以下请手工补充：</div>
        <div class="form-group">
          <label class="form-label">手机号 *</label>
          <input class="form-input" id="ocr-phone" placeholder="请输入手机号" value="">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">血型</label>
            <select class="form-select">
              <option value="">请选择</option>
              <option>A</option><option>B</option><option>AB</option><option>O</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">民族</label>
            <select class="form-select">
              <option>汉族</option><option>回族</option><option>满族</option><option>蒙古族</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">身高 (cm)</label>
            <input class="form-input" placeholder="cm" type="number">
          </div>
          <div class="form-group">
            <label class="form-label">体重 (kg)</label>
            <input class="form-input" placeholder="kg" type="number">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">签约医生 *</label>
          <select class="form-select">
            <option value="">请选择</option>
            <option>陈医生</option>
            <option>赵医生</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;margin-top:18px;margin-bottom:18px;">
          <button class="btn btn-outline" style="flex:1;" onclick="window.ocrStep=0;renderOcrCreate();">取消</button>
          <button class="btn btn-primary" style="flex:1;" onclick="submitOcrForm();">✅ 确认建档</button>
        </div>
      `;
    };

    console.log('[CameraIntegration] 4 hooks installed ✓');
  }

  // ============================================================
  // 三个真实拍照函数
  // ============================================================

  function realOcrIdCard() {
    Camera.open({
      title: '拍照识别身份证',
      hint: '请将身份证正面朝上，平铺对准取景框',
      accept: 'image/*',
      onCapture: function(base64Image) {
        // 显示过渡动画
        var container = document.getElementById('page-ocr-create');
        if (container) {
          container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
              <div style="font-size:48px;margin-bottom:16px;">🔍</div>
              <div style="font-size:14px;font-weight:600;margin-bottom:8px;">正在识别身份证…</div>
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:20px;">OCR 引擎解析中，请稍候</div>
              <div style="width:200px;height:4px;background:var(--bg-input);border-radius:2px;margin:0 auto;overflow:hidden;">
                <div style="width:80%;height:100%;background:var(--primary);border-radius:2px;animation:ocr-progress 1.5s ease-in-out;"></div>
              </div>
            </div>
          `;
        }

        OcrEngine.process(base64Image, 'idcard', { customer: getCurrentCustomer() }, function(err, result) {
          if (err) {
            console.error('[CameraIntegration] OCR failed:', err);
            var msg = err && err.message ? err.message : '识别失败';
            var container = document.getElementById('page-ocr-create');
            if (container) {
              container.innerHTML = `
                <div style="text-align:center;padding:30px 20px;">
                  <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                  <div style="font-size:14px;font-weight:600;color:var(--danger);margin-bottom:8px;">OCR 识别失败</div>
                  <div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px;line-height:1.6;padding:12px;background:var(--danger-bg);border-radius:6px;text-align:left;word-break:break-all;">${msg}</div>
                  <div style="display:flex;gap:8px;justify-content:center;">
                    <button class="btn btn-outline" onclick="renderOcrCreate();">↩ 重新拍照</button>
                    <button class="btn btn-primary" onclick="toggleBaiduOcrModal();">🔧 检查API配置</button>
                  </div>
                </div>
              `;
            }
            if (typeof showToast === 'function') showToast('⚠️ ' + msg);
            return;
          }
          // 走原有的结果渲染流程
          window.ocrStep = 1;
          window._ocrIdCardResult = result;  // 供 goToOcrForm 读取
          renderOcrResultFromReal(result);
        });
      },
      onCancel: function() {
        // 用户取消，什么都不做
      }
    });
  }

  function realOcrExamReport() {
    Camera.open({
      title: '拍照采集体检报告',
      hint: '请将体检报告单平铺，确保文字清晰可见',
      accept: 'image/*',
      onCapture: function(base64Image) {
        // 显示识别动画
        document.getElementById('page-add-exam').innerHTML = `
          <div class="edit-section" style="text-align:center;padding:40px 20px;">
            <div style="font-size:48px;margin-bottom:16px;">🔍</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;">正在识别体检报告…</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:20px;">OCR 引擎解析中，请稍候</div>
            <div style="width:200px;height:4px;background:var(--bg-input);border-radius:2px;margin:0 auto;overflow:hidden;">
              <div style="width:80%;height:100%;background:var(--primary);border-radius:2px;animation:ocr-progress 1.5s ease-in-out;"></div>
            </div>
          </div>
        `;

        var dept = document.getElementById('ae-dept') ? document.getElementById('ae-dept').value : '社区中心';
        var date = document.getElementById('ae-date') ? document.getElementById('ae-date').value : new Date().toISOString().slice(0,10);

        OcrEngine.process(base64Image, 'exam', { hospital: dept || '社区中心', date: date, dept: '体检报告' }, function(err, result) {
          if (err) {
            console.error('[CameraIntegration] OCR failed:', err);
            var msg = err && err.message ? err.message : '识别失败';
            var container = document.getElementById('page-add-exam');
            if (container) {
              container.innerHTML = `
                <div class="edit-section" style="text-align:center;padding:30px 20px;">
                  <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                  <div style="font-size:14px;font-weight:600;color:var(--danger);margin-bottom:8px;">OCR 识别失败</div>
                  <div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px;line-height:1.6;padding:12px;background:var(--danger-bg);border-radius:6px;text-align:left;word-break:break-all;">${msg}</div>
                  <div style="display:flex;gap:8px;justify-content:center;">
                    <button class="btn btn-outline" onclick="showExamCamera();">↩ 重新拍照</button>
                    <button class="btn btn-primary" onclick="toggleBaiduOcrModal();">🔧 检查API配置</button>
                  </div>
                </div>
              `;
            }
            if (typeof showToast === 'function') showToast('⚠️ ' + msg);
            return;
          }
          // 存到全局状态供原有的确认流程使用
          window.examOcrPhotoData = result.meta;
          window.examOcrPhotoData._photoBase64 = result.photoData;
          window._examOcrItems = JSON.parse(JSON.stringify(result.items));
          window._examOcrConclusion = result.conclusion;
          window.examOcrStep = 1;
          // 复用原有的结果渲染
          renderExamOcrResultFromReal(result);
        });
      },
      onCancel: function() {}
    });
  }

  function realOcrMedicalRecord() {
    Camera.open({
      title: '拍照采集外院病历/出院小结',
      hint: '请将就诊记录、出院小结平铺，确保文字清晰',
      accept: 'image/*',
      onCapture: function(base64Image) {
        // 显示识别动画
        document.getElementById('page-add-external').innerHTML = `
          <div class="edit-section" style="text-align:center;padding:40px 20px;">
            <div style="font-size:48px;margin-bottom:16px;">🔍</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:8px;">正在识别病历…</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:20px;">OCR 引擎解析中，请稍候</div>
            <div style="width:200px;height:4px;background:var(--bg-input);border-radius:2px;margin:0 auto;overflow:hidden;">
              <div style="width:80%;height:100%;background:var(--primary);border-radius:2px;animation:ocr-progress 1.5s ease-in-out;"></div>
            </div>
          </div>
        `;

        OcrEngine.process(base64Image, 'record', { resident: window.currentResident }, function(err, result) {
          if (err) {
            console.error('[CameraIntegration] OCR failed:', err);
            var msg = err && err.message ? err.message : '识别失败';
            var container = document.getElementById('page-add-external');
            if (container) {
              container.innerHTML = `
                <div class="edit-section" style="text-align:center;padding:30px 20px;">
                  <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                  <div style="font-size:14px;font-weight:600;color:var(--danger);margin-bottom:8px;">OCR 识别失败</div>
                  <div style="font-size:12px;color:var(--text-secondary);margin-bottom:20px;line-height:1.6;padding:12px;background:var(--danger-bg);border-radius:6px;text-align:left;word-break:break-all;">${msg}</div>
                  <div style="display:flex;gap:8px;justify-content:center;">
                    <button class="btn btn-outline" onclick="showExternalCamera();">↩ 重新拍照</button>
                    <button class="btn btn-primary" onclick="toggleBaiduOcrModal();">🔧 检查API配置</button>
                  </div>
                </div>
              `;
            }
            if (typeof showToast === 'function') showToast('⚠️ ' + msg);
            return;
          }
          window.externalOcrPhotoData = result.fields;
          window.externalOcrPhotoData._photoBase64 = result.photoData;
          window.externalOcrStep = 1;
          // 复用原有的结果渲染
          renderExternalOcrResultFromReal(result);
        });
      },
      onCancel: function() {}
    });
  }

  // ============================================================
  // 结果渲染函数（适配真实数据格式）
  // ============================================================

  function renderOcrResultFromReal(result) {
    var container = document.getElementById('page-ocr-create');
    if (!container) return;

    var f = result.fields;
    container.innerHTML = `
      <div class="ocr-result">
        <div class="ocr-header">✅ 识别成功 · 置信度 ${Math.round(result.confidence * 100)}%</div>
        <div class="ocr-img-preview">
          <img src="${result.photoData}" style="width:100%;height:100%;object-fit:contain;border-radius:4px;" alt="身份证照片">
        </div>

        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">OCR 识别到以下信息，点击"确认补全"后可修正：</div>

        <div class="info-grid" style="margin-bottom:12px;">
          <div class="info-field"><div class="label">姓名</div><div class="value" style="color:var(--success);">${f.name}</div></div>
          <div class="info-field"><div class="label">性别</div><div class="value" style="color:var(--success);">${f.gender}</div></div>
          <div class="info-field"><div class="label">身份证号</div><div class="value" style="color:var(--success);">${f.idCard}</div></div>
          <div class="info-field"><div class="label">出生日期</div><div class="value" style="color:var(--success);">${f.birthDate}</div></div>
        </div>
        <div class="info-field" style="margin-bottom:12px;">
          <div class="label">户籍地址</div>
          <div class="value" style="color:var(--success);">${f.address}</div>
        </div>

        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-sm" style="flex:1;" onclick="window.ocrStep=0;renderOcrCreate();">🔄 重新识别</button>
          <button class="btn btn-primary btn-sm" style="flex:1;" onclick="goToOcrForm();">✓ 确认，补充信息</button>
        </div>
      </div>
    `;
  }

  function renderExamOcrResultFromReal(result) {
    var items = result.items;
    var container = document.getElementById('page-add-exam');
    if (!container) return;

    container.innerHTML = `
      <div class="edit-section">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">✅ OCR识别完成，请核对并修正</div>

        <div class="ocr-photo-preview" onclick="showExamOcrPhotoPreview()">
          <img src="${result.photoData}" style="width:100%;max-height:140px;object-fit:contain;border-radius:4px;" alt="体检报告照片">
          <div class="ocr-photo-label">📷 点击查看原始照片</div>
        </div>

        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;">
          🟠 橙色边框字段为 OCR 自动识别，可点击编辑修改
        </div>

        <div id="examOcrItemsContainer">
          ${items.map(function(it, i) { return `
            <div class="exam-item-row">
              <input class="form-input auto-filled" value="${it.k}" placeholder="检查项目" onchange="updateExamOcrItem(${i},'k',this.value)">
              <input class="form-input auto-filled" value="${it.v}" placeholder="数值" onchange="updateExamOcrItem(${i},'v',this.value)">
              <input class="form-input auto-filled" value="${it.unit || ''}" placeholder="单位" style="max-width:60px;" onchange="updateExamOcrItem(${i},'unit',this.value)">
              <select class="form-select auto-filled" onchange="updateExamOcrItem(${i},'flag',this.value)">
                <option value="normal" ${it.flag==='normal'?'selected':''}>正常</option>
                <option value="high" ${it.flag==='high'?'selected':''}>偏高</option>
                <option value="abnormal" ${it.flag==='abnormal'?'selected':''}>异常</option>
              </select>
            </div>
          `; }).join('')}
        </div>

        <div class="form-group" style="margin-top:12px;">
          <label class="form-label">综合结论</label>
          <textarea class="form-input auto-filled" id="exam-ocr-conclusion" style="min-height:60px;resize:vertical;">${result.conclusion || ''}</textarea>
        </div>

        <div class="edit-actions">
          <button class="btn btn-outline" style="flex:1;" onclick="showExamCamera()">↩ 重新拍照</button>
          <button class="btn btn-primary" style="flex:1;" onclick="confirmExamOcr()">✅ 确认填入</button>
        </div>
      </div>
    `;
  }

  function renderExternalOcrResultFromReal(result) {
    var d = result.fields;
    var container = document.getElementById('page-add-external');
    if (!container) return;

    container.innerHTML = `
      <div class="edit-section">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">✅ OCR识别完成，请核对并修正</div>
        
        <div class="ocr-photo-preview" onclick="showPhotoPreview()">
          <img src="${result.photoData}" style="width:100%;max-height:140px;object-fit:contain;border-radius:4px;" alt="病历照片">
          <div class="ocr-photo-label">📷 点击查看原始照片</div>
        </div>

        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;">
          🟠 橙色边框字段为OCR自动识别，可点击编辑修改
        </div>

        <div class="form-group">
          <label class="form-label">医院名称 *</label>
          <input class="form-input auto-filled" id="ae-hospital" value="${d.hospital}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">就诊日期 *</label>
            <input class="form-input auto-filled" id="ae-date" type="date" value="${d.date}">
          </div>
          <div class="form-group">
            <label class="form-label">就诊类型 *</label>
            <select class="form-select auto-filled" id="ae-type">
              <option value="门诊"${d.recordType==='门诊'?' selected':''}>门诊</option>
              <option value="住院"${d.recordType==='住院'?' selected':''}>住院</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">就诊科室 *</label>
            <input class="form-input auto-filled" id="ae-dept" value="${d.dept}">
          </div>
          <div class="form-group">
            <label class="form-label">主治医生 *</label>
            <input class="form-input auto-filled" id="ae-doctor" value="${d.doctor}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">诊断结果 *</label>
          <input class="form-input auto-filled" id="ae-diagnosis" value="${d.diagnosis}">
        </div>
        <div class="form-group">
          <label class="form-label">就诊摘要</label>
          <textarea class="form-textarea auto-filled" id="ae-summary" style="height:80px;">${d.summary}</textarea>
        </div>
        <div class="edit-actions">
          <button class="btn btn-outline" style="flex:1;" onclick="showExternalCamera()">↩ 重新拍照</button>
          <button class="btn btn-primary" style="flex:1;" onclick="submitExternal()">💾 确认保存</button>
        </div>
      </div>
    `;
  }

  // ============================================================
  // 为了兼容 showExamOcrPhotoPreview 和 showPhotoPreview
  // 重新定义，使用真实的 base64 数据
  // ============================================================
  var _showExamOcrPhotoPreview = window.showExamOcrPhotoPreview;
  window.showExamOcrPhotoPreview = function() {
    var photoData = window.examOcrPhotoData;
    if (!photoData) return;

    var base64 = photoData._photoBase64;
    if (!base64) {
      _showExamOcrPhotoPreview();
      return;
    }

    var overlay = document.getElementById('photo-preview-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'photo-preview-overlay';
      overlay.className = 'photo-overlay';
      overlay.innerHTML = '<div class="photo-modal"><div class="photo-modal-header"><span>📷 原始照片</span><button class="photo-close-btn">✕</button></div><div class="photo-modal-body"><img class="real-photo" src="" alt="原始照片"></div><div class="photo-modal-footer"><span style="font-size:11px;color:var(--text-muted);">体检报告单原始照片</span><button class="btn btn-sm btn-outline">关闭</button></div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector('.photo-close-btn').onclick = function() { overlay.style.display = 'none'; };
      overlay.querySelector('.photo-modal-footer button').onclick = function() { overlay.style.display = 'none'; };
      overlay.onclick = function(e) { if (e.target === overlay) overlay.style.display = 'none'; };
    }
    overlay.querySelector('.real-photo').src = base64;
    overlay.style.display = 'flex';
  };

  var _showPhotoPreview = window.showPhotoPreview;
  window.showPhotoPreview = function() {
    var photoData = window.externalOcrPhotoData;
    if (!photoData) return;

    var base64 = photoData._photoBase64;
    if (!base64) {
      _showPhotoPreview();
      return;
    }

    var overlay = document.getElementById('photo-preview-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'photo-preview-overlay';
      overlay.className = 'photo-overlay';
      overlay.innerHTML = '<div class="photo-modal"><div class="photo-modal-header"><span>📷 原始照片</span><button class="photo-close-btn">✕</button></div><div class="photo-modal-body"><img class="real-photo" src="" alt="原始照片"></div><div class="photo-modal-footer"><span style="font-size:11px;color:var(--text-muted);">病历/出院小结原始照片</span><button class="btn btn-sm btn-outline">关闭</button></div></div>';
      document.body.appendChild(overlay);
      overlay.querySelector('.photo-close-btn').onclick = function() { overlay.style.display = 'none'; };
      overlay.querySelector('.photo-modal-footer button').onclick = function() { overlay.style.display = 'none'; };
      overlay.onclick = function(e) { if (e.target === overlay) overlay.style.display = 'none'; };
    }
    overlay.querySelector('.real-photo').src = base64;
    overlay.style.display = 'flex';
  };

  // ============================================================
  // 启动
  // ============================================================
  init();

  // ============================================================
  // OCR配置状态徽章（注入到OCR页面）
  // ============================================================
  function _injectOcrConfigBadge() {
    var container = document.getElementById('page-ocr-create');
    if (!container) return;

    // 避免重复注入
    if (container.querySelector('.ocr-config-badge')) return;

    var configured = (typeof OcrEngine !== 'undefined') ? OcrEngine.hasCredentials() : false;
    var proxyMode = (typeof OcrEngine !== 'undefined') ? OcrEngine.isProxyMode() : false;
    var effective = configured || proxyMode;  // 代理模式下服务端有Key，等同于已配置

    var badge = document.createElement('div');
    badge.className = 'ocr-config-badge';
    badge.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;margin-bottom:12px;background:' + (effective ? 'rgba(0,181,120,0.06)' : 'rgba(255,125,0,0.06)') + ';border:1px solid ' + (effective ? 'rgba(0,181,120,0.2)' : 'rgba(255,125,0,0.2)') + ';border-radius:8px;font-size:12px;';
    var statusText = configured ? '百度OCR 已配置' : (proxyMode ? '服务端已托管 API Key — 可直接使用' : '百度OCR 未配置 — 使用模拟数据');
    var statusIcon = effective ? '✅' : '⚠️';
    var btnText = configured ? '修改' : (proxyMode ? '说明' : '去配置');
    var btnColor = effective ? 'var(--success)' : 'var(--warning)';
    badge.innerHTML =
      '<span style="display:flex;align-items:center;gap:6px;">' +
        '<span>' + statusIcon + '</span>' +
        '<span style="color:var(--text-secondary);">' + statusText + '</span>' +
        (proxyMode ? '<span style="color:#5b8def;font-size:10px;padding:1px 5px;border:1px solid rgba(91,141,239,0.3);border-radius:3px;">云端代理</span>' : '') +
      '</span>' +
      '<button onclick="toggleBaiduOcrModal()" style="padding:4px 10px;border:1px solid ' + btnColor + ';border-radius:4px;background:transparent;color:' + btnColor + ';font-size:11px;cursor:pointer;">' + btnText + '</button>';

    // 插入到拍照区域前面
    var placeholder = container.querySelector('.ocr-photo-placeholder');
    if (placeholder) {
      placeholder.parentNode.insertBefore(badge, placeholder);
    }
  }

})();
