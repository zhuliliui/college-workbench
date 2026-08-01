/* ============================================================
   页面5 · 假期旅行规划
   ============================================================ */
window.Pages = window.Pages || {};
Pages.travel = function () {
  const s = Store.get();
  const t = s.travel;
  const c = UI.$('#content');

  // 行程
  const sched = t.schedule.slice().sort((a, b) => (a.day - b.day) || (a.time || '').localeCompare(b.time || ''));
  const schedHtml = sched.length ? `<div class="list">` + sched.map((x) => `
    <div class="item" data-id="${x.id}">
      <div class="body">
        <div class="name">${UI.esc(x.spot)}</div>
        <div class="meta"><span class="tag">第 ${x.day} 天</span>${x.time ? '<span>🕒 ' + UI.esc(x.time) + '</span>' : ''}${x.route ? '<span>🚩 ' + UI.esc(x.route) + '</span>' : ''}</div>
      </div>
      <div class="ops">
        <button class="btn btn-soft btn-icon" data-act="sch-edit" data-id="${x.id}">✏️</button>
        <button class="btn btn-soft btn-icon" data-act="sch-del" data-id="${x.id}">🗑</button>
      </div>
    </div>`).join('') + `</div>`
    : `<div class="empty"><span class="emoji">🗺</span><div class="t">还没有行程安排</div><div class="s">添加每日路线、景点与时间段</div></div>`;

  // 预算
  const sum = (arr, k) => arr.reduce((a, x) => a + (Number(x[k]) || 0), 0);
  const totalPlan = sum(t.budget, 'planned'), totalAct = sum(t.budget, 'actual');
  const overAll = totalAct > totalPlan;
  const budHtml = t.budget.length ? `<div class="table-scroll"><table class="tbl">
    <thead><tr><th>分项</th><th>预算</th><th>实际</th><th>差额</th><th></th></tr></thead><tbody>`
    + t.budget.map((b) => {
      const diff = (Number(b.actual) || 0) - (Number(b.planned) || 0);
      const over = diff > 0;
      return `<tr>
        <td>${UI.esc(b.category)}</td>
        <td>${D.money(b.planned)}</td>
        <td style="color:${over ? 'var(--danger)' : 'var(--text)'}">${D.money(b.actual)}</td>
        <td style="color:${over ? 'var(--danger)' : 'var(--success)'};font-weight:700">${over ? '+' : ''}${D.money(diff)}</td>
        <td><button class="btn btn-soft btn-icon" data-act="bud-edit" data-id="${b.id}">✏️</button>
            <button class="btn btn-soft btn-icon" data-act="bud-del" data-id="${b.id}">🗑</button></td>
      </tr>`;
    }).join('') + `</tbody></table></div>
    <div class="flex-between mt12"><div class="muted-text">合计预算 <b style="color:var(--text)">${D.money(totalPlan)}</b></div>
      <div style="font-weight:800;color:${overAll ? 'var(--danger)' : 'var(--success)'}">实际 ${D.money(totalAct)} ${overAll ? '· 超支 ' + D.money(totalAct - totalPlan) : ''}</div></div>`
    : `<div class="empty"><span class="emoji">💳</span><div class="t">还没有预算分项</div></div>`;

  // 物品
  const packHtml = t.checklist.length ? '<div class="list">' + t.checklist.map((x) => `
    <div class="item ${x.checked ? 'done' : ''}" data-id="${x.id}">
      <button class="check" data-act="pack-toggle" data-id="${x.id}">${x.checked ? '✓' : ''}</button>
      <div class="body"><div class="name">${UI.esc(x.name)}</div></div>
      <button class="btn btn-soft btn-icon" data-act="pack-del" data-id="${x.id}">🗑</button>
    </div>`).join('') + '</div>'
    : `<div class="empty"><span class="emoji">🎒</span><div class="t">还没有物品清单</div></div>`;

  c.innerHTML = `
  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">🗓</span>行程时间表</div>
      <div class="spacer"></div><button class="btn btn-sm" data-act="sch-add">＋ 添加行程</button>
      <button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">${schedHtml}</div>
  </div>

  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">💰</span>旅行预算统计</div>
      <div class="spacer"></div><button class="btn btn-sm" data-act="bud-add">＋ 添加分项</button>
      <button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">${budHtml}</div>
  </div>

  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">🎒</span>物品核对清单</div>
      <div class="spacer"></div><button class="btn btn-sm btn-soft" data-act="pack-add">＋ 添加物品</button>
      <button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">${packHtml}</div>
  </div>

  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">📌</span>备忘笔记</div>
      <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">
      <textarea class="textarea" id="notesInput" placeholder="景点预约信息、当地注意事项、交通卡办理…">${UI.esc(t.notes)}</textarea>
      <button class="btn btn-sm mt12" data-act="save-notes">保存备忘</button>
    </div>
  </div>`;

  window.PageHandler = (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'sch-add') return openSch();
    if (act === 'sch-edit') return openSch(id);
    if (act === 'sch-del') return UI.confirm('删除这条行程？', () => { Store.update((st) => { st.travel.schedule = st.travel.schedule.filter((x) => x.id !== id); }); Pages.travel(); });
    if (act === 'bud-add') return openBud();
    if (act === 'bud-edit') return openBud(id);
    if (act === 'bud-del') return UI.confirm('删除这项预算？', () => { Store.update((st) => { st.travel.budget = st.travel.budget.filter((x) => x.id !== id); }); Pages.travel(); });
    if (act === 'pack-add') { UI.openModal({ title: '添加物品', icon: '🎒', body: `<div class="field"><label>物品名称</label><input class="input" id="pk" placeholder="如：充电宝"/></div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: '添加', onClick: () => { const v = UI.val('#pk'); if (!v) return; Store.update((st) => st.travel.checklist.push({ id: Store.uid(), name: v, checked: false })); UI.closeModal(); Pages.travel(); } }] }); setTimeout(() => UI.$('#pk') && UI.$('#pk').focus(), 50); return; }
    if (act === 'pack-del') return UI.confirm('删除？', () => { Store.update((st) => { st.travel.checklist = st.travel.checklist.filter((x) => x.id !== id); }); Pages.travel(); });
    if (act === 'pack-toggle') { Store.update((st) => { const x = st.travel.checklist.find((y) => y.id === id); x.checked = !x.checked; }); Pages.travel(); return; }
    if (act === 'save-notes') { Store.update((st) => { st.travel.notes = UI.$('#notesInput').value; }); UI.toast('已保存', 'ok'); return; }
  };

  function openSch(editId) {
    const x = editId ? t.schedule.find((y) => y.id === editId) : null;
    UI.openModal({ title: x ? '编辑行程' : '添加行程', icon: '🗓',
      body: `
      <div class="row">
        <div class="field"><label>第几天</label><input class="input" id="sDay" type="number" min="1" value="${x ? x.day : 1}"/></div>
        <div class="field"><label>时间段</label><input class="input" id="sTime" value="${x ? (x.time || '') : ''}" placeholder="如 09:00-12:00"/></div>
      </div>
      <div class="field"><label>景点 / 地点</label><input class="input" id="sSpot" value="${x ? (x.spot || '') : ''}" placeholder="如 故宫"/></div>
      <div class="field"><label>路线 / 备注</label><input class="input" id="sRoute" value="${x ? (x.route || '') : ''}" placeholder="如 地铁1号线→步行"/></div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: x ? '保存' : '添加', onClick: () => {
        const spot = UI.val('#sSpot'); if (!spot) return UI.toast('请填景点', 'warn');
        const data = { day: parseInt(UI.val('#sDay')) || 1, time: UI.val('#sTime'), spot, route: UI.val('#sRoute') };
        Store.update((st) => { if (x) Object.assign(st.travel.schedule.find((y) => y.id === editId), data); else st.travel.schedule.push(Object.assign({ id: Store.uid() }, data)); });
        UI.closeModal(); Pages.travel();
      } }] });
    setTimeout(() => UI.$('#sSpot') && UI.$('#sSpot').focus(), 50);
  }

  function openBud(editId) {
    const b = editId ? t.budget.find((y) => y.id === editId) : null;
    UI.openModal({ title: b ? '编辑预算分项' : '添加预算分项', icon: '💰',
      body: `
      <div class="field"><label>分项名称</label><input class="input" id="bCat" value="${b ? (b.category || '') : ''}" placeholder="交通 / 住宿 / 餐饮 / 购物"/></div>
      <div class="row">
        <div class="field"><label>预算金额</label><input class="input" id="bPlan" type="number" min="0" value="${b ? (b.planned || '') : ''}"/></div>
        <div class="field"><label>实际花费</label><input class="input" id="bAct" type="number" min="0" value="${b ? (b.actual || '') : ''}"/></div>
      </div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: b ? '保存' : '添加', onClick: () => {
        const cat = UI.val('#bCat'); if (!cat) return UI.toast('请填分项', 'warn');
        const data = { category: cat, planned: parseFloat(UI.val('#bPlan')) || 0, actual: parseFloat(UI.val('#bAct')) || 0 };
        Store.update((st) => { if (b) Object.assign(st.travel.budget.find((y) => y.id === editId), data); else st.travel.budget.push(Object.assign({ id: Store.uid() }, data)); });
        UI.closeModal(); Pages.travel();
      } }] });
    setTimeout(() => UI.$('#bCat') && UI.$('#bCat').focus(), 50);
  }
};
