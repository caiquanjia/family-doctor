const DEFAULT_SYSTEM_PROMPT = `你是一名社区医院家庭医生助手，专注于医疗健康领域。你的职责是：
1. 回答医学相关问题，包括疾病诊疗、用药咨询、慢病管理、急诊转诊、健康管理等
2. 如果用户问的是非医学问题，礼貌说明你只能回答医学相关内容

${'${ragContext}'}

${'${patientContext}'}

回答规则：
- 如果回答内容来自 WS/T 810-2022 参考资料，在回答末尾标注：📚 来源：WS/T 810—2022《基层急诊转诊技术标准》
- 药品目录信息不需要标注来源，直接回答即可
- 回答要专业、简洁、实用，适合社区医生快速阅读
- 如果参考资料中没有相关内容，基于你的医学知识回答，但在末尾注明：⚠️ 以上为通用建议，具体诊疗方案需由医生根据实际情况决定
- 可以使用适当的格式（编号列表、加粗等）让回答更清晰
- 回答中不要使用 markdown 代码块格式`;

const DEFAULT_AGENT_CONFIG = {
  systemPrompt: '',
  temperature: 0.3,
  maxTokens: 1500,
  historyRounds: 5,
  kbSettings: {
    ws: { enabled: true, maxResults: 3 },
    drugs: { enabled: true, maxResults: 3 }
  },
  patientContext: {
    basic: true,
    history: true,
    allergy: true,
    exam: true,
    tags: true
  },
  presetMode: 'balanced'
};

const PRESET_MODES = {
  strict: { name: '严谨模式', desc: 'temp 0.1 · 回答精简 · 仅KB', temperature: 0.1, maxTokens: 800, systemPrompt: '你是一名社区医院家庭医生助手。只基于提供的知识库内容回答，不扩展。回答控制在200字以内，直接给结论。如果知识库没有相关内容，明确告知"知识库中暂无相关信息"。' },
  balanced: { name: '平衡模式', desc: 'temp 0.3 · 标准长度 · KB+通用', temperature: 0.3, maxTokens: 1500, systemPrompt: '' },
  detailed: { name: '详细模式', desc: 'temp 0.5 · 深度分析 · 多轮展开', temperature: 0.5, maxTokens: 3000, systemPrompt: '你是一名社区医院家庭医生助手。回答要详尽全面，包括病理机制、鉴别诊断、处理方案、随访建议等。可以适当展开分析，但必须基于知识库或权威医学指南。' }
};

function getAgentConfig() {
  const stored = localStorage.getItem('agent_config');
  if (stored) {
    try {
      const cfg = JSON.parse(stored);
      // 合并默认值，防止字段缺失
      return {
        ...DEFAULT_AGENT_CONFIG,
        ...cfg,
        kbSettings: { ...DEFAULT_AGENT_CONFIG.kbSettings, ...(cfg.kbSettings || {}) },
        patientContext: { ...DEFAULT_AGENT_CONFIG.patientContext, ...(cfg.patientContext || {}) }
      };
    } catch(e) {}
  }
  // 首次使用，用默认系统提示词
  const cfg = { ...DEFAULT_AGENT_CONFIG };
  cfg.systemPrompt = buildDefaultSystemPrompt();
  return cfg;
}

function buildDefaultSystemPrompt() {
  return `你是一名社区医院家庭医生助手，专注于医疗健康领域。你的职责是：
1. 回答医学相关问题，包括疾病诊疗、用药咨询、慢病管理、急诊转诊、健康管理等
2. 如果用户问的是非医学问题，礼貌说明你只能回答医学相关内容

以下是从知识库中检索到的参考资料，请优先基于这些内容回答：
（由系统自动注入）

当前患者档案信息：
（由系统自动注入）

回答规则：
- 如果回答内容来自 WS/T 810-2022 参考资料，在回答末尾标注：📚 来源：WS/T 810—2022《基层急诊转诊技术标准》
- 如果回答内容来自自定义文献类知识库（参考资料中标注了"来源"字段的），在回答末尾标注：📚 来源：[该条目的source字段内容]
- 药品目录信息和常识类知识库不需要标注来源，直接回答即可
- 如果参考资料中包含与用户问题相关的内容，必须基于这些资料回答，不要声称"未检索到"或"没有相关指南"
- 如果用户明确指出要引用某个指南/知识库，优先从该指南的相关资料中提取答案
- 如果用户质问"为什么没有引用/RAG/来源/参考"、"引用在哪里"等，说明用户在要求你标注来源，请回答："我会在后续回答中基于检索到的知识库内容给出引用标注。"，而不是去知识库里查找"RAG"等词
- 回答要专业、简洁、实用，适合社区医生快速阅读
- 如果参考资料中确实没有与问题相关的内容，基于你的医学知识回答，但在末尾注明：⚠️ 以上为通用建议，具体诊疗方案需由医生根据实际情况决定
- 可以使用适当的格式（编号列表、加粗等）让回答更清晰
- 回答中不要使用 markdown 代码块格式`;
}

function saveAgentConfig(config) {
  localStorage.setItem('agent_config', JSON.stringify(config));
}

function showToast(msg) {
  let toast = document.getElementById('agentToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'agentToast';
    toast.className = 'agent-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// 面板开关
function openAgentPanel() {
  document.getElementById('agentPanel').style.display = 'flex';
  document.querySelector('.contact-list').style.display = 'none';
  document.querySelector('.chat-area').style.display = 'none';
  document.querySelector('.right-sidebar').style.display = 'none';
  document.getElementById('workbarAgent').classList.add('agent-active');
  // V1.5: 关闭知识库面板
  const kp = document.getElementById('kbPanel');
  if (kp && kp.style.display !== 'none') closeKbPanel();
  renderAgentPanel();
}

function closeAgentPanel() {
  document.getElementById('agentPanel').style.display = 'none';
  document.querySelector('.contact-list').style.display = '';
  document.querySelector('.chat-area').style.display = '';
  document.querySelector('.right-sidebar').style.display = '';
  document.getElementById('workbarAgent').classList.remove('agent-active');
}

// 渲染面板
function renderAgentPanel() {
  const cfg = getAgentConfig();
  const apiKey = getApiKey();
  const body = document.getElementById('agentPanelBody');

  body.innerHTML = `
    <!-- 模型状态 -->
    <div class="agent-section">
      <div class="agent-section-header" style="background:#f0faf5;">
        <span class="dot" style="background:#1d9e75;"></span>
        模型状态
      </div>
      <div class="agent-section-body">
        <div class="agent-status-bar">
          <div class="agent-status-info">
            <div class="agent-status-dot ${apiKey ? 'online' : 'offline'}"></div>
            <div>
              <div class="agent-status-text">DeepSeek Chat ${apiKey ? '· 已连接' : '· 未配置'}</div>
              <div class="agent-status-sub">模型: deepseek-chat · 流式输出</div>
            </div>
          </div>
          <button class="agent-btn ${apiKey ? 'agent-btn-secondary' : 'agent-btn-primary'}" onclick="toggleApiKeyModal()">${apiKey ? '修改密钥' : '配置密钥'}</button>
        </div>
      </div>
    </div>

    <!-- 系统提示词 -->
    <div class="agent-section">
      <div class="agent-section-header" style="background:#f0f6fc;">
        <span class="dot" style="background:#378add;"></span>
        系统提示词（人设与规则）
      </div>
      <div class="agent-section-body">
        <textarea class="agent-prompt-textarea" id="cfgSystemPrompt" placeholder="编辑系统提示词...">${cfg.systemPrompt || buildDefaultSystemPrompt()}</textarea>
        <div class="agent-prompt-actions">
          <button class="agent-btn agent-btn-secondary" onclick="resetSystemPrompt()">恢复默认</button>
          <button class="agent-btn agent-btn-primary" onclick="saveSystemPrompt()">保存</button>
        </div>
      </div>
    </div>

    <!-- 模型参数 -->
    <div class="agent-section">
      <div class="agent-section-header" style="background:#fdf8ed;">
        <span class="dot" style="background:#ef9f27;"></span>
        模型参数
      </div>
      <div class="agent-section-body">
        <div class="agent-param-row">
          <span class="agent-param-label">Temperature</span>
          <div class="agent-slider-wrap">
            <input type="range" class="agent-slider" id="cfgTemperature" min="0" max="1" step="0.1" value="${cfg.temperature}" oninput="updateTemperature(this.value)">
            <span class="agent-slider-value" id="cfgTemperatureValue">${cfg.temperature.toFixed(1)}</span>
          </div>
        </div>
        <div style="font-size:11px;color:#aaa;display:flex;justify-content:space-between;padding:0 96px 12px;">
          <span>← 严谨保守</span><span>平衡</span><span>灵活创意 →</span>
        </div>
        <div class="agent-param-row">
          <span class="agent-param-label">最大长度</span>
          <div style="flex:1;"></div>
          <input type="number" class="agent-input-num" id="cfgMaxTokens" value="${cfg.maxTokens}" min="100" max="8000" step="100" onchange="updateMaxTokens(this.value)">
          <span style="font-size:12px;color:#999;margin-left:6px;">tokens</span>
        </div>
        <div class="agent-param-row">
          <span class="agent-param-label">历史轮数</span>
          <div style="flex:1;"></div>
          <input type="number" class="agent-input-num" id="cfgHistoryRounds" value="${cfg.historyRounds}" min="0" max="20" step="1" onchange="updateHistoryRounds(this.value)">
          <span style="font-size:12px;color:#999;margin-left:6px;">轮（0=不传历史）</span>
        </div>
      </div>
    </div>

    <!-- 知识库管理 -->
    <div class="agent-section">
      <div class="agent-section-header" style="background:#f6f5fe;">
        <span class="dot" style="background:#7f77dd;"></span>
        知识库管理
      </div>
      <div class="agent-section-body">
        <div class="agent-kb-item">
          <div class="agent-kb-info">
            <div class="agent-kb-checkbox ${cfg.kbSettings.ws.enabled ? 'checked' : ''}" onclick="toggleKB('ws')"></div>
            <div>
              <div class="agent-kb-name">WS/T 810-2022 急诊转诊标准 <span class="agent-kb-tag a">A类</span></div>
              <div class="agent-kb-meta">8附录 + MEWS评分 + 转诊分级 · 标注出处</div>
            </div>
          </div>
          <div class="agent-kb-result">
            返回
            <input type="number" class="agent-input-num" style="width:50px;height:28px;" value="${cfg.kbSettings.ws.maxResults}" min="1" max="10" onchange="updateKBResult('ws', this.value)">
            条
          </div>
        </div>
        <div class="agent-kb-item">
          <div class="agent-kb-info">
            <div class="agent-kb-checkbox ${cfg.kbSettings.drugs.enabled ? 'checked' : ''}" onclick="toggleKB('drugs')"></div>
            <div>
              <div class="agent-kb-name">药品目录 <span class="agent-kb-tag b">B类</span></div>
              <div class="agent-kb-meta">705种（409西药+296中成药）· 不标注出处</div>
            </div>
          </div>
          <div class="agent-kb-result">
            返回
            <input type="number" class="agent-input-num" style="width:50px;height:28px;" value="${cfg.kbSettings.drugs.maxResults}" min="1" max="10" onchange="updateKBResult('drugs', this.value)">
            条
          </div>
        </div>
      </div>
    </div>

    <!-- 患者档案注入 -->
    <div class="agent-section">
      <div class="agent-section-header" style="background:#f0faf5;">
        <span class="dot" style="background:#1d9e75;"></span>
        患者档案注入
      </div>
      <div class="agent-section-body">
        <div class="agent-ctx-grid">
          ${['basic','history','allergy','exam','tags'].map(key => {
            const labels = { basic:'基本信息', history:'既往病史', allergy:'过敏史', exam:'体检结果', tags:'慢病标签' };
            return `<div class="agent-ctx-item ${cfg.patientContext[key] ? 'active' : ''}" onclick="togglePatientCtx('${key}')">
              <div class="agent-ctx-checkbox"></div>
              <span class="agent-ctx-label">${labels[key]}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- 预设方案 -->
    <div class="agent-section">
      <div class="agent-section-header" style="background:#fdf3f0;">
        <span class="dot" style="background:#d85a30;"></span>
        预设方案
      </div>
      <div class="agent-section-body">
        <div class="agent-preset-row">
          ${Object.entries(PRESET_MODES).map(([key, mode]) => `
            <div class="agent-preset-btn ${cfg.presetMode === key ? 'active' : ''}" onclick="applyPreset('${key}')">
              <div class="agent-preset-name">${mode.name}</div>
              <div class="agent-preset-desc">${mode.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 对话管理 -->
    <div class="agent-section">
      <div class="agent-section-header" style="background:#f5f5f5;">
        <span class="dot" style="background:#888;"></span>
        对话管理
      </div>
      <div class="agent-section-body">
        <div class="agent-conv-row">
          <button class="agent-btn agent-btn-secondary" style="flex:1;" onclick="clearCurrentPatientChat()">清空当前患者对话</button>
          <button class="agent-btn agent-btn-danger" style="flex:1;" onclick="clearAllChats()">清空全部对话</button>
        </div>
      </div>
    </div>
  `;
}

// 配置操作函数
function saveSystemPrompt() {
  const cfg = getAgentConfig();
  cfg.systemPrompt = document.getElementById('cfgSystemPrompt').value;
  cfg.presetMode = 'custom';
  saveAgentConfig(cfg);
  showToast('系统提示词已保存');
}

function resetSystemPrompt() {
  if (!confirm('确定恢复默认系统提示词？当前编辑的内容将丢失。')) return;
  const cfg = getAgentConfig();
  cfg.systemPrompt = buildDefaultSystemPrompt();
  cfg.presetMode = 'balanced';
  saveAgentConfig(cfg);
  document.getElementById('cfgSystemPrompt').value = cfg.systemPrompt;
  showToast('已恢复默认');
}

function updateTemperature(val) {
  document.getElementById('cfgTemperatureValue').textContent = parseFloat(val).toFixed(1);
  const cfg = getAgentConfig();
  cfg.temperature = parseFloat(val);
  cfg.presetMode = 'custom';
  saveAgentConfig(cfg);
}

function updateMaxTokens(val) {
  const cfg = getAgentConfig();
  cfg.maxTokens = parseInt(val) || 1500;
  cfg.presetMode = 'custom';
  saveAgentConfig(cfg);
}

function updateHistoryRounds(val) {
  const cfg = getAgentConfig();
  cfg.historyRounds = parseInt(val) || 0;
  cfg.presetMode = 'custom';
  saveAgentConfig(cfg);
}

function toggleKB(kbName) {
  const cfg = getAgentConfig();
  cfg.kbSettings[kbName].enabled = !cfg.kbSettings[kbName].enabled;
  saveAgentConfig(cfg);
  renderAgentPanel();
  showToast(cfg.kbSettings[kbName].enabled ? '知识库已启用' : '知识库已关闭');
}

function updateKBResult(kbName, val) {
  const cfg = getAgentConfig();
  cfg.kbSettings[kbName].maxResults = parseInt(val) || 3;
  saveAgentConfig(cfg);
}

function togglePatientCtx(key) {
  const cfg = getAgentConfig();
  cfg.patientContext[key] = !cfg.patientContext[key];
  saveAgentConfig(cfg);
  renderAgentPanel();
}

function applyPreset(modeKey) {
  const mode = PRESET_MODES[modeKey];
  const cfg = getAgentConfig();
  cfg.temperature = mode.temperature;
  cfg.maxTokens = mode.maxTokens;
  cfg.presetMode = modeKey;
  if (mode.systemPrompt) {
    cfg.systemPrompt = mode.systemPrompt + '\n\n' + buildDefaultSystemPrompt();
  } else {
    cfg.systemPrompt = buildDefaultSystemPrompt();
  }
  saveAgentConfig(cfg);
  renderAgentPanel();
  showToast('已切换到' + mode.name);
}

function clearCurrentPatientChat() {
  if (!currentCustomerId) { showToast('未选择患者'); return; }
  if (!confirm('确定清空当前患者的AI对话历史？')) return;
  aiQaMessagesMap.delete(currentCustomerId);
  aiQaChatStartedMap.delete(currentCustomerId);
  saveAiQaMessages();
  if (document.getElementById('aiQaChat')) {
    document.getElementById('aiQaChat').style.display = 'none';
  }
  if (document.getElementById('aiQaWelcome')) {
    document.getElementById('aiQaWelcome').style.display = '';
  }
  showToast('当前患者对话已清空');
}

function clearAllChats() {
  if (!confirm('确定清空所有患者的AI对话历史？此操作不可撤销。')) return;
  aiQaMessagesMap.clear();
  aiQaChatStartedMap.clear();
  saveAiQaMessages();
  if (document.getElementById('aiQaChat')) {
    document.getElementById('aiQaChat').style.display = 'none';
  }
  if (document.getElementById('aiQaWelcome')) {
    document.getElementById('aiQaWelcome').style.display = '';
  }
  showToast('全部对话已清空');
}

