/* ============================================================
   页面6 · 月度目标复盘 + 日历联动（仅学习复习计划）
   ============================================================ */
window.Pages = window.Pages || {};
Pages.review = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const m = s.monthly;
  // 选定月份（默认当前），保留选择
  const sel = (UI.$('#revMonth') && UI.$('#revMonth').value) || D.monthKey();

  // ---- 目标 ----
  const goals = m.goals[sel] || [];
  const goalsHtml = goals.length ? '<div class="list">' + goals.map((g) => `
    <div class="item" data-id="${g.id}">
      <div class="body"><div class="name">${UI.esc(g.text)}</div></div>
      <button class="btn btn-soft btn-icon" data-act="goal-del" data-id="${g.id}">🗑</button>
    </div>`).join('') + '</div>'
    : `<div class="empty"><span class="emoji">🎯</span><div class="t">还没有本月目标</div></div>`;

  // ---- 完成/未完成 ----
  const done = m.done.filter((x) => x.month === sel);
  const undone = m.undone.filter((x) => x.month === sel);
  const listBlock = (arr, act, empty) => arr.length ? '<div class="list">' + arr.map((x) => `
    <div class="item" data-id="${x.id}">
      <div class="body"><div class="name">${UI.esc(x.text)}</div></div>
      <button class="btn btn-soft btn-icon" data-act="${act}" data-id="${x.id}">🗑</button>
    </div>`).join('') + '</div>' : `<div class="empty"><span class="emoji">📭</span><div class="t">${empty}</div></div>`;

  // ---- 拓展文本 ----
  const T = (k) => UI.esc(m[k][sel] || '');

  // ---- 日历 ----
  const [yy, mm] = sel.split('-').map(Number);
  const first = new Date(yy, mm - 1, 1);
  const startW = (first.getDay() + 6) % 7; // 周一=0
  const daysInMonth = new Date(yy, mm, 0).getDate();
  const cells = [];
  // 上月补位
  const prevDays = new Date(yy, mm, 0).getDate();
  for (let i = startW - 1; i >= 0; i--) cells.push({ d: prevDays - i, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, other: false });
  while (cells.length % 7 !== 0) cells.push({ d: cells.length, other: true, tail: true });

  // 任务按日期索引
  const byDate = {};
  s.tasks.forEach((t) => { if (t.due) { const key = D.fmtDate(D.parseLDT(t.due)); (byDate[key] = byDate[key] || []).push(t); } });

  const dayCells = cells.map((cell) => {
    const dateStr = cell.other ? '' : (yy + '-' + D.pad(mm) + '-' + D.pad(cell.d));
    let cls = 'cal-cell', dot = '';
    if (!cell.other) {
      const ts = byDate[dateStr];
      if (ts && ts.length) {
        const allDone = ts.every((t) => t.done);
        cls += allDone ? ' green' : ' red';
        dot = '<div class="dot"></div>';
      } else dot = '<div class="dot" style="background:transparent"></div>';
    } else dot = '<div class="dot" style="background:transparent"></div>';
    return `<div class="${cls} ${cell.other ? 'other' : ''}" ${dateStr ? `data-date="${dateStr}"` : ''}>
      <div class="d">${cell.d}</div>${dot}</div>`;
  }).join('');

  c.innerHTML = `
  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">🎯</span>本月目标录入 · ${sel}</div>
      <div class="spacer"></div><input class="input" id="revMonth" type="month" value="${sel}" style="max-width:160px" onchange="Pages.review()"/>
      <button class="btn btn-sm" data-act="goal-add" style="margin-left:8px">＋ 添加目标</button>
      <button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">${goalsHtml}</div>
  </div>

  <div class="grid grid-2">
    <div class="card">
      <div class="card-head"><div class="title"><span class="ic">✅</span>已完成事项</div>
        <div class="spacer"></div><button class="btn btn-sm btn-soft" data-act="done-add">＋ 登记</button>
        <button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">${listBlock(done, 'done-del', '暂无已完成登记')}</div>
    </div>
    <div class="card">
      <div class="card-head"><div class="title"><span class="ic">📌</span>未完成事项</div>
        <div class="spacer"></div><button class="btn btn-sm btn-soft" data-act="undone-add">＋ 登记</button>
        <button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">${listBlock(undone, 'undone-del', '暂无未完成登记')}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">🖊</span>拓展撰写区</div>
      <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">
      <div class="field"><label>🌟 本月最大收获</label><textarea class="textarea" data-ext="harvest" placeholder="这个月最值得骄傲的事…">${T('harvest')}</textarea></div>
      <div class="field"><label>🔍 未完成原因分析</label><textarea class="textarea" data-ext="undoneReason" placeholder="为什么没做到？客观复盘…">${T('undoneReason')}</textarea></div>
      <div class="field"><label>🚀 下月改进计划</label><textarea class="textarea" data-ext="nextPlan" placeholder="下个月怎么做得更好？">${T('nextPlan')}</textarea></div>
      <div class="field"><label>📔 月度总结</label><textarea class="textarea" data-ext="summary" placeholder="自由书写本月感悟…">${T('summary')}</textarea></div>
      <button class="btn btn-sm" data-act="save-ext">保存撰写内容</button>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">📅</span>月度任务日历</div>
      <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">
      <div class="cal-legend mt8 mb12">
        <div class="lg"><span class="sw" style="background:var(--success-soft);border:1px solid #c7ebcd"></span>当日学习任务全部完成</div>
        <div class="lg"><span class="sw" style="background:var(--danger-soft);border:1px solid #f3c7c2"></span>当日有未完成学习任务</div>
        <div class="lg"><span class="sw" style="background:var(--surface-2);border:1px solid var(--line)"></span>无学习任务</div>
      </div>
      <div class="cal-grid">
        <div class="cal-cell" style="background:transparent;border:none;color:var(--text-soft);font-weight:700;aspect-ratio:auto;min-height:auto">周一</div>
        <div class="cal-cell" style="background:transparent;border:none;color:var(--text-soft);font-weight:700;aspect-ratio:auto;min-height:auto">周二</div>
        <div class="cal-cell" style="background:transparent;border:none;color:var(--text-soft);font-weight:700;aspect-ratio:auto;min-height:auto">周三</div>
        <div class="cal-cell" style="background:transparent;border:none;color:var(--text-soft);font-weight:700;aspect-ratio:auto;min-height:auto">周四</div>
        <div class="cal-cell" style="background:transparent;border:none;color:var(--text-soft);font-weight:700;aspect-ratio:auto;min-height:auto">周五</div>
        <div class="cal-cell" style="background:transparent;border:none;color:var(--text-soft);font-weight:700;aspect-ratio:auto;min-height:auto">周六</div>
        <div class="cal-cell" style="background:transparent;border:none;color:var(--text-soft);font-weight:700;aspect-ratio:auto;min-height:auto">周日</div>
        ${dayCells}
      </div>
      <div class="muted-text mt12">📌 日历仅同步「学习复习计划」任务状态（忽略 DDL / 打卡等），点击日期查看当日学习任务。</div>
    </div>
  </div>`;

  window.PageHandler = (e) => {
    const b = e.target.closest('[data-act]'); if (b) {
      const act = b.dataset.act, id = b.dataset.id;
      if (act === 'goal-add') return addText('goal', '添加本月目标');
      if (act === 'goal-del') return delItem('goals', id, sel);
      if (act === 'done-add') return addText('done', '登记已完成事项');
      if (act === 'done-del') return delItem('done', id);
      if (act === 'undone-add') return addText('undone', '登记未完成事项');
      if (act === 'undone-del') return delItem('undone', id);
      if (act === 'save-ext') {
        const data = {};
        UI.$all('[data-ext]').forEach((el) => { data[el.dataset.ext] = el.value; });
        Store.update((st) => { st.monthly.harvest[sel] = data.harvest; st.monthly.undoneReason[sel] = data.undoneReason; st.monthly.nextPlan[sel] = data.nextPlan; st.monthly.summary[sel] = data.summary; });
        UI.toast('已保存', 'ok'); return;
      }
    }
    const cell = e.target.closest('[data-date]');
    if (cell) return showDayTasks(cell.dataset.date, byDate[cell.dataset.date] || []);
  };

  function addText(kind, title) {
    const map = { goal: ['goals', sel], done: ['done', null], undone: ['undone', null] };
    const [arrKey, month] = map[kind];
    UI.openModal({ title, icon: '✍️', body: `<div class="field"><label>内容</label><textarea class="textarea" id="xt" placeholder="输入…"></textarea></div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: '保存', onClick: () => {
        const v = UI.val('#xt'); if (!v) return UI.toast('写点内容吧', 'warn');
        Store.update((st) => {
          if (arrKey === 'goals') { (st.monthly.goals[sel] = st.monthly.goals[sel] || []).push({ id: Store.uid(), text: v }); }
          else st.monthly[arrKey].push({ id: Store.uid(), text: v, month: sel });
        });
        UI.closeModal(); Pages.review();
      } }] });
    setTimeout(() => UI.$('#xt') && UI.$('#xt').focus(), 50);
  }
  function delItem(arrKey, id, month) {
    UI.confirm('删除这条记录？', () => {
      Store.update((st) => {
        if (arrKey === 'goals') st.monthly.goals[sel] = (st.monthly.goals[sel] || []).filter((x) => x.id !== id);
        else st.monthly[arrKey] = st.monthly[arrKey].filter((x) => x.id !== id);
      }); Pages.review();
    });
  }
  function showDayTasks(dateStr, tasks) {
    const body = tasks.length ? '<div class="list">' + tasks.map((t) => `
      <div class="item ${t.done ? 'done' : ''}">
        <div class="check" style="background:${t.done ? 'var(--primary)' : '#fff'};border-color:var(--primary)">${t.done ? '✓' : ''}</div>
        <div class="body"><div class="name">${UI.esc(t.name)}</div>
          <div class="meta">${t.category ? '<span class="tag">' + UI.esc(t.category) + '</span>' : ''}${t.due ? '<span>' + D.fmtDateTime(D.parseLDT(t.due)) + '</span>' : ''}</div></div>
      </div>`).join('') + '</div>'
      : `<div class="empty"><span class="emoji">🌿</span><div class="t">当天没有学习任务</div><div class="s">在「学习复习计划」中添加带日期的任务即可联动</div></div>`;
    UI.openModal({ title: '📖 ' + dateStr + ' 学习任务', icon: '', body, dismissable: true });
  }
};
