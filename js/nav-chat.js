// ============================================================
// FAMILY DROPDOWN — 家族档案切换
// ============================================================

function getCurrentCustomer() {
  return mockCustomers.find(c => c.id === currentCustomerId);
}

function getFamilyMembers() {
  const customer = getCurrentCustomer();
  if (!customer || !customer.residentIds || customer.residentIds.length === 0) return [];
  return customer.residentIds.map(id => residents.find(r => r.id === id)).filter(Boolean);
}

function toggleFamilyDropdown() {
  const customer = getCurrentCustomer();
  if (!customer || !customer.residentIds || customer.residentIds.length <= 1) return; // 无家族档案不弹出

  familyDropdownOpen = !familyDropdownOpen;
  const dd = document.getElementById('familyDropdown');
  const arrow = document.getElementById('dropdownArrow');
  const overlay = document.getElementById('familyDropdownOverlay');

  if (familyDropdownOpen) {
    renderFamilyDropdown();
    dd.style.display = 'block';
    arrow.classList.add('open');
    if (!overlay) {
      const ov = document.createElement('div');
      ov.id = 'familyDropdownOverlay';
      ov.className = 'family-dropdown-overlay';
      ov.onclick = closeFamilyDropdown;
      document.getElementById('panel-health').appendChild(ov);
    } else {
      overlay.style.display = 'block';
    }
  } else {
    dd.style.display = 'none';
    arrow.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
  }
}

function closeFamilyDropdown() {
  familyDropdownOpen = false;
  document.getElementById('familyDropdown').style.display = 'none';
  document.getElementById('dropdownArrow').classList.remove('open');
  const overlay = document.getElementById('familyDropdownOverlay');
  if (overlay) overlay.style.display = 'none';
}

function renderFamilyDropdown() {
  const members = getFamilyMembers();
  const currentR = getCurrentResident();
  document.getElementById('familyDropdown').innerHTML = `
    ${members.map(m => `
      <div class="family-member-item ${m.id === currentResidentId ? 'active' : ''}" onclick="switchFamilyMember(${m.id})">
        <div class="fm-avatar" style="background:${m.gender === '女' ? '#F852A0' : '#3370FF'}">${m.name[0]}</div>
        <div class="fm-info">
          <div class="fm-name">${m.name}</div>
          <div class="fm-meta">${m.gender} · ${m.age}岁 · ${m.tags.map(t => tagLabel(t)).join(' / ') || '无慢病'}</div>
        </div>
        <div class="fm-relation ${m.isPrimary ? 'primary' : ''}">${m.relation}</div>
      </div>
    `).join('')}
    <div class="family-dropdown-footer">
      <button onclick="closeFamilyDropdown(); navigateTo('ocr-create');">+ 添加家庭成员</button>
    </div>
  `;
}

function switchFamilyMember(residentId) {
  closeFamilyDropdown();
  currentResidentId = residentId;
  currentResident = residents.find(r => r.id === residentId);
  detailTab = 'basic';
  updateHeaderTitle();
  navigateTo('detail');
}

function getCurrentResident() {
  return residents.find(r => r.id === currentResidentId);
}

function updateHeaderTitle() {
  const r = getCurrentResident();
  const customer = getCurrentCustomer();
  const members = getFamilyMembers();
  const titleEl = document.getElementById('headerTitle');
  const arrow = document.getElementById('dropdownArrow');

  if (r && members.length > 0) {
    titleEl.textContent = r.name + ' · 健康档案';
    if (members.length > 1) {
      arrow.style.display = 'inline';
      document.getElementById('headerTitleDropdown').style.pointerEvents = 'auto';
    } else {
      arrow.style.display = 'none';
      document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    }
  } else {
    titleEl.textContent = '健康档案';
    arrow.style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
  }
}

// ============================================================
// TOP SIDEBAR TABS
// ============================================================

function switchTopTab(tabId) {
  const tabs = document.querySelectorAll('.sidebar-top-tab');
  tabs.forEach(t => {
    t.classList.remove('active');
    if (t.getAttribute('onclick').includes("'" + tabId + "'")) t.classList.add('active');
  });

  const panels = document.querySelectorAll('.top-tab-panel');
  panels.forEach(p => p.classList.remove('active'));
  document.getElementById('top-panel-' + tabId).classList.add('active');
}

// ============================================================
// SIDEBAR SECOND LEVEL TAB SWITCHING
// ============================================================

function switchSidebarTab(tabId) {
  const tabs = document.querySelectorAll('.sidebar-tab');
  tabs.forEach(t => {
    t.classList.remove('active');
    if (t.getAttribute('onclick').includes("'" + tabId + "'")) t.classList.add('active');
  });

  const panels = document.querySelectorAll('.sidebar-panel');
  panels.forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tabId).classList.add('active');

  // If switching to health tab and we have a selected customer, show their detail
  if (tabId === 'health') {
    const customer = getCurrentCustomer();
    if (customer && customer.residentIds && customer.residentIds.length > 0) {
      currentResidentId = customer.residentIds[0];
      currentResident = residents.find(r => r.id === currentResidentId);
      detailTab = 'basic';
      navigateTo('detail');
    } else if (customer && customer.residentIds && customer.residentIds.length === 0) {
      // 无档案客户：显示空状态引导建档
      navigateTo('no-record');
    } else {
      navigateTo('list');
    }
  }
}

// ============================================================
// CUSTOMER LIST & CHAT
// ============================================================

function renderContactList() {
  const container = document.getElementById('contactListContent');
  container.innerHTML = mockCustomers.map(c => `
    <div class="contact-item ${c.id === currentCustomerId ? 'active' : ''}" onclick="switchCustomer('${c.id}')">
      <div class="contact-avatar" style="background:${c.avatarColor};">${c.avatar}</div>
      <div class="contact-info">
        <div class="contact-name-row">
          <div class="contact-name">${c.name}</div>
          <div class="contact-time">${c.time}</div>
        </div>
        <div class="contact-preview">${c.preview}</div>
      </div>
    </div>
  `).join('');
}

function switchCustomer(customerId) {
  currentCustomerId = customerId;
  const customer = getCurrentCustomer();

  // 默认选中主档案（residentIds 第一个）
  if (customer && customer.residentIds && customer.residentIds.length > 0) {
    currentResidentId = customer.residentIds[0];
    currentResident = residents.find(r => r.id === currentResidentId);
  } else {
    currentResidentId = null;
    currentResident = null;
  }

  renderContactList();
  renderChat();

  // V1.3: 切换患者时恢复AI问答对话历史
  restoreAiQaState();

  // If health record tab is active, update it to show selected customer
  const healthPanel = document.getElementById('panel-health');
  if (healthPanel && healthPanel.classList.contains('active')) {
    if (customer && customer.residentIds && customer.residentIds.length > 0) {
      currentResidentId = customer.residentIds[0];
      currentResident = residents.find(r => r.id === currentResidentId);
      detailTab = 'basic';
      navigateTo('detail');
    } else {
      navigateTo('no-record');
    }
  }
}

function renderChat() {
  const customer = mockCustomers.find(c => c.id === currentCustomerId);
  if (!customer) return;

  const chatArea = document.getElementById('chatArea');
  chatArea.innerHTML = `
    <div class="chat-header">
      <div>
        <div class="title-row">
          <div class="title">${customer.chatTitle}</div>
        </div>
        <div class="sub">${customer.chatSub}</div>
      </div>
      <div class="icons">
        <span>📞</span>
        <span>👥</span>
        <span>⚙️</span>
      </div>
    </div>

    <div class="chat-messages">
      ${customer.messages.map(m => `
        <div class="message ${m.self ? 'self' : ''}">
          <div class="message-avatar" style="background:${m.avatarColor};">${m.sender[0]}</div>
          <div class="message-content">
            ${!m.self ? `<div class="message-sender">${m.sender}</div>` : ''}
            <div class="message-bubble">${m.text}</div>
            <div class="message-time">${m.time}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="chat-input-area">
      <div class="chat-toolbar">
        <span>😊</span>
        <span>✂️</span>
        <span>📁</span>
        <span>📷</span>
        <span>📞</span>
      </div>
      <textarea class="chat-input" id="chatInputBox" placeholder="请输入消息"></textarea>
      <div class="chat-input-footer">
        <span class="tip">按 Enter 发送消息</span>
        <button class="chat-send-btn" onclick="sendChatMessage()">发送</button>
      </div>
    </div>
  `;

  // 绑定 Enter 键发送
  const inputBox = document.getElementById('chatInputBox');
  inputBox.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // 自动滚动到底部
  const msgContainer = chatArea.querySelector('.chat-messages');
  if (msgContainer) {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }
}

// ============================================================

// ============================================================

function showToast(msg) {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function navigateTo(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');

  const tabs = document.querySelectorAll('.tab-item');
  tabs.forEach(t => t.classList.remove('active'));

  const backBtn = document.getElementById('backBtn');
  const wecomBadge = document.getElementById('wecomBadge');

  closeFamilyDropdown(); // 页面切换时关闭下拉

  if (pageId === 'list') {
    const customer = getCurrentCustomer();
    if (customer && customer.residentIds && customer.residentIds.length > 0) {
      currentResidentId = customer.residentIds[0];
      currentResident = residents.find(r => r.id === currentResidentId);
      detailTab = 'basic';
      backBtn.style.display = 'none';
      updateHeaderTitle();
      wecomBadge.style.display = 'none';
      document.querySelector('[data-tab="list"]').classList.add('active');
      renderDetail();
      return;
    }
    backBtn.style.display = 'none';
    updateHeaderTitle();
    wecomBadge.style.display = 'inline';
    document.querySelector('[data-tab="list"]').classList.add('active');
    renderResidentList();
  } else if (pageId === 'detail') {
    backBtn.style.display = 'none';
    updateHeaderTitle();
    wecomBadge.style.display = 'none';
    renderDetail();
  } else if (pageId === 'no-record') {
    backBtn.style.display = 'none';
    updateHeaderTitle();
    wecomBadge.style.display = 'inline';
    document.querySelector('[data-tab="list"]').classList.add('active');
    renderNoRecord();
  } else if (pageId === 'ocr-create') {
    backBtn.style.display = 'block';
    document.getElementById('headerTitle').textContent = 'OCR智能建档';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    document.querySelector('[data-tab="ocr"]').classList.add('active');
    ocrStep = 0;
    renderOcrCreate();
  } else if (pageId === 'manual-create') {
    backBtn.style.display = 'block';
    document.getElementById('headerTitle').textContent = '手动建档';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    renderManualCreate();
  } else if (pageId === 'my') {
    backBtn.style.display = 'none';
    document.getElementById('headerTitle').textContent = '我的';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    document.querySelector('[data-tab="my"]').classList.add('active');
    renderMyPage();
  } else if (pageId === 'edit-basic') {
    backBtn.style.display = 'block';
    document.getElementById('headerTitle').textContent = '编辑基本信息';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    renderEditBasic();
  } else if (pageId === 'add-history') {
    backBtn.style.display = 'block';
    document.getElementById('headerTitle').textContent = editingIndex >= 0 ? '编辑病史' : '新增病史';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    renderAddHistory();
  } else if (pageId === 'add-allergy') {
    backBtn.style.display = 'block';
    document.getElementById('headerTitle').textContent = editingIndex >= 0 ? '编辑过敏史' : '新增过敏史';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    renderAddAllergy();
  } else if (pageId === 'add-exam') {
    backBtn.style.display = 'block';
    document.getElementById('headerTitle').textContent = editingIndex >= 0 ? '编辑体检记录' : '新增体检记录';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    renderAddExam();
  } else if (pageId === 'add-followup') {
    backBtn.style.display = 'block';
    document.getElementById('headerTitle').textContent = editingIndex >= 0 ? '编辑随访记录' : '新增随访记录';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    renderAddFollowup();
  } else if (pageId === 'add-external') {
    backBtn.style.display = 'block';
    document.getElementById('headerTitle').textContent = '新增外院档案';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    renderAddExternal();
  } else if (pageId === 'batch-supplement') {
    backBtn.style.display = 'block';
    document.getElementById('headerTitle').textContent = '补录历史数据';
    document.getElementById('dropdownArrow').style.display = 'none';
    document.getElementById('headerTitleDropdown').style.pointerEvents = 'none';
    wecomBadge.style.display = 'none';
    renderBatchSupplement();
  }
}

function goBack() {
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const id = activePage.id.replace('page-', '');
    if (id === 'detail' || id === 'ocr-create' || id === 'manual-create'
        || id === 'edit-basic' || id === 'add-history' || id === 'add-allergy'
        || id === 'add-exam' || id === 'add-followup' || id === 'add-external' || id === 'batch-supplement') {
      const customer = getCurrentCustomer();
      if (customer && customer.residentIds && customer.residentIds.length > 0) {
        currentResidentId = customer.residentIds[0];
        currentResident = residents.find(r => r.id === currentResidentId);
        detailTab = 'basic';
        navigateTo('detail');
      } else if (id === 'manual-create' || id === 'ocr-create') {
        // 无档案客户从建档页返回 → 回到空状态
        navigateTo('no-record');
      }
    }
  }
}

function switchTab(tab) {
  if (tab === 'list') {
    const customer = getCurrentCustomer();
    if (customer && customer.residentIds && customer.residentIds.length > 0) {
      currentResidentId = customer.residentIds[0];
      currentResident = residents.find(r => r.id === currentResidentId);
      detailTab = 'basic';
      navigateTo('detail');
    }
  }
  else if (tab === 'ocr') navigateTo('ocr-create');
  else if (tab === 'my') navigateTo('my');
}

// ============================================================
// PAGE: Resident List
// ============================================================

function sendChatMessage() {
  const inputBox = document.getElementById('chatInputBox');
  const text = inputBox.value.trim();
  if (!text) return;

  const customer = getCurrentCustomer();
  if (!customer) return;

  // 获取当前时间字符串
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  // 添加医生发送的消息
  customer.messages.push({
    sender: '陈医生',
    avatarColor: '#07C160',
    self: true,
    text: text,
    time: timeStr
  });

  inputBox.value = '';
  renderChat();

  // 模拟患者自动回复（1-3秒延迟）
  const patientReplies = getPatientAutoReply(text, customer);
  const delay = 1200 + Math.random() * 1800;

  setTimeout(() => {
    const replyTime = new Date();
    const replyTimeStr = replyTime.getHours().toString().padStart(2, '0') + ':' + replyTime.getMinutes().toString().padStart(2, '0');
    customer.messages.push({
      sender: customer.name,
      avatarColor: customer.avatarColor,
      self: false,
      text: patientReplies,
      time: replyTimeStr
    });
    renderChat();
  }, delay);
}

// 根据医生消息和居民信息生成患者自动回复
function getPatientAutoReply(docMsg, customer) {
  const resident = residents.find(r => customer.residentIds && customer.residentIds.includes(r.id));
  const name = customer.name;

  // 根据关键词匹配回复
  if (docMsg.includes('随访') || docMsg.includes('复查') || docMsg.includes('约') || docMsg.includes('下周')) {
    return pickRandom([
      '好的，我准时来。',
      '没问题，到时候见。',
      '行，我记下了。',
      '好的陈医生，我一定按时来随访。',
    ]);
  }
  if (docMsg.includes('药') || docMsg.includes('用药') || docMsg.includes('服药') || docMsg.includes('吃药')) {
    return pickRandom([
      '我以后一定按时吃药。',
      '好的，以后不敢再忘了。',
      '记住了，谢谢陈医生提醒。',
      '好的，我会按时服药的。',
    ]);
  }
  if (docMsg.includes('饮食') || docMsg.includes('低盐') || docMsg.includes('控制') || docMsg.includes('少吃')) {
    return pickRandom([
      '好的，我注意饮食。',
      '明白了，以后少吃咸的。',
      '好的，我会控制饮食的。',
      '记住了，谢谢陈医生。',
    ]);
  }
  if (docMsg.includes('运动') || docMsg.includes('锻炼') || docMsg.includes('散步') || docMsg.includes('活动')) {
    return pickRandom([
      '好的，我每天散散步。',
      '行，以后多走走路。',
      '明白了，适当运动。',
    ]);
  }
  if (docMsg.includes('血压') || docMsg.includes('监测') || docMsg.includes('测量')) {
    return pickRandom([
      '我每天早晚都量了。',
      '好的，我以后坚持测量血压。',
      '最近量了几次，大概' + (resident ? (resident.tags.includes('hypertension') ? '140多' : '130左右') : '正常') + '。',
    ]);
  }
  if (docMsg.includes('血糖') || docMsg.includes('糖')) {
    return pickRandom([
      '好的，我注意监测血糖。',
      '最近测了几次，' + (resident && resident.tags.includes('diabetes') ? '7点多' : '还行') + '。',
      '我以后注意饮食控制血糖。',
    ]);
  }
  if (docMsg.includes('您好') || docMsg.includes('你好') || docMsg.includes('欢迎')) {
    return pickRandom([
      '陈医生您好！',
      '你好，麻烦您了。',
      '谢谢陈医生！',
    ]);
  }
  if (docMsg.includes('心电图') || docMsg.includes('心脏') || docMsg.includes('胸闷') || docMsg.includes('胸痛')) {
    return pickRandom([
      '偶尔有点闷，不严重。',
      '最近还好，没有明显不舒服。',
      '好的，我下周来做检查。',
    ]);
  }
  // 通用兜底回复
  return pickRandom([
    '好的，谢谢陈医生！',
    '明白了，我记住了。',
    '好的，我一定注意。',
    '谢谢您，陈医生。',
    '行，我照您说的做。',
  ]);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


// 知识库检索函数
function searchKnowledgeBase(question) {
  const results = [];
  const lowerQ = question.toLowerCase();

  // 1. 检索附录A-H（关键词匹配）
  for (const [key, appendix] of Object.entries(wsKnowledgeBase.appendices)) {
    const keywordMatch = appendix.keywords.some(kw => lowerQ.includes(kw));
    if (keywordMatch) {
      // 找到匹配的具体小节
      appendix.sections.forEach(section => {
        const sectionKeywords = section.subtitle.toLowerCase().split(/\s+/);
        const contentLower = section.content.toLowerCase();
        // 更精细匹配：问题关键词出现在小节标题或内容中
        const qWords = lowerQ.split(/\s+/);
        let matchScore = 0;
        qWords.forEach(w => {
          if (w.length >= 2 && contentLower.includes(w)) matchScore++;
          if (sectionKeywords.some(sk => sk.includes(w))) matchScore += 2;
        });
        if (matchScore > 0 || keywordMatch) {
          results.push({
            source: `WS/T 810—2022 附录${key}`,
            title: appendix.title,
            subtitle: section.subtitle,
            content: section.content,
            actions: section.actions,
            matchScore: matchScore + (keywordMatch ? 1 : 0)
          });
        }
      });
    }
  }

  // 2. 检索病情分层标准
  const severityKeywords = ['极高危', '高危', '平诊', '分层', '严重程度', '病情判断', 'MEWS', '评分', '生命体征'];
  if (severityKeywords.some(kw => lowerQ.includes(kw))) {
    // MEWS评分相关
    if (lowerQ.includes('mews') || lowerQ.includes('评分') || lowerQ.includes('打分')) {
      results.push({
        source: 'WS/T 810—2022 第5.1.3条',
        title: 'MEWS评分（改良早期预警评分）',
        subtitle: '基于生命体征的综合评分',
        content: 'MEWS评分适用于成人，基于5项生命体征指标评分：\n\n| 项目 | 3分 | 2分 | 1分 | 0分 | 1分 | 2分 | 3分 |\n| 心率 | ≤40 | 41-50 | 51-100 | 101-110 | 111-129 | ≥130 | |\n| 收缩压 | ≤70 | 71-80 | 81-100 | 101-199 | | ≥200 | |\n| 呼吸频率 | ＜9 | | 9-14 | 15-20 | 21-29 | | ≥30 |\n| 体温 | | ＜35.0 | | 35.0-38.4 | | ≥38.5 | |\n| 意识 | | | | 清楚 | 对声音有反应 | 对疼痛有反应 | 无反应 |\n\n分层标准：\n• MEWS≥9分 → 极高危\n• 5≤MEWS＜9分 → 高危\n• MEWS＜5分 → 平诊\n\n注意：极端生命体征数值和MEWS评分分层不一致时，以分层更高者为准。同时两项以上高危→极高危。',
        actions: ['计算MEWS评分', '对照分层标准', '确定转诊级别'],
        matchScore: 3
      });
    }

    // 极高危/高危标准
    for (const [level, data] of Object.entries(wsKnowledgeBase.severityLevels)) {
      if (lowerQ.includes(data.label) || (level === 'extremeHigh' && (lowerQ.includes('极危') || lowerQ.includes('危及生命'))) || (level === 'highRisk' && lowerQ.includes('危险'))) {
        let criteriaText = data.criteria.map(c => {
          if (typeof c === 'string') return c;
          return `[${c.category}] ${c.item}`;
        }).join('\n');
        results.push({
          source: `WS/T 810—2022 第5.1.2条`,
          title: `${data.label}患者判定标准`,
          subtitle: data.definition,
          content: `${data.label}：${data.definition}\n\n判定标准（出现下列任何一项）：\n${criteriaText}`,
          actions: ['立即评估生命体征', '确定转诊需求级别'],
          matchScore: 2
        });
      }
    }
  }

  // 3. 检索转诊分级
  const referralKeywords = ['转诊', '转院', '上级医院', '急救车', '转诊级别', '转诊需求'];
  if (referralKeywords.some(kw => lowerQ.includes(kw))) {
    const referralText = wsKnowledgeBase.referralLevels.map(r =>
      `${r.level}级：${r.label}\n  适用：${r.severity}\n  资源需求：${r.resource}\n  处理：${r.action}`
    ).join('\n\n');

    results.push({
      source: 'WS/T 810—2022 第6条',
      title: '患者转诊需求分级',
      subtitle: '依据病情严重程度及所需医疗资源',
      content: referralText + '\n\n需上调转诊级别的情况：\n• 合并脑膜刺激征、神经系统定位体征、颅高压等→上调至1级\n• 孕妇、儿童、高龄(≥75岁)、免疫功能低下、合并严重慢性疾病患者→上调1级',
      actions: ['确定转诊级别', '联系上级医院', '联系急救中心'],
      matchScore: 2
    });
  }

  // 4. 特定数值检索（血压/心率/体温等具体数值）
  const numericPatterns = [
    { pattern: /血压.*?(\d+)\/(\d+)/, type: '血压' },
    { pattern: /收缩压.*?(\d+)/, type: '收缩压' },
    { pattern: /心率.*?(\d+)/, type: '心率' },
    { pattern: /呼吸.*?(\d+)/, type: '呼吸频率' },
    { pattern: /体温.*?(\d+)/, type: '体温' },
  ];
  for (const np of numericPatterns) {
    const match = lowerQ.match(np.pattern);
    if (match) {
      const value = parseInt(match[1]);
      let severityNote = '';
      if (np.type === '血压' && match[2]) {
        const sbp = parseInt(match[1]), dbp = parseInt(match[2]);
        if (sbp >= 210 || dbp >= 120) severityNote = `血压${sbp}/${dbp}mmHg → 极高危（SBP≥210或DBP≥120）`;
        else if (sbp >= 180 || dbp >= 110) severityNote = `血压${sbp}/${dbp}mmHg → 高危（180≤SBP＜210或110≤DBP＜120）`;
        else if (sbp < 90) severityNote = `血压${sbp}/${dbp}mmHg → 低血压极高危（SBP＜90）`;
      } else if (np.type === '收缩压') {
        if (value >= 210) severityNote = `收缩压${value}mmHg → 极高危`;
        else if (value >= 180) severityNote = `收缩压${value}mmHg → 高危`;
        else if (value < 90) severityNote = `收缩压${value}mmHg → 低血压，需评估灌注`;
      } else if (np.type === '心率') {
        if (value > 150) severityNote = `心率${value}次/min → 极高危（快速型心律失常）`;
        else if (value < 40) severityNote = `心率${value}次/min → 极高危（缓慢型心律失常）`;
        else if (value >= 110 && value <= 129) severityNote = `心率${value}次/min → MEWS 1分`;
      } else if (np.type === '呼吸频率') {
        if (value >= 30 || value <= 10) severityNote = `呼吸频率${value}次/min → 极高危`;
        else if (value >= 22) severityNote = `呼吸频率${value}次/min → 高危`;
      } else if (np.type === '体温') {
        if (value > 40 || value < 35) severityNote = `体温${value}℃ → 极高危`;
        else if (value >= 39) severityNote = `体温${value}℃ → 高危（高热）`;
      }
      if (severityNote) {
        results.push({
          source: 'WS/T 810—2022 第5.1.2条',
          title: '生命体征数值评估',
          subtitle: '基于极端生命体征数值判断',
          content: severityNote + '\n\n请根据分层结果确定转诊需求级别，并参考相应附录进行现场处理。',
          actions: ['确定转诊级别', '参考对应附录处理', '联系急救中心'],
          matchScore: 5
        });
      }
    }
  }

  // 按匹配分数排序，取最相关的结果
  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}


// 搜索药品知识库
function searchDrugKnowledgeBase(question) {
  const results = [];
  const lowerQ = question.toLowerCase();
  const entries = drugKnowledgeBase.entries;

  // 1. Search grouped entries (hypertension/diabetes/CHD/emergency/antibiotics)
  for (const entry of entries) {
    let matchScore = 0;
    for (const kw of entry.keywords) {
      if (lowerQ.includes(kw.toLowerCase())) {
        matchScore += (kw.length <= 2 ? 1 : kw.length);
      }
    }
    if (matchScore > 0) {
      results.push({ ...entry, matchScore });
    }
  }

  // 2. Search drug lookup for specific drug names
  const lookup = drugKnowledgeBase.drugLookup;
  const qWords = question.split(/[\s,，、]+/);
  const matchedDrugs = {};

  for (const [key, infos] of Object.entries(lookup)) {
    for (const word of qWords) {
      const wLower = word.toLowerCase();
      if (key.includes(wLower) || wLower.includes(key)) {
        if (!matchedDrugs[key]) {
          matchedDrugs[key] = infos;
        }
      }
    }
    if (lowerQ.includes(key)) {
      if (!matchedDrugs[key]) {
        matchedDrugs[key] = infos;
      }
    }
  }

  // Build specific drug results
  if (Object.keys(matchedDrugs).length > 0) {
    let drugContent = "根据查询，以下药品在本中心目录中：\n\n";
    const drugNames = Object.keys(matchedDrugs);
    const topDrugs = drugNames.slice(0, 10);
    for (const key of topDrugs) {
      const infos = matchedDrugs[key];
      for (const info of infos) {
        const display = info.display || key;
        const spec = info.spec || "";
        const price = info.price || "";
        const unit = info.unit || "";
        const control = info.control || "";
        const controlLabel = control ? " [" + control + "]" : "";
        drugContent += "• " + display + "（" + spec + "）¥" + price + "/" + unit + controlLabel + "\n";
      }
    }
    if (drugNames.length > 10) {
      drugContent += "\n...共找到 " + drugNames.length + " 个匹配，仅展示前10个";
    }
    results.push({
      id: "drug_lookup",
      title: "药品查询结果",
      subtitle: "本中心药品目录",
      content: drugContent.trim(),
      actions: ["具体用药方案请遵医嘱"],
      source_type: "B",
      matchScore: 50
    });
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}


// V1.2: AI问答 — 多轮对话智能体
// ============================================================

function getCurrentAiQaMessages() {
  const cid = currentCustomerId || '__default';
  if (!aiQaMessagesMap[cid]) aiQaMessagesMap[cid] = [];
  return aiQaMessagesMap[cid];
}

// 设置当前患者的对话历史
function setCurrentAiQaMessages(msgs) {
  const cid = currentCustomerId || '__default';
  aiQaMessagesMap[cid] = msgs;
}

// 获取当前患者是否已开始对话
function getCurrentAiQaChatStarted() {
  const cid = currentCustomerId || '__default';
  return aiQaChatStartedMap[cid] || false;
}

// 设置当前患者是否已开始对话
function setCurrentAiQaChatStarted(val) {
  const cid = currentCustomerId || '__default';
  aiQaChatStartedMap[cid] = val;
}

