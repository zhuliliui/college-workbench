/* ============================================================
  页面6 · 月度目标复盘（已移除月度任务日历联动，日历改在学习复习计划页）
  ============================================================ */
window.Pages = window.Pages || {};
Pages.review = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const m = s.monthly;
  const sel = (UI.$('#revMonth') && UI.$('#revMonth').value) || D.monthKey();

  // ---- 目标 ----
  const goals = m.goals[sel] || [];
  const goalsHtml = goals.length ? '<div class="list">' + goals.map((g) => `
  <div class="item" data-id="${g.id}">
  <div class="body"><div class="name">${UI.esc(g.text)}</div></div>
  <button class="btn btn-soft btn-icon" data-act="goal-del" data-id="${g.id}"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </div>`).join('') + '</div>'
  : `<div class="empty"><img class="emoji" src="assets/icons/hk-06.png" alt=""/><div class="t">还没有本月目标</div></div>`;

  // ---- 完成/未完成 ----
  const done = m.done.filter((x) => x.month === sel);
  const undone = m.undone.filter((x) => x.month === sel);
  const listBlock = (arr, act, empty) => arr.length ? '<div class="list">' + arr.map((x) => `
  <div class="item" data-id="${x.id}">
  <div class="body"><div class="name">${UI.esc(x.text)}</div></div>
  <button class="btn btn-soft btn-icon" data-act="${act}" data-id="${x.id}"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </div>`).join('') + '</div>' : `<div class="empty"><img class="emoji" src="assets/icons/hk-37.png" alt=""/><div class="t">${empty}</div></div>`;

  // ---- 拓展文本 ----
  const T = (k) => UI.esc(m[k][sel] || '');

  c.innerHTML = `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-06.png" alt=""/>本月目标录入 · ${sel}</div>
  <div class="spacer"></div><input class="input" id="revMonth" type="month" value="${sel}" style="max-width:160px" onchange="Pages.review()"/>
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
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>拓展撰写区</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="field"><label> 本月最大收获</label><textarea class="textarea" data-ext="harvest" placeholder="这个月最值得骄傲的事…">${T('harvest')}</textarea></div>
  <div class="field"><label> 未完成原因分析</label><textarea class="textarea" data-ext="undoneReason" placeholder="为什么没做到？客观复盘…">${T('undoneReason')}</textarea></div>
  <div class="field"><label> 下月改进计划</label><textarea class="textarea" data-ext="nextPlan" placeholder="下个月怎么做得更好？">${T('nextPlan')}</textarea></div>
  <div class="field"><label> 月度总结</label><textarea class="textarea" data-ext="summary" placeholder="自由书写本月感悟…">${T('summary')}</textarea></div>
  <button class="btn btn-sm" data-act="save-ext">保存撰写内容</button>
  </div>
  </div>`;

  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
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
  };

  function addText(kind, title) {
  const map = { goal: ['goals', sel], done: ['done', null], undone: ['undone', null] };
  const [arrKey, month] = map[kind];
  UI.openModal({ title, icon: '<img class="ic" src="assets/icons/hk-38.png" alt=""/>', body: `<div class="field"><label>内容</label><textarea class="textarea" id="xt" placeholder="输入…"></textarea></div>`,
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
};
