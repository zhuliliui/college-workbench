/* ============================================================
  技能学习页（两级：专题列表 → 专题详情）
  · 课程可关联到「学习复习计划」，在计划页统一打卡
  · 数据本地持久化，纳入全局 JSON 备份（store.skill）
  ============================================================ */
window.Pages = window.Pages || {};
// 模块级状态：AI 选题是否处于「已读热点」视图（必须在页面函数外，否则每次重渲染被重置）
let _topicReadView = false;
// AI 活动分类筛选 / 是否显示已结束（模块级，重渲染不重置）
let _aeCat = 'all';
let _aeShowExpired = false;
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
    } catch (e) { return false; }
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
  <button class="btn btn-sm" data-act="add-topic">＋ 新建专题</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">${listHtml}</div>
  </div>
  <div class="muted-text mt8"> 课程可关联到「学习复习计划」统一打卡。</div>
  ${renderDailyTopics()}
  ${renderAIEvents()}`;
  }

  // ---------- AI 活动（全网可报名 AI 活动聚合：福利/学生/Token/内测/黑客松，过期自动过滤） ----------
  const AI_EVENT_CATS = [
  { key: 'fan', label: '🎁 福利', name: '粉丝福利' },
  { key: 'student', label: '🎓 学生', name: '学生福利' },
  { key: 'token', label: '🔑 Token', name: 'Token/算力' },
  { key: 'inner', label: '🧪 内测', name: '模型内测' },
  { key: 'hackathon', label: '🏆 黑客松', name: '黑客松/大赛' },
  { key: 'tool', label: '🧰 工具', name: '工具/资源' },
  ];
  // 内置活动种子（真实可报名/长期有效；date 为 '长期有效' 或 YYYY-MM-DD 截止日）
  const AI_EVENTS_SEED = [
  { title: '阿里云百炼：新用户免费大模型 Token（通义千问 Qwen）', cat: 'token', date: '长期有效', url: 'https://bailian.console.aliyun.com/', benefit: '注册送免费 Token 额度，可调用通义千问 Qwen 全系模型', org: '阿里云', tutorial: 'https://bailian.console.aliyun.com/' },
  { title: '百度智能云千帆：新用户免费 ERNIE Token / 算力', cat: 'token', date: '长期有效', url: 'https://cloud.baidu.com/product/wenxinworkshop', benefit: '文心一言 ERNIE 系列免费额度 + 千帆平台免费算力', org: '百度', tutorial: '' },
  { title: '智谱 AI 开放平台：注册送免费 GLM Token', cat: 'token', date: '长期有效', url: 'https://open.bigmodel.cn/', benefit: 'GLM-4 系列模型免费 Token 额度，新用户专享', org: '智谱AI', tutorial: '' },
  { title: 'DeepSeek 开放平台：新用户 API 免费额度', cat: 'token', date: '长期有效', url: 'https://platform.deepseek.com/', benefit: 'DeepSeek API 注册赠送额度，推理模型性价比之王', org: '深度求索', tutorial: 'https://api-docs.deepseek.com/zh-cn/' },
  { title: '讯飞星火开放平台：新用户免费额度', cat: 'token', date: '长期有效', url: 'https://xinghuo.xfyun.cn/', benefit: '星火大模型免费 Token，语音/多模态能力齐全', org: '科大讯飞', tutorial: '' },
  { title: '火山引擎方舟（豆包）：新用户 Token 券', cat: 'token', date: '长期有效', url: 'https://www.volcengine.com/product/ark', benefit: '豆包/DeepSeek 等模型免费 Token 券，注册即领', org: '字节跳动', tutorial: '' },
  { title: '腾讯云大模型知识引擎：混元免费额度', cat: 'token', date: '长期有效', url: 'https://cloud.tencent.com/product/lke', benefit: '腾讯混元大模型免费调用额度 + 开发工具', org: '腾讯云', tutorial: '' },
  { title: 'GitHub Student Developer Pack：学生免费领 Copilot / JetBrains 等', cat: 'student', date: '长期有效', url: 'https://education.github.com/benefits', benefit: '学生认证后 Copilot、JetBrains 全家桶、Azure 等免费', org: 'GitHub', tutorial: 'https://docs.github.com/zh/education/explore-the-benefits-of-github' },
  { title: 'JetBrains 学生授权：edu 邮箱免费全家桶', cat: 'student', date: '长期有效', url: 'https://www.jetbrains.com.cn/community/education/', benefit: 'IntelliJ / PyCharm / WebStorm 等全部免费', org: 'JetBrains', tutorial: '' },
  { title: 'Cursor 学生计划：教育邮箱认证学生优惠', cat: 'student', date: '长期有效', url: 'https://cursor.com/', benefit: '学生可申请 Cursor Pro 权益（AI 编程编辑器）', org: 'Cursor', tutorial: '' },
  { title: '阿里云开发者社区学生认证：学生云资源优惠', cat: 'student', date: '长期有效', url: 'https://developer.aliyun.com/adc/student/', benefit: '学生认证享云服务器/免费学习资源', org: '阿里云', tutorial: '' },
  { title: '腾讯云校园计划：学生专属云资源', cat: 'student', date: '长期有效', url: 'https://cloud.tencent.com/act/campus', benefit: '学生认证免费/低价云服务器与 AI 资源', org: '腾讯云', tutorial: '' },
  { title: 'Coze 扣子空间：新人礼包 + 邀请好友得积分', cat: 'fan', date: '长期有效', url: 'https://www.coze.cn/', benefit: '新人礼包、邀请奖励积分，可换算力', org: '字节跳动', tutorial: 'https://www.coze.cn/docs/' },
  { title: '通义千问 App：邀请好友得免费额度', cat: 'fan', date: '长期有效', url: 'https://tongyi.aliyun.com/', benefit: '邀请好友、每日签到领免费使用次数', org: '阿里云', tutorial: '' },
  { title: 'KIMI 智能助手：签到 / 邀请领免费算力', cat: 'fan', date: '长期有效', url: 'https://kimi.moonshot.cn/', benefit: '每日签到 + 邀请奖励，免费领取长文本算力', org: '月之暗面', tutorial: '' },
  { title: 'Gemini API 免费额度（Google AI Studio）', cat: 'inner', date: '长期有效', url: 'https://ai.google.dev/', benefit: 'Gemini 模型免费试用额度 + 抢先体验新模型', org: 'Google', tutorial: 'https://ai.google.dev/gemini-api/docs' },
  { title: '阿里天池大赛：各类 AI 竞赛（长期举办）', cat: 'hackathon', date: '长期有效', url: 'https://tianchi.aliyun.com/', benefit: '真实数据集 + 奖金 + 免费算力，常设算法/AI 赛事', org: '阿里云', tutorial: 'https://tianchi.aliyun.com/competition' },
  { title: 'Kaggle 竞赛：全球 AI 数据科学大赛', cat: 'hackathon', date: '长期有效', url: 'https://www.kaggle.com/competitions', benefit: '全球竞赛 + 奖金 + 免费 GPU Notebook', org: 'Kaggle', tutorial: 'https://www.kaggle.com/learn' },
  { title: '百度飞桨 AI Studio：AI 大赛 + 免费算力', cat: 'hackathon', date: '长期有效', url: 'https://aistudio.baidu.com/competition', benefit: '常设 AI 大赛 + 免费 GPU 算力 + 课程', org: '百度', tutorial: '' },
  { title: 'Datawhale AI 夏令营 / 组队学习', cat: 'hackathon', date: '长期有效', url: 'https://github.com/datawhalechina', benefit: '免费组队学习 + 实践项目 + 开源社区', org: 'Datawhale', tutorial: '' },
  { title: '智源 BAAI：黑客松 / 大模型开放日', cat: 'hackathon', date: '长期有效', url: 'https://hub.baai.ac.cn/', benefit: '大模型开放平台 + 社区赛事', org: '智源研究院', tutorial: '' },
  { title: 'Hugging Face 社区挑战赛', cat: 'hackathon', date: '长期有效', url: 'https://huggingface.co/challenges', benefit: '模型微调/应用挑战 + 社区声望 + 奖励', org: 'Hugging Face', tutorial: 'https://huggingface.co/learn' },
  { title: 'Cursor 无限续杯：认证学生额度到期自动续期', cat: 'student', date: '长期有效', url: 'https://cursor.com/account', benefit: '学生认证后免费额度持续循环续期（Pro 计划常用玩法），edu 邮箱可认证', org: 'Cursor', tutorial: 'https://cursor.com/education' },
  { title: '免费 API 中转站（One API / New API 公益聚合）', cat: 'tool', date: '长期有效', url: 'https://github.com/songquanpeng/one-api', benefit: '聚合 DeepSeek / GPT / Claude 等多家模型免费额度；请自行甄别站点安全性与合规性', org: '开源社区', tutorial: 'https://github.com/songquanpeng/one-api' },
  { title: '自备网络通道：Cloudflare WARP 官方免费版', cat: 'tool', date: '长期有效', url: 'https://one.one.one.one/', benefit: '官方免费加速/加密通道（国内可用性依网络而定），使用请遵守当地法律法规', org: 'Cloudflare', tutorial: 'https://developers.cloudflare.com/warp-client/' },
  { title: 'TRAE AI 创造力大赛（字节 AI 编程工具赛事）', cat: 'hackathon', date: '长期有效', url: 'https://www.trae.ai/', benefit: '用 TRAE AI 编程工具做应用参赛，奖金 + 官方曝光，大学生友好', org: '字节跳动', tutorial: 'https://www.trae.ai/' },
  { title: 'AI 先锋大赛：AI 应用创新赛事', cat: 'hackathon', date: '长期有效', url: 'https://www.baidu.com/s?wd=AI%E5%85%88%E9%94%8B%E5%A4%A7%E8%B5%9B', benefit: 'AI 应用 / 创意 / 算法赛道，报名参赛赢奖金与荣誉（赛事常新，可搜索最新报名）', org: '多方主办', tutorial: '' },
  { title: '人工智能创意赛（高校/行业 AI 创意竞赛）', cat: 'hackathon', date: '长期有效', url: 'https://www.baidu.com/s?wd=%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%E5%88%9B%E6%84%8F%E8%B5%9B', benefit: 'AI 创意项目征集 / 落地孵化，多数面向在校生，关注教务处通知报名', org: '多方主办', tutorial: '' },
  { title: '小米百亿 Token 补贴：开发者免费调用大模型', cat: 'token', date: '长期有效', url: 'https://dev.mi.com/', benefit: '小米向开发者发放百亿 Token 补贴，可免费调用大模型能力（关注小米开放平台公告）', org: '小米', tutorial: 'https://dev.mi.com/' },
  { title: '华为云开发者大赛（AI / 云原生赛道）', cat: 'hackathon', date: '长期有效', url: 'https://developer.huaweicloud.com/devevents.html', benefit: 'AI 应用/大模型/云原生赛道，奖金 + 华为生态资源，长期举办', org: '华为云', tutorial: '' },
  { title: '讯飞 AI 开发者大赛（iFLYTEK Challenge）', cat: 'hackathon', date: '长期有效', url: 'https://challenge.xfyun.cn/', benefit: '星火大模型 + 行业数据集赛道，奖金池 + 算力，学生可组队', org: '科大讯飞', tutorial: '' },
  { title: '腾讯云 AI 开发者大赛', cat: 'hackathon', date: '长期有效', url: 'https://cloud.tencent.com/act/event', benefit: 'AI 应用创新赛事，腾讯云资源 + 奖金', org: '腾讯云', tutorial: '' },
  { title: '智谱 AIIP 开发者大赛 / AI 应用赛', cat: 'hackathon', date: '长期有效', url: 'https://open.bigmodel.cn/', benefit: '用 GLM 模型做应用参赛，奖金 + 免费 Token 资源', org: '智谱AI', tutorial: '' },
  { title: '全国大学生 AI 创新应用大赛（计算机设计/AI 赛道）', cat: 'hackathon', date: '长期有效', url: 'https://www.baidu.com/s?wd=%E5%85%A8%E5%9B%BD%E5%A4%A7%E5%AD%A6%E7%94%9FAI%E5%88%9B%E6%96%B0%E5%BA%94%E7%94%A8%E5%A4%A7%E8%B5%9B', benefit: '面向在校生的 AI 应用创新赛事，获奖可保研/综测加分，关注教务处通知', org: '教育部/多方', tutorial: '' },
  { title: 'MLH (Major League Hacking) 全球黑客松', cat: 'hackathon', date: '长期有效', url: 'https://mlh.io/', benefit: '全球大学生黑客松组织，全年多场线上/线下赛事，获奖简历加分', org: 'MLH', tutorial: 'https://mlh.io/events' },
  { title: 'Devpost 黑客松平台（全球 AI 赛事聚合）', cat: 'hackathon', date: '长期有效', url: 'https://devpost.com/hackathons', benefit: '全球黑客松聚合平台，线上参赛 + 奖金 + 企业合作，实时更新', org: 'Devpost', tutorial: '' },
  { title: '开源中国 OSC 黑客松 / 码云 Gitee 大赛', cat: 'hackathon', date: '长期有效', url: 'https://gitee.com/', benefit: '国产开源社区黑客松与大赛，国内直连，学生友好', org: '开源中国', tutorial: '' },
  { title: 'CSDN 社区 AI 竞赛与创作大赛', cat: 'hackathon', date: '长期有效', url: 'https://www.csdn.net/', benefit: 'CSDN 常办 AI 创作/算法竞赛，写文章/做项目均可参与', org: 'CSDN', tutorial: '' },
  ];
  const getAIEvents = () => {
  const s = Store.get().skill;
  s.aiEvents = s.aiEvents || [];
  return AI_EVENTS_SEED.concat(s.aiEvents.map((x) => Object.assign({}, x, { _user: true })));
  };
  const aeExpired = (e) => {
  const d = String(e.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false; // 非日期（长期有效）不过期
  return d < D.todayStr();
  };
  const aeCatName = (k) => { const c = AI_EVENT_CATS.find((x) => x.key === k); return c ? c.name : (k || ''); };
  function renderAIEvents() {
  const all = getAIEvents();
  const list = all.filter((e) => (aeExpired(e) ? _aeShowExpired : true)).filter((e) => _aeCat === 'all' || e.cat === _aeCat);
  const expiredN = all.filter((e) => aeExpired(e)).length;
  const activeN = all.length - expiredN;
  const catTabs = ['all'].concat(AI_EVENT_CATS.map((c) => c.key)).map((k) => {
  const label = k === 'all' ? '全部' : (AI_EVENT_CATS.find((c) => c.key === k) || {}).label;
  return `<button class="ae-tab ${_aeCat === k ? 'on' : ''}" data-act="ae-cat" data-cat="${k}">${label}</button>`;
  }).join('');
  const rows = list.length ? list.map((e, i) => {
  const exp = aeExpired(e);
  return `<div class="ae-row ${exp ? 'ae-expired' : ''}">
  <div class="ae-main">
  <div class="ae-title">${UI.esc(e.title)}${e.org ? `<span class="ae-org"> · ${UI.esc(e.org)}</span>` : ''}</div>
  <div class="ae-meta">
  <span class="tag ae-cat-${e.cat}">${UI.esc(aeCatName(e.cat))}</span>
  <span class="ae-time">${exp ? '⛔ 已结束' : '🕐 ' + UI.esc(e.date || '')}</span>
  ${e.benefit ? `<span class="ae-benefit">🎁 ${UI.esc(e.benefit)}</span>` : ''}
  </div>
  </div>
  <div class="ae-ops">
  ${e.url ? `<a class="btn btn-sm btn-primary" href="${UI.esc(e.url)}" target="_blank" rel="noopener">报名</a>` : ''}
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
  <button class="btn btn-sm btn-refresh" data-act="ae-refresh">⟳ 实时刷新</button>
  <button class="btn btn-soft btn-sm" data-act="ae-add">＋ 添加活动</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">
  <div class="muted-text" style="font-size:12px;margin-bottom:10px">只收录真实可报名 / 可申领权益的 AI 活动（福利·学生·Token·内测·黑客松），过滤普通新闻资讯；已结束自动隐藏。</div>
  <div class="ae-tabs">${catTabs}</div>
  <div class="ae-list mt12">${rows}</div>
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
  if (act === 'ae-cat') { _aeCat = b.dataset.cat; Pages.skill(); return; }
  if (act === 'ae-toggle-expired') { _aeShowExpired = !_aeShowExpired; Pages.skill(); return; }
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
  st.skill.aiEvents = (st.skill.aiEvents || []).filter((e) => !aeExpired(e)); // 过期自建活动立即删除
  const cur = (st.skill.aiEvents || []).slice();
  const seen = new Set(cur.map((x) => x.title));
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
  <div class="field"><label>截止日期</label><input class="input" id="aeDate" placeholder="长期有效 或 2026-09-30"/></div>
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
  st.skill.aiEvents.push({ id: Store.uid(), title, cat: UI.val('#aeCat') || 'fan', date: UI.val('#aeDate').trim() || '长期有效', url: UI.val('#aeUrl').trim(), benefit: UI.val('#aeBenefit').trim(), tutorial: UI.val('#aeTutorial').trim(), org: UI.val('#aeOrg').trim() });
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
    } catch (e) { /* 后端失败则回退本地池/种子 */ }
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
