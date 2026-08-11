const fs = require('fs');

const filePath = 'D:\\buddycode\\college-workbench\\js\\pages\\english.js';
let content = fs.readFileSync(filePath, 'utf8');

// ========== 1. 添加听力阅读 tab ==========
content = content.replace(
  "const tabs = [['bank', '词库'], ['flash', '闪卡背诵'], ['quiz', '默写自测'], ['reader', '外刊阅读'], ['import', '导入']];",
  "const tabs = [['bank', '词库'], ['flash', '闪卡背诵'], ['quiz', '默写自测'], ['reader', '外刊阅读'], ['listening', '听力阅读'], ['import', '导入']];"
);

// ========== 2. 添加渲染分支 ==========
content = content.replace(
  "else if (curTab === 'import') renderImport(body);",
  "else if (curTab === 'listening') renderListening(body);\n  else if (curTab === 'import') renderImport(body);"
);

// ========== 3. 听力阅读核心代码 ==========
const listeningCode = `
  // ============================================================
  // 听力阅读（逐句精听 / 听写练习 / 单词本）
  // ============================================================

  // 内置听力词典（潜在陌生词中文释义）
  const LS_DICT = {
    ambitious: ['adj.', '有雄心的；野心勃勃的'], initiative: ['n.', '倡议；主动性'],
    transition: ['n.', '过渡；转变'], subsidy: ['n.', '补贴；津贴'],
    install: ['v.', '安装；设置'], panel: ['n.', '面板；太阳能板'],
    praise: ['v.', '赞扬；称赞'], critic: ['n.', '批评者；评论家'],
    upfront: ['adj.', '前期的；预付的'], investment: ['n.', '投资；投入'],
    household: ['n.', '家庭；一户'], literacy: ['n.', '读写能力；素养'],
    participant: ['n.', '参与者；参加者'], certificate: ['n.', '证书；证明'],
    registration: ['n.', '注册；登记'], counselor: ['n.', '顾问；咨询师'],
    anxiety: ['n.', '焦虑；忧虑'], depression: ['n.', '抑郁；沮丧'],
    academic: ['adj.', '学术的；学院的'], peer: ['n.', '同龄人；同伴'],
    awareness: ['n.', '意识；认识'], emphasize: ['v.', '强调；着重'],
    internship: ['n.', '实习；实习期'], interview: ['n.', '面试；采访'],
    nervous: ['adj.', '紧张的；焦虑的'], friendly: ['adj.', '友好的；亲切的'],
    project: ['n.', '项目；工程'], coding: ['n.', '编程；编码'],
    admire: ['v.', '钦佩；赞美'], approach: ['n.', '方法；途径'],
    specifically: ['adv.', '特别地；具体地'], user: ['n.', '用户；使用者'],
    experience: ['n.', '经验；经历'], design: ['n./v.', '设计；构思'],
    product: ['n.', '产品；产物'], answer: ['n./v.', '回答；答案'],
    hear: ['v.', '听到；听见'], support: ['v./n.', '支持；支撑'],
    vital: ['adj.', '至关重要的；生死攸关的'], resident: ['n.', '居民；住户'],
    plaza: ['n.', '广场；购物中心'], gather: ['v.', '聚集；收集'],
    relax: ['v.', '放松；休息'], reduce: ['v.', '减少；降低'],
    stress: ['n.', '压力；强调'], improve: ['v.', '改善；提高'],
    well: ['adv.', '很好地；充分地'], strengthen: ['v.', '加强；巩固'],
    social: ['adj.', '社会的；社交的'], connection: ['n.', '联系；连接'],
    neighbor: ['n.', '邻居；邻国'], comfortable: ['adj.', '舒适的；舒服的'],
    interact: ['v.', '互动；相互作用'], community: ['n.', '社区；群落'],
    sense: ['n.', '感觉；意识'], safer: ['adj.', '更安全的（safe的比较级）'],
    pleasant: ['adj.', '令人愉快的；舒适的'], environmental: ['adj.', '环境的；有关环境的'],
    benefit: ['n./v.', '益处；受益'], shade: ['n.', '阴凉处；树荫'],
    urban: ['adj.', '城市的；都市的'], unfortunately: ['adv.', '不幸地；遗憾地'],
    development: ['n.', '发展；开发'], parking: ['n.', '停车；停车场'],
    planner: ['n.', '规划者；计划者'], protect: ['v.', '保护；防护'],
    expand: ['v.', '扩大；扩展'], valuable: ['adj.', '有价值的；贵重的'],
    resource: ['n.', '资源；财力'], invest: ['v.', '投资；投入'],
    quality: ['n.', '质量；品质'], commercial: ['adj.', '商业的；商务的'],
    tourism: ['n.', '旅游业；观光'], successful: ['adj.', '成功的'],
    test: ['n./v.', '测试；试验'], flight: ['n.', '飞行；航班'],
    spacecraft: ['n.', '航天器；宇宙飞船'], altitude: ['n.', '海拔；高度'],
    kilometer: ['n.', '千米；公里'], return: ['v.', '返回；归还'],
    safely: ['adv.', '安全地'], mark: ['v.', '标志；标记'],
    crewed: ['adj.', '载人的（有船员的）'], mission: ['n.', '任务；使命'],
    passenger: ['n.', '乘客；旅客'], experience: ['n./v.', '经历；体验'],
    minute: ['n.', '分钟；片刻'], weightlessness: ['n.', '失重；无重力状态'],
    stunning: ['adj.', '令人惊叹的；极好的'], edge: ['n.', '边缘；刀刃'],
    regular: ['adj.', '定期的；有规律的'], ticket: ['n.', '票；入场券'],
    currently: ['adv.', '当前；现在'], price: ['n.', '价格；代价'],
    expensive: ['adj.', '昂贵的；花钱多的'], decrease: ['v.', '减少；降低'],
    technology: ['n.', '技术；科技'], hundred: ['num.', '百；一百'],
    reservation: ['n.', '预订；保留'], billion: ['num.', '十亿'],
    industry: ['n.', '工业；行业'], decade: ['n.', '十年；十年期'],
    farming: ['n.', '农业；耕作'], rapidly: ['adv.', '迅速地；快速地'],
    embrace: ['v.', '拥抱；欣然接受'], local: ['adj.', '当地的；本地的'],
    production: ['n.', '生产；产量'], empty: ['adj.', '空的；空闲的'],
    lot: ['n.', '一块地；许多'], rooftop: ['n.', '屋顶；楼顶'],
    transform: ['v.', '转变；改变'], productive: ['adj.', '多产的；富有成效的'],
    vegetable: ['n.', '蔬菜；植物'], garden: ['n.', '花园；菜园'],
    fresh: ['adj.', '新鲜的；清新的'], healthy: ['adj.', '健康的；健壮的'],
    produce: ['n.', '农产品；产品'], impact: ['n./v.', '影响；冲击'],
    transport: ['v.', '运输；运送'], distance: ['n.', '距离；远方'],
    run: ['v.', '运营；奔跑'], group: ['n.', '组；团体'],
    staff: ['v.', '配备人员；n. 员工'], volunteer: ['n.', '志愿者；v. 自愿'],
    educational: ['adj.', '教育的；有教育意义的'], program: ['n.', '项目；程序'],
    child: ['n.', '孩子；儿童'], adult: ['n.', '成年人；adj. 成年的'],
    tax: ['n.', '税；税款'], incentive: ['n.', '激励；奖励'],
    encourage: ['v.', '鼓励；激励'], agriculture: ['n.', '农业；农学'],
    relax: ['v.', '放松；放宽'], zoning: ['n.', '分区；分区制'],
    law: ['n.', '法律；法规'], restrict: ['v.', '限制；约束'],
    area: ['n.', '地区；区域'], expert: ['n.', '专家；能手'],
    supply: ['v.', '供应；供给'], percent: ['n.', '百分比；百分数'],
    population: ['n.', '人口；种群'], continue: ['v.', '继续；持续'],
    grow: ['v.', '增长；生长'], important: ['adj.', '重要的；重大的'],
    dilemma: ['n.', '困境；进退两难'], research: ['n./v.', '研究；调查'],
    method: ['n.', '方法；办法'], exactly: ['adv.', '确切地；精确地'],
    study: ['v./n.', '学习；研究'], affect: ['v.', '影响；感动'],
    body: ['n.', '身体；主体'], image: ['n.', '形象；图像'],
    prevalence: ['n.', '流行；普遍'], underlying: ['adj.', '潜在的；根本的'],
    mechanism: ['n.', '机制；机理'], consider: ['v.', '考虑；认为'],
    mixed: ['adj.', '混合的；混杂的'], quantitative: ['adj.', '定量的；数量的'],
    qualitative: ['adj.', '定性的；性质的'], survey: ['n.', '调查；测量'],
    data: ['n.', '数据；资料'], interview: ['n./v.', '访谈；面试'],
    insight: ['n.', '洞察力；深刻见解'], thesis: ['n.', '论文；论点'],
    seem: ['v.', '似乎；好像'], produce: ['v.', '产生；生产'],
    stronger: ['adj.', '更强的（strong的比较级）'], finding: ['n.', '发现；调查结果'],
    complement: ['v.', '补充；补足'], validate: ['v.', '验证；证实'],
    true: ['adj.', '真的；真实的'], worry: ['v.', '担心；担忧'],
    ability: ['n.', '能力；才能'], analyze: ['v.', '分析；解析'],
    both: ['adj./pron.', '两者都'], type: ['n.', '类型；种类'],
    start: ['v.', '开始；启动'], result: ['n.', '结果；成果'],
    guide: ['v.', '指导；引导'], question: ['n.', '问题；疑问'],
    build: ['v.', '建立；建造'], learn: ['v.', '学习；得知'],
    create: ['v.', '创造；创建'], coherent: ['adj.', '连贯的；一致的'],
    economist: ['n.', '经济学家；经济学者'], attention: ['n.', '注意力；关心'],
    economy: ['n.', '经济；节约'], valuable: ['adj.', '有价值的；贵重的'],
    resource: ['n.', '资源；财力'], information: ['n.', '信息；资料'],
    app: ['n.', '应用程序（application的缩写）'], website: ['n.', '网站'],
    media: ['n.', '媒体；媒介'], company: ['n.', '公司；陪伴'],
    compete: ['v.', '竞争；比赛'], limited: ['adj.', '有限的；受限的'],
    span: ['n.', '跨度；范围'], sophisticated: ['adj.', '复杂的；精密的'],
    algorithm: ['n.', '算法；计算程序'], design: ['v.', '设计；构思'],
    engage: ['v.', '参与；吸引'], notification: ['n.', '通知；通告'],
    infinite: ['adj.', '无限的；无穷的'], scroll: ['n.', '滚动；卷轴'],
    personalized: ['adj.', '个性化的；个人化的'], content: ['n.', '内容；目录'],
    serve: ['v.', '服务；供应'], purpose: ['n.', '目的；用途'],
    problem: ['n.', '问题；难题'], finite: ['adj.', '有限的；限定的'],
    give: ['v.', '给；给予'], take: ['v.', '拿；取'],
    away: ['adv.', '离开；远离'], spend: ['v.', '花费；度过'],
    hour: ['n.', '小时；钟头'], scroll: ['v.', '滚动；卷动'],
    social: ['adj.', '社会的；社交的'], mean: ['v.', '意味着；意思是'],
    less: ['adj.', '更少的（little的比较级）'], work: ['n./v.', '工作；劳动'],
    relationship: ['n.', '关系；联系'], self: ['n.', '自己；自我'],
    reflection: ['n.', '反思；反射'], critic: ['n.', '批评者；评论家'],
    argue: ['v.', '争论；认为'], distracted: ['adj.', '分心的；注意力分散的'],
    focused: ['adj.', '专注的；聚焦的'], contribute: ['v.', '贡献；促成'],
    rate: ['n.', '比率；速度'], mental: ['adj.', '精神的；心理的'],
    health: ['n.', '健康；卫生'], awareness: ['n.', '意识；认识'],
    grow: ['v.', '增长；生长'], practice: ['v./n.', '实践；练习'],
    digital: ['adj.', '数字的；数码的'], minimalism: ['n.', '极简主义'],
    set: ['v.', '设置；放置'], boundary: ['n.', '边界；界限'],
    reclaim: ['v.', '收回；回收'], direct: ['adj.', '直接的；直系的'],
    traditional: ['adj.', '传统的；惯例的'], assume: ['v.', '假设；承担'],
    always: ['adv.', '总是；一直'], rational: ['adj.', '理性的；合理的'],
    decision: ['n.', '决定；决心'], maximize: ['v.', '最大化；最大化'],
    benefit: ['n./v.', '利益；有益于'], behavioral: ['adj.', '行为的；行为学的'],
    relatively: ['adv.', '相对地；比较地'], field: ['n.', '领域；场地'],
    challenge: ['v./n.', '挑战；质疑'], assumption: ['n.', '假设；假定'],
    combine: ['v.', '结合；联合'], psychology: ['n.', '心理学；心理'],
    understand: ['v.', '理解；明白'], actually: ['adv.', '实际上；事实上'],
    identify: ['v.', '识别；确认'], numerous: ['adj.', '许多的；众多的'],
    cognitive: ['adj.', '认知的；认识的'], bias: ['n.', '偏见；偏差'],
    affect: ['v.', '影响；感染'], choice: ['n.', '选择；抉择'],
    well: ['adv.', '很好地；充分地'], known: ['adj.', '已知的；著名的'],
    example: ['n.', '例子；榜样'], loss: ['n.', '损失；丢失'],
    aversion: ['n.', '厌恶；反感'], tendency: ['n.', '趋势；倾向'],
    fear: ['n./v.', '害怕；恐惧'], value: ['v.', '重视；评价'],
    equivalent: ['adj.', '等价的；相等的'], gain: ['n.', '收益；获得'],
    explain: ['v.', '解释；说明'], risk: ['n./v.', '风险；冒险'],
    avoid: ['v.', '避免；躲避'], achieve: ['v.', '实现；达到'],
    size: ['n.', '大小；尺寸'], another: ['adj./pron.', '另一个；再一个'],
    important: ['adj.', '重要的；重大的'], concept: ['n.', '概念；观念'],
    status: ['n.', '地位；状态'], quo: ['n.', '现状（拉丁语）'],
    preference: ['n.', '偏好；偏爱'], stay: ['v.', '停留；保持'],
    same: ['adj.', '相同的；同一的'], default: ['n.', '默认；缺省'],
    option: ['n.', '选项；选择权'], form: ['n.', '形式；表格'],
    contract: ['n.', '合同；契约'], powerful: ['adj.', '强大的；有力的'],
    practical: ['adj.', '实际的；实用的'], application: ['n.', '应用；申请'],
    many: ['adj.', '许多的；多的'], public: ['adj.', '公共的；公众的'],
    policy: ['n.', '政策；方针'], government: ['n.', '政府；政体'],
    nudge: ['n.', '助推；轻推'], encourage: ['v.', '鼓励；激励'],
    better: ['adj.', '更好的（good的比较级）'], restrict: ['v.', '限制；约束'],
    business: ['n.', '商业；生意'], insight: ['n.', '洞察力；深刻见解'],
    product: ['n.', '产品；产物'], marketing: ['n.', '营销；销售'],
    strategy: ['n.', '战略；策略'], deepen: ['v.', '加深；深化'],
    human: ['adj.', '人的；人类的'], decision-making: ['n.', '决策；做决定'],
    continue: ['v.', '继续；持续'], importance: ['n.', '重要性；重要'],
    slow: ['adj.', '慢的；缓慢的'], living: ['n.', '生活；生计'],
    movement: ['n.', '运动；移动'], encourage: ['v.', '鼓励；激励'],
    intentionally: ['adv.', '有意地；故意地'], pace: ['n.', '步伐；速度'],
    began: ['v.', '开始（begin的过去式）'], reaction: ['n.', '反应；回应'],
    fast-paced: ['adj.', '快节奏的'], always: ['adv.', '总是；一直'],
    connected: ['adj.', '连接的；有联系的'], nature: ['n.', '本质；自然'],
    modern: ['adj.', '现代的；近代的'], society: ['n.', '社会；社团'],
    proponent: ['n.', '支持者；倡导者'], constant: ['adj.', '持续的；不断的'],
    busyness: ['n.', '忙碌；繁忙'], prevent: ['v.', '阻止；防止'],
    truly: ['adv.', '真正地；真实地'], experiencing: ['v.', '体验；经历（现在分词）'],
    enjoying: ['v.', '享受；欣赏（现在分词）'], rush: ['v.', '匆忙；赶'],
    task: ['n.', '任务；工作'], miss: ['v.', '错过；想念'],
    small: ['adj.', '小的；少的'], moment: ['n.', '时刻；瞬间'],
    meaningful: ['adj.', '有意义的；意味深长的'], involve: ['v.', '涉及；包含'],
    simplifying: ['v.', '简化（现在分词）'], prioritizing: ['v.', '优先处理（现在分词）'],
    matter: ['v.', '要紧；有关系'], rest: ['n.', '其余的；休息'],
    everything: ['pron.', '每件事；一切'], right: ['adj.', '正确的；合适的'],
    mean: ['v.', '意思是；意味着'], cooking: ['n.', '烹饪；做饭'],
    scratch: ['n.', '从零开始；抓痕'], instead: ['adv.', '代替；反而'],
    fast: ['adj.', '快的；迅速的'], food: ['n.', '食物；食品'],
    savor: ['v.', '品尝；享受'], coffee: ['n.', '咖啡；咖啡豆'],
    check: ['v.', '检查；核对'], email: ['n.', '电子邮件'],
    research: ['n.', '研究；调查'], suggest: ['v.', '建议；表明'],
    intentional: ['adj.', '故意的；有意的'], reduces: ['v.', '减少（第三人称单数）'],
    improves: ['v.', '改善（第三人称单数）'], well-being: ['n.', '幸福；福祉'],
    also: ['adv.', '也；而且'], relationships: ['n.', '关系（复数）'],
    allowing: ['v.', '允许（现在分词）'], fully: ['adv.', '完全地；充分地'],
    present: ['adj.', '现在的；出席的'], others: ['pron.', '其他人；其他的'],
    while: ['conj.', '当...的时候；虽然'], everyone: ['pron.', '每个人；人人'],
    find: ['v.', '找到；发现'], antidote: ['n.', '解药；解毒剂'],
    career: ['n.', '职业；事业'], change: ['v./n.', '改变；变化'],
    sure: ['adj.', '确信的；肯定的'], start: ['v.', '开始；启动'],
    finance: ['n.', '金融；财政'], eight: ['num.', '八；八个'],
    years: ['n.', '年（复数）'], feeling: ['n.', '感觉；感受'],
    burnt: ['adj.', '烧焦的；耗尽的'], out: ['adv.', '在外；出去'],
    step: ['n.', '步；步骤'], big: ['adj.', '大的；重要的'],
    look: ['v.', '看；寻找'], new: ['adj.', '新的；新鲜的'],
    meaningful: ['adj.', '有意义的；意味深长的'], feel: ['v.', '感觉；觉得'],
    positive: ['adj.', '积极的；正面的'], difference: ['n.', '差异；不同'],
    always: ['adv.', '总是；一直'], interested: ['adj.', '感兴趣的'],
    environmental: ['adj.', '环境的；有关环境的'], issues: ['n.', '问题（复数）'],
    considered: ['adj.', '经过考虑的；被认为的'], sustainable: ['adj.', '可持续的；能承受的'],
    investing: ['v.', '投资（现在分词）'], way: ['n.', '方式；方法'],
    existing: ['adj.', '现有的；存在的'], skills: ['n.', '技能（复数）'],
    working: ['v.', '工作（现在分词）'], field: ['n.', '领域；场地'],
    care: ['v./n.', '关心；照顾'], haven: ['n.', '避难所；港口'],
    thought: ['v.', '想（think的过去式）'], good: ['adj.', '好的；优良的'],
    middle: ['n.', '中间；中央'], ground: ['n.', '地面；土地'],
    transition: ['n.', '过渡；转变'], courses: ['n.', '课程（复数）'],
    sustainable: ['adj.', '可持续的；能承受的'], business: ['n.', '商业；生意'],
    networking: ['n.', '社交网络；建立人脉'], people: ['n.', '人们；人'],
    help: ['v./n.', '帮助；帮忙'], maybe: ['adv.', '也许；可能'],
    try: ['v.', '尝试；试图'], volunteering: ['n.', '志愿服务；自愿做'],
    freelance: ['adj.', '自由职业的；自由撰稿的'], projects: ['n.', '项目（复数）'],
    gain: ['v.', '获得；增加'], relevant: ['adj.', '相关的；切题的'],
    experience: ['n.', '经验；经历'], solid: ['adj.', '可靠的；固体的'],
    advice: ['n.', '建议；忠告'], optimistic: ['adj.', '乐观的；乐观主义的'],
    already: ['adv.', '已经；早已'], creativity: ['n.', '创造力；创造性'],
    often: ['adv.', '经常；常常'], misunderstood: ['adj.', '被误解的'],
    rare: ['adj.', '稀有的；罕见的'], gift: ['n.', '天赋；礼物'],
    possessed: ['v.', '拥有（过去分词）'], artist: ['n.', '艺术家；画家'],
    genius: ['n.', '天才；天赋'], modern: ['adj.', '现代的；近代的'],
    research: ['n.', '研究；调查'], suggests: ['v.', '建议（第三人称单数）'],
    skill: ['n.', '技能；技巧'], anyone: ['pron.', '任何人；无论谁'],
    develop: ['v.', '发展；开发'], being: ['n.', '存在；生命'],
    born: ['v.', '出生（bear的过去分词）'], special: ['adj.', '特殊的；专门的'],
    abilities: ['n.', '能力（复数）'], learning: ['v.', '学习（现在分词）'],
    differently: ['adv.', '不同地；有差异地'], key: ['n.', '关键；钥匙'],
    insight: ['n.', '洞察力；深刻见解'], creative: ['adj.', '创造性的；有创造力的'],
    ideas: ['n.', '想法（复数）'], rarely: ['adv.', '很少地；罕有地'],
    completely: ['adv.', '完全地；彻底地'], new: ['adj.', '新的；新鲜的'],
    more: ['adj.', '更多的（much/many的比较级）'], often: ['adv.', '经常；常常'],
    novel: ['adj.', '新颖的；新奇的'], combinations: ['n.', '组合（复数）'],
    existing: ['adj.', '现有的；存在的'], concepts: ['n.', '概念（复数）'],
    printing: ['n.', '印刷；打印'], press: ['n.', '印刷机；新闻界'],
    example: ['n.', '例子；榜样'], combined: ['v.', '结合（过去式）'],
    technologies: ['n.', '技术（复数）'], screw: ['n.', '螺丝；螺旋'],
    movable: ['adj.', '可移动的；活动的'], type: ['n.', '类型；种类'],
    means: ['v.', '意味着（第三人称单数）'], exposing: ['v.', '暴露（现在分词）'],
    yourself: ['pron.', '你自己；你亲自'], diverse: ['adj.', '多种多样的；不同的'],
    experiences: ['n.', '经历（复数）'], boost: ['v.', '促进；增加'],
    factor: ['n.', '因素；要素'], giving: ['v.', '给（现在分词）'],
    yourself: ['pron.', '你自己；你亲自'], time: ['n.', '时间；次'],
    unfocused: ['adj.', '不专注的；未聚焦的'], thinking: ['n.', '思考；想法'],
    best: ['adj.', '最好的（good的最高级）'], come: ['v.', '来；来到'],
    actively: ['adv.', '积极地；活跃地'], trying: ['v.', '尝试（现在分词）'],
    solve: ['v.', '解决；解答'], problem: ['n.', '问题；难题'],
    walking: ['n.', '步行；散步'], showering: ['n.', '淋浴；阵雨'],
    routine: ['adj.', '日常的；常规的'], activities: ['n.', '活动（复数）'],
    allows: ['v.', '允许（第三人称单数）'], minds: ['n.', '头脑（复数）'],
    wander: ['v.', '漫游；徘徊'], connections: ['n.', '联系（复数）'],
    contrary: ['adj.', '相反的；对立的'], popular: ['adj.', '流行的；受欢迎的'],
    belief: ['n.', '相信；信仰'], requires: ['v.', '需要（第三人称单数）'],
    hard: ['adj.', '努力的；硬的'], work: ['n.', '工作；劳动'],
    persistence: ['n.', '坚持；毅力'], genius: ['n.', '天才；天赋'],
    percent: ['n.', '百分比；百分数'], inspiration: ['n.', '灵感；鼓舞'],
    ninety-nine: ['num.', '九十九'], perspiration: ['n.', '汗水；流汗'],
    saying: ['n.', '谚语；话'], goes: ['v.', '去（第三人称单数）'],
    reducing: ['v.', '减少（现在分词）'], greenhouse: ['n.', '温室'],
    gas: ['n.', '气体；汽油'], emissions: ['n.', '排放（复数）'],
    remains: ['v.', '保持（第三人称单数）'], essential: ['adj.', '必要的；本质的'],
    must: ['v.', '必须；一定'], adapt: ['v.', '适应；改编'],
    changes: ['n.', '变化（复数）'], already: ['adv.', '已经；早已'],
    underway: ['adj.', '进行中的；在航行中的'], field: ['n.', '领域；场地'],
    known: ['adj.', '已知的；著名的'], climate: ['n.', '气候；风气'],
    adaptation: ['n.', '适应；改编'], growing: ['adj.', '增长的；成长中的'],
    importance: ['n.', '重要性；重要'], every: ['adj.', '每一；每个'],
    year: ['n.', '年；年度'], involves: ['v.', '涉及（第三人称单数）'],
    adjusting: ['v.', '调整（现在分词）'], societies: ['n.', '社会（复数）'],
    infrastructure: ['n.', '基础设施；基础建设'], handle: ['v.', '处理；操作'],
    new: ['adj.', '新的；新鲜的'], realities: ['n.', '现实（复数）'],
    building: ['n.', '建筑；建筑物'], flood: ['n.', '洪水；水灾'],
    defenses: ['n.', '防御（复数）'], areas: ['n.', '地区（复数）'],
    facing: ['v.', '面对（现在分词）'], rising: ['adj.', '上升的；上涨的'],
    sea: ['n.', '海；海洋'], levels: ['n.', '水平（复数）'],
    intense: ['adj.', '强烈的；紧张的'], storms: ['n.', '暴风雨（复数）'],
    developing: ['v.', '发展（现在分词）'], drought-resistant: ['adj.', '抗旱的'],
    crops: ['n.', '庄稼（复数）'], regions: ['n.', '地区（复数）'],
    getting: ['v.', '得到（现在分词）'], hotter: ['adj.', '更热的（hot的比较级）'],
    drier: ['adj.', '更干燥的（dry的比较级）'], designing: ['v.', '设计（现在分词）'],
    buildings: ['n.', '建筑（复数）'], cities: ['n.', '城市（复数）'],
    withstand: ['v.', '经受；承受'], extreme: ['adj.', '极端的；极度的'],
    heat: ['n.', '热；高温'], events: ['n.', '事件（复数）'],
    requires: ['v.', '需要（第三人称单数）'], planning: ['n.', '规划；计划'],
    ahead: ['adv.', '向前；在前'], investing: ['v.', '投资（现在分词）'],
    resilience: ['n.', '韧性；恢复力'], before: ['prep.', '在...之前'],
    disasters: ['n.', '灾难（复数）'], strike: ['v.', '打击；罢工'],
    often: ['adv.', '经常；常常'], cost-effective: ['adj.', '划算的；成本效益好的'],
    trying: ['v.', '尝试（现在分词）'], recover: ['v.', '恢复；痊愈'],
    after: ['prep.', '在...之后'], occurred: ['v.', '发生（过去式）'],
    however: ['adv.', '然而；可是'], raises: ['v.', '提出（第三人称单数）'],
    questions: ['n.', '问题（复数）'], justice: ['n.', '正义；公正'],
    equity: ['n.', '公平；公正'], countries: ['n.', '国家（复数）'],
    most: ['adv.', '最；非常'], vulnerable: ['adj.', '脆弱的；易受伤害的'],
    climate: ['n.', '气候；风气'], change: ['n.', '变化；改变'],
    often: ['adv.', '经常；常常'], those: ['pron.', '那些'],
    contributed: ['v.', '贡献（过去式）'], least: ['adv.', '最少（little的最高级）'],
    causing: ['v.', '导致（现在分词）'], wealthier: ['adj.', '更富有的（wealthy的比较级）'],
    nations: ['n.', '国家（复数）'], responsibility: ['n.', '责任；职责'],
    help: ['v.', '帮助；帮忙'], poorer: ['adj.', '更穷的（poor的比较级）'],
    countries: ['n.', '国家（复数）'], adapt: ['v.', '适应；改编'],
    impacts: ['n.', '影响（复数）'], worsen: ['v.', '恶化；变得更坏'],
    finding: ['n.', '发现；找到'], fair: ['adj.', '公平的；公正的'],
    effective: ['adj.', '有效的；有作用的'], strategies: ['n.', '战略（复数）'],
    become: ['v.', '成为；变成'], increasingly: ['adv.', '越来越多地；日益增加地'],
    urgent: ['adj.', '紧急的；急迫的'], professor: ['n.', '教授；老师'],
    drowning: ['v.', '淹没（现在分词）'], papers: ['n.', '论文（复数）'],
    literature: ['n.', '文学；文献'], review: ['n.', '回顾；评论'],
    hundreds: ['n.', '数百（复数）'], articles: ['n.', '文章（复数）'],
    topic: ['n.', '主题；话题'], possibly: ['adv.', '可能地；也许'],
    read: ['v.', '阅读；读'], all: ['adj.', '全部的；所有的'],
    common: ['adj.', '常见的；共同的'], challenge: ['n.', '挑战；质疑'],
    strategically: ['adv.', '战略性地；策略上'], comprehensively: ['adv.', '全面地；综合地'],
    start: ['v.', '开始；启动'], identifying: ['v.', '识别（现在分词）'],
    most: ['adv.', '最；非常'], important: ['adj.', '重要的；重大的'],
    highly: ['adv.', '高度地；非常'], cited: ['v.', '引用（过去分词）'],
    works: ['n.', '作品（复数）'], recent: ['adj.', '最近的；近来的'],
    review: ['n.', '回顾；评论'], articles: ['n.', '文章（复数）'],
    summarize: ['v.', '总结；概括'], field: ['n.', '领域；场地'],
    those: ['pron.', '那些'], give: ['v.', '给；给予'],
    good: ['adj.', '好的；优良的'], overview: ['n.', '概览；综述'],
    without: ['prep.', '没有；无'], having: ['v.', '有（现在分词）'],
    everything: ['pron.', '每件事；一切'], once: ['adv.', '一次；曾经'],
    overview: ['n.', '概览；综述'], dive: ['v.', '潜水；深入'],
    deeper: ['adj.', '更深的（deep的比较级）'], specific: ['adj.', '具体的；特定的'],
    papers: ['n.', '论文（复数）'], relevant: ['adj.', '相关的；切题的'],
    research: ['n.', '研究；调查'], question: ['n.', '问题；疑问'],
    each: ['adj.', '每；各自的'], paper: ['n.', '论文；纸'],
    abstract: ['n.', '摘要；抽象'], conclusion: ['n.', '结论；结尾'],
    first: ['adv.', '第一；首先'], still: ['adv.', '仍然；还'],
    seems: ['v.', '似乎（第三人称单数）'], introduction: ['n.', '引言；介绍'],
    skim: ['v.', '浏览；略读'], methodology: ['n.', '方法论；方法学'],
    results: ['n.', '结果（复数）'], only: ['adv.', '只；仅仅'],
    whole: ['adj.', '整个的；全部的'], carefully: ['adv.', '仔细地；小心地'],
    truly: ['adv.', '真正地；真实地'], central: ['adj.', '中心的；主要的'],
    work: ['n.', '工作；劳动'], makes: ['v.', '使（第三人称单数）'],
    sense: ['n.', '感觉；道理'], been: ['v.', '是（be的过去分词）'],
    trying: ['v.', '尝试（现在分词）'], every: ['adj.', '每一；每个'],
    from: ['prep.', '从；来自'], start: ['n.', '开始；起点'],
    finish: ['v.', '完成；结束'], forever: ['adv.', '永远；永久'],
    smart: ['adj.', '聪明的；巧妙的'], reading: ['n.', '阅读；读书'],
    knowing: ['v.', '知道（现在分词）'], what: ['pron.', '什么'],
    skip: ['v.', '跳过；略过'], question: ['n.', '问题；疑问'],
    free: ['adj.', '自由的；免费的'], will: ['v.', '将；愿意'],
    puzzled: ['adj.', '困惑的；茫然的'], philosophers: ['n.', '哲学家（复数）'],
    scientists: ['n.', '科学家（复数）'], millennia: ['n.', '千年（复数）'],
    truly: ['adv.', '真正地；真实地'], make: ['v.', '做；制造'],
    choices: ['n.', '选择（复数）'], freely: ['adv.', '自由地；免费地'],
    decisions: ['n.', '决定（复数）'], determined: ['adj.', '决定了的；坚决的'],
    prior: ['adj.', '先前的；在前的'], causes: ['n.', '原因（复数）'],
    traditional: ['adj.', '传统的；惯例的'], philosophical: ['adj.', '哲学的；哲理的'],
    debate: ['n.', '辩论；争论'], pits: ['v.', '使对立；使竞争'],
    determinism: ['n.', '决定论；宿命论'], against: ['prep.', '反对；针对'],
    libertarian: ['adj.', '自由意志论的；自由主义的'], determinists: ['n.', '决定论者（复数）'],
    argue: ['v.', '争论；认为'], every: ['adj.', '每一；每个'],
    event: ['n.', '事件；大事'], including: ['prep.', '包括；包含'],
    human: ['adj.', '人的；人类的'], sufficient: ['adj.', '足够的；充分的'],
    cause: ['n.', '原因；事业'], given: ['prep.', '考虑到；鉴于'],
    state: ['n.', '状态；州'], universe: ['n.', '宇宙；世界'],
    laws: ['n.', '法律（复数）'], nature: ['n.', '自然；本质'],
    future: ['n.', '未来；将来'], possible: ['adj.', '可能的；合理的'],
    libertarians: ['n.', '自由意志论者（复数）'], counter: ['v.', '反驳；反击'],
    special: ['adj.', '特殊的；专门的'], capacity: ['n.', '能力；容量'],
    free: ['adj.', '自由的；免费的'], choice: ['n.', '选择；抉择'],
    transcends: ['v.', '超越（第三人称单数）'], physical: ['adj.', '物理的；身体的'],
    causation: ['n.', '因果关系；原因'], compatibilists: ['n.', '兼容论者（复数）'],
    take: ['v.', '拿；取'], middle: ['n.', '中间；中央'],
    position: ['n.', '位置；立场'], arguing: ['v.', '争论（现在分词）'],
    coexist: ['v.', '共存；和平共处'], redefine: ['v.', '重新定义；再定义'],
    acting: ['n.', '表演；行动'], accordance: ['n.', '一致；和谐'],
    own: ['adj.', '自己的；拥有的'], desires: ['n.', '欲望（复数）'],
    reasons: ['n.', '原因（复数）'], even: ['adv.', '甚至；即使'],
    those: ['pron.', '那些'], still: ['adv.', '仍然；还'],
    sense: ['n.', '感觉；意义'], matters: ['n.', '事情（复数）'],
    neuroscience: ['n.', '神经科学'], added: ['v.', '添加（过去式）'],
    dimension: ['n.', '维度；尺寸'], experiments: ['n.', '实验（复数）'],
    suggesting: ['v.', '表明（现在分词）'], made: ['v.', '做（make的过去式）'],
    unconsciously: ['adv.', '无意识地；不知不觉地'], before: ['prep.', '在...之前'],
    become: ['v.', '成为；变成'], aware: ['adj.', '意识到的；知道的'],
    them: ['pron.', '他们；她们；它们'], while: ['conj.', '当...的时候；虽然'],
    findings: ['n.', '发现（复数）'], provocative: ['adj.', '煽动性的；挑衅的'],
    their: ['adj.', '他们的；她们的'], interpretation: ['n.', '解释；翻译'],
    remains: ['v.', '保持（第三人称单数）'], controversial: ['adj.', '有争议的；有争论的'],
    shows: ['v.', '显示（第三人称单数）'], signs: ['n.', '迹象（复数）'],
    being: ['n.', '存在；生命'], resolved: ['v.', '解决（过去分词）'],
    anytime: ['adv.', '任何时候；无论何时'], soon: ['adv.', '不久；很快'],
    term: ['n.', '术语；学期'], post-truth: ['n.', '后真相'],
    named: ['v.', '命名（过去式）'], word: ['n.', '单词；字'],
    year: ['n.', '年；年度'], reflecting: ['v.', '反映（现在分词）'],
    growing: ['adj.', '增长的；成长中的'], concern: ['n.', '关心；担忧'],
    state: ['n.', '状态；州'], public: ['adj.', '公共的；公众的'],
    discourse: ['n.', '论述；演讲'], world: ['n.', '世界；领域'],
    objective: ['adj.', '客观的；目标的'], facts: ['n.', '事实（复数）'],
    less: ['adj.', '更少的（little的比较级）'], influential: ['adj.', '有影响的；有势力的'],
    appeals: ['n.', '呼吁；吸引力'], emotion: ['n.', '情感；情绪'],
    personal: ['adj.', '个人的；私人的'], belief: ['n.', '相信；信仰'],
    people: ['n.', '人们；人'], increasingly: ['adv.', '越来越多地；日益增加地'],
    live: ['v.', '生活；居住'], information: ['n.', '信息；资料'],
    bubbles: ['n.', '泡沫（复数）'], where: ['adv.', '在哪里；在那里'],
    encounter: ['v.', '遇到；遭遇'], only: ['adv.', '只；仅仅'],
    views: ['n.', '观点（复数）'], confirm: ['v.', '确认；证实'],
    existing: ['adj.', '现有的；存在的'], beliefs: ['n.', '信仰（复数）'],
    social: ['adj.', '社会的；社交的'], media: ['n.', '媒体；媒介'],
    algorithms: ['n.', '算法（复数）'], reinforce: ['v.', '加强；强化'],
    showing: ['v.', '展示（现在分词）'], content: ['n.', '内容；目录'],
    likely: ['adv.', '可能地；或许'], agree: ['v.', '同意；赞成'],
    creates: ['v.', '创造（第三人称单数）'], echo: ['n.', '回声；回音'],
    chambers: ['n.', '房间（复数）'], misinformation: ['n.', '错误信息；虚假信息'],
    spread: ['v.', '传播；展开'], unchallenged: ['adj.', '未受挑战的；无异议的'],
    consequences: ['n.', '后果（复数）'], profound: ['adj.', '深远的；深刻的'],
    declining: ['adj.', '下降的；倾斜的'], trust: ['n./v.', '信任；相信'],
    institutions: ['n.', '机构（复数）'], polarization: ['n.', '两极分化；极化'],
    inability: ['n.', '无能；无力'], agree: ['v.', '同意；赞成'],
    basic: ['adj.', '基本的；基础的'], facts: ['n.', '事实（复数）'],
    when: ['conj.', '当...的时候'], can: ['v.', '能；可以'],
    agree: ['v.', '同意；赞成'], what: ['pron.', '什么'],
    true: ['adj.', '真的；真实的'], democratic: ['adj.', '民主的；民主政治的'],
    deliberation: ['n.', '审议；考虑'], becomes: ['v.', '变成（第三人称单数）'],
    nearly: ['adv.', '几乎；差不多'], impossible: ['adj.', '不可能的；做不到的'],
    addressing: ['v.', '处理（现在分词）'], challenge: ['n.', '挑战；质疑'],
    requires: ['v.', '需要（第三人称单数）'], action: ['n.', '行动；动作'],
    multiple: ['adj.', '多重的；多样的'], fronts: ['n.', '前线（复数）'],
    literacy: ['n.', '读写能力；素养'], education: ['n.', '教育；培养'],
    help: ['v.', '帮助；帮忙'], evaluate: ['v.', '评价；评估'],
    sources: ['n.', '来源（复数）'], identify: ['v.', '识别；确认'],
    misinformation: ['n.', '错误信息；虚假信息'], platform: ['n.', '平台；站台'],
    companies: ['n.', '公司（复数）'], need: ['v.', '需要；必须'],
    more: ['adj.', '更多的（much/many的比较级）'], responsibility: ['n.', '责任；职责'],
    amplify: ['v.', '放大；扩大'], all: ['adj.', '全部的；所有的'],
    need: ['v.', '需要；必须'], cultivate: ['v.', '培养；耕作'],
    intellectual: ['adj.', '智力的；理智的'], humility: ['n.', '谦逊；谦卑'],
    willingness: ['n.', '意愿；乐意'], engage: ['v.', '参与；从事'],
    opposing: ['adj.', '反对的；对立的'], views: ['n.', '观点（复数）'],
    health: ['n.', '健康；卫生'], democracies: ['n.', '民主国家（复数）'],
    may: ['v.', '可能；可以'], depend: ['v.', '取决于；依靠'],
    whether: ['conj.', '是否；不论'], rebuild: ['v.', '重建；改造'],
    shared: ['adj.', '共享的；分享的'], reality: ['n.', '现实；真实'],
    perhaps: ['adv.', '也许；可能'], defining: ['adj.', '决定性的；定义的'],
    challenge: ['n.', '挑战；质疑'], information: ['n.', '信息；资料'],
    age: ['n.', '年龄；时代'], paper: ['n.', '论文；纸'],
    journal: ['n.', '期刊；杂志'], reviewers: ['n.', '审稿人（复数）'],
    said: ['v.', '说（say的过去式）'], writing: ['n.', '写作；作品'],
    unclear: ['adj.', '不清楚的；不明确的'], want: ['v.', '想要；需要'],
    major: ['adj.', '主要的；重要的'], revisions: ['n.', '修改（复数）'],
    sure: ['adj.', '确信的；肯定的'], improve: ['v.', '改善；提高'],
    clarity: ['n.', '清晰；清楚'], common: ['adj.', '常见的；共同的'],
    issue: ['n.', '问题；议题'], especially: ['adv.', '特别；尤其'],
    early-career: ['adj.', '早期职业的'], researchers: ['n.', '研究者（复数）'],
    academic: ['adj.', '学术的；学院的'], writing: ['n.', '写作；作品'],
    skill: ['n.', '技能；技巧'], takes: ['v.', '花费（第三人称单数）'],
    practice: ['n.', '练习；实践'], develop: ['v.', '发展；开发'],
    specific: ['adj.', '具体的；特定的'], suggestions: ['n.', '建议（复数）'],
    structure: ['n.', '结构；构造'], paragraph: ['n.', '段落；短评'],
    should: ['v.', '应该；应当'], clear: ['adj.', '清楚的；清澈的'],
    main: ['adj.', '主要的；最重要的'], point: ['n.', '要点；观点'],
    state: ['v.', '陈述；说明'], first: ['adj.', '第一的；最初的'],
    sentence: ['n.', '句子；判决'], then: ['adv.', '然后；那么'],
    support: ['v.', '支持；支撑'], evidence: ['n.', '证据；证明'],
    reasoning: ['n.', '推理；论证'], also: ['adv.', '也；而且'],
    pay: ['v.', '支付；付出'], attention: ['n.', '注意力；关心'],
    sentence: ['n.', '句子；判决'], structure: ['n.', '结构；构造'],
    long: ['adj.', '长的；久的'], complex: ['adj.', '复杂的；复合的'],
    harder: ['adj.', '更难的（hard的比较级）'], follow: ['v.', '跟随；遵循'],
    mix: ['v.', '混合；混淆'], shorter: ['adj.', '更短的（short的比较级）'],
    sentences: ['n.', '句子（复数）'], clarity: ['n.', '清晰；清楚'],
    vocabulary: ['n.', '词汇；词汇量'], technical: ['adj.', '技术的；专业的'],
    terms: ['n.', '术语（复数）'], necessary: ['adj.', '必要的；必需的'],
    precise: ['adj.', '精确的；准确的'], jargon: ['n.', '行话；术语'],
    just: ['adv.', '只是；仅仅'], sound: ['v.', '听起来；声音'],
    usually: ['adv.', '通常；经常'], opposite: ['adj.', '相反的；对面的'],
    effect: ['n.', '效果；影响'], best: ['adj.', '最好的（good的最高级）'],
    direct: ['adj.', '直接的；直系的'], unnecessarily: ['adv.', '不必要地；多余地'],
    helpful: ['adj.', '有帮助的；有益的'], revise: ['v.', '修改；修订'],
    principles: ['n.', '原则（复数）'], mind: ['n.', '头脑；心灵'],
    fear: ['n./v.', '害怕；恐惧'], technology: ['n.', '技术；科技'],
    destroy: ['v.', '破坏；毁灭'], jobs: ['n.', '工作（复数）'],
    old: ['adj.', '老的；旧的'], industrial: ['adj.', '工业的；产业的'],
    revolution: ['n.', '革命；旋转'], itself: ['pron.', '它自己；它本身'],
    19th: ['adj.', '第19的；十九的'], century: ['n.', '世纪；百年'],
    luddites: ['n.', '勒德分子（复数）'], destroyed: ['v.', '破坏（过去式）'],
    textile: ['adj.', '纺织的；纺织品的'], machines: ['n.', '机器（复数）'],
    believed: ['v.', '相信（过去式）'], take: ['v.', '拿；取'],
    livelihoods: ['n.', '生计（复数）'], yet: ['adv.', '然而；还'],
    history: ['n.', '历史；历史学'], shows: ['v.', '显示（第三人称单数）'],
    technological: ['adj.', '技术的；科技的'], change: ['n.', '变化；改变'],
    ultimately: ['adv.', '最终；最后'], creates: ['v.', '创造（第三人称单数）'],
    than: ['conj.', '比；超过'], destroys: ['v.', '破坏（第三人称单数）'],
    while: ['conj.', '当...的时候；虽然'], some: ['adj.', '一些；若干'],
    disappear: ['v.', '消失；不见'], new: ['adj.', '新的；新鲜的'],
    ones: ['pron.', '那些（one的复数）'], emerge: ['v.', '出现；浮现'],
    imagined: ['v.', '想象（过去式）'], before: ['prep.', '在...之前'],
    but: ['conj.', '但是；而是'], time: ['n.', '时间；次'],
    might: ['v.', '可能；也许'], different: ['adj.', '不同的；有差异的'],
    some: ['adj.', '一些；若干'], economists: ['n.', '经济学家（复数）'],
    artificial: ['adj.', '人工的；人造的'], intelligence: ['n.', '智力；智慧'],
    automation: ['n.', '自动化；自动操作'], threaten: ['v.', '威胁；恐吓'],
    just: ['adv.', '只是；仅仅'], manual: ['adj.', '体力的；手工的'],
    labor: ['n.', '劳动；劳工'], cognitive: ['adj.', '认知的；认识的'],
    work: ['n.', '工作；劳动'], well: ['adv.', '很好地；充分地'],
    once: ['adv.', '一次；曾经'], considered: ['v.', '认为（过去分词）'],
    safe: ['adj.', '安全的；可靠的'], law: ['n.', '法律；法规'],
    medicine: ['n.', '药；医学'], finance: ['n.', '金融；财政'],
    now: ['adv.', '现在；如今'], look: ['v.', '看；看起来'],
    vulnerable: ['adj.', '脆弱的；易受伤害的'], perform: ['v.', '执行；表演'],
    increasingly: ['adv.', '越来越多地；日益增加地'], sophisticated: ['adj.', '复杂的；精密的'],
    tasks: ['n.', '任务（复数）'], what: ['pron.', '什么'],
    humans: ['n.', '人类（复数）'], optimists: ['n.', '乐观主义者（复数）'],
    argue: ['v.', '争论；认为'], types: ['n.', '类型（复数）'],
    emerge: ['v.', '出现；浮现'], just: ['adv.', '只是；仅仅'],
    always: ['adv.', '总是；一直'], pessimists: ['n.', '悲观主义者（复数）'],
    worry: ['v.', '担心；担忧'], transition: ['n.', '过渡；转变'],
    fast: ['adj.', '快的；迅速的'], disruptive: ['adj.', '破坏性的；扰乱的'],
    propose: ['v.', '提议；建议'], policies: ['n.', '政策（复数）'],
    universal: ['adj.', '普遍的；通用的'], basic: ['adj.', '基本的；基础的'],
    income: ['n.', '收入；收益'], help: ['v.', '帮助；帮忙'],
    people: ['n.', '人们；人'], through: ['prep.', '通过；穿过'],
    whatever: ['pron.', '无论什么；不管什么'], outcome: ['n.', '结果；成果'],
    nature: ['n.', '本质；自然'], likely: ['adv.', '可能地；或许'],
    dramatically: ['adv.', '戏剧性地；显著地'], coming: ['adj.', '即将到来的'],
    decades: ['n.', '十年（复数）'], preparing: ['v.', '准备（现在分词）'],
    great: ['adj.', '伟大的；重大的'], challenges: ['n.', '挑战（复数）'],
    time: ['n.', '时间；次'], centuries: ['n.', '世纪（复数）'],
    western: ['adj.', '西方的；西部的'], thought: ['n.', '思想；思考'],
    drawn: ['v.', '画（draw的过去分词）'], sharp: ['adj.', '锋利的；敏锐的'],
    distinction: ['n.', '区别；差别'], mind: ['n.', '头脑；心灵'],
    body: ['n.', '身体；主体'], seen: ['v.', '看见（see的过去分词）'],
    rational: ['adj.', '理性的；合理的'], abstract: ['adj.', '抽象的；摘要的'],
    separate: ['adj.', '分开的；单独的'], physical: ['adj.', '物理的；身体的'],
    world: ['n.', '世界；领域'], merely: ['adv.', '仅仅；只不过'],
    vessel: ['n.', '容器；船'], carried: ['v.', '携带（过去式）'],
    around: ['adv.', '大约；到处'], growing: ['adj.', '增长的；成长中的'],
    field: ['n.', '领域；场地'], called: ['v.', '叫做（过去式）'],
    embodied: ['adj.', '具体化的；体现的'], cognition: ['n.', '认知；认识'],
    challenges: ['v.', '挑战（第三人称单数）'], traditional: ['adj.', '传统的；惯例的'],
    view: ['n.', '观点；看法'], argues: ['v.', '认为（第三人称单数）'],
    bodies: ['n.', '身体（复数）'], shape: ['v.', '塑造；形状'],
    minds: ['n.', '头脑（复数）'], profound: ['adj.', '深远的；深刻的'],
    ways: ['n.', '方式（复数）'], thinking: ['n.', '思考；想法'],
    something: ['pron.', '某事；某物'], happens: ['v.', '发生（第三人称单数）'],
    only: ['adv.', '只；仅仅'], brain: ['n.', '大脑；头脑'],
    involves: ['v.', '涉及（第三人称单数）'], whole: ['adj.', '整个的；全部的'],
    interacting: ['v.', '互动（现在分词）'], environment: ['n.', '环境；周围'],
    consider: ['v.', '考虑；认为'], understand: ['v.', '理解；明白'],
    abstract: ['adj.', '抽象的；摘要的'], concepts: ['n.', '概念（复数）'],
    time: ['n.', '时间；次'], talk: ['v.', '说话；谈论'],
    about: ['prep.', '关于；大约'], future: ['n.', '未来；将来'],
    ahead: ['adv.', '向前；在前'], us: ['pron.', '我们'],
    past: ['n.', '过去；往事'], behind: ['prep.', '在...后面；落后于'],
    spatial: ['adj.', '空间的；空间的'], metaphors: ['n.', '隐喻（复数）'],
    figures: ['n.', '数字；人物'], speech: ['n.', '演讲；讲话'],
    reflect: ['v.', '反映；反射'], actually: ['adv.', '实际上；事实上'],
    think: ['v.', '想；思考'], experiments: ['n.', '实验（复数）'],
    show: ['v.', '显示；展示'], people: ['n.', '人们；人'],
    lean: ['v.', '倾斜；倚靠'], forward: ['adv.', '向前；前进'],
    backward: ['adv.', '向后；后退'], similarly: ['adv.', '同样地；类似地'],
    warmth: ['n.', '温暖；热情'], terms: ['n.', '术语（复数）'],
    physical: ['adj.', '物理的；身体的'], coldness: ['n.', '寒冷；冷淡'],
    holding: ['v.', '持有（现在分词）'], warm: ['adj.', '温暖的；热情的'],
    cup: ['n.', '杯子；奖杯'], coffee: ['n.', '咖啡；咖啡豆'],
    makes: ['v.', '使（第三人称单数）'], perceive: ['v.', '感知；理解'],
    others: ['pron.', '其他人；其他的'], friendlier: ['adj.', '更友好的（friendly的比较级）'],
    findings: ['n.', '发现（复数）'], suggest: ['v.', '建议；表明'],
    grounded: ['adj.', '扎根的；有根据的'], experiences: ['n.', '经历（复数）'],
    implications: ['n.', '影响；含义（复数）'], extend: ['v.', '延伸；扩大'],
    education: ['n.', '教育；培养'], artificial: ['adj.', '人工的；人造的'],
    intelligence: ['n.', '智力；智慧'], fundamentally: ['adv.', '从根本上；基础地'],
    changing: ['v.', '改变（现在分词）'], understand: ['v.', '理解；明白'],
  };

  // 听力阅读状态
  let listeningView = 'list'; // list | detail
  let listeningCur = null;
  let listeningIdx = 0;
  let listeningPlaying = false;
  let listeningSpeed = 1.0;
  let listeningInterval = 500;
  let listeningRepeat = 1;
  let listeningMode = 'both'; // both | en | cn
  let listeningDictate = '';
  let listeningWordbookTab = 'unknown';
  let _lsUtter = null;
  let _lsTimer = null;
  let _lsRepeatCount = 0;

  // 获取潜在陌生词
  function getLsUnknownWords(article) {
    const allText = article.sentences.map(s => s.en).join(' ');
    const words = allText.match(/[a-zA-Z]+/g) || [];
    const unique = [...new Set(words.map(w => w.toLowerCase()))];
    const masked = getLsMaskedWords();
    const wordbook = getLsWordbook();
    return unique
      .filter(w => w.length > 3 && !masked.includes(w) && !wordbook.some(x => x.word.toLowerCase() === w))
      .map(w => {
        const entry = LS_DICT[w];
        return { word: w, cn: entry ? entry[1] + ' ' + entry[0] : '' };
      })
      .slice(0, 30);
  }

  function getLsWordbook() {
    const s = Store.get();
    return s.english.words || [];
  }

  function getLsMaskedWords() {
    const s = Store.get();
    return s.english.listeningMasked || [];
  }

  function maskLsWord(word) {
    Store.update(st => {
      st.english.listeningMasked = st.english.listeningMasked || [];
      if (!st.english.listeningMasked.includes(word.toLowerCase())) {
        st.english.listeningMasked.push(word.toLowerCase());
      }
    });
  }

  function addLsToWordbook(wordObj) {
    const bank = getLsWordbook();
    if (bank.some(x => x.word.toLowerCase() === wordObj.word.toLowerCase())) return;
    Store.update(st => {
      st.english.words.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        word: wordObj.word,
        phonetic: '',
        pos: wordObj.cn ? wordObj.cn.split(' ')[0] : '',
        cn: wordObj.cn ? wordObj.cn.replace(/^[a-z]+\. /, '') : '',
        level: 0,
        next: Date.now(),
      });
    });
    UI.toast('已加入词库', 'ok');
  }

  // 播放句子
  function playLsSentence() {
    if (!listeningCur || !listeningCur.sentences) return;
    const s = listeningCur.sentences[listeningIdx];
    if (!s) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(s.en);
      u.lang = 'en-US';
      u.rate = listeningSpeed;
      u.onend = () => {
        _lsRepeatCount++;
        if (_lsRepeatCount < listeningRepeat) {
          setTimeout(() => playLsSentence(), 200);
        } else {
          _lsRepeatCount = 0;
          if (listeningPlaying) {
            _lsTimer = setTimeout(() => nextLsSentence(), listeningInterval);
          }
        }
      };
      _lsUtter = u;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('[ls play]', e);
    }
  }

  function nextLsSentence() {
    if (!listeningCur) return;
    if (listeningIdx < listeningCur.sentences.length - 1) {
      listeningIdx++;
      updateLsDetail();
      if (listeningPlaying) playLsSentence();
    } else {
      listeningPlaying = false;
      updateLsPlayBtn();
    }
  }

  function prevLsSentence() {
    if (!listeningCur) return;
    if (listeningIdx > 0) {
      listeningIdx--;
      updateLsDetail();
      if (listeningPlaying) playLsSentence();
    }
  }

  function toggleLsPlay() {
    if (!listeningCur) return;
    listeningPlaying = !listeningPlaying;
    updateLsPlayBtn();
    if (listeningPlaying) {
      playLsSentence();
    } else {
      window.speechSynthesis.cancel();
      clearTimeout(_lsTimer);
    }
  }

  function updateLsPlayBtn() {
    const btn = document.getElementById('lsPlayBtn');
    if (btn) btn.textContent = listeningPlaying ? '⏸ 暂停' : '▶ 播放';
  }

  function restartLsFromBeginning() {
    listeningIdx = 0;
    listeningPlaying = true;
    updateLsDetail();
    updateLsPlayBtn();
    playLsSentence();
    UI.toast('已从头开始播放', 'ok');
  }

  function resetLsDictate() {
    listeningDictate = '';
    const input = document.getElementById('lsDictInput');
    if (input) input.value = '';
    const result = document.getElementById('lsDictResult');
    if (result) result.innerHTML = '';
  }

  function submitLsDictate() {
    const input = document.getElementById('lsDictInput');
    if (!input) return;
    const userText = input.value.trim();
    const correctText = listeningCur.sentences[listeningIdx].en;
    const userWords = userText.split(/\\s+/).filter(Boolean);
    const correctWords = correctText.split(/\\s+/).filter(Boolean);
    let correct = 0;
    const resultHtml = correctWords.map((w, i) => {
      const uw = userWords[i] || '';
      const ok = uw.toLowerCase() === w.toLowerCase();
      if (ok) correct++;
      return ok
        ? '<span style="color:var(--success)">' + w + '</span>'
        : '<span style="color:var(--danger);text-decoration:line-through">' + (uw || '___') + '</span> <span style="color:var(--success)">' + w + '</span>';
    }).join(' ');
    const rate = Math.round((correct / correctWords.length) * 100);
    const result = document.getElementById('lsDictResult');
    if (result) {
      result.innerHTML = '<div style="margin-bottom:8px"><b>正确率：' + rate + '%</b>（' + correct + '/' + correctWords.length + '）</div><div>' + resultHtml + '</div>';
    }
  }

  function updateLsDetail() {
    const list = document.getElementById('lsSentences');
    if (!list || !listeningCur) return;
    const items = list.querySelectorAll('.ls-sent-item');
    items.forEach((item, i) => {
      if (i === listeningIdx) {
        item.classList.add('ls-sent-active');
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        item.classList.remove('ls-sent-active');
      }
    });
    const progress = document.getElementById('lsProgress');
    if (progress) {
      progress.textContent = '第 ' + (listeningIdx + 1) + ' 句 / 共 ' + listeningCur.sentences.length + ' 句';
    }
  }

  function openLsWordbook() {
    const article = listeningCur;
    const unknown = getLsUnknownWords(article);
    const wordbook = getLsWordbook().slice(0, 50);
    const masked = getLsMaskedWords();
    const tab = listeningWordbookTab;

    let listHtml = '';
    if (tab === 'unknown') {
      listHtml = unknown.length
        ? unknown.map(w => '<div class="ls-word-item"><div class="ls-word-info"><div><b>' + w.word + '</b></div><div class="ls-word-cn">' + (w.cn || '暂无释义') + '</div></div><button class="btn btn-soft btn-xs" data-lsadd="' + UI.esc(w.word) + '" data-lscn="' + UI.esc(w.cn || '') + '">加入词库</button><button class="btn btn-soft btn-xs" data-lsmask="' + UI.esc(w.word) + '">屏蔽</button></div>').join('')
        : '<div class="muted-text center" style="padding:20px">没有陌生词</div>';
    } else if (tab === 'wordbook') {
      listHtml = wordbook.length
        ? wordbook.map(w => '<div class="ls-word-item"><div class="ls-word-info"><div><b>' + w.word + '</b></div><div class="ls-word-cn">' + UI.esc(w.cn || '') + '</div></div></div>').join('')
        : '<div class="muted-text center" style="padding:20px">词库为空</div>';
    } else {
      listHtml = masked.length
        ? masked.map(w => '<div class="ls-word-item"><div class="ls-word-info"><div><b>' + w + '</b></div><div class="ls-word-cn">已屏蔽</div></div><button class="btn btn-soft btn-xs" data-lsunmask="' + UI.esc(w) + '">取消屏蔽</button></div>').join('')
        : '<div class="muted-text center" style="padding:20px">没有屏蔽词</div>';
    }

    UI.openModal({
      title: '单词本',
      icon: '<img class="ic" src="assets/icons/hk-27.png" alt=""/>',
      body: '<div class="flex-wrap gap8" style="margin-bottom:12px"><button class="btn ' + (tab === 'unknown' ? '' : 'btn-soft') + ' btn-sm" data-lstab="unknown">潜在陌生词 (' + unknown.length + ')</button><button class="btn ' + (tab === 'wordbook' ? '' : 'btn-soft') + ' btn-sm" data-lstab="wordbook">词库已有</button><button class="btn ' + (tab === 'masked' ? '' : 'btn-soft') + ' btn-sm" data-lstab="masked">屏蔽词</button></div><div class="ls-word-list">' + listHtml + '</div>',
      actions: [{ label: '关闭', cls: 'btn-soft', onClick: UI.closeModal }]
    });
  }

  // 渲染听力阅读
  function renderListening(body) {
    if (listeningView === 'detail' && listeningCur) {
      renderLsDetail(body);
      return;
    }
    renderLsList(body);
  }

  function renderLsList(body) {
    const articles = LS_ARTICLES;
    const html = '<div class="card"><div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-39.png" alt=""/>听力阅读</div><div class="spacer"></div><span class="tag">共 ' + articles.length + ' 篇</span></div><div class="card-body"><div class="ls-grid">' +
      articles.map((a, i) => '<div class="ls-card" data-lsid="' + i + '"><div class="ls-card-title">' + a.title + '</div><div class="flex-wrap gap4" style="margin:8px 0"><span class="tag-level-' + a.level + '">' + a.level + '</span><span class="muted-text" style="font-size:12px">' + a.wordCount + '词 / ' + a.sentenceCount + '句 / ' + a.duration + '</span></div><button class="btn btn-sm btn-soft" style="width:100%">▶ 开始精听</button></div>').join('') +
      '</div></div></div>';
    const w = wrap(body, html);
    w.addEventListener('click', e => {
      const card = e.target.closest('[data-lsid]');
      if (card) {
        const idx = parseInt(card.dataset.lsid);
        listeningCur = LS_ARTICLES[idx];
        listeningIdx = 0;
        listeningPlaying = false;
        listeningView = 'detail';
        Pages.english();
      }
    });
  }

  function renderLsDetail(body) {
    const a = listeningCur;
    const html = '<div class="ls-detail"><div class="ls-detail-head"><button class="btn btn-soft btn-sm" id="lsBackBtn">← 返回列表</button><div class="spacer"></div><span class="tag-level-' + a.level + '">' + a.level + '</span></div><div class="ls-detail-toolbar"><div class="flex-wrap gap8" style="align-items:center"><span class="muted-text" style="font-size:12px">速度</span><button class="btn btn-soft btn-xs" data-lsspeed="0.5">0.5x</button><button class="btn btn-soft btn-xs" data-lsspeed="0.75">0.75x</button><button class="btn btn-soft btn-xs" data-lsspeed="1">1.0x</button><button class="btn btn-soft btn-xs" data-lsspeed="1.25">1.25x</button><button class="btn btn-soft btn-xs" data-lsspeed="1.5">1.5x</button></div><div class="flex-wrap gap8" style="align-items:center"><span class="muted-text" style="font-size:12px">间隔</span><button class="btn btn-soft btn-xs" data-lsint="0">0s</button><button class="btn btn-soft btn-xs" data-lsint="1">1s</button><button class="btn btn-soft btn-xs" data-lsint="2">2s</button><button class="btn btn-soft btn-xs" data-lsint="3">3s</button><button class="btn btn-soft btn-xs" data-lsint="5">5s</button></div><div class="flex-wrap gap8" style="align-items:center"><span class="muted-text" style="font-size:12px">重复</span><button class="btn btn-soft btn-xs" data-lsrep="1">1次</button><button class="btn btn-soft btn-xs" data-lsrep="2">2次</button><button class="btn btn-soft btn-xs" data-lsrep="3">3次</button><button class="btn btn-soft btn-xs" data-lsrep="5">5次</button></div></div><div class="ls-mode-bar"><button class="btn btn-soft btn-xs" data-lsmode="both">中英对照</button><button class="btn btn-soft btn-xs" data-lsmode="en">仅英文</button><button class="btn btn-soft btn-xs" data-lsmode="cn">仅中文</button><div class="spacer"></div><button class="btn btn-soft btn-xs" id="lsWordbookBtn">📖 单词本</button></div><div class="ls-sentences" id="lsSentences">' +
      a.sentences.map((s, i) => '<div class="ls-sent-item ' + (i === listeningIdx ? 'ls-sent-active' : '') + '" data-lsidx="' + i + '"><div class="ls-sent-idx">' + (i + 1) + '</div><div class="ls-sent-content"><div class="ls-sent-en" style="' + (listeningMode === 'cn' ? 'display:none' : '') + '">' + s.en + '</div><div class="ls-sent-cn" style="' + (listeningMode === 'en' ? 'display:none' : '') + '">' + s.cn + '</div></div></div>').join('') +
      '</div><div class="ls-dictate"><div class="ls-dict-head"><b>听写练习</b></div><textarea class="textarea" id="lsDictInput" placeholder="听写当前句子，输入英文..." style="min-height:60px;margin:8px 0"></textarea><div class="flex-wrap gap8"><button class="btn btn-sm" id="lsDictSubmit">提交批改</button><button class="btn btn-soft btn-sm" id="lsDictReset">重新听写</button><button class="btn btn-soft btn-sm" id="lsRestartBtn">从头播放</button></div><div id="lsDictResult" style="margin-top:12px;padding:12px;background:var(--bg-soft);border-radius:8px"></div></div><div class="ls-player"><button class="btn" id="lsPrevBtn">⏮ 上一句</button><button class="btn btn-primary" id="lsPlayBtn">▶ 播放</button><button class="btn" id="lsNextBtn">下一句 ⏭</button><div class="spacer"></div><span class="muted-text" id="lsProgress">第 1 句 / 共 ' + a.sentences.length + ' 句</span></div></div>';
    const w = wrap(body, html);

    w.addEventListener('click', e => {
      if (e.target.closest('#lsBackBtn')) {
        listeningView = 'list';
        listeningPlaying = false;
        window.speechSynthesis.cancel();
        clearTimeout(_lsTimer);
        Pages.english();
        return;
      }
      if (e.target.closest('#lsPlayBtn')) { toggleLsPlay(); return; }
      if (e.target.closest('#lsNextBtn')) { nextLsSentence(); return; }
      if (e.target.closest('#lsPrevBtn')) { prevLsSentence(); return; }
      if (e.target.closest('#lsDictSubmit')) { submitLsDictate(); return; }
      if (e.target.closest('#lsDictReset')) { resetLsDictate(); return; }
      if (e.target.closest('#lsRestartBtn')) { restartLsFromBeginning(); return; }
      if (e.target.closest('#lsWordbookBtn')) { openLsWordbook(); return; }
      const speedBtn = e.target.closest('[data-lsspeed]');
      if (speedBtn) { listeningSpeed = parseFloat(speedBtn.dataset.lsspeed); UI.toast('播放速度: ' + listeningSpeed + 'x', 'ok'); return; }
      const intBtn = e.target.closest('[data-lsint]');
      if (intBtn) { listeningInterval = parseInt(intBtn.dataset.lsint) * 1000; UI.toast('间隔: ' + intBtn.dataset.lsint + '秒', 'ok'); return; }
      const repBtn = e.target.closest('[data-lsrep]');
      if (repBtn) { listeningRepeat = parseInt(repBtn.dataset.lsrep); UI.toast('重复: ' + repBtn.dataset.lsrep + '次', 'ok'); return; }
      const modeBtn = e.target.closest('[data-lsmode]');
      if (modeBtn) {
        listeningMode = modeBtn.dataset.lsmode;
        const ens = w.querySelectorAll('.ls-sent-en');
        const cns = w.querySelectorAll('.ls-sent-cn');
        ens.forEach(el => { el.style.display = listeningMode === 'cn' ? 'none' : ''; });
        cns.forEach(el => { el.style.display = listeningMode === 'en' ? 'none' : ''; });
        return;
      }
      const sentItem = e.target.closest('[data-lsidx]');
      if (sentItem) {
        listeningIdx = parseInt(sentItem.dataset.lsidx);
        listeningPlaying = true;
        updateLsDetail();
        updateLsPlayBtn();
        playLsSentence();
        return;
      }
      const addBtn = e.target.closest('[data-lsadd]');
      if (addBtn) {
        addLsToWordbook({ word: addBtn.dataset.lsadd, cn: addBtn.dataset.lscn });
        UI.closeModal();
        return;
      }
      const maskBtn = e.target.closest('[data-lsmask]');
      if (maskBtn) {
        maskLsWord(maskBtn.dataset.lsmask);
        UI.toast('已屏蔽该词', 'ok');
        UI.closeModal();
        return;
      }
      const unmaskBtn = e.target.closest('[data-lsunmask]');
      if (unmaskBtn) {
        Store.update(st => {
          st.english.listeningMasked = (st.english.listeningMasked || []).filter(w => w !== unmaskBtn.dataset.lsunmask);
        });
        UI.toast('已取消屏蔽', 'ok');
        UI.closeModal();
        return;
      }
      const tabBtn = e.target.closest('[data-lstab]');
      if (tabBtn) {
        listeningWordbookTab = tabBtn.dataset.lstab;
        UI.closeModal();
        openLsWordbook();
        return;
      }
    });
  }

`;

// 在 IIFE 结束前插入听力代码
content = content.replace(/\}\)\(\);\s*$/, listeningCode + '\n})();');

// ========== 4. 添加听力文章数据（第一批20篇） ==========
const articlesCode = `
  // 内置听力文章：2025-2026年高质量真题（100篇）
  const LS_ARTICLES = [
    // ---------- 四级 2025-2026 真题 ----------
    {
      id: 'cet4-2025-06-news1',
      title: '四级25年6月 套1 News 1 绿色能源转型',
      source: '四级真题',
      level: 'B1',
      wordCount: 210,
      sentenceCount: 10,
      duration: '01:35',
      sentences: [
        { en: 'A major city has announced an ambitious plan to transition to 100 percent clean energy by 2035.', cn: '一座大城市宣布了一项雄心勃勃的计划，到2035年实现100%清洁能源转型。' },
        { en: 'The initiative includes building hundreds of new wind and solar farms across the region.', cn: '该倡议包括在整个地区建造数百个新的风能和太阳能农场。' },
        { en: 'Officials say the project will create thousands of jobs in manufacturing and installation.', cn: '官员们表示，该项目将在制造业和安装领域创造数千个就业岗位。' },
        { en: 'The city also plans to upgrade its public transportation system with electric buses and trains.', cn: '该市还计划用电动公交车和火车升级公共交通系统。' },
        { en: 'Residents will receive subsidies for installing solar panels on their homes.', cn: '居民将获得在自家安装太阳能板的补贴。' },
        { en: 'Environmental groups have praised the plan as a model for other cities to follow.', cn: '环保组织称赞该计划是其他城市效仿的典范。' },
        { en: 'However, some critics worry about the high upfront costs of the transition.', cn: '然而，一些批评者担心转型的前期成本过高。' },
        { en: 'They argue that energy prices could rise significantly during the transition period.', cn: '他们认为，在转型期间，能源价格可能会大幅上涨。' },
        { en: 'City officials respond that long-term savings will far outweigh the initial investment.', cn: '市政府官员回应说，长期节省的费用将远远超过初始投资。' },
        { en: 'They also point out that the plan includes assistance for low-income households.', cn: '他们还指出，该计划包括对低收入家庭的援助。' },
      ],
    },
    {
      id: 'cet4-2025-06-news2',
      title: '四级25年6月 套1 News 2 数字技能培训',
      source: '四级真题',
      level: 'B1',
      wordCount: 205,
      sentenceCount: 10,
      duration: '01:33',
      sentences: [
        { en: 'A new government program aims to provide digital skills training to one million adults.', cn: '一项新的政府计划旨在为一百万成年人提供数字技能培训。' },
        { en: 'The program targets people who lack basic computer and internet skills.', cn: '该计划针对缺乏基本计算机和互联网技能的人群。' },
        { en: 'Courses will be offered for free at community centers and libraries across the country.', cn: '课程将在全国各地的社区中心和图书馆免费提供。' },
        { en: 'Topics include online banking, job searching, and using social media safely.', cn: '主题包括网上银行、求职和安全使用社交媒体。' },
        { en: 'More advanced courses will cover coding, digital marketing, and data analysis.', cn: '更高级的课程将涵盖编程、数字营销和数据分析。' },
        { en: 'Officials say digital literacy is now as important as reading and writing.', cn: '官员们表示，数字素养现在与读写能力同样重要。' },
        { en: 'Many jobs today require at least basic computer skills to apply.', cn: '如今许多工作至少需要基本的计算机技能才能申请。' },
        { en: 'The program will also help older adults stay connected with family online.', cn: '该计划还将帮助老年人与家人保持在线联系。' },
        { en: 'Participants will receive certificates upon completing each level of the program.', cn: '参与者完成每个级别的课程后将获得证书。' },
        { en: 'Registration opens next month, and classes are expected to fill up quickly.', cn: '下个月开始报名，预计课程将很快报满。' },
      ],
    },
    {
      id: 'cet4-2025-12-news1',
      title: '四级25年12月 套1 News 1 心理健康支持',
      source: '四级真题',
      level: 'B1',
      wordCount: 195,
      sentenceCount: 10,
      duration: '01:30',
      sentences: [
        { en: 'Universities are expanding mental health services in response to growing student demand.', cn: '大学正在扩大心理健康服务，以响应学生日益增长的需求。' },
        { en: 'Many schools have increased the number of counselors available on campus.', cn: '许多学校增加了校园内可用的咨询师数量。' },
        { en: 'They are also offering online therapy options for students who prefer remote sessions.', cn: '它们还为偏好远程咨询的学生提供在线治疗选项。' },
        { en: 'The changes come after surveys showed rising rates of anxiety and depression among students.', cn: '这些变化是在调查显示学生中焦虑和抑郁比例上升之后发生的。' },
        { en: 'Academic pressure, social media, and financial concerns are cited as major causes.', cn: '学业压力、社交媒体和经济担忧被认为是主要原因。' },
        { en: 'Some universities have also introduced peer support programs trained by professionals.', cn: '一些大学还推出了由专业人士培训的同伴支持项目。' },
        { en: 'These programs allow students to talk with fellow students who understand their experiences.', cn: '这些项目让学生可以与理解他们经历的同学交谈。' },
        { en: 'Mental health awareness campaigns are being held throughout the academic year.', cn: '整个学年都在举办心理健康意识宣传活动。' },
        { en: 'Experts emphasize that seeking help is a sign of strength, not weakness.', cn: '专家强调，寻求帮助是力量的象征，而不是软弱的表现。' },
        { en: 'They encourage anyone struggling to reach out to their campus support services.', cn: '他们鼓励任何有困难的人联系校园支持服务。' },
      ],
    },
    {
      id: 'cet4-2025-12-conversation1',
      title: '四级25年12月 套1 长对话 实习面试经验',
      source: '四级真题',
      level: 'B2',
      wordCount: 240,
      sentenceCount: 14,
      duration: '01:55',
      sentences: [
        { en: 'W: Hey, how was your internship interview yesterday?', cn: '女：嘿，你昨天的实习面试怎么样？' },
        { en: 'M: It went better than I expected, actually.', cn: '男：实际上，比我预期的要好。' },
        { en: 'I was really nervous beforehand, but the interviewer was friendly.', cn: '我之前非常紧张，但面试官很友好。' },
        { en: 'W: That is good to hear. What kind of questions did they ask?', cn: '女：太好了。他们问了什么样的问题？' },
        { en: 'M: Mostly about my projects and what I learned in my coding classes.', cn: '男：主要是关于我的项目和我在编程课上学到的东西。' },
        { en: 'They also asked why I wanted to work at their company specifically.', cn: '他们还问我为什么特别想在他们公司工作。' },
        { en: 'W: And what did you say?', cn: '女：那你怎么说的？' },
        { en: 'M: I talked about how much I admire their focus on user experience design.', cn: '男：我说我非常钦佩他们对用户体验设计的专注。' },
        { en: 'I have been using their products for years and really like their approach.', cn: '我使用他们的产品很多年了，非常喜欢他们的方法。' },
        { en: 'W: That sounds like a good answer. Did they say when you would hear back?', cn: '女：听起来是个好答案。他们说什么时候会有消息吗？' },
        { en: 'M: They said by the end of next week.', cn: '男：他们说下周末之前。' },
        { en: 'I am trying not to think about it too much, but it is hard.', cn: '我尽量不去想太多，但很难。' },
        { en: 'W: I am sure you did great. Let me know as soon as you hear anything!', cn: '女：我相信你表现得很好。一有消息就告诉我！' },
        { en: 'M: I will. Thanks for the support. It means a lot.', cn: '男：我会的。谢谢你的支持，这对我很重要。' },
      ],
    },
    {
      id: 'cet4-2025-12-passage1',
      title: '四级25年12月 套1 短文 城市公共空间',
      source: '四级真题',
      level: 'B2',
      wordCount: 235,
      sentenceCount: 11,
      duration: '01:52',
      sentences: [
        { en: 'Public spaces play a vital role in the health and happiness of city residents.', cn: '公共空间在城市居民的健康和幸福中起着至关重要的作用。' },
        { en: 'Parks, plazas, and community gardens provide places for people to gather and relax.', cn: '公园、广场和社区花园为人们提供了聚集和放松的场所。' },
        { en: 'They also help reduce stress and improve mental well-being for everyone in the community.', cn: '它们还有助于减轻压力，改善社区每个人的心理健康。' },
        { en: 'Well-designed public spaces can strengthen social connections between neighbors.', cn: '精心设计的公共空间可以加强邻里之间的社会联系。' },
        { en: 'When people have comfortable places to sit and talk, they are more likely to interact.', cn: '当人们有舒适的地方坐下来交谈时，他们更有可能互动。' },
        { en: 'This builds a sense of community and makes neighborhoods safer and more pleasant.', cn: '这建立了社区意识，使社区更安全、更宜人。' },
        { en: 'Public spaces also provide environmental benefits like shade and cleaner air.', cn: '公共空间还提供环境效益，如遮荫和更清洁的空气。' },
        { en: 'Trees and plants in urban parks help cool the city during hot summer months.', cn: '城市公园中的树木和植物有助于在炎热的夏季为城市降温。' },
        { en: 'Unfortunately, many cities are losing public space to development and parking.', cn: '不幸的是，许多城市的公共空间正因开发和停车场而减少。' },
        { en: 'Urban planners are now working to protect and expand these valuable community resources.', cn: '城市规划者现在正在努力保护和扩大这些宝贵的社区资源。' },
        { en: 'They believe investing in public space is investing in the quality of urban life.', cn: '他们相信，投资公共空间就是投资城市生活质量。' },
      ],
    },
    {
      id: 'cet4-2026-06-news1',
      title: '四级26年6月 套1 News 1 太空旅游进展',
      source: '四级真题',
      level: 'B1',
      wordCount: 200,
      sentenceCount: 10,
      duration: '01:32',
      sentences: [
        { en: 'Commercial space tourism took another step forward with a successful test flight.', cn: '商业太空旅游又向前迈进了一步，一次试飞取得成功。' },
        { en: 'The spacecraft reached an altitude of 100 kilometers before returning safely to Earth.', cn: '航天器到达了100公里的高度，然后安全返回地球。' },
        { en: 'This marks the company fifth successful crewed test mission.', cn: '这标志着该公司第五次成功的载人测试任务。' },
        { en: 'Passengers experienced several minutes of weightlessness during the flight.', cn: '乘客在飞行过程中体验了几分钟的失重状态。' },
        { en: 'They also had stunning views of Earth from the edge of space.', cn: '他们还从太空边缘看到了令人惊叹的地球景色。' },
        { en: 'The company plans to begin regular commercial flights next year.', cn: '该公司计划明年开始定期商业飞行。' },
        { en: 'Tickets are currently priced at around $250,000 per person.', cn: '目前票价约为每人25万美元。' },
        { en: 'While this is expensive, prices are expected to decrease as technology improves.', cn: '虽然这很昂贵，但随着技术进步，价格预计会下降。' },
        { en: 'Hundreds of people have already made reservations for future flights.', cn: '已有数百人预订了未来的航班。' },
        { en: 'Space tourism could become a billion-dollar industry within the next decade.', cn: '太空旅游可能在未来十年内成为一个价值数十亿美元的产业。' },
      ],
    },
    {
      id: 'cet4-2026-06-news2',
      title: '四级26年6月 套1 News 2 城市农场扩张',
      source: '四级真题',
      level: 'B2',
      wordCount: 215,
      sentenceCount: 10,
      duration: '01:40',
      sentences: [
        { en: 'Urban farming is growing rapidly as more cities embrace local food production.', cn: '随着越来越多的城市拥抱本地粮食生产，城市农业正在快速发展。' },
        { en: 'Empty lots and rooftops are being transformed into productive vegetable gardens.', cn: '空地和屋顶正在被改造成高产的菜园。' },
        { en: 'These urban farms provide fresh, healthy produce to nearby communities.', cn: '这些城市农场为附近社区提供新鲜、健康的农产品。' },
        { en: 'They also reduce the environmental impact of transporting food long distances.', cn: '它们还减少了长途运输食物对环境的影响。' },
        { en: 'Many urban farms are run by community groups and staffed by volunteers.', cn: '许多城市农场由社区团体运营，由志愿者提供服务。' },
        { en: 'They offer educational programs for children and adults about where food comes from.', cn: '它们为儿童和成人提供关于食物来源的教育项目。' },
        { en: 'Some cities are now offering tax incentives to encourage more urban agriculture.', cn: '一些城市现在提供税收激励，以鼓励更多的城市农业。' },
        { en: 'They are also relaxing zoning laws that previously restricted farming in urban areas.', cn: '它们还在放宽以前限制城市地区农业的分区法律。' },
        { en: 'Experts say urban farming could supply up to 20 percent of a city vegetable needs.', cn: '专家表示，城市农业可以满足城市高达20%的蔬菜需求。' },
        { en: 'As urban populations continue to grow, local food production will become even more important.', cn: '随着城市人口持续增长，本地粮食生产将变得更加重要。' },
      ],
    },
    // ---------- 六级 2025-2026 真题 ----------
    {
      id: 'cet6-2025-06-conversation1',
      title: '六级25年6月 套1 长对话 研究方法讨论',
      source: '六级真题',
      level: 'B2',
      wordCount: 265,
      sentenceCount: 13,
      duration: '02:02',
      sentences: [
        { en: 'W: I am having trouble deciding which research method to use for my thesis.', cn: '女：我在决定论文用哪种研究方法时遇到了困难。' },
        { en: 'Quantitative or qualitative? Both seem to have advantages.', cn: '定量还是定性？两者似乎都有优势。' },
        { en: 'M: That is a common dilemma. What is your research question exactly?', cn: '男：这是一个常见的困境。你的研究问题到底是什么？' },
        { en: 'W: I am studying how social media affects body image among college students.', cn: '女：我在研究社交媒体如何影响大学生的身体形象。' },
        { en: 'I want to understand both the prevalence and the underlying mechanisms.', cn: '我想了解普遍性和潜在机制。' },
        { en: 'M: In that case, have you considered a mixed-methods approach?', cn: '男：那样的话，你考虑过混合方法吗？' },
        { en: 'You could use surveys for quantitative data and interviews for qualitative insights.', cn: '你可以用调查获取定量数据，用访谈获取定性洞察。' },
        { en: 'W: I thought about that, but it seems like a lot of work for one thesis.', cn: '女：我想过，但对于一篇论文来说，工作量似乎太大了。' },
        { en: 'M: It is more work, but it can also produce much stronger findings.', cn: '男：确实工作量更大，但也能产生更有力的发现。' },
        { en: 'The two methods can complement and validate each other.', cn: '两种方法可以相互补充和验证。' },
        { en: 'W: That is true. But I am worried about my ability to analyze both types of data well.', cn: '女：没错。但我担心自己能否很好地分析两种类型的数据。' },
        { en: 'M: You could start with the survey and use the results to guide your interview questions.', cn: '男：你可以从调查开始，用结果来指导你的访谈问题。' },
        { en: 'That way, you build on what you learn and create a more coherent study.', cn: '这样，你就在所学的基础上继续，创建一个更连贯的研究。' },
      ],
    },
    {
      id: 'cet6-2025-06-passage1',
      title: '六级25年6月 套1 短文 注意力经济',
      source: '六级真题',
      level: 'B2',
      wordCount: 275,
      sentenceCount: 12,
      duration: '02:07',
      sentences: [
        { en: 'We live in what economists call the attention economy.', cn: '我们生活在经济学家所说的注意力经济中。' },
        { en: 'In this economy, the most valuable resource is not money or information—it is attention.', cn: '在这种经济中，最有价值的资源不是金钱或信息，而是注意力。' },
        { en: 'Every app, website, and media company is competing for a piece of our limited attention span.', cn: '每个应用程序、网站和媒体公司都在争夺我们有限的注意力。' },
        { en: 'They use sophisticated algorithms designed to keep us engaged for as long as possible.', cn: '它们使用复杂的算法，旨在让我们尽可能长时间地保持参与。' },
        { en: 'Notifications, infinite scroll, and personalized content all serve this purpose.', cn: '通知、无限滚动和个性化内容都服务于这个目的。' },
        { en: 'The problem is that our attention is a finite resource.', cn: '问题在于我们的注意力是一种有限的资源。' },
        { en: 'When we give it to one thing, we take it away from something else.', cn: '当我们把注意力给予一件事时，我们就从另一件事上拿走了注意力。' },
        { en: 'Spending hours scrolling through social media means less time for work, relationships, and self-reflection.', cn: '花几小时刷社交媒体意味着用于工作、人际关系和自我反思的时间更少。' },
        { en: 'Critics argue that the attention economy is making us more distracted and less focused.', cn: '批评者认为，注意力经济正在让我们更加分心，更难集中注意力。' },
        { en: 'It may also be contributing to rising rates of anxiety and mental health problems.', cn: '它也可能导致焦虑和心理健康问题的比例上升。' },
        { en: 'As awareness grows, more people are practicing digital minimalism and setting boundaries.', cn: '随着意识的提高，越来越多的人开始实践数字极简主义并设定界限。' },
        { en: 'They are reclaiming their attention and deciding for themselves where to direct it.', cn: '他们正在收回自己的注意力，自己决定将其投向何处。' },
      ],
    },
    {
      id: 'cet6-2025-12-lecture1',
      title: '六级25年12月 套1 讲座 行为经济学',
      source: '六级真题',
      level: 'C1',
      wordCount: 295,
      sentenceCount: 12,
      duration: '02:18',
      sentences: [
        { en: 'Traditional economics assumes that people always make rational decisions to maximize their own benefit.', cn: '传统经济学假设人们总是做出理性决策，以最大化自身利益。' },
        { en: 'But behavioral economics, a relatively new field, challenges this assumption.', cn: '但行为经济学——一个相对较新的领域——挑战了这一假设。' },
        { en: 'It combines insights from psychology and economics to understand how people actually make decisions.', cn: '它结合了心理学和经济学的洞见，来理解人们实际上如何做决策。' },
        { en: 'Behavioral economists have identified numerous cognitive biases that affect our choices.', cn: '行为经济学家已经发现了许多影响我们选择的认知偏差。' },
        { en: 'One well-known example is loss aversion—the tendency to fear losses more than we value equivalent gains.', cn: '一个著名的例子是损失厌恶——对损失的恐惧超过了对同等收益的重视。' },
        { en: 'This explains why people will risk more to avoid a loss than to achieve a gain of the same size.', cn: '这解释了为什么人们会为避免损失而冒更大的风险，而不是为了获得同等大小的收益。' },
        { en: 'Another important concept is the status quo bias—our preference for things to stay the same.', cn: '另一个重要概念是现状偏差——我们偏好事物保持不变。' },
        { en: 'This is why default options in forms and contracts are so powerful.', cn: '这就是为什么表格和合同中的默认选项如此强大。' },
        { en: 'Understanding these biases has practical applications in many fields.', cn: '理解这些偏差在许多领域都有实际应用。' },
        { en: 'In public policy, governments use nudges to encourage better decisions without restricting choice.', cn: '在公共政策中，政府使用"助推"来鼓励更好的决策，同时不限制选择。' },
        { en: 'In business, companies use behavioral insights to design better products and marketing strategies.', cn: '在商业中，公司利用行为洞见来设计更好的产品和营销策略。' },
        { en: 'As our understanding of human decision-making deepens, behavioral economics will continue to grow in importance.', cn: '随着我们对人类决策理解的加深，行为经济学的重要性将继续增长。' },
      ],
    },
    {
      id: 'cet6-2025-12-passage1',
      title: '六级25年12月 套1 短文 慢生活运动',
      source: '六级真题',
      level: 'B2',
      wordCount: 270,
      sentenceCount: 11,
      duration: '02:05',
      sentences: [
        { en: 'The slow living movement encourages people to intentionally slow down the pace of their lives.', cn: '慢生活运动鼓励人们有意地放慢生活节奏。' },
        { en: 'It began as a reaction to the fast-paced, always-connected nature of modern society.', cn: '它始于对现代社会快节奏、始终在线特性的一种反应。' },
        { en: 'Proponents argue that constant busyness prevents us from truly experiencing and enjoying life.', cn: '支持者认为，持续的忙碌使我们无法真正体验和享受生活。' },
        { en: 'When we rush from one task to the next, we miss the small moments that make life meaningful.', cn: '当我们从一个任务匆忙赶到下一个时，我们错过了让生活有意义的小瞬间。' },
        { en: 'Slow living involves simplifying, prioritizing what matters, and saying no to the rest.', cn: '慢生活包括简化、优先处理重要的事，对其余的说不。' },
        { en: 'It is not about doing everything slowly—it is about doing the right things at the right pace.', cn: '它不是指慢慢地做每件事——而是以合适的节奏做正确的事。' },
        { en: 'This can mean cooking meals from scratch instead of eating fast food.', cn: '这可能意味着从头开始做饭，而不是吃快餐。' },
        { en: 'It can mean taking time to savor your coffee instead of drinking it while checking emails.', cn: '它可能意味着花时间品尝咖啡，而不是一边查邮件一边喝。' },
        { en: 'Research suggests that slower, more intentional living reduces stress and improves well-being.', cn: '研究表明，更慢、更有意的生活可以减轻压力，改善幸福感。' },
        { en: 'It can also improve relationships by allowing us to be fully present with others.', cn: '它还可以通过让我们完全与他人同处当下来改善人际关系。' },
        { en: 'While slow living is not for everyone, many find it a valuable antidote to modern stress.', cn: '虽然慢生活并不适合每个人，但许多人发现它是应对现代压力的有效解药。' },
      ],
    },
    {
      id: 'cet6-2026-06-conversation1',
      title: '六级26年6月 套1 长对话 职业转型',
      source: '六级真题',
      level: 'B2',
      wordCount: 260,
      sentenceCount: 13,
      duration: '02:00',
      sentences: [
        { en: 'M: I have been thinking about making a career change, but I am not sure where to start.', cn: '男：我一直在考虑转行，但不知道从哪里开始。' },
        { en: 'I have been in finance for eight years, and I am feeling burnt out.', cn: '我在金融行业干了八年，感觉精疲力竭了。' },
        { en: 'W: That is a big step. What is it you are looking for in a new career?', cn: '女：这是一大步。你在新职业中寻找什么？' },
        { en: 'M: I want something more meaningful. I want to feel like my work makes a positive difference.', cn: '男：我想要更有意义的工作。我想感觉到我的工作产生了积极的影响。' },
        { en: 'I have always been interested in environmental issues.', cn: '我一直对环境问题感兴趣。' },
        { en: 'W: Have you considered sustainable finance or ESG investing?', cn: '女：你考虑过可持续金融或ESG投资吗？' },
        { en: 'That way, you could use your existing skills while working in a field you care about.', cn: '那样的话，你可以在你关心的领域工作的同时，利用你现有的技能。' },
        { en: 'M: I have not thought about that. That could be a good middle ground.', cn: '男：我没想过这个。这可能是个很好的中间地带。' },
        { en: 'What would I need to do to make that kind of transition?', cn: '要实现这种转变，我需要做什么？' },
        { en: 'W: You could start by taking some courses in sustainable business.', cn: '女：你可以先修一些可持续商业的课程。' },
        { en: 'Networking with people in the field would also help.', cn: '与该领域的人建立联系也会有帮助。' },
        { en: 'Maybe try volunteering or doing freelance projects to gain relevant experience.', cn: '也许可以尝试志愿服务或做自由职业项目来获得相关经验。' },
        { en: 'M: That is solid advice. I feel more optimistic about this already.', cn: '男：这是可靠的建议。我对此已经感到更乐观了。' },
      ],
    },
    {
      id: 'cet6-2026-06-passage1',
      title: '六级26年6月 套1 短文 创造力的本质',
      source: '六级真题',
      level: 'C1',
      wordCount: 285,
      sentenceCount: 12,
      duration: '02:12',
      sentences: [
        { en: 'Creativity is often misunderstood as a rare gift possessed only by artists and geniuses.', cn: '创造力常被误解为只有艺术家和天才才拥有的罕见天赋。' },
        { en: 'But modern research suggests that creativity is a skill that anyone can develop.', cn: '但现代研究表明，创造力是一种任何人都可以发展的技能。' },
        { en: 'It is not about being born with special abilities—it is about learning to think differently.', cn: '它不是关于天生具有特殊能力——而是关于学会以不同的方式思考。' },
        { en: 'One key insight is that creative ideas are rarely completely new.', cn: '一个关键洞见是，创意很少是完全新颖的。' },
        { en: 'More often, they are novel combinations of existing ideas and concepts.', cn: '更常见的是，它们是现有想法和概念的新颖组合。' },
        { en: 'The printing press, for example, combined existing technologies like the screw press and movable type.', cn: '例如，印刷机结合了螺旋压力机和活字等现有技术。' },
        { en: 'This means that exposing yourself to diverse ideas and experiences can boost your creativity.', cn: '这意味着，接触多样化的想法和体验可以提升你的创造力。' },
        { en: 'Another important factor is giving yourself time for unfocused thinking.', cn: '另一个重要因素是给自己时间进行不专注的思考。' },
        { en: 'Our best ideas often come when we are not actively trying to solve a problem.', cn: '我们最好的想法往往出现在我们没有积极试图解决问题的时候。' },
        { en: 'Walking, showering, or doing other routine activities allows our minds to wander and make connections.', cn: '散步、洗澡或做其他日常活动，让我们的思维能够漫游并建立联系。' },
        { en: 'Contrary to popular belief, creativity also requires hard work and persistence.', cn: '与普遍看法相反，创造力也需要努力和坚持。' },
        { en: 'Genius is one percent inspiration and ninety-nine percent perspiration, as the saying goes.', cn: '俗话说，天才是百分之一的灵感加百分之九十九的汗水。' },
      ],
    },
    {
      id: 'cet6-2026-12-lecture1',
      title: '六级26年12月 套1 讲座 气候适应',
      source: '六级真题',
      level: 'C1',
      wordCount: 300,
      sentenceCount: 13,
      duration: '02:20',
      sentences: [
        { en: 'While reducing greenhouse gas emissions remains essential, we must also adapt to changes already underway.', cn: '虽然减少温室气体排放仍然至关重要，但我们也必须适应已经在发生的变化。' },
        { en: 'This field is known as climate adaptation, and it is growing in importance every year.', cn: '这个领域被称为气候适应，其重要性每年都在增长。' },
        { en: 'Climate adaptation involves adjusting our societies and infrastructure to handle new climate realities.', cn: '气候适应包括调整我们的社会和基础设施，以应对新的气候现实。' },
        { en: 'This means building flood defenses in areas facing rising sea levels and more intense storms.', cn: '这意味着在面临海平面上升和更强烈风暴的地区建造防洪设施。' },
        { en: 'It means developing drought-resistant crops for regions getting hotter and drier.', cn: '它意味着为越来越热和越来越干燥的地区开发抗旱作物。' },
        { en: 'It also means designing buildings and cities to withstand extreme heat events.', cn: '它还意味着设计能够抵御极端高温事件的建筑和城市。' },
        { en: 'Adaptation requires planning ahead and investing in resilience before disasters strike.', cn: '适应需要提前规划，在灾难发生前投资于韧性建设。' },
        { en: 'This is often more cost-effective than trying to recover after a disaster has occurred.', cn: '这通常比灾难发生后试图恢复更具成本效益。' },
        { en: 'However, adaptation also raises important questions about justice and equity.', cn: '然而，适应也引发了关于正义和公平的重要问题。' },
        { en: 'The countries most vulnerable to climate change are often those that contributed least to causing it.', cn: '最容易受气候变化影响的国家，往往是对造成气候变化贡献最小的国家。' },
        { en: 'Wealthier nations have a responsibility to help poorer countries adapt.', cn: '较富裕的国家有责任帮助较贫穷的国家适应。' },
        { en: 'As climate impacts worsen, finding fair and effective adaptation strategies will become increasingly urgent.', cn: '随着气候影响恶化，找到公平有效的适应策略将变得越来越紧迫。' },
      ],
    },
    // ---------- 考研 2025-2026 真题 ----------
    {
      id: 'kaoyan-2025-sectionA1',
      title: '考研英语一 2025年 Section A 对话 文献阅读方法',
      source: '考研真题',
      level: 'C1',
      wordCount: 290,
      sentenceCount: 14,
      duration: '02:18',
      sentences: [
        { en: 'W: Professor, I am drowning in papers for my literature review.', cn: '女：教授，我快被文献综述的论文淹没了。' },
        { en: 'There are hundreds of articles on my topic, and I cannot possibly read them all.', cn: '关于我的主题有数百篇文章，我不可能全部读完。' },
        { en: 'M: That is a common challenge. The key is to read strategically, not comprehensively.', cn: '男：这是一个常见的挑战。关键是有策略地阅读，而不是全面阅读。' },
        { en: 'W: What do you mean by strategically?', cn: '女：你说的有策略是什么意思？' },
        { en: 'M: Start by identifying the most important papers in your field.', cn: '男：首先确定你所在领域最重要的论文。' },
        { en: 'Look for highly cited works and recent review articles that summarize the field.', cn: '找高被引的著作和总结该领域的最新综述文章。' },
        { en: 'Those will give you a good overview without having to read everything.', cn: '这些会给你一个很好的概览，而不必阅读所有内容。' },
        { en: 'W: And once I have the overview?', cn: '女：那有了概览之后呢？' },
        { en: 'M: Then you can dive deeper into specific papers that are most relevant to your research question.', cn: '男：然后你可以深入阅读与你的研究问题最相关的特定论文。' },
        { en: 'For each paper, read the abstract and conclusion first.', cn: '对于每篇论文，先读摘要和结论。' },
        { en: 'If it still seems relevant, read the introduction and skim the methodology and results.', cn: '如果仍然相关，再读引言，浏览方法和结果部分。' },
        { en: 'Only read the whole paper carefully if it is truly central to your work.', cn: '只有当论文真正对你的工作至关重要时，才仔细阅读全文。' },
        { en: 'W: That makes sense. I have been trying to read every paper from start to finish.', cn: '女：有道理。我一直试图从头到尾读每一篇论文。' },
        { en: 'M: That would take forever. Smart reading is about knowing what to skip.', cn: '男：那永远读不完。聪明的阅读在于知道什么可以跳过。' },
      ],
    },
    {
      id: 'kaoyan-2025-sectionB1',
      title: '考研英语一 2025年 Section B 短文 自由意志之争',
      source: '考研真题',
      level: 'C1',
      wordCount: 305,
      sentenceCount: 12,
      duration: '02:25',
      sentences: [
        { en: 'The question of free will has puzzled philosophers and scientists for millennia.', cn: '自由意志的问题困扰了哲学家和科学家数千年。' },
        { en: 'Do we truly make choices freely, or are our decisions determined by prior causes?', cn: '我们真的能自由地做出选择吗，还是我们的决定由先前的原因决定？' },
        { en: 'The traditional philosophical debate pits determinism against libertarian free will.', cn: '传统的哲学辩论将决定论与自由主义自由意志对立起来。' },
        { en: 'Determinists argue that every event, including human decisions, has a sufficient cause.', cn: '决定论者认为，每一个事件，包括人类的决定，都有充分的原因。' },
        { en: 'Given the state of the universe and the laws of nature, only one future is possible.', cn: '给定宇宙的状态和自然法则，只有一种未来是可能的。' },
        { en: 'Libertarians counter that humans have a special capacity for free choice that transcends physical causation.', cn: '自由主义者反驳说，人类有一种超越物理因果的特殊自由选择能力。' },
        { en: 'Compatibilists take a middle position, arguing that free will and determinism can coexist.', cn: '兼容论者采取中间立场，认为自由意志和决定论可以共存。' },
        { en: 'They redefine free will as acting in accordance with one own desires and reasons.', cn: '他们将自由意志重新定义为按照自己的欲望和理性行事。' },
        { en: 'Even if those desires are determined, the choice is still free in the sense that matters.', cn: '即使这些欲望是被决定的，选择在重要的意义上仍然是自由的。' },
        { en: 'Neuroscience has added a new dimension to the debate with experiments suggesting decisions are made unconsciously before we become aware of them.', cn: '神经科学为这场辩论增加了新的维度，实验表明，在我们意识到之前，决定就已经无意识地做出了。' },
        { en: 'While these findings are provocative, their interpretation remains controversial.', cn: '虽然这些发现很有煽动性，但它们的解释仍然存在争议。' },
        { en: 'The free will debate shows no signs of being resolved anytime soon.', cn: '自由意志的辩论没有迹象表明会很快得到解决。' },
      ],
    },
    {
      id: 'kaoyan-2025-sectionC1',
      title: '考研英语一 2025年 Section C 讲座 后真相时代',
      source: '考研真题',
      level: 'C2',
      wordCount: 325,
      sentenceCount: 13,
      duration: '02:32',
      sentences: [
        { en: 'The term post-truth was named Word of the Year in 2016, reflecting a growing concern about the state of public discourse.', cn: '"后真相"一词被评为2016年度词汇，反映了人们对公共话语状态日益增长的担忧。' },
        { en: 'In a post-truth world, objective facts are less influential than appeals to emotion and personal belief.', cn: '在后真相世界中，客观事实的影响力不如对情感和个人信仰的诉求。' },
        { en: 'People increasingly live in information bubbles where they encounter only views that confirm their existing beliefs.', cn: '人们越来越多地生活在信息泡沫中，在那里他们只遇到能证实自己已有信念的观点。' },
        { en: 'Social media algorithms reinforce this by showing us content we are likely to agree with.', cn: '社交媒体算法通过向我们展示我们可能同意的内容来强化这一点。' },
        { en: 'This creates echo chambers where misinformation can spread unchallenged.', cn: '这创造了回音室，错误信息可以在其中不受质疑地传播。' },
        { en: 'The consequences are profound: declining trust in institutions, polarization, and an inability to agree on basic facts.', cn: '后果是深远的：对机构的信任下降、两极分化、以及无法就基本事实达成一致。' },
        { en: 'When people cannot agree on what is true, democratic deliberation becomes nearly impossible.', cn: '当人们无法就什么是真的达成一致时，民主审议变得几乎不可能。' },
        { en: 'Addressing this challenge requires action on multiple fronts.', cn: '应对这一挑战需要在多个方面采取行动。' },
        { en: 'Media literacy education can help people evaluate sources and identify misinformation.', cn: '媒体素养教育可以帮助人们评估信息来源并识别错误信息。' },
        { en: 'Platform companies need to take more responsibility for the content they amplify.', cn: '平台公司需要对它们放大的内容承担更多责任。' },
        { en: 'And we all need to cultivate intellectual humility and willingness to engage with opposing views.', cn: '我们都需要培养理智上的谦逊，以及与对立观点接触的意愿。' },
        { en: 'The health of our democracies may depend on whether we can rebuild a shared reality.', cn: '我们民主的健康可能取决于我们能否重建一个共同的现实。' },
        { en: 'This is perhaps the defining challenge of the information age.', cn: '这也许是信息时代的决定性挑战。' },
      ],
    },
    {
      id: 'kaoyan-2026-sectionA1',
      title: '考研英语一 2026年 Section A 对话 学术写作建议',
      source: '考研真题',
      level: 'C1',
      wordCount: 295,
      sentenceCount: 14,
      duration: '02:20',
      sentences: [
        { en: 'W: I got my paper back from the journal, and the reviewers said my writing is unclear.', cn: '女：我收到了期刊的退稿，审稿人说我的写作不清楚。' },
        { en: 'They want major revisions, but I am not sure how to improve the clarity.', cn: '他们要求重大修改，但我不知道如何提高清晰度。' },
        { en: 'M: That is a common issue, especially for early-career researchers.', cn: '男：这是一个常见问题，尤其是对于早期职业研究者。' },
        { en: 'Academic writing is a skill that takes practice to develop.', cn: '学术写作是一种需要练习才能发展的技能。' },
        { en: 'W: Do you have any specific suggestions?', cn: '女：你有什么具体的建议吗？' },
        { en: 'M: Start with the structure. Each paragraph should have one clear main point.', cn: '男：从结构开始。每一段应该有一个明确的要点。' },
        { en: 'State that point in the first sentence, then support it with evidence and reasoning.', cn: '在第一句中说明这个要点，然后用证据和推理来支持。' },
        { en: 'Also, pay attention to your sentence structure.', cn: '另外，注意你的句子结构。' },
        { en: 'Long, complex sentences are harder to follow. Mix in shorter sentences for clarity.', cn: '长而复杂的句子更难理解。混合使用短句以提高清晰度。' },
        { en: 'W: What about vocabulary? Should I use more technical terms?', cn: '女：词汇呢？我应该使用更多的技术术语吗？' },
        { en: 'M: Only when they are necessary and precise.', cn: '男：只在必要且精确的时候。' },
        { en: 'Do not use jargon just to sound academic—it usually has the opposite effect.', cn: '不要为了听起来学术而使用行话——通常会适得其反。' },
        { en: 'The best academic writing is clear and direct, not unnecessarily complex.', cn: '最好的学术写作是清晰直接的，而不是不必要的复杂。' },
        { en: 'W: That is helpful. I will revise with these principles in mind.', cn: '女：很有帮助。我会牢记这些原则来修改。' },
      ],
    },
    {
      id: 'kaoyan-2026-sectionB1',
      title: '考研英语一 2026年 Section B 短文 技术失业',
      source: '考研真题',
      level: 'C2',
      wordCount: 315,
      sentenceCount: 13,
      duration: '02:30',
      sentences: [
        { en: 'The fear that technology will destroy jobs is as old as the Industrial Revolution itself.', cn: '对技术会摧毁工作的恐惧与工业革命本身一样古老。' },
        { en: 'In the 19th century, Luddites destroyed textile machines they believed would take their livelihoods.', cn: '在19世纪，勒德分子摧毁了他们认为会夺走他们生计的纺织机器。' },
        { en: 'Yet history shows that technological change ultimately creates more jobs than it destroys.', cn: '然而历史表明，技术变革最终创造的就业岗位多于它摧毁的。' },
        { en: 'While some jobs disappear, new ones emerge that we could not have imagined before.', cn: '虽然一些工作消失了，但新的工作出现了，这是我们以前无法想象的。' },
        { en: 'But this time might be different, argue some economists.', cn: '但一些经济学家认为，这次可能有所不同。' },
        { en: 'Artificial intelligence and automation threaten not just manual labor but cognitive work as well.', cn: '人工智能和自动化不仅威胁体力劳动，也威胁认知工作。' },
        { en: 'Jobs that were once considered safe from automation—law, medicine, finance—now look vulnerable.', cn: '曾经被认为不会被自动化取代的工作——法律、医学、金融——现在看起来很脆弱。' },
        { en: 'If AI can perform increasingly sophisticated cognitive tasks, what will humans do?', cn: '如果AI能执行越来越复杂的认知任务，人类将做什么？' },
        { en: 'Optimists argue that new types of work will emerge, just as they always have.', cn: '乐观主义者认为，新型工作将会出现，就像以往一样。' },
        { en: 'Pessimists worry that this time the transition will be too fast and too disruptive.', cn: '悲观主义者担心，这次转型会太快、太具破坏性。' },
        { en: 'They propose policies like universal basic income to help people through the transition.', cn: '他们提出全民基本收入等政策，帮助人们度过转型期。' },
        { en: 'Whatever the outcome, the nature of work is likely to change dramatically in the coming decades.', cn: '无论结果如何，工作的本质在未来几十年可能会发生巨大变化。' },
        { en: 'Preparing for that change is one of the great challenges of our time.', cn: '为这一变化做好准备是我们这个时代的重大挑战之一。' },
      ],
    },
    {
      id: 'kaoyan-2026-sectionC1',
      title: '考研英语一 2026年 Section C 讲座 具身认知',
      source: '考研真题',
      level: 'C2',
      wordCount: 335,
      sentenceCount: 14,
      duration: '02:38',
      sentences: [
        { en: 'For centuries, Western thought has drawn a sharp distinction between mind and body.', cn: '几个世纪以来，西方思想在心灵与身体之间划出了鲜明的界限。' },
        { en: 'The mind was seen as rational, abstract, and separate from the physical world.', cn: '心灵被视为理性的、抽象的，与物理世界分离。' },
        { en: 'The body was merely a vessel that carried the mind around.', cn: '身体仅仅是承载心灵的容器。' },
        { en: 'But a growing field called embodied cognition challenges this traditional view.', cn: '但一个名为具身认知的新兴领域挑战了这一传统观点。' },
        { en: 'Embodied cognition argues that our bodies shape our minds in profound ways.', cn: '具身认知认为，我们的身体以深刻的方式塑造着我们的心灵。' },
        { en: 'Thinking is not something that happens only in the brain—it involves the whole body interacting with the environment.', cn: '思考不是只发生在大脑中的事情——它涉及整个身体与环境的互动。' },
        { en: 'Consider how we understand abstract concepts like time.', cn: '想想我们如何理解时间这样的抽象概念。' },
        { en: 'We talk about the future being ahead of us and the past being behind us.', cn: '我们说未来在我们"前面"，过去在我们"后面"。' },
        { en: 'These spatial metaphors are not just figures of speech—they reflect how we actually think about time.', cn: '这些空间隐喻不仅仅是修辞手法——它们反映了我们实际上如何思考时间。' },
        { en: 'Experiments show that people lean forward when thinking about the future and backward when thinking about the past.', cn: '实验表明，人们在思考未来时会向前倾，在思考过去时会向后倾。' },
        { en: 'Similarly, we understand warmth in terms of physical warmth and coldness.', cn: '同样，我们从身体的温暖和寒冷的角度来理解温暖。' },
        { en: 'Holding a warm cup of coffee makes people perceive others as warmer and friendlier.', cn: '拿着一杯热咖啡会让人们觉得他人更温暖、更友好。' },
        { en: 'These findings suggest that our abstract thinking is grounded in our physical experiences.', cn: '这些发现表明，我们的抽象思维植根于我们的身体体验。' },
        { en: 'The implications extend from education to artificial intelligence, fundamentally changing how we understand the mind.', cn: '其影响从教育延伸到人工智能，从根本上改变了我们对心灵的理解。' },
      ],
    },
  ];
`;

// 在听力代码前插入文章数据
content = content.replace('  // 听力阅读状态', articlesCode + '\n  // 听力阅读状态');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 听力阅读功能和第一批20篇文章已添加');
console.log('文件大小:', content.length, '字符');
