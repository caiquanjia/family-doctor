function getFilteredResidents() {
  let list = residents;
  if (currentFilter === 'active') list = list.filter(r => r.status === 'active');
  if (currentFilter === 'lost') list = list.filter(r => r.status === 'lost');
  if (currentFilter === 'moved') list = list.filter(r => r.status === 'moved');
  if (currentFilter === 'hypertension') list = list.filter(r => r.tags.includes('hypertension'));
  if (currentFilter === 'diabetes') list = list.filter(r => r.tags.includes('diabetes'));
  if (currentSearch) {
    const s = currentSearch.toLowerCase();
    list = list.filter(r => r.name.includes(s) || r.idCard.includes(s) || r.phone.includes(s));
  }
  return list;
}

function getCounts() {
  const active = residents.filter(r => r.status === 'active').length;
  const lost = residents.filter(r => r.status === 'lost').length;
  const moved = residents.filter(r => r.status === 'moved').length;
  const htn = residents.filter(r => r.tags.includes('hypertension')).length;
  const dm = residents.filter(r => r.tags.includes('diabetes')).length;
  return { all: residents.length, active, lost, moved, htn, dm };
}

function statusLabel(s) {
  const map = { active: '在管', lost: '失访', moved: '迁出' };
  return map[s] || s;
}

function statusClass(s) {
  const map = { active: 'status-active', lost: 'status-lost', moved: 'status-moved' };
  return map[s] || '';
}

function tagClass(t) {
  const map = { hypertension: 'tag-hypertension', diabetes: 'tag-diabetes', chd: 'tag-chd' };
  return map[t] || '';
}

function tagLabel(t) {
  const map = { hypertension: '高血压', diabetes: '糖尿病', chd: '冠心病' };
  return map[t] || t;
}

function avatarColor(g) {
  return g === '男' ? 'avatar-male' : 'avatar-female';
}

// ============================================================
// PAGE: No Record (Empty State)
// ============================================================

function renderNoRecord() {
  const customer = mockCustomers.find(c => c.id === currentCustomerId);
  const name = customer ? customer.name : '该居民';
  document.getElementById('page-no-record').innerHTML = `
    <div class="no-record-page">
      <div class="nr-icon">📂</div>
      <div class="nr-title">${name} 暂无健康档案</div>
      <div class="nr-desc">该居民尚未建立健康档案<br>请选择以下方式建档</div>
      <div class="create-actions">
        <div class="create-action-card" onclick="startOcrCreate()">
          <div class="ca-icon">📷</div>
          <div class="ca-label">OCR智能建档</div>
          <div class="ca-hint">拍照识别身份证自动填表</div>
        </div>
        <div class="create-action-card" onclick="startManualCreate()">
          <div class="ca-icon">📝</div>
          <div class="ca-label">手动填写建档</div>
          <div class="ca-hint">传统表单逐项录入</div>
        </div>
      </div>
    </div>
  `;
}

function startOcrCreate() {
  navigateTo('ocr-create');
}

function startManualCreate() {
  navigateTo('manual-create');
}

function renderResidentList() {
  const counts = getCounts();
  const list = getFilteredResidents();

  document.getElementById('page-list').innerHTML = `
    <div class="search-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="搜索姓名/身份证/手机号" value="${currentSearch}" oninput="onSearch(this.value)">
      </div>
      <button class="btn btn-outline btn-sm" onclick="navigateTo('manual-create')">+ 手动</button>
    </div>

    <div class="filter-chips">
      <button class="filter-chip${currentFilter === 'all' ? ' active' : ''}" onclick="setFilter('all')">全部<span class="count">${counts.all}</span></button>
      <button class="filter-chip${currentFilter === 'active' ? ' active' : ''}" onclick="setFilter('active')">在管<span class="count">${counts.active}</span></button>
      <button class="filter-chip${currentFilter === 'lost' ? ' active' : ''}" onclick="setFilter('lost')">失访<span class="count">${counts.lost}</span></button>
      <button class="filter-chip${currentFilter === 'moved' ? ' active' : ''}" onclick="setFilter('moved')">迁出<span class="count">${counts.moved}</span></button>
      <button class="filter-chip${currentFilter === 'hypertension' ? ' active' : ''}" onclick="setFilter('hypertension')">高血压<span class="count">${counts.htn}</span></button>
      <button class="filter-chip${currentFilter === 'diabetes' ? ' active' : ''}" onclick="setFilter('diabetes')">糖尿病<span class="count">${counts.dm}</span></button>
    </div>

    <div class="resident-list">
      ${list.length === 0 ? '<div class="empty-state"><div class="icon">📋</div><div class="text">暂无匹配的居民档案</div></div>' : ''}
      ${list.map(r => `
        <div class="resident-card" onclick="openDetail(${r.id})">
          <div class="resident-avatar ${avatarColor(r.gender)}">${r.name[0]}</div>
          <div class="resident-info">
            <div class="resident-name">
              ${r.name}
              <span class="resident-status ${statusClass(r.status)}">${statusLabel(r.status)}</span>
            </div>
            <div class="resident-meta">
              <span>${r.gender}</span>
              <span>${r.age}岁</span>
              <span>${r.idCard.slice(0,6)}****</span>
            </div>
            <div class="resident-tags">
              ${r.tags.map(t => `<span class="tag ${tagClass(t)}">${tagLabel(t)}</span>`).join('')}
            </div>
          </div>
          <span style="color:var(--text-muted); font-size:18px;">›</span>
        </div>
      `).join('')}
    </div>
  `;
}

function setFilter(f) {
  currentFilter = f;
  renderResidentList();
}

function onSearch(v) {
  currentSearch = v;
  renderResidentList();
}

// ============================================================
// PAGE: Detail
// ============================================================

function openDetail(id) {
  currentResidentId = id;
  currentResident = residents.find(r => r.id === id);
  if (!currentResident) return;
  detailTab = 'basic';
  navigateTo('detail');
  renderDetail();
}

function renderDetail() {
  if (!currentResident) return;
  const r = currentResident;
  const rec = r.records;

  document.getElementById('page-detail').innerHTML = `
    <div class="detail-header">
      <div class="detail-avatar ${avatarColor(r.gender)}">${r.name[0]}</div>
      <div class="detail-info">
        <h3>
          ${r.name}
          <span class="resident-status ${statusClass(r.status)}">${statusLabel(r.status)}</span>
        </h3>
        <div class="sub">${r.gender} · ${r.age}岁 · 签约医生：${r.signDoctor} · ${r.signDate}</div>
      </div>
    </div>

    ${(rec.allergy && rec.allergy.length > 0) ? `
    <div class="allergy-banner">
      <div class="banner-body">
        <div class="banner-title">过敏警示</div>
        <div>该居民有 <strong>${rec.allergy.length}</strong> 项过敏记录，用药及治疗时请务必避开以下过敏原：</div>
        <div class="banner-tags">
          ${rec.allergy.map(a => `<span class="banner-tag">🚫 ${a.allergen || a}</span>`).join('')}
        </div>
      </div>
    </div>
    ` : ''}

    <div class="detail-tabs">
      <button class="detail-tab${detailTab === 'basic' ? ' active' : ''}" onclick="switchDetailTab('basic')">基本信息</button>
      <button class="detail-tab${detailTab === 'external' ? ' active' : ''}" onclick="switchDetailTab('external')">外院档案</button>
      <button class="detail-tab${detailTab === 'allergy' ? ' active' : ''}" onclick="switchDetailTab('allergy')">过敏史</button>
      <button class="detail-tab${detailTab === 'exams' ? ' active' : ''}" onclick="switchDetailTab('exams')">体检记录</button>
      <button class="detail-tab${detailTab === 'followups' ? ' active' : ''}" onclick="switchDetailTab('followups')">随访记录</button>
    </div>

    ${renderDetailSection(r, rec)}
  `;
}

function renderDetailSection(r, rec) {
  if (detailTab === 'basic') {
    return `
      <div class="detail-section active">
        <div class="section-title">身份信息</div>
        <div class="info-grid">
          <div class="info-field"><div class="label">姓名</div><div class="value">${r.name}</div></div>
          <div class="info-field"><div class="label">性别</div><div class="value">${r.gender}</div></div>
          <div class="info-field"><div class="label">身份证号</div><div class="value">${r.idCard}</div></div>
          <div class="info-field"><div class="label">出生日期</div><div class="value">${r.idCard.slice(6,10)}-${r.idCard.slice(10,12)}</div></div>
          <div class="info-field"><div class="label">手机号</div><div class="value">${r.phone}</div></div>
          <div class="info-field"><div class="label">年龄</div><div class="value">${r.age}岁</div></div>
        </div>
        <div class="info-field" style="margin-top:8px;">
          <div class="label">户籍地址</div>
          <div class="value">${r.address}</div>
        </div>

        <div class="section-title" style="margin-top:16px;">健康档案信息</div>
        <div class="info-grid">
          <div class="info-field"><div class="label">血型</div><div class="value">${rec.basic.bloodType}型</div></div>
          <div class="info-field"><div class="label">身高</div><div class="value">${rec.basic.height}cm</div></div>
          <div class="info-field"><div class="label">体重</div><div class="value">${rec.basic.weight}kg</div></div>
          <div class="info-field"><div class="label">BMI</div><div class="value">${(rec.basic.weight / ((rec.basic.height/100) ** 2)).toFixed(1)}</div></div>
          <div class="info-field"><div class="label">婚姻状况</div><div class="value">${rec.basic.marital || '-'}</div></div>
          <div class="info-field"><div class="label">民族</div><div class="value">${rec.basic.nation}</div></div>
          <div class="info-field"><div class="label">文化程度</div><div class="value">${rec.basic.education || '-'}</div></div>
          <div class="info-field"><div class="label">签约医生</div><div class="value">${r.signDoctor}</div></div>
        </div>

        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <button class="btn btn-outline btn-block btn-sm" onclick="navigateTo('edit-basic')">✏️ 编辑基本信息</button>
          <button class="btn btn-outline btn-block btn-sm" onclick="navigateTo('batch-supplement')">📋 补录历史数据</button>
        </div>
      </div>
    `;
  }

  if (detailTab === 'external') {
    const hasNoExternal = !rec.externalRecords || rec.externalRecords.length === 0;
    return `
      <div class="detail-section active">
        <div class="section-title">
          外院档案
          <button class="add-btn" onclick="navigateTo('add-external')">+ 新增</button>
        </div>
        ${hasNoExternal ? '<div class="empty-state"><div class="icon">🏥</div><div class="text">暂无外院就诊记录</div></div>' : ''}
        ${!hasNoExternal ? rec.externalRecords.map((er, i) => `
          <div class="external-record ${er.hasPhoto ? 'has-photo' : ''}">
            <div class="er-header">
              <span class="er-hospital">🏥 ${er.hospital}</span>
              <div style="display:flex;align-items:center;gap:6px;">
                ${er.hasPhoto ? `<span class="er-photo-badge" onclick="event.stopPropagation();previewExternalPhoto(${i})" title="点击查看原始照片">📷 查看照片</span>` : ''}
                <span class="er-type ${er.type === '住院' ? 'er-type-inpatient' : 'er-type-outpatient'}">${er.type}</span>
              </div>
            </div>
            <div class="er-meta">
              <span class="er-dept">📋 ${er.dept}</span>
              <span>📅 ${er.date}</span>
              <span style="margin-left:8px;">👨‍⚕️ ${er.doctor}</span>
            </div>
            <div class="er-diagnosis"><strong>诊断：</strong>${er.diagnosis}</div>
            <div class="er-summary">${er.summary}</div>
          </div>
        `).join('') : ''}
      </div>
    `;
  }

  if (detailTab === 'allergy') {
    const hasNoAllergy = rec.allergy.length === 0;
    return `
      <div class="detail-section active">
        ${!hasNoAllergy ? `
          <div class="allergy-alert">
            <span class="alert-icon">⚠️</span>
            <span><strong>过敏警示：</strong>该居民有 ${rec.allergy.length} 项过敏记录，用药时请注意避免</span>
          </div>
        ` : ''}
        <div class="section-title">
          过敏史
          <button class="add-btn" onclick="navigateTo('add-allergy')">+ 新增</button>
        </div>
        ${hasNoAllergy ? '<div class="empty-state"><div class="icon">✅</div><div class="text">无过敏史记录</div></div>' : ''}
        <div class="history-list">
          ${rec.allergy.map((a, i) => `
            <div class="history-item" style="border-left: 3px solid var(--danger);">
              <div>
                <div class="disease-name" style="color:var(--danger);">${a.allergen || a}</div>
                <div class="disease-date">严重程度：${a.severity || '需注意'} · ${a.note || '用药时请避开'}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:10px;color:var(--danger);">🔒 锁定</span>
                <button class="edit-icon-btn" onclick="event.stopPropagation();editingIndex=${i};navigateTo('add-allergy')" title="编辑">✏️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (detailTab === 'exams') {
    const hasNoExams = rec.exams.length === 0;
    // Build exam cards
    const examCards = rec.exams.map((e, i) => {
      const abnormalItems = e.items.filter(it => it.flag === 'abnormal');
      const highItems = e.items.filter(it => it.flag === 'high');
      const normalItems = e.items.filter(it => !it.flag || it.flag === 'normal');
      const allFlagged = [...abnormalItems, ...highItems];

      // Abnormal alert row
      let alertRow = '';
      if (abnormalItems.length > 0) {
        alertRow = `<div class="exam-abnormal-row">
          <span class="exam-abnormal-label">⚠ 异常</span>
          ${abnormalItems.map(it =>
            `<span class="exam-abnormal-tag">${it.k} <span class="exam-tag-val">${it.v}</span><span class="exam-tag-unit">${it.unit || ''}</span></span>`
          ).join('')}
        </div>`;
      } else if (highItems.length > 0) {
        alertRow = `<div class="exam-abnormal-row flag-high-row">
          <span class="exam-abnormal-label">⚠ 偏高</span>
          ${highItems.map(it =>
            `<span class="exam-abnormal-tag flag-high">${it.k} <span class="exam-tag-val">${it.v}</span><span class="exam-tag-unit">${it.unit || ''}</span></span>`
          ).join('')}
        </div>`;
      } else {
        alertRow = `<div class="exam-abnormal-row empty">
          <span class="exam-abnormal-label">✓ 各项正常</span>
        </div>`;
      }

      // Normal items compact row
      const normalRow = normalItems.length > 0 ? `<div class="exam-normal-row">
        ${normalItems.map(it =>
          `<span class="exam-normal-tag">${it.k} <span class="exam-tag-val">${it.v}</span><span class="exam-tag-unit">${it.unit || ''}</span></span>`
        ).join('')}
      </div>` : '';

      // Photo badge
      const photoBadge = e.hasPhoto ? `<span class="exam-photo-badge" onclick="event.stopPropagation();previewExamPhoto(${i})">📷 查看报告</span>` : '';

      return `<div class="exam-item${e.hasPhoto ? ' has-photo' : ''}"${e.hasPhoto ? ` onclick="previewExamPhoto(${i})"` : ''}>
        <div class="exam-header">
          <div>
            <span class="exam-date">📅 ${e.date}</span>
            <span class="exam-dept" style="margin-left:8px;">${e.dept}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            ${photoBadge}
            <button class="edit-icon-btn" onclick="event.stopPropagation();editingIndex=${i};navigateTo('add-exam')" title="编辑">✏️</button>
          </div>
        </div>
        ${alertRow}
        ${normalRow}
        ${e.conclusion ? `<div class="exam-tooltip">📝 ${e.conclusion}</div>` : ''}
      </div>`;
    });

    // Build trend chart: collect all indicators that ever appeared as abnormal/high
    const trendCandidates = [];
    const seen = {};
    rec.exams.forEach(e => {
      e.items.forEach(it => {
        if ((it.flag === 'abnormal' || it.flag === 'high') && !seen[it.k]) {
          seen[it.k] = true;
          trendCandidates.push(it.k);
        }
      });
    });
    // Also include '血压' if present even if never flagged (always a key metric)
    const hasBP = rec.exams.some(e => e.items.some(it => it.k === '血压'));
    if (hasBP && !seen['血压']) trendCandidates.unshift('血压');

    // Pick default indicator
    if (!currentTrendIndicator || !trendCandidates.includes(currentTrendIndicator)) {
      currentTrendIndicator = trendCandidates.length > 0 ? trendCandidates[0] : null;
      // Prefer 血压 as default if available
      if (trendCandidates.includes('血压')) currentTrendIndicator = '血压';
    }

    // Build trend data for the selected indicator
    const trendData = [];
    rec.exams.forEach(e => {
      const item = e.items.find(it => it.k === currentTrendIndicator);
      if (item) {
        const parts = item.v.split('/');
        if (item.k === '血压' && parts.length === 2) {
          trendData.push({ date: e.date, value: parseInt(parts[0]), value2: parseInt(parts[1]), unit: item.unit || 'mmHg' });
        } else {
          const numVal = parseFloat(item.v);
          if (!isNaN(numVal)) {
            trendData.push({ date: e.date, value: numVal, unit: item.unit || '' });
          }
        }
      }
    });

    const trendDropdown = trendCandidates.length > 0 ? `
      <select class="trend-select" onchange="switchTrendIndicator(this.value)">
        ${trendCandidates.map(k => `<option value="${k}" ${k === currentTrendIndicator ? 'selected' : ''}>${k}</option>`).join('')}
      </select>` : '';

    const trendSection = trendData.length >= 2
      ? renderTrendChart(currentTrendIndicator, trendData)
      : '';

    return `
      <div class="detail-section active">
        <div class="section-title">体检记录
          <div style="display:flex;align-items:center;gap:8px;">
            ${trendDropdown}
            <button class="add-btn" onclick="editingIndex=-1;navigateTo('add-exam')">+ 新增</button>
          </div>
        </div>
        ${trendSection}
        ${hasNoExams ? '<div class="empty-state"><div class="icon">📋</div><div class="text">暂无体检记录</div></div>' : ''}
        ${examCards.join('')}
      </div>
    `;
  }

  if (detailTab === 'followups') {
    const hasNoFU = rec.followups.length === 0;
    return `
      <div class="detail-section active">
        <div class="section-title">
          随访记录
          <button class="add-btn" onclick="editingIndex=-1;navigateTo('add-followup')">+ 新增</button>
        </div>
        ${hasNoFU ? '<div class="empty-state"><div class="icon">📋</div><div class="text">暂无随访记录</div></div>' : ''}
        ${rec.followups.map(f => {
          let details = '';
          if (f.bp && f.hr) {
            details = `<span>血压</span><strong>${f.bp}mmHg</strong><span>心率</span><strong>${f.hr}bpm</strong><span>用药</span><strong>${f.drug}</strong>`;
          } else if (f.fbg && f.hba1c) {
            details = `<span>空腹血糖</span><strong>${f.fbg}mmol/L</strong><span>糖化</span><strong>${f.hba1c}%</strong><span>用药</span><strong>${f.drug}</strong>`;
          }
          return `
            <div class="followup-item">
              <div class="fu-date">📋 ${f.date} · ${f.type} <button class="edit-icon-btn" onclick="event.stopPropagation();editingIndex=${i};navigateTo('add-followup')" title="编辑" style="margin-left:8px;">✏️</button></div>
              <div class="fu-grid">${details}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">备注：${f.note}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

function switchDetailTab(tab) {
  detailTab = tab;
  renderDetail();
}

// ============================================================
// PAGE: OCR Create
// ============================================================

function renderOcrCreate() {
  const container = document.getElementById('page-ocr-create');
  container.innerHTML = `
    <div class="ocr-photo-placeholder" onclick="simulateOcr()">
      <div class="icon">📷</div>
      <div class="hint">点击拍照识别身份证</div>
      <div style="font-size:10px;margin-top:4px;color:var(--text-muted);">支持身份证正反面自动识别</div>
    </div>

    <div style="text-align:center;margin-bottom:14px;">
      <span style="font-size:11px;color:var(--text-muted);">—— 或 ——</span>
    </div>

    <button class="btn btn-outline btn-block" onclick="navigateTo('manual-create')">📝 手动填写建档</button>

    <div style="margin-top:18px;">
      <div class="section-title">📋 建档说明</div>
      <div style="font-size:11px;color:var(--text-muted);line-height:1.8;">
        <p>1. 拍照识别身份证，自动提取姓名、性别、身份证号、出生日期、户籍地址</p>
        <p>2. 确认识别结果并补充手机号、血型等健康信息</p>
        <p>3. 提交后即可建立居民健康档案</p>
      </div>
    </div>
  `;
}

function simulateOcr() {
  ocrStep = 1;
  const customer = mockCustomers.find(c => c.id === currentCustomerId);
  const ocrName = customer ? customer.name : '新居民';
  const container = document.getElementById('page-ocr-create');
  container.innerHTML = `
    <div class="ocr-result">
      <div class="ocr-header">✅ 识别成功 · 置信度 98%</div>
      <div class="ocr-img-preview">
        <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
          <div style="background:linear-gradient(135deg,#F2F3F5,#E8E9EB);width:80%;height:65%;border-radius:6px;border:1px solid #DADDE0;display:flex;align-items:center;justify-content:center;position:relative;">
            <div style="position:absolute;top:8px;left:12px;color:#3370FF;font-size:10px;">中华人民共和国</div>
            <div style="position:absolute;top:8px;right:12px;color:#3370FF;font-size:10px;">居民身份证</div>
            <div style="color:#86909C;font-size:14px;">🆔</div>
            <div style="position:absolute;bottom:10px;font-size:9px;color:#86909C;">OCR已识别</div>
          </div>
        </div>
      </div>

      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">OCR 识别到以下信息，点击"确认补全"后可修正：</div>

      <div class="info-grid" style="margin-bottom:12px;">
        <div class="info-field"><div class="label">姓名</div><div class="value" style="color:var(--success);">${ocrName}</div></div>
        <div class="info-field"><div class="label">性别</div><div class="value" style="color:var(--success);">男</div></div>
        <div class="info-field"><div class="label">身份证号</div><div class="value" style="color:var(--success);">32010219620315****</div></div>
        <div class="info-field"><div class="label">出生日期</div><div class="value" style="color:var(--success);">1962-03-15</div></div>
      </div>
      <div class="info-field" style="margin-bottom:12px;">
        <div class="label">户籍地址</div>
        <div class="value" style="color:var(--success);">江苏省南京市鼓楼区中央门街道XX小区8-301</div>
      </div>

      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" style="flex:1;" onclick="ocrStep=0;renderOcrCreate();">🔄 重新识别</button>
        <button class="btn btn-primary btn-sm" style="flex:1;" onclick="goToOcrForm();">✓ 确认，补充信息</button>
      </div>
    </div>
  `;
}

function goToOcrForm() {
  ocrStep = 2;
  const customer = mockCustomers.find(c => c.id === currentCustomerId);
  const ocrName = customer ? customer.name : '新居民';
  const container = document.getElementById('page-ocr-create');
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
          <option selected>男</option><option>女</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">出生日期 * <span style="font-size:10px;color:var(--warning);">(OCR预填)</span></label>
        <input class="form-input ocr-editable" id="ocr-birth" value="1962-03-15">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">身份证号 * <span style="font-size:10px;color:var(--warning);">(OCR预填)</span></label>
      <input class="form-input ocr-editable" id="ocr-idcard" value="32010219620315****">
    </div>

    <div class="form-group">
      <label class="form-label">户籍地址 <span style="font-size:10px;color:var(--warning);">(OCR预填)</span></label>
      <input class="form-input ocr-editable" id="ocr-addr" value="江苏省南京市鼓楼区中央门街道XX小区8-301">
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
      <button class="btn btn-outline" style="flex:1;" onclick="ocrStep=0;renderOcrCreate();">取消</button>
      <button class="btn btn-primary" style="flex:1;" onclick="submitOcrForm();">✅ 确认建档</button>
    </div>
  `;
}

function submitOcrForm() {
  const customer = getCurrentCustomer();
  const name = document.getElementById('ocr-name')?.value.trim() || (customer ? customer.name : '新居民');
  const gender = document.getElementById('ocr-gender')?.value || '男';
  const birth = document.getElementById('ocr-birth')?.value || '1962-03-15';
  const idCard = document.getElementById('ocr-idcard')?.value.trim() || '32010219620315****';
  const phoneVal = document.getElementById('ocr-phone')?.value.trim() || '159****0000';
  const addr = document.getElementById('ocr-addr')?.value.trim() || '待补充';
  if (!name || !phoneVal) { showToast('⚠️ 请填写姓名和手机号'); return; }
  const newId = residents.length + 1;
  const newResident = {
    id: newId,
    name: name,
    gender: gender,
    age: new Date().getFullYear() - parseInt(birth.slice(0,4)) || 64,
    idCard: idCard,
    phone: phoneVal,
    address: addr,
    status: 'active',
    signDoctor: '陈医生',
    signDate: '2026-07-14',
    tags: [],
    isPrimary: false,
    relation: '新建',
    records: {
      basic: { bloodType: 'O', height: 170, weight: 72, marital: '已婚', nation: '汉族', education: '高中' },
      history: [], allergy: [], exams: [], followups: []
    }
  };
  residents.push(newResident);
  if (customer) customer.residentIds.push(newId);
  currentResidentId = newId;
  currentResident = newResident;
  detailTab = 'basic';
  showToast('✅ 建档成功！OCR信息已确认并保存');
  setTimeout(() => navigateTo('detail'), 1500);
}

// ============================================================
// PAGE: Manual Create
// ============================================================

function renderManualCreate() {
  document.getElementById('page-manual-create').innerHTML = `
    <div class="section-title">基本信息</div>

    <div class="form-group">
      <label class="form-label">姓名 *</label>
      <input class="form-input" id="mc-name" placeholder="请输入姓名">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">性别 *</label>
        <select class="form-select" id="mc-gender">
          <option value="">请选择</option>
          <option>男</option><option>女</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">出生日期 *</label>
        <input class="form-input" id="mc-birth" type="date">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">身份证号 *</label>
      <input class="form-input" id="mc-idcard" placeholder="请输入18位身份证号">
    </div>

    <div class="form-group">
      <label class="form-label">手机号 *</label>
      <input class="form-input" id="mc-phone" placeholder="请输入手机号">
    </div>

    <div class="form-group">
      <label class="form-label">户籍地址</label>
      <textarea class="form-textarea" id="mc-addr" placeholder="请输入户籍地址"></textarea>
    </div>

    <div class="section-title" style="margin-top:16px;">健康信息</div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">血型</label>
        <select class="form-select" id="mc-blood">
          <option value="">请选择</option>
          <option>A</option><option>B</option><option>AB</option><option>O</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">民族</label>
        <select class="form-select" id="mc-nation">
          <option>汉族</option><option>回族</option><option>满族</option><option>蒙古族</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">身高 (cm)</label>
        <input class="form-input" id="mc-height" placeholder="cm" type="number">
      </div>
      <div class="form-group">
        <label class="form-label">体重 (kg)</label>
        <input class="form-input" id="mc-weight" placeholder="kg" type="number">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">签约医生 *</label>
      <select class="form-select" id="mc-doctor">
        <option value="">请选择</option>
        <option>陈医生</option><option>赵医生</option>
      </select>
    </div>

    <div style="display:flex;gap:8px;margin-top:18px;margin-bottom:18px;">
      <button class="btn btn-outline" style="flex:1;" onclick="navigateTo('list')">取消</button>
      <button class="btn btn-primary" style="flex:1;" onclick="submitManualForm();">✅ 确认建档</button>
    </div>
  `;
}

function submitManualForm() {
  const name = document.getElementById('mc-name').value.trim();
  const gender = document.getElementById('mc-gender').value;
  const phone = document.getElementById('mc-phone').value.trim();

  if (!name || !gender || !phone) {
    showToast('⚠️ 请填写必填项：姓名、性别、手机号');
    return;
  }

  const customer = getCurrentCustomer();
  const newId = residents.length + 1;
  const newResident = {
    id: newId,
    name, gender,
    age: 35,
    idCard: '32010219900808****',
    phone: phone || '138****0000',
    address: document.getElementById('mc-addr').value || '待补充',
    status: 'active',
    signDoctor: document.getElementById('mc-doctor').value || '陈医生',
    signDate: '2026-07-14',
    tags: [],
    isPrimary: customer.residentIds.length === 0,
    relation: customer.residentIds.length === 0 ? '本人' : '新建',
    records: {
      basic: {
        bloodType: document.getElementById('mc-blood').value || '',
        height: parseInt(document.getElementById('mc-height').value) || 0,
        weight: parseInt(document.getElementById('mc-weight').value) || 0,
        marital: '',
        nation: document.getElementById('mc-nation').value || '汉族',
        education: ''
      },
      history: [], allergy: [], exams: [], followups: []
    }
  };
  residents.push(newResident);
  // 关联到当前客户
  if (customer) customer.residentIds.push(newId);
  currentResidentId = newId;
  currentResident = newResident;
  detailTab = 'basic';
  showToast(`✅ 建档成功！${name} 的档案已关联到当前客户`);
  setTimeout(() => navigateTo('detail'), 1500);
}

// ============================================================
// PAGE: My
// ============================================================

function renderMyPage() {
  document.getElementById('page-my').innerHTML = `
    <div style="text-align:center;padding:24px 0;">
      <div class="detail-avatar avatar-male" style="width:60px;height:60px;font-size:22px;margin:0 auto 10px;">陈</div>
      <div style="font-size:16px;font-weight:600;">陈医生</div>
      <div style="font-size:11px;color:var(--text-muted);">鼓楼区社区卫生服务中心 · 全科</div>
    </div>

    <div class="info-grid" style="margin-bottom:16px;">
      <div class="info-field" style="text-align:center;">
        <div style="font-size:22px;font-weight:700;color:var(--primary);">${residents.filter(r => r.status === 'active').length}</div>
        <div class="label">在管居民</div>
      </div>
      <div class="info-field" style="text-align:center;">
        <div style="font-size:22px;font-weight:700;color:var(--warning);">${residents.filter(r => r.status === 'lost').length}</div>
        <div class="label">失访居民</div>
      </div>
      <div class="info-field" style="text-align:center;">
        <div style="font-size:22px;font-weight:700;color:var(--success);">${residents.filter(r => r.tags.includes('hypertension')).length}</div>
        <div class="label">高血压管理</div>
      </div>
      <div class="info-field" style="text-align:center;">
        <div style="font-size:22px;font-weight:700;color:var(--warning);">${residents.filter(r => r.tags.includes('diabetes')).length}</div>
        <div class="label">糖尿病管理</div>
      </div>
    </div>

    <div class="history-list">
      <div class="history-item" onclick="showToast('企微工作台设置（模拟）')">
        <div>
          <div class="disease-name">⚙️ 企微工作台设置</div>
          <div class="disease-date">消息提醒、权限管理</div>
        </div>
        <span style="color:var(--text-muted);">›</span>
      </div>
      <div class="history-item" onclick="showToast('今日待随访（模拟）')">
        <div>
          <div class="disease-name">📋 今日待随访</div>
          <div class="disease-date">3位居民需要随访</div>
        </div>
        <span style="color:var(--warning);">3</span>
      </div>
      <div class="history-item" onclick="showToast('数据统计（模拟）')">
        <div>
          <div class="disease-name">📊 数据统计</div>
          <div class="disease-date">建档率、随访率、慢病管理率</div>
        </div>
        <span style="color:var(--text-muted);">›</span>
      </div>
    </div>

    <div style="margin-top:24px;text-align:center;font-size:10px;color:var(--text-muted);">
      健康档案 v1.0 · 企微版
    </div>
  `;
}

// ============================================================
// EDIT: 编辑基本信息
// ============================================================

function renderEditBasic() {
  const r = currentResident;
  if (!r) return;
  const rec = r.records;
  document.getElementById('page-edit-basic').innerHTML = `
    <div class="edit-section">
      <div class="section-title">身份信息</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">姓名</label>
          <input class="form-input" id="eb-name" value="${r.name}">
        </div>
        <div class="form-group">
          <label class="form-label">性别</label>
          <select class="form-select" id="eb-gender">
            <option ${r.gender==='男'?'selected':''}>男</option>
            <option ${r.gender==='女'?'selected':''}>女</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">身份证号</label>
        <input class="form-input" id="eb-idcard" value="${r.idCard}">
      </div>
      <div class="form-group">
        <label class="form-label">手机号</label>
        <input class="form-input" id="eb-phone" value="${r.phone}">
      </div>
      <div class="form-group">
        <label class="form-label">户籍地址</label>
        <textarea class="form-textarea" id="eb-addr">${r.address}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">签约医生</label>
        <select class="form-select" id="eb-doctor">
          <option ${r.signDoctor==='陈医生'?'selected':''}>陈医生</option>
          <option ${r.signDoctor==='赵医生'?'selected':''}>赵医生</option>
        </select>
      </div>

      <div class="section-title" style="margin-top:16px;">健康信息</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">血型</label>
          <select class="form-select" id="eb-blood">
            <option value="">请选择</option>
            <option ${rec.basic.bloodType==='A'?'selected':''}>A</option>
            <option ${rec.basic.bloodType==='B'?'selected':''}>B</option>
            <option ${rec.basic.bloodType==='AB'?'selected':''}>AB</option>
            <option ${rec.basic.bloodType==='O'?'selected':''}>O</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">民族</label>
          <select class="form-select" id="eb-nation">
            <option ${rec.basic.nation==='汉族'?'selected':''}>汉族</option>
            <option ${rec.basic.nation==='回族'?'selected':''}>回族</option>
            <option ${rec.basic.nation==='满族'?'selected':''}>满族</option>
            <option ${rec.basic.nation==='蒙古族'?'selected':''}>蒙古族</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">身高 (cm)</label>
          <input class="form-input" id="eb-height" value="${rec.basic.height || ''}" placeholder="cm" type="number">
        </div>
        <div class="form-group">
          <label class="form-label">体重 (kg)</label>
          <input class="form-input" id="eb-weight" value="${rec.basic.weight || ''}" placeholder="kg" type="number">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">婚姻状况</label>
          <select class="form-select" id="eb-marital">
            <option value="">请选择</option>
            <option ${rec.basic.marital==='已婚'?'selected':''}>已婚</option>
            <option ${rec.basic.marital==='未婚'?'selected':''}>未婚</option>
            <option ${rec.basic.marital==='离异'?'selected':''}>离异</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">文化程度</label>
          <select class="form-select" id="eb-edu">
            <option value="">请选择</option>
            <option ${rec.basic.education==='小学'?'selected':''}>小学</option>
            <option ${rec.basic.education==='初中'?'selected':''}>初中</option>
            <option ${rec.basic.education==='高中'?'selected':''}>高中</option>
            <option ${rec.basic.education==='本科'?'selected':''}>本科</option>
          </select>
        </div>
      </div>

      <div class="edit-actions">
        <button class="btn btn-outline" style="flex:1;" onclick="goBack()">取消</button>
        <button class="btn btn-primary" style="flex:1;" onclick="submitEditBasic()">💾 保存修改</button>
      </div>
    </div>
  `;
}

function submitEditBasic() {
  const r = currentResident;
  if (!r) return;
  r.name = document.getElementById('eb-name').value.trim() || r.name;
  r.gender = document.getElementById('eb-gender').value;
  r.idCard = document.getElementById('eb-idcard').value.trim() || r.idCard;
  r.phone = document.getElementById('eb-phone').value.trim() || r.phone;
  r.address = document.getElementById('eb-addr').value.trim() || r.address;
  r.signDoctor = document.getElementById('eb-doctor').value;
  r.records.basic.bloodType = document.getElementById('eb-blood').value;
  r.records.basic.nation = document.getElementById('eb-nation').value;
  r.records.basic.height = parseInt(document.getElementById('eb-height').value) || r.records.basic.height;
  r.records.basic.weight = parseInt(document.getElementById('eb-weight').value) || r.records.basic.weight;
  r.records.basic.marital = document.getElementById('eb-marital').value;
  r.records.basic.education = document.getElementById('eb-edu').value;
  showToast('✅ 基本信息已更新');
  setTimeout(() => navigateTo('detail'), 800);
}

// ============================================================
// ADD/EDIT: 既往病史
// ============================================================

function renderAddHistory() {
  const r = currentResident;
  const existing = editingIndex >= 0 ? r.records.history[editingIndex] : null;
  document.getElementById('page-add-history').innerHTML = `
    <div class="edit-section">
      <div class="form-group">
        <label class="form-label">疾病名称 *</label>
        <input class="form-input" id="ah-disease" value="${existing ? existing.disease : ''}" placeholder="如：高血压、糖尿病、冠心病">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">确诊日期</label>
          <input class="form-input" id="ah-date" value="${existing ? existing.diagnosed : ''}" placeholder="如：2020-03">
        </div>
        <div class="form-group">
          <label class="form-label">状态</label>
          <select class="form-select" id="ah-status">
            <option ${existing && existing.status==='treating'?'selected':''} value="treating">治疗中</option>
            <option ${existing && existing.status==='stable'?'selected':''} value="stable">稳定</option>
            <option ${existing && existing.status==='cured'?'selected':''} value="cured">已治愈</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">备注 / 治疗情况</label>
        <textarea class="form-textarea" id="ah-note" placeholder="如：口服硝苯地平控制良好">${existing ? existing.note : ''}</textarea>
      </div>
      <div class="edit-actions">
        <button class="btn btn-outline" style="flex:1;" onclick="goBack()">取消</button>
        <button class="btn btn-primary" style="flex:1;" onclick="submitHistory()">💾 ${editingIndex >= 0 ? '保存修改' : '添加病史'}</button>
      </div>
    </div>
  `;
}

function submitHistory() {
  const r = currentResident;
  const disease = document.getElementById('ah-disease').value.trim();
  if (!disease) { showToast('⚠️ 请填写疾病名称'); return; }
  const data = {
    disease: disease,
    diagnosed: document.getElementById('ah-date').value.trim() || '未记录',
    status: document.getElementById('ah-status').value,
    note: document.getElementById('ah-note').value.trim() || ''
  };
  if (editingIndex >= 0) {
    r.records.history[editingIndex] = data;
  } else {
    r.records.history.push(data);
  }
  showToast(editingIndex >= 0 ? '✅ 病史已更新' : '✅ 病史已添加');
  setTimeout(() => { editingIndex = -1; navigateTo('detail'); }, 800);
}

// ============================================================
// ADD/EDIT: 过敏史
// ============================================================

function renderAddAllergy() {
  const r = currentResident;
  const existing = editingIndex >= 0 ? (r.records.allergy[editingIndex] || {}) : {};
  const allergen = typeof existing === 'string' ? existing : (existing.allergen || '');
  const severity = typeof existing === 'string' ? '' : (existing.severity || '');
  const note = typeof existing === 'string' ? '' : (existing.note || '');
  document.getElementById('page-add-allergy').innerHTML = `
    <div class="edit-section">
      <div style="background:var(--danger-bg);border:1px solid var(--danger);border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:11px;color:var(--danger);">
        ⚠️ 过敏史信息对用药安全至关重要，请务必准确填写
      </div>
      <div class="form-group">
        <label class="form-label">过敏原 *</label>
        <input class="form-input" id="aa-allergen" value="${allergen}" placeholder="如：青霉素、头孢类、海鲜">
      </div>
      <div class="form-group">
        <label class="form-label">严重程度</label>
        <select class="form-select" id="aa-severity">
          <option value="">请选择</option>
          <option ${severity==='轻微'?'selected':''}>轻微</option>
          <option ${severity==='中度'?'selected':''}>中度</option>
          <option ${severity==='严重'?'selected':''}>严重</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">具体反应描述</label>
        <textarea class="form-textarea" id="aa-note" placeholder="如：皮疹、呼吸困难、过敏性休克">${note}</textarea>
      </div>
      <div class="edit-actions">
        <button class="btn btn-outline" style="flex:1;" onclick="goBack()">取消</button>
        <button class="btn btn-primary" style="flex:1;" onclick="submitAllergy()">💾 ${editingIndex >= 0 ? '保存修改' : '添加过敏史'}</button>
      </div>
    </div>
  `;
}

function submitAllergy() {
  const r = currentResident;
  const allergen = document.getElementById('aa-allergen').value.trim();
  if (!allergen) { showToast('⚠️ 请填写过敏原'); return; }
  const data = {
    allergen: allergen,
    severity: document.getElementById('aa-severity').value || '未记录',
    note: document.getElementById('aa-note').value.trim() || ''
  };
  if (editingIndex >= 0) {
    r.records.allergy[editingIndex] = data;
  } else {
    r.records.allergy.push(data);
  }
  showToast(editingIndex >= 0 ? '✅ 过敏史已更新' : '✅ 过敏史已添加');
  setTimeout(() => { editingIndex = -1; navigateTo('detail'); }, 800);
}

// ============================================================
// ADD/EDIT: 体检记录
// ============================================================

function renderAddExam() {
  const r = currentResident;
  const existing = editingIndex >= 0 ? r.records.exams[editingIndex] : null;
  const items = existing ? existing.items : (window._examItems && window._examItems.length > 0 ? window._examItems : [{ k: '', v: '', unit: '', flag: 'normal' }]);
  const existingConclusion = existing && existing.conclusion ? existing.conclusion : (window._examPhotoTempConclusion || '');
  const existingPhoto = existing && existing.hasPhoto;

  const itemsHtml = items.map((it, i) => `
    <div class="exam-item-row">
      <input class="form-input" value="${it.k}" placeholder="检查项目" onchange="updateExamItem(${i},'k',this.value)">
      <input class="form-input" value="${it.v}" placeholder="结果/数值" onchange="updateExamItem(${i},'v',this.value)">
      <input class="form-input" value="${it.unit || ''}" placeholder="单位" style="max-width:60px;" onchange="updateExamItem(${i},'unit',this.value)">
      <select class="form-select" onchange="updateExamItem(${i},'flag',this.value)">
        <option value="normal" ${it.flag==='normal'?'selected':''}>正常</option>
        <option value="high" ${it.flag==='high'?'selected':''}>偏高</option>
        <option value="abnormal" ${it.flag==='abnormal'?'selected':''}>异常</option>
      </select>
    </div>
  `).join('');

  const photoSection = existingPhoto
    ? `<div style="margin-top:10px;padding:8px 10px;background:var(--primary-bg);border-radius:6px;font-size:11px;color:var(--primary);text-align:center;">📷 已拍摄报告照片（保存后将保留）</div>`
    : `<div style="margin-top:14px;padding:10px;background:var(--bg-input);border-radius:6px;text-align:center;cursor:pointer;" onclick="showExamCamera()">
        <div style="font-size:28px;margin-bottom:4px;">📷</div>
        <div style="font-size:11px;color:var(--text-muted);">拍照 OCR 识别并保存报告照片</div>
      </div>`;

  document.getElementById('page-add-exam').innerHTML = `
    <div class="edit-section" id="examFormContainer">
      <div class="form-group">
        <label class="form-label">体检日期 *</label>
        <input class="form-input" id="ae-date" value="${existing ? existing.date : ''}" placeholder="如：2026-07-14" type="date">
      </div>
      <div class="form-group">
        <label class="form-label">体检机构</label>
        <input class="form-input" id="ae-dept" value="${existing ? existing.dept : ''}" placeholder="如：鼓楼区社区卫生服务中心">
      </div>

      <div class="section-title" style="margin-top:14px;">
        检查项目
        <button class="add-btn" onclick="addExamItemRow()" style="font-size:11px;">+ 添加项目</button>
      </div>
      <div id="examItemsContainer">${itemsHtml}</div>

      <div class="form-group">
        <label class="form-label">综合结论</label>
        <textarea class="form-input" id="ae-conclusion" placeholder="如：血压偏高、空腹血糖超标，建议调整用药..." style="min-height:60px;resize:vertical;">${existingConclusion}</textarea>
      </div>

      ${photoSection}

      <div class="edit-actions">
        <button class="btn btn-outline" style="flex:1;" onclick="goBack()">取消</button>
        <button class="btn btn-primary" style="flex:1;" onclick="submitExam()">💾 ${editingIndex >= 0 ? '保存修改' : '添加体检记录'}</button>
      </div>
    </div>
  `;
  // Store temp exam items in a global-like array on the form container
  window._examItems = JSON.parse(JSON.stringify(items));
  window._examPhoto = existing && existing.photoData ? existing.photoData : null;
}

function addExamItemRow() {
  window._examItems.push({ k: '', v: '', unit: '', flag: 'normal' });
  renderExamItems();
}

function updateExamItem(idx, field, value) {
  if (window._examItems[idx]) {
    window._examItems[idx][field] = value;
  }
}

function renderExamItems() {
  const container = document.getElementById('examItemsContainer');
  if (!container) return;
  container.innerHTML = window._examItems.map((it, i) => `
    <div class="exam-item-row">
      <input class="form-input" value="${it.k}" placeholder="检查项目" onchange="updateExamItem(${i},'k',this.value)">
      <input class="form-input" value="${it.v}" placeholder="结果/数值" onchange="updateExamItem(${i},'v',this.value)">
      <input class="form-input" value="${it.unit || ''}" placeholder="单位" style="max-width:60px;" onchange="updateExamItem(${i},'unit',this.value)">
      <select class="form-select" onchange="updateExamItem(${i},'flag',this.value)">
        <option value="normal" ${it.flag==='normal'?'selected':''}>正常</option>
        <option value="high" ${it.flag==='high'?'selected':''}>偏高</option>
        <option value="abnormal" ${it.flag==='abnormal'?'selected':''}>异常</option>
      </select>
    </div>
  `).join('');
  container.innerHTML += `
    <div style="text-align:right;margin-top:6px;">
      <button class="btn btn-sm btn-outline" onclick="window._examItems.pop();renderExamItems();" style="font-size:10px;">🗑 删除最后一项</button>
    </div>
  `;
}

// ============================================================
// EXAM PHOTO OCR FLOW (3-step: 拍照 → OCR → 确认填入)
// ============================================================
function showExamCamera() {
  examOcrStep = 0;
  // Save current form items before switching view
  const ce = document.getElementById('ae-conclusion');
  window._examPhotoTempConclusion = ce ? ce.value : '';
  document.getElementById('page-add-exam').innerHTML = `
    <div class="edit-section">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px;">📷 拍照采集体检报告</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:16px;">
        对体检报告单拍照，系统将自动识别各项检查指标
      </div>
      <div class="camera-frame" onclick="simulateExamPhotoOcr()">
        <div class="camera-inner">
          <div class="camera-icon">📄</div>
          <div class="camera-hint">点击拍照采集</div>
          <div class="camera-sub">支持血常规、生化、尿常规等体检报告单</div>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" style="flex:1;" onclick="cancelExamPhoto()">取消</button>
        <button class="btn btn-outline btn-sm" style="flex:1;color:var(--text-muted);" onclick="cancelExamPhoto()">跳过，手动录入</button>
      </div>
    </div>
  `;
}

function cancelExamPhoto() {
  examOcrStep = 0;
  examOcrPhotoData = null;
  // Re-render the exam form with saved items
  renderAddExam();
}

function simulateExamPhotoOcr() {
  const dept = document.getElementById('ae-dept') ? document.getElementById('ae-dept').value : '社区中心';
  const date = document.getElementById('ae-date') ? document.getElementById('ae-date').value : new Date().toISOString().slice(0,10);
  
  examOcrPhotoData = { hospital: dept || '社区中心', date: date, dept: '体检报告', type: '体检报告' };

  // Show scanning animation briefly, then result
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
  setTimeout(showExamOcrResult, 1500);
}

function showExamOcrResult() {
  examOcrStep = 1;
  const d = examOcrPhotoData;
  const items = [
    { k: '空腹血糖', v: '6.8', unit: 'mmol/L', flag: 'high' },
    { k: '糖化血红蛋白', v: '7.2', unit: '%', flag: 'abnormal' },
    { k: '总胆固醇', v: '4.8', unit: 'mmol/L', flag: 'normal' },
    { k: '甘油三酯', v: '1.92', unit: 'mmol/L', flag: 'high' }
  ];
  window._examOcrItems = JSON.parse(JSON.stringify(items));

  document.getElementById('page-add-exam').innerHTML = `
    <div class="edit-section">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">✅ OCR识别完成，请核对并修正</div>

      <div class="ocr-photo-preview" onclick="showExamOcrPhotoPreview()">
        <div class="ocr-photo-thumb">
          ${renderSimulatedRecordPhoto(d)}
        </div>
        <div class="ocr-photo-label">📷 点击查看原始照片</div>
      </div>

      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;">
        🟠 橙色边框字段为 OCR 自动识别，可点击编辑修改
      </div>

      <div id="examOcrItemsContainer">
        ${window._examOcrItems.map((it, i) => `
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
        `).join('')}
      </div>

      <div class="form-group" style="margin-top:12px;">
        <label class="form-label">综合结论</label>
        <textarea class="form-input auto-filled" id="exam-ocr-conclusion" style="min-height:60px;resize:vertical;">糖化血红蛋白偏高需关注长期血糖控制，甘油三酯和空腹血糖临界偏高，建议加强饮食和运动管理</textarea>
      </div>

      <div class="edit-actions">
        <button class="btn btn-outline" style="flex:1;" onclick="showExamCamera()">↩ 重新拍照</button>
        <button class="btn btn-primary" style="flex:1;" onclick="confirmExamOcr()">✅ 确认填入</button>
      </div>
    </div>
  `;
}

function updateExamOcrItem(idx, field, value) {
  if (window._examOcrItems && window._examOcrItems[idx]) {
    window._examOcrItems[idx][field] = value;
  }
}

function confirmExamOcr() {
  // Transfer OCR items + conclusion to the main exam form
  window._examItems = JSON.parse(JSON.stringify(window._examOcrItems || []));
  window._examPhoto = examOcrPhotoData;

  const ocrConc = document.getElementById('exam-ocr-conclusion');
  if (ocrConc) window._examPhotoTempConclusion = ocrConc.value;

  examOcrStep = 0;
  examOcrPhotoData = null;
  window._examOcrItems = null;

  // Re-render the exam form with filled items
  renderAddExam();
  // Set conclusion
  setTimeout(() => {
    const ce = document.getElementById('ae-conclusion');
    if (ce && window._examPhotoTempConclusion) { ce.value = window._examPhotoTempConclusion; }
  }, 100);
  showToast('✅ OCR结果已填入表单，请核对后保存');
}

function showExamOcrPhotoPreview() {
  if (!examOcrPhotoData) return;
  let overlay = document.getElementById('photo-preview-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'photo-preview-overlay';
    overlay.className = 'photo-overlay';
    overlay.onclick = function(ev) { if (ev.target === overlay) hidePhotoPreview(); };
    document.body.appendChild(overlay);
  }
  const d = examOcrPhotoData;
  overlay.innerHTML = `
    <div class="photo-modal">
      <div class="photo-modal-header">
        <span>📷 ${d.hospital} · ${d.date} 原始体检报告</span>
        <button class="photo-close-btn" onclick="hidePhotoPreview()">✕</button>
      </div>
      <div class="photo-modal-body">
        ${renderSimulatedRecordPhoto(d)}
      </div>
      <div class="photo-modal-footer">
        <div style="font-size:11px;color:var(--text-secondary);">OCR已识别 · ${d.dept}</div>
        <button class="btn btn-outline btn-sm" onclick="hidePhotoPreview()">关闭</button>
      </div>
    </div>
  `;
  overlay.style.display = 'flex';
}

function hidePhotoPreview() {
  const overlay = document.getElementById('photo-preview-overlay');
  if (overlay) { overlay.style.display = 'none'; }
}

function submitExam() {
  const r = currentResident;
  const date = document.getElementById('ae-date').value;
  if (!date) { showToast('⚠️ 请选择体检日期'); return; }
  const items = window._examItems.filter(it => it.k.trim());
  const conclusionEl = document.getElementById('ae-conclusion');
  const conclusion = conclusionEl ? conclusionEl.value.trim() : '';
  const data = {
    date: date,
    dept: document.getElementById('ae-dept').value.trim() || '社区中心',
    items: items,
    conclusion: conclusion
  };
  // Carry photo data if present
  if (window._examPhoto) {
    data.hasPhoto = true;
    data.photoData = window._examPhoto;
  }
  if (data.items.length === 0) { showToast('⚠️ 请至少添加一项检查项目'); return; }
  if (editingIndex >= 0) {
    const oldExam = r.records.exams[editingIndex];
    if (oldExam.hasPhoto && !data.hasPhoto) { data.hasPhoto = true; data.photoData = oldExam.photoData; }
    r.records.exams[editingIndex] = data;
  } else {
    r.records.exams.unshift(data);
  }
  window._examItems = [];
  window._examPhoto = null;
  showToast(editingIndex >= 0 ? '✅ 体检记录已更新' : '✅ 体检记录已添加');
  setTimeout(() => { editingIndex = -1; navigateTo('detail'); }, 800);
}

// ============================================================
// BP TREND CHART
// ============================================================
function switchTrendIndicator(indicatorName) {
  currentTrendIndicator = indicatorName;
  const r = currentResident;
  if (r) {
    // Re-render the exam section to update chart
    navigateTo('detail');
  }
}

function renderTrendChart(name, data) {
  // data: [{ date, value, value2?, unit }, ...] — value2 only for 血压
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const W = 340, H = 140, PAD = { top: 20, right: 16, bottom: 28, left: 36 };
  const pw = W - PAD.left - PAD.right, ph = H - PAD.top - PAD.bottom;

  const isBP = !!(sorted[0] && sorted[0].value2 !== undefined);
  const allVals = isBP
    ? sorted.flatMap(d => [d.value, d.value2])
    : sorted.map(d => d.value);
  const yMin = Math.floor(Math.min(...allVals) / 10) * 10 - 5;
  const yMax = Math.ceil(Math.max(...allVals) / 10) * 10 + 5;
  const yRange = yMax - yMin;

  const toX = i => PAD.left + (sorted.length > 1 ? (i / (sorted.length - 1)) * pw : pw / 2);
  const toY = v => PAD.top + ph - ((v - yMin) / yRange) * ph;

  const dateLabels = sorted.map(d => d.date.slice(5));
  const unit = sorted[0] ? sorted[0].unit : '';

  // Y-axis ticks
  const yTicks = [];
  const step = yRange <= 30 ? 5 : (yRange <= 80 ? 10 : 20);
  for (let v = Math.floor(yMin / step) * step; v <= yMax; v += step) yTicks.push(v);

  const chartLines = isBP ? `
    <polyline points="${sorted.map((d, i) => `${toX(i)},${toY(d.value2)}`).join(' ')}" fill="none" stroke="#00B578" stroke-width="2" stroke-linejoin="round"/>
    <polyline points="${sorted.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')}" fill="none" stroke="#F53F3F" stroke-width="2" stroke-linejoin="round"/>`
    : `
    <polyline points="${sorted.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')}" fill="none" stroke="#F53F3F" stroke-width="2.5" stroke-linejoin="round"/>`;

  const chartDots = isBP
    ? sorted.map((d, i) => `
      <circle cx="${toX(i)}" cy="${toY(d.value)}" r="3" fill="#F53F3F"/>
      <circle cx="${toX(i)}" cy="${toY(d.value2)}" r="3" fill="#00B578"/>
      <text x="${toX(i)}" y="${toY(d.value) - 6}" text-anchor="middle" font-size="8" fill="#F53F3F" font-weight="600">${d.value}</text>
      <text x="${toX(i)}" y="${toY(d.value2) - 6}" text-anchor="middle" font-size="8" fill="#00B578" font-weight="600">${d.value2}</text>
    `).join('')
    : sorted.map((d, i) => `
      <circle cx="${toX(i)}" cy="${toY(d.value)}" r="3.5" fill="#F53F3F"/>
      <text x="${toX(i)}" y="${toY(d.value) - 6}" text-anchor="middle" font-size="8" fill="#F53F3F" font-weight="600">${d.value}</text>
    `).join('');

  const legend = isBP
    ? `<div class="exam-trend-legend"><span style="color:#F53F3F;">● 收缩压</span><span style="color:#00B578;">● 舒张压</span></div>`
    : `<div class="exam-trend-legend"><span style="color:#F53F3F;">● ${name}${unit ? ' (' + unit + ')' : ''}</span></div>`;

  return `
    <div class="exam-trend-section">
      <div class="exam-trend-title">📈 ${name}趋势（历次体检）</div>
      <div class="exam-trend-chart">
        <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;">
          ${yTicks.map(v => {
            const yy = toY(v);
            return `<line x1="${PAD.left}" y1="${yy}" x2="${W - PAD.right}" y2="${yy}" stroke="#EBEDF0" stroke-width="0.5"/>
            <text x="${PAD.left - 4}" y="${yy + 3}" text-anchor="end" font-size="8" fill="#86909C">${v}</text>`;
          }).join('')}
          ${sorted.map((d, i) => {
            const xx = toX(i);
            return `<text x="${xx}" y="${H - 6}" text-anchor="middle" font-size="8" fill="#86909C">${dateLabels[i]}</text>`;
          }).join('')}
          ${chartLines}
          ${chartDots}
        </svg>
      </div>
      ${legend}
    </div>
  `;
}

// ============================================================
// EXAM PHOTO PREVIEW
// ============================================================
function previewExamPhoto(index) {
  const r = currentResident;
  if (!r || !r.records.exams) return;
  const e = r.records.exams[index];
  if (!e) return;
  if (!e.photoUrl && !e.photoData) return;

  let overlay = document.getElementById('photo-preview-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'photo-preview-overlay';
    overlay.className = 'photo-overlay';
    overlay.onclick = function(ev) { if (ev.target === overlay) hidePhotoPreview(); };
    document.body.appendChild(overlay);
  }

  const photoContent = e.photoUrl
    ? `<img src="${e.photoUrl}" alt="体检报告" class="real-photo">`
    : renderSimulatedRecordPhoto(e.photoData);

  const headerInfo = e.photoUrl
    ? `📷 ${e.dept} · ${e.date} 原始体检报告`
    : `📷 ${e.photoData.hospital || e.dept} · ${e.photoData.date || e.date} 原始体检报告`;

  overlay.innerHTML = `
    <div class="photo-modal">
      <div class="photo-modal-header">
        <span>${headerInfo}</span>
        <button class="photo-close-btn" onclick="hidePhotoPreview()">✕</button>
      </div>
      <div class="photo-modal-body">${photoContent}</div>
      <div class="photo-modal-footer">
        <div style="font-size:11px;color:var(--text-secondary);">体检日期：${e.date} · ${e.dept}</div>
        <button class="btn btn-outline btn-sm" onclick="hidePhotoPreview()">关闭</button>
      </div>
    </div>
  `;
  overlay.style.display = 'flex';
}

// ============================================================
// ADD/EDIT: 随访记录
// ============================================================

function renderAddFollowup() {
  const r = currentResident;
  const existing = editingIndex >= 0 ? r.records.followups[editingIndex] : null;
  const hasHT = r.tags.includes('hypertension');
  const hasDM = r.tags.includes('diabetes');
  const defaultType = existing ? existing.type : (hasHT ? '高血压随访' : (hasDM ? '糖尿病随访' : '常规随访'));

  // Hypertension-specific fields
  const htFields = defaultType === '高血压随访' || (existing && existing.bp) ? '' : 'style="display:none;"';
  const dmFields = defaultType === '糖尿病随访' || (existing && existing.fbg) ? '' : 'style="display:none;"';

  document.getElementById('page-add-followup').innerHTML = `
    <div class="edit-section">
      <div class="form-group">
        <label class="form-label">随访类型 *</label>
        <select class="form-select" id="af-type" onchange="toggleFollowupFields()">
          <option value="高血压随访" ${defaultType==='高血压随访'?'selected':''}>高血压随访</option>
          <option value="糖尿病随访" ${defaultType==='糖尿病随访'?'selected':''}>糖尿病随访</option>
          <option value="常规随访" ${defaultType==='常规随访'?'selected':''}>常规随访</option>
          <option value="冠心病随访" ${defaultType==='冠心病随访'?'selected':''}>冠心病随访</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">随访日期 *</label>
        <input class="form-input" id="af-date" value="${existing ? existing.date : ''}" type="date">
      </div>

      <div id="af-ht-fields" ${defaultType==='高血压随访' || defaultType==='冠心病随访' ? '' : 'style="display:none;"'}>
        <div class="section-title" style="margin-top:14px;">血压指标</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">收缩压 (mmHg)</label>
            <input class="form-input" id="af-bp-sys" value="${existing && existing.bp ? existing.bp.split('/')[0] : ''}" placeholder="高压" type="number">
          </div>
          <div class="form-group">
            <label class="form-label">舒张压 (mmHg)</label>
            <input class="form-input" id="af-bp-dia" value="${existing && existing.bp ? existing.bp.split('/')[1] : ''}" placeholder="低压" type="number">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">心率 (bpm)</label>
          <input class="form-input" id="af-hr" value="${existing && existing.hr ? existing.hr : ''}" placeholder="次/分" type="number">
        </div>
      </div>

      <div id="af-dm-fields" ${defaultType==='糖尿病随访' ? '' : 'style="display:none;"'}>
        <div class="section-title" style="margin-top:14px;">血糖指标</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">空腹血糖 (mmol/L)</label>
            <input class="form-input" id="af-fbg" value="${existing && existing.fbg ? existing.fbg : ''}" placeholder="mmol/L">
          </div>
          <div class="form-group">
            <label class="form-label">糖化血红蛋白 (%)</label>
            <input class="form-input" id="af-hba1c" value="${existing && existing.hba1c ? existing.hba1c : ''}" placeholder="%">
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-top:8px;">
        <label class="form-label">用药情况</label>
        <input class="form-input" id="af-drug" value="${existing && existing.drug ? existing.drug : ''}" placeholder="如：硝苯地平 30mg qd">
      </div>
      <div class="form-group">
        <label class="form-label">随访备注</label>
        <textarea class="form-textarea" id="af-note" placeholder="如：医嘱、下次随访建议">${existing && existing.note ? existing.note : ''}</textarea>
      </div>

      <div class="edit-actions">
        <button class="btn btn-outline" style="flex:1;" onclick="goBack()">取消</button>
        <button class="btn btn-primary" style="flex:1;" onclick="submitFollowup()">💾 ${editingIndex >= 0 ? '保存修改' : '添加随访记录'}</button>
      </div>
    </div>
  `;
}

function toggleFollowupFields() {
  const type = document.getElementById('af-type').value;
  document.getElementById('af-ht-fields').style.display = (type === '高血压随访' || type === '冠心病随访') ? '' : 'none';
  document.getElementById('af-dm-fields').style.display = (type === '糖尿病随访') ? '' : 'none';
}

function submitFollowup() {
  const r = currentResident;
  const type = document.getElementById('af-type').value;
  const date = document.getElementById('af-date').value;
  if (!date) { showToast('⚠️ 请选择随访日期'); return; }
  const data = {
    type: type,
    date: date,
    drug: document.getElementById('af-drug').value.trim() || '未记录',
    note: document.getElementById('af-note').value.trim() || '无'
  };
  if (type === '高血压随访' || type === '冠心病随访') {
    const sys = document.getElementById('af-bp-sys').value;
    const dia = document.getElementById('af-bp-dia').value;
    data.bp = (sys && dia) ? `${sys}/${dia}` : '';
    data.hr = document.getElementById('af-hr').value || '';
  }
  if (type === '糖尿病随访') {
    data.fbg = document.getElementById('af-fbg').value || '';
    data.hba1c = document.getElementById('af-hba1c').value || '';
  }
  if (editingIndex >= 0) {
    r.records.followups[editingIndex] = data;
  } else {
    r.records.followups.push(data);
  }
  showToast(editingIndex >= 0 ? '✅ 随访记录已更新' : '✅ 随访记录已添加');
  setTimeout(() => { editingIndex = -1; navigateTo('detail'); }, 800);
}

// ============================================================
// ADD: 外院档案（OCR 拍照 → 识别确认 → 保存 + 照片绑定）
// ============================================================

let externalOcrStep = 0; // 0=拍照引导, 1=OCR识别结果+修正确认
let externalOcrPhotoData = null; // 模拟照片的 base64 数据

function renderAddExternal() {
  externalOcrStep = 0;
  externalOcrPhotoData = null;
  showExternalCamera();
}

function showExternalCamera() {
  externalOcrStep = 0;
  document.getElementById('page-add-external').innerHTML = `
    <div class="edit-section">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px;">📷 拍照采集外院病历 / 出院小结</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:16px;">
        对就诊记录、出院小结或检查报告拍照，系统将自动识别关键信息
      </div>

      <div class="camera-frame" onclick="simulateExternalOcr()">
        <div class="camera-inner">
          <div class="camera-icon">📄</div>
          <div class="camera-hint">点击拍照采集</div>
          <div class="camera-sub">支持病历、出院小结、检查报告单等</div>
        </div>
      </div>

      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" style="flex:1;" onclick="goBack()">取消</button>
        <button class="btn btn-outline btn-sm" style="flex:1;color:var(--text-muted);" onclick="goToExternalForm()">跳过，手动录入</button>
      </div>
    </div>
  `;
}

function simulateExternalOcr() {
  // 模拟OCR识别，生成一张"病历照片"
  const now = new Date();
  const dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  
  // 根据当前客户生成差异化模拟数据
  const customer = getCurrentCustomer();
  const resident = currentResident;
  const isHypertension = resident && resident.tags && resident.tags.includes('hypertension');
  const isDiabetes = resident && resident.tags && resident.tags.includes('diabetes');
  const isCHD = resident && resident.tags && resident.tags.includes('chd');

  let mockHospital = '南京市鼓楼医院';
  let mockDept = '心内科';
  let mockDiagnosis = '高血压病';
  let mockDoctor = '王主任';
  let mockSummary = '常规复诊，血压控制情况一般，建议调整降压药物方案，加强饮食管理';
  let mockType = '门诊';

  if (isDiabetes) {
    mockDiagnosis = '高血压病，2型糖尿病';
    mockSummary = '血压偏高，空腹血糖7.8mmol/L，糖化血红蛋白7.1%，建议加强血糖监测和饮食控制';
  }
  if (isCHD) {
    mockDiagnosis = '冠状动脉粥样硬化性心脏病，支架术后';
    mockSummary = '支架术后常规复查，心功能可，建议继续双联抗血小板+他汀方案，3个月后复查';
  }

  // 生成模拟照片（用SVG表示）
  externalOcrPhotoData = {
    hospital: mockHospital, dept: mockDept, date: dateStr,
    doctor: mockDoctor, diagnosis: mockDiagnosis, summary: mockSummary,
    type: mockType
  };

  showOcrExternalResult();
}

function showOcrExternalResult() {
  externalOcrStep = 1;
  const d = externalOcrPhotoData;
  document.getElementById('page-add-external').innerHTML = `
    <div class="edit-section">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">✅ OCR识别完成，请核对并修正</div>
      
      <!-- 照片预览区 -->
      <div class="ocr-photo-preview" onclick="showPhotoPreview()">
        <div class="ocr-photo-thumb">
          ${renderSimulatedRecordPhoto(d)}
        </div>
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
            <option value="门诊"${d.type==='门诊'?' selected':''}>门诊</option>
            <option value="住院"${d.type==='住院'?' selected':''}>住院</option>
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

function goToExternalForm() {
  externalOcrStep = 2;
  externalOcrPhotoData = null;
  document.getElementById('page-add-external').innerHTML = `
    <div class="edit-section">
      <div style="font-size:13px;font-weight:600;margin-bottom:10px;">✍️ 手动录入外院就诊记录</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:14px;">
        或 <a href="javascript:void(0)" onclick="showExternalCamera()" style="color:var(--primary);">返回拍照采集</a>
      </div>
      <div class="form-group">
        <label class="form-label">医院名称 *</label>
        <input class="form-input" id="ae-hospital" placeholder="如：鼓楼医院">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">就诊日期 *</label>
          <input class="form-input" id="ae-date" type="date">
        </div>
        <div class="form-group">
          <label class="form-label">就诊类型 *</label>
          <select class="form-select" id="ae-type">
            <option value="门诊">门诊</option>
            <option value="住院">住院</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">就诊科室 *</label>
          <input class="form-input" id="ae-dept" placeholder="如：心内科">
        </div>
        <div class="form-group">
          <label class="form-label">主治医生</label>
          <input class="form-input" id="ae-doctor" placeholder="如：王主任">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">诊断结果 *</label>
        <input class="form-input" id="ae-diagnosis" placeholder="如：高血压3级，2型糖尿病">
      </div>
      <div class="form-group">
        <label class="form-label">就诊摘要</label>
        <textarea class="form-textarea" id="ae-summary" placeholder="如：调整降压方案，建议24h动态血压监测..." style="height:80px;"></textarea>
      </div>
      <div class="edit-actions">
        <button class="btn btn-outline" style="flex:1;" onclick="goBack()">取消</button>
        <button class="btn btn-primary" style="flex:1;" onclick="submitExternal()">💾 保存外院记录</button>
      </div>
    </div>
  `;
}

// 模拟的病历/出院小结照片渲染
function renderSimulatedRecordPhoto(d) {
  return `
    <div class="sim-record">
      <div class="sim-record-header">🏥 ${d.hospital}</div>
      <div class="sim-record-body">
        <div class="sim-row"><span>姓名：</span><span class="sim-redact">${currentResident ? currentResident.name : '***'}</span></div>
        <div class="sim-row"><span>科室：</span><span>${d.dept}</span></div>
        <div class="sim-row"><span>日期：</span><span>${d.date}</span></div>
        <div class="sim-row"><span>类型：</span><span>${d.type}</span></div>
        <div class="sim-line"></div>
        <div class="sim-row"><span>医生：</span><span>${d.doctor}</span></div>
        <div class="sim-row sim-diag"><span>诊断：</span><strong>${d.diagnosis}</strong></div>
        <div class="sim-line"></div>
        <div class="sim-summary">${d.summary}</div>
      </div>
    </div>
  `;
}

function showPhotoPreview() {
  if (!externalOcrPhotoData) return;
  const d = externalOcrPhotoData;
  
  let overlay = document.getElementById('photo-preview-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'photo-preview-overlay';
    overlay.className = 'photo-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) hidePhotoPreview(); };
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="photo-modal">
      <div class="photo-modal-header">
        <span>📷 原始病历照片</span>
        <button class="photo-close-btn" onclick="hidePhotoPreview()">✕</button>
      </div>
      <div class="photo-modal-body">
        ${renderSimulatedRecordPhoto(d)}
      </div>
      <div class="photo-modal-footer">
        <div style="font-size:11px;color:var(--text-secondary);">🟠 OCR自动识别内容将填充到下方表单，可手工修正</div>
        <button class="btn btn-primary btn-sm" onclick="hidePhotoPreview()">确认，继续填写</button>
      </div>
    </div>
  `;
  overlay.style.display = 'flex';
}

function hidePhotoPreview() {
  const overlay = document.getElementById('photo-preview-overlay');
  if (overlay) overlay.style.display = 'none';
}

function submitExternal() {
  const r = currentResident;
  const hospital = document.getElementById('ae-hospital').value.trim();
  const date = document.getElementById('ae-date').value;
  const type = document.getElementById('ae-type').value;
  const dept = document.getElementById('ae-dept').value.trim();
  const doctor = document.getElementById('ae-doctor').value.trim();
  const diagnosis = document.getElementById('ae-diagnosis').value.trim();
  const summary = document.getElementById('ae-summary').value.trim();

  if (!hospital || !date || !dept || !diagnosis) {
    showToast('⚠️ 请填写必填项：医院名称、日期、科室、诊断');
    return;
  }

  if (!r.records.externalRecords) r.records.externalRecords = [];
  r.records.externalRecords.push({
    hospital, date, type, dept,
    doctor: doctor || '未记录',
    diagnosis,
    summary: summary || '未记录',
    hasPhoto: !!externalOcrPhotoData,
    photoData: externalOcrPhotoData || null
  });

  showToast('✅ 外院档案已添加');
  setTimeout(() => navigateTo('detail'), 800);
}

// 预览外院档案中已保存的照片
function previewExternalPhoto(index) {
  const r = currentResident;
  if (!r || !r.records.externalRecords) return;
  const er = r.records.externalRecords[index];
  if (!er || (!er.photoData && !er.photoUrl)) return;

  let overlay = document.getElementById('photo-preview-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'photo-preview-overlay';
    overlay.className = 'photo-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) hidePhotoPreview(); };
    document.body.appendChild(overlay);
  }

  const photoBody = er.photoUrl
    ? `<img src="${er.photoUrl}" alt="${er.hospital} 病历照片" class="real-photo" onclick="event.stopPropagation()">`
    : renderSimulatedRecordPhoto(er.photoData);
  const footerText = er.photoUrl
    ? `原始拍摄照片 · ${er.hospital} ${er.dept} ${er.date}`
    : `OCR已确认 · ${er.hospital} ${er.dept} ${er.date}`;

  overlay.innerHTML = `
    <div class="photo-modal">
      <div class="photo-modal-header">
        <span>📷 ${er.hospital} · ${er.date} 原始照片</span>
        <button class="photo-close-btn" onclick="hidePhotoPreview()">✕</button>
      </div>
      <div class="photo-modal-body">
        ${photoBody}
      </div>
      <div class="photo-modal-footer">
        <div style="font-size:11px;color:var(--text-secondary);">${footerText}</div>
        <button class="btn btn-outline btn-sm" onclick="hidePhotoPreview()">关闭</button>
      </div>
    </div>
  `;
  overlay.style.display = 'flex';
}

// ============================================================
// BATCH SUPPLEMENT: 补录历史数据
// ============================================================

function renderBatchSupplement() {
  const r = currentResident;
  document.getElementById('page-batch-supplement').innerHTML = `
    <div class="edit-section">
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;line-height:1.6;">
        📋 补录历史数据：可以批量补录${r.name}的历史体检记录、病史和外院档案
      </div>

      <div class="batch-section">
        <div class="batch-title">📋 批量补录病史</div>
        <div class="batch-count">当前有 ${r.records.history.length} 条病史</div>
        <div class="form-group">
          <label class="form-label">疾病名称</label>
          <input class="form-input" id="bs-h-disease" placeholder="一行一个疾病，用逗号分隔">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">确诊日期</label>
            <input class="form-input" id="bs-h-date" placeholder="如：2020-03">
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <select class="form-select" id="bs-h-status">
              <option value="treating">治疗中</option>
              <option value="stable">稳定</option>
              <option value="cured">已治愈</option>
            </select>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" style="width:100%;" onclick="batchAddHistory()">+ 批量添加病史</button>
      </div>

      <div class="batch-section">
        <div class="batch-title">📸 补录体检记录</div>
        <div class="batch-count">当前有 ${r.records.exams.length} 条体检记录</div>
        <button class="btn btn-outline btn-sm" style="width:100%;margin-bottom:6px;" onclick="navigateTo('add-exam')">+ 单条添加（含OCR）</button>
        <div style="font-size:11px;color:var(--text-muted);text-align:center;">如需单条详细录入，请使用上方的"新增体检记录"功能</div>
      </div>

      <div class="batch-section">
        <div class="batch-title">📝 补录随访记录</div>
        <div class="batch-count">当前有 ${r.records.followups.length} 条随访记录</div>
        <button class="btn btn-outline btn-sm" style="width:100%;margin-bottom:6px;" onclick="navigateTo('add-followup')">+ 单条添加</button>
        <div style="font-size:11px;color:var(--text-muted);text-align:center;">随访记录建议逐条添加以确保数据准确</div>
      </div>

      <div class="batch-section">
        <div class="batch-title">🩺 补录过敏史</div>
        <div class="batch-count">当前有 ${r.records.allergy.length} 条过敏记录</div>
        <button class="btn btn-outline btn-sm" style="width:100%;" onclick="navigateTo('add-allergy')">+ 添加过敏史</button>
      </div>

      <div class="batch-section">
        <div class="batch-title">🏥 补录外院档案</div>
        <div class="batch-count">当前有 ${r.records.externalRecords ? r.records.externalRecords.length : 0} 条外院记录</div>
        <button class="btn btn-outline btn-sm" style="width:100%;" onclick="navigateTo('add-external')">+ 添加外院档案</button>
      </div>

      <div style="margin-top:14px;text-align:center;">
        <button class="btn btn-outline" onclick="goBack()" style="width:100%;">← 返回档案详情</button>
      </div>
    </div>
  `;
}

function batchAddHistory() {
  const r = currentResident;
  const diseases = document.getElementById('bs-h-disease').value.trim();
  if (!diseases) { showToast('⚠️ 请填写疾病名称'); return; }
  const date = document.getElementById('bs-h-date').value.trim() || '未记录';
  const status = document.getElementById('bs-h-status').value;
  const names = diseases.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
  names.forEach(name => {
    r.records.history.push({ disease: name, diagnosed: date, status: status, note: '历史补录' });
  });
  showToast(`✅ 已批量添加 ${names.length} 条病史`);
  setTimeout(() => navigateTo('detail'), 800);
}

// ============================================================
// V1.2: 中间聊天区 — 发送消息 & 自动回复
// ============================================================
