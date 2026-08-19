/* ============================================================
  页面3 · 大学生记账存钱 + 虚拟奖励存钱罐
  ============================================================ */
window.Pages = window.Pages || {};
(function () {
  const QUOTES = [
  '又存下一笔啦，坚持下去想要的都会慢慢到手',
  '克制一次冲动消费，就是给未来的自己铺路',
  '每一笔积蓄，都是往后生活的底气',
  '今天的克制，是明天自由的伏笔 ',
  '慢慢攒，稳稳走，生活会给你答案',
  '少买一件冲动，就多一分从容',
  '你正在把「以后」变成「可以」',
  '存钱不是委屈自己，是给未来的自己留选择权',
  ];

  function piggySVG() {
  return `<img src="assets/icons/hk-02.png" alt="虚拟奖励存钱罐" style="width:100%;height:100%;object-fit:contain;display:block;">`;
  }

  function spawnCoin() {
  const art = UI.$('#piggyArt'); if (!art) return;
  const coin = document.createElement('div');
  coin.className = 'piggy-anim-coin';
  coin.textContent = '¥';
  art.appendChild(coin);
  setTimeout(() => coin.remove(), 1050);
  }

  let listenersBound = false;
  function bindPiggyListeners() {
  if (listenersBound) return; listenersBound = true;
  window.addEventListener('piggy:earn', () => { if (UI.$('#piggyArt')) { spawnCoin(); refreshPiggy(); } });
  window.addEventListener('piggy:withdraw', () => { if (UI.$('#piggyArt')) { spawnCoin(); refreshPiggy(); } });
  window.addEventListener('piggy:deduct', () => { if (UI.$('#piggyArt')) refreshPiggy(); });
  }
  function refreshPiggy() {
  const p = Store.get().piggy;
  const bal = UI.$('#piggyBalance'); if (bal) bal.innerHTML = D.money(p.balance).replace('¥', '<small>¥</small>');
  const te = UI.$('#piggyEarned'); if (te) te.textContent = D.money(p.totalEarned);
  }

  Pages.finance = function () {
  const s = Store.get();
  const f = s.finance, p = s.piggy;
  const c = UI.$('#content');
  const today = D.todayStr();
  const mk = D.monthKey();

  // 统计
  const todayExp = f.records.filter((r) => r.type === 'expense' && r.date === today).reduce((a, r) => a + r.amount, 0);
  const monthExp = f.records.filter((r) => r.type === 'expense' && (r.date || '').slice(0, 7) === mk).reduce((a, r) => a + r.amount, 0);
  const monthInc = f.records.filter((r) => r.type === 'income' && (r.date || '').slice(0, 7) === mk).reduce((a, r) => a + r.amount, 0);

  // 预算
  const budget = f.budget || 0;
  const budgetPct = budget > 0 ? Math.round((monthExp / budget) * 100) : 0;
  const over = budget > 0 && monthExp > budget;
  const budgetBar = over ? 'danger' : (budgetPct > 80 ? 'warn' : '');

  // 存钱目标（独立于虚拟存钱罐，金额由用户手动记录）
  const goal = f.savingsGoal || 0;
  const saved = f.savedAmount || 0;
  const goalPct = goal > 0 ? Math.min(100, Math.round((saved / goal) * 100)) : 0;
  const remain = Math.max(0, goal - saved);

  // 本月最大开销
  const monthRecs = f.records.filter((r) => r.type === 'expense' && (r.date || '').slice(0, 7) === mk);
  let maxExp = null;
  monthRecs.forEach((r) => { if (!maxExp || r.amount > maxExp.amount) maxExp = r; });

  // 记录列表（按筛选）
  const filterType = (UI.$('#recFilter') && UI.$('#recFilter').value) || 'all';
  const filterMonth = (UI.$('#recMonth') && UI.$('#recMonth').value) || mk;
  const refDateVal = (UI.$('#refDate') && UI.$('#refDate').value) || today;
  let recs = f.records.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));
  if (filterType !== 'all') recs = recs.filter((r) => r.type === filterType);
  if (filterMonth) recs = recs.filter((r) => (r.date || '').slice(0, 7) === filterMonth);
  const recsHtml = recs.length ? '<div class="list">' + recs.map((r) => `
  <div class="item" data-id="${r.id}">
  <div class="body">
  <div class="name">${UI.esc(r.category)} ${r.note ? '<span class="muted-text">· ' + UI.esc(r.note) + '</span>' : ''}</div>
  <div class="meta"><span>${r.date}</span></div>
  </div>
  <div style="font-weight:800;color:${r.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${r.type === 'income' ? '+' : '-'}${D.money(r.amount)}</div>
  <button class="btn btn-soft btn-icon" data-act="rec-del" data-id="${r.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </div>`).join('') + '</div>'
  : `<div class="empty"><img class="emoji" src="assets/icons/hk-18.png" alt=""/><div class="t">还没有收支记录</div><div class="s">记一笔，看清钱去哪了</div></div>`;

  //  withdrawal 历史
  const wdHtml = p.withdrawals.length ? '<div class="list mt12">' + p.withdrawals.map((w) => `
  <div class="item" style="padding:10px 13px">
  <div class="body"><div class="name">${UI.esc(w.reason)}</div>
  <div class="meta"><span>${D.fmtDate(w.date)}</span></div></div>
  <div style="font-weight:800;color:var(--danger)">-${D.money(w.amount)}</div>
  </div>`).join('') + '</div>' : '';

  const summary = (f.reflections[today] || '');

  c.innerHTML = `
  <div style="margin-bottom:6px">
  <h2 style="font-size:20px;color:var(--primary-deep);font-weight:800">大学生记账存钱</h2>
  <div class="muted-text">每一笔都记下来，钱才知道去了哪</div>
  </div>

  <div class="grid grid-3" style="margin-top:14px">
  <div class="stat"><div class="label"><img src="assets/icons/hk-23.png" alt="" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"/>今日支出</div><div class="value" style="color:var(--danger)">${D.money(todayExp)}</div></div>
  <div class="stat"><div class="label"><img src="assets/icons/hk-23.png" alt="" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"/>本月支出</div><div class="value" style="color:var(--danger)">${D.money(monthExp)}</div></div>
  <div class="stat"><div class="label"><img src="assets/icons/hk-02.png" alt="" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"/>本月收入</div><div class="value" style="color:var(--success)">${D.money(monthInc)}</div></div>
  </div>

  <div class="card" style="margin-top:16px">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-31.png" alt=""/>月度预算</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="flex-between">
  <div class="muted-text">已用 <b style="color:var(--text)">${D.money(monthExp)}</b> / 预算 ${D.money(budget)}</div>
  <div class="muted-text">使用率 <b style="color:${over ? 'var(--danger)' : 'var(--primary-deep)'}">${budgetPct}%</b></div>
  </div>
  <div class="progress ${budgetBar} mt8"><span style="width:${Math.min(100, budgetPct)}%"></span></div>
  ${over ? '<div class="tag danger mt8"> 预算已超支，注意节流</div>' : ''}
  <div class="row mt12">
  <div class="field" style="margin:0"><label>设置月度预算总额</label>
  <input class="input" id="budgetInput" type="number" min="0" value="${budget}" placeholder="如 2000"/></div>
  <button class="btn btn-sm" data-act="save-budget" style="align-self:flex-end">保存</button>
  </div>
  </div>
  </div>

  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-06.png" alt=""/>存钱目标</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="flex-between">
  <div class="muted-text">已存 <b style="color:var(--text)">${D.money(saved)}</b> / 目标 ${D.money(goal)}</div>
  <div class="muted-text">还差 <b style="color:var(--primary-deep)">${D.money(remain)}</b></div>
  </div>
  <div class="progress mt8"><span style="width:${goalPct}%"></span></div>
  <div class="muted-text mt8">完成度 <b style="color:var(--primary-deep)">${goalPct}%</b></div>
  <div class="row mt12">
  <div class="field" style="margin:0"><label>已存金额</label>
  <input class="input" id="savedInput" type="number" min="0" value="${saved}" placeholder="如 1000"/></div>
  <button class="btn btn-sm" data-act="save-saved" style="align-self:flex-end">保存</button>
  </div>
  <div class="row mt12">
  <div class="field" style="margin:0"><label>设置存钱总目标</label>
  <input class="input" id="goalInput" type="number" min="0" value="${goal}" placeholder="如 5000"/></div>
  <button class="btn btn-sm" data-act="save-goal" style="align-self:flex-end">保存</button>
  </div>
  </div>
  </div>

  <div class="card piggy-card">
  <div class="card-head"><div class="title"><img class="ic piggy-ic" src="assets/icons/hk-02.png" alt="存钱罐"/>虚拟奖励存钱罐</div>
  <div class="spacer"></div><button class="btn btn-sm btn-soft" data-act="withdraw">扣减（休闲消费）</button>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="piggy-stage" data-act="piggy-talk" title="点击听听存钱罐的悄悄话">
  <div class="piggy-art" id="piggyArt">${piggySVG()}</div>
  <div class="piggy-info">
  <div class="muted-text">当前余额</div>
  <div class="piggy-balance" id="piggyBalance">${D.money(p.balance).replace('¥', '<small>¥</small>')}</div>
  <div class="piggy-sub">
  <div class="s">累计赚取 <b id="piggyEarned">${D.money(p.totalEarned)}</b></div>
  <div class="s">扣款记录 <b>${p.withdrawals.length}</b> 笔</div>
  </div>
  <div class="muted-text mt8">完成任务自动存入 · 仅可用于休闲扣减 · 不可手动充值</div>
  <div class="piggy-click-tip">点击存钱罐，听听它想说什么</div>
  </div>
  </div>
  ${wdHtml ? '<div class="muted-text mt16" style="font-weight:600">历史扣款</div>' + wdHtml : ''}
  </div>
  </div>

  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-23.png" alt=""/>本月最大开销</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  ${maxExp ? `<div class="flex-between">
  <div><div class="name" style="font-weight:700">${UI.esc(maxExp.category)}</div>
  <div class="muted-text">${maxExp.date}${maxExp.note ? ' · ' + UI.esc(maxExp.note) : ''}</div></div>
  <div style="font-size:26px;font-weight:800;color:var(--danger)">${D.money(maxExp.amount)}</div>
  </div>` : `<div class="empty"><img class="emoji" src="assets/icons/hk-02.png" alt=""/><div class="t">本月暂无支出</div></div>`}
  </div>
  </div>

  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-18.png" alt=""/>收支记录</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="flex-wrap gap8" style="margin-bottom:12px;align-items:center">
  <select class="select" id="recFilter" style="max-width:150px" onchange="Pages.finance()">
  <option value="all" ${filterType === 'all' ? 'selected' : ''}>全部</option><option value="expense" ${filterType === 'expense' ? 'selected' : ''}>仅支出</option><option value="income" ${filterType === 'income' ? 'selected' : ''}>仅收入</option>
  </select>
  <input class="input" id="recMonth" type="month" value="${filterMonth}" style="max-width:160px" onchange="Pages.finance()"/>
  <button class="btn btn-sm" data-act="add-rec">＋ 记一笔</button>
  </div>
  ${recsHtml}
  </div>
  </div>

  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-29.png" alt=""/>消费反思记录</div>
  <div class="spacer"></div><span class="muted-text">按日期归档</span>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="row" style="margin-bottom:10px">
  <div class="field" style="margin:0"><label>选择日期</label><input class="input" id="refDate" type="date" value="${refDateVal}" onchange="Pages.finance()"/></div>
  </div>
  <textarea class="textarea" id="refInput" placeholder="复盘冲动消费、记录不必要开支、总结省钱思路…">${UI.esc(f.reflections[refDateVal] || summary)}</textarea>
  <button class="btn btn-sm mt12" data-act="save-ref">保存反思</button>
  </div>
  </div>`;

  bindPiggyListeners();

  // ---- 交互 ----
  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'save-budget') {
  const v = parseFloat(UI.$('#budgetInput').value) || 0;
  Store.update((st) => { st.finance.budget = v; }); UI.toast('预算已更新', 'ok'); Pages.finance(); return;
  }
  if (act === 'save-goal') {
  const v = parseFloat(UI.$('#goalInput').value) || 0;
  Store.update((st) => { st.finance.savingsGoal = v; }); UI.toast('目标已更新', 'ok'); Pages.finance(); return;
  }
  if (act === 'save-saved') {
  const v = parseFloat(UI.$('#savedInput').value) || 0;
  Store.update((st) => { st.finance.savedAmount = v; }); UI.toast('已存金额已更新', 'ok'); Pages.finance(); return;
  }
  if (act === 'withdraw') return openWithdraw();
  if (act === 'piggy-talk') return showPiggyMonologue();
  if (act === 'add-rec') return openRec();
  if (act === 'rec-del') return UI.confirm('删除这条记录？', () => {
  Store.update((st) => { st.finance.records = st.finance.records.filter((r) => r.id !== id); }); Pages.finance();
  });
  if (act === 'save-ref') {
  const dt = UI.$('#refDate').value || today;
  Store.update((st) => { st.finance.reflections[dt] = UI.$('#refInput').value; });
  UI.toast('已保存反思', 'ok'); return;
  }
  };
  };

  function showPiggyMonologue() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.querySelectorAll('.piggy-monologue').forEach((el) => el.remove());
  const pop = document.createElement('div');
  pop.className = 'piggy-monologue';
  pop.innerHTML = `
  <div class="piggy-mono-inner">
  <img class="piggy-mini" src="assets/piggy.svg" alt="存钱罐">
  <div class="q">${UI.esc(q)}</div>
  <div class="tip">— 你的小猪存钱罐</div>
  </div>`;
  document.body.appendChild(pop);
  const close = () => { if (pop && pop.parentNode) pop.remove(); };
  const t = setTimeout(close, 5200);
  pop.addEventListener('click', () => { clearTimeout(t); close(); });
  setTimeout(() => {
  document.addEventListener('click', function outside(e) {
  if (!pop.contains(e.target)) { clearTimeout(t); close(); document.removeEventListener('click', outside); }
  });
  }, 80);
  }

  function openWithdraw() {
  UI.openModal({ title: '从存钱罐扣减', icon: '<img class="ic" src="assets/icons/hk-02.png" alt=""/>',
  body: `<div class="muted-text" style="margin-bottom:12px">奖励金仅用于休闲消费（宵夜、游玩、美食等），不可手动充值，余额不为负。</div>
  <div class="field"><label>扣减金额（元）</label><input class="input" id="wAmt" type="number" min="0.01" step="0.01" placeholder="如 30"/></div>
  <div class="field"><label>扣款事由</label><input class="input" id="wReason" placeholder="如：周末和朋友聚餐"/></div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: '确认扣减', cls: 'btn-danger', onClick: () => {
  const amt = parseFloat(UI.val('#wAmt')); const reason = UI.val('#wReason');
  if (!amt || amt <= 0) return UI.toast('请输入有效金额', 'warn');
  const r = Store.withdraw(amt, reason);
  if (!r.ok) return UI.toast(r.msg, 'warn');
  UI.closeModal(); UI.toast('已扣减 ' + D.money(amt), 'ok'); Pages.finance();
  } }] });
  setTimeout(() => UI.$('#wAmt') && UI.$('#wAmt').focus(), 50);
  }

  function openRec() {
  const EXP_CATS = ['餐饮', '娱乐', '学费', '交通', '购物', '医疗', '其他'];
  const INC_CATS = ['打工收入', '生活费', '奖学金', '兼职', '其他'];
  UI.openModal({ title: '记一笔收支', icon: '<img class="ic" src="assets/icons/hk-18.png" alt=""/>',
  body: `
  <div class="field"><label>类型</label>
  <select class="select" id="rType" onchange="const cat=document.getElementById('rCat'),inc=['打工收入','生活费','奖学金','兼职','其他'],exp=['餐饮','娱乐','学费','交通','购物','医疗','其他'];cat.innerHTML=(this.value==='income'?inc:exp).map(c=>'<option>'+c+'</option>').join('')">
  <option value="expense">支出</option><option value="income">收入</option>
  </select></div>
  <div class="row">
  <div class="field"><label>金额（元）</label><input class="input" id="rAmt" type="number" min="0.01" step="0.01" placeholder="0.00"/></div>
  <div class="field"><label>分类</label>
  <select class="select" id="rCat">
  ${EXP_CATS.map((c) => `<option value="${c}" ${c === '餐饮' ? 'selected' : ''}>${c}</option>`).join('')}
  </select>
  </div>
  </div>
  <div class="field"><label>日期</label><input class="input" id="rDate" type="date" value="${D.todayStr()}"/></div>
  <div class="field"><label>备注（可选）</label><input class="input" id="rNote" placeholder="如：午餐"/></div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: '保存', onClick: () => {
  const type = UI.val('#rType'); const amt = parseFloat(UI.val('#rAmt'));
  if (!amt || amt <= 0) return UI.toast('请输入有效金额', 'warn');
  Store.update((st) => st.finance.records.unshift({ id: Store.uid(), type, amount: amt, category: UI.val('#rCat') || '其他', date: UI.val('#rDate') || D.todayStr(), note: UI.val('#rNote') }));
  UI.closeModal(); UI.toast('已记录', 'ok'); Pages.finance();
  } }] });
  setTimeout(() => UI.$('#rAmt') && UI.$('#rAmt').focus(), 50);
  }
})();
