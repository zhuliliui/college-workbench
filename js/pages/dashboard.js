/* ============================================================
  页面1 · 万能工作台（首页）
  清新首页：欢迎横幅 + 4 统计卡 + 今日任务/临近DDL + 快速入口
  ============================================================ */
window.Pages = window.Pages || {};
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
  </div>`;

  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act], [data-nav]');
  if (!b) return;
  const act = b.dataset.act, id = b.dataset.id, nav = b.dataset.nav;

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
