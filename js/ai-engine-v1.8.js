function isMedicalQuestion(text) {
  // 第一层：关键词匹配（扩充口语化表述）
  const medicalKeywords = [
    '血压', '高血压', '低血压', '糖尿病', '血糖', '糖化血红蛋白',
    '冠心病', '心梗', '心肌梗塞', '心绞痛', '支架',
    '药物', '用药', '服药', '剂量', '副作用', '禁忌',
    '体检', '检查', '化验', '指标', '异常',
    '过敏', '过敏史', '过敏原', '青霉素', '头孢',
    '随访', '慢病', '慢性病', '管理', '控制',
    '症状', '头痛', '头晕', '胸闷', '气短', '心悸',
    '饮食', '低盐', '运动', '生活方式',
    '疫苗', '接种', '预防',
    '手术', '住院', '门诊', '急诊',
    '中医', '针灸', '推拿', '理疗',
    '发烧', '发热', '咳嗽', '感冒', '流感',
    '腹泻', '便秘', '胃痛', '胃病',
    '肝', '肾', '肺', '心脏', '脑',
    '肿瘤', '癌症', '化疗', '放疗',
    '孕期', '产检', '产后', '婴儿', '儿童', '小孩', '宝宝', '孩子', '新生儿', '幼儿',
    '老人', '老年', '衰弱', '跌倒',
    '抑郁', '焦虑', '失眠', '睡眠',
    '肥胖', 'BMI', '体重', '减肥',
    '骨密度', '骨质疏松', '骨折',
    '视力', '眼', '近视', '白内障',
    '口腔', '牙齿', '牙周',
    '皮肤', '湿疹', '荨麻疹',
    '处方', '开药', '转诊', '复查',
    '硝苯地平', '氨氯地平', '缬沙坦', '二甲双胍', '阿司匹林', '他汀',
    '心电图', 'CT', 'MRI', 'B超', 'X光',
    '社区医院', '家庭医生', '签约', '公卫',
    '健康', '疾病', '医疗', '医学', '临床', '诊疗', '诊断',
    '护理', '康复', '保健', '养生',
    '氧气', '呼吸', '窒息', '哮喘',
    '血栓', '出血', '贫血',
    '甲亢', '甲减', '甲状腺',
    '前列腺', '男科', '妇科', '月经',
    '康复训练', '物理治疗',
    '药', '治', '病', '诊', '检', '医',
    'cr', 'mmol', 'mmHg', 'mg', 'g', 'IU',
    '收缩压', '舒张压', 'LDL', 'HDL', '胆固醇',
    '社区', '全科', '内科', '外科',
    // 口语化症状表述
    '喘', '喘不上气', '上气不接下气', '喘不过气', '气喘', '呼吸困难',
    '肿', '肿胀', '红肿', '浮肿',
    '痒', '瘙痒', '皮疹', '起疹子', '起红点', '起包', '起疙瘩',
    '吐', '呕吐', '恶心', '反胃', '干呕',
    '疼', '疼痛', '酸痛', '刺痛', '绞痛', '胀痛',
    '麻', '麻木', '发麻', '手脚麻',
    '抽', '抽搐', '抽筋', '痉挛', '抖',
    '晕', '眩晕', '天旋地转', '站不稳',
    '慌', '心慌', '心跳快', '心跳慢', '心律不齐',
    '憋', '憋闷', '憋气', '憋喘',
    '呛', '呛咳', '呛水', '呛奶',
    '堵', '鼻塞', '堵住', '堵塞',
    '咳', '干咳', '咳痰', '咳血', '咯血',
    '血', '出血', '便血', '尿血', '咯血', '瘀血', '淤血', '流血',
    '红', '发红', '充血', '潮红',
    '热', '高热', '低热', '潮热', '灼热', '灼烧',
    '冷', '畏寒', '寒战', '发冷',
    '汗', '出汗', '盗汗', '多汗', '冷汗',
    '吃', '吃了', '进食', '误食', '误服',
    '喝', '喝了', '误饮', '饮酒',
    '碰', '磕', '摔', '撞', '扭', '拉', '伤',
    '怎么办', '怎么处理', '怎么治', '怎么办', '急救', '处理', '处置', '抢救',
    '芒果', '海鲜', '花生', '坚果', '牛奶', '鸡蛋', '大豆', '小麦', // 常见过敏食物
    '蜂', '虫', '蛇', '蜈蚣', '咬', '蜇', // 动物致伤
    '中毒', '毒', '农药', '药物过量',
  ];
  const lower = text.toLowerCase();
  if (medicalKeywords.some(kw => lower.includes(kw))) return true;

  // 第二层：语义模式匹配（症状组合识别）
  const patterns = [
    // "吃了/喝了X + 症状" → 过敏/中毒
    { regex: /(吃了|喝了|误食|误服|进食).+(喘|肿|痒|吐|疼|红|疹|咳|呼吸困难|上气不接下气|喘不过气|喘不上气|过敏)/i, type: '过敏/中毒' },
    // "碰到/被咬 + 症状" → 外伤/过敏
    { regex: /(碰到|磕到|摔到|被咬|被蜇|扭到|撞到).+(肿|疼|红|出血|流血|痒)/i, type: '外伤/过敏' },
    // 数值 + 体征 → 体征异常
    { regex: /\d+.*(?:血压|血糖|心率|体温|呼吸)/i, type: '体征异常' },
    // "小孩/孩子/宝宝 + 症状" → 儿科
    { regex: /(小孩|孩子|宝宝|儿童|幼儿|婴儿|新生儿).+(喘|咳|吐|烧|热|抽|疼|肿|红|痒|哭|闹|不吃|不喝|呼吸困难)/i, type: '儿科' },
    // "老人 + 症状" → 老年
    { regex: /(老人|老年人|老爷子|老太太).+(晕|跌|摔|忘|呆|麻|喘|疼)/i, type: '老年' },
    // "怎么处理/怎么办 + 症状" → 急症处理
    { regex: /(?:怎么处理|怎么办|急救|应急).+(喘|出血|疼|晕|抽|烧|吐|过敏|中毒|窒息|呼吸困难)/i, type: '急症' },
  ];

  return patterns.some(p => p.regex.test(text));
}


// ========== 代理模式检测（与 ocr-engine.js 一致） ==========
var _aiIsProxyMode = (function() {
  try {
    var host = window.location.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1' ||
        host.startsWith('192.168.') || host.startsWith('10.') ||
        host.endsWith('.vercel.app') || host.endsWith('.netlify.app')) {
      console.log('[AiEngine] 代理模式 → API Key 由服务端注入 (host:' + host + ')');
      return true;
    }
  } catch(e) {}
  console.log('[AiEngine] 直连模式 → 使用本地 API Key');
  return false;
})();


// ========== DeepSeek API 配置与管理 ==========
function getApiKey() {
  // 代理模式下返回占位符，跳过本地 Key 检查
  if (_aiIsProxyMode) return '__PROXY_MODE__';
  return localStorage.getItem('deepseek_api_key') || '';
}

function toggleApiKeyModal() {
  const modal = document.getElementById('apiKeyModal');
  const input = document.getElementById('apiKeyInput');
  if (modal.style.display === 'none' || !modal.style.display) {
    input.value = getApiKey();
    modal.style.display = 'flex';
  } else {
    modal.style.display = 'none';
  }
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) { alert('请输入 API Key'); return; }
  localStorage.setItem('deepseek_api_key', key);
  toggleApiKeyModal();
  updateConfigStatus();
}

function updateConfigStatus() {
  var key = getApiKey();
  var dot = document.getElementById('configDot');
  var status = document.getElementById('configStatus');
  if (key) {
    dot.classList.add('configured');
    status.textContent = _aiIsProxyMode ? '云端代理' : '已连接';
  } else {
    dot.classList.remove('configured');
    status.textContent = '未配置';
  }
}

// ========== V1.4: 智能体配置管理 ==========

function buildRAGContext(question) {
  const contexts = [];
  const cfg = getAgentConfig();

  // ★ V1.8.1: 收集所有检索结果，统一保存到 _lastRagEntries（修复遗漏内置KB条目）
  const allRagEntries = [];

  // 1. 检索 WS/T 810-2022 知识库（类别A）— V1.4: 受配置开关和返回条数控制
  if (cfg.kbSettings.ws.enabled) {
    const wsResults = searchKnowledgeBase(question);
    if (wsResults.length > 0) {
      const top = wsResults.slice(0, cfg.kbSettings.ws.maxResults);
      let wsText = '【参考资料 - WS/T 810-2022 基层急诊转诊技术标准】\n';
      top.forEach(r => {
        wsText += `\n■ ${r.title} — ${r.subtitle}\n${r.content}\n`;
        if (r.actions && r.actions.length > 0) {
          wsText += `处理要点：${r.actions.join('；')}\n`;
        }
        wsText += `来源：${r.source}\n`;
      });
      contexts.push(wsText);

      // ★ V1.8.1: 将WS搜索结果也存入 _lastRagEntries
      const wsFlatEntries = typeof flattenWsKB === 'function' ? flattenWsKB() : [];
      top.forEach(r => {
        // 尝试从 flattenWsKB 中匹配对应条目以获取 entryId
        const matchedFlat = wsFlatEntries.find(fe => fe.source === r.source || fe.title === r.title);
        allRagEntries.push({
          kbId: 'ws',
          kbName: 'WS/T 810-2022 急诊转诊标准',
          kbType: 'rag_literature',
          entryId: matchedFlat ? matchedFlat.id : ('ws_src_' + r.source.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '').substring(0, 20)),
          title: r.title,
          source: r.source,
          pageRange: matchedFlat ? matchedFlat.pageRange : null
        });
      });
    }
  }

  // 2. 检索药品目录知识库（类别B）— V1.4: 受配置开关和返回条数控制
  if (cfg.kbSettings.drugs.enabled) {
    const drugResults = searchDrugKnowledgeBase(question);
    if (drugResults.length > 0) {
      const top = drugResults.slice(0, cfg.kbSettings.drugs.maxResults);
      let drugText = '【参考资料 - 本中心药品目录】\n';
      top.forEach(r => {
        drugText += `\n■ ${r.title} — ${r.subtitle}\n${r.content}\n`;
        if (r.actions && r.actions.length > 0) {
          drugText += `提醒：${r.actions.join('；')}\n`;
        }
      });
      contexts.push(drugText);

      // ★ V1.8.1: 将药品搜索结果也存入 _lastRagEntries（常识类，通常不标注出处，但保留供匹配）
      top.forEach(r => {
        allRagEntries.push({
          kbId: 'drugs',
          kbName: '药品目录',
          kbType: 'rag_common',
          entryId: r.id || ('drug_' + (r.title || '').replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '').substring(0, 20)),
          title: r.title,
          source: r.source || '',
          pageRange: null
        });
      });
    }
  }

  // 3. 检索自定义/新增知识库条目 — V1.5: localStorage overlay
  // ★ V1.6 fix: 区分文献类/常识类，标注KB名称和来源
  // ★ V1.8: 条目带 _entryId 和 _pageRange 供引用链接使用
  const customResults = searchCustomKB(question);
  // ★ V1.8.1: 将自定义结果追加到 allRagEntries（而非单独赋值）
  customResults.forEach(r => {
    allRagEntries.push({
      kbId: r._kbId,
      kbName: r._kbName || r._kbId,
      kbType: r._kbType,
      entryId: r.id,
      title: r.title,
      source: r.source,
      pageRange: r.pageRange
    });
  });

  // ★ V1.8.1: 统一保存所有检索结果
  window._lastRagEntries = allRagEntries;

  if (customResults.length > 0) {
    const top = customResults.slice(0, 5);
    // 按KB分组输出，方便AI理解来源
    const grouped = {};
    top.forEach(r => {
      const kbKey = r._kbName || r._kbId || '其他';
      if (!grouped[kbKey]) grouped[kbKey] = { kbType: r._kbType || 'rag_common', kbId: r._kbId, entries: [] };
      grouped[kbKey].entries.push(r);
    });

    for (const [kbName, group] of Object.entries(grouped)) {
      const typeLabel = group.kbType === 'rag_literature' ? '文献类（需标注出处）' : '常识类（不标注出处）';
      let customText = `【参考资料 - ${kbName}（${typeLabel}）】\n`;
      group.entries.forEach(r => {
        // ★ V1.8: 条目带ID标识，方便引用定位
        customText += `\n■ [ID:${r.id}] ${r.title}\n${r.content}\n`;
        if (r.actions && r.actions.length > 0) {
          customText += `处理要点：${r.actions.join('；')}\n`;
        }
        if (r.source) {
          customText += `来源：${r.source}\n`;
        }
        // ★ V1.8: 页码信息
        if (r.pageRange) {
          const pg = r.pageRange.start === r.pageRange.end ? `第${r.pageRange.start}页` : `第${r.pageRange.start}-${r.pageRange.end}页`;
          customText += `原文页码：${pg}\n`;
        }
      });
      contexts.push(customText);
    }
  }

  // ★ V1.7.2: RAG上下文末尾强制引用提醒（解决对话历史稀释引用规则的问题）
  const ragText = contexts.join('\n\n');
  if (ragText) {
    // 统计本次检索到了哪些类型的KB
    const hasLiterature = ragText.includes('文献类');
    const hasCommon = ragText.includes('常识类');
    const hasWs = ragText.includes('WS/T 810');
    let reminder = '\n\n⚠️ 引用提醒：本次回答必须基于以上参考资料。';
    if (hasLiterature || hasWs) {
      reminder += ' 来自文献类/WS知识库的内容，回答末尾必须标注 📚 来源：[来源名称]。';
    }
    if (hasCommon) {
      reminder += ' 来自常识类的内容，直接回答不需标注出处。';
    }
    return ragText + reminder;
  }
  return '';
}

// ========== 构建患者档案上下文（V1.4: 受配置勾选控制） ==========
function buildPatientContext() {
  const r = currentResident;
  if (!r) return '（当前未选择患者档案）';

  const cfg = getAgentConfig();
  const pc = cfg.patientContext;
  const tagLabels = (r.tags || []).map(t => tagLabel(t));

  // 基本信息始终包含姓名，但详细信息受配置控制
  let ctx = `当前患者：${r.name}，${r.gender}，${r.age}岁`;

  if (r.records) {
    if (pc.basic && r.records.basic) {
      const b = r.records.basic;
      ctx += `\n基本信息：${b.bloodType}型血，身高${b.height}cm，体重${b.weight}kg`;
    }
    if (pc.history && r.records.history && r.records.history.length > 0) {
      ctx += '\n既往病史：' + r.records.history.map(h => `${h.disease}（${h.diagnosed}诊断，${h.status === 'treating' ? '治疗中' : '稳定'}，${h.note}）`).join('；');
    }
    if (pc.allergy && r.records.allergy && r.records.allergy.length > 0) {
      ctx += '\n过敏史：' + r.records.allergy.join('、');
    }
    if (pc.exam && r.records.exams && r.records.exams.length > 0) {
      const latest = r.records.exams[0];
      ctx += `\n最近体检（${latest.date}）：${latest.conclusion}`;
      if (latest.items) {
        const abnormals = latest.items.filter(i => i.flag === 'abnormal' || i.flag === 'high');
        if (abnormals.length > 0) {
          ctx += ' 异常项：' + abnormals.map(i => `${i.k}${i.v}${i.unit}`).join('、');
        }
      }
    }
  }

  if (pc.tags && tagLabels.length > 0) {
    ctx += '\n慢病标签：' + tagLabels.join('、');
  }

  return ctx;
}

// ========== 调用 DeepSeek API（流式输出 + 可终止 + V1.4配置驱动） ==========
async function callDeepSeekAPI(question, ragContext, patientContext, history, onChunk, signal) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  // V1.4: 从配置读取参数
  const cfg = getAgentConfig();

  // 构建系统提示词：用户配置的提示词 + 动态上下文
  const basePrompt = cfg.systemPrompt || buildDefaultSystemPrompt();
  // ★ V1.6 fix: 优化未检索到时的表述，避免AI直接否认
  const systemPrompt = basePrompt + '\n\n' +
    (ragContext ? '【知识库参考资料】\n' + ragContext : '【知识库参考资料】本次检索未匹配到特定知识库条目，请基于你的医学知识回答，并在末尾注明：⚠️ 以上为通用建议，具体诊疗方案需由医生根据实际情况决定') +
    '\n\n' + (patientContext || '（当前未选择患者档案）');

  // 构建消息列表（系统提示 + 历史对话 + 当前问题）
  const messages = [{ role: 'system', content: systemPrompt }];

  // V1.4: 历史轮数由配置控制（每轮=用户+AI各一条，所以取 rounds*2 条）
  if (history && history.length > 0 && cfg.historyRounds > 0) {
    const maxHistoryItems = cfg.historyRounds * 2;
    const recentHistory = history.slice(-maxHistoryItems);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else if (msg.role === 'ai' && !msg.typewriter && !msg.streaming) {
        messages.push({ role: 'assistant', content: msg.text });
      }
    });
  }

  // 添加当前问题（如果历史中还没有包含）
  messages.push({ role: 'user', content: question });

  // 代理模式走同源 /api/deepseek/chat，直连模式走 DeepSeek 官方
  var apiUrl = _aiIsProxyMode
    ? window.location.origin + '/api/deepseek/chat'
    : 'https://api.deepseek.com/chat/completions';

  var headers = { 'Content-Type': 'application/json' };
  if (!_aiIsProxyMode) {
    headers['Authorization'] = 'Bearer ' + apiKey;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: cfg.temperature,
      max_tokens: cfg.maxTokens,
      stream: true
    }),
    signal: signal
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('API密钥无效，请检查配置');
    if (response.status === 429) throw new Error('API调用过于频繁，请稍后再试');
    throw new Error('API请求失败：' + (errData.error?.message || response.status));
  }

  // 读取 SSE 流
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // 保留不完整的最后一行

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') {
        return fullText;
      }
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          if (onChunk) onChunk(fullText);
        }
      } catch (e) {
        // 忽略解析错误的行
      }
    }
  }

  return fullText;
}


// ========== 生成AI回答（V1.3: RAG + DeepSeek API 流式输出） ==========
async function generateAiQaAnswer(question, onChunk, signal) {
  // 快速预过滤：明显非医学问题直接拦截（节省API调用）
  if (!isMedicalQuestion(question)) {
    const fallback = '抱歉，我是一个医学智能体，专注于医疗健康领域的问题。我无法回答非医学相关的内容。如果您有任何关于疾病、用药、体检、慢病管理等方面的疑问，欢迎随时向我提问。';
    if (onChunk) onChunk(fallback);
    return fallback;
  }

  // RAG: 检索知识库上下文
  const ragContext = buildRAGContext(question);
  const patientContext = buildPatientContext();
  const history = getCurrentAiQaMessages();

  // 调用 DeepSeek API（流式）
  return await callDeepSeekAPI(question, ragContext, patientContext, history, onChunk, signal);
}


// 发送消息（流式输出 + 可终止）
async function aiQaSend() {
  const input = document.getElementById('aiQaInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  // 检查API密钥（代理模式下跳过，Key 在服务端）
  if (!_aiIsProxyMode && !getApiKey()) {
    toggleApiKeyModal();
    return;
  }

  const msgs = getCurrentAiQaMessages();

  // 首次发送：切换到聊天界面
  if (!getCurrentAiQaChatStarted()) {
    setCurrentAiQaChatStarted(true);
    document.getElementById('aiQaWelcome').style.display = 'none';
    document.getElementById('aiQaChat').style.display = 'flex';
  }

  // 添加用户消息
  msgs.push({ role: 'user', text });
  setCurrentAiQaMessages(msgs);
  renderAiQaMessages();

  // 显示思考动画
  msgs.push({ role: 'thinking' });
  setCurrentAiQaMessages(msgs);
  renderAiQaMessages();

  // 切换按钮为停止状态
  const sendBtn = document.getElementById('aiQaSendBtn');
  const inputEl = document.getElementById('aiQaInput');
  inputEl.disabled = true;
  sendBtn.classList.add('stop');
  sendBtn.innerHTML = '<div class="stop-icon"></div>';
  sendBtn.onclick = stopAiGeneration;

  // 创建 AbortController 用于终止
  aiAbortController = new AbortController();

  try {
    let aiMsgIndex = -1;
    let firstChunk = true;

    const answer = await generateAiQaAnswer(text, (partialText) => {
      const currentMsgs = getCurrentAiQaMessages();

      if (firstChunk) {
        // 第一个chunk到达：移除思考动画，添加AI消息
        firstChunk = false;
        const thinkIdx = currentMsgs.findIndex(m => m.role === 'thinking');
        if (thinkIdx >= 0) currentMsgs.splice(thinkIdx, 1);
        currentMsgs.push({ role: 'ai', text: partialText, streaming: true });
        aiMsgIndex = currentMsgs.length - 1;
        setCurrentAiQaMessages(currentMsgs);
        renderAiQaMessages();
      } else if (aiMsgIndex >= 0) {
        // 后续chunk：直接更新bubble内容，避免全量重渲染
        currentMsgs[aiMsgIndex].text = partialText;
        setCurrentAiQaMessages(currentMsgs);
        const bubble = document.getElementById('aiBubble-' + aiMsgIndex);
        if (bubble) {
          bubble.innerHTML = partialText.replace(/\n/g, '<br>') + '<span class="ai-typing-cursor"></span>';
          const container = document.getElementById('aiQaMessages');
          container.scrollTop = container.scrollHeight;
        }
      }
    }, aiAbortController.signal);

    // 流式输出完成
    const finalMsgs = getCurrentAiQaMessages();
    if (aiMsgIndex >= 0) {
      finalMsgs[aiMsgIndex].streaming = false;
      finalMsgs[aiMsgIndex].typewriterDone = true;
      setCurrentAiQaMessages(finalMsgs);
      const bubble = document.getElementById('aiBubble-' + aiMsgIndex);
      if (bubble) {
        bubble.innerHTML = answer.replace(/\n/g, '<br>');
        // ★ V1.8: 流式完成后渲染引用链接
        renderCiteLinks();
      }
    }
  } catch (error) {
    const currentMsgs = getCurrentAiQaMessages();

    if (error.name === 'AbortError') {
      // 用户主动终止：保留已输出的部分内容
      const thinkIdx = currentMsgs.findIndex(m => m.role === 'thinking');
      if (thinkIdx >= 0) currentMsgs.splice(thinkIdx, 1);

      const streamIdx = currentMsgs.findIndex(m => m.role === 'ai' && m.streaming);
      if (streamIdx >= 0) {
        currentMsgs[streamIdx].streaming = false;
        currentMsgs[streamIdx].typewriterDone = true;
        if (currentMsgs[streamIdx].text) {
          currentMsgs[streamIdx].text += '\n\n⏹️ （已停止生成）';
        } else {
          currentMsgs[streamIdx].text = '⏹️ （已停止生成）';
        }
      }
      setCurrentAiQaMessages(currentMsgs);
      renderAiQaMessages();
    } else {
      // 其他错误
      const thinkIdx = currentMsgs.findIndex(m => m.role === 'thinking');
      if (thinkIdx >= 0) currentMsgs.splice(thinkIdx, 1);

      let errorMsg = '抱歉，回答生成失败。';
      if (error.message === 'NO_API_KEY') {
        errorMsg = '请先配置 DeepSeek API 密钥。点击下方"未配置"按钮进行设置。';
      } else if (error.message.includes('API密钥无效')) {
        errorMsg = 'API密钥无效，请点击"已连接/未配置"重新设置正确的密钥。';
      } else if (error.message.includes('频繁')) {
        errorMsg = 'API调用过于频繁，请稍后再试。';
      } else if (error.message.includes('Failed to fetch')) {
        errorMsg = '网络连接失败，请检查网络后重试。';
      } else {
        errorMsg = '抱歉，回答生成失败：' + error.message;
      }

      currentMsgs.push({ role: 'ai', text: '⚠️ ' + errorMsg, typewriterDone: true });
      setCurrentAiQaMessages(currentMsgs);
      renderAiQaMessages();
    }
  } finally {
    // 恢复按钮和输入框
    aiAbortController = null;
    inputEl.disabled = false;
    sendBtn.classList.remove('stop');
    sendBtn.innerHTML = '➤';
    sendBtn.onclick = aiQaSend;
    inputEl.focus();
  }
}

// 停止AI生成
function stopAiGeneration() {
  if (aiAbortController) {
    aiAbortController.abort();
  }
}

// 渲染消息列表
function renderAiQaMessages() {
  const container = document.getElementById('aiQaMessages');
  const msgs = getCurrentAiQaMessages();
  let html = '';

  msgs.forEach((msg, i) => {
    if (msg.role === 'user') {
      html += `<div class="ai-qa-msg ai-qa-msg-user"><div class="bubble">${msg.text}</div></div>`;
    } else if (msg.role === 'thinking') {
      html += `
        <div class="ai-qa-thinking">
          <div class="ai-avatar-sm">🩺</div>
          <div class="ai-qa-thinking-bubble">
            <div class="ai-qa-thinking-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
            <div class="ai-qa-thinking-label">AI 正在思考...</div>
          </div>
        </div>`;
    } else if (msg.role === 'ai') {
      let displayText = '';
      let cursor = '';
      if (msg.streaming) {
        displayText = (msg.text || '').replace(/\n/g, '<br>');
        cursor = '<span class="ai-typing-cursor"></span>';
      } else if (msg.typewriterDone) {
        displayText = msg.text.replace(/\n/g, '<br>');
      } else if (msg.typewriter) {
        cursor = '<span class="ai-typing-cursor"></span>';
      } else {
        displayText = msg.text.replace(/\n/g, '<br>');
      }
      html += `
        <div class="ai-qa-msg ai-qa-msg-ai">
          <div class="ai-avatar-sm">🩺</div>
          <div class="bubble" id="aiBubble-${i}">${displayText}${cursor}</div>
        </div>`;
    }
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;

  // ★ V1.8: 渲染完成后，将引用标记转换为可点击链接
  renderCiteLinks();
}

// ★ V1.8.1: 将AI回答中的 "📚 来源：XX" 转换为可点击引用链接
// 修复：(1) regex非贪婪+可选后缀导致sourceName只匹配1字符；(2) 来源名称精确匹配太严格
function renderCiteLinks() {
  const ragEntries = window._lastRagEntries || [];
  if (ragEntries.length === 0) return; // 无RAG条目时跳过

  document.querySelectorAll('.bubble').forEach(bubble => {
    const text = bubble.innerHTML;

    // ★ V1.8.1: 改进regex — 用贪婪匹配替代非贪婪，解决可选后缀导致的最小匹配问题
    // innerHTML 中 \n 已转为 <br>，所以 [^<\n] 中的 \n 排除无意义，[^<] 确保不跨HTML标签
    // 贪婪匹配会尽可能多地捕获source名称，然后回溯尝试可选页码后缀
    const citeRegex = /📚 来源：([^<]+)(?:（第(\d+)(?:-(\d+))?页）)?/g;
    let newText = text;
    let match;

    while ((match = citeRegex.exec(text)) !== null) {
      const sourceNameRaw = match[1].trim();
      // ★ V1.8.1: 去掉书名号《》包裹，规范化来源名称
      const sourceName = sourceNameRaw.replace(/《(.+)》/g, '$1').trim();
      const pageStart = match[2] ? parseInt(match[2]) : null;
      const pageEnd = match[3] ? parseInt(match[3]) : pageStart;

      // ★ V1.8.1: 使用灵活匹配替代精确匹配
      const matchingEntries = findMatchingRagEntry(ragEntries, sourceName);

      if (matchingEntries.length > 0) {
        const entry = matchingEntries[0];
        const pageLabel = entry.pageRange ? (entry.pageRange.start === entry.pageRange.end ? `第${entry.pageRange.start}页` : `第${entry.pageRange.start}-${entry.pageRange.end}页`) : (pageStart ? `第${pageStart}页` : '');
        const fullLabel = pageLabel ? `${sourceName}（${pageLabel}）` : sourceName;

        // ★ V1.8.1: escape entryId 中可能存在的特殊字符
        const safeKbId = entry.kbId.replace(/'/g, "\\'");
        const safeEntryId = entry.entryId.replace(/'/g, "\\'");
        const linkHtml = `<span class="cite-link" onclick="openSourceViewer('${safeKbId}','${safeEntryId}')">📚 来源：${fullLabel}</span>`;
        // 只替换第一个出现的该match（避免重复替换）
        const firstIdx = newText.indexOf(match[0]);
        if (firstIdx >= 0) {
          newText = newText.substring(0, firstIdx) + linkHtml + newText.substring(firstIdx + match[0].length);
        }
      }
    }

    if (newText !== text) {
      bubble.innerHTML = newText;
    }
  });
}

// ★ V1.8.1: 灵活匹配来源名称（模糊匹配，多级回退策略）
function findMatchingRagEntry(ragEntries, sourceName) {
  // 规范化函数：破折号—→连字符-，去除多余空格，统一小写
  const norm = s => (s || '').replace(/—/g, '-').replace(/\s+/g, '').toLowerCase();
  const normSN = norm(sourceName);

  // 第1级：精确匹配
  let matched = ragEntries.filter(e => e.source === sourceName || e.kbName === sourceName);
  if (matched.length > 0) return matched;

  // 第2级：规范化后精确匹配（处理 —/- 差异和空格差异）
  matched = ragEntries.filter(e => norm(e.source) === normSN || norm(e.kbName) === normSN);
  if (matched.length > 0) return matched;

  // 第3级：子串匹配（AI可能输出更长或更短的来源名称）
  matched = ragEntries.filter(e => {
    const ns = norm(e.source), nk = norm(e.kbName);
    // sourceName包含条目的source/kbName（AI输出更详细的名称）
    // 或条目的source/kbName包含sourceName（AI输出简短名称）
    return (ns && (normSN.includes(ns) || ns.includes(normSN))) ||
           (nk && (normSN.includes(nk) || nk.includes(normSN)));
  });
  if (matched.length > 0) return matched;

  // 第4级：核心标识匹配（如编号"810"、"2022"等关键数字）
  const coreNumbers = sourceName.match(/\d{3,4}/g);
  if (coreNumbers) {
    matched = ragEntries.filter(e => {
      const combined = norm(e.source + ' ' + e.kbName);
      return coreNumbers.some(num => combined.includes(num));
    });
  }

  return matched;
}

// 打字机效果
function startAiTypewriter(msgIndex, fullText) {
  if (aiQaTypingTimer) clearInterval(aiQaTypingTimer);

  const lines = fullText.split('\n');
  let lineIdx = 0;
  let charIdx = 0;
  let rendered = '';

  aiQaTypingTimer = setInterval(() => {
    if (lineIdx >= lines.length) {
      clearInterval(aiQaTypingTimer);
      aiQaTypingTimer = null;
      const msgs = getCurrentAiQaMessages();
      msgs[msgIndex].typewriterDone = true;
      setCurrentAiQaMessages(msgs);
      // 最终渲染（移除光标）
      const bubble = document.getElementById('aiBubble-' + msgIndex);
      if (bubble) {
        bubble.innerHTML = fullText.replace(/\n/g, '<br>');
      }
      const container = document.getElementById('aiQaMessages');
      container.scrollTop = container.scrollHeight;
      return;
    }

    const currentLine = lines[lineIdx];
    if (charIdx < currentLine.length) {
      rendered += currentLine[charIdx];
      charIdx++;
    } else {
      rendered += '<br>';
      lineIdx++;
      charIdx = 0;
    }

    const bubble = document.getElementById('aiBubble-' + msgIndex);
    if (bubble) {
      bubble.innerHTML = rendered + '<span class="ai-typing-cursor"></span>';
    }

    const container = document.getElementById('aiQaMessages');
    container.scrollTop = container.scrollHeight;
  }, 25);
}

// 切换患者时恢复AI问答对话状态
function restoreAiQaState() {
  const chatStarted = getCurrentAiQaChatStarted();
  const msgs = getCurrentAiQaMessages();
  const welcomeEl = document.getElementById('aiQaWelcome');
  const chatEl = document.getElementById('aiQaChat');

  if (chatStarted) {
    welcomeEl.style.display = 'none';
    chatEl.style.display = 'flex';
    renderAiQaMessages();
  } else {
    welcomeEl.style.display = 'flex';
    chatEl.style.display = 'none';
  }
}

