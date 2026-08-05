/* ============================================================
  技能学习页（两级：专题列表 → 专题详情）
  · 课程可关联到「学习复习计划」，在计划页统一打卡
  · 数据本地持久化，纳入全局 JSON 备份（store.skill）
  ============================================================ */
window.Pages = window.Pages || {};
Pages.skill = function () {
  const c = UI.$('#content');
  window.__skillViewId = null; // 从导航进入时默认回到专题列表；页内下钻用 render() 保留状态

  const getTopics = () => (Store.get().skill && Store.get().skill.topics) || [];
  const findTopic = (id) => getTopics().find((t) => t.id === id);
  const getDailyTopics = () => (Store.get().skill && Store.get().skill.dailyTopics) || [];

  // 内置 AI 热门学习选题种子（来源：真实搜索整理，刷新时循环抽取）
  const AI_TOPIC_SEED = [
    { title: '2025年AI智能体开发完全指南：10个GitHub顶级教程资源', tags: ['AI智能体','GitHub','入门到精通'], url: 'https://cloud.tencent.com.cn/developer/article/2557199' },
    { title: '微软官方 AI Agents for Beginners 入门课程', tags: ['微软','AIAgent','入门课程'], url: 'https://github.com/microsoft/ai-agents-for-beginners' },
    { title: 'Agent Engineering 实践指南：从零基础到生产级AI Agent', tags: ['Agent工程','Prompt','LangChain'], url: 'https://juejin.cn/post/7507283160617385993' },
    { title: '智能体开发实战：提示词设计、开发框架与工作流详解', tags: ['提示词工程','LangChain','AutoGen','工作流'], url: 'https://developer.cloud.tencent.com.cn/article/2605239' },
    { title: '2025 最新 Coze AI Agent 全流程教程', tags: ['Coze','AIAgent','Prompt','插件开发'], url: 'https://cemcoe.com/blog/2025-coze-ai-agent-full-tutorial-prompt-flow-plugin.html' },
    { title: 'Hello-Agents 系统学习教程：从LLM到Agent框架', tags: ['HelloAgents','Agent框架','MCP'], url: 'http://youthcamp.bytedance.com/post/7581666412021399561' },
    { title: 'Hands-On Large Language Models 大型语言模型实战指南', tags: ['LLM','实战','Python'], url: 'https://github.com/HandsOnLLM/Hands-On-Large-Language-Models' },
    { title: 'Agents Engineering Mastery：企业级AI智能体工程实践', tags: ['CrewAI','LangGraph','MCP','AutoGen'], url: 'https://github.com/ed-donner/agents' },
    { title: 'Awesome AI Applications：100+ AI应用开发实例', tags: ['AI应用','RAG','CrewAI'], url: 'https://github.com/Arindam200/awesome-ai-apps' },
    { title: 'LLMs from Scratch：从零构建大语言模型', tags: ['LLM','Transformer','从零构建'], url: 'https://github.com/rasbt/LLMs-from-scratch' },
    { title: 'Designing Machine Learning Systems：ML系统设计权威指南', tags: ['ML系统','MLOps','系统设计'], url: 'https://github.com/chiphuyen/dmls-book' },
    { title: 'Made With ML：生产级机器学习系统工程', tags: ['MLOps','Ray','生产部署'], url: 'https://github.com/GokuMohandas/Made-With-ML' },
    // ---- 2026 当下真实热门：Vibe Coding / Agent / MCP / Context Engineering ----
    { title: 'Vibe Coding 完全指南：用自然语言让 AI 自动写程序（2025 热门范式）', tags: ['VibeCoding','AI编程','Cursor','新手'], url: 'https://jamespolik.pixnet.net/blog/posts/17347600974' },
    { title: 'Vibe Coding 时代如何入局？AI 原生编辑器与实战路径', tags: ['VibeCoding','Cursor','Bolt','Lovable'], url: 'https://developer.volcengine.com/articles/7589192969271164954' },
    { title: 'Vibe Coding 101 with Replit：用 AI 编程智能体从零做出可部署应用', tags: ['VibeCoding','Replit','AI智能体','部署'], url: 'https://www.deeplearning.ai/short-courses/vibe-coding-101-with-replit/' },
    { title: '10 个开源项目帮你掌握 Vibe Coding：从 AI 协作到自动化工作流', tags: ['VibeCoding','开源','GitHub','工作流'], url: 'https://www.shengwang.cn/blog/blogdetail/vibe-coding-github/' },
    { title: 'Awesome Vibe Coding：AI 辅助开发生态工具与资源大全', tags: ['VibeCoding','工具集','Agent','MCP'], url: 'https://github.com/filipecalegario/awesome-vibe-coding' },
    { title: 'Context Engineering 入门：用 CLAUDE.md / PRP 给 AI 编程助手完整上下文', tags: ['ContextEngineering','CLAUDE.md','提示词','工程化'], url: 'https://github.com/coleam00/context-engineering-intro' },
    { title: 'Vibe Coding 工作流模板：5 阶段从想法到 MVP 的结构化提示', tags: ['VibeCoding','Prompt','模板','MVP'], url: 'https://github.com/KhazP/vibe-coding-prompt-template' },
    { title: 'Model Context Protocol (MCP) 官方文档：让 AI 连接外部工具与数据', tags: ['MCP','协议','工具调用','Agent'], url: 'https://modelcontextprotocol.io' },
    { title: 'Vibe Check MCP：给 AI 智能体加“导师反馈”防止跑偏的监督服务', tags: ['MCP','Agent','反思','可靠性'], url: 'https://github.com/PV-Bhat/vibe-check-mcp-server' },
    { title: 'Claude Code 设置与命令集：把规格驱动开发带入 Vibe Coding 流程', tags: ['ClaudeCode','规格驱动','Agent','配置'], url: 'https://github.com/feiskyer/claude-code-settings' },
    { title: 'Vibe Kanban：用看板管理多 AI 编程智能体的任务流', tags: ['看板','多智能体','Agent','协作'], url: 'https://github.com/BloopAI/vibe-kanban' },
    { title: 'CrewAI 多智能体协作框架实战：组建会分工的 AI 团队', tags: ['CrewAI','多智能体','协作','Agent'], url: 'https://github.com/crewAIInc/crewAI' },
    { title: 'LangGraph：用图状态机构建可控、可循环的 Agent 工作流', tags: ['LangGraph','Agent','工作流','状态机'], url: 'https://github.com/langchain-ai/langgraph' },
    { title: 'RAG 检索增强生成实战：向量库 +  embeddings 搭建知识问答', tags: ['RAG','向量库','Embedding','LLM应用'], url: 'https://github.com/langchain-ai/langchain' },
  ];

  // 远程种子（可持续更新，不必重打包）：优先拉取，失败/超时静默回落内置种子
  let TOPIC_SEED = AI_TOPIC_SEED.slice();
  let _seedSynced = false;
  async function syncTopicSeed() {
    if (_seedSynced) return; _seedSynced = true;
    const sources = [
      'https://gitee.com/monichang/college-workbench/raw/updates/ai-topics.json',
      'https://raw.githubusercontent.com/zhuliliui/college-workbench/master/assets/ai-topics.json',
      './assets/ai-topics.json'
    ];
    for (const src of sources) {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 6000);
        const r = await fetch(src + (src.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), { signal: ctrl.signal });
        clearTimeout(to);
        if (!r.ok) continue;
        const arr = await r.json();
        if (Array.isArray(arr) && arr.length) { TOPIC_SEED = arr; return; }
      } catch (e) { /* 试下一个源 */ }
    }
  }

  // 从联网后端实时拉取「每日 AI 学习选题」：仅当日首次自动填充（之后用本地已存，避免覆盖用户编辑）
  // 后端 server.js 的 /api/ai/topics 每日首次启动抓取真实 AI 热门（arXiv + Hacker News），落盘 data/ai-topics.json
  let _aiTopicsLoaded = false;
  async function loadDailyAITopics() {
    const backend = Store.readerBackend();
    if (!backend) return false;
    const today = D.todayStr();
    const cur = Store.get().skill;
    if (cur.aiTopicsDate === today && cur.dailyTopics && cur.dailyTopics.length) return false; // 今日已加载，不覆盖
    if (_aiTopicsLoaded) return false;
    _aiTopicsLoaded = true; // 本次会话当日只拉一次
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(backend + '/api/ai/topics', { signal: ctrl.signal });
      clearTimeout(to);
      if (!r.ok) return false;
      const j = await r.json().catch(() => null);
      if (!j || !Array.isArray(j.topics) || !j.topics.length) return false;
      if (j.date && j.date !== today) return false; // 后端还没生成今日选题
      Store.update((st) => {
        st.skill.aiTopicsDate = today;
        st.skill.dailyTopics = j.topics.map((t) => ({ id: Store.uid(), title: t.title, tags: (t.tags || []).slice(), url: t.url || '' }));
        // 自动加入本地种子池（去重 + 上限 100），后端不可达时离线也能刷到最新热点
        const pool = (st.skill.topicPool || []).slice();
        st.skill.dailyTopics.forEach((f) => { if (!pool.some((p) => p.title === f.title)) pool.push(f); });
        st.skill.topicPool = pool.slice(-100);
      });
      return true;
    } catch (e) { return false; }
  }

  function render() {
  syncTopicSeed();
  const vid = window.__skillViewId;
  const t = vid ? findTopic(vid) : null;
  if (t) renderDetail(t); else renderList();
  wire();
  // 若配置了联网后端，异步拉取当日真实 AI 选题；加载成功后重渲染列表展示
  loadDailyAITopics().then((loaded) => { if (loaded) Pages.skill(); });
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
  <div class="muted-text mt8"> 课程可关联到「学习复习计划」统一打卡。</div>
  ${renderDailyTopics()}`;
  }

  // ---------- 每日AI学习选题 ----------
  function renderDailyTopics() {
  const topics = getDailyTopics();
  let html;
  if (!topics.length) {
    html = `<div class="empty"><img class="emoji" src="assets/icons/hk-01.png" alt=""/>
    <div class="t">还没有选题</div>
    <div class="s">点击右下角「＋」新增，或点上方「刷新一批选题」获取热门 AI 话题。</div></div>`;
  } else {
    html = topics.map((x, i) => {
    const tags = (x.tags || []).map((tg) => '#' + UI.esc(tg)).join(' ');
    const hasUrl = !!x.url;
    return `<div class="ai-topic-row" data-tid="${x.id}">
    <div class="ai-num">${i + 1}</div>
    <div class="ai-main">
      <div class="ai-title" contenteditable="true" data-field="title" data-tid="${x.id}">${UI.esc(x.title || '')}</div>
      <div class="ai-tags" contenteditable="true" data-field="tags" data-tid="${x.id}">${tags}</div>
    </div>
    <div class="ai-ops">
      <button class="btn btn-soft btn-icon ai-link ${hasUrl ? '' : 'disabled'}" data-act="ai-link" data-tid="${x.id}" title="${hasUrl ? '打开链接' : '未设置链接'}"><img class="ic" src="assets/icons/hk-29.png" alt=""/></button>
      <button class="btn btn-soft btn-icon" data-act="ai-del" data-tid="${x.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
    </div>
    </div>`;
    }).join('');
  }
  const backendOn = !!Store.readerBackend();
  const liveTag = backendOn ? `<span class="tag tag-live" title="已接入联网后端，每日实时更新真实 AI 热门选题">实时</span>` : '';
  return `
  <div class="card mt12 sk-daily-card">
  <div class="card-head">
    <div class="title"><img class="ic" src="assets/icons/hk-01.png" alt=""/>每日AI学习选题${liveTag}</div>
    <div class="spacer"></div>
    <button class="btn btn-sm btn-refresh" data-act="ai-refresh">⟳ 刷新一批选题</button>
    <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">${html}</div>
  <button class="ai-add-btn" data-act="ai-add" title="新增选题">＋</button>
  </div>`;
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
  <button class="btn btn-soft btn-icon sk-bili" data-act="bili" data-id="${x.id}" title="在 B 站搜相关教程"><img class="ic" src="assets/icons/hk-bili.png" alt=""/></button>
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
  c.addEventListener('blur', onDailyBlur, true);
  c.addEventListener('paste', onDailyPaste, true);
  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act, id = b.dataset.id, tid = b.dataset.tid;

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
  if (nowDone) { Store.earn(1, '完成技能课程'); UI.toast('打卡成功', 'ok'); }
  else if (wasDone) { Store.deduct(1, '取消技能课程打卡'); UI.toast('已取消打卡', 'warn'); }
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
  if (act === 'bili') return openBiliModal(id);
  if (act === 'ai-link') return openTopicLinkModal(tid);
  if (act === 'ai-del') return UI.confirm('删除这条选题？', () => {
  Store.update((st) => { st.skill.dailyTopics = st.skill.dailyTopics.filter((x) => x.id !== tid); });
  Pages.skill();
  });
  if (act === 'ai-add') {
  Store.update((st) => { st.skill.dailyTopics.push({ id: Store.uid(), title: '', tags: [], url: '' }); });
  Pages.skill();
  return;
  }
  if (act === 'ai-refresh') return UI.confirm('刷新将用一批新的 AI 热门选题覆盖当前列表，继续？', async () => {
  const backend = Store.readerBackend();
  if (backend) {
    try {
    UI.toast('正在从后端获取实时 AI 选题…', 'ok');
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(backend + '/api/ai/topics?refresh=1', { signal: ctrl.signal });
    clearTimeout(to);
    if (r.ok) {
      const j = await r.json().catch(() => null);
      if (j && Array.isArray(j.topics) && j.topics.length) {
      Store.update((st) => {
        st.skill.aiTopicsDate = D.todayStr();
        st.skill.dailyTopics = j.topics.map((t) => ({ id: Store.uid(), title: t.title, tags: (t.tags || []).slice(), url: t.url || '' }));
        // 自动加入本地种子池
        const pool = (st.skill.topicPool || []).slice();
        st.skill.dailyTopics.forEach((f) => { if (!pool.some((p) => p.title === f.title)) pool.push(f); });
        st.skill.topicPool = pool.slice(-100);
      });
      UI.toast('已刷新：后端实时 AI 选题 ' + j.topics.length + ' 条', 'ok');
      Pages.skill();
      return;
      }
    }
    } catch (e) { /* 后端失败则回退本地池/种子 */ }
  }
  // 无后端或后端失败：优先本地热点池（历史爬到的），没有再用内置种子
  Store.update((st) => {
    const pool = (st.skill.topicPool && st.skill.topicPool.length) ? st.skill.topicPool : TOPIC_SEED.slice();
    const idx = st.skill.topicSeedIndex || 0;
    const batch = 4;
    const next = [];
    for (let i = 0; i < batch; i++) {
    const s = pool[(idx + i) % pool.length];
    next.push({ id: Store.uid(), title: s.title, tags: s.tags.slice(), url: s.url });
    }
    st.skill.dailyTopics = next;
    st.skill.topicSeedIndex = (idx + batch) % pool.length;
  });
  UI.toast('已刷新 AI 学习选题', 'ok');
  Pages.skill();
  });
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
  <option value="skill"${(!t || !t.reward) ? ' selected' : ''}>技能学习</option>
  <option value="major"${(t && t.reward) ? ' selected' : ''}>专业列表</option>
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

  // ---------- 每日AI学习选题：编辑保存 / 链接弹窗 ----------
  function onDailyBlur(e) {
  const el = e.target.closest('[data-field]');
  if (!el) return;
  const field = el.dataset.field;
  const row = el.closest('[data-tid]');
  const tid = row && row.dataset.tid;
  if (!tid) return;
  saveDailyField(tid, field, el.innerText);
  }
  function onDailyPaste(e) {
  const el = e.target.closest('[data-field]');
  if (!el) return;
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
  }
  function saveDailyField(tid, field, raw) {
  Store.update((st) => {
    const t = (st.skill.dailyTopics || []).find((x) => x.id === tid);
    if (!t) return;
    const txt = String(raw).replace(/\s+/g, ' ').trim();
    if (field === 'title') t.title = txt;
    else if (field === 'tags') {
    t.tags = txt.split(/[#\s]+/).map((s) => s.trim()).filter(Boolean);
    }
  });
  }
  function openTopicLinkModal(tid) {
  const t = getDailyTopics().find((x) => x.id === tid);
  if (!t) return;
  const hasUrl = !!t.url;
  const actions = [
    { label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
    { label: '保存', onClick: () => {
      const url = UI.val('#aiTopicUrl').trim();
      Store.update((st) => {
      const tp = (st.skill.dailyTopics || []).find((x) => x.id === tid);
      if (tp) tp.url = url;
      });
      UI.closeModal(); Pages.skill();
    } }
  ];
  if (hasUrl) {
    actions.unshift({ label: '打开链接', cls: 'btn-soft', onClick: () => {
      const url = UI.val('#aiTopicUrl').trim();
      if (!url) return UI.toast('链接为空', 'warn');
      const w = window.open(url, '_blank', 'noopener');
      if (!w) { UI.toast('正在打开链接…', 'ok'); location.href = url; }
    } });
  }
  UI.openModal({
    title: '学习选题链接', icon: '<img class="ic" src="assets/icons/hk-29.png" alt=""/>',
    body: `<div class="field"><label>外部学习网页 URL</label><input class="input" id="aiTopicUrl" value="${UI.esc(t.url || '')}" placeholder="https://..."/></div>`,
    actions
  });
  }

  // ---------- B 站搜集：搜索视频并把选好的链接加入课程 🔗 ----------
  function openBiliModal(courseId) {
  const t = findTopic(window.__skillViewId);
  const cr = t && t.courses.find((c2) => c2.id === courseId);
  if (!cr) return;
  const kw = (cr.title || '').trim();
  UI.openModal({
  title: 'B 站搜集教程', icon: '<img class="ic" src="assets/icons/hk-bili.png" alt=""/>',
  body: `
  <div class="muted-text" style="margin-bottom:10px">课程：<b>${UI.esc(kw)}</b><br/>以课程标题为关键词去 B 站搜索，找到后把视频链接粘贴到下面即可加入本课 🔗。</div>
  <div class="field"><label>搜索关键词</label><input class="input" id="biliKw" value="${UI.esc(kw)}" placeholder="如：Pandas 数据清洗"/></div>
  <button class="btn" id="biliGo" style="width:100%;background:#fb7299;border-color:#fb7299;color:#fff;margin-top:4px">🔍 去 B 站搜索</button>
  <hr style="margin:14px 0;border:none;border-top:1px dashed var(--line)"/>
  <div class="field"><label>收藏到本课 🔗</label><input class="input" id="biliUrl" value="${UI.esc(cr.url || '')}" placeholder="https://www.bilibili.com/video/BV..."/></div>
  ${cr.url ? `<div class="muted-text" style="margin-top:6px">当前链接：<a href="${UI.esc(cr.url)}" target="_blank" rel="noopener">${UI.esc(cr.url)}</a></div>` : ''}`,
  actions: [
  { label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: cr.url ? '更新链接' : '保存链接', onClick: () => {
  const url = UI.val('#biliUrl').trim();
  Store.update((st) => {
  const tp = st.skill.topics.find((x) => x.id === window.__skillViewId);
  if (tp) {
  const c = tp.courses.find((c2) => c2.id === courseId);
  if (c) c.url = url;
  }
  });
  UI.closeModal(); Pages.skill();
  } }
  ],
  });
  setTimeout(() => {
  const go = UI.$('#biliGo');
  if (go) go.onclick = () => {
  const k = (UI.val('#biliKw') || '').trim();
  if (!k) return UI.toast('请输入搜索关键词', 'warn');
  const u = 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(k);
  const w = window.open(u, '_blank', 'noopener');
  if (!w) { UI.toast('正在打开 B 站…（如被拦截请允许弹出窗口）', 'ok'); location.href = u; }
  };
  }, 50);
  }

  render();
};
