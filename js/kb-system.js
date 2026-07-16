function getKbOverlay() {
  const stored = localStorage.getItem('kb_overlay');
  if (stored) {
    try {
      const o = JSON.parse(stored);
      if (!o.customKbs) o.customKbs = [];
      if (!o.edits) o.edits = {};
      if (!o.edits.ws) o.edits.ws = { added: [], modified: {}, deleted: [] };
      if (!o.edits.drugs) o.edits.drugs = { added: [], modified: {}, deleted: [] };
      return o;
    } catch(e) {}
  }
  return { customKbs: [], edits: { ws: { added: [], modified: {}, deleted: [] }, drugs: { added: [], modified: {}, deleted: [] } } };
}

function saveKbOverlay(overlay) {
  localStorage.setItem('kb_overlay', JSON.stringify(overlay));
}

// --- 扁平化内置KB条目（用于面板展示） ---
function flattenWsKB() {
  const entries = [];
  // 附录 A-H
  for (const [key, appendix] of Object.entries(wsKnowledgeBase.appendices)) {
    appendix.sections.forEach((section, idx) => {
      entries.push({
        id: `ws_appendix_${key}_${idx}`,
        title: `附录${key}：${section.subtitle}`,
        keywords: appendix.keywords,
        content: section.content,
        actions: section.actions || [],
        source: `WS/T 810\u20142022 附录${key}`,
        builtIn: true
      });
    });
  }
  // 病情分层
  for (const [level, data] of Object.entries(wsKnowledgeBase.severityLevels)) {
    const criteriaText = data.criteria.map(c => typeof c === 'string' ? c : `[${c.category}] ${c.item}`).join('\n');
    entries.push({
      id: `ws_severity_${level}`,
      title: `${data.label}患者判定标准`,
      keywords: [data.label, '分层', '严重程度', '病情判断', '生命体征'],
      content: `${data.label}：${data.definition}\n\n判定标准：\n${criteriaText}`,
      actions: ['确定转诊级别'],
      source: 'WS/T 810\u20142022 第5.1.2条',
      builtIn: true
    });
  }
  // MEWS评分
  entries.push({
    id: 'ws_mews',
    title: 'MEWS评分（改良早期预警评分）',
    keywords: ['MEWS', '评分', '生命体征', '预警'],
    content: 'MEWS评分适用于成人，基于5项生命体征指标评分：心率、收缩压、呼吸频率、体温、意识。\n\n分层标准：MEWS>=9极高危，5<=MEWS<9高危，MEWS<5平诊。',
    actions: ['计算MEWS评分', '对照分层标准'],
    source: 'WS/T 810\u20142022 第5.1.3条',
    builtIn: true
  });
  // 转诊分级
  entries.push({
    id: 'ws_referral',
    title: '患者转诊需求分级',
    keywords: ['转诊', '转院', '急救车', '转诊级别', '上级医院'],
    content: wsKnowledgeBase.referralLevels.map(r => `${r.level}级：${r.label}\n  适用：${r.severity}\n  处理：${r.action}`).join('\n\n'),
    actions: ['确定转诊级别', '联系上级医院'],
    source: 'WS/T 810\u20142022 第6条',
    builtIn: true
  });
  return entries;
}

function flattenDrugsKB() {
  return (drugKnowledgeBase.entries || []).map(e => ({
    id: e.id,
    title: e.title,
    keywords: e.keywords || [],
    content: e.content,
    actions: e.actions || [],
    source: '',
    builtIn: true
  }));
}

// --- 合并内置+overlay，返回最终条目列表 ---
function getMergedEntries(kbId) {
  const overlay = getKbOverlay();

  // 内置KB：只返回用户新增的条目，不展开内部结构
  if (kbId === 'ws') {
    return (overlay.edits.ws.added || []).map(e => ({ ...e, builtIn: false }));
  }
  if (kbId === 'drugs') {
    return (overlay.edits.drugs.added || []).map(e => ({ ...e, builtIn: false }));
  }
  if (kbId === 'drug_lookup') {
    return []; // 只读，无用户条目
  }

  // 自定义KB：返回全部条目
  const kb = overlay.customKbs.find(k => k.id === kbId);
  return kb ? (kb.entries || []).map(e => ({ ...e, builtIn: false })) : [];
}

// --- 内置KB概要信息 ---
function getKbSummary(kbId) {
  if (kbId === 'ws') {
    const appxKeys = Object.keys(wsKnowledgeBase.appendices || {});
    const appxTitles = appxKeys.map(k => k);
    const totalSearchable = flattenWsKB().length;
    return {
      source: 'WS/T 810\u20142022\u300a基层医疗卫生机构急重患者判断及转诊技术标准\u300b',
      issuedBy: '国家卫生健康委员会 \u00B7 2023-03-01 实施',
      coverage: [
        { label: '病情严重程度分层', detail: '极高危 / 高危 / 平诊（3级）' },
        { label: 'MEWS评分', detail: '5项生命体征综合评分（成人）' },
        { label: '转诊需求分级', detail: '4级：立即急救车转诊 \u2192 择期转诊' },
        { label: '附录现场处理方案', detail: '附录' + appxTitles.join('、') + '（' + appxKeys.length + '个）' }
      ],
      totalSearchable: totalSearchable,
      note: 'AI 检索时自动从以上内容中匹配，无需手动管理'
    };
  }
  if (kbId === 'drugs') {
    const entryCount = (drugKnowledgeBase.entries || []).length;
    const lookupCount = Object.keys(drugKnowledgeBase.drugLookup || {}).length;
    return {
      source: '雁栖镇社区卫生服务中心 2025 年基本药品目录',
      coverage: [
        { label: '药品总数', detail: '705 种（409 西药 + 296 中成药）' },
        { label: '分组条目', detail: '高血压 / 糖尿病 / 冠心病 / 急救过敏 / 抗生素（' + entryCount + ' 组）' },
        { label: '快速查找键', detail: lookupCount + ' 个药名（支持药名+商品名搜索）' }
      ],
      totalSearchable: entryCount,
      note: 'AI 检索时自动从分组条目和查找键中匹配'
    };
  }
  if (kbId === 'drug_lookup') {
    const lookupCount = Object.keys(drugKnowledgeBase.drugLookup || {}).length;
    return {
      source: '药品名称快速查找表',
      coverage: [
        { label: '查找键数', detail: lookupCount + ' 个（药名 \u2192 规格/价格/单位/管控级别）' },
        { label: '查询方式', detail: '精确匹配药名或商品名，返回药品详细信息' }
      ],
      totalSearchable: lookupCount,
      note: '结构化数据，用户查询时直接匹配返回，不注入 AI 上下文',
      readOnly: true
    };
  }
  return null;
}

// --- 获取所有KB列表 ---
function getAllKBs() {
  const overlay = getKbOverlay();
  const kbs = [
    { id: 'ws', name: 'WS/T 810-2022 急诊转诊标准', kbType: 'rag_literature', icon: '\u{1F4DC}', desc: '8附录 + MEWS评分 + 转诊分级 \u00B7 标注出处', builtIn: true },
    { id: 'drugs', name: '药品目录', kbType: 'rag_common', icon: '\u{1F48A}', desc: '705种（409西药+296中成药）\u00B7 不标注出处', builtIn: true },
    { id: 'drug_lookup', name: '药品名称查找表', kbType: 'structured', icon: '\u{1F4CA}', desc: '939个药名 \u00B7 精确查询（规格/价格/单位）', builtIn: true, readOnly: true }
  ];
  overlay.customKbs.forEach(kb => {
    const kt = kb.kbType || (kb.category === 'A' ? 'rag_literature' : 'rag_common');
    const typeDesc = kt === 'rag_literature' ? 'RAG文献类 \u00B7 标注出处' : (kt === 'rag_common' ? 'RAG常识类 \u00B7 不标注出处' : '结构化数据 \u00B7 精确查询');
    kbs.push({ id: kb.id, name: kb.name, kbType: kt, icon: '\u{1F4C1}', desc: `${(kb.entries||[]).length}条 \u00B7 ${typeDesc}`, builtIn: false });
  });
  return kbs;
}

// --- 面板开关 ---
function openKbPanel() {
  document.getElementById('kbPanel').style.display = 'flex';
  document.querySelector('.contact-list').style.display = 'none';
  document.querySelector('.chat-area').style.display = 'none';
  document.querySelector('.right-sidebar').style.display = 'none';
  document.getElementById('workbarKb').classList.add('kb-active');
  // 关闭智能体面板
  const ap = document.getElementById('agentPanel');
  if (ap && ap.style.display !== 'none') closeAgentPanel();
  renderKbPanel();
}

function closeKbPanel() {
  document.getElementById('kbPanel').style.display = 'none';
  document.querySelector('.contact-list').style.display = '';
  document.querySelector('.chat-area').style.display = '';
  document.querySelector('.right-sidebar').style.display = '';
  document.getElementById('workbarKb').classList.remove('kb-active');
}

// --- 渲染面板 ---
let kbExpandedState = {}; // 记录展开状态
let kbSearchState = {}; // 记录搜索词

function renderKbPanel() {
  const kbs = getAllKBs();
  const body = document.getElementById('kbPanelBody');
  let html = '';

  // 新建KB按钮 + 上传文件按钮
  html += `<div style="display:flex;gap:8px;margin-bottom:12px;">
    <div class="kb-new-card" onclick="openNewKbModal()" style="flex:1;">
      <div style="font-size:24px;margin-bottom:4px;">+</div>
      <div class="kb-new-card-text">新建知识库</div>
    </div>
    <div class="kb-new-card" onclick="startFileUpload()" style="flex:1;border-color:#5b86e5;">
      <div style="font-size:24px;margin-bottom:4px;">⬆</div>
      <div class="kb-new-card-text" style="color:#5b86e5;">上传文件</div>
    </div>
  </div>`;

  // 渲染单个KB卡片的辅助函数
  function renderKbCard(kb) {
    const entries = getMergedEntries(kb.id);
    const expanded = kbExpandedState[kb.id];
    const searchVal = kbSearchState[kb.id] || '';
    const filtered = searchVal ? entries.filter(e => {
      const q = searchVal.toLowerCase();
      return (e.title || '').toLowerCase().includes(q) ||
             (e.content || '').toLowerCase().includes(q) ||
             (e.keywords || []).some(k => k.toLowerCase().includes(q));
    }) : entries;

    const tagMap = {
      'rag_literature': '<span class="agent-kb-tag a">文献类</span>',
      'rag_common': '<span class="agent-kb-tag b">常识类</span>',
      'structured': '<span class="agent-kb-tag" style="background:#fff3e0;color:#e65100">结构化</span>'
    };
    const catTag = tagMap[kb.kbType] || '';
    const readOnly = kb.readOnly || false;
    const summary = kb.builtIn ? getKbSummary(kb.id) : null;

    // 头部条目数显示
    let countLabel;
    if (kb.builtIn && summary) {
      countLabel = summary.readOnly ? '只读' : (entries.length > 0 ? '内置+' + entries.length + '补充' : '内置');
    } else {
      countLabel = entries.length + '条';
    }

    let card = `<div class="kb-card">
      <div class="kb-card-header" onclick="toggleKbCard('${kb.id}')">
        <div class="kb-card-info">
          <span class="kb-card-icon">${kb.icon}</span>
          <div>
            <div class="kb-card-name">${kb.name} ${catTag}</div>
            <div class="kb-card-meta">${kb.desc}</div>
          </div>
        </div>
        <div class="kb-card-right">
          <span class="kb-card-count">${countLabel}</span>
          ${!kb.builtIn ? `<button class="kb-mini-btn kb-mini-btn-danger" onclick="event.stopPropagation();deleteCustomKb('${kb.id}')">删除</button>` : ''}
          <span class="kb-card-toggle ${expanded ? 'expanded' : ''}">\u25B6</span>
        </div>
      </div>
      <div class="kb-card-body ${expanded ? 'show' : ''}" id="kbCardBody_${kb.id}">`;

    // 内置KB：显示概要信息
    if (summary) {
      card += `<div class="kb-summary">
        <div class="kb-summary-source">${summary.source}</div>`;
      if (summary.issuedBy) {
        card += `<div class="kb-summary-issued">${summary.issuedBy}</div>`;
      }
      card += `<div class="kb-summary-coverage">`;
      summary.coverage.forEach(c => {
        card += `<div class="kb-summary-item"><span class="kb-summary-item-label">${c.label}</span><span class="kb-summary-item-detail">${c.detail}</span></div>`;
      });
      card += `</div>`;
      if (summary.note) {
        card += `<div class="kb-summary-note">${summary.note}</div>`;
      }
      card += `</div>`;
    }

    // 用户条目区域（非只读KB才显示）
    if (!readOnly) {
      if (kb.builtIn) {
        // 内置KB：用户补充条目区域
        card += `<div class="kb-user-section">
          <div class="kb-user-section-title">用户补充条目${entries.length > 0 ? '（' + entries.length + '）' : ''}</div>`;
      }

      // 搜索框
      card += `<div class="kb-search-row">
        <input type="text" class="kb-search-input" placeholder="搜索条目..." value="${searchVal}" oninput="kbSearchState['${kb.id}']=this.value;renderKbPanel();document.getElementById('kbCardBody_${kb.id}').classList.add('show');kbExpandedState['${kb.id}']=true;this.focus()">
        <button class="kb-mini-btn kb-mini-btn-primary" onclick="openEntryEditor('${kb.id}',null)">+ 添加条目</button>
      </div>`;

      // 条目列表
      filtered.forEach(e => {
        const preview = (e.content || '').substring(0, 120).replace(/\n/g, ' ');
        const kwText = (e.keywords || []).slice(0, 5).join('\u3001');
        card += `<div class="kb-entry">
          <div class="kb-entry-title">
            ${e.title}
            <span class="kb-entry-badge">补充</span>
          </div>
          <div class="kb-entry-preview">${preview}${e.content && e.content.length > 120 ? '...' : ''}</div>
          <div class="kb-entry-footer">
            <div class="kb-entry-kw">${kwText ? '关键词：' + kwText : ''}</div>
            <div class="kb-entry-actions">
              <button class="kb-entry-btn edit" onclick="openEntryEditor('${kb.id}','${e.id}')">编辑</button>
              <button class="kb-entry-btn del" onclick="deleteEntry('${kb.id}','${e.id}')">删除</button>
            </div>
          </div>
        </div>`;
      });

      if (filtered.length === 0) {
        card += `<div style="text-align:center;padding:16px;color:#aaa;font-size:13px;">${searchVal ? '未找到匹配条目' : (kb.builtIn ? '暂无补充条目，点击上方按钮添加' : '暂无条目，点击上方按钮创建')}</div>`;
      }

      if (kb.builtIn) {
        card += `</div>`; // close kb-user-section
      }
    }

    card += `</div></div>`;
    return card;
  }

  // === 大类分组渲染 ===
  // 1. RAG 知识库
  const ragLitKbs = kbs.filter(kb => kb.kbType === 'rag_literature');
  const ragComKbs = kbs.filter(kb => kb.kbType === 'rag_common');
  if (ragLitKbs.length > 0 || ragComKbs.length > 0) {
    html += `<div class="kb-cat-group">
      <div class="kb-cat-group-header">
        <span class="kb-cat-group-icon">\u{1F50D}</span>
        <span class="kb-cat-group-title">RAG 知识库</span>
        <span class="kb-cat-group-desc">检索后注入 AI 上下文</span>
      </div>`;

    if (ragLitKbs.length > 0) {
      html += `<div class="kb-sub-group">
        <div class="kb-sub-group-header">
          <span class="kb-sub-group-icon">\u{1F4C4}</span>
          <span class="kb-sub-group-title">文献类</span>
          <span class="kb-sub-group-hint">需注明引用出处</span>
        </div>`;
      ragLitKbs.forEach(kb => { html += renderKbCard(kb); });
      html += `</div>`;
    }

    if (ragComKbs.length > 0) {
      html += `<div class="kb-sub-group">
        <div class="kb-sub-group-header">
          <span class="kb-sub-group-icon">\u{1F4A1}</span>
          <span class="kb-sub-group-title">常识类</span>
          <span class="kb-sub-group-hint">不需要说明出处</span>
        </div>`;
      ragComKbs.forEach(kb => { html += renderKbCard(kb); });
      html += `</div>`;
    }

    html += `</div>`;
  }

  // 2. 结构化数据
  const structKbs = kbs.filter(kb => kb.kbType === 'structured');
  if (structKbs.length > 0) {
    html += `<div class="kb-cat-group">
      <div class="kb-cat-group-header">
        <span class="kb-cat-group-icon">\u{1F4CA}</span>
        <span class="kb-cat-group-title">结构化数据</span>
        <span class="kb-cat-group-desc">精确查询，不注入 AI 上下文</span>
      </div>`;
    structKbs.forEach(kb => { html += renderKbCard(kb); });
    html += `</div>`;
  }

  body.innerHTML = html;
}

function toggleKbCard(kbId) {
  kbExpandedState[kbId] = !kbExpandedState[kbId];
  renderKbPanel();
}

// --- 条目编辑弹窗 ---
function openEntryEditor(kbId, entryId) {
  const entries = getMergedEntries(kbId);
  const entry = entryId ? entries.find(e => e.id === entryId) : null;
  const kb = getAllKBs().find(k => k.id === kbId);
  const isLiterature = kb && kb.kbType === 'rag_literature';

  // 移除已有弹窗
  const old = document.getElementById('kbModalOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'kbModalOverlay';
  overlay.className = 'kb-modal-overlay';
  overlay.innerHTML = `<div class="kb-modal" onclick="event.stopPropagation()">
    <div class="kb-modal-header">
      <div class="kb-modal-title">${entry ? '编辑条目' : '添加条目'} — ${kb ? kb.name : ''}</div>
      <button class="kb-panel-close" onclick="closeKbModal()">✕</button>
    </div>
    <div class="kb-modal-body">
      <div class="kb-form-group">
        <label class="kb-form-label">条目标题</label>
        <input type="text" class="kb-form-input" id="kbEntryTitle" value="${entry ? (entry.title || '').replace(/"/g, '&quot;') : ''}" placeholder="如：高血压急症处理">
      </div>
      <div class="kb-form-group">
        <label class="kb-form-label">关键词（逗号分隔）</label>
        <input type="text" class="kb-form-input" id="kbEntryKeywords" value="${entry ? (entry.keywords || []).join('、') : ''}" placeholder="如：高血压、急症、降压、静脉降压药">
        <div class="kb-form-hint">AI 检索时根据关键词匹配，多个关键词用逗号或顿号分隔</div>
      </div>
      <div class="kb-form-group">
        <label class="kb-form-label">内容</label>
        <textarea class="kb-form-textarea" id="kbEntryContent" placeholder="条目详细内容，支持多行文本">${entry ? (entry.content || '') : ''}</textarea>
      </div>
      <div class="kb-form-group">
        <label class="kb-form-label">处理要点（可选，逗号分隔）</label>
        <input type="text" class="kb-form-input" id="kbEntryActions" value="${entry ? (entry.actions || []).join('、') : ''}" placeholder="如：监测血压、建立静脉通道、立即转诊">
      </div>
      ${isLiterature ? `<div class="kb-form-group">
        <label class="kb-form-label">来源标注（可选）</label>
        <input type="text" class="kb-form-input" id="kbEntrySource" value="${entry ? (entry.source || '') : ''}" placeholder="如：WS/T 810—2022 附录A">
        <div class="kb-form-hint">文献类知识库回答时会在末尾标注此来源</div>
      </div>` : ''}
    </div>
    <div class="kb-modal-footer">
      <button class="kb-mini-btn kb-mini-btn-secondary" onclick="closeKbModal()">取消</button>
      <button class="kb-mini-btn kb-mini-btn-primary" onclick="saveEntry('${kbId}','${entryId || ''}')">保存</button>
    </div>
  </div>`;
  overlay.onclick = closeKbModal;
  document.body.appendChild(overlay);
}

function closeKbModal() {
  const m = document.getElementById('kbModalOverlay');
  if (m) m.remove();
}

function saveEntry(kbId, entryId) {
  const title = document.getElementById('kbEntryTitle').value.trim();
  const keywordsStr = document.getElementById('kbEntryKeywords').value.trim();
  const content = document.getElementById('kbEntryContent').value.trim();
  const actionsStr = document.getElementById('kbEntryActions').value.trim();
  const sourceEl = document.getElementById('kbEntrySource');
  const source = sourceEl ? sourceEl.value.trim() : '';

  if (!title) { showToast('请填写条目标题'); return; }
  if (!content) { showToast('请填写条目内容'); return; }

  const keywords = keywordsStr ? keywordsStr.split(/[,，、\s]+/).filter(Boolean) : [];
  const actions = actionsStr ? actionsStr.split(/[,，、\s]+/).filter(Boolean) : [];

  const ov = getKbOverlay();

  if (kbId === 'ws' || kbId === 'drugs') {
    const ed = ov.edits[kbId];
    if (entryId) {
      // 编辑现有条目
      const builtInEntry = (kbId === 'ws' ? flattenWsKB() : flattenDrugsKB()).find(e => e.id === entryId);
      if (builtInEntry) {
        // 修改内置条目
        ed.modified[entryId] = { title, keywords, content, actions, ...(source ? { source } : {}) };
      } else {
        // 修改之前添加的自定义条目
        const idx = ed.added.findIndex(e => e.id === entryId);
        if (idx >= 0) ed.added[idx] = { id: entryId, title, keywords, content, actions, ...(source ? { source } : {}) };
      }
    } else {
      // 添加新条目
      const newId = 'add_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      ed.added.push({ id: newId, title, keywords, content, actions, ...(source ? { source } : {}) });
    }
  } else {
    // 自定义KB
    const kb = ov.customKbs.find(k => k.id === kbId);
    if (!kb) { showToast('知识库不存在'); return; }
    if (!kb.entries) kb.entries = [];
    if (entryId) {
      const idx = kb.entries.findIndex(e => e.id === entryId);
      if (idx >= 0) kb.entries[idx] = { id: entryId, title, keywords, content, actions, ...(source ? { source } : {}) };
    } else {
      const newId = 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      kb.entries.push({ id: newId, title, keywords, content, actions, ...(source ? { source } : {}) });
    }
  }

  saveKbOverlay(ov);
  closeKbModal();
  // 确保展开
  kbExpandedState[kbId] = true;
  renderKbPanel();
  showToast(entryId ? '条目已更新' : '条目已添加');
}

function deleteEntry(kbId, entryId) {
  if (!confirm('确定删除此条目？')) return;
  const ov = getKbOverlay();

  if (kbId === 'ws' || kbId === 'drugs') {
    const ed = ov.edits[kbId];
    const builtInEntry = (kbId === 'ws' ? flattenWsKB() : flattenDrugsKB()).find(e => e.id === entryId);
    if (builtInEntry) {
      // 删除内置条目
      if (!ed.deleted.includes(entryId)) ed.deleted.push(entryId);
      // 清除可能的修改记录
      delete ed.modified[entryId];
    } else {
      // 删除之前添加的自定义条目
      ed.added = ed.added.filter(e => e.id !== entryId);
    }
  } else {
    const kb = ov.customKbs.find(k => k.id === kbId);
    if (kb && kb.entries) {
      kb.entries = kb.entries.filter(e => e.id !== entryId);
    }
  }

  saveKbOverlay(ov);
  renderKbPanel();
  showToast('条目已删除');
}

// --- 新建KB弹窗 ---
let _newKbType = 'rag_common';

function openNewKbModal() {
  _newKbType = 'rag_common';
  const old = document.getElementById('kbModalOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'kbModalOverlay';
  overlay.className = 'kb-modal-overlay';
  overlay.innerHTML = `<div class="kb-modal" onclick="event.stopPropagation()">
    <div class="kb-modal-header">
      <div class="kb-modal-title">新建知识库</div>
      <button class="kb-panel-close" onclick="closeKbModal()">✕</button>
    </div>
    <div class="kb-modal-body">
      <div class="kb-form-group">
        <label class="kb-form-label">知识库名称</label>
        <input type="text" class="kb-form-input" id="kbNewName" placeholder="如：儿童保健指南">
      </div>
      <div class="kb-form-group">
        <label class="kb-form-label">大类</label>
        <div class="kb-cat-select">
          <div class="kb-cat-option" id="kbCatLit" onclick="_newKbType='rag_literature';updateKbCatSelect()" style="flex:1;min-width:0">
            <div style="font-size:15px">📄 文献类</div>
            <div style="font-size:10px;color:#999;margin-top:2px">RAG \u00B7 标注出处</div>
          </div>
          <div class="kb-cat-option selected" id="kbCatCom" onclick="_newKbType='rag_common';updateKbCatSelect()" style="flex:1;min-width:0">
            <div style="font-size:15px">💡 常识类</div>
            <div style="font-size:10px;color:#999;margin-top:2px">RAG \u00B7 不标出处</div>
          </div>
          <div class="kb-cat-option" id="kbCatStruct" onclick="_newKbType='structured';updateKbCatSelect()" style="flex:1;min-width:0">
            <div style="font-size:15px">📊 结构化</div>
            <div style="font-size:10px;color:#999;margin-top:2px">精确查询</div>
          </div>
        </div>
        <div class="kb-form-hint">
          <b>RAG > 文献类</b>：官方文件/标准，AI回答末尾标注出处<br>
          <b>RAG > 常识类</b>：实务性内容，AI直接回答不标出处<br>
          <b>结构化数据</b>：精确查询用，不注入AI上下文
        </div>
      </div>
      <div class="kb-form-group">
        <label class="kb-form-label">说明（可选）</label>
        <input type="text" class="kb-form-input" id="kbNewDesc" placeholder="如：社区儿童保健工作规范">
      </div>
    </div>
    <div class="kb-modal-footer">
      <button class="kb-mini-btn kb-mini-btn-secondary" onclick="closeKbModal()">取消</button>
      <button class="kb-mini-btn kb-mini-btn-primary" onclick="saveNewKb()">创建</button>
    </div>
  </div>`;
  overlay.onclick = closeKbModal;
  document.body.appendChild(overlay);
  document.getElementById('kbNewName').focus();
}

function updateKbCatSelect() {
  document.getElementById('kbCatLit').classList.toggle('selected', _newKbType === 'rag_literature');
  document.getElementById('kbCatCom').classList.toggle('selected', _newKbType === 'rag_common');
  document.getElementById('kbCatStruct').classList.toggle('selected', _newKbType === 'structured');
}

function saveNewKb() {
  const name = document.getElementById('kbNewName').value.trim();
  if (!name) { showToast('请填写知识库名称'); return; }
  const desc = document.getElementById('kbNewDesc').value.trim();

  const ov = getKbOverlay();
  const newId = 'kb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  ov.customKbs.push({ id: newId, name, kbType: _newKbType, desc, entries: [] });
  saveKbOverlay(ov);
  closeKbModal();
  kbExpandedState[newId] = true;
  renderKbPanel();
  showToast('知识库已创建');
}

function deleteCustomKb(kbId) {
  if (!confirm('确定删除此知识库及其所有条目？此操作不可撤销。')) return;
  const ov = getKbOverlay();
  ov.customKbs = ov.customKbs.filter(k => k.id !== kbId);
  saveKbOverlay(ov);
  delete kbExpandedState[kbId];
  delete kbSearchState[kbId];
  renderKbPanel();
  showToast('知识库已删除');
}

// --- 中文语义分词：2-4字滑动窗口 ---
function segmentChinese(text) {
  const segments = [];
  // 1. 先按标点/空格拆成短语
  const phrases = text.split(/[\s,，。、；;：:！!？?（）()\【\】\[\]\"\'""''·…—\-–~]+/).filter(p => p.length > 0);
  for (const phrase of phrases) {
    // 短短语直接保留
    if (phrase.length <= 4) { segments.push(phrase); continue; }
    // 2字滑动窗口
    for (let i = 0; i < phrase.length - 1; i++) segments.push(phrase.substring(i, i + 2));
    // 3字滑动窗口
    for (let i = 0; i < phrase.length - 2; i++) segments.push(phrase.substring(i, i + 3));
    // 4字滑动窗口
    for (let i = 0; i < phrase.length - 3; i++) segments.push(phrase.substring(i, i + 4));
    // 整个短语也作为候选
    segments.push(phrase);
  }
  return segments.filter(s => s.length >= 2);
}

// --- 自定义KB检索（供RAG使用） ---
function searchCustomKB(question) {
  const results = [];
  const lowerQ = question.toLowerCase();
  const ov = getKbOverlay();
  // 中文语义分词结果
  const qSegments = segmentChinese(lowerQ);

  // ★ 新增：识别用户问题中提到的KB名称，优先检索该KB
  // 停用词：避免把通用词（如RAG、来源、引用）误识别为指南名
  const KB_NAME_STOPWORDS = new Set(['rag', '来源', '引用', '参考', '知识库', 'kb', '指南', '共识', '标准']);
  const mentionedKbIds = [];
  for (const kb of (ov.customKbs || [])) {
    if (!kb.name || kb.name.length < 2) continue;
    const kbNameLower = kb.name.toLowerCase();
    // 过滤停用词和过短名称
    if (KB_NAME_STOPWORDS.has(kbNameLower)) continue;
    // KB名称在问题中出现 → 强制检索此KB
    if (lowerQ.includes(kbNameLower)) {
      mentionedKbIds.push(kb.id);
    }
  }

  // 检索内置KB的新增条目
  for (const kbId of ['ws', 'drugs']) {
    const ed = ov.edits[kbId];
    const cfg = getAgentConfig();
    const kbEnabled = cfg.kbSettings[kbId] && cfg.kbSettings[kbId].enabled;
    if (!kbEnabled) continue;

    const maxResults = cfg.kbSettings[kbId] ? cfg.kbSettings[kbId].maxResults : 3;

    // 合并added和modified条目
    const customEntries = [...(ed.added || [])];
    for (const [id, mod] of Object.entries(ed.modified || {})) {
      const orig = (kbId === 'ws' ? flattenWsKB() : flattenDrugsKB()).find(e => e.id === id);
      if (orig) customEntries.push({ ...orig, ...mod });
    }

    for (const entry of customEntries) {
      let score = 0;
      // 关键词精确匹配（保留原逻辑）
      for (const kw of (entry.keywords || [])) {
        if (lowerQ.includes(kw.toLowerCase())) {
          score += (kw.length <= 2 ? 1 : kw.length);
        }
      }
      // ★ 新增：中文分词匹配关键词
      if (score === 0) {
        for (const seg of qSegments) {
          for (const kw of (entry.keywords || [])) {
            if (kw.toLowerCase().includes(seg) || seg.includes(kw.toLowerCase())) {
              score += kw.length;
            }
          }
        }
      }
      // ★ 新增：中文分词匹配标题和内容
      if (score === 0) {
        const contentLower = (entry.content || '').toLowerCase();
        const titleLower = (entry.title || '').toLowerCase();
        for (const seg of qSegments) {
          if (contentLower.includes(seg) || titleLower.includes(seg)) score += seg.length;
        }
      }
      if (score > 0) {
        results.push({
          ...entry,
          matchScore: score,
          _kbId: kbId,
          _isCustom: true
        });
      }
    }
    if (kbId === 'ws') results.sort((a,b) => b.matchScore - a.matchScore);
  }

  // 检索自定义KB（仅RAG类型，结构化数据不注入AI上下文）
  for (const kb of (ov.customKbs || [])) {
    const kt = kb.kbType || (kb.category === 'A' ? 'rag_literature' : 'rag_common');
    if (kt === 'structured') continue; // 结构化数据不参与RAG检索

    // ★ KB名称被用户提到 → 加权（优先级最高）
    const isMentioned = mentionedKbIds.includes(kb.id);
    const mentionBonus = isMentioned ? 50 : 0;

    for (const entry of (kb.entries || [])) {
      let score = mentionBonus; // 被提到的KB的条目直接获得高分基础

      // 关键词精确匹配（保留原逻辑）
      for (const kw of (entry.keywords || [])) {
        if (lowerQ.includes(kw.toLowerCase())) {
          score += (kw.length <= 2 ? 1 : kw.length);
        }
      }
      // ★ 新增：中文分词匹配关键词
      if (score === mentionBonus) { // 只在关键词精确匹配失败时走分词
        for (const seg of qSegments) {
          for (const kw of (entry.keywords || [])) {
            if (kw.toLowerCase().includes(seg) || seg.includes(kw.toLowerCase())) {
              score += kw.length;
            }
          }
        }
      }
      // ★ 新增：中文分词匹配标题和内容
      if (score === mentionBonus) {
        const contentLower = (entry.content || '').toLowerCase();
        const titleLower = (entry.title || '').toLowerCase();
        for (const seg of qSegments) {
          if (contentLower.includes(seg) || titleLower.includes(seg)) score += seg.length;
        }
      }

      // 被提到的KB：只要内容不是空的，就纳入结果（即使匹配度低）
      if (isMentioned && score > mentionBonus) {
        results.push({
          ...entry,
          matchScore: score,
          _kbId: kb.id,
          _kbName: kb.name,
          _kbType: kt,
          _isCustom: true,
          _mentioned: true
        });
      } else if (!isMentioned && score > 0) {
        results.push({
          ...entry,
          matchScore: score,
          _kbId: kb.id,
          _kbName: kb.name,
          _kbType: kt,
          _isCustom: true
        });
      }
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

// ============================================================
// V1.6: 文件上传 + 自动解析 + 条目拆分（支持批量）
// ============================================================

let _uploadState = { step: 0, files: [], fileResults: [], targetKbType: 'rag_common' };

// 设置 pdf.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// 步骤1：选择文件（支持多选）
function startFileUpload() {
  _uploadState = { step: 1, files: [], fileResults: [], targetKbType: 'rag_common' };
  const old = document.getElementById('kbModalOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'kbModalOverlay';
  overlay.className = 'kb-modal-overlay';
  overlay.innerHTML = `<div class="kb-modal" onclick="event.stopPropagation()" style="max-width:520px;">
    <div class="kb-modal-header">
      <div class="kb-modal-title">⬆ 批量上传文件到知识库</div>
      <button class="kb-panel-close" onclick="closeKbModal()">✕</button>
    </div>
    <div class="kb-modal-body">
      <div class="upload-zone" onclick="document.getElementById('kbFileInput').click()">
        <div class="upload-zone-icon">📄</div>
        <div class="upload-zone-text">点击选择文件（可多选）</div>
        <div class="upload-zone-hint">支持 PDF / TXT / CSV / Word（.docx）<br>可一次选择多个文件，每个文件自动创建独立知识库</div>
      </div>
      <input type="file" id="kbFileInput" accept=".pdf,.txt,.csv,.docx,.doc" multiple style="display:none" onchange="handleFilesSelected(this)">
    </div>
  </div>`;
  overlay.onclick = closeKbModal;
  document.body.appendChild(overlay);
}

// 步骤2：批量文件选择后逐个解析
async function handleFilesSelected(input) {
  const files = Array.from(input.files);
  if (files.length === 0) return;

  _uploadState.files = files;
  _uploadState.fileResults = [];
  _uploadState.step = 2;

  const modalBody = document.querySelector('.kb-modal-body');
  modalBody.innerHTML = `<div class="upload-progress">
    <div style="font-size:24px;">⏳</div>
    <div style="font-size:14px;margin-top:8px;">正在解析 <b>${files.length}</b> 个文件...</div>
    <div class="upload-progress-bar">
      <div class="upload-progress-fill" id="uploadProgressFill" style="width:0%"></div>
    </div>
    <div class="upload-progress-text" id="uploadProgressText">准备解析...</div>
    <div id="uploadFileList" style="margin-top:10px;font-size:12px;color:#666;"></div>
  </div>`;

  const fileListDiv = document.getElementById('uploadFileList');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop().toLowerCase();

    const pct = Math.round(((i) / files.length) * 100);
    updateUploadProgress(pct, `解析第 ${i+1}/${files.length} 个文件: ${file.name}`);
    fileListDiv.innerHTML = `<div style="margin-bottom:4px;">${i > 0 ? '✅ 已完成 ' + i + ' 个' : ''} ⏳ 正在解析: <b>${file.name}</b></div>`;

    try {
      let rawText = '';

      if (ext === 'txt' || ext === 'csv') {
        rawText = await readFileAsText(file);
      } else if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        rawText = await extractPdfText(arrayBuffer);
      } else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        rawText = result.value;
      } else if (ext === 'doc') {
        _uploadState.fileResults.push({ fileName: file.name, error: '旧版 .doc 格式不支持，请另存为 .docx', entries: [] });
        continue;
      } else {
        _uploadState.fileResults.push({ fileName: file.name, error: `不支持的格式: .${ext}`, entries: [] });
        continue;
      }

      const entries = autoSplitEntries(rawText, file.name);
      _uploadState.fileResults.push({ fileName: file.name, entries: entries, error: null });
    } catch (err) {
      console.error('文件解析错误:', file.name, err);
      _uploadState.fileResults.push({ fileName: file.name, error: err.message || '解析失败', entries: [] });
    }
  }

  updateUploadProgress(100, '全部解析完成！');
  fileListDiv.innerHTML = `<div>✅ ${_uploadState.fileResults.filter(r => !r.error).length} 个成功，${_uploadState.fileResults.filter(r => r.error).length} 个失败</div>`;

  setTimeout(() => showUploadTargetStep(), 600);
}

// 进度条更新
function updateUploadProgress(pct, text) {
  const fill = document.getElementById('uploadProgressFill');
  const txt = document.getElementById('uploadProgressText');
  if (fill) fill.style.width = pct + '%';
  if (txt) txt.textContent = text;
}

// FileReader 读取纯文本
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'UTF-8');
  });
}

// PDF 文本提取（逐页）
async function extractPdfText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const total = pdf.numPages;
  let fullText = '';
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  return fullText;
}

// 步骤3：选择类别 + 查看每个文件概览
function showUploadTargetStep() {
  const modal = document.querySelector('.kb-modal');
  if (!modal) return;

  const successResults = _uploadState.fileResults.filter(r => !r.error && r.entries.length > 0);
  const errorResults = _uploadState.fileResults.filter(r => r.error || r.entries.length === 0);
  const totalEntries = successResults.reduce((sum, r) => sum + r.entries.length, 0);

  let fileListHtml = successResults.map(r => `
    <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:4px;background:#f0f7ed;margin-bottom:4px;">
      <span>✅</span>
      <span style="font-weight:500;font-size:13px;">${r.fileName}</span>
      <span style="font-size:12px;color:#5b86e5;">${r.entries.length} 条目</span>
    </div>`).join('');

  let errorListHtml = errorResults.map(r => `
    <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:4px;background:#fef0f0;margin-bottom:4px;">
      <span>❌</span>
      <span style="font-weight:500;font-size:13px;">${r.fileName}</span>
      <span style="font-size:12px;color:#e53935;">${r.error || '内容为空'}</span>
    </div>`).join('');

  if (successResults.length === 0) {
    modal.querySelector('.kb-modal-body').innerHTML = `<div style="text-align:center;padding:30px;">
      <div style="font-size:24px;">❌</div>
      <div style="margin-top:8px;">所有文件解析失败或内容为空</div>
      ${errorListHtml}
      <div class="upload-step-btns" style="justify-content:center;">
        <button class="kb-mini-btn kb-mini-btn-secondary" onclick="startFileUpload()">重新选择</button>
      </div>
    </div>`;
    return;
  }

  modal.querySelector('.kb-modal-body').innerHTML = `
    <div style="font-size:13px;color:#555;margin-bottom:12px;">
      成功解析 <b>${successResults.length}</b> 个文件，共 <b>${totalEntries}</b> 个条目
    </div>

    <div style="margin-bottom:12px;">
      ${fileListHtml}
      ${errorListHtml}
    </div>

    <div class="kb-form-group">
      <label class="kb-form-label">每个文件创建独立知识库，统一类别：</label>
      <div class="kb-cat-select">
        <div class="kb-cat-option" id="uploadCatLit" onclick="_uploadState.targetKbType='rag_literature';updateUploadCatSelect()">📄 文献类（标注出处）</div>
        <div class="kb-cat-option selected" id="uploadCatCommon" onclick="_uploadState.targetKbType='rag_common';updateUploadCatSelect()">💡 常识类（不标出处）</div>
        <div class="kb-cat-option" id="uploadCatStruct" onclick="_uploadState.targetKbType='structured';updateUploadCatSelect()">📊 结构化</div>
      </div>
      <div class="kb-form-hint">所有文件将使用同一类别。如果不同文件需要不同类别，请分开上传。</div>
    </div>

    <div class="upload-step-btns">
      <button class="kb-mini-btn kb-mini-btn-secondary" onclick="startFileUpload()">重新选择</button>
      <button class="kb-mini-btn kb-mini-btn-primary" onclick="showUploadPreview()">预览条目 →</button>
    </div>`;

  _uploadState.targetKbType = 'rag_common';
  _uploadState.step = 3;
}

function updateUploadCatSelect() {
  document.getElementById('uploadCatLit').classList.toggle('selected', _uploadState.targetKbType === 'rag_literature');
  document.getElementById('uploadCatCommon').classList.toggle('selected', _uploadState.targetKbType === 'rag_common');
  document.getElementById('uploadCatStruct').classList.toggle('selected', _uploadState.targetKbType === 'structured');
}

// 步骤4：预览所有文件的条目
function showUploadPreview() {
  _uploadState.step = 4;
  const modal = document.querySelector('.kb-modal');
  const successResults = _uploadState.fileResults.filter(r => !r.error && r.entries.length > 0);
  const totalEntries = successResults.reduce((sum, r) => sum + r.entries.length, 0);

  let html = `<div class="upload-preview">
    <div class="upload-preview-header">
      <span>预览拆分结果（${successResults.length} 个文件）</span>
      <span class="upload-preview-count">${totalEntries} 个条目</span>
    </div>`;

  // 按文件分组展示
  successResults.forEach((result, fi) => {
    html += `<div style="margin-bottom:12px;">
      <div style="font-size:13px;font-weight:600;color:#5b86e5;padding:4px 0;border-bottom:1px solid #e0e0e0;">📁 ${result.fileName}（${result.entries.length}条）</div>`;
    result.entries.forEach((e, ei) => {
      const globalIdx = `${fi}_${ei}`;
      html += `<div class="upload-entry-card">
        <div class="upload-entry-card-title">
          <span>#${ei+1}</span>
          <input type="text" class="kb-form-input" id="uploadET_${globalIdx}" value="${e.title}" style="flex:1;height:28px;font-size:13px;">
        </div>
        <textarea class="upload-entry-edit-area" id="uploadEC_${globalIdx}">${e.content}</textarea>
        <div class="upload-entry-card-actions">
          <input type="text" class="kb-form-input" id="uploadEK_${globalIdx}" value="${(e.keywords||[]).join(',')}" placeholder="关键词（逗号分隔）" style="flex:1;height:28px;font-size:11px;">
          <button class="kb-mini-btn kb-mini-btn-danger" onclick="removeUploadEntry(${fi},${ei})">删除</button>
        </div>
      </div>`;
    });
    html += `</div>`;
  });

  html += `</div>
    <div class="upload-step-btns">
      <button class="kb-mini-btn kb-mini-btn-secondary" onclick="showUploadTargetStep()">← 返回修改</button>
      <button class="kb-mini-btn kb-mini-btn-primary" onclick="confirmUploadSave()">确认保存</button>
    </div>`;

  modal.querySelector('.kb-modal-body').innerHTML = html;
}

// 删除某个预览条目
function removeUploadEntry(fi, ei) {
  const result = _uploadState.fileResults[fi];
  if (result && result.entries) {
    result.entries.splice(ei, 1);
    showUploadPreview();
  }
}

// 步骤5：确认保存（每个文件创建独立KB）
function confirmUploadSave() {
  // 从编辑框读取最终值
  const successResults = _uploadState.fileResults.filter(r => !r.error && r.entries.length > 0);
  successResults.forEach((result, fi) => {
    result.entries.forEach((e, ei) => {
      const globalIdx = `${fi}_${ei}`;
      const titleEl = document.getElementById('uploadET_' + globalIdx);
      const contentEl = document.getElementById('uploadEC_' + globalIdx);
      const kwEl = document.getElementById('uploadEK_' + globalIdx);
      if (titleEl) e.title = titleEl.value.trim();
      if (contentEl) e.content = contentEl.value.trim();
      if (kwEl) e.keywords = kwEl.value.split(/[,，]/).map(k => k.trim()).filter(k => k);
    });
  });

  const ov = getKbOverlay();
  let savedCount = 0;

  // 每个文件创建独立知识库
  // ★ 文献类自动标注来源
  const isLit = _uploadState.targetKbType === 'rag_literature';
  successResults.forEach(result => {
    if (result.entries.length === 0) return;
    const newId = 'kb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const kbName = result.fileName.replace(/\.[^.]+$/, '');
    // 文献类：每个条目自动加 source（文件名作为来源）
    if (isLit) {
      result.entries.forEach(e => {
        if (!e.source) e.source = kbName;
      });
    }
    ov.customKbs.push({
      id: newId,
      name: kbName,
      kbType: _uploadState.targetKbType,
      desc: `从 ${result.fileName} 上传，${result.entries.length}条`,
      entries: result.entries
    });
    savedCount++;
    kbExpandedState[newId] = true;
  });

  saveKbOverlay(ov);
  closeKbModal();
  renderKbPanel();
  showToast(`已创建 ${savedCount} 个知识库，共 ${successResults.reduce((s,r) => s + r.entries.length, 0)} 条目`);
}


function autoSplitEntries(rawText, fileName) {
  const lines = rawText.split(/\n/).filter(l => l.trim());
  const entries = [];
  let currentTitle = '';
  let currentContent = '';
  let currentKeywords = [];

  // 标题检测模式
  const headingPatterns = [
    /^(第[一二三四五六七八九十百千]+[章节篇部分])/,          // 第一章、第二节
    /^(附录\s*[A-Z\u4e00-\u9fff\d]+)/i,                    // 附录A、附录1
    /^(摘要|前言|引言|概述|总则|范围|术语|定义)/,            // 摘要、前言等
    /^(\d+[\.\s])+.{2,40}$/m,                              // 1.1 标题、1.2.3 标题
    /^(一|二|三|四|五|六|七|八|九|十)[、\s].{2,40}/,        // 一、总则
    /^\[.{2,30}\]/,                                         // [标题内容]
    /^#{1,6}\s/,                                            // Markdown标题
    /^(目\s*录|contents)/i,                                 // 目录（跳过）
  ];

  // 是否为标题行
  function isHeading(line) {
    if (line.trim().length < 3) return false;
    if (line.trim().length > 80) return false;
    // 数字编号开头
    if (/^\d+[\.\s]/.test(line) && line.trim().length < 50) return true;
    // 中文编号
    if (/^[一二三四五六七八九十]+[、.]/.test(line) && line.trim().length < 50) return true;
    // 附录
    if (/^附录\s*[A-Z\d]/i.test(line)) return true;
    // 章节
    if (/^第[一二三四五六七八九十]+[章节]/.test(line)) return true;
    // 常见结构性标题
    if (/^(摘要|前言|引言|概述|总则|范围|术语|定义|目的|适用|基本要求|管理要求|技术要求)/.test(line)) return true;
    // Markdown
    if (/^#{1,6}\s/.test(line)) return true;
    return false;
  }

  // 从标题提取关键词
  function extractKeywords(title) {
    const kw = [];
    // 去掉编号前缀
    const clean = title.replace(/^(\d+[\.\s]+|第[一二三四五六七八九十]+[章节篇部分]+[、\s]*|附录\s*[A-Z\d]*[、\s]*|[一二三四五六七八九十]+[、.]\s*|#+\s*)/, '').trim();
    // 拆分为中文词（2-4字）
    if (clean.length <= 6) {
      kw.push(clean);
    } else {
      // 提取关键短语
      const phrases = clean.split(/[，,、；;：:\s（）()【】\[\]]/).filter(p => p.length >= 2 && p.length <= 8);
      kw.push(...phrases.slice(0, 5));
    }
    // 如果原标题有编号，也作为关键词
    if (/^附录/.test(title)) kw.push(title.replace(/[、\s]*$/, '').trim());
    if (/^第/.test(title)) kw.push(title.replace(/[、\s.]*$/, '').trim());
    return kw.filter(k => k.length >= 2);
  }

  function flushEntry() {
    if (currentTitle && currentContent.trim()) {
      entries.push({
        id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: currentTitle,
        content: currentContent.trim(),
        keywords: currentKeywords,
        actions: [],
        source: '',
        builtIn: false
      });
    }
    currentTitle = '';
    currentContent = '';
    currentKeywords = [];
  }

  // 拆分逻辑
  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过目录行
    if (/^(目\s*录|contents)/i.test(trimmed)) continue;

    if (isHeading(trimmed)) {
      flushEntry();
      currentTitle = trimmed;
      currentKeywords = extractKeywords(trimmed);
    } else {
      // 如果还没有标题，用文件名+序号作为第一个条目的标题
      if (!currentTitle && entries.length === 0 && trimmed.length > 20) {
        currentTitle = fileName.replace(/\.[^.]+$/, '') + '（概述）';
        currentKeywords = [fileName.replace(/\.[^.]+$/, '')];
      }
      currentContent += trimmed + '\n';
    }
  }

  // 最后一条
  flushEntry();

  // 如果完全没有拆出标题（纯段落文本），按段落长度合并
  if (entries.length === 0 && rawText.trim()) {
    // 将整段文本作为一个条目
    const baseName = fileName.replace(/\.[^.]+$/, '');
    // 如果文本过长（>3000字），按换行双换行拆分
    const paragraphs = rawText.split(/\n{2,}/).filter(p => p.trim());
    if (paragraphs.length > 1 && rawText.length > 3000) {
      paragraphs.forEach((p, i) => {
        const chunk = p.trim();
        if (chunk.length > 50) {
          entries.push({
            id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            title: `${baseName}（第${i+1}段）`,
            content: chunk,
            keywords: extractKeywords(chunk.substring(0, 30)),
            actions: [],
            source: '',
            builtIn: false
          });
        }
      });
    } else {
      entries.push({
        id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: baseName,
        content: rawText.trim(),
        keywords: [baseName],
        actions: [],
        source: '',
        builtIn: false
      });
    }
  }

  // 过滤掉内容太短的条目（<20字，可能是噪声）
  return entries.filter(e => e.content.length >= 20);
}

