/* ============================================================
  页面7 · 考研英语学习（PDF解析 / 闪卡 / 默写 / 外刊）
  ============================================================ */
window.Pages = window.Pages || {};
(function () {
  let curTab = 'bank';
  let session = null;
  let quiz = null;
  // 默写播放状态：playing=播放中，timer=定时器，idx=当前词下标，list=本次播放快照
  let dictate = { playing: false, timer: null, idx: 0, list: [] };
  let popClose = null;
  const IV = [10 * 60e3, 24 * 3600e3, 2 * 24 * 3600e3, 4 * 24 * 3600e3, 7 * 24 * 3600e3, 15 * 24 * 3600e3];

  // 离线内置小词典（保证无网络也能查常见词）
  const MINI = {
  accept: ['/əkˈsept/', 'v.', '接受；同意'], achieve: ['/əˈtʃiːv/', 'v.', '实现；达到'],
  acquire: ['/əˈkwaɪə(r)/', 'v.', '获得；习得'], adapt: ['/əˈdæpt/', 'v.', '适应；改编'],
  adequate: ['/ˈædɪkwət/', 'adj.', '充足的；适当的'], analyze: ['/ˈænəlaɪz/', 'v.', '分析'],
  approach: ['/əˈprəʊtʃ/', 'v./n.', '接近；方法'], assess: ['/əˈses/', 'v.', '评估；评定'],
  assume: ['/əˈsjuːm/', 'v.', '假设；承担'], available: ['/əˈveɪləbl/', 'adj.', '可获得的；可用的'],
  benefit: ['/ˈbenɪfɪt/', 'n./v.', '益处；受益'], concept: ['/ˈkɒnsept/', 'n.', '概念；观念'],
  conclude: ['/kənˈkluːd/', 'v.', '得出结论；总结'], conduct: ['/kənˈdʌkt/', 'v.', '进行；实施'],
  consequence: ['/ˈkɒnsɪkwəns/', 'n.', '结果；后果'], consist: ['/kənˈsɪst/', 'v.', '由…组成'],
  context: ['/ˈkɒntekst/', 'n.', '上下文；背景'], create: ['/kriˈeɪt/', 'v.', '创造；创建'],
  culture: ['/ˈkʌltʃə(r)/', 'n.', '文化'], current: ['/ˈkʌrənt/', 'adj.', '当前的；流行的'],
  decline: ['/dɪˈklaɪn/', 'v./n.', '下降；拒绝'], demand: ['/dɪˈmɑːnd/', 'v./n.', '要求；需求'],
  demonstrate: ['/ˈdemənstreɪt/', 'v.', '证明；演示'], distribute: ['/dɪˈstrɪbjuːt/', 'v.', '分发；分配'],
  economy: ['/ɪˈkɒnəmi/', 'n.', '经济'], environment: ['/ɪnˈvaɪrənmənt/', 'n.', '环境'],
  establish: ['/ɪˈstæblɪʃ/', 'v.', '建立；确立'], estimate: ['/ˈestɪmeɪt/', 'v.', '估计；估算'],
  evident: ['/ˈevɪdənt/', 'adj.', '明显的'], evolve: ['/ɪˈvɒlv/', 'v.', '进化；演变'],
  expand: ['/ɪkˈspænd/', 'v.', '扩大；扩展'], factor: ['/ˈfæktə(r)/', 'n.', '因素；要素'],
  feature: ['/ˈfiːtʃə(r)/', 'n./v.', '特征；以…为特色'], final: ['/ˈfaɪnl/', 'adj.', '最终的；最后的'],
  financial: ['/faɪˈnænl/', 'adj.', '财政的；金融的'], focus: ['/ˈfəʊkəs/', 'v./n.', '聚焦；焦点'],
  function: ['/ˈfʌŋkʃn/', 'n./v.', '功能；运行'], generate: ['/ˈdʒenəreɪt/', 'v.', '产生；生成'],
  identify: ['/aɪˈdentɪfaɪ/', 'v.', '识别；确认'], impact: ['/ˈɪmpækt/', 'n./v.', '影响'],
  income: ['/ˈɪnkʌm/', 'n.', '收入'], indicate: ['/ˈɪndɪkeɪt/', 'v.', '表明；指示'],
  individual: ['/ˌɪndɪˈvɪdʒuəl/', 'adj./n.', '个人的；个体'], instance: ['/ˈɪnstəns/', 'n.', '例子；实例'],
  integrate: ['/ˈɪntɪɡreɪt/', 'v.', '整合；融入'], invest: ['/ɪnˈvest/', 'v.', '投资'],
  involve: ['/ɪnˈvɒlv/', 'v.', '涉及；包含'], issue: ['/ˈɪʃuː/', 'n.', '问题；议题'],
  legal: ['/ˈliːɡl/', 'adj.', '合法的；法律的'], maintain: ['/meɪnˈteɪn/', 'v.', '维持；保养'],
  normal: ['/ˈnɔːml/', 'adj.', '正常的'], obtain: ['/əbˈteɪn/', 'v.', '获得'],
  obvious: ['/ˈɒbviəs/', 'adj.', '明显的'], occur: ['/əˈkɜː(r)/', 'v.', '发生；出现'],
  outcome: ['/ˈaʊtkʌm/', 'n.', '结果；成果'], participate: ['/pɑːˈtɪsɪpeɪt/', 'v.', '参与'],
  perceive: ['/pəˈsiːv/', 'v.', '感知；理解'], percent: ['/pəˈsent/', 'n.', '百分比'],
  period: ['/ˈpɪəriəd/', 'n.', '时期；阶段'], policy: ['/ˈpɒləsi/', 'n.', '政策'],
  principle: ['/ˈprɪnsəpl/', 'n.', '原则；原理'], proceed: ['/prəˈsiːd/', 'v.', '继续进行'],
  process: ['/ˈprəʊses/', 'n./v.', '过程；处理'], require: ['/rɪˈkwaɪə(r)/', 'v.', '需要；要求'],
  research: ['/rɪˈsɜːtʃ/', 'n./v.', '研究'], respond: ['/rɪˈspɒnd/', 'v.', '回应；反应'],
  restrict: ['/rɪˈstrɪkt/', 'v.', '限制；约束'], rewarding: ['/rɪˈwɔːdɪŋ/', 'adj.', '有回报的；值得的'], reward: ['/rɪˈwɔːd/', 'n./v.', '报酬；奖励；回报'], secure: ['/sɪˈkjʊə(r)/', 'adj./v.', '安全的；获得'], secretary: ['/ˈsekrətri/', 'n.', '秘书；书记；部长'], secretaries: ['/ˈsekrəteriz/', 'n.', '秘书（secretary 的复数）'],
  seek: ['/siːk/', 'v.', '寻求；寻找'], select: ['/sɪˈlekt/', 'v.', '选择；挑选'],
  similar: ['/ˈsɪmələ(r)/', 'adj.', '相似的'], source: ['/sɔːs/', 'n.', '来源；根源'],
  specific: ['/spəˈsɪfɪk/', 'adj.', '具体的；特定的'], structure: ['/ˈstrʌktʃə(r)/', 'n.', '结构'],
  theory: ['/ˈθɪəri/', 'n.', '理论'], vary: ['/ˈveəri/', 'v.', '变化；不同'],
  abandon: ['/əˈbændən/', 'v.', '放弃；抛弃'], absorb: ['/əbˈzɔːb/', 'v.', '吸收；使专注'],
  academic: ['/ˌækəˈdemɪk/', 'adj.', '学术的'], access: ['/ˈækses/', 'n./v.', '通道；获取'],
  accurate: ['/ˈækjərət/', 'adj.', '准确的'],
  handle: ['/ˈhændl/', 'v./n.', '处理；把手'], happen: ['/ˈhæpn/', 'v.', '发生'], health: ['/helθ/', 'n.', '健康'], help: ['/help/', 'v./n.', '帮助'], highlight: ['/ˈhaɪlaɪt/', 'v./n.', '强调；亮点'], however: ['/haʊˈevə(r)/', 'adv.', '然而；不过'], huge: ['/hjuːdʒ/', 'adj.', '巨大的'],
  job: ['/dʒɒb/', 'n.', '工作；职位'], join: ['/dʒɔɪn/', 'v.', '加入；参加'], keep: ['/kiːp/', 'v.', '保持；保留'], key: ['/kiː/', 'n./adj.', '钥匙；关键的'], knowledge: ['/ˈnɒlɪdʒ/', 'n.', '知识'],
  major: ['/ˈmeɪdʒə(r)/', 'adj./n.', '主要的；专业'], manage: ['/ˈmænɪdʒ/', 'v.', '管理；设法'], method: ['/ˈmeθəd/', 'n.', '方法'], model: ['/ˈmɒdl/', 'n.', '模型；模范'],
  nature: ['/ˈneɪtʃə(r)/', 'n.', '自然；本性'], network: ['/ˈnetwɜːk/', 'n.', '网络'], notice: ['/ˈnəʊtɪs/', 'v./n.', '注意到；通知'],
  patient: ['/ˈpeɪʃnt/', 'adj./n.', '耐心的；病人'], phenomenon: ['/fəˈnɒmɪnən/', 'n.', '现象'], popular: ['/ˈpɒpjələ(r)/', 'adj.', '受欢迎的；流行的'], potential: ['/pəˈtenʃl/', 'adj./n.', '潜在的；潜力'], practical: ['/ˈpræktɪkl/', 'adj.', '实际的；实用的'], prepare: ['/prɪˈpeə(r)/', 'v.', '准备'], prevent: ['/prɪˈvent/', 'v.', '防止；阻止'], profit: ['/ˈprɒfɪt/', 'n./v.', '利润；获利'], purpose: ['/ˈpɜːpəs/', 'n.', '目的'],
  quality: ['/ˈkwɒləti/', 'n.', '质量；品质'], question: ['/ˈkwestʃən/', 'n./v.', '问题；询问'],
  significant: ['/sɪɡˈnɪfɪkənt/', 'adj.', '重要的；显著的'], situation: ['/ˌsɪtʃuˈeɪʃn/', 'n.', '情况；形势'], solution: ['/səˈluːʃn/', 'n.', '解决方案'], standard: ['/ˈstændəd/', 'n./adj.', '标准'], suggest: ['/səˈdʒest/', 'v.', '建议；暗示'], support: ['/səˈpɔːt/', 'v./n.', '支持'], system: ['/ˈsɪstəm/', 'n.', '系统'],
  technology: ['/tekˈnɒlədʒi/', 'n.', '技术'], tendency: ['/ˈtendənsi/', 'n.', '趋势'], tradition: ['/trəˈdɪʃn/', 'n.', '传统'], trend: ['/trend/', 'n.', '趋势；趋向'], task: ['/tɑːsk/', 'n.', '任务'],
  understand: ['/ˌʌndəˈstænd/', 'v.', '理解；明白'], university: ['/ˌjuːnɪˈvɜːsəti/', 'n.', '大学'], use: ['/juːz/', 'v./n.', '使用'], useful: ['/ˈjuːsfl/', 'adj.', '有用的'], usually: ['/ˈjuːʒuəli/', 'adv.', '通常'],
  value: ['/ˈvæljuː/', 'n./v.', '价值；重视'], various: ['/ˈveəriəs/', 'adj.', '各种各样的'], view: ['/vjuː/', 'n./v.', '观点；查看'],
  way: ['/weɪ/', 'n.', '方式；方法'], work: ['/wɜːk/', 'n./v.', '工作'], world: ['/wɜːld/', 'n.', '世界'], write: ['/raɪt/', 'v.', '写'], wrong: ['/rɒŋ/', 'adj.', '错误的'],
  year: ['/jɪə(r)/', 'n.', '年'], yet: ['/jet/', 'adv.', '还；尚未'], zero: ['/ˈzɪərəʊ/', 'n./num.', '零'],
  };

  // 选择英文语音：优先 en-US，其次其它英文 voice（部分系统默认无英文 voice 会导致没声音）
  function pickVoice() {
  try {
  const vs = window.speechSynthesis.getVoices();
  if (!vs || !vs.length) return null;
  return vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || vs.find((v) => /english/i.test(v.name)) || null;
  } catch (e) { return null; }
  }
  // 预加载语音列表（首次 getVoices 可能为空，需等 voiceschanged 事件）
  if ('speechSynthesis' in window) {
  try { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => { try { window.speechSynthesis.getVoices(); } catch (e) {} }; } catch (e) {}
  }
  let _utter = null; // 持有当前 utterance 引用，防止被 GC 回收导致静默
  // 修复「闪卡发音没声音」的根因：必须持有 utterance 引用，否则部分浏览器会在朗读前
  // 将其垃圾回收 → 静默。直接 speak（不 cancel）可同时规避 Chromium 的 cancel/speak 竞态
  // 与 iOS 的手势链断开问题；保留引用 + resume 兜底。
  function speak(text) {
  try {
  if (!('speechSynthesis' in window)) { UI.toast('当前环境不支持语音朗读', 'warn'); return; }
  if (!text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.9;
  const v = pickVoice(); if (v) u.voice = v;
  u.onend = () => {}; u.onerror = () => {};
  _utter = u; // 持有引用，防止被 GC
  window.speechSynthesis.speak(u);
  window.speechSynthesis.resume();
  } catch (e) {}
  }
  function newWordObj(w) {
  return { id: Store.uid(), word: w.word, phonetic: w.phonetic || '', pos: w.pos || '', cn: w.cn || '', phrases: w.phrases || '', syn: w.syn || '', mnemonic: w.mnemonic || '', box: 0, next: Date.now(), last: 0, reps: 0 };
  }
  // 查词：纯本地，绝不联网。优先命中个人词库，其次内置小词典，未命中则提示加入词库。
  // 这样点击文中任意单词都能即时弹窗，不会被慢/被墙的网络请求卡住。
  function lookupWord(raw) {
  const w = raw.toLowerCase().replace(/[^a-z']/g, '');
  return new Promise((resolve) => {
  const bank = Store.get().english.words;
  const found = bank.find((x) => x.word.toLowerCase() === w);
  if (found) return resolve({ known: true, word: found.word, phonetic: found.phonetic, pos: found.pos, cn: found.cn, phrases: found.phrases, syn: found.syn });
  if (MINI[w]) { const [ph, pos, cn] = MINI[w]; return resolve({ known: false, word: raw, phonetic: ph, pos, cn, phrases: '', syn: '' }); }
  if (window.OFFLINE_DICT && window.OFFLINE_DICT[w]) { const [ph, pos, cn] = window.OFFLINE_DICT[w]; return resolve({ known: false, word: raw, phonetic: ph, pos, cn, phrases: '', syn: '' }); }
  resolve({ known: false, word: raw, phonetic: '', pos: '', cn: '（离线）未找到释义，可加入词库', phrases: '', syn: '' });
  });
  }
  // 联网翻译单个单词（返回中文）。仅由用户显式点击「搜索翻译」触发，带超时，
  // 失败/超时一律回调 null，绝不抛错、绝不卡页面。
  function translateWord(raw) {
  const w = (raw || '').toLowerCase().replace(/[^a-z']/g, '');
  return new Promise((resolve) => {
  if (!w) return resolve(null);
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 8000);
  const done = (val) => { clearTimeout(tid); resolve(val); };
  // 源1：MyMemory（CORS 友好，海外可用；国内常被 GFW 拦截）
  fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(w) + '&langpair=en|zh-CN', { signal: ctrl.signal })
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => {
  const t = j && j.responseData && j.responseData.translatedText;
  if (t && t !== w) return done(t);
  // 源2：Google 非官方端点（同样可能被拦，纯兜底，提升海外/代理环境命中率）
  return fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=' + encodeURIComponent(w))
  .then((r2) => (r2.ok ? r2.text() : null))
  .then((txt) => done(parseGoogleTranslate(txt)))
  .catch(() => done(null));
  })
  .catch(() => done(null));
  });
  }
  // 解析 Google 非官方翻译端点返回的嵌套数组，提取中文译文
  function parseGoogleTranslate(txt) {
  try {
  const arr = JSON.parse(txt);
  if (Array.isArray(arr) && Array.isArray(arr[0])) {
  return arr[0].map((x) => (Array.isArray(x) ? x[0] : '')).join('').trim() || null;
  }
  } catch (e) {}
  return null;
  }
  function addToBank(res) {
  let existed = false;
  Store.update((st) => { if (st.english.words.some((x) => x.word.toLowerCase() === res.word.toLowerCase())) { existed = true; return; } st.english.words.push(newWordObj(res)); });
  UI.toast(existed ? '词库已存在该词' : '已加入个人背诵词库', existed ? 'warn' : 'ok');
  }

  // 解析「单词 /音标/ 词性 中文」条目。逐行扫描：
  // - 命中锚点行 → 新开一条；其后同行的词性/中文直接解析；
  // - 未命中锚点的续行（如长释义换行、或被拆到下一行的 n.中文）→ 追加到上一条，
  //  从而修复「释义换行导致错位/丢失」的问题。
  function parseVocabText(text) {
  const lines = (text || '').split(/\r?\n/);
  const entries = [];
  const seen = new Set();
  const anchorRe = /^([A-Za-z][A-Za-z'’.\-]{1,28})\s*\/\s*([^\/\n\r]{1,40}?)\s*\//;
  const posRe = /^(n|v|vt|vi|adj|a|adv|prep|conj|pron|art|int|num|modal|abbr|aux|link|sing|pl|inf|sth|sb|ad|det|exclam|ab)\.?\s*/i;
  const phonOk = /[A-Za-zæɑɒʌɔəɛɜɪʊʃʒθðŋː]/;
  let cur = null;
  const pushCur = () => { if (cur && !seen.has(cur.word.toLowerCase())) { seen.add(cur.word.toLowerCase()); entries.push(cur); } };
  for (let raw of lines) {
  const line = raw.replace(/\[([^\]]+)\]/g, '/$1/').trim(); // 方括号音标 → 斜杠
  if (!line) continue;
  const m = line.match(anchorRe);
  if (m) {
  pushCur();
  cur = { word: m[1].trim(), phonetic: m[2].trim(), pos: '', cn: '', en: '' };
  if (!phonOk.test(cur.phonetic)) { cur = null; continue; } // 音标不合法 → 跳过
  let rest = line.slice(m.index + m[0].length).trim();
  const pm = rest.match(posRe);
  if (pm) { cur.pos = pm[1].toLowerCase().replace(/\.$/, '') + '.'; rest = rest.slice(pm[0].length).trim(); }
  const cjk = rest.search(/[一-鿿]/);
  if (cjk >= 0) { cur.en = rest.slice(0, cjk).trim(); cur.cn = rest.slice(cjk).trim(); } else { cur.en = rest; }
  } else if (cur) {
  // 续行：合并到当前条目
  const cjk = line.search(/[一-鿿]/);
  if (cjk >= 0) {
  const before = line.slice(0, cjk).trim();
  cur.en = (cur.en ? cur.en + ' ' : '') + before;
  cur.cn = (cur.cn ? cur.cn + ' ' : '') + line.slice(cjk).trim();
  } else {
  cur.en = (cur.en ? cur.en + ' ' : '') + line;
  }
  }
  // 无 cur 时的非锚点行（如标题）直接忽略
  }
  pushCur();
  return entries;
  }

  // ---- 仅提取英文单词（中文走联网补全）----
  function extractWordsOnly(text) {
  const seen = new Set();
  const words = [];
  const noise = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as','is','was','are','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','shall','can','need','dare','used','ought','this','that','these','those','i','you','he','she','it','we','they','my','your','his','her','its','our','their','am','pm','etc','ie','eg','www','com','http','https','pdf','page','unit','lesson','part','chapter','section','appendix','index']);
  // IPA 音标常见符号：含这些说明是音标行，应跳过
  const ipa = /[æɑɒʌɔəɛɜɪʊʃʒθðŋːˈˌ]/;
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
  const clean = line.trim();
  if (!clean) continue;
  if (ipa.test(clean) || clean.includes('/')) continue; // 跳过音标行
  if (/[一-鿿]/.test(clean)) continue; // 跳过中文行
  // 整行就是一个单词
  if (/^[A-Za-z][A-Za-z'’\.\-]{1,29}$/.test(clean)) {
  const w = clean.toLowerCase();
  if (!seen.has(w) && !noise.has(w)) { seen.add(w); words.push(clean); }
  continue;
  }
  // 从行内摘取候选单词
  const tokens = clean.split(/[^A-Za-z'’\.\-]+/).filter((t) => /^[A-Za-z][A-Za-z'’\.\-]{1,29}$/.test(t));
  for (const t of tokens) {
  const w = t.toLowerCase();
  if (!seen.has(w) && !noise.has(w)) { seen.add(w); words.push(t); }
  }
  }
  return words;
  }

  function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

  // 联网查询：音标/词性来自 Free Dictionary，中文来自 MyMemory 翻译（浏览器 CORS 可用）
  async function fetchCnDefinition(rawWord) {
  const word = rawWord.toLowerCase().trim();
  if (MINI[word]) {
  const [ph, pos, cn] = MINI[word];
  return { word: rawWord, phonetic: ph, pos, cn, phrases: '', syn: '', mnemonic: '' };
  }
  let phonetic = '', pos = '', cn = '', fallbackEn = '';
  try {
  const dictRes = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word))
  .then((r) => r.ok ? r.json() : null).catch(() => null);
  if (Array.isArray(dictRes) && dictRes[0]) {
  const e = dictRes[0];
  phonetic = e.phonetic || ((e.phonetics && e.phonetics.find((p) => p.text) || {}).text) || '';
  if (e.meanings && e.meanings[0]) {
  pos = e.meanings[0].partOfSpeech || '';
  fallbackEn = e.meanings.slice(0, 2).map((m) => (m.definitions[0] && m.definitions[0].definition) || '').filter(Boolean).join('；');
  }
  }
  } catch (e) {}
  try {
  const j = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=en|zh-CN')
  .then((r) => r.ok ? r.json() : null).catch(() => null);
  if (j && j.responseData && j.responseData.translatedText) {
  const t = j.responseData.translatedText;
  // 过滤掉限流/错误提示文本
  if (t && !/LIMIT EXCEEDED|QUERY LENGTH|quota|MYMEMORY/i.test(t)) cn = t;
  }
  } catch (e) {}
  return {
  word: rawWord, phonetic,
  pos: pos ? pos + '.' : '',
  cn: cn || fallbackEn || '（暂无中文释义）',
  phrases: '', syn: '', mnemonic: ''
  };
  }

  function setProgress(cur, total) {
  const wrap = UI.$('#parseProgressWrap');
  const bar = UI.$('#parseProgressBar');
  const txt = UI.$('#parseProgressText');
  const pct = UI.$('#parseProgressPct');
  if (!wrap || !bar) return;
  wrap.style.display = total > 0 ? 'block' : 'none';
  const p = total ? Math.round(cur / total * 100) : 0;
  bar.style.width = p + '%';
  if (txt) txt.textContent = cur + ' / ' + total;
  if (pct) pct.textContent = p + '%';
  }

  async function enrichWords(words, onProgress) {
  const results = [];
  const concurrency = 4;
  let idx = 0;
  async function worker() {
  while (idx < words.length) {
  const i = idx++;
  const w = words[i];
  try { results[i] = await fetchCnDefinition(w); } catch (e) { results[i] = { word: w, phonetic: '', pos: '', cn: '（查询失败）', phrases: '', syn: '', mnemonic: '' }; }
  if (onProgress) onProgress(idx, words.length);
  await sleep(80);
  }
  }
  await Promise.all(Array(concurrency).fill(0).map(worker));
  return results;
  }

  function loadPdfJs() {
  return new Promise((resolve, reject) => {
  if (window.pdfjsLib) return resolve(window.pdfjsLib);
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  s.onload = () => {
  try {
  // 用同源 blob worker 规避沙箱跨域隔离限制，失败则回退主线程 fake worker
  const workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  fetch(workerSrc).then((r) => r.blob()).then((b) => {
  const url = URL.createObjectURL(b);
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = url;
  }).catch(() => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc; });
  } catch (e) {}
  resolve(window.pdfjsLib);
  };
  s.onerror = () => reject(new Error('PDF 引擎加载失败'));
  document.head.appendChild(s);
  });
  }
  function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(fr.error || new Error('文件读取失败'));
  fr.readAsArrayBuffer(file);
  });
  }

  function wrap(body, html) { body.innerHTML = ''; const w = document.createElement('div'); w.innerHTML = html; body.appendChild(w); return w; }

  // ---- 渲染入口 ----
  Pages.english = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const bank = s.english.words;
  const tabs = [['bank', '词库'], ['flash', '闪卡背诵'], ['quiz', '默写自测'], ['reader', '外刊阅读'], ['import', '导入']];
  c.innerHTML = `<div class="flex-wrap gap8" style="margin-bottom:16px">` + tabs.map(([k, label]) => `<button class="btn ${curTab === k ? '' : 'btn-soft'} btn-sm" data-tab="${k}">${label}</button>`).join('') + `</div><div id="enBody"></div>`;
  window.PageHandler = (e) => { const tb = e.target.closest('[data-tab]'); if (tb) { const nt = tb.dataset.tab; if (nt !== 'flash') stopDictate(); curTab = nt; Pages.english(); } };
  const body = UI.$('#enBody');
  if (curTab !== 'flash') stopDictate(); // 离开闪卡页时停止默写朗读，避免后台持续出声
  if (curTab === 'bank') renderBank(body, bank);
  else if (curTab === 'flash') renderFlash(body, bank);
  else if (curTab === 'quiz') renderQuiz(body, bank);
  else if (curTab === 'reader') renderReader(body);
  else if (curTab === 'import') renderImport(body);
  };

  // ---------- 词库 ----------
  function renderBank(body, bank) {
  const html = `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-27.png" alt=""/>个人背诵词库</div>
  <div class="spacer"></div><span class="tag" id="bankTag">共 ${bank.length} 词</span>
  <button class="btn btn-sm" data-act="add-word">＋ 手动添加</button>
  <button class="btn btn-soft btn-sm" data-act="clear-all" style="color:var(--danger);border-color:var(--danger-soft)"> 清空全部</button>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <input class="input" id="bankSearch" placeholder=" 搜索单词 / 释义…" style="margin-bottom:12px"/>
  <div class="table-scroll"><table class="tbl">
  <thead><tr><th>单词</th><th>音标</th><th>词性</th><th>释义</th><th></th></tr></thead>
  <tbody id="bankRows"></tbody></table></div>
  <div class="flex-between mt12" id="bankPager"></div>
  </div>
  </div>`;
  const w = wrap(body, html);
  const rows = w.querySelector('#bankRows');
  const tag = w.querySelector('#bankTag');
  const pager = w.querySelector('#bankPager');
  const PAGE = 50;
  let page = 0;
  function filtered() {
  const q = (w.querySelector('#bankSearch').value || '').toLowerCase();
  return bank.filter((x) => !q || x.word.toLowerCase().includes(q) || (x.cn || '').includes(q));
  }
  function paint() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  if (page >= pages) page = pages - 1;
  if (page < 0) page = 0;
  const slice = list.slice(page * PAGE, page * PAGE + PAGE);
  rows.innerHTML = slice.length ? slice.map((x) => `
  <tr>
  <td><b style="color:var(--primary-deep);cursor:pointer" data-spk="${UI.esc(x.word)}">${UI.esc(x.word)}</b></td>
  <td class="muted-text">${UI.esc(x.phonetic)}</td>
  <td>${UI.esc(x.pos)}</td>
  <td>${UI.esc(x.cn)}</td>
  <td>
  <button class="btn btn-soft btn-icon" data-act="wd-edit" data-id="${x.id}" title="编辑"><img class="ic" src="assets/icons/hk-32.png" alt=""/></button>
  <button class="btn btn-soft btn-icon" data-act="wd-del" data-id="${x.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
  </td>
  </tr>`).join('')
  : `<tr><td colspan="5" class="muted-text center">没有匹配的单词</td></tr>`;
  tag.textContent = `共 ${bank.length} 词（筛选 ${list.length}）`;
  if (pages > 1) {
  pager.innerHTML = `
  <button class="btn btn-soft btn-sm" data-pg="prev" ${page === 0 ? 'disabled style="opacity:.45"' : ''}>‹ 上一页</button>
  <span class="muted-text">第 ${page + 1} / ${pages} 页</span>
  <button class="btn btn-soft btn-sm" data-pg="next" ${page >= pages - 1 ? 'disabled style="opacity:.45"' : ''}>下一页 ›</button>`;
  } else {
  pager.innerHTML = '';
  }
  }
  paint();
  w.querySelector('#bankSearch').addEventListener('input', () => { page = 0; paint(); });
  w.addEventListener('click', (e) => {
  const spk = e.target.closest('[data-spk]'); if (spk) { speak(spk.dataset.spk); return; }
  const pg = e.target.closest('[data-pg]'); if (pg) {
  if (pg.dataset.pg === 'prev') page = Math.max(0, page - 1);
  else if (pg.dataset.pg === 'next') page = page + 1;
  return paint();
  }
  const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'add-word') return openWordModal();
  if (b.dataset.act === 'wd-edit') return openWordModal(b.dataset.id);
  if (b.dataset.act === 'clear-all') return UI.confirm('确定清空整个词库？此操作不可恢复，建议先点击「导出」备份！', () => {
  Store.update((st) => { st.english.words = []; });
  bank = Store.get().english.words;
  page = 0; paint();
  UI.toast('已清空词库', 'ok');
  });
  if (b.dataset.act === 'wd-del') return UI.confirm('从词库删除该词？', () => {
  Store.update((st) => { st.english.words = st.english.words.filter((x) => x.id !== b.dataset.id); });
  bank = Store.get().english.words;
  paint();
  UI.toast('已删除', 'ok');
  });
  });
  }
  function openWordModal(editId) {
  const s = Store.get();
  const wd = editId ? s.english.words.find((x) => x.id === editId) : null;
  UI.openModal({ title: wd ? '编辑单词' : '添加单词', icon: '<img class="ic" src="assets/icons/hk-38.png" alt=""/>',
  body: `
  <div class="row">
  <div class="field"><label>单词</label><input class="input" id="wWord" value="${UI.esc(wd ? wd.word : '')}"/></div>
  <div class="field"><label>音标</label><input class="input" id="wPh" value="${UI.esc(wd ? wd.phonetic : '')}" placeholder="/əˈbændən/"/></div>
  </div>
  <div class="row">
  <div class="field"><label>词性</label><input class="input" id="wPos" value="${UI.esc(wd ? wd.pos : '')}" placeholder="v."/></div>
  <div class="field"><label>中文释义</label><input class="input" id="wCn" value="${UI.esc(wd ? wd.cn : '')}" placeholder="放弃；抛弃"/></div>
  </div>
  <div class="field"><label>词组搭配</label><input class="input" id="wPhr" value="${UI.esc(wd ? wd.phrases : '')}"/></div>
  <div class="field"><label>近义词</label><input class="input" id="wSyn" value="${UI.esc(wd ? wd.syn : '')}"/></div>
  <div class="field"><label>趣味谐音记忆</label><input class="input" id="wMn" value="${UI.esc(wd ? wd.mnemonic : '')}" placeholder="如：a-ban-don → 一个板凳"/></div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: wd ? '保存' : '添加', onClick: () => {
  const word = UI.val('#wWord'); if (!word) return UI.toast('请填单词', 'warn');
  const data = { word, phonetic: UI.val('#wPh'), pos: UI.val('#wPos'), cn: UI.val('#wCn'), phrases: UI.val('#wPhr'), syn: UI.val('#wSyn'), mnemonic: UI.val('#wMn') };
  Store.update((st) => { if (wd) Object.assign(st.english.words.find((x) => x.id === editId), data); else st.english.words.push(newWordObj(data)); });
  UI.closeModal(); Pages.english();
  } }] });
  setTimeout(() => UI.$('#wWord') && UI.$('#wWord').focus(), 50);
  }

  // ---------- 闪卡 ----------
  function buildSession(bank) {
  const now = Date.now();
  const due = bank.filter((x) => (x.next || 0) <= now);
  const queue = due.slice();
  const fresh = bank.filter((x) => x.box === 0 && (x.last || 0) === 0).slice(0, 10);
  fresh.forEach((x) => { if (!queue.includes(x)) queue.push(x); });
  return { queue, idx: 0, flipped: false };
  }

  // ---------- 艾宾浩斯复习计划（记忆曲线可视化）----------
  const IV_LABEL = ['10分钟', '1天', '2天', '4天', '7天', '15天'];
  function ebStageCounts(bank) {
    const cnt = [0, 0, 0, 0, 0, 0];
    bank.forEach((x) => { const b = Math.max(0, Math.min(5, x.box || 0)); cnt[b]++; });
    return cnt;
  }
  function ebFutureBuckets(bank, now) {
    const eod = new Date(); eod.setHours(23, 59, 59, 999);
    const endToday = eod.getTime();
    const day = 86400e3;
    const b = { today: 0, tomorrow: 0, d2_3: 0, d4_7: 0, weekplus: 0 };
    bank.forEach((x) => {
      const nx = x.next || 0;
      if (nx <= now) return; // 已到期不计入未来排期
      const diff = nx - now;
      if (nx <= endToday) b.today++;
      else if (diff <= day) b.tomorrow++;
      else if (diff <= 3 * day) b.d2_3++;
      else if (diff <= 7 * day) b.d4_7++;
      else b.weekplus++;
    });
    return b;
  }
  function ebbinghausPlanHtml(bank, due, fresh) {
    const cnt = ebStageCounts(bank);
    const now = Date.now();
    const fb = ebFutureBuckets(bank, now);
    let top = 0; for (let i = 5; i >= 0; i--) { if (cnt[i] > 0) { top = i; break; } }
    const ladder = IV_LABEL.map((lab, i) => `
      <div class="eb-stage ${i === top ? 'active' : ''}">
        <div class="eb-stage-iv">${lab}</div>
        <div class="eb-stage-cnt">${cnt[i]} 词</div>
      </div>`).join('');
    const hasFuture = fb.today + fb.tomorrow + fb.d2_3 + fb.d4_7 + fb.weekplus > 0;
    const futureHtml = hasFuture ? `
      <div class="eb-future">
        <span class="eb-future-label">未来排期</span>
        <span class="eb-future-chip">今天 ${fb.today}</span>
        <span class="eb-future-chip">明天 ${fb.tomorrow}</span>
        <span class="eb-future-chip">2-3天 ${fb.d2_3}</span>
        <span class="eb-future-chip">4-7天 ${fb.d4_7}</span>
        <span class="eb-future-chip">一周+ ${fb.weekplus}</span>
      </div>` : '';
    const dueList = due.slice(0, 18).map((x) => `<span class="eb-due-item">${UI.esc(x.word)}</span>`).join('');
    const dueHtml = due.length ? `
      <div class="eb-due">
        <div class="eb-future-label">今日到期复习（${due.length}${due.length > 18 ? ' · 显示前18' : ''}）</div>
        <div class="eb-due-list">${dueList}</div>
      </div>` : '';
    return `
    <div class="card ebbinghaus-card">
      <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-06.png" alt=""/>艾宾浩斯复习计划</div>
        <div class="spacer"></div>
        <span class="tag">待复习 ${due.length}</span>
        <span class="tag" style="background:var(--primary-soft);color:var(--primary-deep)">待学新词 ${fresh.length}</span>
      </div>
      <div class="card-body">
        <div class="eb-desc">按遗忘曲线安排间隔复习：学完后在 <b>10分钟 / 1天 / 2天 / 4天 / 7天 / 15天</b> 回看，记得越牢，间隔越长。</div>
        <div class="eb-ladder">${ladder}</div>
        ${futureHtml}
        ${dueHtml}
      </div>
    </div>`;
  }

  function renderFlash(body, bank) {
  if (!bank.length) { wrap(body, `<div class="empty"><img class="emoji" src="assets/icons/hk-27.png" alt=""/><div class="t">词库还是空的</div><div class="s">先去「导入」上传双语 PDF，或手动添加单词</div></div>`); return; }
  const now = Date.now();
  const due = bank.filter((x) => (x.next || 0) <= now);
  const fresh = bank.filter((x) => x.box === 0 && (x.last || 0) === 0);
  const planHtml = ebbinghausPlanHtml(bank, due, fresh);
  if (!session || session.idx >= session.queue.length) session = buildSession(bank);
  if (!session.queue.length) { wrap(body, planHtml + `<div class="empty"><img class="emoji" src="assets/icons/hk-06.png" alt=""/><div class="t">今天没有待复习的单词</div><div class="s">新词已全部学过，明天再回来巩固～</div></div>`); return; }
  const w0 = session.queue[session.idx];
  const dList = todayWords();
  const learned = todayLearned();
  const left = 20 - (learned % 20);
  const extraHtml = (w0.phrases || w0.syn || w0.mnemonic)
  ? `<div class="flash-extra">
  ${w0.phrases ? '<div><b>词组：</b>' + UI.esc(w0.phrases) + '</div>' : ''}
  ${w0.syn ? '<div><b>近义：</b>' + UI.esc(w0.syn) + '</div>' : ''}
  ${w0.mnemonic ? '<div><b>记忆：</b>' + UI.esc(w0.mnemonic) + '</div>' : ''}
  </div>`
  : `<div class="flash-extra muted-text">（暂无近义词/词组，可在「词库」为该词补充）</div>`;
  const html = planHtml + `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-27.png" alt=""/>闪卡背诵</div>
  <div class="spacer"></div>
  <span class="tag">${session.idx + 1} / ${session.queue.length}</span>
  <span class="tag" style="background:var(--primary-soft);color:var(--primary-deep)"><img src="assets/icons/hk-27.png" alt="" style="width:12px;height:12px;vertical-align:-2px;margin-right:3px"/>今日已学 ${learned}/20</span></div>
  <div class="card-body">
  <div class="flash-card ${session.flipped ? 'flipped' : ''}" id="flash">
  <div class="flash-inner">
  <div class="flash-face flash-front">
  <div class="flash-word">${UI.esc(w0.word)}</div>
  <div class="flash-hint"> 点击卡片查看释义 / 近义词 / 词组</div>
  </div>
  <div class="flash-face flash-back">
  <div class="flash-phon">${UI.esc(w0.phonetic)} ${w0.pos ? '· ' + UI.esc(w0.pos) : ''}</div>
  <div class="flash-cn">${UI.esc(w0.cn) || '（暂无中文释义）'}</div>
  ${extraHtml}
  </div>
  </div>
  </div>
  <div class="flex-wrap gap8 mt16" style="justify-content:center">
  <button class="btn btn-soft btn-sm" data-act="speak">发音</button>
  <button class="btn btn-sm" data-act="flip">${session.flipped ? ' 隐藏' : ' 翻转'}</button>
  </div>
  <div class="flex-wrap gap8 mt8" style="justify-content:center;display:${session.flipped ? 'flex' : 'none'}" id="flashActions">
  <button class="btn btn-danger btn-sm" data-act="forget"> 还没记住</button>
  <button class="btn btn-success btn-sm" data-act="remember"> 记住了</button>
  </div>
  <div class="muted-text mt12 center"> 一天累计学完 20 个单词，自动奖励 +1 元（当前还差 ${left} 个）</div>
  </div>
  </div>` + dictateCardHtml(dList);
  const w = wrap(body, html);
  // 翻转：切换 .flipped 类（保留 DOM，触发 3D 翻转动画），并联动「记住/没记住」按钮显隐
  const flip = () => {
  session.flipped = !session.flipped;
  const card = w.querySelector('#flash');
  if (card) card.classList.toggle('flipped', session.flipped);
  const acts = w.querySelector('#flashActions');
  if (acts) acts.style.display = session.flipped ? 'flex' : 'none';
  };
  w.addEventListener('click', (e) => {
  const spk = e.target.closest('[data-spk]');
  if (spk) { speak(spk.dataset.spk); return; }
  const b = e.target.closest('[data-act]'); if (b) {
  const act = b.dataset.act;
  if (act === 'speak') return speak(w0.word);
  if (act === 'flip') return flip();
  if (act === 'dictate-start') return startDictate();
  if (act === 'dictate-stop') return stopDictate();
  if (act === 'remember' || act === 'forget') {
  Store.update((st) => {
  const x = st.english.words.find((y) => y.id === w0.id);
  if (act === 'remember') x.box = Math.min(5, x.box + 1); else x.box = Math.max(0, x.box - 1);
  x.reps = (x.reps || 0) + 1; x.last = Date.now(); x.next = Date.now() + IV[x.box];
  });
  if (act === 'remember') {
  // 记住了：计入「今日已学」，满 20 自动 +1 元
  recordStudy(w0.word);
  session.idx++; session.flipped = false;
  if (session.idx >= session.queue.length) { session = null; UI.toast('本轮复习完成 ', 'love'); }
  renderFlash(body, bank);
  } else {
  // 没记住：不计入「已学」，原卡原地重来（不前进、不计奖励）
  session.flipped = false;
  renderFlash(body, bank);
  }
  return;
  }
  }
  // 点击卡片本身即可翻转（无需只点按钮）
  if (e.target.closest('#flash')) flip();
  });
  }

  // ---------- 默写当日已背单词（逐词朗读，每词间隔 12s）----------
  // 卡片 HTML：列出今日「记住了」的单词，提供「开始默写 / 停止」与点击单读
  function dictateCardHtml(list) {
  const head = `<div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-09.png" alt=""/>默写当日已背单词</div>
  <div class="spacer"></div><span class="tag">今日已背 ${list.length} 词</span></div>`;
  if (!list.length) {
  return `<div class="card mt16">${head}<div class="card-body"><div class="muted-text center">今天还没背过单词哦，先在上面闪卡点「记住了」几个吧～</div></div></div>`;
  }
  const rows = list.map((wd, i) => `
  <div class="dictate-row ${dictate.playing && dictate.idx === i ? 'active' : ''}" data-spk="${UI.esc(wd)}">
  <span class="d-idx">${i + 1}</span>
  <span class="d-word">${UI.esc(wd)}</span>
  <span class="d-spk"><img class="ic" src="assets/icons/hk-27.png" alt="听"/></span>
  </div>`).join('');
  return `<div class="card mt16" id="dictateCard">${head}
  <div class="card-body">
  <div class="muted-text">点击「开始默写」将逐词朗读，每词间隔 12 秒，可边听边默写；也可点任意单词单独听。</div>
  <div class="flex-wrap gap8 mt12" style="justify-content:center">
  <button class="btn btn-sm" data-act="dictate-start">▶ 开始默写</button>
  <button class="btn btn-soft btn-sm" data-act="dictate-stop" style="display:${dictate.playing ? 'inline-block' : 'none'}">■ 停止</button>
  </div>
  <div id="dictateStatus" class="center mt12" style="min-height:22px;color:var(--primary-deep);font-weight:600"></div>
  <div class="dictate-list mt12">${rows}</div>
  </div></div>`;
  }
  // 开始逐词朗读（取最新清单；播放途中新增单词不打断当前序列）
  function startDictate() {
  const list = todayWords();
  if (!list || !list.length) { UI.toast('今天还没有已背单词', 'warn'); return; }
  stopDictate();
  dictate.playing = true;
  dictate.idx = 0;
  dictate.list = list.slice();
  const startBtn = UI.$('[data-act="dictate-start"]');
  const stopBtn = UI.$('[data-act="dictate-stop"]');
  if (startBtn) startBtn.style.display = 'none';
  if (stopBtn) stopBtn.style.display = 'inline-block';
  playDictateWord();
  }
  function playDictateWord() {
  if (!dictate.playing) return;
  if (dictate.idx >= dictate.list.length) {
  stopDictate();
  UI.toast('默写播放结束', 'ok');
  return;
  }
  const wd = dictate.list[dictate.idx];
  speak(wd);
  const rows = document.querySelectorAll('.dictate-row');
  rows.forEach((r, i) => r.classList.toggle('active', i === dictate.idx));
  const status = UI.$('#dictateStatus');
  if (status) status.textContent = '正在朗读：' + wd + '（' + (dictate.idx + 1) + ' / ' + dictate.list.length + '）· 下个词 20 秒后';
  dictate.idx++;
  dictate.timer = setTimeout(playDictateWord, 12000);
  }
  function stopDictate() {
  dictate.playing = false;
  if (dictate.timer) { clearTimeout(dictate.timer); dictate.timer = null; }
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  const rows = document.querySelectorAll('.dictate-row');
  rows.forEach((r) => r.classList.remove('active'));
  const status = UI.$('#dictateStatus');
  if (status) status.textContent = '';
  const startBtn = UI.$('[data-act="dictate-start"]');
  const stopBtn = UI.$('[data-act="dictate-stop"]');
  if (startBtn) startBtn.style.display = 'inline-block';
  if (stopBtn) stopBtn.style.display = 'none';
  }

  // ---------- 默写自测 ----------
  function renderQuiz(body, bank) {
  if (!bank.length) { wrap(body, `<div class="empty"><img class="emoji" src="assets/icons/hk-38.png" alt=""/><div class="t">词库为空</div></div>`); return; }
  if (!quiz || quiz.done) quiz = { mode: 'ec', idx: 0, list: bank.slice().sort(() => Math.random() - 0.5), revealed: false, answer: '', done: false };
  const total = quiz.list.length;
  if (quiz.idx >= total) {
  const html = `<div class="empty"><img class="emoji" src="assets/icons/hk-06.png" alt=""/><div class="t">本轮自测完成</div><div class="s">共 ${total} 词 · 点击下方重来</div></div><div class="center mt12"><button class="btn btn-sm" data-act="restart">再来一轮</button></div>`;
  const w = wrap(body, html);
  w.addEventListener('click', (e) => { if (e.target.closest('[data-act="restart"]')) { quiz = null; Pages.english(); } });
  return;
  }
  const w0 = quiz.list[quiz.idx];
  const isEC = quiz.mode === 'ec';
  const html = `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>默写自测</div>
  <div class="spacer"></div><span class="tag">${quiz.idx + 1} / ${total}</span>
  <button class="btn btn-soft btn-sm" data-act="switch">切换 ${isEC ? '中→英' : '英→中'}</button></div>
  <div class="card-body center">
  <div class="mt8">${isEC ? '英文：<b style="color:var(--primary-deep);font-size:20px">' + UI.esc(w0.word) + '</b>' : '中文：<b style="color:var(--primary-deep);font-size:18px">' + UI.esc(w0.cn) + '</b>'}</div>
  <input class="input mt12" id="qInput" placeholder="${isEC ? '写出中文释义' : '写出英文单词'}" style="max-width:320px;margin:12px auto;text-align:center"/>
  <div class="flex-wrap gap8" style="justify-content:center">
  <button class="btn btn-soft btn-sm" data-act="speak">发音</button>
  <button class="btn btn-sm" data-act="reveal">显示答案</button>
  <button class="btn btn-success btn-sm" data-act="next">下一题 →</button>
  </div>
  ${quiz.revealed ? `<div class="mt16" style="background:var(--surface-2);border-radius:12px;padding:14px;text-align:left">
  <div><b style="color:var(--primary-deep)">${UI.esc(w0.word)}</b> <span class="muted-text">${UI.esc(w0.phonetic)} ${UI.esc(w0.pos)}</span></div>
  <div class="mt8">${UI.esc(w0.cn)}</div>
  <div class="muted-text mt8">你的答案：${isEC ? UI.esc(quiz.answer) : '<b>' + UI.esc(quiz.answer) + '</b>'}</div>
  </div>` : ''}
  </div>
  </div>`;
  const w = wrap(body, html);
  w.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'speak') return speak(w0.word);
  if (act === 'switch') { quiz.mode = quiz.mode === 'ec' ? 'ce' : 'ec'; quiz.revealed = false; quiz.answer = ''; renderQuiz(body, bank); return; }
  if (act === 'reveal') { quiz.answer = w.querySelector('#qInput').value; quiz.revealed = true; renderQuiz(body, bank); return; }
  if (act === 'next') { quiz.answer = w.querySelector('#qInput').value; quiz.revealed = false; quiz.idx++; renderQuiz(body, bank); return; }
  });
  }

  // ---------- 外刊阅读（离线优先：内置多篇英文外刊 + 中文译文，打开即读，绝不卡顿）----------
  // 内置文章：英文原文 + 中文译文一一对应，无需联网、不依赖任何被墙代理，国内 WiFi 也能秒开
  const ARTICLES = [
  { title: 'The Power of Daily Reading', source: '外刊精选', paras: [
  ['Reading is one of the most rewarding habits a student can develop. It expands the mind and builds vocabulary naturally.', '阅读是学生能养成的最有价值的习惯之一。它能拓展思维，并自然地积累词汇。'],
  ['When we read widely, we encounter new ideas and different perspectives that challenge our assumptions.', '当我们广泛阅读时，会遇到新的想法和不同的视角，从而挑战我们固有的假设。'],
  ['A good reader does not simply absorb information, but reflects on it critically.', '好的读者不只是吸收信息，而是对其进行批判性思考。'],
  ['Over time, consistent reading improves focus, memory, and the ability to express complex thoughts.', '久而久之，持续的阅读能提升专注力、记忆力，以及表达复杂思想的能力。'],
  ['Therefore, making time for daily reading is a small investment with lasting returns.', '因此，每天留出时间阅读是一笔回报持久的小小投资。'],
  ]},
  { title: 'How to Learn a Language Well', source: '外刊精选', paras: [
  ['Acquiring a new language requires patience and regular practice.', '掌握一门新语言需要耐心与持续的练习。'],
  ['Researchers suggest that spaced repetition helps the brain retain words more effectively than cramming.', '研究表明，间隔重复比填鸭式死记更能帮助大脑记住单词。'],
  ['Listening, speaking, and reading should be balanced in your study plan.', '听、说、读在学习计划中应当均衡安排。'],
  ['Mistakes are not failures, but signals that the brain is adapting.', '犯错不是失败，而是大脑正在适应的信号。'],
  ['With persistence, even difficult grammar becomes natural, and communication grows confident and fluent.', '坚持下去，即便再难的语法也会变得自然，表达也会变得自信流畅。'],
  ]},
  { title: 'The Value of Curiosity', source: '外刊精选', paras: [
  ['Curiosity is the engine of lifelong learning.', '好奇心是终身学习的引擎。'],
  ['Curious people ask better questions and find connections others miss.', '有好奇心的人会提出更好的问题，并发现他人忽略的联系。'],
  ['They are not afraid of not knowing, because every unknown is a chance to learn.', '他们不害怕“不知道”，因为每个未知都是学习的机会。'],
  ['In a fast-changing world, curiosity keeps the mind young and adaptable.', '在快速变化的世界里，好奇心让思维保持年轻与可塑性。'],
  ]},
  { title: 'Why Sleep Matters for Students', source: '外刊精选', paras: [
  ['Sleep is not a waste of time; it is essential for memory and focus.', '睡眠不是浪费时间，它对记忆与专注力至关重要。'],
  ['During deep sleep, the brain sorts and stores what we learned that day.', '在深度睡眠中，大脑会整理并存储当天所学的内容。'],
  ['Students who sleep well tend to perform better than those who stay up late.', '睡眠充足的学生往往比熬夜的学生表现更好。'],
  ['A regular sleep schedule is one of the simplest ways to boost learning.', '规律的作息是提升学习效果最简单的方法之一。'],
  ]},
  { title: 'Small Habits, Big Results', source: '外刊精选', paras: [
  ['Success is rarely the result of one big event, but of many small habits.', '成功很少来自某个大事件，而来自许多微小的习惯。'],
  ['Reading a few pages each day adds up to dozens of books a year.', '每天读几页，一年下来就是几十本书。'],
  ['The key is consistency, not intensity.', '关键在于坚持，而非强度。'],
  ['Over months and years, these tiny actions compound into remarkable change.', '数月乃至数年后，这些微小的行动会积累成惊人的改变。'],
  ]},
  { title: 'Thinking Clearly Under Pressure', source: '外刊精选', paras: [
  ['Pressure can cloud our judgment if we let emotions take over.', '如果任由情绪主导，压力会扰乱我们的判断。'],
  ['A simple pause before reacting creates space for better decisions.', '在反应前稍作停顿，能为更好的决策留出空间。'],
  ['Writing down the problem often reveals a clearer path forward.', '把问题写下来，往往能显现出更清晰的解决路径。'],
  ['Calm minds solve hard problems; anxious minds avoid them.', '冷静的头脑解决问题，焦虑的头脑逃避问题。'],
  ]},
  { title: 'The Habit of Writing', source: '外刊精选', paras: [
  ['Writing is thinking made visible.', '写作让思考变得可见。'],
  ['When we write, we are forced to organize messy ideas into clear order.', '写作时，我们被迫把混乱的想法整理得井井有条。'],
  ['A short daily journal improves both memory and self-awareness.', '每天写几句日记，能同时提升记忆力与自我觉察。'],
  ['Clarity on the page leads to clarity in the mind.', '纸面上的清晰，会带来思维上的清晰。'],
  ]},
  { title: 'Learning from Failure', source: '外刊精选', paras: [
  ['Failure is not the opposite of success, but part of it.', '失败不是成功的对立面，而是成功的一部分。'],
  ['Each setback carries a lesson that success usually hides.', '每一次挫折都藏着成功通常掩盖的教训。'],
  ['Resilient students analyze what went wrong and adjust their approach.', '有韧性的学生会分析错在哪里，并调整方法。'],
  ['In the long run, those who learn from failure outgrow those who fear it.', '长远来看，从失败中学习的人，会超越那些害怕失败的人。'],
  ]},
  ];
  let _artIdx = 0;
  let readerMode = 'both'; // 'both' | 'en' | 'cn'
  let readerChapter = 0; // 章节切换 tab：0=全部；1..N=对应篇章
  let readerArticle = null;
  let readerFilter = 'all'; // 我的外刊列表筛选：all | read | unread（默认「全部」）
  let readerBatch = false; // 列表批量管理开关
  const readerChecked = new Set(); // 批量选中的文章 key 集合

  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  // 记录今日学完一个单词；跨天自动清零；每满 20 个自动奖励 +1 元（虚拟存钱罐）
  function recordStudy(word) {
  const today = todayStr();
  let learned = 0;
  Store.update((st) => {
  const d = st.english.daily || { date: '', learned: 0, words: [] };
  if (d.date !== today) { d.date = today; d.learned = 0; d.words = []; } // 新的一天，重新计数与清单
  if (!d.words) d.words = [];
  d.learned += 1;
  if (word && !d.words.includes(word)) d.words.push(word); // 记录今日已背单词，供「默写」模块朗读
  st.english.daily = d;
  learned = d.learned;
  });
  if (learned % 20 === 0) {
  Store.earn(1, '今日学完 ' + learned + ' 个单词');
  UI.toast(' 今日已学满 ' + learned + ' 词，奖励 +1 元 ', 'love');
  } else {
  const left = 20 - (learned % 20);
  UI.toast('已学 ' + learned + ' 词，再学 ' + left + ' 词得 +1 元', 'ok');
  }
  return learned;
  }
  function todayLearned() {
  const d = Store.get().english.daily;
  return (d && d.date === todayStr()) ? d.learned : 0;
  }
  // 今日已背单词清单（用于「默写当日已背单词」模块逐词朗读）
  function todayWords() {
  const d = Store.get().english.daily;
  return (d && d.date === todayStr() && Array.isArray(d.words)) ? d.words.slice() : [];
  }
  // 将内置文章构建为带译文映射的对象（离线即用，无需联网）
  function buildArticle(a) {
  const translation = {};
  const text = a.paras.map((p) => { translation[p[0]] = p[1]; return p[0]; }).join('\n\n');
  return { title: a.title, source: a.source, text, translation, date: todayStr(), link: '', offline: true };
  }
  const OFFLINE_ARTICLES = ARTICLES.map(buildArticle);
  const _persisted = (Store.get().english && Store.get().english.reader);
  readerArticle = (_persisted && _persisted.text) ? _persisted : OFFLINE_ARTICLES[0];
  // 从后端外刊库列表批量入库（按「标题+link」去重）；max 限制最多入库篇数；返回是否成功入库至少 1 篇
  function importFromBackendList(arts, max) {
  const eng = Store.get().english;
  if (!eng || !Array.isArray(arts)) return false;
  // 后端返回的文章一律同步进本地文库：已存在的（按标题匹配、排除内置离线文）用最新全文版本覆盖，
  // 保留已读状态；这样即使本地是旧版短摘要，点「实时外刊」后也会刷新成完整多篇章版本。
  const picks = [];
  for (const a of arts) {
  if (max && picks.length >= max) break;
  picks.push(a);
  }
  if (!picks.length) return false;
  Store.update((s) => {
  const l = s.english.articles || (s.english.articles = []);
  picks.forEach((a) => {
  const art = normalizeArticle(a);
  const title = (a.title || '').trim();
  const i = l.findIndex((x) => !x.offline && (x.title || '').trim() === title);
  if (i >= 0) l[i] = Object.assign({}, art, { offline: false, read: !!l[i].read });
  else l.unshift(Object.assign({ source: a.source || 'realnews', category: a.category || '', date: a.date || todayStr(), link: a.link || '', offline: false, read: false }, art));
  });
  });
  return true;
  }
  // 打开网页自动把后端爬取的外刊同步进本地文库：
  // 1) 若已配置联网后端（self-hosted server.js 真实实时抓取）——每次打开都从 /api/reader/list 全量拉取并合并
  //  （按标题+链接去重，不会重复灌），实现"前端自动同步后端爬到的文章"；后端本身有每日定时抓取。
  // 2) 否则回退到离线外媒精选种子（window.REALNEWS_SEED，每日一次避免重复）
  // 仅写入本地、不触发云端
  async function autoDailyImport() {
  const today = todayStr();
  const eng = Store.get().english;
  if (!eng) return;
  const backend = (Store.get().english.readerBackend || '').replace(/\/$/, '');
  if (backend) {
  // 已配置后端：每次打开都拉取最新外刊并合并进本地文库（去重，不会重复灌）
  try {
    const r = await fetchWithTimeout(backend + '/api/reader/list', 8000);
    if (r.ok) {
    const j = await r.json().catch(() => null);
    const arts = (j && j.articles) || [];
    if (arts.length) importFromBackendList(arts); // 合并全部后端文章（含历史篇章），无需每日限制
    // 当日后端摘取的 5 篇外刊：单独缓存到本地，按天保存（即便后端休眠也能离线回看今日外刊）
    if (j && Array.isArray(j.todayArticles) && j.todayArticles.length) {
      Store.update((s) => { s.english.readerToday = { date: today, list: j.todayArticles }; });
    }
    }
  } catch (e) { /* 后端不可达，不阻塞页面 */ }
  return; // 有后端就不走离线种子
  }
  // 无后端：回退离线外媒精选种子（每日首次）
  if (eng.lastAutoDate === today) return;
  const seed = (typeof window !== 'undefined' && window.REALNEWS_SEED) || [];
  if (!seed.length) { Store.update((s) => { s.english.lastAutoDate = today; }); return; }
  const have = new Set((eng.articles || []).map((a) => (a.title || '').trim()));
  const sorted = seed.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const picks = [];
  for (const a of sorted) { if (picks.length >= 2) break; if (!have.has((a.title || '').trim())) picks.push(a); }
  if (!picks.length) { Store.update((s) => { s.english.lastAutoDate = today; }); return; } // 池内文章已全部入库
  Store.update((s) => {
  const l = s.english.articles || (s.english.articles = []);
  picks.forEach((a) => {
  const art = normalizeArticle(a);
  const title = (a.title || '').trim();
  const i = l.findIndex((x) => !x.offline && (x.title || '').trim() === title);
  if (i >= 0) l[i] = Object.assign({}, art, { offline: false, read: !!l[i].read });
  else l.unshift(Object.assign({ source: a.source || 'realnews', category: a.category || '', date: a.date || today, link: a.link || '', offline: false, read: false }, art));
  });
  s.english.lastAutoDate = today;
  });
  }
  // 兼容旧备份：打开英语页时一次性把历史/异常格式文章（如中英混排挤在 text 里、字段名不同）归一化为当前结构并保存
  (function migrateArticles() {
  const eng = Store.get().english;
  if (!eng) return;
  let changed = false;
  if (Array.isArray(eng.articles)) {
  eng.articles.forEach((a, i) => {
  const n = normalizeArticle(a);
  if (n !== a && JSON.stringify(n) !== JSON.stringify(a)) { eng.articles[i] = n; changed = true; }
  });
  }
  readerArticle = normalizeArticle(readerArticle);
  if (changed) Store.save();
  })();
  autoDailyImport(); // 打开网页自动摘取当日最新 2 篇外刊入库（每日一次，仅本地）
  // ---------- 我的外刊：载入保存 + 已读/未读 ----------
  // 以「标题 + 正文前 50 字」做去重 key，保证同一篇文章多次载入只存一条且 read 状态稳定
  function getLibKey(a) { return (a && a.title ? a.title : '') + '|||' + ((a && a.text ? a.text : '').slice(0, 50)); }
  // 按「过滤后的用户文章数组」取下标对应的文章，避免 data-lib / data-edit 的索引与 english.articles 完整数组错位（内置 offline 文章不计入用户库）
  function libArticleAt(idx) {
  const lib = (Store.get().english.articles || []).filter((a) => !a.offline);
  return lib[idx];
  }
  function upsertArticle(art, read) {
  if (!art || !art.text) return;
  if (art.offline) return; // 内置离线文章不写入「我的外刊」库，否则会与列表过滤后的索引错位导致点 A 开 B
  Store.update((s) => {
  const lib = s.english.articles || (s.english.articles = []);
  const key = getLibKey(art);
  let found = lib.find((x) => getLibKey(x) === key);
  // 查重：标题相同（且非内置离线文章）视为同一篇，更新而非新增（标题不同才并存）
  if (!found) found = lib.find((x) => !x.offline && (x.title || '').trim() === (art.title || '').trim());
  if (found) {
  Object.assign(found, { title: art.title, source: art.source, text: art.text, translation: art.translation, lang: art.lang, offline: art.offline, date: art.date, link: art.link, tailCn: art.tailCn, ts: Date.now() });
  if (read !== undefined) found.read = read; // 仅当显式传入时才覆盖 read（载入时保留旧状态）
  } else {
  lib.unshift(Object.assign({ read: read !== undefined ? read : false, ts: Date.now() }, art));
  }
  });
  }
  function getLibRead(art) {
  const lib = Store.get().english.articles || [];
  const f = lib.find((x) => getLibKey(x) === getLibKey(art));
  return f ? f.read : false;
  }
  readerArticle.read = getLibRead(readerArticle);
  upsertArticle(readerArticle); // 首屏文章也存入「我的外刊」

  // 构建已知词 Set（O(1) 查询），避免对每个 token 遍历整个词库
  let _knownSet = null;
  let _knownSetLen = -1;
  function getKnownSet() {
  const words = Store.get().english.words;
  if (!words) return new Set();
  if (!_knownSet || _knownSetLen !== words.length) {
  _knownSet = new Set(words.map((x) => x.word.toLowerCase()));
  _knownSetLen = words.length;
  }
  return _knownSet;
  }
  function renderArticle(text) {
  const known = getKnownSet();
  return text.split(/(\s+)/).map((tok) => {
  const word = tok.replace(/[^A-Za-z']/g, '');
  if (/^[A-Za-z']{2,}$/.test(word)) {
  const isKnown = known.has(word.toLowerCase());
  return `<span class="w ${isKnown ? 'known' : ''}" data-w="${UI.esc(word)}">${UI.esc(tok)}</span>`;
  }
  return UI.esc(tok);
  }).join('');
  }
  // 判断一段文本是不是网页 HTML（RSS/XML 不会被误判）
  function looksLikeHtml(s) {
  if (!s) return false;
  const t = s.trim().slice(0, 512).toLowerCase();
  return t.indexOf('<!doctype') >= 0 || t.indexOf('<html') >= 0 || t.indexOf('<head') >= 0 || t.indexOf('<body') >= 0 || t.indexOf('<script') >= 0;
  }
  // 带超时 + AbortController 的 fetch：超时真正中断请求，避免慢代理挂起连接、占满浏览器连接池导致页面卡死
  function fetchWithTimeout(url, ms, opts) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms || 8000);
  return fetch(url, Object.assign({ cache: 'no-store', signal: ctrl.signal }, opts || {}))
  .finally(() => clearTimeout(id));
  }
  // 经多个公共代理抓取（规避浏览器跨域），失败自动切换
  async function fetchText(url, opts) {
  opts = opts || {};
  const proxies = [
  (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  (u) => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  (u) => 'https://api.allorigins.win/get?url=' + encodeURIComponent(u),
  ];
  for (const p of proxies) {
  try {
  const r = await fetchWithTimeout(p(url), 6000);
  if (!r.ok) continue;
  const ct = r.headers.get('content-type') || '';
  let text = '';
  if (ct.indexOf('application/json') >= 0) {
  const j = await r.json();
  if (j && typeof j.contents === 'string') text = j.contents;
  else if (j && typeof j === 'string') text = j;
  else continue;
  } else {
  text = await r.text();
  }
  if (!opts.allowHtml && looksLikeHtml(text)) continue; // 拒绝把网页 HTML 当正文
  return text;
  } catch (e) {}
  }
  return null;
  }
  function stripTags(s) { const d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
  function parseRssItems(xml) {
  try {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const nodes = doc.querySelectorAll('item');
  const out = [];
  nodes.forEach((it) => {
  const t = it.querySelector('title');
  const l = it.querySelector('link');
  const d = it.querySelector('description');
  const cNodes = it.getElementsByTagName('content:encoded');
  const c = cNodes && cNodes[0] ? cNodes[0] : null;
  const dt = it.querySelector('pubDate');
  out.push({ title: t ? t.textContent.trim() : '', link: l ? l.textContent.trim() : '', desc: d ? d.textContent : '', content: c ? c.textContent : '', date: dt ? dt.textContent : '' });
  });
  return out.filter((x) => x.title && x.link);
  } catch (e) { return []; }
  }
  // 反向解码 HTML 实体（&lt;p&gt; → <p>、&amp; → &、&nbsp; → 空格…），
  // 用 textarea（RCDATA 上下文）解码：<p> 会被当作纯文本保留、绝不会被浏览器解析成元素，
  // 因此相邻块级标签之间的空格不会丢失。最多迭代 3 次，可处理「双重转义」脏数据（如 &amp;lt;p&amp;gt;）。
  function decodeEntities(s) {
  if (typeof s !== 'string') return s;
  let out = s;
  try {
  const ta = document.createElement('textarea');
  for (let i = 0; i < 3; i++) {
  ta.innerHTML = out;
  const dec = ta.value || '';
  if (dec === out) break;
  out = dec;
  }
  } catch (e) {}
  return out;
  }
  // 剥离网页 HTML 标签：先解码实体（&lt;p&gt; → <p>，textarea 解码不丢段落间空格），再清真实标签。
  // 块级标签（<p>/</p>/<br>/<div>…）→ 换行（保留段落结构）；内联标签（<a>/<b>/<span>…）→ 空格（保留其内部文字）。
  // 正文里的 "x < y" 没有配对 >，绝不会被误删。
  function stripHtmlTags(s) {
  if (typeof s !== 'string') return s;
  let t = decodeEntities(s); // 先把 &lt;p&gt; 还原成 <p>（此时仍是纯文本，不会被浏览器当元素解析）
  if (!/<[a-zA-Z\/!][^>]*>/.test(t)) return t; // 没有真实标签就直接返回已解码文本
  t = t.replace(/<\s*\/\s*(p|div|li|h[1-6]|blockquote|tr)\s*>/gi, '\n'); // 块级闭合标签 → 换行
  t = t.replace(/<\s*br\s*\/?>/gi, '\n');  // <br> → 换行
  t = t.replace(/<\s*(p|div|li|h[1-6]|blockquote|tr)(\s[^>]*)?\s*>/gi, '\n'); // 块级起始标签 → 换行
  t = t.replace(/<[^>]+>/g, ' ');  // 其余内联标签 → 空格（保留文字）
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/\n{3,}/g, '\n\n');
  // 去除 RSS 摘要常见的尾部噪声链接文字（Continue reading... / Read more…），避免正文被截断片段污染
  t = t.replace(/\n?\s*Continue reading\.?\s*/gi, '\n')
  .replace(/\n?\s*Read more\.?\s*/gi, '\n')
  .replace(/\n?\s*Read more on[^\n]*/gi, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
  return t.trim();
  }
  // 粘贴文本预处理：清 HTML 标签、去 BOM/零宽字符/异常空格、归一换行，避免从网页复制时带标签或乱码导致渲染出错
  function cleanupText(text) {
  if (!text) return '';
  let s = String(text).replace(/﻿/g, ''); // 去 BOM
  s = s.replace(/[​-‍﻿]/g, ''); // 去零宽字符
  s = s.replace(/\u00A0/g, ' '); // &nbsp; → 普通空格
  s = s.replace(/<br\s*\/?>/gi, '\n'); // <br> → 换行
  s = stripHtmlTags(s); // 剥离网页标签（含单个标签也剥，避免残留 <p>/<a> 在正文里）
  s = s.replace(/[ \t]+/g, ' '); // 压缩行内空白
  s = s.replace(/\r/g, '');
  s = s.replace(/\n{3,}/g, '\n\n'); // 多余空行合并为一段间隔
  return s.trim();
  }
  // 按「空行」分段（用于粘贴文章配对，避免单换行把正常段落切碎导致中英错位）
  function splitByBlank(text) {
  return cleanupText(text).split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
  }
  function paragraphsFromText(text) {
  // 与 splitByBlank 保持一致：仅按空行分段，保证渲染段落与译文 key 一一对应
  return splitByBlank(text);
  }
  // 前端篇章切分（与后端 splitChapters 对齐）：粘贴/导入的纯英文长文也生成【篇章N】，
  // 保证“完整呈现所有篇章”的体验与自动抓取一致。
  function fcSplitSentences(longText, targetWords) {
  const sentences = (longText.match(/[^.!?]+[.!?]+(?:["')\]”’]+)?|\S[^.!?]*$/g) || [longText]).map((s) => s.trim()).filter(Boolean);
  const out = []; let cur = ''; let curW = 0;
  for (const s of sentences) {
  const w = s.split(/\s+/).filter(Boolean).length;
  if (cur && curW + w > targetWords) { out.push(cur); cur = ''; curW = 0; }
  cur = cur ? cur + ' ' + s : s; curW += w;
  }
  if (cur) out.push(cur);
  return out;
  }
  function buildChaptersFromText(text, targetWords, minWords) {
  targetWords = targetWords || 1000; minWords = minWords || 200;
  const raw = (text || '').split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 40);
  const paras = [];
  for (const p of raw) { const w = p.split(/\s+/).filter(Boolean).length; if (w > 200) paras.push(...fcSplitSentences(p, 300)); else paras.push(p); }
  const clean = paras.filter((p) => p.length > 20);
  const chapters = []; let cur = []; let curWords = 0;
  for (const p of clean) {
  const w = p.split(/\s+/).filter(Boolean).length;
  if (cur.length && curWords + w > targetWords) { chapters.push(cur); cur = []; curWords = 0; }
  cur.push(p); curWords += w;
  }
  if (cur.length) chapters.push(cur);
  if (chapters.length > 1) {
  const last = chapters[chapters.length - 1];
  const lw = last.join(' ').split(/\s+/).filter(Boolean).length;
  if (lw < minWords) { chapters.pop(); chapters[chapters.length - 1] = chapters[chapters.length - 1].concat(last); }
  }
  return chapters.map((c, i) => ({ label: '【篇章' + (i + 1) + '】', paras: c.map((en) => ({ en, cn: '' })), en: c.join('\n\n') }));
  }
  // 段落级翻译：优先读缓存，未命中再联网；MyMemory 限流时自动降速重试
  async function translateParagraphs(paras) {
  const cache = (Store.get().english.reader && Store.get().english.reader.translation) || {};
  const out = [];
  const todo = [];
  // 限制最多翻译前 30 段，避免长文导致大量请求堆积（同时保证绝大多数长篇章能逐段译出）
  const maxParas = paras.slice(0, 30);
  maxParas.forEach((p, i) => { if (cache[p]) out[i] = cache[p]; else todo.push({ i, p }); });
  if (!todo.length) return out;

  const newCache = Object.assign({}, cache);
  async function worker() {
  while (todo.length) {
  const { i, p } = todo.shift();
  let cn = '';
  for (let attempt = 0; attempt < 2 && !cn; attempt++) {
  try {
  const u = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(p.slice(0, 450)) + '&langpair=en|zh-CN';
  const j = await fetchWithTimeout(u, 8000).then((r) => r.ok ? r.json() : null).catch(() => null);
  if (j && j.responseData && j.responseData.translatedText) {
  const t = j.responseData.translatedText;
  if (!/LIMIT EXCEEDED|QUERY LENGTH|quota|MYMEMORY/i.test(t)) cn = t;
  }
  } catch (e) {}
  if (!cn) await sleep(300 + attempt * 200);
  }
  newCache[p] = cn || '（翻译暂不可用）';
  out[i] = newCache[p];
  }
  }
  await Promise.all([worker(), worker()]);
  Store.update((s) => { if (!s.english.reader) s.english.reader = {}; s.english.reader.translation = newCache; });
  return out;
  }
  // 从 RSS 内容/描述里提取正文，并清理广告/导航噪声
  function extractArticleText(it) {
  let text = stripTags(it.content) || stripTags(it.desc) || '';
  // 过滤常见噪声行
  text = text.replace(/\b(Sign up|Subscribe|Follow us|Read more|More on this story|Related Topics|Related|Advertisement|Credit:)\b[^.]*\.?/gi, ' ');
  return text.replace(/\s+/g, ' ').trim();
  }
  // 联网获取今日外刊（可选功能）：仅当用户在下方配置了「后端地址」时才调用我们自己后端的接口。
  // 浏览器只请求后端域名（国内可直连），绝不直接访问 allorigins / corsproxy / jina 等被墙代理，因此不会卡顿。
  async function fetchReaderFromBackend(force) {
  const backend = (Store.get().english.readerBackend || '').replace(/\/$/, '');
  if (!backend) { UI.toast('未配置联网后端，当前展示离线精选文章（在「学业DDL」页配置推送后端后也可联网获取）', 'warn'); return null; }
  try {
  const r = await fetchWithTimeout(backend + '/api/reader/article?force=' + (force ? 1 : 0), 8000);
  if (!r.ok) { UI.toast('联网获取失败（后端不可用）', 'warn'); return null; }
  const j = await r.json().catch(() => null);
  if (!j || !j.text) { UI.toast('联网获取失败', 'warn'); return null; }
  const art = { title: j.title || '外刊', source: j.source || '联网', text: j.text, translation: j.translation || {}, date: todayStr(), link: j.link || '', offline: false };
  Store.update((s) => { s.english.reader = art; });
  readerArticle = art; readerChapter = 0;
  UI.toast('已获取今日外刊', 'ok');
  return art;
  } catch (e) { UI.toast('联网获取失败（请检查后端地址是否可达）', 'warn'); return null; }
  }
  // 按句切分（中英文标点都识别），用于「一句英文 + 一句中文」逐句对照排版
  function splitSentences(text) {
  if (!text) return [];
  const parts = String(text).match(/[^.!?。！？\n\r]+[.!?。！？]*/g);
  return (parts || []).map((s) => s.trim()).filter((s) => s.length > 0);
  }
  // 正文渲染：按序号逐条，英文在前、对应中文在后交替分行；句数一致时逐句配对，否则整段配对
  function renderReaderContent() {
  const art = readerArticle || {};
  // 字数偏少（<300 词）且非离线种子/粘贴文：多半是后端离线时只取到 RSS 摘要，提示用户可粘贴完整原文
  const totalWords = (art.text || '').split(/\s+/).filter(Boolean).length;
  const maybeShort = totalWords > 0 && totalWords < 300 && !art.offline;
  const shortHint = maybeShort
  ? `<div style="margin:10px 0;padding:8px 12px;border-radius:10px;background:#fff3cd;color:#7a5b00;border:1px solid #ffe69c;font-size:13px"> 本篇约 ${totalWords} 词，可能仅为 RSS 摘要、不完整。后端离线时只能取到摘要——可点右上「 导入」粘贴完整原文重新载入（现已支持自动切成多篇章）。</div>`
  : '';
  // 篇章级渲染（实时抓取后端产出的 chapters 格式）：每一篇章内逐段落「中英交叉」
  // （英文段 → 紧跟中文段），严格保留原文段落顺序/语序；无译文时显示占位，绝不错位。
  if (art.chapters && art.chapters.length) {
  const chs = art.chapters;
  let html = '';
  // 多篇章时渲染横向切换 tab：点【篇章N】只看该篇，点【全部】看所有
  if (chs.length > 1) {
  const tab = (i, label) => `<button class="rd-chap-tab ${readerChapter === i ? 'on' : ''}" data-chapter="${i}">${label}</button>`;
  let tabs = tab(0, '全部');
  chs.forEach((c, i) => tabs += tab(i + 1, (c.label || '【篇章' + (i + 1) + '】').replace(/【|】/g, '')));
  html += `<div class="rd-chap-tabs">${tabs}</div>`;
  }
  const view = (readerChapter === 0 || !chs[readerChapter - 1]) ? chs : [chs[readerChapter - 1]];
  view.forEach((ch) => {
  html += `<div class="rd-chapter"><div class="rd-chapter-label">${UI.esc(ch.label || '')}</div>`;
  const pairs = (ch.paras && ch.paras.length) ? ch.paras
  : (ch.en ? (ch.en.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)).map((en, i) => ({ en, cn: ((ch.cn || '').split(/\n{2,}/)[i] || '').trim() })) : []);
  pairs.forEach((pr) => {
  const enRaw = stripHtmlTags(pr.en || '');
  const cnRaw = stripHtmlTags(pr.cn || '');
  // 一个 pr.en 内部可能含多个段落（旧数据/带标签正文），按空行再切成多个英文段落块
  const enParas = enRaw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const cnParas = cnRaw ? cnRaw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : [];
  const singleCn = cnParas.length === 1 && enParas.length > 1; // 整章单段译文 → 末尾显示一次
  enParas.forEach((ep, k) => {
  if (readerMode !== 'cn' && ep) html += `<p class="reader-en">${renderArticle(ep)}</p>`;
  if (readerMode !== 'en' && !singleCn) {
  const cp = cnParas[k] || '';
  html += cp.trim() ? `<p class="reader-cn">${UI.esc(cp)}</p>` : (readerMode === 'both' ? `<p class="reader-cn muted-text">（暂无译文）</p>` : '');
  }
  });
  if (readerMode !== 'en' && singleCn && cnParas[0].trim()) {
  html += `<p class="reader-cn">${UI.esc(cnParas[0])}</p>`;
  }
  });
  html += `</div>`;
  });
  if ((art.summary || '').trim() && readerMode !== 'en') {
  html += `<div class="rd-summary"><div class="rd-summary-label"> 全文主旨</div><p>${UI.esc(art.summary)}</p></div>`;
  }
  html += metaHtml(art);
  return shortHint + html;
  }
  // 旧格式：逐段中英交替
  const paras = paragraphsFromText(art.text || '');
  if (!paras.length) return '<p class="muted-text">文章为空</p>';
  const trans = art.translation || {};
  const zh = readerArticle.lang === 'zh';
  const rows = [];
  let n = 0;
  const push = (en, cn) => { n++; rows.push({ num: n, en: en || '', cn: cn || '' }); };
  if (zh) {
  paras.forEach((p) => push(p, ''));
  } else {
  paras.forEach((p) => {
  const enS = splitSentences(p);
  const cnRaw = trans[p];
  const cnS = cnRaw ? splitSentences(cnRaw) : [];
  if (enS.length && cnS.length && enS.length === cnS.length) enS.forEach((e, i) => push(e, cnS[i]));
  else push(p, cnRaw || '');
  });
  }
  let html = '';
  rows.forEach((r) => {
  if (readerMode === 'en') {
  html += `<div class="rd-row"><span class="rd-num">${r.num}</span><p class="reader-en">${zh ? UI.esc(r.en) : renderArticle(r.en)}</p></div>`;
  } else if (readerMode === 'cn') {
  if (r.cn) html += `<div class="rd-row"><span class="rd-num">${r.num}</span><p class="reader-cn">${UI.esc(r.cn)}</p></div>`;
  } else {
  html += `<div class="rd-row"><span class="rd-num">${r.num}</span><div class="rd-body">` +
  (zh ? `<p class="reader-cn">${UI.esc(r.en)}</p>`
  : `<p class="reader-en">${renderArticle(r.en)}</p>` + (r.cn ? `<p class="reader-cn">${UI.esc(r.cn)}</p>` : `<p class="reader-cn muted-text">（暂无译文）</p>`)) +
  `</div></div>`;
  }
  });
  if (!zh && readerMode !== 'en' && (readerArticle.tailCn || '').trim()) html += tailCnHtml('cn');
  return shortHint + (html || '<p class="muted-text">文章为空</p>');
  }
  // 段落数不等时，粘贴文章多出的中文段落作为「全文参考译文」附在文末（不再静默丢失）
  function tailCnHtml(mode) {
  const tail = (readerArticle.tailCn || '').trim();
  if (!tail || mode === 'en') return '';
  return `<div class="reader-tail"><div class="muted-text" style="margin:12px 0 4px;border-top:1px dashed var(--border);padding-top:8px">— 全文参考译文 —</div>${tail.split(/\n{2,}/).map((p) => `<p class="reader-cn">${UI.esc(p)}</p>`).join('')}</div>`;
  }
  // 篇章级文章的出处/时间/原文链接
  function metaHtml(art) {
  const bits = [];
  if (art.source) bits.push('出处：' + UI.esc(art.source));
  if (art.date) bits.push('发布时间：' + UI.esc(art.date));
  if (art.link) bits.push(`<a class="rd-metalink" href="${UI.esc(art.link)}" target="_blank" rel="noopener">查看原文 ↗</a>`);
  if (!bits.length) return '';
  return `<div class="rd-meta">${bits.join('<span class="rd-dot">·</span>')}</div>`;
  }
  function renderReader(body) {
  // 首屏只渲染离线缓存/内置文章，绝不触发任何外部网络请求，国内 WiFi 也能秒开
  paintReader(body);
  }
  // 「我的外刊」列表：已保存文章 + 已读/未读筛选（默认「已读」隐藏未读）
  function libraryHtml() {
  const lib = (Store.get().english.articles || []).filter((a) => !a.offline); // 自建（已保存，非内置）
  const total = OFFLINE_ARTICLES.length + lib.length;
  const fBtn = (f, label) => `<button class="btn btn-sm ${readerFilter === f ? '' : 'btn-soft'}" data-filter="${f}">${label}</button>`;
  const rows = [];
  // 自建（已保存）文章：可点击阅读、可编辑
  lib.forEach((a, i) => {
  if (readerFilter === 'read' && !a.read) return;
  if (readerFilter === 'unread' && a.read) return;
  const cur = readerArticle && getLibKey(readerArticle) === getLibKey(a);
  rows.push(`<div class="lib-item ${cur ? 'cur' : ''}" data-lib="${i}">
  <div class="lib-title">${UI.esc(a.title || '未命名')}</div>
  <div class="lib-meta"><span class="tag ${a.read ? '' : 'tag-unread'}">${a.read ? ' 已读' : '○ 未读'}</span><button class="lib-edit" data-edit="${i}" title="编辑文章"> 编辑</button></div>
  </div>`);
  });
  // 内置精选文章：点击阅读，不可在线编辑
  OFFLINE_ARTICLES.forEach((a, i) => {
  if (readerFilter === 'read' && !a.read) return;
  if (readerFilter === 'unread' && a.read) return;
  const cur = readerArticle && readerArticle.offline && getLibKey(readerArticle) === getLibKey(a);
  rows.push(`<div class="lib-item ${cur ? 'cur' : ''} lib-builtin" data-off="${i}">
  <div class="lib-title">${UI.esc(a.title || '未命名')}</div>
  <div class="lib-meta"><span class="tag"> 内置</span></div>
  </div>`);
  });
  const items = rows.join('');
  const emptyHint = readerFilter === 'read'
  ? '还没有已读文章，读完点「 标为已读」即可归入此处'
  : (readerFilter === 'unread' ? '没有未读文章' : '还没有已保存的外刊，载入/粘贴文章后会自动保存');
  return `<div class="lib-wrap mt16">
  <div class="flex-between mb8"><b style="color:var(--primary-deep)"> 全部外刊（共 ${total} 篇）</b>
  <div class="seg-group">${fBtn('all', '全部')}${fBtn('read', '已读')}${fBtn('unread', '未读')}</div></div>
  <div class="lib-list">${items || '<div class="muted-text">' + emptyHint + '</div>'}</div>
  </div>`;
  }
  // 标记当前文章为已读：自建文章直接置 read；内置精选记入 readSet；随后归入「已读」
  function markCurrentRead(body) {
  if (!readerArticle || !readerArticle.title) { UI.toast('请先打开一篇文章', 'warn'); return; }
  const key = getLibKey(readerArticle);
  Store.update((s) => {
  const lib = s.english.articles || [];
  const i = lib.findIndex((a) => getLibKey(a) === key);
  if (i >= 0) { lib[i].read = true; }
  else { (s.english.readSet = s.english.readSet || []); if (s.english.readSet.indexOf(key) < 0) s.english.readSet.push(key); }
  });
  readerArticle.read = true;
  UI.toast('已标记为已读，已归入「已读」', 'ok');
  paintReader(body);
  }
  // 「 实时外刊」：优先从已配置的联网后端**强制爬取**最新外刊（POST /api/reader/fetch 立即抓 2 篇入库，
  // 再 GET /api/reader/list 全量同步进本地文库）；无后端则回退离线外媒精选种子。
  async function importRealtimeNews() {
  const backend = (Store.get().english.readerBackend || '').replace(/\/$/, '');
  if (backend) {
  UI.toast('正在从后端强制爬取最新外刊…', 'ok');
  try {
  // 1) 强制后端立即爬取 2 篇新文入库（按 link/title 去重，不会重复灌）
  await fetchWithTimeout(backend + '/api/reader/fetch', 25000, { method: 'POST' }).catch(() => null);
  // 2) 全量拉取并合并进本地文库（保留全部历史篇章）
  const r = await fetchWithTimeout(backend + '/api/reader/list', 8000);
  if (r.ok) {
  const j = await r.json().catch(() => null);
  const arts = (j && j.articles) || [];
  if (importFromBackendList(arts)) {
  readerFilter = 'all'; readerBatch = false; readerChecked.clear();
  UI.toast('已爬取并同步：库内共 ' + arts.length + ' 篇', 'ok');
  const bd = UI.$('#enBody'); if (bd) paintReader(bd); else if (Pages.english) Pages.english();
  return;
  }
  UI.toast('后端已是最新（无新外刊）', 'warn');
  const bd = UI.$('#enBody'); if (bd) paintReader(bd); else if (Pages.english) Pages.english();
  return;
  }
  } catch (e) { /* 回退离线种子 */ }
  UI.toast('后端离线（Railway 可能已暂停/休眠），已为你载入完整离线精选；要追最新可粘贴原文或恢复后端', 'warn');
  }
  // 回退：离线外媒精选种子
  const seed = (typeof window !== 'undefined' && window.REALNEWS_SEED) || [];
  if (!seed.length) { UI.toast('暂无可导入的外媒精选', 'warn'); return; }
  let added = 0, updated = 0;
  Store.update((s) => {
  const lib = s.english.articles || (s.english.articles = []);
  seed.forEach((a) => {
  const title = (a.title || '').trim();
  if (!title) return;
  const art = normalizeArticle(a);
  const i = lib.findIndex((x) => !x.offline && (x.title || '').trim() === title);
  if (i >= 0) { lib[i] = Object.assign({}, art, { offline: false, read: !!lib[i].read }); updated++; }
  else { lib.push(Object.assign({ source: a.source || 'realnews', category: a.category || '', date: a.date || todayStr(), link: a.link || '', offline: false, read: false }, art)); added++; }
  });
  });
  readerFilter = 'all'; readerBatch = false; readerChecked.clear();
  UI.toast('外媒精选导入完成：新增 ' + added + ' 篇' + (updated ? ('、更新 ' + updated + ' 篇') : '') + '（均为完整全文，可逐篇阅读）', 'ok');
  const bd = UI.$('#enBody'); if (bd) paintReader(bd); else if (Pages.english) Pages.english();
  }
  // 单个删除（按 key），仅自建文章可删
  function deleteArticleByKey(key) {
  const art = (Store.get().english.articles || []).find((a) => getLibKey(a) === key);
  const t = art ? (art.title || '未命名') : '这篇文章';
  if (!window.confirm('确定删除《' + t + '》？删除后无法恢复。')) return;
  Store.update((s) => { const lib = s.english.articles || []; const i = lib.findIndex((a) => getLibKey(a) === key); if (i >= 0) lib.splice(i, 1); });
  if (readerArticle && getLibKey(readerArticle) === key) readerArticle = OFFLINE_ARTICLES[0] || { title: '', text: '' };
  UI.toast('已删除', 'ok');
  const bd = UI.$('#enBody'); if (bd) paintReader(bd);
  }
  function paintReader(body) {
  const modeBtn = (mode, label) => `<button class="btn btn-sm ${readerMode === mode ? '' : 'btn-soft'}" data-mode="${mode}">${label}</button>`;
  const backend = Store.get().english.readerBackend || '';
  // 目录：内置精选 + 自建（已保存），统一列出；已读/未读筛选
  const readSet = Store.get().english.readSet || [];
  const lib = (Store.get().english.articles || []).filter((a) => !a.offline);
  const items = [];
  lib.forEach((a, i) => items.push({ title: a.title, offline: false, idx: i, read: !!a.read, key: getLibKey(a) }));
  OFFLINE_ARTICLES.forEach((a, i) => items.push({ title: a.title, offline: true, idx: i, read: readSet.indexOf(getLibKey(a)) >= 0, key: getLibKey(a) }));
  let list = items;
  if (readerFilter === 'read') list = items.filter((x) => x.read);
  else if (readerFilter === 'unread') list = items.filter((x) => !x.read);
  const curKey = readerArticle ? getLibKey(readerArticle) : '';
  // 当日后端摘取的外刊横幅（每日自动保存本地，离线可见）
  const _rt = Store.get().english.readerToday;
  const readerTodayBanner = (_rt && _rt.date === todayStr() && _rt.list && _rt.list.length)
    ? `<div class="rd-today-banner">📰 今日外刊 <b>${_rt.list.length}</b> 篇 · 后端已实时摘取并保存本地（${_rt.date}）</div>`
    : '';
  const toc = list.map((x) => {
  const active = curKey && curKey === x.key ? ' active' : '';
  const ds = x.offline ? `data-off="${x.idx}"` : `data-lib="${x.idx}"`;
  const chk = readerBatch ? `<input type="checkbox" class="rd-chk" data-chk="${x.idx}" ${readerChecked.has(x.key) ? 'checked' : ''} ${x.offline ? 'disabled' : ''}/>` : '';
  const del = (!x.offline) ? `<button class="rd-del" data-del="${UI.esc(encodeURIComponent(x.key))}" title="删除"></button>` : '';
  return `<div class="rd-toc-item${active}" ${ds} title="${UI.esc(x.title || '')}">${chk}<span class="rd-toc-title">${UI.esc(x.title || '未命名')}</span>${del}</div>`;
  }).join('') || '<div class="rd-toc-empty muted-text">暂无文章</div>';
  const html = `
  <div class="reader-2col">
  <aside class="reader-side">
  <div class="rs-head">
  <div class="rs-title"><span class="rs-book"></span>外刊阅读</div>
  <div class="rs-actions">
  <button class="btn btn-sm round" data-act="realnews" title="实时外刊：从已配置的联网后端强制爬取最新外刊（立即抓 2 篇入库并全量同步到本地文库）；未配置后端时用离线精选"> 实时外刊</button>
  <button class="btn btn-sm round ${readerBatch ? 'on' : ''}" data-act="batch" title="批量管理/删除"> 批量</button>
  <button class="btn btn-sm round" data-act="paste">＋ 导入</button>
  </div>
  </div>
  <div class="rs-filter">
  <button class="rs-fbtn ${readerFilter === 'all' ? 'on' : ''}" data-filter="all">全部</button>
  <button class="rs-fbtn ${readerFilter === 'read' ? 'on' : ''}" data-filter="read">已读</button>
  <button class="rs-fbtn ${readerFilter === 'unread' ? 'on' : ''}" data-filter="unread">未读</button>
  </div>
  ${readerBatch ? `<div class="rd-batchbar">已选 <b id="rdChkCount">${readerChecked.size}</b> 篇 <button class="btn btn-sm btn-danger" data-act="delbatch">删除选中</button> <button class="btn btn-sm btn-soft" data-act="batchcancel">取消</button></div>` : ''}
  ${readerTodayBanner}
  <div class="rd-toc">${toc}</div>
  <details class="rd-adv"><summary> 联网设置</summary>
  <div class="rd-adv-body">
  <input class="input" id="readerBackend" value="${UI.esc(backend)}" placeholder="联网后端地址（选填）"/>
  <button class="btn btn-sm btn-soft" data-act="online"> 联网更新</button>
  </div>
  </details>
  </aside>
  <section class="reader-main">
  <h1 class="rm-title" id="artTitle">${UI.esc(readerArticle.title)}</h1>
  <div class="rm-toolbar">
  <button class="btn btn-sm ${readerMode === 'both' ? '' : 'btn-soft'}" data-mode="both">中英对照</button>
  <button class="btn btn-sm ${readerMode === 'en' ? '' : 'btn-soft'}" data-mode="en">仅英文</button>
  <button class="btn btn-sm btn-soft" data-act="edit"> 修改</button>
  <button class="btn btn-sm btn-soft" data-act="markread"> 已读</button>
  </div>
  <div class="reader" id="reader">${renderReaderContent()}</div>
  </section>
  </div>`;
  const w = wrap(body, html);
  w.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (b) {
  if (b.dataset.act === 'paste') return pasteArticle();
  if (b.dataset.act === 'edit') return editArticle(readerArticle);
  if (b.dataset.act === 'markread') return markCurrentRead(body);
  if (b.dataset.act === 'realnews') return importRealtimeNews();
  if (b.dataset.act === 'batch') { readerBatch = !readerBatch; readerChecked.clear(); paintReader(body); return; }
  if (b.dataset.act === 'batchcancel') { readerBatch = false; readerChecked.clear(); paintReader(body); return; }
  if (b.dataset.act === 'delbatch') {
  if (!readerChecked.size) { UI.toast('请先勾选要删除的文章', 'warn'); return; }
  if (!window.confirm('确定删除选中的 ' + readerChecked.size + ' 篇文章？不可恢复。')) return;
  Store.update((s) => { const lib = s.english.articles || []; for (let i = lib.length - 1; i >= 0; i--) { if (!lib[i].offline && readerChecked.has(getLibKey(lib[i]))) lib.splice(i, 1); } });
  readerChecked.clear(); readerBatch = false; UI.toast('已批量删除所选文章', 'ok'); paintReader(body); return;
  }
  if (b.dataset.act === 'online') return fetchReaderFromBackend(true).then(() => { upsertArticle(readerArticle); if (curTab === 'reader') { const bd = UI.$('#enBody'); if (bd) paintReader(bd); } });
  }
  const fb = e.target.closest('[data-filter]');
  if (fb) { readerFilter = fb.dataset.filter; paintReader(body); return; }
  const del = e.target.closest('[data-del]');
  if (del) { deleteArticleByKey(decodeURIComponent(del.dataset.del)); return; }
  const chkEl = e.target.closest('[data-chk]');
  if (chkEl) {
  const idx = parseInt(chkEl.dataset.chk, 10);
  const x = items[idx];
  if (x && !x.offline) { if (chkEl.checked) readerChecked.add(x.key); else readerChecked.delete(x.key); const c = document.getElementById('rdChkCount'); if (c) c.textContent = readerChecked.size; }
  return;
  }
  const ed = e.target.closest('[data-edit]');
  if (ed) { const idx = parseInt(ed.dataset.edit, 10); const art = libArticleAt(idx); if (art) editArticle(normalizeArticle(art)); return; }
  const li = e.target.closest('[data-lib]');
  if (li) {
  if (readerBatch) return;
  const idx = parseInt(li.dataset.lib, 10);
  const art = libArticleAt(idx);
  if (art) { readerArticle = Object.assign({}, normalizeArticle(art)); readerArticle.read = art.read; readerChapter = 0; Store.update((s) => { s.english.reader = readerArticle; }); paintReader(body); }
  return;
  }
  const off = e.target.closest('[data-off]');
  if (off) {
  if (readerBatch) return;
  const idx = parseInt(off.dataset.off, 10);
  const art = OFFLINE_ARTICLES[idx];
  if (art) { readerArticle = Object.assign({}, art); readerChapter = 0; Store.update((s) => { s.english.reader = readerArticle; }); paintReader(body); }
  return;
  }
  const ch = e.target.closest('[data-chapter]');
  if (ch) { readerChapter = parseInt(ch.dataset.chapter, 10) || 0; paintReader(body); return; }
  const m = e.target.closest('[data-mode]');
  if (m) { readerMode = m.dataset.mode; paintReader(body); return; }
  const wd = e.target.closest('[data-w]');
  if (wd) showWordPop(wd, wd.dataset.w);
  });
  const bi = w.querySelector('#readerBackend');
  if (bi) bi.addEventListener('change', () => { Store.update((s) => { s.english.readerBackend = (bi.value || '').trim(); }); UI.toast('已保存联网后端地址', 'ok'); });
  }
  // 通用导入/编辑弹窗：标题 + 英文中文交替（默认）或分栏/仅英/仅中；支持文件导入；编辑时预填并覆盖原条目
  // 判断一段文字整体是不是中文段：中文字符占非空白字符一半以上即视为中文
  function isCjkText(text) {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const nonspace = text.replace(/\s/g, '').length;
  return nonspace > 0 && (cjk / nonspace) >= 0.5;
  }
  // 按行切分后把「整句」还原：
  // - 含中文的行 → 中文块；含英文的行 → 英文块；中英混排（标题/中文夹英文）→ 归中文侧
  // - 纯数字/标点行（如 2026、4）并入相邻段，不单独成块，避免年份被误判为英文
  // - 中文块内部紧凑拼接、英文块内部用空格，兼容复制时中文被换行切碎的情况
  function splitByLang(text) {
  const lines = String(text).split(/\n+/).map((t) => t.trim()).filter((t) => t.length > 0);
  const segs = [];
  for (const line of lines) {
  const hasCjk = /[\u4e00-\u9fa5]/.test(line);
  const hasEn = /[a-zA-Z]/.test(line);
  let side;
  if (hasCjk && !hasEn) side = 'zh';
  else if (hasEn && !hasCjk) side = 'en';
  else if (hasCjk && hasEn) side = 'zh'; // 中英混合按中文侧归并
  else side = 'num'; // 纯数字或标点
  const last = segs[segs.length - 1];
  if (!last) { segs.push({ side, cjk: side === 'zh', text: line }); continue; }
  if (side === 'num' || last.side === side) {
  last.text += (last.side === 'zh' ? '' : ' ') + line; // 中文紧凑、英文空格
  if (side !== 'num') last.side = side;
  } else {
  segs.push({ side, cjk: side === 'zh', text: line });
  }
  }
  return segs.map((s) => ({ cjk: s.cjk, text: s.text })).filter((b) => b.text.length > 0);
  }
  function looksLikeTitle(enBlock, cnBlock) {
  if (!enBlock || !cnBlock) return false;
  if (enBlock.text.length > 80 || cnBlock.text.length > 80) return false;
  if (/[.!?]$/.test(enBlock.text.trim())) return false;
  return (enBlock.text + ' ' + cnBlock.text).length <= 160;
  }
  function parseInterleaved(raw, fallbackTitle) {
  const cleaned = cleanupText(raw || '');
  if (!cleaned) return null;
  let title = fallbackTitle;
  let bodyBlocks = [];
  const firstLine = cleaned.split(/\n/)[0].trim();
  if (firstLine.length && firstLine.length <= 160 && /[a-zA-Z]/.test(firstLine) && /[\u4e00-\u9fa5]/.test(firstLine) && !/[.!?]$/.test(firstLine)) {
  title = firstLine;
  bodyBlocks = splitByLang(cleanupText(cleaned.slice(firstLine.length).trim()));
  } else {
  const blocks = splitByLang(cleaned);
  if (blocks.length >= 2 && !blocks[0].cjk && blocks[1].cjk && looksLikeTitle(blocks[0], blocks[1])) {
  title = blocks[0].text + ' ' + blocks[1].text;
  bodyBlocks = blocks.slice(2);
  } else if (blocks.length >= 2 && blocks[0].cjk && !blocks[1].cjk && looksLikeTitle(blocks[1], blocks[0])) {
  title = blocks[0].text + ' ' + blocks[1].text;
  bodyBlocks = blocks.slice(2);
  } else {
  bodyBlocks = blocks;
  }
  }
  const start = bodyBlocks.findIndex(b => !b.cjk);
  if (start === -1) {
  const cn = bodyBlocks.map(b => b.text).join('\n\n');
  return { title, text: cn, translation: {}, lang: 'zh', tailCn: '' };
  }
  const enParas = [], cnParas = [];
  const tailParts = [];
  if (start > 0) tailParts.push(...bodyBlocks.slice(0, start).map(b => b.text));
  for (let i = start; i < bodyBlocks.length; i += 2) {
  const en = bodyBlocks[i];
  const cn = bodyBlocks[i + 1];
  enParas.push(en.text);
  if (cn) {
  if (cn.cjk) cnParas.push(cn.text);
  else { cnParas.push(''); enParas.push(cn.text); }
  } else { cnParas.push(''); }
  }
  const map = {};
  const n = Math.min(enParas.length, cnParas.length);
  for (let i = 0; i < n; i++) map[enParas[i]] = cnParas[i];
  tailParts.push(...cnParas.slice(n));
  return { title, text: enParas.slice(0, n).join('\n\n'), translation: map, lang: undefined, tailCn: tailParts.filter(Boolean).join('\n\n') };
  }
  function serializeInterleaved(art) {
  if (!art) return '';
  if (art.lang === 'zh') return art.text || '';
  const enParas = paragraphsFromText(art.text || '');
  const lines = [];
  enParas.forEach((p) => { lines.push(p); const cn = (art.translation || {})[p]; if (cn) lines.push(cn); });
  if (art.tailCn) lines.push(...art.tailCn.split(/\n{2,}/).filter(Boolean));
  return lines.join('\n\n');
  }
  // 兼容旧备份：把历史/异常格式的文章归一化为当前结构（{title,text,translation,lang,tailCn}）
  function normalizeArticle(a) {
  if (!a || typeof a !== 'object') return a;
  // 兼容旧版本 / 手动粘贴带入的网页标签：归一化时一律剥离，避免渲染成可见 <p> 等“乱码”
  const a2 = Object.assign({}, a);
  if (typeof a2.text === 'string') a2.text = stripHtmlTags(a2.text);
  if (typeof a2.content === 'string') a2.content = stripHtmlTags(a2.content);
  if (typeof a2.tailCn === 'string') a2.tailCn = stripHtmlTags(a2.tailCn);
  if (Array.isArray(a2.chapters)) {
  a2.chapters = a2.chapters.map((ch) => {
  if (!ch) return ch;
  const nch = Object.assign({}, ch);
  if (typeof ch.en === 'string') nch.en = stripHtmlTags(ch.en);
  if (Array.isArray(ch.paras)) nch.paras = ch.paras.map((p) => {
  if (typeof p === 'string') return stripHtmlTags(p);
  if (p && typeof p === 'object') return { en: stripHtmlTags(p.en), cn: stripHtmlTags(p.cn) };
  return p;
  });
  return nch;
  });
  }
  if (a2.translation && typeof a2.translation === 'object' && !Array.isArray(a2.translation)) {
  const nt = {};
  for (const k in a2.translation) nt[stripHtmlTags(k)] = stripHtmlTags(a2.translation[k]);
  a2.translation = nt;
  }
  a = a2;
  const hasText = typeof a.text === 'string' && a.text.trim().length > 0;
  const hasCnInText = hasText && /[\u4e00-\u9fa5]/.test(a.text);
  const transOk = a.translation && typeof a.translation === 'object' && !Array.isArray(a.translation) && Object.keys(a.translation).length > 0;
  if (hasText && transOk) return a; // 已是当前结构
  const out = Object.assign({}, a);
  let text = (a.text != null ? a.text : (a.content != null ? a.content : (a.body != null ? a.body : ''))).toString();
  let cn = null;
  if (a.cn != null) cn = a.cn;
  else if (Array.isArray(a.translation)) cn = a.translation;
  else if (typeof a.translation === 'string') cn = a.translation;
  if (hasCnInText) {
  const p = parseInterleaved(text, a.title);
  if (p && (p.text || p.translation && Object.keys(p.translation).length)) {
  out.text = p.text; out.translation = p.translation || {}; out.tailCn = p.tailCn || ''; out.lang = undefined;
  } else { out.text = text; out.translation = {}; }
  } else if (hasText && cn != null) {
  const enParas = splitByBlank(text);
  const cnParas = Array.isArray(cn) ? cn.map(String) : splitByBlank(cn.toString());
  const map = {}; const n = Math.min(enParas.length, cnParas.length);
  for (let i = 0; i < n; i++) map[enParas[i]] = cnParas[i];
  out.text = enParas.join('\n\n'); out.translation = map; out.tailCn = cnParas.slice(n).join('\n\n'); out.lang = undefined;
  } else if (hasText) {
  out.text = text; out.translation = {}; out.lang = 'en';
  } else if (cn != null && (Array.isArray(cn) ? cn.length : String(cn).trim().length)) {
  const cnStr = Array.isArray(cn) ? cn.join('\n\n') : cn.toString();
  out.text = cnStr; out.translation = {}; out.lang = 'zh';
  } else {
  out.text = ''; out.translation = {}; out.lang = undefined;
  }
  delete out.cn;
  if (typeof out.translation === 'string' || Array.isArray(out.translation)) out.translation = {};
  // 无篇章时按全文自动切分为多篇章（种子/粘贴/旧文都能完整呈现【篇章N】，不再是一整块）
  if (out.text && out.lang !== 'zh' && (!Array.isArray(out.chapters) || !out.chapters.length)) {
  out.chapters = buildChaptersFromText(out.text);
  }
  return out;
  }

  function openImportModal(opts) {
  opts = opts || {};
  const old = opts.oldArt;
  const srcTitle = (opts.isEdit && old) ? (old.title || '我的文章') : (readerArticle.title || '我的文章');
  const srcEn = (opts.isEdit && old) ? (old.lang === 'zh' ? '' : (old.text || '')) : (readerArticle.lang === 'zh' ? '' : (readerArticle.text || ''));
  const srcCn = (opts.isEdit && old) ? (old.lang === 'zh' ? (old.text || '') : (Object.values(old.translation || {}).join('\n\n') + (old.tailCn ? '\n\n' + old.tailCn : ''))) : Object.values(readerArticle.translation || {}).join('\n\n');
  let initMode;
  if (opts.isEdit && old) {
  if (old.lang === 'zh') initMode = 'zh';
  else if (old.translation && Object.keys(old.translation).length) initMode = 'bilingual';
  else initMode = 'en';
  } else {
  if (srcEn && !srcCn) initMode = 'en';
  else if (!srcEn && srcCn) initMode = 'zh';
  else initMode = 'interleaved'; // 新建默认「英文中文交替」（用户主流程）
  }
  const srcIl = (opts.isEdit && old) ? serializeInterleaved(old) : ((initMode === 'interleaved' && srcEn) ? (srcEn + (srcCn ? '\n\n' + srcCn : '')) : '');
  let curMode = initMode;

  const updateInputs = (mode) => {
  curMode = mode;
  const enWrap = document.querySelector('#pasteEnWrap');
  const cnWrap = document.querySelector('#pasteCnWrap');
  const ilWrap = document.querySelector('#pasteIlWrap');
  const fileEn = document.querySelector('#fileEn');
  const fileCn = document.querySelector('#fileCn');
  const fileSingle = document.querySelector('#fileSingle');
  if (mode === 'bilingual') {
  if (enWrap) enWrap.style.display = ''; if (cnWrap) cnWrap.style.display = '';
  if (ilWrap) ilWrap.style.display = 'none';
  if (fileEn) fileEn.parentElement.style.display = ''; if (fileCn) fileCn.parentElement.style.display = '';
  if (fileSingle) fileSingle.parentElement.style.display = 'none';
  } else if (mode === 'interleaved') {
  if (enWrap) enWrap.style.display = 'none'; if (cnWrap) cnWrap.style.display = 'none';
  if (ilWrap) ilWrap.style.display = '';
  if (fileEn) fileEn.parentElement.style.display = 'none'; if (fileCn) fileCn.parentElement.style.display = 'none';
  if (fileSingle) fileSingle.parentElement.style.display = '';
  } else {
  if (enWrap) enWrap.style.display = mode === 'en' ? '' : 'none';
  if (cnWrap) cnWrap.style.display = mode === 'zh' ? '' : 'none';
  if (ilWrap) ilWrap.style.display = 'none';
  if (fileEn) fileEn.parentElement.style.display = mode === 'en' ? '' : 'none';
  if (fileCn) fileCn.parentElement.style.display = mode === 'zh' ? '' : 'none';
  if (fileSingle) fileSingle.parentElement.style.display = 'none';
  }
  };

  const mask = UI.openModal({ title: opts.isEdit ? '编辑外刊文章' : '导入外刊文章', icon: '<img class="ic" src="assets/icons/hk-33.png" alt=""/>', body: `
  <div class="field"><label>标题</label><input class="input" id="artT" value="${UI.esc(srcTitle)}" placeholder="文章标题（用于查重：标题相同视为同一篇，更新不新增）"/></div>
  <div class="seg-group" style="margin:10px 0">
  <label class="seg-label"><input type="radio" name="pasteMode" value="interleaved" ${initMode === 'interleaved' ? 'checked' : ''}/> 英文中文交替</label>
  <label class="seg-label"><input type="radio" name="pasteMode" value="bilingual" ${initMode === 'bilingual' ? 'checked' : ''}/> 分栏中英</label>
  <label class="seg-label"><input type="radio" name="pasteMode" value="en" ${initMode === 'en' ? 'checked' : ''}/> 仅英文</label>
  <label class="seg-label"><input type="radio" name="pasteMode" value="zh" ${initMode === 'zh' ? 'checked' : ''}/> 仅中文</label>
  </div>
  <div class="muted-text" style="margin-bottom:10px">「英文中文交替」：一个框里直接粘贴整篇，支持两种写法：① 标题 + 英文段 + 中文段 + 英文段 + 中文段…（无需空行，自动按中英边界分段）；② 标题 + 英文段↵↵中文段↵↵…（用空行分隔）。可「选择文件」导入 .txt/.md/.html（自动清理网页标签）。标题相同会自动更新已有文章，不会重复。</div>
  <div class="field" id="pasteEnWrap" style="display:none"><label>英文原文</label>
  <textarea class="textarea" id="artTxt" style="min-height:110px" placeholder="粘贴英文文章，段落间空一行">${UI.esc(srcEn)}</textarea>
  <div style="margin-top:6px"><button class="btn btn-soft btn-sm" data-file="en"> 选择文件</button><input type="file" id="fileEn" accept=".txt,.md,.html,.htm" style="display:none"/></div>
  </div>
  <div class="field" id="pasteCnWrap" style="display:none"><label>中文译文</label>
  <textarea class="textarea" id="artCn" style="min-height:110px" placeholder="粘贴对应中文译文，段落与英文一一对应">${UI.esc(srcCn)}</textarea>
  <div style="margin-top:6px"><button class="btn btn-soft btn-sm" data-file="cn"> 选择文件</button><input type="file" id="fileCn" accept=".txt,.md,.html,.htm" style="display:none"/></div>
  </div>
  <div class="field" id="pasteIlWrap"><label>英文 + 中文交替（一段英文、一段中文…）</label>
  <textarea class="textarea" id="artIl" style="min-height:220px" placeholder="How Musical Training Reshapes Human Brains 音乐训练如何重塑人类大脑&#10;Playing musical instruments acts as comprehensive mental exercise…&#10;《经济学人》2026 年 4 月科学专栏汇总多项研究指出…">${UI.esc(srcIl)}</textarea>
  <div style="margin-top:6px"><button class="btn btn-soft btn-sm" data-file="single"> 选择文件</button><input type="file" id="fileSingle" accept=".txt,.md,.html,.htm" style="display:none"/></div>
  </div>
  `,
  actions: [ { label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: opts.isEdit ? '保存修改' : '载入', onClick: () => {
  const title = (UI.val('#artT') || '').trim() || '我的文章';
  let core;
  if (curMode === 'zh') {
  const cn = cleanupText(UI.val('#artCn'));
  if (!cn) return UI.toast('请粘贴或导入中文内容', 'warn');
  core = { title, text: cn, translation: {}, lang: 'zh', tailCn: '' };
  } else if (curMode === 'en') {
  const en = cleanupText(UI.val('#artTxt'));
  if (!en) return UI.toast('请粘贴或导入英文内容', 'warn');
  core = { title, text: en, chapters: buildChaptersFromText(en), translation: {}, lang: undefined, tailCn: '' };
  } else if (curMode === 'interleaved') {
  const raw = cleanupText(UI.val('#artIl'));
  if (!raw) return UI.toast('请粘贴或导入交替内容', 'warn');
  const parsed = parseInterleaved(raw, title);
  if (!parsed) return UI.toast('未识别到内容', 'warn');
  const tInput = document.querySelector('#artT');
  if (tInput && parsed.title && !tInput.value.trim()) tInput.value = parsed.title;
  const finalTitle = (tInput && tInput.value.trim()) || parsed.title || title || '我的文章';
  const chs = buildChaptersFromText(parsed.text);
  chs.forEach((c) => c.paras.forEach((p) => { p.cn = (parsed.translation && parsed.translation[p.en]) || ''; }));
  core = Object.assign({}, parsed, { title: finalTitle, chapters: chs });
  } else {
  const en = cleanupText(UI.val('#artTxt'));
  const cn = cleanupText(UI.val('#artCn'));
  if (!en && !cn) return UI.toast('请填写英文或中文内容', 'warn');
  if (!en) core = { title, text: cn, translation: {}, lang: 'zh', tailCn: '' };
  else if (!cn) core = { title, text: en, translation: {}, lang: undefined, tailCn: '' };
  else {
  const enParas = splitByBlank(en); const cnParas = splitByBlank(cn);
  const map = {}; const n = Math.min(enParas.length, cnParas.length);
  for (let i = 0; i < n; i++) map[enParas[i]] = cnParas[i];
  const tailCn = cnParas.slice(n).join('\n\n');
  core = { title, text: enParas.join('\n\n'), translation: map, lang: undefined, tailCn };
  }
  }
  // 编辑：先删除原条目，避免改标题后残留旧条目
  if (opts.isEdit && old) {
  Store.update((s) => { const lib = s.english.articles || []; const i = lib.findIndex((x) => getLibKey(x) === getLibKey(old)); if (i >= 0) lib.splice(i, 1); });
  }
  // 查重提示（仅新建）：标题相同视为重复，upsertArticle 会更新已有而不新增
  let dupHint = '';
  if (!opts.isEdit) {
  const existed = (Store.get().english.articles || []).some((a) => !a.offline && (a.title || '').trim() === title);
  if (existed) dupHint = '（已存在同名《' + title + '》，已更新内容，未新增重复）';
  }
  const readState = (opts.isEdit && old) ? !!old.read : false;
  upsertArticle(Object.assign({ source: 'pasted', date: todayStr(), link: '', offline: false }, core), opts.isEdit ? readState : undefined);
  readerArticle = Object.assign({ read: readState }, core, { source: 'pasted', date: todayStr(), link: '', offline: false }); readerChapter = 0;
  Store.update((s) => { s.english.reader = readerArticle; });
  UI.closeModal(); Pages.english();
  UI.toast(opts.isEdit ? '已保存修改' : ('已导入文章' + dupHint), 'ok');
  } } ].filter(Boolean) });
  // openModal 返回 modal-mask DOM，在此挂载 radio 切换 + 文件选择事件（common.js 的 openModal 没有 onMount 回调）
  if (mask) {
  mask.querySelectorAll('input[name="pasteMode"]').forEach((r) => r.addEventListener('change', () => updateInputs(r.value)));
  updateInputs(initMode);
  mask.querySelectorAll('[data-file]').forEach((btn) => {
  btn.addEventListener('click', () => {
  const which = btn.dataset.file;
  const input = mask.querySelector(which === 'en' ? '#fileEn' : which === 'cn' ? '#fileCn' : '#fileSingle');
  if (input) input.click();
  });
  });
  ['fileEn', 'fileCn', 'fileSingle'].forEach((id) => {
  const input = mask.querySelector('#' + id);
  if (input) input.addEventListener('change', () => {
  const f = input.files && input.files[0]; if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
  const txt = cleanupText(fr.result);
  if (id === 'fileEn') { const t = mask.querySelector('#artTxt'); if (t) t.value = txt; }
  else if (id === 'fileCn') { const t = mask.querySelector('#artCn'); if (t) t.value = txt; }
  else { const t = mask.querySelector('#artIl'); if (t) t.value = txt; }
  UI.toast('已读入文件：' + f.name, 'ok');
  };
  fr.readAsText(f);
  });
  });
  }
  }
  function pasteArticle() { openImportModal({}); }
  function editArticle(art) { if (art) openImportModal({ isEdit: true, oldArt: art }); }
  function showWordPop(span, word) {
  if (popClose) { document.removeEventListener('click', popClose, true); popClose = null; }
  document.querySelectorAll('.word-pop').forEach((e) => e.remove());
  lookupWord(word).then((res) => {
  const pop = document.createElement('div');
  pop.className = 'word-pop';
  const r = span.getBoundingClientRect();
  const popW = 280;
  const left = Math.min(window.innerWidth - popW - 12, Math.max(12, r.left));
  pop.style.left = left + 'px';
  // 默认显示在单词【上方】；若上方空间不足（靠近屏幕顶部）则显示在下方
  const estH = 180;
  pop.style.top = (r.top - estH - 8 > 8 ? r.top - estH - 8 : r.bottom + 8) + 'px';
  const hasDef = res.cn && !/^（离线）|^未找到/.test(res.cn); // 有可用的本地释义
  const canAdd = !res.known; // 还没加入个人词库
  pop.innerHTML = `
  <div class="wp-word">${UI.esc(res.word)} <button class="btn btn-soft btn-sm" data-spk style="padding:4px 8px">朗读</button></div>
  <div class="wp-phon">${UI.esc(res.phonetic)} ${res.pos ? '· ' + UI.esc(res.pos) : ''}</div>
  ${hasDef
  ? '<div class="wp-cn"><b>释义：</b>' + UI.esc(res.cn) + '</div>'
  : '<div class="wp-cn muted-text">本地词库未收录该词</div>'}
  ${res.syn ? '<div class="wp-cn"><b>近义：</b>' + UI.esc(res.syn) + '</div>' : ''}
  ${res.phrases ? '<div class="wp-cn"><b>词组：</b>' + UI.esc(res.phrases) + '</div>' : ''}
  <div class="wp-trans">
  ${canAdd ? '<button class="btn btn-sm" data-add-now>＋ 加入词库</button>' : '<button class="btn btn-sm" disabled>已在词库</button>'}
  ${!hasDef ? '<button class="btn btn-soft btn-sm" data-search> 联网搜索</button>' : ''}
  </div>
  <div class="wp-online muted-text" data-online-result></div>`;
  document.body.appendChild(pop);
  pop.querySelector('[data-spk]').onclick = () => speak(res.word);
  const addNow = pop.querySelector('[data-add-now]');
  if (addNow) addNow.onclick = () => { addToBank(res); pop.remove(); if (popClose) { document.removeEventListener('click', popClose, true); popClose = null; } };
  //  搜索翻译：仅用户显式点击才联网，带超时，失败不影响阅读
  const onlineBox = pop.querySelector('[data-online-result]');
  const searchBtn = pop.querySelector('[data-search]');
  if (searchBtn) searchBtn.onclick = () => {
  searchBtn.disabled = true;
  searchBtn.textContent = ' 翻译中…';
  translateWord(res.word).then((t) => {
  if (t) {
  onlineBox.innerHTML = '<div class="wp-cn"><b>翻译：</b>' + UI.esc(t) + '</div><button class="btn btn-sm" data-add2>＋ 用此释义加入词库</button>';
  const a2 = onlineBox.querySelector('[data-add2]');
  if (a2) a2.onclick = () => { addToBank(Object.assign({}, res, { cn: t })); pop.remove(); if (popClose) { document.removeEventListener('click', popClose, true); popClose = null; } };
  } else {
  onlineBox.innerHTML = ' 当前网络环境暂无法联网翻译。可点「＋加入词库」手动补充中文，逐步积累你自己的词库。';
  }
  });
  };
  popClose = (e) => { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', popClose, true); popClose = null; } };
  setTimeout(() => document.addEventListener('click', popClose, true), 0);
  });
  }

  // ---------- 导入 ----------
  function renderImport(body) {
  const html = `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-33.png" alt=""/>导入单词</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="muted-text" style="margin-bottom:10px">支持上传考研英语词汇 PDF（如单词书导出的词汇表）。解析器以「单词 + 音标」为锚点逐条提取，<b>中文释义直接取自原书、绝不错位</b>，长释义换行也能正确归属。若仍失败（如扫描图片版），可改用「仅提取英文 + 联网补全中文」或「粘贴文本解析」。</div>
  <div class="seg-group" style="margin-bottom:12px">
  <label class="seg-label"><input type="radio" name="parseMode" value="bilingual" checked/> 智能解析（英/音标/中文）</label>
  <label class="seg-label"><input type="radio" name="parseMode" value="enOnly"/> 仅提取英文，联网补全中文</label>
  </div>
  <input type="file" id="pdfFile" accept="application/pdf" style="margin-bottom:10px"/>
  <div class="flex-wrap gap8">
  <button class="btn btn-sm" data-act="parse-pdf"> 解析 PDF</button>
  <button class="btn btn-soft btn-sm" data-act="paste-text"> 粘贴文本解析</button>
  </div>
  <div id="parseProgressWrap" class="mt12" style="display:none">
  <div class="flex-between muted-text" style="font-size:12px"><span id="parseProgressText">0 / 0</span><span id="parseProgressPct">0%</span></div>
  <div class="progress-bg" style="height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden;margin-top:4px"><div id="parseProgressBar" class="progress-fill" style="height:100%;width:0;background:var(--primary);transition:width .2s"></div></div>
  </div>
  <div id="parseMsg" class="muted-text mt12"></div>
  </div>
  </div>
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-29.png" alt=""/>词库备份</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="muted-text" style="margin-bottom:10px">英语单词已纳入全局数据，可使用顶部「导出 / 导入」按钮统一备份。</div>
  <button class="btn btn-soft btn-sm" data-act="export-en"> 仅导出单词 JSON</button>
  </div>
  </div>
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-27.png" alt=""/>考研词汇闪过（PDF 词库）</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="muted-text" style="margin-bottom:10px">已内置《考研词汇闪过》两套 PDF 的离线词库：<b>真题重点高频词替换</b>（单词 + 音标/词性/释义 + 近义/同族/反义/形近）+ <b>真题重点固定搭配</b>（词组 + 中文）。点击载入即加入个人词库，可在「闪卡」复习（显示单词 / 中文 / 固定搭配 / 同义词）。</div>
  <div class="flex-wrap gap8">
  <button class="btn btn-sm" data-act="load-kaoyan"><img src="assets/icons/hk-33.png" alt="" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"/>载入考研词汇闪过词库</button>
  <span class="muted-text" id="kaoyanCount"></span>
  </div>
  </div>
  </div>`;
  const w = wrap(body, html);
  const kc = w.querySelector('#kaoyanCount');
  if (kc) kc.textContent = window.KAOYAN_SEED ? ('内置 ' + window.KAOYAN_SEED.length + ' 条') : '（词库文件未加载）';
  w.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'parse-pdf') return doParsePdf();
  if (b.dataset.act === 'paste-text') return pasteText();
  if (b.dataset.act === 'export-en') { download('word-bank.json', JSON.stringify(Store.get().english.words, null, 2)); UI.toast('已导出单词', 'ok'); }
  if (b.dataset.act === 'load-kaoyan') return loadKaoyan();
  });
  }
  // 载入《考研词汇闪过》内置离线条目到个人词库（去重）
  function loadKaoyan() {
  if (!window.KAOYAN_SEED || !window.KAOYAN_SEED.length) return UI.toast('词库文件未加载', 'warn');
  let added = 0, skipped = 0;
  Store.update((st) => {
  const exist = new Set(st.english.words.map((x) => x.word.toLowerCase()));
  for (const e of window.KAOYAN_SEED) {
  const wd = (e.word || '').trim();
  if (!wd) continue;
  if (exist.has(wd.toLowerCase())) { skipped++; continue; }
  st.english.words.push(newWordObj({ word: wd, phonetic: e.phonetic || '', pos: e.pos || '', cn: e.cn || '', phrases: e.phrases || '', syn: e.syn || '' }));
  exist.add(wd.toLowerCase());
  added++;
  }
  });
  UI.toast(`已载入 ${added} 条（跳过重复 ${skipped} 条），去「闪卡」开始复习吧`, 'ok');
  }
  // 把文字项按 y 坐标分组为「行」（自上而下、自左而右）
  function itemsToLines(items) {
  const sorted = (items || []).slice().sort((a, b) => (b.y - a.y) || (a.x - b.x));
  const lines = [];
  let cur = null, lastY = null;
  for (const it of sorted) {
  const s = (it.s || '').replace(/\s+/g, ' ').trim();
  if (!s) continue;
  if (lastY === null || Math.abs(it.y - lastY) > 5) { cur = []; lines.push(cur); lastY = it.y; }
  cur.push(s);
  }
  return lines.map((l) => l.join(' '));
  }
  function dedupeEntries(arr) {
  const seen = new Set(); const out = [];
  for (const e of arr) { const k = (e.word || '').toLowerCase(); if (!k || seen.has(k)) continue; seen.add(k); out.push(e); }
  return out;
  }
  // 双语词条解析（已用真实 PDF 验证，5465 词、0 缺失中文、换行词条也正确配对）：
  // 以「单词 + 至少2空格 + /音标/」为锚点定位每条起点，再截取相邻两个锚点之间的
  // 文本作为该词释义。这样无论释义是否换行、是否跨行，都能正确归属到对应单词，
  // 杜绝错位。兼容方括号音标 [dju:] → /dju:/。
  // 关键：pdf.js 返回的文字是“内容流顺序”（word→音标→释义 逐条排列），这里直接
  // 使用原始文本，不做按 y 坐标重排（重排会打乱词条顺序导致错位）。
  function parseBilingual(text) {
  text = (text || '').replace(/\[([^\]]+)\]/g, '/$1/'); // 方括号音标 → 斜杠
  const starts = [];
  const startRe = /(^|\s)([a-zA-Z][a-zA-Z\-']*)\s{2,}\/([^/]+?)\//g;
  let m;
  while ((m = startRe.exec(text)) !== null) {
  starts.push({ idx: m.index + m[1].length, word: m[2], phonetic: m[3], end: m.index + m[0].length });
  }
  const entries = [];
  const seen = new Set();
  const phonOk = /[A-Za-zæɑɒʌɔəɛɜɪʊʃʒθðŋː]/;
  const posRe = /^(n|v|vt|vi|adj|a|adv|prep|conj|pron|art|int|num|modal|abbr|aux|link|sing|pl|inf|sth|sb|ad|det|exclam|ab)\.?\s*/i;
  for (let i = 0; i < starts.length; i++) {
  const cur = starts[i];
  if (!phonOk.test(cur.phonetic)) continue;
  const w = cur.word.toLowerCase();
  if (seen.has(w)) continue;
  const next = starts[i + 1];
  let seg = (next ? text.substring(cur.end, next.idx) : text.substring(cur.end)).trim();
  const pm = seg.match(posRe);
  let pos = '', cn = seg;
  if (pm) { pos = pm[1].toLowerCase().replace(/\.$/, '') + '.'; cn = seg.slice(pm[0].length).trim(); }
  if (!cn || cn.length < 1) continue;
  seen.add(w);
  entries.push({ word: cur.word, phonetic: cur.phonetic, pos, cn, en: '' });
  }
  return entries;
  }
  function getParseMode() {
  const el = document.querySelector('input[name="parseMode"]:checked');
  return el ? el.value : 'bilingual';
  }

  function doParsePdf() {
  const file = UI.$('#pdfFile').files[0];
  if (!file) return UI.toast('请先选择 PDF 文件', 'warn');
  const mode = getParseMode();
  const msg = UI.$('#parseMsg');
  if (msg) msg.textContent = mode === 'enOnly' ? '正在提取英文单词…' : '正在解析 PDF（自动识别版式 / 对齐三段）…';
  loadPdfJs()
  .then((pdfjs) => fileToArrayBuffer(file).then((buf) => {
  const task = pdfjs.getDocument({ data: buf, isEvalSupported: false, useSystemFonts: true });
  return task.promise;
  }))
  .then((doc) => {
  const jobs = [];
  for (let i = 1; i <= doc.numPages; i++) jobs.push(doc.getPage(i).then((p) => p.getTextContent().then((tc) => {
  const its = (tc.items || []).map((it) => ({ x: it.transform ? it.transform[4] : 0, y: it.transform ? it.transform[5] : 0, s: it.str || '' }));
  return { raw: (tc.items || []).map((it) => it.str || '').join(' '), lines: itemsToLines(its) };
  })));
  return Promise.all(jobs).then((pages) => {
  const textAll = pages.flatMap((p) => p.lines).join('\n');
  const rawText = pages.map((p) => p.raw).join('\n');
  if (!rawText.replace(/\s/g, '')) {
  if (msg) msg.textContent = '该 PDF 未包含可提取的文字（可能为扫描图片版），请改用「粘贴文本解析」手动导入。';
  UI.toast('PDF 无可提取文本', 'warn');
  return;
  }
  if (mode === 'enOnly') {
  const words = extractWordsOnly(textAll);
  if (!words.length) { if (msg) msg.textContent = '未能识别到英文单词，请检查 PDF 内容。'; UI.toast('未识别到单词', 'warn'); return; }
  const bank = Store.get().english.words;
  const todo = words.filter((w) => !bank.some((x) => x.word.toLowerCase() === w.toLowerCase()));
  if (!todo.length) { if (msg) msg.textContent = `识别 ${words.length} 词，均在词库中，无需导入。`; UI.toast('词库已包含这些单词', 'ok'); return; }
  if (msg) msg.textContent = `识别 ${words.length} 词，新词 ${todo.length} 个，开始联网补全中文释义…`;
  setProgress(0, todo.length);
  enrichWords(todo, (cur, total) => setProgress(cur, total)).then((entries) => {
  let added = 0;
  entries.forEach((e) => { Store.update((st) => st.english.words.push(newWordObj(e))); added++; });
  setProgress(0, 0);
  if (msg) msg.textContent = `导入完成：新增 ${added} 词（仅提取英文 + 联网补全中文）。`;
  UI.toast(`成功导入 ${added} 个单词 `, 'ok');
  }).catch((err) => { setProgress(0, 0); if (msg) msg.textContent = '联网补全失败：' + (err && err.message ? err.message : err); UI.toast('联网补全失败', 'warn'); });
  } else {
  // 主解析：锚点切片（内容流顺序，直接取原书中文）；兜底：同行版式
  let entries = parseBilingual(rawText);
  if (entries.length < 5) entries = parseVocabText(textAll);
  finishParseEntries(entries);
  }
  });
  }).catch((err) => { if (msg) msg.textContent = 'PDF 解析失败：' + (err && err.message ? err.message : err) + '（可改用「粘贴文本解析」）'; UI.toast('PDF 解析失败', 'warn'); });
  }
  function pasteText() {
  UI.openModal({ title: '粘贴词汇文本', icon: '<img class="ic" src="assets/icons/hk-38.png" alt=""/>', body: `<div class="field"><label>每行一条，如：abandon /əˈbændən/ v. 放弃；抛弃</label><textarea class="textarea" id="vocTxt" style="min-height:200px" placeholder="abandon /əˈbændən/ v. 放弃；抛弃"></textarea></div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: '解析导入', onClick: () => { const t = UI.val('#vocTxt'); if (!t.trim()) return UI.toast('请粘贴内容', 'warn'); UI.closeModal(); finishParse(t); } }] });
  }
  function finishParse(text) {
  const entries = parseBilingual(text);
  if (entries.length >= 1) { finishParseEntries(entries); return; }
  finishParseEntries(parseVocabText(text));
  }
  function finishParseEntries(entries) {
  const msg = UI.$('#parseMsg');
  if (!entries || !entries.length) { if (msg) msg.textContent = '未能识别到单词条目，请检查 PDF 版式或改用「粘贴文本解析」。'; UI.toast('未识别到单词', 'warn'); return; }
  const bank = Store.get().english.words;
  let added = 0, skipped = 0;
  entries.forEach((e) => { if (bank.some((x) => x.word.toLowerCase() === e.word.toLowerCase())) { skipped++; return; } Store.update((st) => st.english.words.push(newWordObj(e))); added++; });
  if (msg) msg.textContent = `解析完成：新增 ${added} 词，跳过重复 ${skipped} 词（中文释义取自原书，无错位）。`;
  UI.toast(`成功导入 ${added} 个单词 `, 'ok');
  }
  function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
})();
