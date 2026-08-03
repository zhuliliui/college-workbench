/* ============================================================
  技能学习页（两级：专题列表 → 专题详情）
  · 完成任意 1 门课程 +1 金币（进入虚拟存钱罐）
  · 课程可关联到「学习复习计划」，在计划页统一打卡
  · 数据本地持久化，纳入全局 JSON 备份（store.skill）
  ============================================================ */
window.Pages = window.Pages || {};
Pages.skill = function () {
  const c = UI.$('#content');
  window.__skillViewId = null; // 从导航进入时默认回到专题列表；页内下钻用 render() 保留状态

  const getTopics = () => (Store.get().skill && Store.get().skill.topics) || [];
  const findTopic = (id) => getTopics().find((t) => t.id === id);

  function render() {
  const vid = window.__skillViewId;
  const t = vid ? findTopic(vid) : null;
  if (t) renderDetail(t); else renderList();
  wire();
  }

  // ---------- 第一级：专题列表 ----------
  function renderList() {
  const list = getTopics();
  let listHtml;
  if (!list.length) {
  listHtml = `<div class="empty"><img class="emoji" src="assets/icons/hk-01.png" alt=""/>
  <div class="t">还没有技能专题</div>
  <div class="s">点击右上角「新建专题」开始规划你的技能学习路线～</div></div>`;
  } else {
  listHtml = list.map((t) => {
  const total = (t.courses && t.courses.length) || 0;
  const done = total ? t.courses.filter((x) => x.done).length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="sk-topic" data-act="open" data-id="${t.id}">
  <div class="sk-ic">${t.icon ? UI.esc(t.icon) : '<img class="ic" src="assets/icons/hk-01.png" alt=""/>'}</div>
  <div class="sk-main">
  <div class="sk-name">${UI.esc(t.name)} ${t.reward ? '<span class="tag reward">专业列表</span>' : '<span class="tag">技能学习</span>'}</div>
  <div class="sk-sub">${total} 门课程 · ${done} 门已完成</div>
  <div class="sk-prog">
  <div class="progress"><span style="width:${pct}%"></span></div>
  <div class="sk-pct">${pct}%</div>
  </div>
  </div>
  <div class="ops">
  <button class="btn btn-soft btn-icon" data-act="rename" data-id="${t.id}" title="重命名"><img class="ic" src="assets/icons/hk-32.png" alt=""/></button>
  <button class="btn btn-soft btn-icon" data-act="del" data-id="${t.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </div>
  </div>`;
  }).join('');
  }

  c.innerHTML = `
  <div class="card">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-01.png" alt=""/>技能学习专题</div>
  <div class="spacer"></div>
  <button class="btn btn-sm" data-act="add-topic">＋ 新建专题</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">${listHtml}</div>
  </div>
  <div class="muted-text mt8"> 每完成 1 门课程 +1 金币；课程可关联到「学习复习计划」统一打卡。</div>`;
  }

  // ---------- 第二级：专题详情 ----------
  function renderDetail(t) {
  const courses = t.courses || [];
  const total = courses.length;
  const done = total ? courses.filter((x) => x.done).length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  let coursesHtml;
  if (!total) {
  coursesHtml = `<div class="empty"><img class="emoji" src="assets/icons/hk-27.png" alt=""/>
  <div class="t">还没有课程</div>
  <div class="s">点击「＋ 新增课程」添加第一条学习内容</div></div>`;
  } else {
  coursesHtml = courses.map((x) => {
  const tags = (x.tags && x.tags.length)
  ? x.tags.map((tg) => `<span class="tag">${UI.esc(tg)}</span>`).join('')
  : '';
  return `<div class="sk-course ${x.done ? 'done' : ''}" data-id="${x.id}">
  <div class="sk-ic">${x.icon ? UI.esc(x.icon) : '<img class="ic" src="assets/icons/hk-27.png" alt=""/>'}</div>
  <div class="sk-main">
  <div class="sk-title">${UI.esc(x.title)}</div>
  ${tags ? `<div class="sk-tags">${tags}</div>` : ''}
  ${x.desc ? `<div class="sk-desc">${UI.esc(x.desc)}</div>` : ''}
  ${x.duration ? `<div class="sk-dur"> 预估 ${UI.esc(x.duration)}</div>` : ''}
  </div>
  <div class="sk-ops">
  <div class="row2">
  ${x.url ? `<button class="btn btn-soft btn-icon" data-act="link" data-id="${x.id}" title="打开外链"><img class="ic" src="assets/icons/hk-29.png" alt=""/></button>` : ''}
  <button class="btn btn-soft btn-icon" data-act="edit-course" data-id="${x.id}" title="编辑"><img class="ic" src="assets/icons/hk-32.png" alt=""/></button>
  <button class="btn btn-soft btn-icon" data-act="del-course" data-id="${x.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </div>
  <button class="sk-check" data-act="check" data-id="${x.id}" title="打卡">${x.done ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : '○'}</button>
  </div>
  </div>`;
  }).join('');
  }

  c.innerHTML = `
  <button class="btn btn-soft btn-sm sk-back" data-act="back">← 返回专题列表</button>
  <div class="card mt12">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-01.png" alt=""/>${UI.esc(t.name)}</div>
  <div class="spacer"></div>
  <button class="btn btn-sm" data-act="add-course">＋ 新增课程</button>
  </div>
  <div class="card-body">
  ${t.intro ? `<div class="muted-text" style="margin-bottom:12px">${UI.esc(t.intro)}</div>` : ''}
  <div class="flex-between" style="margin-bottom:6px">
  <b style="color:var(--primary-deep)">总进度</b>
  <span class="muted-text" id="skDoneCount">已完成 ${done} / 共 ${total} 门</span>
  </div>
  <div class="progress" style="height:14px"><span style="width:${pct}%"></span></div>
  <div class="sk-pct mt8">${pct}%</div>
  </div>
  </div>
  <div class="mt12">${coursesHtml}</div>`;
  }

  // ---------- 事件委托 ----------
  function wire() {
  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;

  if (act === 'open') { window.__skillViewId = id; return render(); }
  if (act === 'back') { window.__skillViewId = null; return render(); }
  if (act === 'add-topic') return openTopicModal();
  if (act === 'rename') return openTopicModal(id);
  if (act === 'del') return UI.confirm('删除该专题？其下课程也会一并删除。', () => {
  Store.update((st) => {
  const t = st.skill.topics.find((x) => x.id === id);
  if (t && t.courses) {
  const taskIds = t.courses.map((c) => c.taskId).filter(Boolean);
  if (taskIds.length) st.tasks = st.tasks.filter((tk) => !taskIds.includes(tk.id));
  }
  st.skill.topics = st.skill.topics.filter((x) => x.id !== id);
  });
  if (window.__skillViewId === id) window.__skillViewId = null;
  Pages.skill();
  });
  if (act === 'add-course') return openCourseModal(window.__skillViewId);
  if (act === 'edit-course') return openCourseModal(window.__skillViewId, id);
  if (act === 'del-course') return UI.confirm('删除这门课程？', () => {
  Store.update((st) => {
  const t = st.skill.topics.find((x) => x.id === window.__skillViewId);
  if (t) {
  const cr = t.courses.find((c2) => c2.id === id);
  if (cr && cr.taskId) st.tasks = st.tasks.filter((tk) => tk.id !== cr.taskId);
  t.courses = t.courses.filter((c2) => c2.id !== id);
  }
  });
  Pages.skill();
  });
  if (act === 'check') {
  let nowDone = false, wasDone = false;
  Store.update((st) => {
  const t = st.skill.topics.find((x) => x.id === window.__skillViewId);
  if (t) {
  const cr = t.courses.find((c2) => c2.id === id);
  if (cr) {
  wasDone = cr.done;
  cr.done = !cr.done;
  nowDone = cr.done;
  // 同步关联的学习复习任务
  if (cr.taskId) {
  const tk = st.tasks.find((x) => x.id === cr.taskId);
  if (tk) { tk.done = cr.done; tk.doneAt = cr.done ? new Date().toISOString() : null; }
  }
  }
  }
  });
  if (nowDone) { Store.earn(1, '完成技能课程'); UI.toast('打卡成功 +1 金币', 'ok'); }
  else if (wasDone) { Store.deduct(1, '取消技能课程打卡'); UI.toast('已取消打卡，-1 金币', 'warn'); }
  else UI.toast('已取消打卡', 'ok');
  // 就地更新，避免整页跳转/重绘
  const row = UI.$(`.sk-course[data-id="${id}"]`);
  if (row) {
  row.classList.toggle('done', nowDone);
  const btn = row.querySelector('.sk-check');
  if (btn) btn.innerHTML = nowDone ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : '○';
  }
  const t = findTopic(window.__skillViewId);
  if (t) {
  const total = t.courses.length;
  const done = t.courses.filter((x) => x.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const bar = UI.$('.progress span');
  if (bar) bar.style.width = pct + '%';
  const pctText = UI.$('.sk-pct');
  if (pctText) pctText.textContent = pct + '%';
  const countText = UI.$('#skDoneCount');
  if (countText) countText.textContent = `已完成 ${done} / 共 ${total} 门`;
  }
  return;
  }
  if (act === 'link') {
  const t = findTopic(window.__skillViewId);
  const cr = t && t.courses.find((c2) => c2.id === id);
  if (cr && cr.url) {
  const url = cr.url;
  // 优先新标签打开；若被浏览器/预览沙箱拦截，则当前页打开兜底
  const w = window.open(url, '_blank', 'noopener');
  if (!w) { UI.toast('正在打开链接…（如被拦截请允许弹出窗口）', 'ok'); location.href = url; }
  } else UI.toast('该课程未设置外链', 'warn');
  return;
  }
  };
  }

  // ---------- 专题 新建 / 重命名 ----------
  function openTopicModal(editId) {
  const t = editId ? findTopic(editId) : null;
  UI.openModal({
  title: t ? '重命名专题' : '新建技能专题', icon: '<img class="ic" src="assets/icons/hk-01.png" alt=""/>',
  body: `
  <div class="field"><label>专题名称</label><input class="input" id="skName" value="${UI.esc(t ? t.name : '')}" placeholder="如：Python 数据分析"/></div>
  <div class="field"><label>专题类型</label>
  <select class="input" id="skType">
  <option value="skill"${(!t || !t.reward) ? ' selected' : ''}>技能学习（独立记录，打卡不加金币）</option>
  <option value="major"${(t && t.reward) ? ' selected' : ''}>专业列表（每完成 1 门课程 +1 金币）</option>
  </select>
  </div>
  <div class="field"><label>图标（emoji）</label><input class="input" id="skIcon" value="${UI.esc(t && t.icon ? t.icon : '')}" placeholder="" style="max-width:130px"/></div>
  <div class="field"><label>简介（选填）</label><textarea class="textarea" id="skIntro" placeholder="这个专题要达成什么目标？">${UI.esc(t ? (t.intro || '') : '')}</textarea></div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: t ? '保存' : '创建', onClick: () => {
  const name = UI.val('#skName'); if (!name) return UI.toast('请填写专题名称', 'warn');
  const reward = (UI.val('#skType') || 'skill') === 'major';
  const data = { name, reward, icon: UI.val('#skIcon') || '', intro: UI.val('#skIntro') };
  Store.update((st) => {
  if (t) Object.assign(st.skill.topics.find((x) => x.id === editId), data);
  else st.skill.topics.unshift(Object.assign({ id: Store.uid(), courses: [] }, data));
  });
  UI.closeModal(); Pages.skill();
  } }],
  });
  setTimeout(() => UI.$('#skName') && UI.$('#skName').focus(), 50);
  }

  // 把课程时长字符串估算为分钟（用于生成学习复习任务）
  function parseDuration(str) {
  if (!str) return 0;
  const s = String(str).trim();
  let m = s.match(/(\d+(?:\.\d+)?)\s*小?时/i);
  if (m) return Math.round(parseFloat(m[1]) * 60);
  m = s.match(/(\d+(?:\.\d+)?)\s*分钟?/i);
  if (m) return Math.round(parseFloat(m[1]));
  m = s.match(/(\d+(?:\.\d+)?)\s*h/i);
  if (m) return Math.round(parseFloat(m[1]) * 60);
  m = s.match(/(\d+(?:\.\d+)?)\s*m/i);
  if (m) return Math.round(parseFloat(m[1]));
  return 0;
  }

  // ---------- 课程 新增 / 编辑 ----------
  function openCourseModal(topicId, editId) {
  const t = findTopic(topicId);
  const cr = (editId && t) ? t.courses.find((x) => x.id === editId) : null;
  UI.openModal({
  title: cr ? '编辑课程' : '新增课程', icon: '<img class="ic" src="assets/icons/hk-27.png" alt=""/>',
  body: `
  <div class="field"><label>课程标题</label><input class="input" id="coTitle" value="${UI.esc(cr ? cr.title : '')}" placeholder="如：Pandas 数据清洗"/></div>
  <div class="row">
  <div class="field"><label>图标（emoji）</label><input class="input" id="coIcon" value="${UI.esc(cr ? (cr.icon || '') : '')}" style="max-width:130px"/></div>
  <div class="field"><label>预估时长</label><input class="input" id="coDur" value="${UI.esc(cr ? (cr.duration || '') : '')}" placeholder="如：2 小时"/></div>
  </div>
  <div class="field"><label>标签（逗号分隔，选填）</label><input class="input" id="coTags" value="${UI.esc(cr && cr.tags ? cr.tags.join(',') : '')}" placeholder="基础, 必学"/></div>
  <div class="field"><label>课程简介（选填）</label><textarea class="textarea" id="coDesc" placeholder="这门课讲什么？">${UI.esc(cr ? (cr.desc || '') : '')}</textarea></div>
  <div class="field"><label>外链地址（选填）</label><input class="input" id="coUrl" value="${UI.esc(cr ? (cr.url || '') : '')}" placeholder="https://..."/></div>
  <div class="field" style="display:flex;align-items:center;gap:8px">
  <input type="checkbox" id="coLinkTask" ${cr && cr.taskId ? 'checked' : ''}/>
  <label for="coLinkTask" style="margin:0;font-weight:400">同时加入学习复习计划（可在计划页统一打卡）</label>
  </div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: cr ? '保存' : '添加', onClick: () => {
  const title = UI.val('#coTitle'); if (!title) return UI.toast('请填写课程标题', 'warn');
  const linkTask = !!(UI.$('#coLinkTask') && UI.$('#coLinkTask').checked);
  const data = {
  title,
  icon: UI.val('#coIcon') || '',
  duration: UI.val('#coDur'),
  tags: UI.val('#coTags').split(',').map((s) => s.trim()).filter(Boolean),
  desc: UI.val('#coDesc'),
  url: UI.val('#coUrl').trim(),
  };
  Store.update((st) => {
  const tp = st.skill.topics.find((x) => x.id === topicId); if (!tp) return;
  let saved;
  if (cr) {
  saved = tp.courses.find((c2) => c2.id === editId);
  Object.assign(saved, data);
  } else {
  saved = Object.assign({ id: Store.uid(), done: false }, data);
  tp.courses.push(saved);
  }
  // 关联/取消关联学习复习计划任务
  if (linkTask && !saved.taskId) {
  const task = {
  id: Store.uid(),
  name: `[${tp.name}] ${saved.title}`,
  category: '技能学习',
  est: parseDuration(saved.duration),
  due: '',
  done: !!saved.done,
  createdAt: new Date().toISOString(),
  skillTopicId: tp.id,
  skillCourseId: saved.id,
  };
  st.tasks.unshift(task);
  saved.taskId = task.id;
  } else if (!linkTask && saved.taskId) {
  st.tasks = st.tasks.filter((tk) => tk.id !== saved.taskId);
  delete saved.taskId;
  }
  });
  UI.closeModal(); Pages.skill();
  } }],
  });
  setTimeout(() => UI.$('#coTitle') && UI.$('#coTitle').focus(), 50);
  }

  render();
};
