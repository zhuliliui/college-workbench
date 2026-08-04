/* ============================================================
  页面 · 专注打卡计时（独立界面，位于「技能学习」之前）
  主题统计 + 今日执行 + 专注计时器 + 手动补录 + 专注时间线
  （本页面独立于万能工作台，可作为独立入口使用）
  ============================================================ */
window.Pages = window.Pages || {};
// 专注计时器运行态（模块级，跨重渲染保留；即使切到别的页面计时仍在跑）
let _focusTimer = { running: false, startTs: 0, theme: '', category: '', note: '', itemId: null, tickId: null };
let _focusPeriod = 'week'; // 主题统计默认「本周」，与截图一致

Pages.checkin = function () {
  const c = UI.$('#content');
  const s = Store.get();

  c.innerHTML = `
  <div class="welcome-banner focus-banner">
    <div class="welcome-text">
      <div class="welcome-title">专注打卡计时</div>
      <div class="welcome-sub">把每一次专注都留下痕迹：今日计划、临时任务、打卡项，一键开始计时，自动归档到时间线。</div>
    </div>
  </div>
  ${renderFocusStats(s)}
  ${renderFocusPlan(s)}
  ${renderFocusTimer(s)}
  ${renderFocusManual(s)}
  ${renderFocusTimeline(s)}`;

  // 折叠按钮：本页渲染时单独绑定（带 _wired 守卫，避免与 app.js 全局 wireCommon 重复绑定导致双切换）
  c.querySelectorAll('.collapse-btn').forEach((btn) => {
    if (btn._wired) return; btn._wired = true;
    btn.addEventListener('click', () => { const card = btn.closest('.card'); if (card) card.classList.toggle('collapsed'); });
  });

  window.PageHandler = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act && act.indexOf('f-') === 0) return handleFocusAct(act, id, b);
  };
};

/* ============================================================
  独立打卡计时模块：主题统计 + 今日执行 + 专注计时器 + 补录 + 时间线
  ============================================================ */
function pad2(n) { return String(n).padStart(2, '0'); }
function fmtTime(d) { d = (d instanceof Date) ? d : new Date(d); if (isNaN(d)) return ''; return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function fmtClock(ms) { const s = Math.max(0, Math.floor(ms / 1000)); const hh = Math.floor(s / 3600); const mm = Math.floor((s % 3600) / 60); const ss = s % 60; return pad2(hh) + ':' + pad2(mm) + ':' + pad2(ss); }
function fmtDur(ms) { const totalMin = Math.round((ms || 0) / 60000); const h = Math.floor(totalMin / 60); const m = totalMin % 60; return h > 0 ? (h + ' 小时 ' + m + ' 分') : (totalMin + ' 分钟'); }
function focusPeriodRange(p) {
  const today = D.todayStr();
  if (p === 'day') return [today, today];
  if (p === 'week') {
    const d = new Date(); const dow = (d.getDay() + 6) % 7; // 周一为一周开始
    const mon = new Date(d); mon.setDate(d.getDate() - dow);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return [D.fmtDate(mon), D.fmtDate(sun)];
  }
  const mk = D.monthKey(); const [y, m] = mk.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  return [mk + '-01', mk + '-' + pad2(days)];
}

function startFocusTimer(theme, category, note, itemId) {
  if (_focusTimer.running) return;
  _focusTimer.theme = theme || '专注';
  _focusTimer.category = category || '';
  _focusTimer.note = note || '';
  _focusTimer.itemId = itemId || null;
  _focusTimer.startTs = Date.now();
  _focusTimer.running = true;
  if (_focusTimer.tickId) clearInterval(_focusTimer.tickId);
  _focusTimer.tickId = setInterval(() => {
    const el = UI.$('#fTimer'); if (el) el.textContent = fmtClock(Date.now() - _focusTimer.startTs);
  }, 1000);
  Pages.checkin();
}
function stopFocusTimer(abandoned) {
  if (!_focusTimer.running) return;
  if (_focusTimer.tickId) { clearInterval(_focusTimer.tickId); _focusTimer.tickId = null; }
  const dur = Date.now() - _focusTimer.startTs;
  const theme = _focusTimer.theme;
  const category = _focusTimer.category;
  const note = _focusTimer.note;
  const itemId = _focusTimer.itemId;
  Store.update((st) => {
    st.focus.sessions.push({ id: Store.uid(), theme, category, note, start: _focusTimer.startTs, end: Date.now(), dur, abandoned: !!abandoned });
    // 结束专注且未放弃时，自动完成对应打卡项
    if (!abandoned && itemId) {
      const it = (st.discipline.items || []).find((x) => x.id === itemId);
      if (it && !it.records[D.todayStr()]) { it.records[D.todayStr()] = true; }
    }
  });
  _focusTimer.running = false; _focusTimer.theme = ''; _focusTimer.category = ''; _focusTimer.note = ''; _focusTimer.itemId = null; _focusTimer.startTs = 0;
  Pages.checkin();
}

function handleFocusAct(act, id, b) {
  const s = Store.get();
  const rerender = () => Pages.checkin();

  if (act === 'f-period') { _focusPeriod = b.dataset.p || 'week'; rerender(); return; }

  if (act === 'f-start') {
    const custom = UI.$('#fThemeCustom'); const sel = UI.$('#fTheme'); const cat = UI.$('#fCategory'); const note = UI.$('#fNote');
    const theme = (custom && custom.value.trim()) || (sel && sel.value) || '专注';
    const itemId = sel ? (sel.options[sel.selectedIndex].dataset.id || '') : '';
    const category = cat ? cat.value : '';
    const noteText = note ? note.value.trim() : '';
    startFocusTimer(theme, category, noteText, itemId); return;
  }
  if (act === 'f-stop') { stopFocusTimer(false); return; }
  if (act === 'f-abort') { stopFocusTimer(true); return; }

  if (act === 'f-add-temp') {
    const inp = UI.$('#fTempInput'); const name = inp ? inp.value.trim() : '';
    if (!name) return UI.toast('请输入临时任务', 'warn');
    Store.update((st) => { st.discipline.tempTasks.push({ id: Store.uid(), name, done: false, doneAt: null }); });
    rerender(); return;
  }
  if (act === 'f-done-temp') {
    const t = (s.discipline.tempTasks || []).find((x) => x.id === id); if (!t) return;
    Store.update((st) => { const x = st.discipline.tempTasks.find((y) => y.id === id); x.done = !x.done; x.doneAt = x.done ? new Date().toISOString() : null; });
    rerender(); return;
  }
  if (act === 'f-del-temp') {
    Store.update((st) => { st.discipline.tempTasks = (st.discipline.tempTasks || []).filter((x) => x.id !== id); });
    rerender(); return;
  }
  if (act === 'f-start-temp') {
    const t = (s.discipline.tempTasks || []).find((x) => x.id === id); if (!t) return;
    const cat = UI.$('#fCategory');
    startFocusTimer(t.name, cat ? cat.value : '', '', null); return;
  }
  if (act === 'f-done-plan') {
    const t = s.tasks.find((x) => x.id === id); if (!t) return;
    const was = t.done; const will = !was;
    Store.update((st) => { const x = st.tasks.find((y) => y.id === id); x.done = will; x.doneAt = will ? new Date().toISOString() : null; });
    if (will) Store.earn(1, '完成学习复习任务'); else if (was) Store.deduct(1, '取消完成任务');
    rerender(); return;
  }
  if (act === 'f-start-plan') {
    const t = s.tasks.find((x) => x.id === id); if (!t) return;
    const cat = UI.$('#fCategory');
    startFocusTimer(t.name, t.category || (cat ? cat.value : ''), '', null); return;
  }
  if (act === 'f-edit-plan') {
    const t = s.tasks.find((x) => x.id === id); if (!t) return;
    UI.openModal({ title: '修改今日任务', body: `<div class="field"><label>任务名称</label><input class="input" id="fPlanName" value="${UI.esc(t.name)}"/></div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
      { label: '保存', onClick: () => {
        const name = UI.val('#fPlanName'); if (!name) return UI.toast('请输入名称', 'warn');
        Store.update((st) => { const x = st.tasks.find((y) => y.id === id); x.name = name; });
        UI.closeModal(); rerender();
      } }] });
    setTimeout(() => { const el = UI.$('#fPlanName'); if (el) el.focus(); }, 50);
    return;
  }
  if (act === 'f-check') {
    const it = s.discipline.items.find((x) => x.id === id); if (!it) return;
    const was = !!it.records[D.todayStr()];
    Store.update((st) => { const x = st.discipline.items.find((y) => y.id === id); if (x.records[D.todayStr()]) delete x.records[D.todayStr()]; else x.records[D.todayStr()] = true; });
    if (!was) { Store.earn(1, '自律打卡'); UI.toast('打卡成功 +1 金币', 'ok'); }
    else { Store.deduct(1, '取消自律打卡'); UI.toast('已取消打卡，-1 金币', 'warn'); }
    rerender(); return;
  }
  if (act === 'f-start-item') {
    const it = s.discipline.items.find((x) => x.id === id); if (!it) return;
    startFocusTimer(it.name, '', '', it.id); return;
  }
  if (act === 'f-counter') {
    const key = b.dataset.k;
    Store.update((st) => {
      const today = D.todayStr();
      st.discipline.counters = st.discipline.counters || {};
      st.discipline.counters[today] = st.discipline.counters[today] || {};
      st.discipline.counters[today][key] = (st.discipline.counters[today][key] || 0) + 1;
    });
    UI.toast('已记录 +1', 'ok');
    rerender(); return;
  }
  if (act === 'f-add-manual') {
    const date = UI.val('#fManDate'); const start = UI.val('#fManStart'); const end = UI.val('#fManEnd');
    const theme = UI.val('#fManTheme'); const category = UI.val('#fManCategory'); const note = UI.val('#fManNote');
    if (!date || !start || !end || !theme) return UI.toast('请填写日期、起止时间和主题', 'warn');
    const startTs = new Date(date + 'T' + start).getTime();
    const endTs = new Date(date + 'T' + end).getTime();
    if (isNaN(startTs) || isNaN(endTs) || endTs <= startTs) return UI.toast('结束时间必须晚于开始时间', 'warn');
    Store.update((st) => {
      st.focus.sessions.push({ id: Store.uid(), theme, category, note, start: startTs, end: endTs, dur: endTs - startTs, abandoned: false });
    });
    rerender(); return;
  }
  if (act === 'f-del-session') {
    Store.update((st) => { st.focus.sessions = (st.focus.sessions || []).filter((x) => x.id !== id); });
    rerender(); return;
  }
}

function renderFocusStats(s) {
  const [ps, pe] = focusPeriodRange(_focusPeriod);
  const inP = (ds) => ds >= ps && ds <= pe;
  const periodText = _focusPeriod === 'day' ? '今日' : _focusPeriod === 'week' ? '本周' : '本月';
  const periodDateText = _focusPeriod === 'day' ? ps : _focusPeriod === 'week' ? `${ps} ~ ${pe}` : `${ps.slice(0,7)}`;

  let focusMs = 0;
  (s.focus.sessions || []).forEach((x) => { if (x.abandoned) return; const ds = D.fmtDate(new Date(x.start)); if (inP(ds)) focusMs += (x.dur || 0); });

  const items = s.discipline.items || [];
  const checkDays = new Set();
  items.forEach((it) => { Object.keys(it.records || {}).forEach((dt) => { if (inP(dt)) checkDays.add(dt); }); });

  // 习惯均值：区间内每天打卡完成率平均
  const dayList = [];
  let cur = new Date(ps); const last = new Date(pe);
  while (cur <= last) { dayList.push(D.fmtDate(cur)); cur.setDate(cur.getDate() + 1); }
  let habitSum = 0, habitCount = 0;
  if (items.length) {
    dayList.forEach((ds) => {
      const done = items.filter((it) => (it.records || {})[ds]).length;
      habitSum += done / items.length; habitCount++;
    });
  }
  const habitAvg = habitCount ? Math.round((habitSum / habitCount) * 100) : 0;

  let care = 0, mentor = 0, submit = 0;
  Object.keys(s.discipline.counters || {}).forEach((dt) => {
    if (!inP(dt)) return;
    const c = s.discipline.counters[dt];
    care += c.care || 0; mentor += c.mentor || 0; submit += c.submit || 0;
  });

  let reviewCount = 0;
  Object.keys(s.dailySummary || {}).forEach((dt) => { if (inP(dt) && (s.dailySummary[dt] || '').trim()) reviewCount++; });

  let doneCount = 0;
  s.tasks.forEach((t) => { if (t.done && t.doneAt) { const ds = (t.doneAt || '').slice(0, 10); if (inP(ds)) doneCount++; } });
  (s.ddls || []).forEach((d) => { if (d.done && d.doneAt) { const ds = (d.doneAt || '').slice(0, 10); if (inP(ds)) doneCount++; } });

  const stats = [
    { key:'focus', label:`${periodText}专注`, value: fmtDur(focusMs), color:'c-orange' },
    { key:'checkin', label:`${periodText}打卡`, value: checkDays.size + ' 天', color:'c-blue' },
    { key:'habit', label:`${periodText}习惯均值`, value: habitAvg + '%', color:'c-green' },
    { key:'care', label:`${periodText}心灵关怀`, value: care, color:'c-pink', plus:'care' },
    { key:'mentor', label:`${periodText}导师沟通`, value: mentor, color:'c-purple', plus:'mentor' },
    { key:'review', label:`${periodText}复盘`, value: reviewCount, color:'c-red' },
    { key:'done', label:`${periodText}完成任务`, value: doneCount, color:'c-teal' },
    { key:'submit', label:`${periodText}新增投稿`, value: submit, color:'c-gold', plus:'submit' },
  ];

  return `
  <div class="card focus-stats-card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-37.png" alt=""/>主题统计</div>
      <div class="spacer"></div>
      <span class="focus-period-label">${periodDateText}</span>
      <div class="seg">
        <button class="seg-btn ${_focusPeriod === 'day' ? 'on' : ''}" data-act="f-period" data-p="day">每日</button>
        <button class="seg-btn ${_focusPeriod === 'week' ? 'on' : ''}" data-act="f-period" data-p="week">每周</button>
        <button class="seg-btn ${_focusPeriod === 'month' ? 'on' : ''}" data-act="f-period" data-p="month">每月</button>
      </div>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="focus-stats-grid">
        ${stats.map((st) => `
          <div class="focus-stat-cell ${st.color}">
            <div class="fsc-top">
              <span class="fsc-label">${UI.esc(st.label)}</span>
              ${st.plus ? `<button class="fsc-plus" data-act="f-counter" data-k="${st.plus}" title="+1">+</button>` : ''}
            </div>
            <div class="fsc-value">${st.value}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>`;
}

function renderFocusPlan(s) {
  const today = D.todayStr();
  const isToday = (t) => !t.due || D.fmtDate(D.parseLDT(t.due)) === today;
  const planTasks = s.tasks.filter(isToday);
  const tempTasks = s.discipline.tempTasks || [];
  const items = s.discipline.items || [];

  const planHtml = planTasks.length ? planTasks.map((t) => `
    <div class="item ${t.done ? 'done' : ''}">
      <button class="check" data-act="f-done-plan" data-id="${t.id}" aria-label="完成">${t.done ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
      <div class="body"><div class="name">${UI.esc(t.name)}</div>
      <div class="meta">${t.category ? `<span class="tag">${UI.esc(t.category)}</span>` : ''}<span>${t.due ? D.fmtDateTime(D.parseLDT(t.due)) : '无截止'}</span></div></div>
      <div class="ops">
        <button class="btn btn-soft btn-icon" data-act="f-start-plan" data-id="${t.id}" title="开始专注"><img class="ic" src="assets/icons/hk-09.png" alt=""/></button>
        <button class="btn btn-soft btn-icon" data-act="f-edit-plan" data-id="${t.id}" title="修改"><img class="ic" src="assets/icons/hk-32.png" alt=""/></button>
      </div>
    </div>`).join('') : `<div class="empty soft"><div class="t">今天还没有学习计划任务</div><div class="s">在「学习复习计划」添加，会自动出现在这里</div></div>`;

  const tempHtml = tempTasks.length ? tempTasks.map((t) => `
    <div class="item ${t.done ? 'done' : ''}">
      <button class="check" data-act="f-done-temp" data-id="${t.id}" aria-label="完成">${t.done ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
      <div class="body"><div class="name">${UI.esc(t.name)}</div></div>
      <div class="ops">
        <button class="btn btn-soft btn-icon" data-act="f-start-temp" data-id="${t.id}" title="开始专注"><img class="ic" src="assets/icons/hk-09.png" alt=""/></button>
        <button class="btn btn-soft btn-icon" data-act="f-del-temp" data-id="${t.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
      </div>
    </div>`).join('') : `<div class="muted-text">还没有临时任务，可以快速添加一个</div>`;

  const checkinHtml = items.length ? items.map((it) => {
    const checked = !!it.records[today];
    const mk = D.monthKey();
    const monthCount = Object.keys(it.records || {}).filter((dt) => dt.slice(0, 7) === mk).length;
    return `<div class="item ${checked ? 'done' : ''}">
      <button class="check" data-act="f-check" data-id="${it.id}" aria-label="打卡">${checked ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
      <div class="body"><div class="name">${it.icon ? UI.esc(it.icon) : '<img class="ic" src="assets/icons/hk-06.png" alt=""/>'} ${UI.esc(it.name)}</div>
      <div class="meta"><span>本月已打卡 <b style="color:var(--primary-deep)">${monthCount}</b> 天</span></div></div>
      <div class="ops">
        <button class="btn btn-soft btn-icon" data-act="f-start-item" data-id="${it.id}" title="开始专注"><img class="ic" src="assets/icons/hk-09.png" alt=""/></button>
      </div>
    </div>`;
  }).join('') : `<div class="empty soft"><div class="t">还没有打卡项目</div><div class="s">去「自律成长」添加运动、阅读等打卡项</div></div>`;

  return `
  <div class="card focus-plan-card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>今日执行</div>
      <div class="spacer"></div>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="focus-section-label">学习复习计划 · 今日</div>
      <div class="list">${planHtml}</div>
      <div class="focus-section-label mt12">临时任务</div>
      <div class="flex-wrap gap8" style="margin:8px 0">
        <input class="input" id="fTempInput" placeholder="加一个临时任务，按回车或点添加" style="flex:1;min-width:160px"/>
        <button class="btn btn-sm" data-act="f-add-temp">新增临时任务</button>
      </div>
      <div class="list">${tempHtml}</div>
      <div class="focus-section-label mt12">打卡项目</div>
      <div class="list">${checkinHtml}</div>
    </div>
  </div>`;
}

function renderFocusTimer(s) {
  const items = s.discipline.items || [];
  const cats = s.focus.categories || ['学习', '科研', '阅读', '运动', '写作', '其他'];
  const running = _focusTimer.running;

  const themeOps = [];
  items.forEach((it) => { if (it.name) themeOps.push({ id: it.id, name: it.name }); });
  const themeSel = `<select id="fTheme" class="input focus-theme-select">` +
    (themeOps.length ? themeOps.map((o) => `<option value="${UI.esc(o.name)}" data-id="${UI.esc(o.id)}">${UI.esc(o.name)}</option>`).join('') : `<option value="">— 暂无打卡项 —</option>`) +
    `</select>`;
  const catSel = `<select id="fCategory" class="input focus-cat-select">` +
    cats.map((c) => `<option value="${UI.esc(c)}">${UI.esc(c)}</option>`).join('') +
    `</select>`;

  const timerDisplay = running ? fmtClock(Date.now() - _focusTimer.startTs) : '00:00:00';

  return `
  <div class="card focus-timer-card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-09.png" alt=""/>专注计时器</div>
      <div class="spacer"></div>
      ${running ? '<span class="tag tag-live">进行中</span>' : ''}
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="focus-timer-center">
        <div class="focus-clock" id="fTimer">${timerDisplay}</div>
        ${running ? `<div class="focus-running-theme">当前专注：<b>${UI.esc(_focusTimer.theme)}</b>${_focusTimer.category ? ` · ${_focusTimer.category}` : ''}</div>` : `<div class="focus-clock-hint">当前专注段会自动关联到进行中的任务标题</div>`}

        <div class="focus-input-row">
          <input class="input" id="fThemeCustom" placeholder="本次专注主题，可留空自动读取当前任务" style="flex:1;min-width:180px"/>
        </div>
        <div class="focus-input-row">
          ${themeSel}
          ${catSel}
        </div>
        <div class="focus-input-row">
          <input class="input" id="fNote" placeholder="备注（可选）" style="flex:1;min-width:180px"/>
        </div>

        <div class="focus-btn-group">
          ${running
            ? `<button class="btn focus-btn focus-btn-start" data-act="f-stop">结束专注</button><button class="btn focus-btn focus-btn-abort" data-act="f-abort">放弃本次</button>`
            : `<button class="btn focus-btn focus-btn-start" data-act="f-start">开始专注</button>`}
        </div>
      </div>
    </div>
  </div>`;
}

function renderFocusManual(s) {
  const today = D.todayStr();
  const cats = s.focus.categories || ['学习', '科研', '阅读', '运动', '写作', '其他'];
  const nowStr = pad2(new Date().getHours()) + ':' + pad2(new Date().getMinutes());
  return `
  <div class="card focus-manual-card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-37.png" alt=""/>手动补录</div>
      <div class="spacer"></div>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="focus-manual-grid">
        <input class="input" type="date" id="fManDate" value="${today}"/>
        <input class="input" type="time" id="fManStart" value="${nowStr}"/>
        <input class="input" type="time" id="fManEnd" value="${nowStr}"/>
        <input class="input" id="fManTheme" placeholder="补录主题"/>
        <select class="input" id="fManCategory">${cats.map((c) => `<option value="${UI.esc(c)}">${UI.esc(c)}</option>`).join('')}</select>
        <input class="input" id="fManNote" placeholder="备注（可选）"/>
      </div>
      <button class="btn btn-block mt12" data-act="f-add-manual">添加专注记录</button>
    </div>
  </div>`;
}

function renderFocusTimeline(s) {
  const today = D.todayStr();
  const todaySessions = (s.focus.sessions || []).filter((x) => D.fmtDate(new Date(x.start)) === today);
  const recHtml = todaySessions.length ? todaySessions.slice().reverse().map((x) => `
    <div class="focus-rec-row ${x.abandoned ? 'aborted' : ''}">
      <span class="fr-theme">${UI.esc(x.theme || '专注')}</span>
      <span class="fr-meta">${x.category || '其他'}${x.note ? ' · ' + UI.esc(x.note) : ''}</span>
      <span class="fr-time">${fmtTime(new Date(x.start))}–${fmtTime(new Date(x.end))}</span>
      <span class="fr-dur">${fmtDur(x.dur)}${x.abandoned ? ' · 已放弃' : ''}</span>
      <button class="btn btn-ghost btn-icon fr-del" data-act="f-del-session" data-id="${x.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
    </div>`).join('') : `<div class="muted-text">今天还没有专注记录，开始一次专注吧</div>`;

  return `
  <div class="card focus-timeline-card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-37.png" alt=""/>专注时间线</div>
      <div class="spacer"></div>
      <span class="sub">今日 ${todaySessions.length} 次</span>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="focus-records">${recHtml}</div>
    </div>
  </div>`;
}
