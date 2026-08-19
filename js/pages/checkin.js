window.Pages = window.Pages || {};
let _focusTimer = { running: false, startTs: 0, theme: '', category: '', note: '', itemId: null, type: 'focus', tickId: null };
let _focusPeriod = 'week';
const SCHEDULE_START = 6, SCHEDULE_END = 23;

Pages.checkin = function () {
  const c = UI.$('#content');
  const s = Store.get();
  const [__ps, __pe] = focusPeriodRange(_focusPeriod);
  const periodDateText = _focusPeriod === 'day' ? __ps : _focusPeriod === 'week' ? `${__ps} ~ ${__pe}` : `${__ps.slice(0,7)}`;
  c.innerHTML = `
  <div class="welcome-banner focus-banner">
    <div class="welcome-text">
      <div class="welcome-title"><img class="ic" src="assets/icons/hk-09.png" alt=""/> 主题统计</div>
      <div class="welcome-sub">${UI.esc(periodDateText)}</div>
    </div>
    <div class="focus-banner-actions">
      <div class="seg">
        <button class="seg-btn ${_focusPeriod === 'day' ? 'on' : ''}" data-act="f-period" data-p="day">每日</button>
        <button class="seg-btn ${_focusPeriod === 'week' ? 'on' : ''}" data-act="f-period" data-p="week">每周</button>
        <button class="seg-btn ${_focusPeriod === 'month' ? 'on' : ''}" data-act="f-period" data-p="month">每月</button>
      </div>
      <button class="btn btn-review" data-act="f-review">复盘</button>
    </div>
  </div>
  ${renderFocusStats(s)}
  <div class="focus-layout">
    <div class="focus-main-col">
      ${renderFocusPlan(s)}
      ${renderFocusTimer(s)}
      ${renderFocusManual(s)}
      ${renderFocusTimeline(s)}
    </div>
    <div class="focus-side-col">
      ${renderFocusSchedule(s)}
    </div>
  </div>`;

  window.PageHandler = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act && act.indexOf('f-') === 0) return handleFocusAct(act, id, b);
  };

// 兜底：APK WebView 下事件委托偶发失效，给所有 f-* 按钮直接绑一份 click（不走委托）
  c.querySelectorAll('[data-act^="f-"]').forEach((btn) => {
  if (btn._cwBound) return;
  btn.addEventListener('click', (e) => { e.stopPropagation(); const a = btn.dataset.act; if (a && a.indexOf('f-') === 0) handleFocusAct(a, btn.dataset.id || '', btn); });
  btn._cwBound = true;
  });
  const _addBtn = c.querySelector('[data-act="f-add-temp"]');
  const _tempInp = c.querySelector('#fTempInput');
  if (_tempInp && !_tempInp._cwBound) {
  _tempInp.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); handleFocusAct('f-add-temp', '', _addBtn || c.querySelector('[data-act="f-add-temp"]')); }
  });
  _tempInp._cwBound = true;
  }
};

function pad2(n) { return String(n).padStart(2, '0'); }
function fmtTime(d) { d = (d instanceof Date) ? d : new Date(d); if (isNaN(d)) return ''; return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function fmtClock(ms) { const s = Math.max(0, Math.floor(ms / 1000)); const hh = Math.floor(s / 3600); const mm = Math.floor((s % 3600) / 60); const ss = s % 60; return pad2(hh) + ':' + pad2(mm) + ':' + pad2(ss); }
function fmtDur(ms) { const totalMin = Math.round((ms || 0) / 60000); const h = Math.floor(totalMin / 60); const m = totalMin % 60; return h > 0 ? (h + ' 小时 ' + (m ? m + ' 分钟' : '')) : (totalMin + ' 分钟'); }
function fmtDurShort(ms) { const totalSec = Math.round((ms || 0) / 1000); const h = Math.floor(totalSec / 3600); const m = Math.floor((totalSec % 3600) / 60); const s = totalSec % 60; return h > 0 ? `${h}小时${pad2(m)}分` : `${m}分${pad2(s)}秒`; }
function focusPeriodRange(p) {
  const today = D.todayStr();
  if (p === 'day') return [today, today];
  if (p === 'week') {
    const d = new Date(); const dow = (d.getDay() + 6) % 7;
    const mon = new Date(d); mon.setDate(d.getDate() - dow);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return [D.fmtDate(mon), D.fmtDate(sun)];
  }
  const mk = D.monthKey(); const [y, m] = mk.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  return [mk + '-01', mk + '-' + pad2(days)];
}

function startFocusTimer(theme, category, note, itemId, type) {
  if (_focusTimer.running) return;
  _focusTimer.theme = theme || '专注';
  _focusTimer.category = category || '';
  _focusTimer.note = note || '';
  _focusTimer.itemId = itemId || null;
  _focusTimer.type = type || 'focus';
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
  Store.update((st) => {
    st.focus.sessions.push({ id: Store.uid(), theme: _focusTimer.theme, category: _focusTimer.category, note: _focusTimer.note, start: _focusTimer.startTs, end: Date.now(), dur, abandoned: !!abandoned, type: _focusTimer.type || 'focus' });
    if (!abandoned && _focusTimer.itemId) {
      const it = (st.discipline.items || []).find((x) => x.id === _focusTimer.itemId);
      if (it && !it.records[D.todayStr()]) it.records[D.todayStr()] = true;
    }
  });
  _focusTimer.running = false; _focusTimer.theme = ''; _focusTimer.category = ''; _focusTimer.note = ''; _focusTimer.itemId = null; _focusTimer.type = 'focus'; _focusTimer.startTs = 0;
  Pages.checkin();
}

function handleFocusAct(act, id, b) {
  const s = Store.get();
  const rerender = () => Pages.checkin();

  if (act === 'f-period') { _focusPeriod = b.dataset.p || 'week'; rerender(); return; }
  if (act === 'f-review') { location.hash = '#/review'; return; }
  if (act === 'f-open-study') { location.hash = '#/study'; return; }

  if (act === 'f-start') {
    const custom = UI.$('#fThemeCustom'); const note = UI.$('#fNote'); const type = UI.$('#fType');
    const theme = (custom && custom.value.trim()) || '专注';
    startFocusTimer(theme, '', note ? note.value.trim() : '', null, type ? type.value : 'focus'); return;
  }
  if (act === 'f-stop') { stopFocusTimer(false); return; }
  if (act === 'f-abort') { stopFocusTimer(true); return; }

  if (act === 'f-add-temp') {
    const inp = UI.$('#fTempInput'); const name = inp ? inp.value.trim() : '';
    if (!name) return UI.toast('请输入临时任务', 'warn');
    Store.update((st) => {
      st.discipline.tempTasks = st.discipline.tempTasks || [];
      st.discipline.tempTasks.push({ id: Store.uid(), name, done: false, doneAt: null });
    });
    // 自动写入本次主题并开始计时
    const themeInp = UI.$('#fThemeCustom');
    if (themeInp) themeInp.value = name;
    const cat = UI.$('#fCategory'), type = UI.$('#fType');
    startFocusTimer(name, cat ? cat.value : '', '', null, type ? type.value : 'focus');
    if (inp) inp.value = '';
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
    const cat = UI.$('#fCategory'), type = UI.$('#fType');
    startFocusTimer(t.name, cat ? cat.value : '', '', null, type ? type.value : 'focus'); return;
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
    const cat = UI.$('#fCategory'), type = UI.$('#fType');
    startFocusTimer(t.name, t.category || (cat ? cat.value : ''), '', null, type ? type.value : 'focus'); return;
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
    const type = UI.$('#fType');
    startFocusTimer(it.name, '', '', it.id, type ? type.value : 'focus'); return;
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
    const date = UI.val('#fManDate'); const start = UI.val('#fManStart'); const end = UI.val('#fManEnd'); const theme = UI.val('#fManTheme');
    if (!date || !start || !end || !theme) return UI.toast('请填写日期、起止时间和主题', 'warn');
    const startTs = new Date(date + 'T' + start).getTime();
    const endTs = new Date(date + 'T' + end).getTime();
    if (isNaN(startTs) || isNaN(endTs) || endTs <= startTs) return UI.toast('结束时间必须晚于开始时间', 'warn');
    Store.update((st) => { st.focus.sessions.push({ id: Store.uid(), theme, category: '', note: '', start: startTs, end: endTs, dur: endTs - startTs, abandoned: false, type: 'focus' }); });
    rerender(); return;
  }
  if (act === 'f-del-session') {
    Store.update((st) => { st.focus.sessions = (st.focus.sessions || []).filter((x) => x.id !== id); });
    rerender(); return;
  }
  if (act === 'f-add-schedule') {
    const name = UI.val('#fSchedTask'); const time = UI.val('#fSchedTime');
    if (!name || !time) return UI.toast('请选择任务和时间', 'warn');
    const startTs = new Date(today + 'T' + time).getTime();
    if (isNaN(startTs)) return UI.toast('时间无效', 'warn');
    const endTs = startTs + 3600000;
    Store.update((st) => { st.focus.sessions.push({ id: Store.uid(), theme: name, category: '', note: '', start: startTs, end: endTs, dur: 3600000, abandoned: false, type: 'schedule' }); });
    rerender(); return;
  }
}

function renderFocusStats(s) {
  const [ps, pe] = focusPeriodRange(_focusPeriod);
  const inP = (ds) => ds >= ps && ds <= pe;
  const periodText = _focusPeriod === 'day' ? '今日' : _focusPeriod === 'week' ? '本周' : '本月';
  const periodDateText = _focusPeriod === 'day' ? ps : _focusPeriod === 'week' ? `${ps} ~ ${pe}` : `${ps.slice(0,7)}`;

  let focusMs = 0, checkinMs = 0;
  (s.focus.sessions || []).forEach((x) => {
    if (x.abandoned) return;
    const t = x.type || 'focus';
    const ds = D.fmtDate(new Date(x.start));
    if (!inP(ds)) return;
    if (t === 'checkin') checkinMs += (x.dur || 0); else focusMs += (x.dur || 0);
  });

  let care = 0, mentor = 0, submit = 0;
  Object.keys(s.discipline.counters || {}).forEach((dt) => {
    if (!inP(dt)) return;
    const c = s.discipline.counters[dt];
    care += c.care || 0; mentor += c.mentor || 0; submit += c.submit || 0;
  });

  let doneCount = 0;
  s.tasks.forEach((t) => { if (t.done && t.doneAt) { const ds = (t.doneAt || '').slice(0, 10); if (inP(ds)) doneCount++; } });
  (s.ddls || []).forEach((d) => { if (d.done && d.doneAt) { const ds = (d.doneAt || '').slice(0, 10); if (inP(ds)) doneCount++; } });

  const stats = [
    { key:'focus', label:`${periodText}专注`, value: fmtDurShort(focusMs), color:'c-orange', icon:'hk-09', plus:null },
    { key:'checkin', label:`${periodText}打卡`, value: fmtDurShort(checkinMs), color:'c-blue', icon:'hk-10', plus:null },
    { key:'care', label:`${periodText}心灵关怀`, value: care, color:'c-green', icon:'hk-11', plus:'care' },
    { key:'mentor', label:`${periodText}导师沟通`, value: mentor, color:'c-purple', icon:'hk-12', plus:'mentor' },
    { key:'done', label:`${periodText}完成任务`, value: doneCount, color:'c-red', icon:'hk-13', plus:null },
    { key:'submit', label:`${periodText}新增投稿`, value: submit, color:'c-gold', icon:'hk-14', plus:'submit' },
  ];

  return `
  <div class="focus-stats-card">
    <div class="focus-stats-grid">
      ${stats.map((st) => `
        <div class="focus-stat-cell ${st.color}">
          <div class="fsc-top">
            <img class="ic-sm" src="assets/icons/${st.icon}.png" alt=""/>
            <span class="fsc-label">${UI.esc(st.label)}</span>
            ${st.plus ? `<button class="fsc-plus" data-act="f-counter" data-k="${st.plus}" title="+1">+</button>` : ''}
          </div>
          <div class="fsc-value">${st.value}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function renderFocusPlan(s) {
  const today = D.todayStr();
  const tempTasks = s.discipline.tempTasks || [];
  const items = s.discipline.items || [];

  const tempHtml = tempTasks.length ? tempTasks.map((t) => `
    <div class="fp-item ${t.done ? 'done' : ''}">
      <button class="fp-check" data-act="f-done-temp" data-id="${t.id}" aria-label="完成">${t.done ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
      <div class="fp-body"><div class="fp-name">${UI.esc(t.name)}</div></div>
      <div class="fp-ops">
        <button class="btn btn-soft btn-icon" data-act="f-start-temp" data-id="${t.id}" title="开始"><img class="ic" src="assets/icons/hk-09.png" alt=""/></button>
        <button class="btn btn-soft btn-icon" data-act="f-del-temp" data-id="${t.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
      </div>
    </div>`).join('') : `<div class="muted-text">还没有临时任务</div>`;

  const checkinHtml = items.length ? items.map((it) => {
    const checked = !!it.records[today];
    const mk = D.monthKey();
    const monthCount = Object.keys(it.records || {}).filter((dt) => dt.slice(0, 7) === mk).length;
    return `<div class="fp-item ${checked ? 'done' : ''}">
      <button class="fp-check" data-act="f-check" data-id="${it.id}" aria-label="打卡">${checked ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
      <div class="fp-body"><div class="fp-name">${it.icon ? UI.esc(it.icon) : '<img class="ic" src="assets/icons/hk-06.png" alt=""/>'} ${UI.esc(it.name)}</div><div class="fp-tags"><span class="fp-tag tag-soft">本月 ${monthCount} 天</span></div></div>
      <div class="fp-ops">
        <button class="btn btn-soft btn-icon" data-act="f-start-item" data-id="${it.id}" title="开始"><img class="ic" src="assets/icons/hk-09.png" alt=""/></button>
      </div>
    </div>`;
  }).join('') : `<div class="empty soft"><div class="t">还没有打卡项目</div><div class="s">去「自律成长」添加</div></div>`;

  return `
  <div class="card focus-plan-card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>今日执行</div>
      <div class="spacer"></div>
      <span class="focus-run-badge ${_focusTimer.running ? 'on' : ''}">进行中 ${_focusTimer.running ? 1 : 0}</span>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="fp-section">临时任务</div>
      <div class="fp-add-line">
        <input class="input" id="fTempInput" placeholder="临时任务" autocomplete="off"/>
        <button class="btn fp-add-btn" data-act="f-add-temp"><img class="ic" src="assets/icons/hk-32.png" alt=""/> 新增</button>
      </div>
      <div class="fp-list">${tempHtml}</div>
      <div class="fp-section mt12">打卡项目</div>
      <div class="fp-list">${checkinHtml}</div>
    </div>
  </div>`;
}
// 新增临时任务（写入「本次主题」并自动开始计时；不依赖事件委托）
window.cwTempAdd = function () {
  try {
  const inp = UI.$('#fTempInput');
  const name = inp ? inp.value.trim() : '';
  if (!name) { UI.toast('请输入本次主题', 'warn'); return; }
  // 写入"本次主题"输入框
  const themeInp = UI.$('#fThemeCustom');
  if (themeInp) themeInp.value = name;
  // 自动开始计时（f-start 会读取 fThemeCustom.value）
  handleFocusAct('f-start', '', null);
  if (inp) inp.value = '';
  } catch (e) { console.warn('[cwTempAdd]', e); }
};
// 删除临时任务（inline onclick 兜底）
window.cwTempDel = function (id) {
  try {
  if (!id) return;
  Store.update((s) => { s.discipline.tempTasks = (s.discipline.tempTasks || []).filter((x) => x.id !== id); });
  Pages.checkin();
  } catch (e) { console.warn('[cwTempDel]', e); }
};

function renderFocusTimer(s) {
  const running = _focusTimer.running;
  const typeSel = `<select id="fType" class="input focus-type-select"><option value="focus">专注模式</option><option value="checkin">打卡模式</option></select>`;

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
        ${running ? `<div class="focus-running-theme">${UI.esc(_focusTimer.type === 'checkin' ? '打卡' : '专注')}：<b>${UI.esc(_focusTimer.theme)}</b></div>` : `<div class="focus-clock-hint">开始一段专注 / 打卡计时</div>`}
        <input class="input focus-theme-input" id="fThemeCustom" placeholder="本次主题，可留空自动读取当前任务" autocomplete="off" style="max-width:420px"/>
        <div class="focus-input-row">
          ${typeSel}
        </div>
        <input class="input" id="fNote" placeholder="备注（可选）" style="max-width:420px"/>
        <div class="focus-btn-group">
          ${running
            ? `<button class="btn focus-btn focus-btn-start" data-act="f-stop"><img class="ic" src="assets/icons/hk-09.png" alt=""/> 结束</button><button class="btn focus-btn focus-btn-abort" data-act="f-abort"><img class="ic" src="assets/icons/hk-18.png" alt=""/> 放弃</button>`
            : `<button class="btn focus-btn focus-btn-start" data-act="f-start"><img class="ic" src="assets/icons/hk-09.png" alt=""/> 开始</button>`}
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
      <div class="title"><img class="ic" src="assets/icons/hk-32.png" alt=""/>手动补录</div>
      <div class="spacer"></div>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="focus-manual-grid">
        <input class="input" type="date" id="fManDate" value="${today}"/>
        <input class="input" type="time" id="fManStart" value="${nowStr}"/>
        <input class="input" type="time" id="fManEnd" value="${nowStr}"/>
        <input class="input" id="fManTheme" placeholder="补录主题" style="grid-column:1/-1"/>
      </div>
      <button class="btn btn-block mt12 focus-btn-record" data-act="f-add-manual"><img class="ic" src="assets/icons/hk-32.png" alt=""/> 补录</button>
    </div>
  </div>`;
}

function renderFocusTimeline(s) {
  const today = D.todayStr();
  // 放弃的专注（abandoned）不写入时间线/计数
  const todaySessions = (s.focus.sessions || []).filter((x) => !x.abandoned && D.fmtDate(new Date(x.start)) === today);
  const recHtml = todaySessions.length ? todaySessions.slice().reverse().map((x) => `
    <div class="focus-rec-row ${x.abandoned ? 'aborted' : ''}">
      <span class="fr-type ${(x.type || 'focus') === 'checkin' ? 'type-checkin' : 'type-focus'}">${(x.type || 'focus') === 'checkin' ? '打卡' : '专注'}</span>
      <span class="fr-theme">${UI.esc(x.theme || '专注')}</span>
      <span class="fr-meta">${x.category || '其他'}${x.note ? ' · ' + UI.esc(x.note) : ''}</span>
      <span class="fr-time">${fmtTime(new Date(x.start))}–${fmtTime(new Date(x.end))}</span>
      <span class="fr-dur">${fmtDur(x.dur)}${x.abandoned ? ' · 已放弃' : ''}</span>
      <button class="btn btn-ghost btn-icon fr-del" data-act="f-del-session" data-id="${x.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
    </div>`).join('') : `<div class="muted-text">今天还没有专注/打卡记录</div>`;

  return `
  <div class="card focus-timeline-card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-10.png" alt=""/>专注时间线</div>
      <div class="spacer"></div>
      <span class="sub">今日 ${todaySessions.length} 次</span>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="focus-records">${recHtml}</div>
    </div>
  </div>`;
}

function renderFocusSchedule(s) {
  const today = D.todayStr();
  const now = new Date();
  const slots = [];
  for (let h = SCHEDULE_START; h <= SCHEDULE_END; h++) slots.push(h);
  const totalHours = SCHEDULE_END - SCHEDULE_START;

  const events = (s.focus.sessions || []).filter((x) => !x.abandoned && D.fmtDate(new Date(x.start)) === today).map((x) => {
    const st = new Date(x.start);
    const en = new Date(x.end);
    let startHour = st.getHours() + st.getMinutes() / 60;
    let endHour = en.getHours() + en.getMinutes() / 60;
    if (startHour < SCHEDULE_START) startHour = SCHEDULE_START;
    if (endHour > SCHEDULE_END) endHour = SCHEDULE_END;
    if (endHour <= startHour) endHour = startHour + 0.25;
    return {
      top: ((startHour - SCHEDULE_START) / totalHours) * 100,
      height: ((endHour - startHour) / totalHours) * 100,
      label: UI.esc(x.theme || '专注'),
      type: x.type || 'focus',
      time: fmtTime(st) + '–' + fmtTime(en),
      dur: fmtDurShort(x.dur),
    };
  });

  const currentTop = ((now.getHours() + now.getMinutes() / 60 - SCHEDULE_START) / totalHours) * 100;
  const showNow = currentTop >= 0 && currentTop <= 100;

  return `
  <div class="card focus-schedule-card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-11.png" alt=""/>今日日程</div>
      <div class="spacer"></div>
      <span class="sub">${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
    </div>
    <div class="card-body focus-schedule-body">
      <div class="focus-schedule-tip">今日专注/打卡时间块</div>
      <div class="focus-schedule-axis">
        ${slots.map((h) => `<div class="focus-slot" style="top:${((h - SCHEDULE_START) / totalHours) * 100}%"><span class="focus-slot-label">${pad2(h)}:00</span></div>`).join('')}
        ${showNow ? `<div class="focus-now-line" style="top:${currentTop}%"></div>` : ''}
        ${events.map((e) => `<div class="focus-event ${e.type === 'checkin' ? 'event-checkin' : 'event-focus'}" style="top:${e.top}%;height:${e.height}%" title="${e.time} · ${e.dur}"><div class="focus-event-title">${e.label}</div><div class="focus-event-meta">${e.time}</div></div>`).join('')}
      </div>
    </div>
  </div>`;
}
