/* ============================================================
  页面4 · 自律成长
  ============================================================ */
window.Pages = window.Pages || {};
Pages.discipline = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const d = s.discipline;
  const today = D.todayStr();
  const mk = D.monthKey();

  // 打卡项
  const items = d.items;
  const itemsHtml = items.length ? '<div class="grid grid-2">' + items.map((it) => {
  const checked = !!it.records[today];
  const monthCount = Object.keys(it.records).filter((dt) => dt.slice(0, 7) === mk).length;
  return `<div class="card" style="margin:0;padding:14px">
  <div class="flex-between">
  <div style="font-weight:700;font-size:15px">${it.icon ? UI.esc(it.icon) : '<img class="ic" src="assets/icons/hk-06.png" alt=""/>'} ${UI.esc(it.name)}</div>
  <div class="ops">
  <button class="btn btn-soft btn-icon" data-act="item-edit" data-id="${it.id}" title="编辑"><img class="ic" src="assets/icons/hk-32.png" alt=""/></button>
  <button class="btn btn-soft btn-icon" data-act="item-del" data-id="${it.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </div>
  </div>
  <div class="muted-text mt8">本月已打卡 <b style="color:var(--primary-deep)">${monthCount}</b> 天</div>
  <button class="btn ${checked ? 'btn-success' : ''} btn-block mt12" data-act="check" data-id="${it.id}">
  ${checked ? ' 今日已打卡' : '○ 今日打卡（+1元）'}
  </button>
  </div>`;
  }).join('') + '</div>'
  : `<div class="empty"><img class="emoji" src="assets/icons/hk-06.png" alt=""/><div class="t">还没有打卡项目</div><div class="s">添加作息、运动、阅读、技能练习等，每天打卡攒奖励</div></div>`;

  // 每日打分
  const sc = d.scores[today] || { score: 0, reason: '', pros: '', cons: '' };
  let stars = '';
  for (let i = 1; i <= 10; i++) stars += `<span class="star" data-score="${i}" style="font-size:26px;cursor:pointer;color:${i <= sc.score ? 'var(--primary)' : '#e3daf3'}">★</span>`;

  // 月度统计
  const selMonth = (UI.$('#statMonth') && UI.$('#statMonth').value) || mk;
  const daysInMonth = (() => { const [y, m] = selMonth.split('-').map(Number); return new Date(y, m, 0).getDate(); })();
  const elapsed = daysInMonth; // 基数用本月总天数（如 8 月 = 31 天），不取已过天数
  const statHtml = items.length ? items.map((it) => {
  const cnt = Object.keys(it.records).filter((dt) => dt.slice(0, 7) === selMonth).length;
  const pct = Math.round((cnt / elapsed) * 100);
  return `<div style="margin-bottom:12px">
  <div class="flex-between"><div class="name" style="font-weight:600">${it.icon ? UI.esc(it.icon) : '<img class="ic" src="assets/icons/hk-06.png" alt=""/>'} ${UI.esc(it.name)}</div>
  <div class="muted-text">${cnt}/${elapsed} 天 · ${pct}%</div></div>
  <div class="progress mt8"><span style="width:${pct}%"></span></div>
  </div>`;
  }).join('') : `<div class="empty"><img class="emoji" src="assets/icons/hk-37.png" alt=""/><div class="t">暂无打卡数据</div></div>`;

  c.innerHTML = `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-06.png" alt=""/>自定义打卡项目</div>
  <div class="spacer"></div><button class="btn btn-sm" data-act="item-add">＋ 添加打卡项</button>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">${itemsHtml}</div>
  </div>

  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-32.png" alt=""/>每日自律打分 · ${today}</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="center" id="starBox">${stars}</div>
  <div class="center muted-text mt8">当前评分：<b style="color:var(--primary-deep)" id="scoreVal">${sc.score}</b> / 10</div>
  <div class="field mt12"><label>打分理由</label><textarea class="textarea" id="scReason" placeholder="今天为什么打这个分？">${UI.esc(sc.reason)}</textarea></div>
  <div class="row">
  <div class="field"><label>当日优点</label><textarea class="textarea" id="scPros" placeholder="做得好的地方">${UI.esc(sc.pros)}</textarea></div>
  <div class="field"><label>当日不足</label><textarea class="textarea" id="scCons" placeholder="需要改进的地方">${UI.esc(sc.cons)}</textarea></div>
  </div>
  <button class="btn btn-sm" data-act="save-score">保存今日打分</button>
  </div>
  </div>

  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-37.png" alt=""/>月度打卡统计</div>
  <div class="spacer"></div>
  <input class="input" id="statMonth" type="month" value="${selMonth}" style="max-width:160px" onchange="Pages.discipline()"/>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">${statHtml}</div>
  </div>`;

  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'item-add') return openItem();
  if (act === 'item-edit') return openItem(id);
  if (act === 'item-del') return UI.confirm('删除这个打卡项？', () => {
  Store.update((st) => { st.discipline.items = st.discipline.items.filter((x) => x.id !== id); }); Pages.discipline();
  });
  if (act === 'check') {
  const it = s.discipline.items.find((x) => x.id === id); if (!it) return;
  const was = !!it.records[today];
  Store.update((st) => { const x = st.discipline.items.find((y) => y.id === id); if (x.records[today]) delete x.records[today]; else x.records[today] = true; });
  if (!was) { Store.earn(1, '自律打卡'); UI.toast('打卡成功 +1 金币', 'ok'); }
  else { Store.deduct(1, '取消自律打卡'); UI.toast('已取消打卡，-1 金币', 'warn'); }
  Pages.discipline(); return;
  }
  if (act === 'save-score') {
  const score = parseInt(UI.$('#scoreVal').textContent) || 0;
  Store.update((st) => { st.discipline.scores[today] = { score, reason: UI.$('#scReason').value, pros: UI.$('#scPros').value, cons: UI.$('#scCons').value }; });
  UI.toast('已保存今日打分', 'ok'); return;
  }
  };

  // 星级
  const starBox = UI.$('#starBox');
  if (starBox) starBox.addEventListener('click', (e) => {
  const st = e.target.closest('.star'); if (!st) return;
  const v = +st.dataset.score;
  UI.$('#scoreVal').textContent = v;
  Array.from(starBox.children).forEach((s, i) => { s.style.color = (i < v) ? 'var(--primary)' : '#e3daf3'; });
  });

  function openItem(editId) {
  const it = editId ? s.discipline.items.find((x) => x.id === editId) : null;
  UI.openModal({ title: it ? '编辑打卡项' : '添加打卡项', icon: '<img class="ic" src="assets/icons/hk-06.png" alt=""/>',
  body: `
  <div class="row">
  <div class="field" style="max-width:90px"><label>图标</label><input class="input" id="iIcon" value="${it ? (it.icon || '') : ''}" maxlength="2"/></div>
  <div class="field"><label>项目名称</label><input class="input" id="iName" value="${UI.esc(it ? it.name : '')}" placeholder="如：晨跑 30 分钟"/></div>
  </div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: it ? '保存' : '添加', onClick: () => {
  const name = UI.val('#iName'); if (!name) return UI.toast('请输入名称', 'warn');
  const data = { name, icon: UI.val('#iIcon') || '' };
  Store.update((st) => {
  if (it) Object.assign(st.discipline.items.find((x) => x.id === editId), data);
  else st.discipline.items.push(Object.assign({ id: Store.uid(), records: {} }, data));
  });
  UI.closeModal(); Pages.discipline();
  } }] });
  setTimeout(() => UI.$('#iName') && UI.$('#iName').focus(), 50);
  }
};
