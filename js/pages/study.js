/* ============================================================
   学习复习计划页（原万能工作台任务管理）
   ============================================================ */
window.Pages = window.Pages || {};
Pages.study = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const today = D.todayStr();
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
    <div class="center"><div class="pct">${pct}%</div><div class="cap">完成率</div></div>
  </div>`;

  const stats = `
    <div class="ring-stats">
      <div class="ring-stat"><div class="v">${pct}%</div><div class="l">完成率</div></div>
      <div class="ring-stat"><div class="v">${done}</div><div class="l">已完成</div></div>
      <div class="ring-stat"><div class="v">${total}</div><div class="l">总任务</div></div>
      <div class="ring-stat"><div class="v">${pending}</div><div class="l">待完成</div></div>
    </div>`;

  let listHtml;
  if (tasks.length === 0) {
    listHtml = `<div class="empty"><span class="emoji">📝</span>
      <div class="t">还没有学习任务</div>
      <div class="s">点击右上角「新增任务」开始规划今天的学习吧～</div></div>`;
  } else {
    listHtml = '<div class="list">' + tasks.map((t) => {
      const dueTxt = t.due ? '⏰ ' + D.fmtDateTime(D.parseLDT(t.due)) : '⏰ 无截止';
      const estTxt = t.est ? '⏱ ' + t.est + ' 分钟' : '⏱ 未估时';
      return `<div class="item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <button class="check" data-act="toggle" data-id="${t.id}" aria-label="完成">${t.done ? '✓' : ''}</button>
        <div class="body">
          <div class="name">${UI.esc(t.name)}</div>
          <div class="meta">
            ${t.category ? `<span class="tag">${UI.esc(t.category)}</span>` : ''}
            <span>${dueTxt}</span><span>${estTxt}</span>
          </div>
        </div>
        <div class="ops">
          <button class="btn btn-soft btn-icon" data-act="edit" data-id="${t.id}" title="编辑">✏️</button>
          <button class="btn btn-soft btn-icon" data-act="del" data-id="${t.id}" title="删除">🗑</button>
        </div>
      </div>`;
    }).join('') + '</div>';
  }

  const weakHtml = (s.weakNotes.length ? '<div class="list">' : '') + s.weakNotes.map((w) => `
    <div class="item" data-id="${w.id}">
      <div class="body"><div class="name">${UI.esc(w.text)}</div></div>
      <div class="ops"><button class="btn btn-soft btn-icon" data-act="weak-del" data-id="${w.id}" title="删除">🗑</button></div>
    </div>`).join('') + (s.weakNotes.length ? '</div>' : `<div class="empty"><span class="emoji">💡</span><div class="t">还没有记录</div><div class="s">记下容易混淆的知识点</div></div>`);

  const summary = s.dailySummary[today] || '';

  c.innerHTML = `
  <div class="card">
    <div class="card-head">
      <div class="title"><span class="ic">📌</span>今日进度</div>
      <div class="spacer"></div>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">
      <div class="ring-wrap">${ring}${stats}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div class="title"><span class="ic">✅</span>学习复习任务</div>
      <span class="sub">完成 1 项 +1 元存入奖励存钱罐</span>
      <div class="spacer"></div>
      <button class="btn btn-sm" data-act="add">＋ 新增任务</button>
      <button class="collapse-btn" title="折叠">▾</button>
    </div>
    <div class="card-body">${listHtml}</div>
  </div>

  <div class="grid grid-2">
    <div class="card">
      <div class="card-head"><div class="title"><span class="ic">🧠</span>薄弱知识点备忘录</div>
        <div class="spacer"></div><button class="btn btn-sm btn-soft" data-act="weak-add">＋ 记录</button>
        <button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">${weakHtml}</div>
    </div>
    <div class="card">
      <div class="card-head"><div class="title"><span class="ic">📔</span>每日学习小结</div>
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

    if (act === 'add') return openTaskModal();
    if (act === 'edit') return openTaskModal(id);
    if (act === 'del') return UI.confirm('删除这条任务？', () => {
      Store.update((st) => { st.tasks = st.tasks.filter((t) => t.id !== id); });
      Pages.study();
    });
    if (act === 'toggle') {
      const t = s.tasks.find((x) => x.id === id); if (!t) return;
      const willDone = !t.done;
      Store.update((st) => {
        const x = st.tasks.find((y) => y.id === id);
        x.done = willDone; x.doneAt = willDone ? new Date().toISOString() : null;
      });
      if (willDone) Store.earn(1, '完成学习复习任务');
      Pages.study();
      return;
    }
    if (act === 'weak-add') {
      UI.openModal({
        title: '记录薄弱知识点', icon: '💡',
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
    UI.openModal({
      title: t ? '编辑任务' : '新增学习任务', icon: '📝',
      body: `
      <div class="field"><label>任务名称</label><input class="input" id="tName" value="${UI.esc(t ? t.name : '')}" placeholder="如：复习高数第三章"/></div>
      <div class="row">
        <div class="field"><label>分类标签</label>
          <input class="input" id="tCat" list="catList" value="${UI.esc(t ? t.category : '')}" placeholder="选择或输入"/>
          <datalist id="catList">${opt}</datalist></div>
        <div class="field"><label>预估耗时(分钟)</label><input class="input" id="tEst" type="number" min="0" value="${t && t.est ? t.est : ''}" placeholder="60"/></div>
      </div>
      <div class="field"><label>截止时间</label><input class="input" id="tDue" type="datetime-local" value="${t ? (t.due || '') : ''}"/></div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
        { label: t ? '保存' : '添加', onClick: () => {
          const name = UI.val('#tName'); if (!name) return UI.toast('请填写任务名称', 'warn');
          const data = { name, category: UI.val('#tCat'), est: parseInt(UI.val('#tEst')) || 0, due: UI.val('#tDue') };
          Store.update((st) => {
            if (t) Object.assign(st.tasks.find((x) => x.id === editId), data);
            else st.tasks.unshift(Object.assign({ id: Store.uid(), done: false, createdAt: new Date().toISOString() }, data));
          });
          UI.closeModal(); Pages.study();
        } }],
    });
    setTimeout(() => UI.$('#tName') && UI.$('#tName').focus(), 50);
  }
};
