/* ============================================================
  页面1 · 万能工作台（首页）
  清新首页：欢迎横幅 + 4 统计卡 + 今日任务/临近DDL + 快速入口
  ============================================================ */
window.Pages = window.Pages || {};
// 自律模块·专注计时器运行态（模块级，跨重渲染保留）
let _focusTimer = { running: false, startTs: 0, theme: '', tickId: null };
let _focusPeriod = 'day';
Pages.dashboard = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const today = D.todayStr();
  const now = new Date();

  // 今日学习任务统计
  const isToday = (t) => !t.due || D.fmtDate(D.parseLDT(t.due)) === today;
  const todayTasks = s.tasks.filter(isToday);
  const todayDone = todayTasks.filter((t) => t.done).length;
  const todayTotal = todayTasks.length;

  // 临近 DDL：未完成的、未来 7 天内截止（含已过期）
  const upcomingDDLs = s.ddls.filter((d) => !d.done).filter((d) => {
  if (!d.due) return false;
  const due = new Date(d.due);
  const diff = (due - now) / 86400000;
  return diff <= 7;
  }).sort((a, b) => new Date(a.due) - new Date(b.due));

  // 存钱罐余额
  const piggyBalance = s.piggy.balance || 0;

  // 本月支出
  const thisMonth = today.slice(0, 7);
  const monthExpense = s.finance.records
  .filter((r) => r.type === 'expense' && (r.date || '').startsWith(thisMonth))
  .reduce((sum, r) => sum + (r.amount || 0), 0);

  // 问候语
  const hour = now.getHours();
  const greet = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  // 今日任务列表（最多展示 5 条，空状态友好提示）
  let taskListHtml;
  if (todayTotal === 0) {
  taskListHtml = `<div class="empty soft"><img class="emoji" src="assets/icons/hk-38.png" alt=""/>
  <div class="t">今天还没有安排学习任务</div>
  <div class="s">去「学习复习计划」添加吧</div></div>`;
  } else {
  const items = todayTasks.slice().sort((a, b) => (a.done - b.done) || (a.due || '').localeCompare(b.due || '')).slice(0, 5);
  taskListHtml = '<div class="list home-list">' + items.map((t) => {
  return `<div class="item ${t.done ? 'done' : ''}" data-id="${t.id}">
  <button class="check" data-act="toggle-task" data-id="${t.id}" aria-label="完成">${t.done ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
  <div class="body"><div class="name">${UI.esc(t.name)}</div>
  <div class="meta">${t.category ? `<span class="tag">${UI.esc(t.category)}</span>` : ''}<span>${t.due ? D.fmtDateTime(D.parseLDT(t.due)) : '无截止'}</span></div>
  </div>
  </div>`;
  }).join('') + '</div>';
  }

  // 临近 DDL 列表
  let ddlListHtml;
  if (upcomingDDLs.length === 0) {
  ddlListHtml = `<div class="empty soft"><img class="emoji" src="assets/icons/hk-41.png" alt=""/>
  <div class="t">暂无临近的 DDL</div>
  <div class="s">继续保持，加油～</div></div>`;
  } else {
  ddlListHtml = '<div class="list home-list">' + upcomingDDLs.slice(0, 5).map((d) => {
  const due = new Date(d.due);
  const hours = Math.max(0, Math.ceil((due - now) / 3600000));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  let remText = days > 0 ? `剩余 ${days} 天 ${remHours} 小时` : `剩余 ${hours} 小时`;
  if (hours === 0) remText = '已到期';
  let cls = '';
  if (hours <= 12) cls = 'danger';
  else if (hours <= 24) cls = 'warn';
  return `<div class="item ${cls}" data-id="${d.id}">
  <div class="body">
  <div class="name">${UI.esc(d.name)}</div>
  <div class="meta"><span class="tag ${cls === 'danger' ? 'danger' : cls === 'warn' ? 'warn' : 'muted'}">${remText}</span><span>${D.fmtDateTime(due)}</span></div>
  </div>
  <button class="btn btn-sm btn-success" data-act="finish-ddl" data-id="${d.id}">完成</button>
  </div>`;
  }).join('') + '</div>';
  }

  // 快速入口
  const quicks = [
  { id: 'skill', emoji: '<img class="e" src="assets/icons/hk-01.png" alt=""/>', label: '技能学习' },
  { id: 'english', emoji: '<img class="e" src="assets/icons/hk-27.png" alt=""/>', label: '考研英语' },
  { id: 'study', emoji: '<img class="e" src="assets/icons/hk-38.png" alt=""/>', label: '学习复习' },
  { id: 'ddl', emoji: '<img class="e" src="assets/icons/hk-41.png" alt=""/>', label: 'DDL倒计时' },
  { id: 'finance', emoji: '<img class="e" src="assets/icons/hk-02.png" alt=""/>', label: '记账存钱' },
  { id: 'discipline', emoji: '<img class="e" src="assets/icons/hk-06.png" alt=""/>', label: '自律成长' },
  { id: 'review', emoji: '<img class="e" src="assets/icons/hk-37.png" alt=""/>', label: '月度复盘' },
  { id: 'travel', emoji: '<img class="e" src="assets/icons/hk-35.png" alt=""/>', label: '旅行规划' },
  ];
  const quickHtml = quicks.map((q) =>
  `<button class="quick-chip" data-nav="${q.id}"><span class="e">${q.emoji}</span><span>${q.label}</span></button>`
  ).join('');

  c.innerHTML = `
  <!-- 欢迎横幅 -->
  <div class="welcome-banner">
  <div class="welcome-text">
  <div class="welcome-title">${greet}，今天也要元气满满呀！</div>
  <div class="welcome-sub">这里是你的专属学习生活中枢，所有进度自动同步到虚拟存钱罐 <img class="welcome-piggy" src="assets/icons/hk-02.png" alt="存钱罐"/></div>
  </div>
  </div>

  <!-- 统计卡 -->
  <div class="grid grid-4 stat-row">
  <div class="stat-card">
  <div class="stat-icon"><img src="assets/icons/hk-38.png" alt=""/></div>
  <div class="stat-label">今日学习任务</div>
  <div class="stat-value">${todayTotal} 项</div>
  </div>
  <div class="stat-card">
  <div class="stat-icon"><img src="assets/icons/hk-41.png" alt=""/></div>
  <div class="stat-label">临近 DDL</div>
  <div class="stat-value">${upcomingDDLs.length} 项</div>
  </div>
  <div class="stat-card">
  <div class="stat-icon"><img class="stat-piggy" src="assets/icons/hk-02.png" alt="存钱罐"/></div>
  <div class="stat-label">存钱罐余额</div>
  <div class="stat-value">${D.money(piggyBalance)}</div>
  </div>
  <div class="stat-card">
  <div class="stat-icon"><img src="assets/icons/hk-23.png" alt=""/></div>
  <div class="stat-label">本月支出</div>
  <div class="stat-value">${D.money(monthExpense)}</div>
  </div>
  </div>

  <!-- 今日任务 / 临近 DDL -->
  <div class="grid grid-2">
  <div class="card">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>今日学习任务 <span class="sub" style="margin-left:8px">${todayDone}/${todayTotal} 已完成</span></div>
  <div class="spacer"></div>
  <button class="btn btn-sm btn-soft" data-act="go-study">＋ 添加</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">${taskListHtml}</div>
  </div>
  <div class="card">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-41.png" alt=""/>临近 DDL <span class="sub" style="margin-left:8px">${upcomingDDLs.length} 项</span></div>
  <div class="spacer"></div>
  <button class="btn btn-sm btn-soft" data-act="go-ddl">管理</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">${ddlListHtml}</div>
  </div>
  </div>

  <!-- 快速进入 -->
  <div class="card">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-07.png" alt=""/>快速进入</div>
  </div>
  <div class="card-body">
  <div class="quick-grid">${quickHtml}</div>
  </div>
  </div>

  <!-- 自律模块（今日执行计划 / 专注计时 / 统计大盘）-->
  <div id="focusModule"></div>`;

  renderFocusModule(UI.$('#focusModule'));

  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act], [data-nav]');
  if (!b) return;
  const act = b.dataset.act, id = b.dataset.id, nav = b.dataset.nav;

  if (act && act.indexOf('f-') === 0) return handleFocusAct(act, id, b);
  if (nav) return (location.hash = '#/' + nav);
  if (act === 'go-study') return (location.hash = '#/study');
  if (act === 'go-ddl') return (location.hash = '#/ddl');

  if (act === 'toggle-task') {
  const t = s.tasks.find((x) => x.id === id); if (!t) return;
  const wasDone = t.done;
  const willDone = !wasDone;
  Store.update((st) => {
  const x = st.tasks.find((y) => y.id === id);
  x.done = willDone; x.doneAt = willDone ? new Date().toISOString() : null;
  });
  if (willDone) { Store.earn(1, '完成学习复习任务'); UI.toast('任务完成 +1 金币', 'ok'); }
  else if (wasDone) { Store.deduct(1, '取消完成任务'); UI.toast('已取消，-1 金币', 'warn'); }
  Pages.dashboard();
  return;
  }
  if (act === 'finish-ddl') {
  const d = s.ddls.find((x) => x.id === id); if (!d || d.done) return;
  Store.update((st) => { const x = st.ddls.find((y) => y.id === id); x.done = true; x.doneAt = new Date().toISOString(); });
    Store.earn(1, '完成 DDL 任务');
    Pages.dashboard();
    return;
  }
  };
};

/* ============================================================
  自律模块（嵌入工作台底部）：今日执行计划 + 专注计时器 + 统计大盘
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

function startTimer(theme) {
  if (_focusTimer.running) return;
  _focusTimer.theme = theme || '专注';
  _focusTimer.startTs = Date.now();
  _focusTimer.running = true;
  if (_focusTimer.tickId) clearInterval(_focusTimer.tickId);
  _focusTimer.tickId = setInterval(() => {
    const el = UI.$('#fTimer'); if (el) el.textContent = fmtClock(Date.now() - _focusTimer.startTs);
  }, 1000);
  renderFocusModule(UI.$('#focusModule'));
}
function stopTimer(abandoned) {
  if (!_focusTimer.running) return;
  if (_focusTimer.tickId) { clearInterval(_focusTimer.tickId); _focusTimer.tickId = null; }
  const dur = Date.now() - _focusTimer.startTs;
  const theme = _focusTimer.theme;
  Store.update((st) => { st.focus.sessions.push({ id: Store.uid(), theme, start: _focusTimer.startTs, end: Date.now(), dur, abandoned: !!abandoned }); });
  _focusTimer.running = false; _focusTimer.theme = ''; _focusTimer.startTs = 0;
  renderFocusModule(UI.$('#focusModule'));
}

function handleFocusAct(act, id, b) {
  const s = Store.get();
  const mod = UI.$('#focusModule');
  const rerender = () => renderFocusModule(mod);

  if (act === 'f-period') { _focusPeriod = b.dataset.p || 'day'; rerender(); return; }
  if (act === 'f-start') {
    const custom = UI.$('#fThemeCustom'); const sel = UI.$('#fTheme');
    const theme = (custom && custom.value.trim()) || (sel && sel.value) || '专注';
    startTimer(theme); return;
  }
  if (act === 'f-stop') { stopTimer(false); return; }
  if (act === 'f-abort') { stopTimer(true); return; }

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
    startTimer(t.name); return;
  }
  if (act === 'f-done-plan') {
    const t = s.tasks.find((x) => x.id === id); if (!t) return;
    const was = t.done; const will = !was;
    Store.update((st) => { const x = st.tasks.find((y) => y.id === id); x.done = will; x.doneAt = will ? new Date().toISOString() : null; });
    if (will) Store.earn(1, '完成学习复习任务'); else if (was) Store.deduct(1, '取消完成任务');
    Pages.dashboard(); return;
  }
  if (act === 'f-start-plan') {
    const t = s.tasks.find((x) => x.id === id); if (!t) return;
    startTimer(t.name); return;
  }
  if (act === 'f-edit-plan') {
    const t = s.tasks.find((x) => x.id === id); if (!t) return;
    UI.openModal({ title: '修改今日任务', body: `<div class="field"><label>任务名称</label><input class="input" id="fPlanName" value="${UI.esc(t.name)}"/></div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
      { label: '保存', onClick: () => {
        const name = UI.val('#fPlanName'); if (!name) return UI.toast('请输入名称', 'warn');
        Store.update((st) => { const x = st.tasks.find((y) => y.id === id); x.name = name; });
        UI.closeModal(); Pages.dashboard();
      } }] });
    setTimeout(() => { const el = UI.$('#fPlanName'); if (el) el.focus(); }, 50);
    return;
  }
}

function renderFocusModule(container) {
  if (!container) return;
  const s = Store.get();
  const today = D.todayStr();
  const isToday = (t) => !t.due || D.fmtDate(D.parseLDT(t.due)) === today;
  const planTasks = s.tasks.filter(isToday);
  const tempTasks = s.discipline.tempTasks || [];

  // 主题下拉：今日未完成任务 + 打卡项
  const themeOps = [];
  planTasks.filter((t) => !t.done).forEach((t) => { if (t.name && !themeOps.includes(t.name)) themeOps.push(t.name); });
  (s.discipline.items || []).forEach((it) => { if (it.name && !themeOps.includes(it.name)) themeOps.push(it.name); });

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
    </div>`).join('') : `<div class="muted-text">还没有临时任务，下面快速加一个</div>`;

  const running = _focusTimer.running;
  const themeSel = `<select id="fTheme" class="input" style="max-width:200px">` +
    (themeOps.length ? themeOps.map((o) => `<option value="${UI.esc(o)}">${UI.esc(o)}</option>`).join('') : `<option value="">— 暂无可选主题 —</option>`) +
    `</select>`;
  const timerDisplay = running ? fmtClock(Date.now() - _focusTimer.startTs) : '00:00:00';
  const timerBtns = running
    ? `<button class="btn btn-danger btn-sm" data-act="f-stop">结束</button><button class="btn btn-soft btn-sm" data-act="f-abort">放弃</button>`
    : `<button class="btn btn-sm" data-act="f-start">▶ 开始专注</button>`;

  const todaySessions = (s.focus.sessions || []).filter((x) => D.fmtDate(new Date(x.start)) === today);
  const recHtml = todaySessions.length ? todaySessions.slice().reverse().map((x) => `
    <div class="focus-rec-row ${x.abandoned ? 'aborted' : ''}">
      <span class="fr-theme">${UI.esc(x.theme || '专注')}</span>
      <span class="fr-time">${fmtTime(new Date(x.start))}–${fmtTime(new Date(x.end))}</span>
      <span class="fr-dur">${fmtDur(x.dur)}${x.abandoned ? ' · 已放弃' : ''}</span>
    </div>`).join('') : `<div class="muted-text">今天还没有专注记录，点「开始专注」吧</div>`;

  // 统计大盘
  const [ps, pe] = focusPeriodRange(_focusPeriod);
  const inP = (ds) => ds >= ps && ds <= pe;
  let focusMs = 0;
  (s.focus.sessions || []).forEach((x) => { if (x.abandoned) return; const ds = D.fmtDate(new Date(x.start)); if (inP(ds)) focusMs += (x.dur || 0); });
  const checkDays = new Set();
  (s.discipline.items || []).forEach((it) => { Object.keys(it.records || {}).forEach((dt) => { if (inP(dt)) checkDays.add(dt); }); });
  let reviewCount = 0;
  Object.keys(s.dailySummary || {}).forEach((dt) => { if (inP(dt)) reviewCount++; });
  let doneCount = 0;
  s.tasks.forEach((t) => { if (t.done && t.doneAt) { const ds = (t.doneAt || '').slice(0, 10); if (inP(ds)) doneCount++; } });
  (s.ddls || []).forEach((d) => { if (d.done && d.doneAt) { const ds = (d.doneAt || '').slice(0, 10); if (inP(ds)) doneCount++; } });
  const periodLabel = _focusPeriod === 'day' ? '今日' : _focusPeriod === 'week' ? '本周' : '本月';

  container.innerHTML = `
  <div class="card focus-plan">
    <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>今日执行计划</div>
      <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">
      <div class="focus-section-label">学习复习计划 · 今日</div>
      <div class="list">${planHtml}</div>
      <div class="focus-section-label mt12">临时任务</div>
      <div class="flex-wrap gap8" style="margin:8px 0">
        <input class="input" id="fTempInput" placeholder="加一个临时任务，点添加" style="flex:1;min-width:160px"/>
        <button class="btn btn-sm" data-act="f-add-temp">添加</button>
      </div>
      <div class="list">${tempHtml}</div>
    </div>
  </div>

  <div class="card focus-timer">
    <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-09.png" alt=""/>专注计时器</div></div>
    <div class="card-body center">
      <div class="timer-display" id="fTimer">${timerDisplay}</div>
      ${running ? `<div class="muted-text" style="margin-top:4px">当前主题：<b style="color:var(--primary-deep)">${UI.esc(_focusTimer.theme)}</b></div>` : ''}
      <div class="flex-wrap gap8 center mt12" style="justify-content:center;align-items:center">
        ${themeSel}
        <input class="input" id="fThemeCustom" placeholder="或自定义主题" style="max-width:160px"/>
      </div>
      <div class="flex-wrap gap8 center mt12" style="justify-content:center">${timerBtns}</div>
      <div class="focus-section-label mt16" style="text-align:left">今日专注记录</div>
      <div class="focus-records mt8">${recHtml}</div>
    </div>
  </div>

  <div class="card focus-stats">
    <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-37.png" alt=""/>专注统计大盘</div>
      <div class="spacer"></div>
      <div class="seg">
        <button class="seg-btn ${_focusPeriod === 'day' ? 'on' : ''}" data-act="f-period" data-p="day">日</button>
        <button class="seg-btn ${_focusPeriod === 'week' ? 'on' : ''}" data-act="f-period" data-p="week">周</button>
        <button class="seg-btn ${_focusPeriod === 'month' ? 'on' : ''}" data-act="f-period" data-p="month">月</button>
      </div>
    </div>
    <div class="card-body">
      <div class="grid grid-4 stat-row">
        <div class="focus-stat"><div class="fs-val">${fmtDur(focusMs)}</div><div class="fs-label">专注时长</div></div>
        <div class="focus-stat"><div class="fs-val">${checkDays.size} 天</div><div class="fs-label">打卡天数</div></div>
        <div class="focus-stat"><div class="fs-val">${reviewCount}</div><div class="fs-label">复盘次数</div></div>
        <div class="focus-stat"><div class="fs-val">${doneCount}</div><div class="fs-label">完成任务数</div></div>
      </div>
      <div class="muted-text mt8">${periodLabel} · 专注时长汇总已结束的专注；打卡天数 = 该区间至少打卡 1 次的天数；复盘次数 = 写过的每日小结篇数。注：打卡为按天记录，故以「天数」呈现。</div>
    </div>
  </div>`;

  // 动态卡片折叠（wireCommon 只在首屏绑定，这里手动绑定）
  container.querySelectorAll('.collapse-btn').forEach((btn) => {
    btn.addEventListener('click', () => { const card = btn.closest('.card'); if (card) card.classList.toggle('collapsed'); });
  });
}
