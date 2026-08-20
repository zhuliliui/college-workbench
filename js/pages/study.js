/* ============================================================
  复习计划页（月历 + 今日计划；仿截图：月历在上、今日计划在下）
  ============================================================ */
window.Pages = window.Pages || {};
let STUDY_VIEW = { date: null, month: null, mode: 'day' };
Pages.study = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const today = D.todayStr();
  if (!STUDY_VIEW.date) STUDY_VIEW.date = today;
  if (!STUDY_VIEW.month) STUDY_VIEW.month = today.slice(0, 7);
  const CATS = ['专业课', '英语', '复习', '作业', '考试', '读书', '其他'];

  const isToday = (t) => !t.due || D.fmtDate(D.parseLDT(t.due)) === today;
  const tasks = s.tasks.slice().sort((a, b) => (a.done - b.done) || (a.due || '').localeCompare(b.due || ''));
  const todayTasks = tasks.filter(isToday);
  const total = todayTasks.length;
  const done = todayTasks.filter((t) => t.done).length;
  const pending = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const R = 58, C = 2 * Math.PI * R;
  const ring = `<div class="ring">
  <svg width="132" height="132" viewBox="0 0 132 132">
  <circle cx="66" cy="66" r="${R}" fill="none" stroke="#e3efe6" stroke-width="12"/>
  <circle cx="66" cy="66" r="${R}" fill="none" stroke="url(#rg)" stroke-width="12" stroke-linecap="round"
  stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pct / 100)).toFixed(1)}"/>
  <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#a7c4ab"/><stop offset="1" stop-color="#5e8268"/></linearGradient></defs>
  </svg>
  <div class="center"><div class="pct">${pct}%</div></div>
  </div>`;

  const stats = `
  <div class="ring-stats">
  <div class="ring-stat"><div class="v">${done}</div><div class="l">已完成</div></div>
  <div class="ring-stat"><div class="v">${total}</div><div class="l">总任务</div></div>
  <div class="ring-stat"><div class="v">${pending}</div><div class="l">待完成</div></div>
  </div>`;

  // ---------- 月历 ----------
  function monthCells(yyyymm) {
    const [yy, mm] = yyyymm.split('-').map(Number);
    const first = new Date(yy, mm - 1, 1);
    const startW = (first.getDay() + 6) % 7; // 周一=0
    const dim = new Date(yy, mm, 0).getDate();
    const cells = [];
    const prev = new Date(yy, mm, 0).getDate();
    for (let i = startW - 1; i >= 0; i--) cells.push({ d: prev - i, other: true });
    for (let d = 1; d <= dim; d++) cells.push({ d, other: false });
    while (cells.length % 7) cells.push({ d: '·', other: true, tail: true });
    return cells;
  }
  const byDate = {};
  s.tasks.forEach((t) => { if (t.due) { const k = D.fmtDate(D.parseLDT(t.due)); (byDate[k] = byDate[k] || []).push(t); } });

  const dayCells = monthCells(STUDY_VIEW.month).map((cell) => {
    const dateStr = cell.other ? '' : (STUDY_VIEW.month + '-' + D.pad(cell.d));
    let cls = 'cal-cell', status = '', selStyle = '';
    if (!cell.other) {
      const ts = byDate[dateStr];
      if (ts && ts.length) {
        const doneCount = ts.filter((t) => t.done).length;
        const pendingCount = ts.length - doneCount;
        const all = doneCount === ts.length;
        cls += all ? ' green' : ' red';
        status = `<div class="cal-status"><span class="ok">${doneCount}✓</span><span class="no">${pendingCount}✗</span></div>`;
      } else status = '<div class="dot" style="background:transparent"></div>';
      if (dateStr === STUDY_VIEW.date) selStyle = ' style="outline:2px solid var(--primary);outline-offset:-2px"';
    } else status = '<div class="dot" style="background:transparent"></div>';
    return `<div class="${cls} ${cell.other ? 'other' : ''}"${selStyle}${dateStr ? ` data-act="day" data-date="${dateStr}"` : ''}><div class="d">${cell.d}</div>${status}</div>`;
  }).join('');

  function itemHtml(t) {
    const dueTxt = t.due ? ' ' + D.fmtDateTime(D.parseLDT(t.due)) : ' 无截止';
    const estTxt = t.est ? ' ' + t.est + ' 分钟' : ' 未估时';
    return `<div class="item ${t.done ? 'done' : ''}" data-id="${t.id}">
    <button class="check" data-act="toggle" data-id="${t.id}" aria-label="完成">${t.done ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
    <div class="body">
      <div class="name">${UI.esc(t.name)}</div>
      <div class="meta">${t.category ? `<span class="tag">${UI.esc(t.category)}</span>` : ''}<span>${dueTxt}</span><span>${estTxt}</span></div>
    </div>
    <div class="ops">
      <button class="btn btn-soft btn-icon" data-act="edit" data-id="${t.id}" title="编辑"><img class="ic" src="assets/icons/hk-32.png" alt=""/></button>
      <button class="btn btn-soft btn-icon" data-act="del" data-id="${t.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
    </div></div>`;
  }

  const weekHead = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((w) =>
    `<div class="cal-cell cal-weekday" style="background:transparent;border:none;color:var(--text-soft);font-weight:700;aspect-ratio:auto;min-height:auto">${w}</div>`).join('');

  const monthCard = `
  <div class="card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-37.png" alt=""/>学习计划月历</div>
      <div class="spacer"></div>
      <button class="btn btn-sm btn-soft" data-act="prev-month" title="上个月">‹</button>
      <span class="month-label">${STUDY_VIEW.month}</span>
      <button class="btn btn-sm btn-soft" data-act="next-month" title="下个月">›</button>
      <button class="btn btn-sm" data-act="today" style="margin-left:6px">今天</button>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="cal-grid">${weekHead}${dayCells}</div>
      <div class="cal-legend mt8 mb12">
        <div class="lg"><span class="sw" style="background:var(--success-soft);border:1px solid #c7ebcd"></span>当日任务全部完成</div>
        <div class="lg"><span class="sw" style="background:var(--danger-soft);border:1px solid #f3c7c2"></span>当日有未完成任务</div>
        <div class="lg"><span class="sw" style="background:var(--surface-2);border:1px solid var(--line)"></span>无学习任务</div>
      </div>
    </div>
  </div>`;

  // ---------- 今日计划 ----------
  const vt = STUDY_VIEW.date === today ? todayTasks
    : tasks.filter((t) => t.due && D.fmtDate(D.parseLDT(t.due)) === STUDY_VIEW.date);
  const vd = vt.filter((t) => t.done).length;
  const planListHtml = vt.length
    ? '<div class="list">' + vt.map(itemHtml).join('') + '</div>'
    : `<div class="empty"><img class="emoji" src="assets/icons/hk-38.png" alt=""/><div class="t">${STUDY_VIEW.date} 没有学习任务</div><div class="s">在上方月历选其他日期，或点「＋ 新增」添加</div></div>`;
  const planCard = `
  <div class="card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>今日计划 · ${STUDY_VIEW.date}</div>
      <div class="spacer"></div>
      <span class="sub">共 ${vt.length} 项 · 已完成 ${vd}</span>
      <button class="btn btn-sm" data-act="add" style="margin-left:8px">＋ 新增</button>
      <button class="btn btn-sm btn-soft" data-act="view-all">查看全部</button>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">${planListHtml}</div>
  </div>`;

  const allListHtml = tasks.length
    ? '<div class="list">' + tasks.map(itemHtml).join('') + '</div>'
    : `<div class="empty"><img class="emoji" src="assets/icons/hk-38.png" alt=""/><div class="t">还没有学习任务</div><div class="s">点击「＋ 新增任务」开始规划</div></div>`;
  const allCard = `
  <div class="card">
    <div class="card-head">
      <div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>全部学习任务</div>
      <div class="spacer"></div>
      <button class="btn btn-sm" data-act="add" style="margin-left:8px">＋ 新增</button>
      <button class="btn btn-sm btn-soft" data-act="back-day">返回今日计划</button>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">${allListHtml}</div>
  </div>`;

  const weakHtml = (s.weakNotes.length ? '<div class="list">' : '') + s.weakNotes.map((w) => `
  <div class="item" data-id="${w.id}">
  <div class="body"><div class="name">${UI.esc(w.text)}</div></div>
  <div class="ops"><button class="btn btn-soft btn-icon" data-act="weak-del" data-id="${w.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button></div>
  </div>`).join('') + (s.weakNotes.length ? '</div>' : `<div class="empty"><img class="emoji" src="assets/icons/hk-39.png" alt=""/><div class="t">还没有记录</div><div class="s">记下容易混淆的知识点</div></div>`);

  const summary = s.dailySummary[today] || '';

  c.innerHTML = `
  ${STUDY_VIEW.mode === 'day' ? monthCard + planCard : allCard}

  <div class="card progress-card">
    <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-32.png" alt=""/>今日进度</div>
    <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">
      <div class="progress-top">${ring}<div class="progress-cap">完成率</div></div>
      <div class="progress-stats">${stats}</div>
    </div>
  </div>

  <div class="grid grid-2">
    <div class="card">
      <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-39.png" alt=""/>薄弱知识点备忘录</div>
      <div class="spacer"></div><button class="btn btn-sm btn-soft" data-act="weak-add">＋ 记录</button>
      <button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">${weakHtml}</div>
    </div>
    <div class="card">
      <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>每日学习小结</div>
      <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">
        <textarea class="textarea" id="summaryInput" placeholder="今天学了什么？有什么收获或卡点？">${UI.esc(summary)}</textarea>
        <button class="btn btn-sm mt12" data-act="save-summary">保存小结</button>
      </div>
    </div>
  </div>`;

  window.PageHandler = (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;

    if (act === 'prev-month') { const [y, m] = STUDY_VIEW.month.split('-').map(Number); const nm = new Date(y, m - 2, 1); STUDY_VIEW.month = nm.getFullYear() + '-' + D.pad(nm.getMonth() + 1); return Pages.study(); }
    if (act === 'next-month') { const [y, m] = STUDY_VIEW.month.split('-').map(Number); const nm = new Date(y, m, 1); STUDY_VIEW.month = nm.getFullYear() + '-' + D.pad(nm.getMonth() + 1); return Pages.study(); }
    if (act === 'today') { STUDY_VIEW.date = today; STUDY_VIEW.month = today.slice(0, 7); STUDY_VIEW.mode = 'day'; return Pages.study(); }
    if (act === 'day') { STUDY_VIEW.date = b.dataset.date; STUDY_VIEW.mode = 'day'; return Pages.study(); }
    if (act === 'view-all') { STUDY_VIEW.mode = 'all'; return Pages.study(); }
    if (act === 'back-day') { STUDY_VIEW.mode = 'day'; return Pages.study(); }

    if (act === 'add') return openTaskModal();
    if (act === 'edit') return openTaskModal(id);
    if (act === 'del') return UI.confirm('删除这条任务？', () => {
      Store.update((st) => { st.tasks = st.tasks.filter((t) => t.id !== id); });
      Pages.study();
    });
    if (act === 'toggle') {
      const t = s.tasks.find((x) => x.id === id); if (!t) return;
      const wasDone = t.done;
      const willDone = !wasDone;
      Store.update((st) => {
        const x = st.tasks.find((y) => y.id === id);
        x.done = willDone; x.doneAt = willDone ? new Date().toISOString() : null;
        if (x.skillTopicId && x.skillCourseId) {
          const tp = st.skill.topics.find((tp) => tp.id === x.skillTopicId);
          const cr = tp && tp.courses.find((c) => c.id === x.skillCourseId);
          if (cr) cr.done = willDone;
        }
      });
      if (willDone) { Store.earn(1, '完成学习复习任务'); UI.toast('任务完成 +1 金币', 'ok'); }
      else if (wasDone) { Store.deduct(1, '取消完成任务'); UI.toast('已取消，-1 金币', 'warn'); }
      Pages.study();
      return;
    }
    if (act === 'weak-add') {
      UI.openModal({
        title: '记录薄弱知识点', icon: '<img class="ic" src="assets/icons/hk-39.png" alt=""/>',
        body: `<div class="field"><label>内容</label><textarea class="textarea" id="mBody" placeholder="例如：虚拟内存与物理内存的区别"></textarea></div>`,
        actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
        { label: '保存', onClick: () => {
          const v = UI.val('#mBody'); if (!v) return UI.toast('写点内容吧', 'warn');
          Store.update((st) => st.weakNotes.unshift({ id: Store.uid(), text: v }));
          UI.closeModal(); Pages.study();
        } }],
      });
      setTimeout(() => UI.$('#mBody') && UI.$('#mBody').focus(), 50);
      return;
    }
    if (act === 'weak-del') return UI.confirm('删除这条记录？', () => {
      Store.update((st) => { st.weakNotes = st.weakNotes.filter((w) => w.id !== id); });
      Pages.study();
    });
    if (act === 'save-summary') {
      const v = UI.$('#summaryInput').value;
      Store.update((st) => { st.dailySummary[today] = v; });
      UI.toast('已保存今日小结', 'ok');
      return;
    }
  };

  function openTaskModal(editId) {
    const t = editId ? s.tasks.find((x) => x.id === editId) : null;
    const opt = CATS.map((c) => `<option ${t && t.category === c ? 'selected' : ''}>${c}</option>`).join('');
    // 新增任务默认落在当前查看日期，便于月历联动显示
    const defDue = (STUDY_VIEW.mode === 'day' && !t) ? (STUDY_VIEW.date + 'T09:00') : '';
    UI.openModal({
      title: t ? '编辑任务' : '新增学习任务', icon: '<img class="ic" src="assets/icons/hk-38.png" alt=""/>',
      body: `
      <div class="field"><label>任务名称</label><input class="input" id="tName" value="${UI.esc(t ? t.name : '')}" placeholder="如：复习高数第三章"/></div>
      <div class="row">
      <div class="field"><label>分类标签</label>
      <input class="input" id="tCat" list="catList" value="${UI.esc(t ? t.category : '')}" placeholder="选择或输入"/>
      <datalist id="catList">${opt}</datalist></div>
      <div class="field"><label>预估耗时(分钟)</label><input class="input" id="tEst" type="number" min="0" value="${t && t.est ? t.est : ''}" placeholder="60"/></div>
      </div>
      <div class="field"><label>截止时间</label><input class="input" id="tDue" type="datetime-local" value="${t ? (t.due || '') : defDue}"/></div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
      { label: t ? '保存' : '添加', onClick: () => {
        const name = UI.val('#tName'); if (!name) return UI.toast('请填写任务名称', 'warn');
        const data = { name, category: UI.val('#tCat'), est: parseInt(UI.val('#tEst')) || 0, due: UI.val('#tDue') };
        Store.update((st) => {
          if (t) Object.assign(st.tasks.find((x) => x.id === editId), data);
          else st.tasks.unshift(Object.assign({ id: Store.uid(), done: false, createdAt: new Date().toISOString(), addedDate: D.todayStr() }, data));
        });
        UI.closeModal(); Pages.study();
      } }],
    });
    setTimeout(() => UI.$('#tName') && UI.$('#tName').focus(), 50);
  }
};
