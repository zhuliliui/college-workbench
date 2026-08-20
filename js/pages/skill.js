/* ============================================================
  技能学习页（两级：专题列表 → 专题详情）
  · 课程可关联到「复习计划」，在计划页统一打卡
  · 数据本地持久化，纳入全局 JSON 备份（store.skill）
  ============================================================ */
window.Pages = window.Pages || {};
// 模块级状态：AI 选题是否处于「已读热点」视图（必须在页面函数外，否则每次重渲染被重置）
let _topicReadView = false;
// AI 活动分类筛选 / 是否显示已结束 / 分页（模块级，重渲染不重置）
let _aeCat = 'all';
let _aeShowExpired = false;
let _aePage = 1;
const AE_PAGE_SIZE = 8;
  // 持久化当前专题详情（刷新后保留在课程详情页，不退回到列表）
  function saveSkillView() { try { if (window.__skillViewId) localStorage.setItem('cw_skill_view', window.__skillViewId); else localStorage.removeItem('cw_skill_view'); } catch (_) {} }

Pages.skill = function () {
  const c = UI.$('#content');
  // 刷新后从 localStorage 恢复当前专题；从导航进入时若 viewId 失效则回到列表；页内操作（如保存课程）保留当前专题详情
  (() => {
    const topics = (Store.get().skill && Store.get().skill.topics) || [];
    if (!window.__skillViewId) { try { window.__skillViewId = localStorage.getItem('cw_skill_view') || null; } catch (_) { window.__skillViewId = null; } }
    if (!window.__skillViewId || !topics.find((t) => t.id === window.__skillViewId)) window.__skillViewId = null;
  })();

  const getTopics = () => (Store.get().skill && Store.get().skill.topics) || [];
  const findTopic = (id) => getTopics().find((t) => t.id === id);
  const getDailyTopics = () => (Store.get().skill && Store.get().skill.dailyTopics) || [];

  // 内置 AI 热门学习选题种子（来源：真实搜索整理，刷新时循环抽取）
  const AI_TOPIC_SEED = [
    { title: 'Awesome-Hacking：黑客与安全研究资源大全（GitHub 精选）', tags: ['黑客','网络安全','资源集'], url: 'https://github.com/Hack-with-Github/Awesome-Hacking' },
    { title: 'awesome-pentest：渗透测试工具与方法集合（GitHub 精选）', tags: ['渗透测试','网络安全','工具集'], url: 'https://github.com/enaqx/awesome-pentest' },
    { title: 'Metasploit Framework：主流渗透测试 / 漏洞利用框架', tags: ['Metasploit','渗透','Exploit'], url: 'https://github.com/rapid7/metasploit-framework' },
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
    // ---- 2026.5-8 最新热门：MCP 规模化落地 / 多智能体 / Agent 记忆 ----
    { title: '2026 实战：Serverless + 百炼 + MCP 30 分钟搭一个会“干活”的 AI 智能体', tags: ['MCP','Serverless','百炼','智能体'], url: 'https://opc.csdn.net/6a55d60b10ee7a33f28d50d0.html' },
    { title: '智能体互联网时代：用 MCP 协议从零构建多工具协作 AI Agent 实战指南', tags: ['MCP','多工具协作','Agent','实战'], url: 'https://cloud.tencent.com/developer/article/2703526' },
    { title: '超详细 MCP + DeepSeek 打造 AI Agent 智能体：stdio/sse 双协议 + OAuth2 安全认证', tags: ['MCP','DeepSeek','智能体','OAuth2'], url: 'https://www.sanjieke.cn/course/detail/sjk/8009752' },
    { title: 'AI Agents 101：什么是 AI Agent？构建者的心智模型（含可直接运行的 Python 示例）', tags: ['AIAgent','入门','Python','心智模型'], url: 'https://www.aibuilderclub.io/blog/tag/ai-agents' },
    { title: 'AI Agents 记忆篇：in-context / 外部文件 / 向量数据库三种跨会话记忆模式', tags: ['Agent记忆','向量库','跨会话','教程'], url: 'https://www.aibuilderclub.io/blog/tag/ai-agents' },
    { title: 'The Complete AI Agents Guide (2026)：agent 循环、raw API vs 框架、多智能体与 MCP 全景', tags: ['AIAgent','指南','LangChain','CrewAI'], url: 'https://www.aibuilderclub.io/blog/tag/ai-agents' },
    { title: 'MCP 101：从零构建第一个 MCP Server 并让 Claude 调用任何 API（分步教程）', tags: ['MCP','Claude','Server','入门'], url: 'https://www.aibuilderclub.io/blog/tag/ai-agents' },
    { title: '用 Python 从零构建 AI Agent：60 行工具循环替代框架（Anthropic SDK）', tags: ['Python','AnthropicSDK','从零构建','Agent'], url: 'https://www.aibuilderclub.io/blog/tag/ai-agents' },
    { title: 'LangChain vs CrewAI vs Raw API (2026)：三个方案构建生产级 Agent 的诚实对比', tags: ['LangChain','CrewAI','对比','生产级'], url: 'https://www.aibuilderclub.io/blog/tag/ai-agents' },
    { title: 'Multi-Agent System Python 教程：Coordinator + Worker 架构 200 行实现', tags: ['多智能体','协调者','Python','架构'], url: 'https://www.aibuilderclub.io/blog/tag/ai-agents' },
    { title: 'Gemini 3 + LangChain：流式、多模态、工具调用、上下文缓存打造 AI Agent', tags: ['Gemini3','LangChain','多模态','Agent'], url: 'https://kgptalkie.com/tutorials/generative-ai' },
    { title: '构建个人 AI 员工团队：7 个 Agent 覆盖首席参谋/研究员/文案/数据分析', tags: ['Agent','生产力','自动化','个人助理'], url: 'https://www.aibuilderclub.io/blog/tag/ai-agents' },
    // ---- 爬虫 / 数据采集方向 ----
    { title: 'Firecrawl：用 AI 把任意网页转成结构化数据（搜索/抓取 API）', tags: ['爬虫','数据采集','API','AI'], url: 'https://github.com/firecrawl/firecrawl' },
    { title: 'Scrapy：Python 高性能网页爬虫与数据采集框架', tags: ['爬虫','Python','Scraping','框架'], url: 'https://github.com/scrapy/scrapy' },
    { title: 'EasySpider：可视化无代码网页爬虫/采集器（小红书/抖音/B站）', tags: ['爬虫','无代码','可视化','采集'], url: 'https://github.com/NaiboWang/EasySpider' },
    // ---- GitHub 全局热门（高 star / 趋势仓库，不限主题）----
    { title: 'build-your-own-x：通过复刻经典项目掌握编程（GitHub 高星）', tags: ['GitHub热门','练手项目','全栈','教程'], url: 'https://github.com/codecrafters-io/build-your-own-x' },
    { title: 'awesome：各类优质资源清单合集（GitHub 最高星仓库之一）', tags: ['GitHub热门','资源集','清单'], url: 'https://github.com/sindresorhus/awesome' },
    { title: 'public-apis：免费公开 API 大合集（开发者的宝藏清单）', tags: ['GitHub热门','API','开发者','资源'], url: 'https://github.com/public-apis/public-apis' },
    // ---- 2026 时兴热点：大模型补贴 / AI 支付 / 黑客松 / 硬件 ----
    { title: '小米百亿 Token 补贴计划：开发者免费调用大模型的福利与玩法', tags: ['小米','百亿Token','大模型','免费API'], url: 'https://www.mi.com/' },
    { title: 'AI 支付时代：大模型如何重塑支付与金融科技（智能风控/对话式支付）', tags: ['AI支付','金融科技','大模型','风控'], url: 'https://www.pingwest.com/' },
    { title: '黑客松 (Hackathon) 入门指南：48 小时从想法到 Demo 的 AI 项目实战', tags: ['黑客松','Hackathon','AI项目','实战'], url: 'https://github.com/' },
    { title: 'AI 眼镜元年：Ray-Ban Meta 与国产 AI 眼镜背后的多模态大模型技术', tags: ['AI眼镜','多模态','硬件','可穿戴'], url: 'https://www.36kr.com/' },
    { title: '具身智能：人形机器人 + 大模型，「机器人学到走」的 2026 主线', tags: ['具身智能','人形机器人','大模型','机器人'], url: 'https://www.zhihu.com/topic/20615677' },
    { title: 'DeepSeek 开源周盘点：R1/V3 之后的推理模型路线图与本地部署', tags: ['DeepSeek','推理模型','开源','本地部署'], url: 'https://github.com/deepseek-ai' },
    { title: 'MCP 生态爆发：2026 主流框架（Claude/DeepSeek/ChatGPT）如何统一接入工具', tags: ['MCP','生态','Agent','工具调用'], url: 'https://modelcontextprotocol.io' },
    { title: 'AI 编程进入深水区：Claude Code / Cursor 之外的国产编程智能体对比', tags: ['AI编程','ClaudeCode','Cursor','国产'], url: 'https://www.jiqizhixin.com/' },
    { title: 'AI 智能体 + 百亿 Token：开发者从补贴到商业化的完整路径拆解', tags: ['AI智能体','Token补贴','商业化','开发者'], url: 'https://www.mi.com/' },
    { title: '多模态大模型实战：文字/图像/视频生成模型的能力边界与提示词技巧', tags: ['多模态','文生图','视频生成','提示词'], url: 'https://github.com/' },
    { title: 'AI 创意大赛季：学生开发者如何组队报名黑客松并做出获奖项目', tags: ['创意大赛','黑客松','学生','组队'], url: 'https://www.36kr.com/' },
    { title: 'AI 落地百行千业：从客服到医疗，2026 大模型行业应用案例集', tags: ['行业应用','落地','案例','大模型'], url: 'https://www.36kr.com/' },
  ];

  // 后端不可达提示降噪：整个浏览器会话（sessionStorage）只提示 1 次，避免反复弹 UI
  function warnBackendOnce(msg) {
  try {
  if (sessionStorage.getItem('cw_backend_warned')) return;
  sessionStorage.setItem('cw_backend_warned', '1');
  } catch (e) { /* 隐私模式可能禁用 sessionStorage */ }
  UI.toast(msg, 'warn');
  }

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
      // 降级加载：即使后端日期不是今天（例如本机后端未重启、UTC 差一天），也显示并标注实际日期，不直接丢弃
      const loadedDate = j.date || today;
      const seen = new Set();
      const topics = [];
      for (const t of j.topics) {
        const k = (t.title || '').trim().toLowerCase();
        if (!k || seen.has(k)) continue; // 后端两源（arXiv/HN）可能重复，前端再按标题去重保险
        seen.add(k);
        topics.push(t);
      }
      Store.update((st) => {
        st.skill.aiTopicsDate = loadedDate;
        st.skill.aiSource = j.source || ''; // 来源标记（GitHub/海外 或 国内直连）
        st.skill.dailyTopics = topics.map((t) => ({ id: Store.uid(), title: t.title, tags: (t.tags || []).slice(), url: t.url || '' }));
        // 自动加入本地种子池（去重 + 上限 100），后端不可达时离线也能刷到最新热点
        const pool = (st.skill.topicPool || []).slice();
        st.skill.dailyTopics.forEach((f) => { if (!pool.some((p) => p.title === f.title)) pool.push(f); });
        st.skill.topicPool = pool.slice(-100);
      });
      return true;
    } catch (e) { warnBackendOnce('后端连接失败，已用本地选题'); return false; }
  }

  function render() {
  syncTopicSeed();
  const vid = window.__skillViewId;
  const t = vid ? findTopic(vid) : null;
  if (t) renderDetail(t); else renderList();
  wire();
  // 若配置了联网后端，异步拉取当日真实 AI 选题；加载成功后仅在仍处于技能页时重渲染
  loadDailyAITopics().then((loaded) => { if (loaded && window.__currentPage === 'skill') Pages.skill(); });
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
  <button class="btn btn-sm" data-act="add-topic"><img class="ic" src="assets/icons/hk-33.png" alt=""/> 专题</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">${listHtml}</div>
  </div>
  <div class="muted-text mt8"> 课程可关联到「复习计划」统一打卡。</div>
  ${renderDailyTopics()}
  ${renderAIEvents()}`;
  }

  // ---------- AI 活动（全网可报名 AI 活动聚合：福利/学生/Token/内测/黑客松，过期自动过滤） ----------
  const AI_EVENT_CATS = [
  { key: 'fan', label: '🎁 福利', name: '课程/GPU/插件/公开Key' },
  { key: 'student', label: '🎓 学生认证', name: '学生认证福利' },
  { key: 'token', label: '🔑 Token', name: 'Token/算力' },
  { key: 'inner', label: '🧪 内测', name: '模型内测' },
  { key: 'hackathon', label: '🏆 黑客松', name: '黑客松/大赛' },
  { key: 'security', label: '🛡️ 安全', name: '黑客/网络安全' },
  { key: 'tool', label: '🧰 工具', name: '工具/资源' },
  ];
  // 内置活动种子（真实可报名/长期有效；date 为 '长期有效' 或 YYYY-MM-DD 截止日）
  // 内置活动种子（限时赛事带真实赛程 start/end/deadline；常态化/权益类 type=daily/tool 无截止）
  const AI_EVENTS_SEED = [
  { title: "莱森地平线·多智能体 AI 黑客松", cat: "hackathon", type: "event", start: "2026-08-16", end: "2026-10-17", deadline: "2026-10-10", url: "https://www.baidu.com/s?wd=%E8%8E%B1%E6%A3%AE%E5%9C%B0%E5%B9%B3%E7%BA%BF+AI%E9%BB%91%E5%AE%A2%E6%9D%BE", benefit: "万元级一等奖 + 多智能体协作/工具调用实战，个人与团队均可报名", org: "莱森购科技", tutorial: "" },
  { title: "REBUILD-Z × GEIA AI 黑客松（具身智能）", cat: "hackathon", type: "event", start: "2026-08-20", end: "2026-09-08", deadline: "2026-09-05", url: "https://www.competehub.dev/instalily.ai/competitions/urls6ff4f2c73b6086f5b856729f1484a141", benefit: "48 小时驻场开发，AI × 具身智能 × 跨学科，9/8-9/11 深圳", org: "REBUILD-Z / GEIA", tutorial: "" },
  { title: "2026 欧莱雅美妆科技黑客松·赛题2（信任守护师）", cat: "hackathon", type: "event", start: "2026-07-19", end: "2026-10-20", deadline: "2026-10-20", url: "https://tianchi.aliyun.com/competition", benefit: "20 万总奖金（冠军 8 万），多模态 AI 鉴真，全球高校在校生", org: "欧莱雅 × 天池", tutorial: "" },
  { title: "2026 和泰 AI 黑客松（中国台湾）", cat: "hackathon", type: "event", start: "2026-06-01", end: "2026-11-21", deadline: "2026-10-14", url: "https://ht-hackathon.tw/", benefit: "总奖金超 100 万新台币（冠军 30 万），GenAI × 出行行业真实命题（队长须具台湾地区身份）", org: "和泰集团", tutorial: "" },
  { title: "GOAI 世界人工智能开源大赛（Datawhale 夏令营二期组队）", cat: "hackathon", type: "event", start: "2026-08-18", end: "2026-09-30", deadline: "2026-09-15", url: "https://www.baidu.com/s?wd=GOAI+%E4%B8%96%E7%95%8C%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%E5%BC%80%E6%BA%90%E5%A4%A7%E8%B5%9B", benefit: "首届总奖金 500 万（冠军 100 万），Agent Infra / AI for Research 赛道", org: "GOAI × Datawhale", tutorial: "https://ailc.datawhale.cn/" },
  { title: "讯飞 AI 开发者大赛（Skill 开发方向等）", cat: "hackathon", type: "event", start: "2026-08-01", end: "2026-12-31", deadline: "2026-11-30", url: "https://challenge.xfyun.cn/", benefit: "星火大模型 + 行业数据集多赛道，奖金池 + 算力，可组队", org: "科大讯飞", tutorial: "" },
  { title: "阿里天池 AI 竞赛（常设赛事，按赛季更新）", cat: "hackathon", type: "event", start: "", end: "", deadline: "", url: "https://tianchi.aliyun.com/competition", benefit: "常设算法/AI 赛事 + 奖金 + 免费算力，实时看官网赛程", org: "阿里云", tutorial: "https://tianchi.aliyun.com/competition" },
  { title: "Datawhale 每月组队学习（免费开源）", cat: "hackathon", type: "daily", start: "2026-08-17", end: "2026-08-31", deadline: "2026-08-31", url: "https://www.datawhale.cn/activity", benefit: "每月滚动：Transformer实战营/具身智能/大模型算法/Codex入门等十几门，本期 8/17-8/31 报名", org: "Datawhale", tutorial: "" },
  { title: "Hugging Face 社区挑战赛（按赛题更新）", cat: "hackathon", type: "daily", start: "", end: "", deadline: "", url: "https://huggingface.co/challenges", benefit: "模型微调/应用挑战按月更新，随时可加入当前赛题", org: "Hugging Face", tutorial: "https://huggingface.co/learn" },
  { title: "Kaggle 竞赛（全球常设）", cat: "hackathon", type: "daily", start: "", end: "", deadline: "", url: "https://www.kaggle.com/competitions", benefit: "全球数据科学/AI 竞赛常设，免费 GPU Notebook，随时加入", org: "Kaggle", tutorial: "https://www.kaggle.com/learn" },
  { title: "GitHub Student Developer Pack（学生认证长期权益）", cat: "student", type: "daily", start: "", end: "", deadline: "", url: "https://education.github.com/pack", benefit: "edu 邮箱学生认证长期有效：Copilot / JetBrains / Azure / Canva 等几十项免费开发者工具", org: "GitHub", tutorial: "https://docs.github.com/zh/education/explore-the-benefits-of-github" },
  { title: "JetBrains 学生免费授权（全系 IDE）", cat: "student", type: "daily", start: "", end: "", deadline: "", url: "https://www.jetbrains.com/community/education/#students", benefit: "学生认证免费一年授权（IntelliJ/PyCharm/WebStorm 等），可续期，需 edu 邮箱或学生证", org: "JetBrains", tutorial: "https://www.jetbrains.com/community/education/#students" },
  { title: "Microsoft Azure for Students（学生免费额度）", cat: "student", type: "daily", start: "", end: "", deadline: "", url: "https://azure.microsoft.com/zh-cn/free/students/", benefit: "学生认证无需信用卡，送 $100 额度 + 免费云服务（12 个月），含 AI 服务额度", org: "Microsoft", tutorial: "https://azure.microsoft.com/zh-cn/free/students/" },
  { title: "阿里云学生认证（云工开物/高校计划）", cat: "student", type: "daily", start: "", end: "", deadline: "", url: "https://university.aliyun.com/", benefit: "学生认证送云服务器/算力代金券与免费课程，国内直连，需学信网/在校认证", org: "阿里云", tutorial: "https://university.aliyun.com/" },
  { title: "腾讯云校园认证（云+校园）", cat: "student", type: "daily", start: "", end: "", deadline: "", url: "https://cloud.tencent.com/act/campus", benefit: "学生认证送云资源代金券与免费算力试用，含大模型 API 体验额度，国内直连", org: "腾讯云", tutorial: "https://cloud.tencent.com/act/campus" },
  { title: "Notion for Students（学生免费 Plus）", cat: "student", type: "daily", start: "", end: "", deadline: "", url: "https://www.notion.so/product/notion-for-students", benefit: "edu 邮箱学生认证免费升级 Plus 版（无限块/历史/协作），笔记与知识库首选", org: "Notion", tutorial: "https://www.notion.so/product/notion-for-students" },
  { title: "Figma Education（学生免费专业版）", cat: "student", type: "daily", start: "", end: "", deadline: "", url: "https://www.figma.com/education/", benefit: "学生认证免费专业版（无限文件/团队库），UI 设计与原型工具，需 edu 邮箱", org: "Figma", tutorial: "https://www.figma.com/education/" },
  { title: "阿里云百炼：新用户免费大模型 Token", cat: "token", type: "daily", start: "", end: "", deadline: "", url: "https://bailian.console.aliyun.com/", benefit: "注册送免费 Token 额度，通义千问 Qwen 全系", org: "阿里云", tutorial: "" },
  { title: "DeepSeek 开放平台：新用户 API 免费额度", cat: "token", type: "daily", start: "", end: "", deadline: "", url: "https://platform.deepseek.com/", benefit: "DeepSeek API 注册赠送额度", org: "深度求索", tutorial: "https://api-docs.deepseek.com/zh-cn/" },
  { title: "智谱 AI 开放平台：注册送免费 GLM Token", cat: "token", type: "daily", start: "", end: "", deadline: "", url: "https://open.bigmodel.cn/", benefit: "GLM-4 系列模型免费 Token 额度", org: "智谱AI", tutorial: "" },
  { title: "Cursor 无限续杯教程（低成本长期使用）", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Cursor+%E6%97%A0%E9%99%90%E7%BB%AD%E6%9D%AF+%E6%95%99%E7%A8%8B", benefit: "社区低成本长期使用 Cursor 的玩法（个人 Pro / 续费优惠等）仍在更新；其 edu 学生认证已于 2026 年结束，教程自行甄别", org: "Cursor", tutorial: "https://cursor.com/" },
  { title: "Claude Code 低成本使用教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Claude+Code+%E5%85%8D%E8%B4%B9+%E4%BD%8E%E6%88%90%E6%9C%AC+%E6%95%99%E7%A8%8B", benefit: "Claude Code 免费额度 / 低成本调用思路，教程自行甄别", org: "Anthropic", tutorial: "https://docs.anthropic.com/" },
  { title: "OpenAI Codex 免费额度教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=OpenAI+Codex+%E5%85%8D%E8%B4%B9%E9%A2%9D%E5%BA%A6+%E6%95%99%E7%A8%8B", benefit: "Codex 免费/低成本使用思路，教程自行甄别", org: "OpenAI", tutorial: "https://openai.com/codex/" },
  { title: "Cloudflare WARP 官方免费版（自备网络通道）", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://one.one.one.one/", benefit: "官方免费加速/加密通道，使用请遵守当地法律法规", org: "Cloudflare", tutorial: "https://developers.cloudflare.com/warp-client/" },
  { title: "硅基流动 SiliconFlow：新用户免费 Token", cat: "token", type: "daily", start: "", end: "", deadline: "", url: "https://cloud.siliconflow.cn/", benefit: "注册送 2000 万 Token 免费额度，Qwen/DeepSeek/GLM 等开源模型 API，国内直连稳定", org: "硅基流动", tutorial: "https://docs.siliconflow.cn/" },
  { title: "火山方舟（字节）：新用户免费大模型额度", cat: "token", type: "daily", start: "", end: "", deadline: "", url: "https://www.volcengine.com/product/ark", benefit: "字节火山引擎方舟平台，Doubao/DeepSeek 等模型注册送试用额度，国内直连", org: "火山引擎", tutorial: "https://www.volcengine.com/docs/82379/" },
  { title: "腾讯混元：新用户免费 API 额度", cat: "token", type: "daily", start: "", end: "", deadline: "", url: "https://cloud.tencent.com/product/hunyuan", benefit: "腾讯混元大模型注册送免费额度，支持对话/文生图，国内直连", org: "腾讯云", tutorial: "https://cloud.tencent.com/document/product/1729" },
  { title: "阶跃星辰 Step：免费 API 额度", cat: "token", type: "daily", start: "", end: "", deadline: "", url: "https://platform.stepfun.com/", benefit: "阶跃星辰 Step 系列模型注册送免费 Token，多模态能力强", org: "阶跃星辰", tutorial: "" },
  { title: "MiniMax：免费 API 额度", cat: "token", type: "daily", start: "", end: "", deadline: "", url: "https://www.minimax.io/platform", benefit: "MiniMax 文本/语音/视频模型注册送免费额度", org: "MiniMax", tutorial: "" },
  { title: "Google AI Studio：免费 Gemini API Key", cat: "token", type: "daily", start: "", end: "", deadline: "", url: "https://aistudio.google.com/apikey", benefit: "Google 个人账号免费领 Gemini API Key，Gemini 2.5/3 Pro 可用（需自备网络通道）", org: "Google", tutorial: "https://aistudio.google.com/" },
  { title: "NVIDIA 开发者计划：免费课程 + GPU 试用", cat: "fan", type: "daily", start: "", end: "", deadline: "", url: "https://developer.nvidia.com/", benefit: "NVIDIA 深度学习学院免费课程、NGC 模型库、部分区域免费 GPU 试用", org: "NVIDIA", tutorial: "https://learn.nvidia.com/" },
  { title: "通义灵码（阿里）：免费 AI 编码插件", cat: "fan", type: "daily", start: "", end: "", deadline: "", url: "https://tongyi.aliyun.com/lingma", benefit: "阿里通义灵码 VS Code/IDEA 插件，代码补全+对话，个人完全免费", org: "阿里", tutorial: "https://help.aliyun.com/zh/lingma/" },
  { title: "Gemini 新模型内测招募（AI Test Kitchen）", cat: "inner", type: "daily", start: "", end: "", deadline: "", url: "https://labs.google/", benefit: "Google AI Test Kitchen / AI Studio 抢先体验 Gemini 新模型与实验功能", org: "Google", tutorial: "https://aistudio.google.com/" },
  { title: "Claude 新模型内测（Anthropic）", cat: "inner", type: "daily", start: "", end: "", deadline: "", url: "https://www.anthropic.com/", benefit: "Anthropic 官网/Claude 应用抢先体验新模型与功能（部分需排队）", org: "Anthropic", tutorial: "https://docs.anthropic.com/" },
  { title: "OpenAI 新模型 / Codex 内测", cat: "inner", type: "daily", start: "", end: "", deadline: "", url: "https://openai.com/", benefit: "OpenAI 官网与 ChatGPT 抢先体验新模型/Codex 新功能，学生可领 $100 额度", org: "OpenAI", tutorial: "https://openai.com/codex/" },
  { title: "Trae（字节）新功能内测", cat: "inner", type: "daily", start: "", end: "", deadline: "", url: "https://www.trae.com.cn/", benefit: "字节 Trae AI IDE 新功能内测申请，国内版与国际版同步更新", org: "字节跳动", tutorial: "https://www.trae.com.cn/" },
  { title: "智谱 GLM 新模型内测", cat: "inner", type: "daily", start: "", end: "", deadline: "", url: "https://open.bigmodel.cn/", benefit: "智谱 AI 开放平台抢先体验 GLM 新模型与 Agent 功能", org: "智谱AI", tutorial: "https://open.bigmodel.cn/" },
  { title: "豆包 大模型新功能内测", cat: "inner", type: "daily", start: "", end: "", deadline: "", url: "https://www.doubao.com/", benefit: "字节豆包 App/开放平台抢先体验新模型与创作功能", org: "字节跳动", tutorial: "https://www.volcengine.com/product/doubao" },
  { title: "腾讯混元 新模型内测", cat: "inner", type: "daily", start: "", end: "", deadline: "", url: "https://cloud.tencent.com/product/hunyuan", benefit: "腾讯混元开放平台抢先体验新模型与多模态能力", org: "腾讯", tutorial: "https://cloud.tencent.com/document/product/1729" },
  { title: "阶跃星辰 Step 新模型内测", cat: "inner", type: "daily", start: "", end: "", deadline: "", url: "https://platform.stepfun.com/", benefit: "阶跃星辰平台抢先体验 Step 新模型与多模态能力", org: "阶跃星辰", tutorial: "" },
  { title: "Gemini CLI 免费使用教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Gemini+CLI+%E5%85%8D%E8%B4%B9%E4%BD%BF%E7%94%A8%E6%95%99%E7%A8%8B", benefit: "npm i -g @google/gemini-cli，Google 个人账号登录免费 1000 次/天（Gemini 2.5/3 Pro）", org: "Google", tutorial: "https://github.com/google-gemini/gemini-cli" },
  { title: "GitHub Copilot 免费版使用教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=GitHub+Copilot+%E5%85%8D%E8%B4%B9%E7%89%88+%E6%95%99%E7%A8%8B", benefit: "Copilot Free 个人免费额度（每月补全+对话次数），学生/开源维护者更多", org: "GitHub", tutorial: "https://github.com/features/copilot" },
  { title: "Trae（字节）免费 AI IDE 教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Trae+AI+IDE+%E5%85%8D%E8%B4%B9%E6%95%99%E7%A8%8B", benefit: "字节 Trae 国内版/国际版完全免费，Chat+Builder 双模式，国内直连", org: "字节跳动", tutorial: "https://www.trae.com.cn/" },
  { title: "通义灵码免费 AI 编码教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=%E9%80%9A%E4%B9%89%E7%81%B5%E7%A0%81+%E5%85%8D%E8%B4%B9+%E6%95%99%E7%A8%8B", benefit: "阿里通义灵码 VS Code/IDEA 插件免费安装与配置，代码补全+单元测试", org: "阿里", tutorial: "https://help.aliyun.com/zh/lingma/" },
  { title: "硅基流动免费 API 教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=%E7%A1%85%E5%9F%BA%E6%B5%81%E5%8A%A8+%E5%85%8D%E8%B4%B9+API+%E6%95%99%E7%A8%8B", benefit: "SiliconFlow 注册送 Token，OpenAI 兼容接口调用 Qwen/DeepSeek 等开源模型", org: "硅基流动", tutorial: "https://docs.siliconflow.cn/" },
  { title: "Ollama 本地免费部署大模型教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Ollama+%E6%9C%AC%E5%9C%B0+%E5%85%8D%E8%B4%B9+%E9%83%A8%E6%A8%A1%E5%9E%8B+%E6%95%99%E7%A8%8B", benefit: "ollama run 本地跑 Qwen/DeepSeek/Llama，完全离线免费，隐私数据不出本机", org: "Ollama", tutorial: "https://ollama.com/" },
  { title: "OpenRouter 免费模型调用教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=OpenRouter+%E5%85%8D%E8%B4%B9%E6%A8%A1%E5%9E%8B+%E6%95%99%E7%A8%8B", benefit: "OpenRouter 聚合多厂商模型，部分模型免费额度，OpenAI 兼容接口", org: "OpenRouter", tutorial: "https://openrouter.ai/" },
  { title: "Groq 免费极速 API 教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Groq+%E5%85%8D%E8%B4%B9+API+%E6%95%99%E7%A8%8B", benefit: "groq.com 免费层，Llama/Mixtral/Gemma 极速推理（每秒数百 token），OpenAI 兼容接口，注册即送额度", org: "Groq", tutorial: "https://console.groq.com/" },
  { title: "DeepSeek 官方免费/低价 API 教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=DeepSeek+%E5%85%8D%E8%B4%B9+API+%E6%95%99%E7%A8%8B", benefit: "DeepSeek 官方 API 价格极低，新用户充值常送额度，V3/R1 全功能，OpenAI 兼容接口，国内直连", org: "DeepSeek", tutorial: "https://platform.deepseek.com/" },
  { title: "Kimi（月之暗面）免费使用教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Kimi+%E5%85%8D%E8%B4%B9+%E4%BD%BF%E7%94%A8+%E6%95%99%E7%A8%8B", benefit: "Kimi 智能助手网页/App 基础免费，长文本（200万字）解析，对话与文档总结", org: "月之暗面", tutorial: "https://kimi.moonshot.cn/" },
  { title: "豆包（字节）免费 AI 助手教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=%E8%B1%86%E5%8C%85+%E5%85%8D%E8%B4%B9+AI+%E5%8A%A9%E6%89%8B+%E6%95%99%E7%A8%8B", benefit: "豆包网页/App 完全免费对话，Doubao 模型，写作/翻译/图像生成，国内直连", org: "字节跳动", tutorial: "https://www.doubao.com/" },
  { title: "智谱 GLM 免费使用教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=%E6%99%BA%E8%B0%B1+GLM+%E5%85%8D%E8%B4%B9+%E4%BD%BF%E7%94%A8+%E6%95%99%E7%A8%8B", benefit: "智谱清言网页/App 基础免费，BigModel 开放平台 GLM-4 系列免费 Token 额度", org: "智谱AI", tutorial: "https://open.bigmodel.cn/" },
  { title: "Hugging Face 免费推理 API 教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Hugging+Face+%E5%85%8D%E8%B4%B9+%E6%8E%A8%E7%90%86+API+%E6%95%99%E7%A8%8B", benefit: "HF Inference API 免费额度调用开源模型，Spaces 免费部署 Demo，逛模型社区零成本", org: "Hugging Face", tutorial: "https://huggingface.co/docs/api-inference/" },
  { title: "Poe 免费 AI 聊天教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Poe+%E5%85%8D%E8%B4%B9+AI+%E8%81%8A%E5%A4%A9+%E6%95%99%E7%A8%8B", benefit: "Quora Poe 每日免费消息额度，可切换 GPT/Claude/Gemini 等多模型，网页/App 可用", org: "Poe", tutorial: "https://poe.com/" },
  { title: "Coze/扣子 免费搭建 AI Bot 教程", cat: "tool", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=Coze+%E6%89%A3%E5%AD%90+%E5%85%8D%E8%B4%B9+%E6%90%AD%E5%BB%BA+AI+Bot+%E6%95%99%E7%A8%8B", benefit: "字节扣子/Coze 免费可视化搭建 AI 智能体，插件/工作流/知识库，可发布到多渠道", org: "Coze", tutorial: "https://www.coze.cn/" },
  { title: "公益 API 中转站合集（免费调主流大模型）", cat: "fan", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=%E5%85%AC%E7%9B%8A+API+%E4%B8%AD%E8%BD%AC+%E7%AB%99+%E5%85%8D%E8%B4%B9", benefit: "社区免费 API 中转汇总（GitHub/论坛常更新），可免费调 GPT/Claude/Gemini 等；限流严格、勿商用，仅测试学习", org: "社区", tutorial: "" },
  { title: "GitHub 免费 API Key 收集仓库教程", cat: "fan", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=GitHub+%E5%85%8D%E8%B4%B9+API+Key+%E6%B1%87%E6%80%BB+%E4%BB%93%E5%BA%93", benefit: "GitHub 上汇总各类免费/公开可用 API Key 与免费额度的仓库，自行甄别有效性（部分已失效）", org: "GitHub", tutorial: "https://github.com/" },
  { title: "各类大模型官方免费 Key 领取入口汇总", cat: "fan", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=%E5%A4%A7%E6%A8%A1%E5%9E%8B+%E5%85%8D%E8%B4%B9+Key+%E9%A2%86%E5%8F%96", benefit: "Google AI Studio / 硅基流动 / DeepSeek 等官方免费 Key 领取入口汇总帖，优先用官方渠道最稳", org: "汇总", tutorial: "" },
  { title: "公开测试 API Key 使用须知（限速/勿商用）", cat: "fan", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=%E5%85%AC%E5%BC%80+API+Key+%E4%BD%BF%E7%94%A8+%E6%B3%A8%E6%84%8F", benefit: "公开分享的 Key 多为个人/社区志愿提供，限流严格、勿商用、勿泄露；优先官方免费额度更安全", org: "提醒", tutorial: "" },
  { title: "免费 API 聚合网关（一个 Key 调多模型）", cat: "fan", type: "tool", start: "", end: "", deadline: "", url: "https://www.baidu.com/s?wd=%E5%85%8D%E8%B4%B9+API+%E8%81%9A%E5%90%88%E7%BD%91%E5%85%B3", benefit: "OpenRouter / 硅基流动等聚合网关统一一个 Key 调多模型，部分模型免费，适合快速试用", org: "聚合", tutorial: "" },
  { title: "吴恩达 DeepLearning.AI 免费 AI 短课程", cat: "fan", type: "daily", start: "", end: "", deadline: "", url: "https://www.deeplearning.ai/", benefit: "吴恩达团队免费短课（ChatGPT / LLM / AI Agent 等），随到随学，完成可领证书", org: "DeepLearning.AI", tutorial: "https://learn.deeplearning.ai/" },
  { title: "2026 第二届海浪 AI 电影黑客松（阿那亚）", cat: "hackathon", type: "event", start: "2026-08-11", end: "2026-08-27", deadline: "2026-08-27", url: "https://www.aitop100.cn/infomation/details/34462.html", benefit: "48 小时阿那亚极限创作，AI 内容占比≥70%，最高 1 万元奖金 + 官方展示，报名 8/11–8/27", org: "海浪电影周 × 天猫小黑盒 × AMD", tutorial: "" },
  { title: "AI 造物黑客松·福州首站", cat: "hackathon", type: "event", start: "2026-08-01", end: "2026-08-30", deadline: "2026-08-25", url: "https://www.competehub.dev/manifest.webmanifest/competitions/urlsb779e5bec43b662d54c0eb86d01e0be0", benefit: "8/28–8/29 福州两日两夜开发，五赛道（AI硬件/社交陪伴/私域/商业/影视），冠军 ¥2 万，报名截止 8/25", org: "MONEYAI", tutorial: "" },
  { title: "CTFtime 全球 CTF 赛事日历", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://ctftime.org/", benefit: "全球 CTF 夺旗赛日历 + 战队排名；连后端刷新会自动拉取即将开赛的比赛（真实日期）", org: "CTFtime", tutorial: "https://ctftime.org/events/" },
  { title: "PortSwigger Web Security Academy（免费）", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://portswigger.net/web-security", benefit: "Burp Suite 官方免费 Web 安全学院，零基础到渗透测试的系统化在线实验室", org: "PortSwigger", tutorial: "https://portswigger.net/web-security/all-labs" },
  { title: "攻防世界 XCTF（国内 CTF 练习）", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://adworld.xctf.org.cn/", benefit: "国内最大 CTF 在线练习平台，新手区→高手区→大师区分难度刷题", org: "XCTF 联盟", tutorial: "" },
  { title: "BUUCTF（国内 CTF 真题库）", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://buuoj.cn/", benefit: "高校战队常用刷题平台，海量国内外赛事真题复现（含泛洪等经典靶场）", org: "BUU", tutorial: "" },
  { title: "TryHackMe（引导式安全学习）", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://tryhackme.com/", benefit: "房间式闯关学习路径，免费房间足够入门黑客技术（需自备网络通道）", org: "TryHackMe", tutorial: "https://tryhackme.com/path/outline/beginner" },
  { title: "Hack The Box（真实渗透靶场）", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://www.hackthebox.com/", benefit: "免费靶机 + 真实渗透环境，全球黑客技术排行榜（需自备网络通道）", org: "HTB", tutorial: "" },
  { title: "看雪学苑（逆向/安全社区）", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://www.kanxue.com/", benefit: "逆向工程/漏洞分析深度社区，免费文章 + 公开课 + 每年安全开发者峰会", org: "看雪", tutorial: "" },
  { title: "FreeBuf（安全资讯/活动日历）", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://www.freebuf.com/", benefit: "国内安全媒体：漏洞情报 / 公开课 / 安全活动与比赛日历", org: "FreeBuf", tutorial: "" },
  { title: "安全客（漏洞/攻防资讯）", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://www.anquanke.com/", benefit: "安全资讯、漏洞预警、攻防技术文章与活动信息", org: "安全客", tutorial: "" },
  { title: "合天网安实验室（在线实操）", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://www.hetianlab.com/", benefit: "浏览器里直接做安全实验（Web安全/逆向/密码学/CTF），大量免费实验", org: "合天网安", tutorial: "" },
  { title: "OWASP Top 10 + Juice Shop 靶场", cat: "security", type: "daily", start: "", end: "", deadline: "", url: "https://owasp.org/www-project-web-security-testing-guide/", benefit: "Web 安全测试标准指南 + OWASP Juice Shop 免费开源漏洞练习应用", org: "OWASP", tutorial: "https://owasp.org/www-project-juice-shop/" },
  ];
  const getAIEvents = () => {
  const s = Store.get().skill;
  s.aiEvents = s.aiEvents || [];
  return AI_EVENTS_SEED.concat(s.aiEvents.map((x) => Object.assign({}, x, { _user: true })));
  };
  // 过期判断：常态化(daily)/权益类(tool)不过期；限时赛事按 deadline(无则 end) 判断
  const aeExpired = (e) => {
  if (e.type === 'daily' || e.type === 'tool') return false;
  const d = String(e.deadline || e.end || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  return d < D.todayStr();
  };
  // 报名截止剩余天数（限时赛事），无 deadline/已过返回 null
  const aeDaysLeft = (e) => {
  const d = String(e.deadline || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const days = Math.ceil((new Date(d + 'T00:00:00') - new Date()) / 86400000);
  return days;
  };
  const aeTypeTag = (e) => {
  if (e.type === 'daily') return '<span class="tag ae-type-daily">🔁 常态化</span>';
  if (e.type === 'tool') return '<span class="tag ae-type-tool">🧰 资源</span>';
  return '<span class="tag ae-type-event">🏁 限时赛事</span>';
  };
  const aeCatName = (k) => { const c = AI_EVENT_CATS.find((x) => x.key === k); return c ? c.name : (k || ''); };
  function renderAIEvents() {
  const all = getAIEvents();
  // 限时赛事按报名截止升序排（临近截止优先），常态化/权益类放最后
  const sorted = all.slice().sort((a, b) => {
  const da = aeDaysLeft(a); const db = aeDaysLeft(b);
  if (da === null && db === null) return 0;
  if (da === null) return 1;
  if (db === null) return -1;
  return da - db;
  });
  const list = sorted.filter((e) => (aeExpired(e) ? _aeShowExpired : true)).filter((e) => _aeCat === 'all' || e.cat === _aeCat);
  const expiredN = sorted.filter((e) => aeExpired(e)).length;
  const activeN = sorted.length - expiredN;
  // 分页
  const totalPages = Math.max(1, Math.ceil(list.length / AE_PAGE_SIZE));
  if (_aePage > totalPages) _aePage = totalPages;
  if (_aePage < 1) _aePage = 1;
  const pageList = list.slice((_aePage - 1) * AE_PAGE_SIZE, _aePage * AE_PAGE_SIZE);
  const pageBtns = [];
  for (let p = 1; p <= totalPages; p++) {
  pageBtns.push(`<button class="ae-page-btn ${p === _aePage ? 'on' : ''}" data-act="ae-page" data-page="${p}">${p}</button>`);
  }
  const pagerHtml = totalPages > 1 ? `<div class="ae-pager">
  <button class="ae-page-btn" data-act="ae-page" data-page="${Math.max(1, _aePage - 1)}" ${_aePage <= 1 ? 'disabled' : ''}>‹</button>
  ${pageBtns.join('')}
  <button class="ae-page-btn" data-act="ae-page" data-page="${Math.min(totalPages, _aePage + 1)}" ${_aePage >= totalPages ? 'disabled' : ''}>›</button>
  <span class="muted-text" style="font-size:12px">${_aePage}/${totalPages} 页 · 共 ${list.length} 条</span>
  </div>` : '';
  const catTabs = ['all'].concat(AI_EVENT_CATS.map((c) => c.key)).map((k) => {
  const label = k === 'all' ? '全部' : (AI_EVENT_CATS.find((c) => c.key === k) || {}).label;
  return `<button class="ae-tab ${_aeCat === k ? 'on' : ''}" data-act="ae-cat" data-cat="${k}">${label}</button>`;
  }).join('');
  const rows = pageList.length ? pageList.map((e) => {
  const exp = aeExpired(e);
  const dl = aeDaysLeft(e);
  const dlCls = (dl !== null && dl <= 7) ? 'ae-urgent' : (dl !== null && dl <= 30) ? 'ae-soon' : '';
  const dlText = exp ? '⛔ 报名已截止' : (dl !== null ? `⏳ 报名截止还有 ${dl} 天（${UI.esc(e.deadline)}）` : (e.start ? `📅 ${UI.esc(e.start)}${e.end ? ' ~ ' + UI.esc(e.end) : ''}` : ''));
  return `<div class="ae-row ${exp ? 'ae-expired' : ''}">
  <div class="ae-main">
  <div class="ae-title">${UI.esc(e.title)}${e.org ? `<span class="ae-org"> · ${UI.esc(e.org)}</span>` : ''}</div>
  <div class="ae-meta">
  <span class="tag ae-cat-${e.cat}">${UI.esc(aeCatName(e.cat))}</span>
  ${aeTypeTag(e)}
  <span class="ae-time ${dlCls}">${dlText}</span>
  ${e.benefit ? `<span class="ae-benefit">🎁 ${UI.esc(e.benefit)}</span>` : ''}
  </div>
  </div>
  <div class="ae-ops">
  ${e.url ? `<a class="btn btn-sm btn-primary" href="${UI.esc(e.url)}" target="_blank" rel="noopener">${e.type === 'daily' || e.type === 'tool' ? '参与' : '报名'}</a>` : ''}
  ${e.tutorial ? `<a class="btn btn-soft btn-sm" href="${UI.esc(e.tutorial)}" target="_blank" rel="noopener">教程</a>` : ''}
  ${e._user ? `<button class="btn btn-soft btn-icon" data-act="ae-del" data-id="${e.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>` : ''}
  </div>
  </div>`;
  }).join('') : '<div class="muted-text center">该分类下暂无活动</div>';
  return `
  <div class="card mt12">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-01.png" alt=""/>AI 活动<span class="tag muted" style="margin-left:6px">可报名 ${activeN}</span></div>
  <div class="spacer"></div>
  ${expiredN ? `<button class="btn btn-soft btn-sm" data-act="ae-toggle-expired">${_aeShowExpired ? '隐藏已结束' : `已结束 ${expiredN}`}</button>` : ''}
  <button class="btn btn-soft btn-sm" data-act="ae-help" title="后端连接说明">ⓘ</button>
  <button class="btn btn-sm btn-refresh" data-act="ae-refresh"><img class="ic" src="assets/icons/hk-10.png" alt=""/> 刷新</button>
  <button class="btn btn-soft btn-sm" data-act="ae-add"><img class="ic" src="assets/icons/hk-33.png" alt=""/> 活动</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">
  <div class="muted-text" style="font-size:12px;margin-bottom:10px">🏁限时赛事带真实报名截止日期（过期自动隐藏）；🔁常态化为随时可加入的社区打卡/长期权益；🧰资源为教程与工具。已结束赛事已从清单剔除。</div>
  <div class="ae-tabs">${catTabs}</div>
  <div class="ae-list mt12">${rows}</div>
  ${pagerHtml}
  </div>
  </div>`;
  }


  // ---------- 每日AI学习选题 ----------
  // 已读热点独立视图（切换界面展示所有已读）
  function renderReadTopics() {
  const all = getDailyTopics();
  const readList = all.filter((x) => x.read);
  const _topicDate = Store.get().skill.aiTopicsDate || '';
  const body = readList.length
  ? `<div class="list ddl-list">` + readList.map((x) => {
    const tags = (x.tags || []).map((tg) => '#' + UI.esc(tg)).join(' ');
    return `<div class="item ddl-item" style="opacity:.72">
    <div class="body">
      <div class="name">${UI.esc(x.title || '')} <span class="tag muted">已读</span></div>
      ${tags ? `<div class="meta"><span>${tags}</span></div>` : ''}
      ${x.url ? `<div class="meta"><span>${UI.esc(x.url)}</span></div>` : ''}
      ${_topicDate ? `<div class="meta ai-date-meta"><span>收录于 ${UI.esc(_topicDate)}</span></div>` : `<div class="meta ai-date-meta"><span>本地选题</span></div>`}
    </div>
    <div class="ops">
      ${x.url ? `<button class="btn btn-soft btn-icon" data-act="ai-link" data-tid="${x.id}" title="打开链接"><img class="ic" src="assets/icons/hk-29.png" alt=""/></button>` : ''}
      <button class="btn btn-soft btn-icon" data-act="ai-unread" data-tid="${x.id}" title="取消已读（回到列表）">↺</button>
      <button class="btn btn-soft btn-icon" data-act="ai-del" data-tid="${x.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
    </div>
    </div>`;
  }).join('') + '</div>'
  : `<div class="empty"><img class="emoji" src="assets/icons/hk-38.png" alt=""/><div class="t">暂无已读热点</div><div class="s">把选题标记为已读后会出现在这里，方便回顾。</div></div>`;
  return `
  <div class="card mt12 sk-daily-card">
  <div class="card-head">
    <button class="btn btn-soft btn-sm" data-act="ai-read-back">← 返回选题</button>
    <div class="title" style="margin-left:8px"><img class="ic" src="assets/icons/hk-38.png" alt=""/>已读热点<span class="tag muted" style="margin-left:6px">${readList.length} 条</span></div>
    <div class="spacer"></div>
    <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">${body}</div>
  </div>`;
  }
  function renderDailyTopics() {
  if (_topicReadView) return renderReadTopics(); // 已读热点独立界面
  const all = getDailyTopics();
  const topics = all.filter((x) => !x.read); // 默认隐藏已读
  const _topicDate = Store.get().skill.aiTopicsDate || ''; // 仅显示真实收录日期；无日期（本地种子/离线）不冒领"今天"
  const _aiSource = Store.get().skill.aiSource || '';
  const srcTag = _aiSource === '国内直连' ? `<span class="tag ai-src-dom" title="VPN 不可用时自动回退国内直连源（知乎热榜/IT之家）">国内直连源</span>` : '';
  let html;
  if (!topics.length) {
    html = all.length
    ? `<div class="empty"><img class="emoji" src="assets/icons/hk-38.png" alt=""/>
    <div class="t">今日选题已全部读完</div>
    <div class="s">点上方「刷新一批选题」获取新热门，或「显示已读」查看已读热点。</div></div>`
    : `<div class="empty"><img class="emoji" src="assets/icons/hk-01.png" alt=""/>
    <div class="t">还没有选题</div>
    <div class="s">点击右下角「＋」新增，或点上方「刷新一批选题」获取热门 AI 话题。</div></div>`;
  } else {
    html = topics.map((x, i) => {
    const tags = (x.tags || []).map((tg) => '#' + UI.esc(tg)).join(' ');
    const hasUrl = !!x.url;
    const isRead = !!x.read;
    return `<div class="ai-topic-row ${isRead ? 'ai-read-done' : ''}" data-tid="${x.id}">
    <div class="ai-num">${isRead ? '✓' : (i + 1)}</div>
    <div class="ai-main">
      <div class="ai-title" contenteditable="true" data-field="title" data-tid="${x.id}">${UI.esc(x.title || '')}</div>
      <div class="ai-tags" contenteditable="true" data-field="tags" data-tid="${x.id}">${tags}</div>
      ${_topicDate ? `<div class="ai-date">收录于 ${UI.esc(_topicDate)}${srcTag}</div>` : `<div class="ai-date ai-local">本地选题</div>`}
    </div>
    <div class="ai-ops">
      <button class="btn btn-soft btn-icon ai-link ${hasUrl ? '' : 'disabled'}" data-act="ai-link" data-tid="${x.id}" title="${hasUrl ? '打开链接' : '未设置链接'}"><img class="ic" src="assets/icons/hk-29.png" alt=""/></button>
      ${isRead
      ? `<button class="btn btn-soft btn-icon" data-act="ai-unread" data-tid="${x.id}" title="取消已读（恢复显示）">↺</button>`
      : `<button class="btn btn-soft btn-icon" data-act="ai-read" data-tid="${x.id}" title="标记已读（不再显示）"><img class="ic" src="assets/icons/hk-38.png" alt=""/></button>`}
      <button class="btn btn-soft btn-icon" data-act="ai-del" data-tid="${x.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
    </div>
    </div>`;
    }).join('');
  }
  const readCount = all.filter((x) => x.read).length;
  const backendOn = !!Store.readerBackend();
  const liveTag = backendOn ? `<span class="tag tag-live" title="已接入联网后端，每日实时更新真实 AI 热门选题">实时</span>` : '';
  return `
  <div class="card mt12 sk-daily-card">
  <div class="card-head">
    <div class="title"><img class="ic" src="assets/icons/hk-01.png" alt=""/>每日AI学习选题${liveTag}</div>
    <div class="spacer"></div>
    ${readCount ? `<span class="tag muted">已读 ${readCount}</span>` : ''}
    ${readCount ? `<button class="btn btn-soft btn-sm" data-act="ai-show-read">已读热点</button>` : ''}
    <button class="btn btn-sm btn-refresh" data-act="ai-refresh">⟳ 刷新一批选题</button>
    <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">
    ${html}
    <button class="ai-add-btn" data-act="ai-add" title="新增选题">＋</button>
  </div>
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
  <div class="sk-top">
  <div class="sk-ic">${x.icon ? UI.esc(x.icon) : '<img class="ic" src="assets/icons/hk-27.png" alt=""/>'}</div>
  <div class="sk-main">
  <div class="sk-title">${UI.esc(x.title)}</div>
  ${tags ? `<div class="sk-tags">${tags}</div>` : ''}
  ${x.desc ? `<div class="sk-desc">${UI.esc(x.desc)}</div>` : ''}
  ${x.duration ? `<div class="sk-dur"> 预估 ${UI.esc(x.duration)}</div>` : ''}
  </div>
  </div>
  <div class="sk-ops">
  <button class="sk-check" data-act="check" data-id="${x.id}" title="打卡"><img class="ic" src="assets/icons/${x.done ? 'hk-38.png' : 'hk-06.png'}" alt=""/></button>
  ${x.url ? `<button class="btn btn-soft btn-icon" data-act="link" data-id="${x.id}" title="打开外链"><img class="ic" src="assets/icons/hk-29.png" alt=""/></button>` : ''}
  <button class="btn btn-soft btn-icon sk-bili" data-act="bili" data-id="${x.id}" title="在 B 站搜相关教程"><img class="ic" src="assets/icons/hk-bili.png" alt=""/></button>
  <button class="btn btn-soft btn-icon" data-act="edit-course" data-id="${x.id}" title="编辑"><img class="ic" src="assets/icons/hk-32.png" alt=""/></button>
  <button class="btn btn-soft btn-icon" data-act="del-course" data-id="${x.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </div>
  </div>`;
  }).join('');
  }

  c.innerHTML = `
  <button class="btn btn-soft btn-sm sk-back" data-act="back"><img class="ic" src="assets/icons/hk-15.png" alt=""/> 返回</button>
  <div class="card mt12">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-01.png" alt=""/>${UI.esc(t.name)}</div>
  <div class="spacer"></div>
  <button class="btn btn-sm" data-act="add-course"><img class="ic" src="assets/icons/hk-33.png" alt=""/> 课程</button>
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

  if (act === 'open') { window.__skillViewId = id; saveSkillView(); return render(); }
  if (act === 'back') { window.__skillViewId = null; saveSkillView(); return render(); }
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
  if (window.__skillViewId === id) { window.__skillViewId = null; saveSkillView(); }
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
  if (act === 'ai-read') {
  Store.update((st) => { const x = (st.skill.dailyTopics || []).find((y) => y.id === tid); if (x) x.read = true; });
  UI.toast('已标记已读，不再显示', 'ok');
  Pages.skill();
  return;
  }
  if (act === 'ai-show-read') {
  _topicReadView = true; // 切换到已读热点独立界面
  Pages.skill();
  return;
  }
  if (act === 'ai-read-back') {
  _topicReadView = false; // 返回选题列表
  Pages.skill();
  return;
  }
  if (act === 'ai-unread') {
  Store.update((st) => { const x = (st.skill.dailyTopics || []).find((y) => y.id === tid); if (x) x.read = false; });
  UI.toast('已取消已读，恢复显示', 'ok');
  Pages.skill();
  return;
  }
  if (act === 'ai-del') return UI.confirm('删除这条选题？', () => {
  Store.update((st) => { st.skill.dailyTopics = st.skill.dailyTopics.filter((x) => x.id !== tid); });
  Pages.skill();
  });
  if (act === 'ai-add') {
  Store.update((st) => { st.skill.dailyTopics.push({ id: Store.uid(), title: '', tags: [], url: '' }); });
  Pages.skill();
  return;
  }
  if (act === 'ae-cat') { _aeCat = b.dataset.cat; _aePage = 1; Pages.skill(); return; }
  if (act === 'ae-toggle-expired') { _aeShowExpired = !_aeShowExpired; _aePage = 1; Pages.skill(); return; }
  if (act === 'ae-page') { _aePage = parseInt(b.dataset.page) || 1; Pages.skill(); return; }
  if (act === 'ae-help') {
  const backend = Store.readerBackend();
  const curBackend = (Store.get().cal && Store.get().cal.backendUrl) || (Store.get().english.readerBackend || '');
  const loc = (typeof location !== 'undefined' && location) || {};
  const isLan = /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^169\.254\./.test(loc.hostname || '') || /^localhost$|^127\.0\.0\.1$|^\[::1\]$/i.test(loc.hostname || '');
  UI.openModal({
  title: '后端连接 · 实时数据来源', icon: '<img class="ic" src="assets/icons/hk-01.png" alt=""/>',
  body: `<div class="field"><label>当前状态</label>
  <div class="muted-text" style="font-size:13px">当前打开页面：<code>${UI.esc(loc.origin || '本地')}</code><br/>实时后端：${backend ? '<b style="color:var(--primary-deep)">' + UI.esc(backend) + '</b>' : '<span style="color:#c0392b">未启用（使用本地内置清单）</span>'}</div></div>
  <div class="field"><label>① 手机与电脑同一 WiFi（最简单）</label>
  <div class="muted-text" style="font-size:13px;line-height:1.8">1️⃣ 电脑运行 <code>node server.js</code>（本项目目录）<br/>2️⃣ 查电脑 IP：命令提示符输入 <code>ipconfig</code> 记下「IPv4 地址」（如 192.168.1.5）<br/>3️⃣ 手机<b>浏览器直接打开</b> <code>http://电脑IP:3000</code>（如 http://192.168.1.5:3000）<br/>4️⃣ 页面自动识别局域网 → 外刊 / 每日AI选题 / AI活动 实时数据全部走电脑后端，<b>无需手动填地址</b></div></div>
  <div class="field"><label>② 手机用的是云端/部署版（跨网络）</label>
  <div class="muted-text" style="font-size:13px;line-height:1.8">若手机打开的是云端链接（非电脑 IP），需手动把后端指向电脑：下面填入电脑局域网地址 <code>http://电脑IP:3000</code>，保存后即可实时同步。电脑 IP 变化后记得改回最新 IP。</div></div>
  <div class="field"><label>手动填写后端地址</label>
  <input class="input" id="aeBackendUrl" value="${UI.esc(curBackend)}" placeholder="http://192.168.1.5:3000"/>
  <div class="muted-text" style="font-size:12px;margin-top:4px">留空则恢复为自动识别（局域网页自动连、云端页用默认后端）。</div></div>`,
  actions: [
    { label: '清除', cls: 'btn-soft', onClick: () => {
      Store.update((st) => { if (st.cal) st.cal.backendUrl = ''; if (st.english) st.english.readerBackend = 'http://localhost:3000'; });
      UI.closeModal(); UI.toast('已清除手动后端地址', 'ok'); Pages.skill();
    } },
    { label: '保存地址', onClick: () => {
      const v = (UI.val('#aeBackendUrl') || '').trim().replace(/\/$/, '');
      if (v && !/^https?:\/\//i.test(v)) { UI.toast('地址需以 http:// 或 https:// 开头', 'warn'); return; }
      // 混合内容防呆：HTTPS 页面（云端部署）禁止调用 http:// 后端，浏览器会直接拦截
      if (v && location.protocol === 'https:' && /^http:\/\//i.test(v)) {
        UI.toast('当前是 HTTPS 安全页，浏览器会拦截 http:// 后端。请改用：① 浏览器直接打开 ' + v + '（HTTP 页可用）或 ② 填 HTTPS 后端（如 Railway）', 'warn');
        return;
      }
      Store.update((st) => { if (!st.cal) st.cal = {}; st.cal.backendUrl = v; if (v) { if (!st.english) st.english = {}; st.english.readerBackend = v; } });
      UI.closeModal(); UI.toast(v ? '已保存：将实时读取 ' + v : '已恢复自动识别', 'ok'); Pages.skill();
    } }
  ]
  });
  return;
  }
  if (act === 'ae-refresh') return (async () => {
  // 实时刷新：优先从后端拉取最新活动（assets/ai-events.json），合并去重后过滤过期
  const doLocalRefresh = () => {
  Store.update((st) => {
  st.skill.aiEvents = (st.skill.aiEvents || []).filter((e) => !aeExpired(e));
  });
  const expiredNow = getAIEvents().filter((e) => aeExpired(e)).length;
  UI.toast('已刷新：过滤 ' + expiredNow + ' 项已结束活动', 'ok');
  Pages.skill();
  };
  const backend = Store.readerBackend();
  if (backend) {
  try {
  UI.toast('正在从后端同步最新活动…', 'ok');
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  const r = await fetch(backend + '/api/ai/events?refresh=1', { signal: ctrl.signal });
  clearTimeout(to);
  if (r.ok) {
  const j = await r.json().catch(() => null);
  if (j && Array.isArray(j.events) && j.events.length) {
  const live = j.source === 'live';
  const nowStr = D.todayStr();
          Store.update((st) => {
          // 清掉上次同步的旧 _server 条目（本次刷新重新写入），用户自建条目保留；过期自建活动立即删除
          st.skill.aiEvents = (st.skill.aiEvents || []).filter((e) => !e._server && !aeExpired(e));
          const cur = (st.skill.aiEvents || []).slice();
          // 去重集同时含内置种子标题：后端返回「清单+实时」合并结果，清单与内置种子同源，避免重复显示
          const seen = new Set(cur.map((x) => x.title).concat(AI_EVENTS_SEED.map((x) => x.title)));
  for (const e of j.events) {
  if (!e || !e.title || seen.has(e.title)) continue;
  if (aeExpired(e)) continue; // 后端返回的过期活动不并入，保持列表干净
  seen.add(e.title);
  cur.push(Object.assign({ id: Store.uid(), _server: true }, e));
  }
  st.skill.aiEvents = cur;
  st.skill.aiEventsDate = j.date || '';
  });
  UI.toast(live ? '已抓取最新活动（' + j.events.length + ' 条，过期已剔除）' : '已同步活动清单（' + j.events.length + ' 条，过期已剔除）', 'ok');
  Pages.skill();
  return;
  }
  }
  } catch (e) { /* 后端不可达则回退本地 */ }
  }
  doLocalRefresh();
  })();
  if (act === 'ae-del') {
  Store.update((st) => { st.skill.aiEvents = (st.skill.aiEvents || []).filter((x) => x.id !== id); });
  Pages.skill();
  return;
  }
  if (act === 'ae-add') {
  const catOpts = AI_EVENT_CATS.map((c) => `<option value="${c.key}">${c.label}（${c.name}）</option>`).join('');
  UI.openModal({
  title: '添加 AI 活动', icon: '<img class="ic" src="assets/icons/hk-01.png" alt=""/>',
  body: `<div class="field"><label>活动名称</label><input class="input" id="aeTitle" placeholder="如：某某模型内测报名"/></div>
  <div class="row">
  <div class="field"><label>分类</label><select class="input" id="aeCat">${catOpts}</select></div>
  <div class="field"><label>类型</label><select class="input" id="aeType">
  <option value="event">🏁 限时赛事</option>
  <option value="daily">🔁 常态化打卡</option>
  <option value="tool">🧰 工具/教程</option>
  </select></div>
  </div>
  <div class="row">
  <div class="field"><label>报名开始（选填）</label><input class="input" id="aeStart" placeholder="2026-08-01"/></div>
  <div class="field"><label>报名截止</label><input class="input" id="aeDeadline" placeholder="2026-09-30 或留空"/></div>
  </div>
  <div class="field"><label>报名链接</label><input class="input" id="aeUrl" placeholder="https://..."/></div>
  <div class="field"><label>福利说明</label><input class="input" id="aeBenefit" placeholder="如：注册送 100 万 Token"/></div>
  <div class="field"><label>教程链接（选填）</label><input class="input" id="aeTutorial" placeholder="https://..."/></div>
  <div class="field"><label>主办方（选填）</label><input class="input" id="aeOrg" placeholder="如：阿里云"/></div>`,
  actions: [
  { label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: '保存', onClick: () => {
  const title = UI.val('#aeTitle').trim();
  if (!title) { UI.toast('请填写活动名称', 'warn'); return; }
  Store.update((st) => {
  st.skill.aiEvents = st.skill.aiEvents || [];
  st.skill.aiEvents.push({ id: Store.uid(), title, cat: UI.val('#aeCat') || 'token', type: UI.val('#aeType') || 'event', start: UI.val('#aeStart').trim(), deadline: UI.val('#aeDeadline').trim(), url: UI.val('#aeUrl').trim(), benefit: UI.val('#aeBenefit').trim(), tutorial: UI.val('#aeTutorial').trim(), org: UI.val('#aeOrg').trim() });
  });
  UI.closeModal(); UI.toast('已添加活动', 'ok'); Pages.skill();
  } }
  ]
  });
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
      const seen = new Set();
      const topics = [];
      for (const t of j.topics) {
        const k = (t.title || '').trim().toLowerCase();
        if (!k || seen.has(k)) continue;
        seen.add(k);
        topics.push(t);
      }
      Store.update((st) => {
        st.skill.aiTopicsDate = j.date || ''; // 真实后端日期；无日期不冒领"今天"
        st.skill.aiSource = j.source || '';
        st.skill.dailyTopics = topics.map((t) => ({ id: Store.uid(), title: t.title, tags: (t.tags || []).slice(), url: t.url || '' }));
        // 自动加入本地种子池
        const pool = (st.skill.topicPool || []).slice();
        st.skill.dailyTopics.forEach((f) => { if (!pool.some((p) => p.title === f.title)) pool.push(f); });
        st.skill.topicPool = pool.slice(-100);
      });
      UI.toast('已刷新：后端实时 AI 选题 ' + topics.length + ' 条', 'ok');
      Pages.skill();
      return;
      }
    }
    // 后端不可达 / 返回空：整个会话只提示 1 次，回退本地库
    warnBackendOnce('后端不可达，已用本地选题填充');
    } catch (e) {
    warnBackendOnce('后端连接失败，已用本地选题填充');
    }
  }
  // 无后端或后端失败：把「本地种子池(topicPool)」与「内置静态种子(TOPIC_SEED)」合并为同一个库再抽取
  // 实时抓取的真实热点优先，内置种子补足；合并后写回 topicPool 持久化 → 从此只有一个库
  Store.update((st) => {
    const base = (st.skill.topicPool && st.skill.topicPool.length) ? st.skill.topicPool.slice() : [];
    const pool = base.slice();
    for (const s of TOPIC_SEED) {
      if (!pool.some((p) => (p.title || '') === (s.title || ''))) pool.push(s);
    }
    const idx = st.skill.topicSeedIndex || 0;
    const batch = 4;
    const next = [];
    for (let i = 0; i < batch; i++) {
      const s = pool[(idx + i) % pool.length];
      if (s) next.push({ id: Store.uid(), title: s.title, tags: s.tags.slice(), url: s.url });
    }
    st.skill.dailyTopics = next;
    st.skill.aiTopicsDate = ''; // 本地种子非"收录"，清掉旧日期避免冒领真实日期
    st.skill.topicSeedIndex = (idx + batch) % pool.length;
    st.skill.topicPool = pool.slice(-100); // 整合为同一个库并持久化（内置种子也并入）
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
  <label for="coLinkTask" style="margin:0;font-weight:400">同时加入复习计划（可在计划页统一打卡）</label>
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
  // 关联/取消关联复习计划任务
  if (linkTask && !saved.taskId) {
  const task = {
  id: Store.uid(),
  name: `[${tp.name}] ${saved.title}`,
  category: '技能学习',
  est: parseDuration(saved.duration),
  due: '',
  done: !!saved.done,
  createdAt: new Date().toISOString(),
  addedDate: D.todayStr(),
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
  <button class="btn" id="biliGo" style="width:100%;background:#fb7299;border-color:#fb7299;color:#fff;margin-top:4px"><img class="ic" src="assets/icons/hk-bili.png" alt=""/> 搜索</button>
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
