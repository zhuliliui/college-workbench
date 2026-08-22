/* ============================================================
  页面6 · 月度复盘
  - 反思评价（harvest/undoneReason/nextPlan）按【日期 YYYY-MM-DD】保存，可按日期切换查看历史
  - 月度总结（summary）按【月份 YYYY-MM】保存，独立卡片
  - 保存按钮显式 try/catch + console.error，避免静默失败
  ============================================================ */
window.Pages = window.Pages || {};
Pages.review = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const m = s.monthly;

  // 选中的月份（目标/已完成/未完成/月度总结 共用）
  const selMonth = (UI.$('#revMonth') && UI.$('#revMonth').value) || D.monthKey();
  // 选中的日期（反思评价专用，按日）
  const selDate = (UI.$('#revDate') && UI.$('#revDate').value) || D.todayStr();
  // 输入合法校验
  if (!/^\d{4}-\d{2}$/.test(selMonth)) {
    UI.toast('月份格式不正确，已重置为当前月', 'warn');
    location.hash = '#/review';
    setTimeout(() => Pages.review(), 0);
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selDate)) {
    UI.toast('日期格式不正确，已重置为今天', 'warn');
    location.hash = '#/review';
    setTimeout(() => Pages.review(), 0);
    return;
  }

  // ---- 月度目标 ----
  const goals = m.goals[selMonth] || [];
  const goalsHtml = goals.length ? '<div class="list">' + goals.map((g) => `
  <div class="item" data-id="${g.id}">
  <div class="body"><div class="name">${UI.esc(g.text)}</div></div>
  <button class="btn btn-soft btn-icon" data-act="goal-del" data-id="${g.id}"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </div>`).join('') + '</div>'
  : `<div class="empty"><img class="emoji" src="assets/icons/hk-06.png" alt=""/><div class="t">还没有本月目标</div></div>`;

  // ---- 完成/未完成 ----
  const done = m.done.filter((x) => x.month === selMonth);
  const undone = m.undone.filter((x) => x.month === selMonth);
  const listBlock = (arr, act, empty) => arr.length ? '<div class="list">' + arr.map((x) => `
  <div class="item" data-id="${x.id}">
  <div class="body"><div class="name">${UI.esc(x.text)}</div></div>
  <button class="btn btn-soft btn-icon" data-act="${act}" data-id="${x.id}"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </div>`).join('') + '</div>' : `<div class="empty"><img class="emoji" src="assets/icons/hk-37.png" alt=""/><div class="t">${empty}</div></div>`;

  // ---- 反思评价（按日期）---- 键: 'YYYY-MM-DD'
  const rev = (k) => (m[k] && m[k][selDate]) || '';
  // 历史日期汇总：三项中有任一内容的日期，按时间倒序
  const dateSet = new Set();
  ['harvest', 'undoneReason', 'nextPlan'].forEach((k) => {
  Object.keys((m[k] && m[k]) || {}).forEach((d) => { if (/^\d{4}-\d{2}-\d{2}$/.test(d) && m[k][d]) dateSet.add(d); });
  });
  const allDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  const historyHtml = allDates.length ? '<div class="date-chips">' + allDates.slice(0, 12).map((d) =>
  `<button class="chip ${d === selDate ? 'on' : ''}" data-act="rev-date" data-date="${d}">${d.slice(5)}</button>`
  ).join('') + '</div>' : '<div class="muted-text" style="font-size:12px">还没有历史反思记录</div>';

  // ---- 月度总结（按月份）---- 键: 'YYYY-MM'
  const summaryVal = (m.summary && m.summary[selMonth]) || '';

  c.innerHTML = `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-06.png" alt=""/>本月目标录入 · ${selMonth}</div>
  <div class="spacer"></div><input class="input" id="revMonth" type="month" value="${selMonth}" style="max-width:160px" onchange="Pages.review()"/>
  <button class="btn btn-sm" data-act="goal-add" style="margin-left:8px">＋ 添加目标</button>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">${goalsHtml}</div>
  </div>

  <div class="grid grid-2">
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-06.png" alt=""/>已完成事项</div>
  <div class="spacer"></div><button class="btn btn-sm btn-soft" data-act="done-add">＋ 登记</button>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">${listBlock(done, 'done-del', '暂无已完成登记')}</div>
  </div>
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-37.png" alt=""/>未完成事项</div>
  <div class="spacer"></div><button class="btn btn-sm btn-soft" data-act="undone-add">＋ 登记</button>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">${listBlock(undone, 'undone-del', '暂无未完成登记')}</div>
  </div>
  </div>

  <div class="card">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>反思评价 · ${selDate}</div>
  <div class="spacer"></div>
  <input class="input" id="revDate" type="date" value="${selDate}" style="max-width:160px" onchange="Pages.review()"/>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">
  <div class="muted-text" style="font-size:12px;margin-bottom:8px">按当天日期保存，可切换日期查询历史记录</div>
  <div class="field"><label> 本月最大收获</label><textarea class="textarea" data-day="harvest" placeholder="今天/这天最值得骄傲的事…">${UI.esc(rev('harvest'))}</textarea></div>
  <div class="field"><label> 未完成原因分析</label><textarea class="textarea" data-day="undoneReason" placeholder="为什么没做到？客观复盘…">${UI.esc(rev('undoneReason'))}</textarea></div>
  <div class="field"><label> 下月改进计划</label><textarea class="textarea" data-day="nextPlan" placeholder="下个月怎么做得更好？">${UI.esc(rev('nextPlan'))}</textarea></div>
  <div class="field"><label>历史日期</label>${historyHtml}</div>
  <button class="btn btn-sm" data-act="save-day">保存当天反思</button>
  </div>
  </div>

  <div class="card">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-32.png" alt=""/>月度总结 · ${selMonth}</div>
  <div class="spacer"></div>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">
  <div class="muted-text" style="font-size:12px;margin-bottom:8px">备忘录·按月保存（直接保存在当前月）</div>
  <div class="field"><label> 月度总结</label><textarea class="textarea" data-month="summary" placeholder="自由书写本月感悟…">${UI.esc(summaryVal)}</textarea></div>
  <button class="btn btn-sm" data-act="save-month">保存月度总结</button>
  </div>
  </div>`;

  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'goal-add') return addText('goal', '添加本月目标');
  if (act === 'goal-del') return delItem('goals', id, selMonth);
  if (act === 'done-add') return addText('done', '登记已完成事项');
  if (act === 'done-del') return delItem('done', id);
  if (act === 'undone-add') return addText('undone', '登记未完成事项');
  if (act === 'undone-del') return delItem('undone', id);
  if (act === 'rev-date') { // 切换历史日期
  const d = b.dataset.date; if (!d) return;
  const inp = UI.$('#revDate'); if (inp) { inp.value = d; Pages.review(); } return;
  }
  if (act === 'save-day') { // 保存反思评价（按日）
  try {
  const data = {};
  UI.$all('[data-day]').forEach((el) => { data[el.dataset.day] = el.value; });
  Store.update((st) => {
  st.monthly.harvest = st.monthly.harvest || {};
  st.monthly.undoneReason = st.monthly.undoneReason || {};
  st.monthly.nextPlan = st.monthly.nextPlan || {};
  st.monthly.harvest[selDate] = data.harvest || '';
  st.monthly.undoneReason[selDate] = data.undoneReason || '';
  st.monthly.nextPlan[selDate] = data.nextPlan || '';
  });
  UI.toast('已保存 ' + selDate + ' 反思', 'ok');
  // 轻微刷新以更新历史日期 chip 列表（保留当前日期）
  Pages.review();
  } catch (err) {
  console.error('[review] 保存当天反思失败', err);
  UI.toast('保存失败：' + (err && err.message ? err.message : '未知错误'), 'warn');
  }
  return;
  }
  if (act === 'save-month') { // 保存月度总结（按月）
  try {
  const v = (UI.val('[data-month="summary"]') || '').trim();
  Store.update((st) => { st.monthly.summary = st.monthly.summary || {}; st.monthly.summary[selMonth] = v; });
  UI.toast('已保存 ' + selMonth + ' 月度总结', 'ok');
  } catch (err) {
  console.error('[review] 保存月度总结失败', err);
  UI.toast('保存失败：' + (err && err.message ? err.message : '未知错误'), 'warn');
  }
  return;
  }
  };

  function addText(kind, title) {
  const map = { goal: ['goals', selMonth], done: ['done', null], undone: ['undone', null] };
  const [arrKey, month] = map[kind];
  UI.openModal({ title, icon: '<img class="ic" src="assets/icons/hk-38.png" alt=""/>', body: `<div class="field"><label>内容</label><textarea class="textarea" id="xt" placeholder="输入…"></textarea></div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: '保存', onClick: () => {
  const v = UI.val('#xt'); if (!v) return UI.toast('写点内容吧', 'warn');
  Store.update((st) => {
  if (arrKey === 'goals') { (st.monthly.goals[selMonth] = st.monthly.goals[selMonth] || []).push({ id: Store.uid(), text: v }); }
  else st.monthly[arrKey].push({ id: Store.uid(), text: v, month: selMonth });
  });
  UI.closeModal(); Pages.review();
  } }] });
  setTimeout(() => UI.$('#xt') && UI.$('#xt').focus(), 50);
  }
  function delItem(arrKey, id, month) {
  UI.confirm('删除这条记录？', () => {
  Store.update((st) => {
  if (arrKey === 'goals') st.monthly.goals[selMonth] = (st.monthly.goals[selMonth] || []).filter((x) => x.id !== id);
  else st.monthly[arrKey] = st.monthly[arrKey].filter((x) => x.id !== id);
  }); Pages.review();
  });
  }
};
