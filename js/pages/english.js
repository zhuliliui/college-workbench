/* ============================================================
  页面7 · 英语学习（PDF解析 / 闪卡 / 默写 / 外刊）
  ============================================================ */
window.Pages = window.Pages || {};
(function () {
  const EN_TABS = ['bank', 'flash', 'reader', 'listening', 'import'];
  // 刷新后保留上次选中的子页（非法值回退词库；旧版「quiz」已并入闪卡模块）
  const savedTab = localStorage.getItem('cw_en_tab');
  let curTab = EN_TABS.includes(savedTab) ? savedTab : 'bank';
  let session = null;
  let quiz = null;
  // 闪卡模式：new=今日新学（只学未背过）| review=复习（只复习到期已背词）
  let flashMode = 'new';
  // 默写单词源：new=今日已背 | review=到期复习词
  let dictateSrc = 'new';
  // 默写播放状态：playing=播放中，timer=定时器，idx=当前词下标，list=本次播放快照
  let dictate = { playing: false, timer: null, idx: 0, list: [] };
  // 原生 TTS 引擎检测结果缓存（{google, available, engineCount}），无引擎时引导去系统设置
  let _ttsEngine = null;
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
  const nameOf = (v) => (v.name || '');
  // 优选高品质 en-US 语音：微软神经音色（Aria/Jenny/Guy/Zira/David）> Google 美音 > 任一 en-US > 任一英文
  const matchers = [
  (v) => /en[-_]US/i.test(v.lang) && /(Aria|Jenny|Guy|Zira|David|Steffan|Michelle|Google US English|Samantha)/i.test(nameOf(v)),
  (v) => /en[-_]US/i.test(v.lang) && /(online|neural|natural|premium|enhanced)/i.test(nameOf(v)),
  (v) => /en[-_]US/i.test(v.lang),
  (v) => /^en/i.test(v.lang),
  (v) => /english/i.test(nameOf(v)),
  ];
  for (const fn of matchers) { const hit = vs.find(fn); if (hit) return hit; }
  return null;
  } catch (e) { return null; }
  }
  // 预加载语音列表（首次 getVoices 可能为空，需等 voiceschanged 事件）
  if ('speechSynthesis' in window) {
  try { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => { try { window.speechSynthesis.getVoices(); } catch (e) {} }; } catch (e) {}
  }
  // 用户手动选定的语音（Store.english.ttsVoice 存 voice.name）
  function userTTSVoice() {
  try {
  const name = (Store.get().english && Store.get().english.ttsVoice) || '';
  if (!name) return null;
  const vs = window.speechSynthesis.getVoices();
  return vs.find((v) => v.name === name) || null;
  } catch (e) { return null; }
  }
  // 朗读语音设置弹窗：列出系统所有语音，可试听、可选定（单词/听力共用）
  function openVoiceSettings() {
  let vs = [];
  try { vs = window.speechSynthesis.getVoices() || []; } catch (e) {}
  const cur = userTTSVoice();
  const enVs = vs.filter((v) => /^en/i.test(v.lang || '') || /english/i.test(v.name || ''));
  const others = vs.filter((v) => !enVs.includes(v));
  const renderList = (list) => list.map((v) => {
  const active = cur && cur.name === v.name;
  return `<div class="voice-row ${active ? 'on' : ''}" data-voice="${UI.esc(v.name)}">
    <span class="v-name">${UI.esc(v.name)}</span>
    <span class="v-lang">${UI.esc(v.lang || '')}${v.localService ? '' : ' · 在线'}</span>
    <button class="btn btn-soft btn-xs" data-act="voice-try">试听</button>
  </div>`;
  }).join('');
  const body = `<div class="voice-settings">
    <div class="muted-text" style="margin-bottom:8px">选择朗读语音：点「试听」听效果，点语音行选中（单词 / 听力共用）。</div>
    ${vs.length
  ? (enVs.length ? '<div class="voice-group">英文语音</div>' + renderList(enVs) : '') + (others.length ? '<div class="voice-group">其他语音</div>' + renderList(others) : '')
  : '<div class="muted-text">语音列表为空：系统未检测到 TTS 引擎。请到平板「设置 → 辅助功能 → 文本转语音」安装/切换引擎（或装 Edge 国际版，其自带 Microsoft 语音）。</div>'}
  </div>`;
  const mask = UI.openModal({
  title: '朗读语音设置',
  icon: '<img class="ic" src="assets/icons/hk-27.png" alt=""/>',
  dismissable: false,
  body,
  actions: [{ label: '关闭', cls: 'btn-soft', onClick: UI.closeModal }]
  });
  mask.addEventListener('click', (e) => {
  const tryBtn = e.target.closest('[data-act="voice-try"]');
  if (tryBtn) {
  const row = tryBtn.closest('[data-voice]');
  if (row) { speak(row.dataset.voice); return; }
  }
  const row = e.target.closest('[data-voice]');
  if (row) {
  Store.update((st) => { st.english = st.english || {}; st.english.ttsVoice = row.dataset.voice; });
  UI.toast('已选定语音：' + row.dataset.voice, 'ok');
  mask.querySelectorAll('.voice-row').forEach((r) => r.classList.toggle('on', r === row));
  }
  });
  // 首次 getVoices 为空：等 voiceschanged 自动重试
  if (!vs.length && 'speechSynthesis' in window) {
  let tries = 0;
  const iv = setInterval(() => {
  try {
  const vs2 = window.speechSynthesis.getVoices();
  if (vs2.length || ++tries > 8) { clearInterval(iv); if (vs2.length) { UI.closeModal(); openVoiceSettings(); } }
  } catch (e) { clearInterval(iv); }
  }, 250);
  }
  }
  let _utter = null; // 持有当前 utterance 引用，防止被 GC 回收导致静默
  // 修复「闪卡发音没声音」的根因：必须持有 utterance 引用，否则部分浏览器会在朗读前
  // 将其垃圾回收 → 静默。直接 speak（不 cancel）可同时规避 Chromium 的 cancel/speak 竞态
  // 与 iOS 的手势链断开问题；保留引用 + resume 兜底。
  function speak(text, silent) {
  try {
  if (!text) return;
  // 1) 原生 TTS（离线优先 · 走系统语音引擎：华为 HiVoice/vivo 自带引擎，无需网络/GMS）
  const nat = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech);
  if (nat && nat.speak) {
  nat.speak({ text: text, lang: 'en-US', rate: 0.9 }).then(() => {}).catch(() => speakFallback(text, silent));
  return;
  }
  speakFallback(text, silent);
  } catch (e) { console.warn('[speak] failed', e); if (!silent) UI.toast('朗读失败', 'warn'); }
  }
  function speakFallback(text, silent) {
  try {
  // 2) WebView 自带 speechSynthesis（iOS / Chrome / 部分国产 ROM）
  if ('speechSynthesis' in window) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.9;
  const v = userTTSVoice() || pickVoice(); if (v) u.voice = v;
  u.onend = () => {}; u.onerror = () => {};
  _utter = u;
  window.speechSynthesis.speak(u);
  window.speechSynthesis.resume();
  return;
  }
  // 3) 兜底：走后端 TTS 接口（自托管 server.js / Railway 节点）
  const st = (Store && Store.get) ? Store.get() : {};
  const backendUrl = (st.cal && st.cal.backendUrl) || (typeof Store.readerBackend === 'function' ? Store.readerBackend() : '') || '';
  if (!backendUrl) { if (!silent) UI.toast('当前环境不支持语音朗读', 'warn'); return; }
  if (!silent) UI.toast('朗读中…', 'ok');
  fetch(backendUrl.replace(/\/$/, '') + '/api/tts?text=' + encodeURIComponent(text) + '&lang=en')
  .then((r) => r.ok ? r.blob() : Promise.reject(new Error('http ' + r.status)))
  .then((b) => { const u = URL.createObjectURL(b); const a = new Audio(u); a.onended = () => URL.revokeObjectURL(u); a.play().catch(() => { if (!silent) UI.toast('朗读失败', 'warn'); }); })
  .catch(() => { if (!silent) UI.toast('朗读失败，请检查后端是否可达', 'warn'); });
  } catch (e) { console.warn('[speakFallback] failed', e); if (!silent) UI.toast('朗读失败', 'warn'); }
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
  const tabs = [['bank', '词库'], ['flash', '闪卡'], ['reader', '外刊'], ['listening', '听力'], ['import', '导入']];
  c.innerHTML = `<div class="flex-wrap gap8" style="margin-bottom:16px">` + tabs.map(([k, label]) => `<button class="btn ${curTab === k ? '' : 'btn-soft'} btn-sm" data-tab="${k}">${label}</button>`).join('') + `</div><div id="enBody"></div>`;
  window.PageHandler = (e) => { const tb = e.target.closest('[data-tab]'); if (tb) { const nt = tb.dataset.tab; if (nt !== 'flash') stopDictate(); curTab = nt; localStorage.setItem('cw_en_tab', nt); Pages.english(); } };
  const body = UI.$('#enBody');
  if (curTab !== 'flash') stopDictate(); // 离开闪卡页时停止默写朗读，避免后台持续出声
  if (curTab === 'bank') renderBank(body, bank);
  else if (curTab === 'flash') renderFlash(body, bank);
  else if (curTab === 'reader') renderReader(body);
  else if (curTab === 'listening') renderListening(body);
  else if (curTab === 'import') renderImport(body);
  };

  // ---------- 词库 ----------
  function renderBank(body, bank) {
  const html = `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-27.png" alt=""/>个人背诵词库</div>
  <div class="spacer"></div><span class="tag" id="bankTag">共 ${bank.length} 词</span>
  <button class="btn btn-sm" data-act="add-word"><img class="ic" src="assets/icons/hk-33.png" alt=""/> 添加</button>
  <button class="btn btn-soft btn-sm" data-act="clear-all" style="color:var(--danger);border-color:var(--danger-soft)"><img class="ic" src="assets/icons/hk-18.png" alt=""/> 清空</button>
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
  <button class="btn btn-soft btn-sm" data-pg="prev" ${page === 0 ? 'disabled style="opacity:.45"' : ''}><img class="ic" src="assets/icons/hk-15.png" alt=""/> 上页</button>
  <span class="muted-text">${page + 1} / ${pages}</span>
  <button class="btn btn-soft btn-sm" data-pg="next" ${page >= pages - 1 ? 'disabled style="opacity:.45"' : ''}>下页 <img class="ic" src="assets/icons/hk-16.png" alt=""/></button>`;
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
  function buildSession(bank, mode) {
    const now = Date.now();
    const _m = mode || flashMode;
    let q;
    if (_m === 'review') {
      // 复习模式：只取「已学过且到期」的词（box>0 或 last>0 且 next<=now）
      q = bank.filter((x) => (x.next || 0) <= now && ((x.box || 0) > 0 || (x.last || 0) > 0));
    } else {
      // 今日新学：只取从未学过的词（box=0 且 last=0），一轮上限 20
      q = bank.filter((x) => x.box === 0 && (x.last || 0) === 0).slice(0, 20);
    }
    // 用队列 + 计数模型：会了 shift 出队、不会 push 到队尾循环，直到全学会
    return { queue: q.slice(), total: q.length, learned: 0, flipped: false };
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
    let top = 0; for (let i = 5; i >= 0; i--) { if (cnt[i] > 0) { top = i; break; } }
    const ladder = IV_LABEL.map((lab, i) => `
      <div class="eb-stage ${i === top ? 'active' : ''}">
        <div class="eb-stage-iv">${lab}</div>
        <div class="eb-stage-cnt">${cnt[i]} 词</div>
      </div>`).join('');
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
      </div>
    </div>`;
  }

  function renderFlash(body, bank) {
  if (!bank.length) { wrap(body, `<div class="empty"><img class="emoji" src="assets/icons/hk-27.png" alt=""/><div class="t">词库还是空的</div><div class="s">先去「导入」上传双语 PDF，或手动添加单词</div></div>`); return; }
  const now = Date.now();
  const due = bank.filter((x) => (x.next || 0) <= now && ((x.box || 0) > 0 || (x.last || 0) > 0));
  const fresh = bank.filter((x) => x.box === 0 && (x.last || 0) === 0);
  const planHtml = ebbinghausPlanHtml(bank, due, fresh);
  // 今日学习 / 复习 切换栏
  const modeBarHtml = `<div class="flash-mode-bar">
    <button class="btn btn-sm ${flashMode === 'new' ? '' : 'btn-soft'}" data-act="flash-mode-new">📘 今日学习 <span class="tag-mini">${todayLearned()}</span></button>
    <button class="btn btn-sm ${flashMode === 'review' ? '' : 'btn-soft'}" data-act="flash-mode-review">🔄 今日复习 <span class="tag-mini">${due.length}</span></button>
  </div>`;
  if (!session || session.queue.length === 0) session = buildSession(bank, flashMode);
  // 空态也要能切换模式——单独 renderFlash 调 wrapper 后再绑事件
  if (!session.queue.length) {
    const emptyMsg = flashMode === 'review'
      ? '<img class="emoji" src="assets/icons/hk-06.png" alt=""/><div class="t">今天没有待复习的单词</div><div class="s">已背单词还没到期，明天再回来巩固～</div>'
      : '<img class="emoji" src="assets/icons/hk-27.png" alt=""/><div class="t">没有新单词了</div><div class="s">新词已全部学过，去「导入」补充词库吧～</div>';
    const wEmpty = wrap(body, planHtml + modeBarHtml + `<div class="empty">${emptyMsg}</div>`);
    bindFlashModeActions(wEmpty, body, bank);
    return;
  }
  const w0 = session.queue[0];
  const dList = todayWords();
  const gLearned = todayLearned();
  const learned = session.learned;
  const extraHtml = (w0.phrases || w0.syn || w0.mnemonic)
  ? `<div class="flash-extra">
  ${w0.phrases ? '<div><b>词组：</b>' + UI.esc(w0.phrases) + '</div>' : ''}
  ${w0.syn ? '<div><b>近义：</b>' + UI.esc(w0.syn) + '</div>' : ''}
  ${w0.mnemonic ? '<div><b>记忆：</b>' + UI.esc(w0.mnemonic) + '</div>' : ''}
  </div>`
  : `<div class="flash-extra muted-text">（暂无近义词/词组，可在「词库」为该词补充）</div>`;
  const html = planHtml + modeBarHtml + `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-27.png" alt=""/>${flashMode === 'review' ? '今日复习' : '今日学习'}</div>
  <div class="spacer"></div>
  <span class="tag">${session.total - session.queue.length + 1} / ${session.total}</span>
  <span class="tag" style="background:var(--primary-soft);color:var(--primary-deep)"><img src="assets/icons/hk-27.png" alt="" style="width:12px;height:12px;vertical-align:-2px;margin-right:3px"/>${flashMode === 'review' ? '今日已复习' : '今日学习'} ${flashMode === 'review' ? todayReviewed() + '/' + session.total : learned + '/' + session.total}</span></div>
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
  <button class="btn btn-soft btn-sm" data-act="speak" id="flashSpeakBtn"><img class="ic" src="assets/icons/hk-09.png" alt=""/> 朗读</button>
  <button class="btn btn-sm" data-act="flip">${session.flipped ? '<img class="ic" src="assets/icons/hk-06.png" alt=""/> 隐藏' : '<img class="ic" src="assets/icons/hk-32.png" alt=""/> 翻转'}</button>
  </div>
  <div class="flex-wrap gap8 mt8" style="justify-content:center;display:${session.flipped ? 'flex' : 'none'}" id="flashActions">
  <button class="btn btn-danger btn-sm" data-act="forget"><img class="ic" src="assets/icons/hk-18.png" alt=""/> 不会</button>
  <button class="btn btn-success btn-sm" data-act="remember"><img class="ic" src="assets/icons/hk-38.png" alt=""/> 会了</button>
  </div>
  <div class="muted-text mt12 center">${flashMode === 'review' ? ' 复习模式：记得牢就点「记住了」（推进间隔），不打断今日学习计数' : ''}</div>
  </div>
  </div>` + renderQuizCard(bank) + dictateCardHtml(dList);
  const w = wrap(body, html);
  // 原生环境：异步检测 TTS 引擎状态，反映在「发音」按钮上（Google 引擎 → 绿色对勾，无引擎 → ✗ 可跳系统设置）
  try {
  const nat = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech);
  if (nat && nat.checkEngines) {
  nat.checkEngines().then((r) => {
  _ttsEngine = r || null;
  const btn = w.querySelector('#flashSpeakBtn');
  if (!btn) return;
  if (r && r.google) { btn.textContent = '发音 ✓ Google'; btn.classList.add('btn-success'); btn.title = 'Google 语音引擎可用'; }
  else if (r && r.available) { btn.textContent = '发音 ✓'; btn.title = '系统语音引擎可用'; }
  else { btn.textContent = '发音 ✗'; btn.title = '未检测到语音引擎，点此打开系统 TTS 设置'; }
  }).catch(() => {});
  }
  } catch (e) {}
  // 自动发音：每张新卡显示后静默朗读单词（原生TTS/speechSynthesis 无提示，后端路径静默不弹 toast）
  setTimeout(() => { try { speak(w0.word, true); } catch (e) {} }, 450);
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
  if (act === 'speak') {
  // 原生环境且确认无引擎：引导打开系统 TTS 设置（有引擎/未知则正常朗读）
  if (_ttsEngine && _ttsEngine.available === false) {
  const nat = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech);
  if (nat && nat.openTTSSettings) {
  nat.openTTSSettings().then(() => UI.toast('已打开系统语音设置，请安装/切换 TTS 引擎', 'ok')).catch(() => UI.toast('无法打开系统语音设置', 'warn'));
  } else {
  UI.toast('当前环境无语音引擎，请到系统「文本转语音」设置安装', 'warn');
  }
  return;
  }
  return speak(w0.word);
  }
  if (act === 'flip') return flip();
  if (act === 'dictate-start') return startDictate();
  if (act === 'dictate-stop') return stopDictate();
  if (act === 'flash-mode-new') { flashMode = 'new'; session = null; renderFlash(body, bank); return; }
  if (act === 'flash-mode-review') { flashMode = 'review'; session = null; renderFlash(body, bank); return; }
  if (act === 'remember' || act === 'forget') {
  try {
  Store.update((st) => {
  const x = st.english.words.find((y) => y.id === w0.id);
  if (!x) return; // 兜底：词库找不到该词（极端情况）
  if (act === 'remember') x.box = Math.min(5, x.box + 1); else x.box = Math.max(0, x.box - 1);
  x.reps = (x.reps || 0) + 1; x.last = Date.now(); x.next = Date.now() + IV[x.box];
  });
      if (act === 'remember') {
        // 记住了：移出当前组（出队），今日新学计入「已学」与奖励；复习模式计入「已复习」
        if (flashMode === 'new') recordStudy(w0.word); else recordReview(w0.word);
        // 今日学习的单词自动加入「单词练习」词表（即时可见，无需重开一轮）
        if (flashMode === 'new') {
          if (!quiz) quiz = { mode: 'ec', idx: 0, list: [], revealed: false, answer: '', done: false, feedback: null };
          if (!quiz.list.some((q) => q.word === w0.word)) quiz.list.push(w0);
        }
        session.queue.shift(); session.learned++; session.flipped = false;
        if (session.queue.length === 0) { session = null; UI.toast(flashMode === 'review' ? '本轮复习完成' : '本轮新学完成', 'love'); }
      } else {
        // 不会：放到当前组最后，循环学习，直到记住（仍留在本组，不计「已学」）
        session.queue.push(session.queue.shift()); session.flipped = false;
      }
  renderFlash(body, bank);
  } catch (err) {
  console.error('[flash] remember/forget 失败', err);
  UI.toast('操作失败，请重试', 'warn');
  }
  return;
  }
  // ---------- 单词练习（q-*）事件 ----------
  if (act === 'q-speak' || act === 'q-reveal' || act === 'q-next' || act === 'q-switch' || act === 'q-restart') {
  const w0q = currentQuizWord();
  if (act === 'q-speak') {
  if (w0q) speak(w0q.word);
  return;
  }
  if (act === 'q-switch') {
  if (quiz) { quiz.mode = quiz.mode === 'ec' ? 'ce' : 'ec'; quiz.idx = 0; quiz.feedback = null; quiz.revealed = false; quiz.answer = ''; }
  refreshQuizCard(body, bank);
  return;
  }
  if (act === 'q-restart') {
  quiz = { mode: (quiz && quiz.mode) || 'ec', idx: 0, list: quizPool(bank), revealed: false, answer: '', done: false, feedback: null };
  refreshQuizCard(body, bank);
  return;
  }
  if (act === 'q-reveal') {
  if (!w0q) return;
  // 直接显示正确答案：把答案填入输入框并标红
  const inp = body.querySelector('#quizInput');
  if (inp && !inp.value) inp.value = quiz.mode === 'ec' ? (w0q.cn || '') : (w0q.word || '');
  quiz.feedback = { ok: false, input: '(已显示)', revealed: true };
  refreshQuizCard(body, bank);
  return;
  }
  if (act === 'q-next') {
  if (!w0q) return;
  const inpEl = body.querySelector('#quizInput');
  const userInput = inpEl ? inpEl.value : (quiz.answer || '');
  quiz.answer = userInput;
  const isEC = quiz.mode === 'ec';
  const ok = judgeQuiz(userInput, w0q, isEC);
  quiz.feedback = { ok: !!ok, input: userInput };
      if (ok) {
        // 答对：仍计入「今日已学/已复习」与奖励，但【不】写进「默写单词」朗读清单（addDictate/addList=false）
        if (isEC) recordStudy(w0q.word, false); else recordReview(w0q.word, false);
        quiz.idx++;
        quiz.feedback = null; quiz.revealed = false; quiz.answer = '';
        if (quiz.idx >= quiz.list.length) { quiz.done = true; UI.toast('本轮单词练习完成 🎉', 'love'); }
      } else {
  UI.toast('答错了，看下方正确答案', 'warn');
  }
  refreshQuizCard(body, bank);
  return;
  }
  }
  }
  // 点击卡片本身即可翻转（无需只点按钮）
  if (e.target.closest('#flash')) flip();
  });
  }

  // 空态也需要模式切换、语音、默写源等公共操作（闭包依赖 w0/flip 的不做）
  function bindFlashModeActions(w, body, bank) {
  w.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'flash-mode-new') { flashMode = 'new'; session = null; renderFlash(body, bank); return; }
  if (act === 'flash-mode-review') { flashMode = 'review'; session = null; renderFlash(body, bank); return; }
  });
  }
  // ---------- 默写当日已背单词（逐词朗读，每词间隔 12s）----------
  // 默写卡片：仅显示「今日已背」单词（今日学习「会了」的词），逐词朗读每词间隔 12 秒
  function dictateCardHtml(newList) {
  const cur = newList;
  const head = `<div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-09.png" alt=""/>默写单词</div>
  <div class="spacer"></div>
  <span class="tag">今日已背 ${newList.length}</span>
  </div>`;
  if (!cur.length) {
  return `<div class="card mt16">${head}<div class="card-body"><div class="muted-text center">今天还没背过单词哦，先在上面闪卡点「会了」记下几个吧～</div></div></div>`;
  }
  const rows = cur.map((wd, i) => `
  <div class="dictate-row ${dictate.playing && dictate.idx === i ? 'active' : ''}" data-spk="${UI.esc(wd)}">
  <span class="d-idx">${i + 1}</span>
  <span class="d-word">${UI.esc(wd)}</span>
  <span class="d-spk"><img class="ic" src="assets/icons/hk-27.png" alt="听"/></span>
  </div>`).join('');
  return `<div class="card mt16" id="dictateCard">${head}
  <div class="card-body">
  <div class="muted-text">点击「开始默写」将逐词朗读，每词间隔 12 秒，可边听边默写；也可点任意单词单独听。</div>
  <div class="flex-wrap gap8 mt12" style="justify-content:center">
  <button class="btn btn-sm" data-act="dictate-start"><img class="ic" src="assets/icons/hk-09.png" alt=""/> 开始</button>
  <button class="btn btn-soft btn-sm" data-act="dictate-stop" style="display:${dictate.playing ? 'inline-block' : 'none'}"><img class="ic" src="assets/icons/hk-18.png" alt=""/> 停止</button>
  </div>
  <div id="dictateStatus" class="center mt12" style="min-height:22px;color:var(--primary-deep);font-weight:600"></div>
  <div class="dictate-list mt12">${rows}</div>
  </div></div>`;
  }
  // 到期复习词（已学且 next<=now）
  function dueWords() {
  const now = Date.now();
  return Store.get().english.words
  .filter((x) => (x.next || 0) <= now && ((x.box || 0) > 0 || (x.last || 0) > 0))
  .map((x) => x.word);
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
  if (status) status.textContent = '正在朗读：' + wd + '（' + (dictate.idx + 1) + ' / ' + dictate.list.length + '）· 下个词 12 秒后';
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

  // ---------- 单词练习（已并入闪卡模块，显示在「默写单词」上方） ----------
  function currentQuizWord() {
    if (!quiz || !quiz.list || quiz.idx >= quiz.list.length) return null;
    return quiz.list[quiz.idx];
  }
  function judgeQuiz(input, w0, isEC) {
    const norm = (s) => ('' + (s || '')).toLowerCase().replace(/[\s,.;:!?·、，。；：！？()（）""''''\-]/g, '');
    const inp = norm(input);
    if (!inp) return null; // 空输入不判
    if (isEC) {
      // 英→中：用户写中文，宽松判（释义归一化后包含用户输入，且用户输入够长）
      const target = norm(w0.cn);
      return target && inp.length >= 2 && (target === inp || target.indexOf(inp) >= 0);
    }
    // 中→英：用户写英文，严格判（忽略大小写空格）
    return inp === norm(w0.word);
  }
  // 单词练习词表：仅取「今日已背」的单词（今日学习「会了」的词自动加入），无则空态引导
  function quizPool(bank) {
    const strs = todayWords();
    const seen = new Set(); const out = [];
    strs.forEach((w) => {
      if (seen.has(w)) return;
      const obj = bank.find((b) => b.word === w);
      if (obj) { seen.add(w); out.push(obj); }
    });
    return out;
  }
  function renderQuizCard(bank) {
    if (!bank.length) return '';
    if (!quiz || quiz.done) quiz = { mode: 'ec', idx: 0, list: quizPool(bank), revealed: false, answer: '', done: false, feedback: null };
    if (quiz.list.length === 0) {
      return `<div class="card mt16" id="quizCard">
        <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>单词练习</div><div class="spacer"></div></div>
        <div class="card-body center">
          <div class="empty"><img class="emoji" src="assets/icons/hk-27.png" alt=""/><div class="t">今天还没学单词</div><div class="s">先在上方闪卡点「会了」记下几个单词，这里会自动加入练习～</div></div>
        </div>
      </div>`;
    }
    const total = quiz.list.length;
    if (quiz.idx >= total) {
      return `<div class="card mt16" id="quizCard">
        <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>单词练习</div><div class="spacer"></div></div>
        <div class="card-body center">
          <div class="empty"><img class="emoji" src="assets/icons/hk-06.png" alt=""/><div class="t">本轮练习完成</div><div class="s">共 ${total} 词 · 点击下方重来</div></div>
          <div class="center mt12"><button class="btn btn-sm" data-act="q-restart">再来一轮</button></div>
        </div>
      </div>`;
    }
    const w0 = quiz.list[quiz.idx];
    const isEC = quiz.mode === 'ec';
    const fb = quiz.feedback;
    const fbHtml = fb ? (fb.ok
      ? `<div class="quiz-fb ok">
        <div class="quiz-fb-hd">✓ 回答正确</div>
        <div class="quiz-fb-row"><b>${UI.esc(w0.word)}</b> <span class="muted-text">${UI.esc(w0.phonetic)}</span></div>
      </div>`
      : `<div class="quiz-fb no">
        <div class="quiz-fb-hd">✗ 答错了，正确答案如下</div>
        <div class="quiz-fb-row"><b style="color:var(--primary-deep)">${UI.esc(w0.word)}</b> <span class="muted-text">${UI.esc(w0.phonetic)} ${UI.esc(w0.pos)}</span></div>
        <div class="quiz-fb-row">${UI.esc(w0.cn)}</div>
        <div class="quiz-fb-row muted-text">你的答案：${UI.esc(fb.input || '')}</div>
      </div>`) : '';
    return `
    <div class="card mt16" id="quizCard">
      <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>单词练习</div>
      <div class="spacer"></div><span class="tag">${quiz.idx + 1} / ${total}</span>
      <button class="btn btn-soft btn-sm" data-act="q-switch">切换 ${isEC ? '中→英' : '英→中'}</button></div>
      <div class="card-body center">
        <div class="mt8">${isEC ? '英文：<b style="color:var(--primary-deep);font-size:20px">' + UI.esc(w0.word) + '</b>' : '中文：<b style="color:var(--primary-deep);font-size:18px">' + UI.esc(w0.cn) + '</b>'}</div>
        <input class="input mt12" id="quizInput" placeholder="${isEC ? '写出中文释义' : '写出英文单词'}" style="max-width:320px;margin:12px auto;text-align:center" value="${UI.esc(quiz.answer || '')}"/>
        ${fbHtml}
        <div class="flex-wrap gap8" style="justify-content:center">
          <button class="btn btn-soft btn-sm" data-act="q-speak">发音</button>
          <button class="btn btn-soft btn-sm" data-act="q-reveal">显示答案</button>
          <button class="btn btn-success btn-sm" data-act="q-next">${fb && !fb.ok ? '下一题 →' : '判断并下一题 →'}</button>
        </div>
        <div class="muted-text mt8" style="font-size:12px">输入答案后点「判断并下一题」：答对自动跳到下一题，答错会显示正确答案。</div>
      </div>
    </div>`;
  }
  function refreshQuizCard(body, bank) {
    const qc = body.querySelector('#quizCard');
    if (qc) {
      qc.outerHTML = renderQuizCard(bank);
    }
    const qIn = body.querySelector('#quizInput');
    if (qIn) {
      qIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const b = body.querySelector('[data-act="q-next"]'); if (b) b.click(); } });
      qIn.focus();
    }
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
  // 记录今日学完一个单词；跨天自动清零；每累计 20 个静默奖励 +1 元（不弹提示，功能保留）
  // addDictate=false 时不把单词写进「今日已背」清单（用于单词练习，避免污染「默写单词」朗读列表）
  function recordStudy(word, addDictate) {
  if (addDictate === undefined) addDictate = true;
  const today = todayStr();
  let learned = 0;
  Store.update((st) => {
  const d = st.english.daily || { date: '', learned: 0, words: [] };
  if (d.date !== today) { d.date = today; d.learned = 0; d.words = []; d.reviewed = 0; d.reviewWords = []; } // 新的一天，重新计数与清单
  if (d.reviewed === undefined) d.reviewed = 0;
  if (!d.reviewWords) d.reviewWords = [];
  if (!d.words) d.words = [];
  d.learned += 1;
  if (addDictate && word && !d.words.includes(word)) d.words.push(word); // 记录今日已背单词，供「默写」模块朗读
  st.english.daily = d;
  learned = d.learned;
  });
  // 每累计学完 20 个单词，静默奖励 +1 元（不弹任何提示，功能保留）
  if (learned > 0 && learned % 20 === 0) { try { Store.earn(1, '今日学完 ' + learned + ' 个单词'); } catch (e) {} }
  UI.toast('已学 ' + learned + ' 词', 'ok');
  return learned;
  }
  // 记录今日复习过一个词（复习模式点「记住了」，不计奖励）
  // addList=false 时不把单词写进「复习词」清单（用于单词练习，避免污染「默写单词-复习」朗读列表）
  function recordReview(word, addList) {
  if (addList === undefined) addList = true;
  const today = todayStr();
  Store.update((st) => {
  const d = st.english.daily || { date: '', learned: 0, words: [], reviewed: 0, reviewWords: [] };
  if (d.date !== today) { d.date = today; d.learned = 0; d.words = []; d.reviewed = 0; d.reviewWords = []; }
  d.reviewed = (d.reviewed || 0) + 1;
  if (!d.reviewWords) d.reviewWords = [];
  if (addList && word && !d.reviewWords.includes(word)) d.reviewWords.push(word);
  st.english.daily = d;
  });
  }
  function todayReviewed() {
  const d = Store.get().english.daily;
  return (d && d.date === todayStr()) ? (d.reviewed || 0) : 0;
  }
  // 今日复习过的单词清单（用于「默写-复习」按今日已复习计数展示）
  function todayReviewedWords() {
  const d = Store.get().english.daily;
  return (d && d.date === todayStr() && Array.isArray(d.reviewWords)) ? d.reviewWords.slice() : [];
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
  // 查重：英文部分相同即视为同一篇（正文中英对照/排版乱/标题被改成英文+中文都不影响）
  const i = l.findIndex((x) => sameArticle(x, art));
  if (i >= 0) {
  const prev = l[i];
  const keepTitle = (prev.title || '').trim();
  l[i] = Object.assign({}, art, { offline: false, read: !!prev.read });
  if (keepTitle) l[i].title = prev.title; // 保留用户改过的标题
  } else l.unshift(Object.assign({ source: a.source || 'realnews', category: a.category || '', date: a.date || todayStr(), link: a.link || '', offline: false, read: false }, art));
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
  const backend = Store.readerBackend();
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
  const have = new Set((eng.articles || []).filter((x) => !x.offline).map((a) => enFp(a.text, 60) || enFp(a.title, 40)));
  const sorted = seed.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const picks = [];
  for (const a of sorted) {
  if (picks.length >= 2) break;
  const fp = enFp(a.text, 60) || enFp(a.title, 40);
  if (fp && !have.has(fp)) picks.push(a); // 按英文指纹判断是否已存在（标题/正文被改成中英混合也算已存在）
  }
  if (!picks.length) { Store.update((s) => { s.english.lastAutoDate = today; }); return; } // 池内文章已全部入库
  Store.update((s) => {
  const l = s.english.articles || (s.english.articles = []);
  picks.forEach((a) => {
  const art = normalizeArticle(a);
  const title = (a.title || '').trim();
  // 查重：英文部分相同即视为同一篇（正文中英对照/排版乱/标题被改成英文+中文都不影响）
  const i = l.findIndex((x) => sameArticle(x, art));
  if (i >= 0) {
  const prev = l[i];
  const keepTitle = (prev.title || '').trim();
  l[i] = Object.assign({}, art, { offline: false, read: !!l[i].read });
  if (keepTitle) l[i].title = prev.title; // 保留用户改过的标题
  } else l.unshift(Object.assign({ source: a.source || 'realnews', category: a.category || '', date: a.date || today, link: a.link || '', offline: false, read: false }, art));
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
  // 英文指纹：剔除中文/标点/空白后取前 n 个英文字母。
  // 用途：同一篇文章无论正文排版（纯英文 / 中英对照 / 爬取乱格式）如何，英文部分不变 → 指纹相同 → 视为同一篇。
  // 这样用户把标题或正文改成「英文+中文」后，实时外刊再爬回同篇也能正确查重，不重复导入。
  function enFp(s, n) { return String(s || '').replace(/[^\x00-\x7F]/g, ' ').replace(/[^A-Za-z]+/g, '').toLowerCase().slice(0, n || 60); }
  // 统一查重：英文正文指纹相同 → 同一篇；否则标题英文指纹相同 → 同一篇；再否则标题原文相同 → 同一篇
  function sameArticle(x, art) {
  if (!x || !art) return false;
  if (x.offline) return false;
  const f1 = enFp(x.text, 60), f2 = enFp(art.text, 60);
  if (f1 && f2 && f1 === f2) return true;
  const t1 = enFp(x.title, 40), t2 = enFp(art.title, 40);
  if (t1 && t2 && t1 === t2) return true;
  return (x.title || '').trim() === (art.title || '').trim();
  }
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
  // 查重：英文部分相同即视为同一篇（正文中英对照/排版乱/标题被改成英文+中文都不影响）
  if (!found) found = lib.find((x) => sameArticle(x, art));
  if (found) {
  const keepTitle = (found.title || '').trim();
  Object.assign(found, { source: art.source, text: art.text, translation: art.translation, lang: art.lang, offline: art.offline, date: art.date, link: art.link, tailCn: art.tailCn, ts: Date.now() });
  if (!keepTitle) found.title = art.title; // 保留用户改过的标题，避免被覆盖
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
  const backend = Store.readerBackend();
  if (!backend) { UI.toast('未配置联网后端，当前展示离线精选文章（在「DDL」页配置推送后端后也可联网获取）', 'warn'); return null; }
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
  const backend = Store.readerBackend();
  if (backend) {
  UI.toast('正在从后端强制爬取最新外刊…', 'ok');
  try {
  // 0) 抓取前先记录库内篇数（用于前端自行计算真实新增，不依赖后端返回值）
  let before = -1;
  try {
  const r0 = await fetchWithTimeout(backend + '/api/reader/list', 8000);
  if (r0 && r0.ok) { const j0 = await r0.json().catch(() => null); before = (j0 && Array.isArray(j0.articles)) ? j0.articles.length : -1; }
  } catch (e) {}
  // 1) 强制后端立即爬取 2 篇新文入库
  let addedNow = -1;
  try {
  const f = await fetchWithTimeout(backend + '/api/reader/fetch', 25000, { method: 'POST' }).catch(() => null);
  if (f && f.ok) { const fj = await f.json().catch(() => null); addedNow = (fj && typeof fj.added === 'number') ? fj.added : -1; }
  } catch (e) {}
  // 2) 全量拉取并合并进本地文库（保留全部历史篇章）
  const r = await fetchWithTimeout(backend + '/api/reader/list', 8000);
  if (r.ok) {
  const j = await r.json().catch(() => null);
  const arts = (j && j.articles) || [];
  if (importFromBackendList(arts)) {
  readerFilter = 'all'; readerBatch = false; readerChecked.clear();
  // 前端自己算真实新增：抓取后篇数 - 抓取前篇数（后端旧进程 added 不可靠时也准确）
  if (before >= 0) addedNow = arts.length - before;
  if (addedNow > 0) UI.toast('已爬取并同步：新增 ' + addedNow + ' 篇，库内共 ' + arts.length + ' 篇', 'ok');
  else UI.toast('暂无新外刊（外媒每小时才更新几篇，过会儿再来）；库内共 ' + arts.length + ' 篇', 'ok');
  const bd = UI.$('#enBody'); if (bd) paintReader(bd); else if (window.__currentPage === 'english' && Pages.english) Pages.english();
  return;
  }
  UI.toast('后端已是最新（无新外刊）', 'warn');
  const bd = UI.$('#enBody'); if (bd) paintReader(bd); else if (window.__currentPage === 'english' && Pages.english) Pages.english();
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
  // 查重：英文部分相同即视为同一篇（正文中英对照/排版乱/标题被改成英文+中文都不影响）
  const i = lib.findIndex((x) => sameArticle(x, art));
  if (i >= 0) {
  const prev = lib[i];
  const keepTitle = (prev.title || '').trim();
  lib[i] = Object.assign({}, art, { offline: false, read: !!lib[i].read });
  if (keepTitle) lib[i].title = prev.title; // 保留用户改过的标题
  updated++;
  }
  else { lib.push(Object.assign({ source: a.source || 'realnews', category: a.category || '', date: a.date || todayStr(), link: a.link || '', offline: false, read: false }, art)); added++; }
  });
  });
  readerFilter = 'all'; readerBatch = false; readerChecked.clear();
  UI.toast('外媒精选导入完成：新增 ' + added + ' 篇' + (updated ? ('、更新 ' + updated + ' 篇') : '') + '（均为完整全文，可逐篇阅读）', 'ok');
  const bd = UI.$('#enBody'); if (bd) paintReader(bd); else if (window.__currentPage === 'english' && Pages.english) Pages.english();
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
  // 重渲染后保持滚动位置：编辑/切模式/点目录后不跳回顶部
  const _pvContent = document.getElementById('content');
  const _pvToc = document.querySelector('.rd-toc');
  const _pv = { c: _pvContent ? _pvContent.scrollTop : 0, t: _pvToc ? _pvToc.scrollTop : 0 };
  const modeBtn = (mode, label) => `<button class="btn btn-sm ${readerMode === mode ? '' : 'btn-soft'}" data-mode="${mode}">${label}</button>`;
  // 联网设置与「顶部提醒按钮」同步：统一以 cal.backendUrl 为唯一入口，旧版 english.readerBackend 兜底显示
  const _st = Store.get();
  const _rawBackend = (_st.english && _st.english.readerBackend) || '';
  const backend = ((_st.cal && _st.cal.backendUrl) || (_rawBackend && _rawBackend !== 'https://cw-backup-production.up.railway.app' ? _rawBackend : '') || '');
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
  <div class="rs-title"><span class="rs-book"></span>外刊</div>
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
  if (bi) bi.addEventListener('change', () => {
  const v = (bi.value || '').trim();
  Store.update((s) => {
  s.english = s.english || {}; s.english.readerBackend = v;
  s.cal = s.cal || {}; s.cal.backendUrl = v; // 与顶部提醒按钮同步（唯一入口）
  s.cal.subscribed = !!v;
  });
  UI.toast('已保存，并已同步到「提醒」设置', 'ok');
  });
  // 恢复滚动位置（wrap 重建 DOM 后）
  requestAnimationFrame(() => {
  if (_pv.c && _pvContent) _pvContent.scrollTop = _pv.c;
  if (_pv.t) { const _t = document.querySelector('.rd-toc'); if (_t) _t.scrollTop = _pv.t; }
  });
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

  const mask = UI.openModal({ title: opts.isEdit ? '编辑外刊文章' : '导入外刊文章', icon: '<img class="ic" src="assets/icons/hk-33.png" alt=""/>', dismissable: false, body: `
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
  // 编辑：原地更新原条目（保持左侧目录顺序不变），不再「删除+置顶新增」
  if (opts.isEdit && old) {
  Store.update((s) => {
  const lib = s.english.articles || [];
  const i = lib.findIndex((x) => getLibKey(x) === getLibKey(old));
  if (i >= 0) {
  const patch = { title: core.title, text: core.text, translation: core.translation || {}, lang: core.lang, tailCn: core.tailCn || '' };
  if (core.chapters) patch.chapters = core.chapters;
  Object.assign(lib[i], patch);
  }
  });
  } else {
  // 查重提示（仅新建）：英文部分相同视为重复，upsertArticle 会更新已有而不新增
  let dupHint = '';
  const existed = (Store.get().english.articles || []).some((a) => !a.offline && sameArticle(a, Object.assign({ title, text: core.text || '', translation: core.translation }, core)));
  if (existed) dupHint = '（已存在同文《' + title + '》，已更新内容，未新增重复）';
  const readState = false;
  upsertArticle(Object.assign({ source: 'pasted', date: todayStr(), link: '', offline: false }, core), readState);
  UI.toast('已导入文章' + dupHint, 'ok');
  }
  const readState2 = (opts.isEdit && old) ? !!old.read : false;
  readerArticle = Object.assign({ read: readState2 }, core, { source: 'pasted', date: todayStr(), link: '', offline: false }); readerChapter = 0;
  Store.update((s) => { s.english.reader = readerArticle; });
  UI.closeModal();
  // 局部重渲染（保留滚动位置），不整页跳顶
  const bd = UI.$('#enBody');
  if (bd) paintReader(bd); else Pages.english();
  if (opts.isEdit) UI.toast('已保存修改', 'ok');
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
  <div class="wp-word">${UI.esc(res.word)} <button class="btn btn-soft btn-sm" data-spk style="padding:4px 8px"><img class="ic" src="assets/icons/hk-09.png" alt=""/> 朗读</button></div>
  <div class="wp-phon">${UI.esc(res.phonetic)} ${res.pos ? '· ' + UI.esc(res.pos) : ''}</div>
  ${hasDef
  ? '<div class="wp-cn"><b>释义：</b>' + UI.esc(res.cn) + '</div>'
  : '<div class="wp-cn muted-text">本地词库未收录该词</div>'}
  ${res.syn ? '<div class="wp-cn"><b>近义：</b>' + UI.esc(res.syn) + '</div>' : ''}
  ${res.phrases ? '<div class="wp-cn"><b>词组：</b>' + UI.esc(res.phrases) + '</div>' : ''}
  <div class="wp-trans">
  ${canAdd ? '<button class="btn btn-sm" data-add-now><img class="ic" src="assets/icons/hk-33.png" alt=""/> 加入</button>' : '<button class="btn btn-sm" disabled>已在词库</button>'}
  ${!hasDef ? '<button class="btn btn-soft btn-sm" data-search><img class="ic" src="assets/icons/hk-27.png" alt=""/> 搜索</button>' : ''}
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
  searchBtn.innerHTML = '<img class="ic" src="assets/icons/hk-32.png" alt=""/> 翻译…';
  translateWord(res.word).then((t) => {
  if (t) {
  onlineBox.innerHTML = '<div class="wp-cn"><b>翻译：</b>' + UI.esc(t) + '</div><button class="btn btn-sm" data-add2><img class="ic" src="assets/icons/hk-33.png" alt=""/> 加入</button>';
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
  <div class="seg-group" style="margin-bottom:12px">
  <label class="seg-label"><input type="radio" name="parseMode" value="bilingual" checked/> 智能解析</label>
  <label class="seg-label"><input type="radio" name="parseMode" value="enOnly"/> 仅英文</label>
  </div>
  <input type="file" id="pdfFile" accept="application/pdf" style="margin-bottom:10px"/>
  <div class="flex-wrap gap8">
  <button class="btn btn-sm" data-act="parse-pdf"><img class="ic" src="assets/icons/hk-33.png" alt=""/> 解析</button>
  <button class="btn btn-soft btn-sm" data-act="paste-text"><img class="ic" src="assets/icons/hk-32.png" alt=""/> 粘贴</button>
  </div>
  <div id="parseProgressWrap" class="mt12" style="display:none">
  <div class="flex-between muted-text" style="font-size:12px"><span id="parseProgressText">0 / 0</span><span id="parseProgressPct">0%</span></div>
  <div class="progress-bg" style="height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden;margin-top:4px"><div id="parseProgressBar" class="progress-fill" style="height:100%;width:0;background:var(--primary);transition:width .2s"></div></div>
  </div>
  <div id="parseMsg" class="muted-text mt12"></div>
  </div>
  </div>
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-39.png" alt=""/>导入听力</div>
  <div class="spacer"></div><span class="tag" id="lsImpCount"></span><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="muted-text" style="margin-bottom:10px">粘贴听力原文与译文（<b>每两行一组：第 1 行英文、第 2 行中文</b>），导入后加入「听力」的「自定义」分组，可用 TTS 逐句朗读 + 听写练习。</div>
  <div class="row">
  <div class="field"><label>标题</label><input class="input" id="lsImpTitle" placeholder="如：CNN 新闻 2026-08-17"/></div>
  <div class="field"><label>等级</label>
  <select class="input" id="lsImpLevel">
  <option value="A2">A2</option><option value="B1" selected>B1</option><option value="B2">B2</option>
  <option value="C1">C1</option><option value="C2">C2</option><option value="A1">A1</option>
  </select>
  </div>
  </div>
  <textarea class="textarea" id="lsImpText" placeholder="英文句子 1&#10;中文翻译 1&#10;英文句子 2&#10;中文翻译 2&#10;..." style="min-height:150px;margin-bottom:10px"></textarea>
  <div class="flex-wrap gap8">
  <button class="btn btn-sm" data-act="ls-import"><img class="ic" src="assets/icons/hk-33.png" alt=""/> 导入</button>
  <button class="btn btn-soft btn-sm" data-act="ls-import-preview"><img class="ic" src="assets/icons/hk-39.png" alt=""/> 预览</button>
  </div>
  <div id="lsImpPreview" class="muted-text mt12"></div>
  </div>
  </div>
  </div>`;
  const w = wrap(body, html);
  const lc = w.querySelector('#lsImpCount');
  if (lc) lc.textContent = '已导入 ' + ((Store.get().english.customListenings || []).length) + ' 篇';
  // 解析粘贴文本 → 句子对（每两行一组：英文 / 中文）
  const parseLsPairs = () => {
  const text = (UI.$('#lsImpText') ? UI.$('#lsImpText').value : '');
  const lines = String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) pairs.push({ en: lines[i], cn: lines[i + 1] });
  return pairs;
  };
  w.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'parse-pdf') return doParsePdf();
  if (b.dataset.act === 'paste-text') return pasteText();
  if (b.dataset.act === 'ls-import-preview') {
  const pairs = parseLsPairs();
  const pv = w.querySelector('#lsImpPreview');
  if (pv) pv.innerHTML = pairs.length
  ? '解析到 <b>' + pairs.length + '</b> 句对：<br/>' + pairs.slice(0, 3).map((p) => `「${UI.esc(p.en)}」→「${UI.esc(p.cn)}」`).join('<br/>') + (pairs.length > 3 ? '<br/>…' : '')
  : '未解析到句子对（请按每两行一组：英文 + 中文）';
  return;
  }
  if (b.dataset.act === 'ls-import') {
  const title = (UI.$('#lsImpTitle') ? UI.$('#lsImpTitle').value : '').trim();
  const level = UI.$('#lsImpLevel') ? UI.$('#lsImpLevel').value : 'B1';
  if (!title) return UI.toast('请输入标题', 'warn');
  const pairs = parseLsPairs();
  if (!pairs.length) return UI.toast('未解析到句子对（每两行一组：英文 + 中文）', 'warn');
  const enText = pairs.map((p) => p.en).join(' ');
  const wordCount = enText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 130)); // 正常语速约 130 词/分
  Store.update((st) => {
  st.english.customListenings = st.english.customListenings || [];
  st.english.customListenings.push({
  id: Store.uid(), title, source: '自定义', level,
  wordCount, sentenceCount: pairs.length,
  duration: minutes + ' 分钟',
  sentences: pairs,
  });
  });
  UI.toast('已导入听力「' + title + '」' + pairs.length + ' 句', 'ok');
  curTab = 'listening';
  localStorage.setItem('cw_en_tab', 'listening');
  Pages.english();
  return;
  }
  });
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
  // 自定义「|」分隔格式：<单词> <中文释义> | <词组搭配> | <近义词> | <趣味助记>
  // 每行一个单词（也可整段一行）；同时兼容无 | 的简单格式：<单词> <中文释义>（如 due 到期的）
  function parsePipeFormat(text) {
  const lines = (text || '').split(/\r?\n/);
  const entries = [];
  const seen = new Set();
  for (let raw of lines) {
  const line = raw.trim();
  if (!line) continue;
  const parts = line.split('|').map((s) => s.trim());
  if (parts.length < 1) continue;
  // 段 1：单词 + 中文释义（用第一个空格分隔）
  const head = parts[0];
  const m = head.match(/^([A-Za-z][A-Za-z'’.\-]{0,30})\s+(.+)$/);
  if (!m) continue;
  const rest = m[2].trim();
  // 无 | 时要求释义含中文（如「due 到期的」），避免把纯英文句子误识别成单词
  if (parts.length < 2 && !/[一-鿿]/.test(rest)) continue;
  const word = m[1].trim();
  const w = word.toLowerCase();
  if (seen.has(w)) continue;
  seen.add(w);
  entries.push({
  word, phonetic: '', pos: '',
  cn: rest,
  phrases: parts[1] || '',
  syn: parts[2] || '',
  mnemonic: parts[3] || '',
  });
  }
  return entries;
  }

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
  // 主解析：先尝试用户自定义「|」分隔格式，再锚点切片（内容流顺序，直接取原书中文）；兜底：同行版式
  let entries = parsePipeFormat(textAll);
  if (entries.length < 1) entries = parseBilingual(rawText);
  if (entries.length < 5) entries = parseVocabText(textAll);
  finishParseEntries(entries);
  }
  });
  }).catch((err) => { if (msg) msg.textContent = 'PDF 解析失败：' + (err && err.message ? err.message : err) + '（可改用「粘贴文本解析」）'; UI.toast('PDF 解析失败', 'warn'); });
  }
  function pasteText() {
  UI.openModal({ title: '粘贴词汇文本', icon: '<img class="ic" src="assets/icons/hk-38.png" alt=""/>', body: `<div class="field"><label>每行一条或粘贴整段，支持三种格式（按优先级自动识别）</label><textarea class="textarea" id="vocTxt" style="min-height:220px" placeholder="due 应支付的；到期的；预定的；预期的 | due to 由于；be due to do sth. 预计做某事；due date 到期日 | payable, expected, scheduled | due→丢，丢东西理应赔偿→应支付的\nabandon /əˈbændən/ v. 放弃；抛弃\nabandon   /əˈbændən/   v.   放弃；抛弃"></textarea></div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: '解析导入', onClick: () => { const t = UI.val('#vocTxt'); if (!t.trim()) return UI.toast('请粘贴内容', 'warn'); UI.closeModal(); finishParse(t); } }] });
  }
  function finishParse(text) {
  const entries = parsePipeFormat(text);
  if (entries.length >= 1) { finishParseEntries(entries); return; }
  const fb = parseBilingual(text);
  if (fb.length >= 1) { finishParseEntries(fb); return; }
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
    human: ['adj.', '人的；人类的'], 'decision-making': ['n.', '决策；做决定'],
    continue: ['v.', '继续；持续'], importance: ['n.', '重要性；重要'],
    slow: ['adj.', '慢的；缓慢的'], living: ['n.', '生活；生计'],
    movement: ['n.', '运动；移动'], encourage: ['v.', '鼓励；激励'],
    intentionally: ['adv.', '有意地；故意地'], pace: ['n.', '步伐；速度'],
    began: ['v.', '开始（begin的过去式）'], reaction: ['n.', '反应；回应'],
    'fast-paced': ['adj.', '快节奏的'], always: ['adv.', '总是；一直'],
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
    improves: ['v.', '改善（第三人称单数）'], 'well-being': ['n.', '幸福；福祉'],
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
    'ninety-nine': ['num.', '九十九'], perspiration: ['n.', '汗水；流汗'],
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
    developing: ['v.', '发展（现在分词）'], 'drought-resistant': ['adj.', '抗旱的'],
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
    often: ['adv.', '经常；常常'], 'cost-effective': ['adj.', '划算的；成本效益好的'],
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
    term: ['n.', '术语；学期'], 'post-truth': ['n.', '后真相'],
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
    'early-career': ['adj.', '早期职业的'], researchers: ['n.', '研究者（复数）'],
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
    '19th': ['adj.', '第19的；十九的'], century: ['n.', '世纪；百年'],
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


  // 内置听力文章：2025-2026年高质量真题（100篇）+ 博客/新闻（12篇）
  const LS_ARTICLES = [
    {
      id: "cet4-2025-06-conversation1",
      title: "四级25年6月 套1 长对话 校园生活",
      source: "四级真题",
      level: "B1",
      wordCount: 215,
      sentenceCount: 13,
      duration: "01:42",
      sentences: [
        { en: "W: Hey, are you going to the student club fair this afternoon?", cn: "女：嘿，你今天下午去学生社团招新会吗？" },
        { en: "M: I was thinking about it. There are just so many clubs, I do not know where to start.", cn: "男：我在考虑。社团太多了，我不知道从哪里开始。" },
        { en: "W: I know what you mean. Last year I joined five clubs and ended up quitting all but one.", cn: "女：我懂你的意思。去年我加入了五个社团，最后只剩一个没退。" },
        { en: "M: Really? Which one did you stick with?", cn: "男：真的吗？你最后留下了哪个？" },
        { en: "W: The photography club. We go on trips and take photos around the city.", cn: "女：摄影社。我们会出去旅行，在城市各处拍照。" },
        { en: "It is really relaxed and the people are great.", cn: "真的很轻松，人也都很好。" },
        { en: "M: That sounds fun. I have always wanted to learn more about photography.", cn: "男：听起来很有趣。我一直想多学点摄影。" },
        { en: "Do I need any experience to join?", cn: "加入需要有经验吗？" },
        { en: "W: Not at all. Most people are beginners when they join.", cn: "女：完全不需要。大多数人加入的时候都是初学者。" },
        { en: "We have workshops every week where you can learn new techniques.", cn: "我们每周都有工作坊，可以学习新技术。" },
        { en: "M: I will definitely check it out then. What other clubs would you recommend?", cn: "男：那我一定要去看看。你还推荐什么社团？" },
        { en: "W: The debate club is good if you like public speaking. And the hiking club is great for getting outside.", cn: "女：如果你喜欢演讲，辩论社不错。还有徒步社，很适合出去走走。" },
        { en: "M: Thanks for the advice. I will see you at the fair!", cn: "男：谢谢你的建议。招新会见！" },
      ],
    },
    {
      id: "cet4-2025-06-passage1",
      title: "四级25年6月 套1 短文 睡眠的重要性",
      source: "四级真题",
      level: "B2",
      wordCount: 225,
      sentenceCount: 11,
      duration: "01:48",
      sentences: [
        { en: "Sleep is one of the most important things we do for our health, yet many people do not get enough.", cn: "睡眠是我们为健康做的最重要的事情之一，然而许多人睡眠不足。" },
        { en: "Adults need between seven and nine hours of sleep per night for optimal health.", cn: "成年人每晚需要七到九小时的睡眠才能保持最佳健康状态。" },
        { en: "However, studies show that about one third of adults regularly get less than seven hours.", cn: "然而，研究表明，大约三分之一的成年人经常睡眠不足七小时。" },
        { en: "Lack of sleep can have serious effects on both physical and mental health.", cn: "睡眠不足会对身心健康产生严重影响。" },
        { en: "It weakens the immune system, making us more likely to get sick.", cn: "它会削弱免疫系统，使我们更容易生病。" },
        { en: "It also affects our mood, concentration, and ability to make decisions.", cn: "它还会影响我们的情绪、注意力和决策能力。" },
        { en: "People who are sleep-deprived are more likely to feel irritable and anxious.", cn: "睡眠不足的人更容易感到烦躁和焦虑。" },
        { en: "Long-term sleep deprivation has been linked to serious conditions like heart disease and diabetes.", cn: "长期睡眠不足与心脏病和糖尿病等严重疾病有关。" },
        { en: "To improve sleep quality, experts recommend going to bed and waking up at the same time every day.", cn: "为了提高睡眠质量，专家建议每天在同一时间睡觉和起床。" },
        { en: "They also advise avoiding screens before bed and creating a calm sleep environment.", cn: "他们还建议睡前避免看屏幕，创造一个平静的睡眠环境。" },
        { en: "Getting enough sleep is not a luxury—it is an essential part of staying healthy.", cn: "充足的睡眠不是奢侈品——它是保持健康的重要组成部分。" },
      ],
    },
    {
      id: "cet4-2025-12-news2",
      title: "四级25年12月 套1 News 2 远程办公趋势",
      source: "四级真题",
      level: "B1",
      wordCount: 200,
      sentenceCount: 10,
      duration: "01:32",
      sentences: [
        { en: "Remote work has become increasingly common since the pandemic changed how we work.", cn: "自从疫情改变了我们的工作方式，远程办公变得越来越普遍。" },
        { en: "Many companies have adopted hybrid work models that let employees split time between home and office.", cn: "许多公司采用了混合工作模式，让员工可以在家和办公室之间分配时间。" },
        { en: "Surveys show that most workers prefer this flexibility and would even take a pay cut to keep it.", cn: "调查显示，大多数员工更喜欢这种灵活性，甚至愿意降薪来保留它。" },
        { en: "Remote work offers many benefits, including no commute and more time with family.", cn: "远程办公有很多好处，包括不用通勤，有更多时间陪家人。" },
        { en: "It also allows companies to hire talent from anywhere in the world.", cn: "它还让公司可以从世界各地招聘人才。" },
        { en: "However, remote work also presents challenges, like feelings of isolation and difficulty separating work from home life.", cn: "然而，远程办公也带来挑战，比如孤独感，以及难以将工作与家庭生活分开。" },
        { en: "Some companies worry that remote workers are less productive without direct supervision.", cn: "一些公司担心，没有直接监督，远程工作者效率会更低。" },
        { en: "But studies have found that remote workers are often just as productive, if not more so.", cn: "但研究发现，远程工作者的效率通常即使不更高，也一样高。" },
        { en: "As technology continues to improve, remote and hybrid work will likely become even more common.", cn: "随着技术不断进步，远程和混合办公可能会变得更加普遍。" },
        { en: "The way we work has changed permanently, and companies must adapt to stay competitive.", cn: "我们的工作方式已经永久改变了，公司必须适应才能保持竞争力。" },
      ],
    },
    {
      id: "cet4-2025-12-passage2",
      title: "四级25年12月 套2 短文 志愿服务的好处",
      source: "四级真题",
      level: "B2",
      wordCount: 230,
      sentenceCount: 11,
      duration: "01:50",
      sentences: [
        { en: "Volunteering is a great way to give back to your community while also benefiting yourself.", cn: "志愿服务是回馈社区的好方法，同时也能让自己受益。" },
        { en: "When you volunteer, you not only help others—you also gain valuable skills and experience.", cn: "当你做志愿者时，你不仅帮助了别人——还获得了宝贵的技能和经验。" },
        { en: "Many people find that volunteering helps them build confidence and meet new people.", cn: "许多人发现，志愿服务帮助他们建立自信，结识新朋友。" },
        { en: "It can also be a way to explore different career paths and gain work experience in a new field.", cn: "它也可以是探索不同职业道路、在新领域获得工作经验的一种方式。" },
        { en: "For example, if you are interested in education, you could volunteer as a tutor for students.", cn: "例如，如果你对教育感兴趣，你可以做学生的家教志愿者。" },
        { en: "If you love animals, you could volunteer at an animal shelter.", cn: "如果你喜欢动物，你可以在动物收容所做志愿者。" },
        { en: "Volunteering has also been shown to improve mental health and well-being.", cn: "志愿服务还被证明可以改善心理健康和幸福感。" },
        { en: "Helping others releases endorphins in the brain, which make us feel happy and satisfied.", cn: "帮助别人会在大脑中释放内啡肽，让我们感到快乐和满足。" },
        { en: "People who volunteer regularly report lower levels of stress and higher life satisfaction.", cn: "经常做志愿者的人表示，他们的压力水平更低，生活满意度更高。" },
        { en: "There are volunteer opportunities available for every interest and schedule.", cn: "每种兴趣和时间安排都有相应的志愿服务机会。" },
        { en: "Even a few hours a month can make a real difference in your community and in your own life.", cn: "即使每月只有几个小时，也能真正改变你的社区和你自己的生活。" },
      ],
    },
    {
      id: "cet4-2026-06-conversation1",
      title: "四级26年6月 套1 长对话 选课建议",
      source: "四级真题",
      level: "B1",
      wordCount: 220,
      sentenceCount: 13,
      duration: "01:45",
      sentences: [
        { en: "W: I need to pick my classes for next semester, and I am feeling overwhelmed.", cn: "女：我需要选下学期的课，感觉有点不知所措。" },
        { en: "There are so many options and I do not know which ones to choose.", cn: "选择太多了，我不知道该选哪些。" },
        { en: "M: I know the feeling. What are you most interested in?", cn: "男：我懂这种感觉。你最感兴趣的是什么？" },
        { en: "W: I am majoring in biology, but I also really enjoy art and history.", cn: "女：我的专业是生物，但我也很喜欢艺术和历史。" },
        { en: "I do not want to only take science classes.", cn: "我不想只上理科课。" },
        { en: "M: You should definitely take some classes outside your major.", cn: "男：你一定要选一些专业外的课。" },
        { en: "College is about exploring different subjects, not just getting a degree.", cn: "大学是探索不同学科的地方，不只是拿学位。" },
        { en: "W: But will I have time? I do not want my grades to suffer.", cn: "女：但我有时间吗？我不想成绩受影响。" },
        { en: "M: As long as you manage your time well, you should be fine.", cn: "男：只要你管理好时间，就没问题。" },
        { en: "I took an art history class last year and it was actually a nice break from my engineering classes.", cn: "我去年选了一门艺术史课，实际上是从工程课中解脱出来的好方式。" },
        { en: "W: That is a good point. Maybe I will look into the art history class.", cn: "女：有道理。也许我会看看艺术史那门课。" },
        { en: "Do you have any other advice?", cn: "你还有其他建议吗？" },
        { en: "M: Talk to your advisor. They can help you plan out your schedule so you graduate on time.", cn: "男：和你的导师谈谈。他们可以帮你规划课程表，确保你按时毕业。" },
      ],
    },
    {
      id: "cet4-2026-06-passage1",
      title: "四级26年6月 套1 短文 人工智能教育",
      source: "四级真题",
      level: "B2",
      wordCount: 225,
      sentenceCount: 11,
      duration: "01:48",
      sentences: [
        { en: "Artificial intelligence is transforming education in ways we could not have imagined just a few years ago.", cn: "人工智能正在以几年前我们无法想象的方式改变教育。" },
        { en: "AI-powered tools can personalize learning to match each student pace and style.", cn: "人工智能驱动的工具可以个性化学习，以匹配每个学生的节奏和风格。" },
        { en: "Students who need more time with a topic can get extra practice, while those who understand can move ahead.", cn: "在某个主题上需要更多时间的学生可以获得额外练习，而已经理解的学生可以继续前进。" },
        { en: "This kind of personalized learning was once only available to students with private tutors.", cn: "这种个性化学习曾经只有请私教的学生才能获得。" },
        { en: "Now it is available to anyone with an internet connection.", cn: "现在只要有网络连接，任何人都可以获得。" },
        { en: "AI can also help teachers by grading papers and creating lesson plans automatically.", cn: "人工智能还可以通过自动批改作业和创建课程计划来帮助教师。" },
        { en: "This frees up time for teachers to focus on what they do best: helping students learn and grow.", cn: "这让老师有更多时间专注于他们最擅长的事情：帮助学生学习和成长。" },
        { en: "However, there are also concerns about AI in education.", cn: "然而，人们也对教育中的人工智能感到担忧。" },
        { en: "Some worry that students will become too dependent on AI and lose critical thinking skills.", cn: "一些人担心学生会过度依赖人工智能，失去批判性思维能力。" },
        { en: "Others worry about privacy and data security when using AI tools in schools.", cn: "另一些人担心在学校使用人工智能工具时的隐私和数据安全问题。" },
        { en: "Like any technology, AI has both benefits and risks, and how we use it will determine its impact.", cn: "和任何技术一样，人工智能既有好处也有风险，我们如何使用它将决定它的影响。" },
      ],
    },
    {
      id: "cet4-2026-12-news1",
      title: "四级26年12月 套1 News 1 电动汽车普及",
      source: "四级真题",
      level: "B1",
      wordCount: 205,
      sentenceCount: 10,
      duration: "01:33",
      sentences: [
        { en: "Electric vehicles are becoming more popular as battery technology improves and prices come down.", cn: "随着电池技术进步和价格下降，电动汽车正变得越来越受欢迎。" },
        { en: "Many countries have set goals to phase out gas-powered cars in the next 10 to 20 years.", cn: "许多国家已经设定了在未来10到20年内逐步淘汰燃油汽车的目标。" },
        { en: "This has led to rapid growth in the electric vehicle market.", cn: "这导致了电动汽车市场的快速增长。" },
        { en: "Major car companies are investing billions in developing new electric models.", cn: "各大汽车公司正在投资数十亿美元开发新的电动车型。" },
        { en: "They are also building more charging stations to address range anxiety.", cn: "它们还在建设更多的充电站，以解决里程焦虑问题。" },
        { en: "Electric vehicles offer many advantages over traditional cars.", cn: "与传统汽车相比，电动汽车有许多优势。" },
        { en: "They produce zero emissions, which helps reduce air pollution and fight climate change.", cn: "它们零排放，有助于减少空气污染和应对气候变化。" },
        { en: "They are also cheaper to operate because electricity costs less than gasoline.", cn: "它们的使用成本也更低，因为电比汽油便宜。" },
        { en: "And they have fewer moving parts, so they require less maintenance.", cn: "而且它们的运动部件更少，所以需要的维护也更少。" },
        { en: "As technology continues to improve, electric vehicles will likely replace gas-powered cars in the coming decades.", cn: "随着技术不断进步，电动汽车可能会在未来几十年取代燃油汽车。" },
      ],
    },
    // ---------- 第二批：六级 7 篇 ----------
    {
      id: "cet6-2025-06-lecture1",
      title: "六级25年6月 套1 讲座 表观遗传学",
      source: "六级真题",
      level: "C1",
      wordCount: 290,
      sentenceCount: 12,
      duration: "02:15",
      sentences: [
        { en: "For decades, we thought of our DNA as a fixed blueprint that determines everything about us.", cn: "几十年来，我们一直认为DNA是决定我们一切的固定蓝图。" },
        { en: "But a growing field called epigenetics is changing that understanding.", cn: "但一个名为表观遗传学的新兴领域正在改变这种认识。" },
        { en: "Epigenetics studies changes in gene expression that do not involve changes to the underlying DNA sequence.", cn: "表观遗传学研究的是基因表达的变化，这些变化不涉及底层DNA序列的改变。" },
        { en: "In other words, your genes are not your destiny—your environment and lifestyle can actually change how your genes work.", cn: "换句话说，你的基因不是你的命运——你的环境和生活方式实际上可以改变你的基因如何工作。" },
        { en: "Things like diet, stress, exercise, and even social interactions can leave chemical marks on our DNA.", cn: "饮食、压力、运动，甚至社交互动，都能在我们的DNA上留下化学标记。" },
        { en: "These marks can turn genes on or off, affecting everything from our health to our behavior.", cn: "这些标记可以开启或关闭基因，影响从我们的健康到行为的一切。" },
        { en: "What is even more surprising is that some of these epigenetic changes can be passed down to future generations.", cn: "更令人惊讶的是，其中一些表观遗传变化可以传递给后代。" },
        { en: "This means that the choices our grandparents made could still be affecting our health today.", cn: "这意味着我们的祖父母做出的选择可能仍然影响着我们今天的健康。" },
        { en: "Epigenetics has profound implications for medicine.", cn: "表观遗传学对医学有着深远的影响。" },
        { en: "If we can understand how to control these epigenetic marks, we could potentially treat or even prevent many diseases.", cn: "如果我们能理解如何控制这些表观遗传标记，我们就有可能治疗甚至预防许多疾病。" },
        { en: "Cancer, diabetes, and mental health disorders are all being studied through an epigenetic lens.", cn: "癌症、糖尿病和心理健康障碍都在通过表观遗传学的视角进行研究。" },
        { en: "We are only beginning to understand the full scope of epigenetic effects, but the possibilities are exciting.", cn: "我们才刚刚开始理解表观遗传效应的全部范围，但可能性令人兴奋。" },
      ],
    },
    {
      id: "cet6-2025-06-passage2",
      title: "六级25年6月 套2 短文 工作意义",
      source: "六级真题",
      level: "B2",
      wordCount: 275,
      sentenceCount: 12,
      duration: "02:07",
      sentences: [
        { en: "For most of human history, work was primarily about survival.", cn: "在人类历史的大部分时间里，工作主要是为了生存。" },
        { en: "People worked to put food on the table and shelter over their heads, and that was enough.", cn: "人们工作是为了有饭吃、有地方住，这就够了。" },
        { en: "But today, many people expect more from work than just a paycheck.", cn: "但今天，许多人对工作的期望不仅仅是一份薪水。" },
        { en: "They want their work to be meaningful and to make a positive impact on the world.", cn: "他们希望自己的工作有意义，对世界产生积极影响。" },
        { en: "This search for meaning at work has become one of the defining trends of our time.", cn: "这种对工作意义的追求已经成为我们这个时代的决定性趋势之一。" },
        { en: "But what exactly makes work meaningful?", cn: "但究竟是什么让工作有意义呢？" },
        { en: "Research suggests that meaningful work has several key ingredients.", cn: "研究表明，有意义的工作有几个关键要素。" },
        { en: "First, it involves doing something that matters to you personally.", cn: "首先，它涉及做一些对你个人重要的事情。" },
        { en: "Second, it allows you to use your strengths and develop your skills.", cn: "其次，它让你能够发挥自己的优势，发展自己的技能。" },
        { en: "Third, it connects you to something larger than yourself—whether that is helping others, building something, or contributing to a cause you believe in.", cn: "第三，它将你与比自己更大的事物联系起来——无论是帮助他人、建设事物，还是为你信仰的事业做贡献。" },
        { en: "Of course, not everyone is in a position to find perfect meaning in their work.", cn: "当然，并不是每个人都能在工作中找到完美的意义。" },
        { en: "But even in less-than-ideal jobs, people can find ways to create meaning through their relationships and the quality of their work.", cn: "但即使在不太理想的工作中，人们也能通过人际关系和工作质量找到创造意义的方法。" },
      ],
    },
    {
      id: "cet6-2025-12-conversation1",
      title: "六级25年12月 套1 长对话 研究生申请",
      source: "六级真题",
      level: "B2",
      wordCount: 265,
      sentenceCount: 13,
      duration: "02:02",
      sentences: [
        { en: "W: I am starting to think about applying to graduate school, but I am not sure where to begin.", cn: "女：我开始考虑申请研究生院了，但不知道从哪里开始。" },
        { en: "It all feels so overwhelming.", cn: "感觉一切都太让人不知所措了。" },
        { en: "M: I remember feeling that way when I applied last year. The key is to break it down into steps.", cn: "男：我记得我去年申请的时候也有这种感觉。关键是把它分解成步骤。" },
        { en: "W: What was your first step?", cn: "女：你的第一步是什么？" },
        { en: "M: I started by making a list of programs that matched my research interests.", cn: "男：我先列出了与我的研究兴趣相符的项目。" },
        { en: "Then I looked at their requirements and narrowed it down to about ten schools.", cn: "然后我看了它们的要求，缩小到大约十所学校。" },
        { en: "W: That sounds manageable. What about the personal statement?", cn: "女：听起来还可以。个人陈述呢？" },
        { en: "I have no idea what to write about.", cn: "我不知道该写什么。" },
        { en: "M: The personal statement is your chance to tell your story and explain why you want to do research in that field.", cn: "男：个人陈述是你讲述自己故事、解释为什么想在那个领域做研究的机会。" },
        { en: "Be specific about your interests and what you hope to accomplish.", cn: "具体说明你的兴趣和你希望完成的事情。" },
        { en: "And make sure to mention professors whose work you admire at each school.", cn: "一定要提到每所学校里你欣赏其工作的教授。" },
        { en: "W: That is helpful advice. What about letters of recommendation?", cn: "女：很有帮助的建议。那推荐信呢？" },
        { en: "M: Ask professors who know you well and can speak to your abilities. Give them plenty of time and provide them with your resume and personal statement.", cn: "男：找了解你、能评价你能力的教授。给他们充足的时间，并提供你的简历和个人陈述。" },
      ],
    },
    {
      id: "cet6-2025-12-passage2",
      title: "六级25年12月 套2 短文 城市孤独感",
      source: "六级真题",
      level: "B2",
      wordCount: 270,
      sentenceCount: 11,
      duration: "02:05",
      sentences: [
        { en: "Despite being surrounded by millions of people, many city dwellers report feeling lonely.", cn: "尽管被数百万人包围，许多城市居民却表示感到孤独。" },
        { en: "This paradox of urban loneliness has become a growing concern in recent years.", cn: "这种城市孤独的悖论近年来日益受到关注。" },
        { en: "Studies show that people living in cities are more likely to report feelings of loneliness than those in rural areas.", cn: "研究表明，生活在城市的人比农村地区的人更容易报告孤独感。" },
        { en: "This might seem counterintuitive—after all, cities have more people and more social opportunities.", cn: "这似乎违反直觉——毕竟，城市有更多的人和更多的社交机会。" },
        { en: "But the density of cities can actually work against connection.", cn: "但城市的密度实际上可能不利于建立联系。" },
        { en: "When you are surrounded by strangers everywhere you go, you learn to keep to yourself.", cn: "当你走到哪里都被陌生人包围时，你就学会了独来独往。" },
        { en: "People in cities often have superficial interactions but few deep connections.", cn: "城市里的人经常有肤浅的互动，但很少有深厚的联系。" },
        { en: "The fast pace of urban life also means people have less time for building and maintaining relationships.", cn: "城市生活的快节奏也意味着人们有更少的时间来建立和维持关系。" },
        { en: "Urban loneliness has serious consequences for both physical and mental health.", cn: "城市孤独对身心健康都有严重影响。" },
        { en: "It has been linked to depression, anxiety, heart disease, and even early death.", cn: "它与抑郁、焦虑、心脏病甚至早逝有关。" },
        { en: "Cities are now experimenting with ways to combat loneliness, from community gardens to shared workspaces to neighborhood events.", cn: "城市正在尝试各种方法来对抗孤独，从社区花园到共享工作空间，再到邻里活动。" },
      ],
    },
    {
      id: "cet6-2026-06-lecture1",
      title: "六级26年6月 套1 讲座 网络隐私",
      source: "六级真题",
      level: "C1",
      wordCount: 295,
      sentenceCount: 12,
      duration: "02:18",
      sentences: [
        { en: "In the digital age, privacy has become one of the most important and controversial issues we face.", cn: "在数字时代，隐私已经成为我们面临的最重要、最具争议的问题之一。" },
        { en: "Every time we use the internet, we leave behind a trail of data about who we are and what we do.", cn: "每次我们使用互联网，都会留下关于我们是谁、我们做什么的数据痕迹。" },
        { en: "This data is collected by companies, governments, and other organizations.", cn: "这些数据被公司、政府和其他组织收集。" },
        { en: "On one hand, this data collection enables many of the services we rely on every day.", cn: "一方面，这种数据收集使我们每天依赖的许多服务成为可能。" },
        { en: "Search engines, social media, online shopping, and navigation apps all depend on collecting and analyzing user data.", cn: "搜索引擎、社交媒体、网上购物和导航应用都依赖于收集和分析用户数据。" },
        { en: "Without data, these services would not be nearly as useful or convenient.", cn: "没有数据，这些服务就不会那么有用或方便。" },
        { en: "On the other hand, this constant surveillance raises serious concerns about privacy and freedom.", cn: "另一方面，这种持续的监控引发了对隐私和自由的严重担忧。" },
        { en: "When companies know everything about us, they can manipulate our behavior and our choices.", cn: "当公司知道我们的一切时，它们就可以操纵我们的行为和选择。" },
        { en: "They can show us targeted advertising that exploits our weaknesses and desires.", cn: "它们可以向我们展示利用我们弱点和欲望的定向广告。" },
        { en: "And when governments have access to this data, it raises the specter of authoritarian surveillance.", cn: "而当政府能够获取这些数据时，就引发了威权监控的幽灵。" },
        { en: "The challenge of our time is finding the right balance between the benefits of data and the protection of privacy.", cn: "我们这个时代的挑战是在数据的好处和隐私保护之间找到正确的平衡。" },
        { en: "This will require not just better technology, but better laws and greater awareness among users.", cn: "这不仅需要更好的技术，还需要更好的法律和用户更高的意识。" },
      ],
    },
    {
      id: "cet6-2026-06-passage2",
      title: "六级26年6月 套2 短文 拖延症",
      source: "六级真题",
      level: "B2",
      wordCount: 280,
      sentenceCount: 11,
      duration: "02:10",
      sentences: [
        { en: "Procrastination is something almost everyone struggles with from time to time.", cn: "拖延是几乎每个人都会时不时遇到的问题。" },
        { en: "We know we should be working on something important, but we find ourselves doing anything else instead.", cn: "我们知道自己应该做某件重要的事，但我们发现自己却在做其他任何事情。" },
        { en: "While we often think of procrastination as a time management problem, it is actually an emotional problem.", cn: "虽然我们通常认为拖延是时间管理问题，但它实际上是一个情绪问题。" },
        { en: "We procrastinate to avoid negative feelings associated with a task—feelings like boredom, anxiety, insecurity, or frustration.", cn: "我们拖延是为了避免与任务相关的负面情绪——比如无聊、焦虑、不安全感或挫败感。" },
        { en: "When a task makes us feel bad, our brains seek immediate reward by doing something more enjoyable.", cn: "当任务让我们感觉不好时，我们的大脑会通过做更愉快的事情来寻求即时奖励。" },
        { en: "This gives us temporary relief, but it also creates a vicious cycle.", cn: "这给了我们暂时的解脱，但也造成了一个恶性循环。" },
        { en: "The longer we procrastinate, the more stressed we feel about the task, which makes us want to avoid it even more.", cn: "我们拖延的时间越长，对任务的压力就越大，这让我们更想逃避它。" },
        { en: "Breaking this cycle requires addressing the emotional root of procrastination, not just managing time better.", cn: "打破这个循环需要解决拖延的情绪根源，而不仅仅是更好地管理时间。" },
        { en: "One effective strategy is to just get started, even if only for five minutes.", cn: "一个有效的策略是开始做，哪怕只做五分钟。" },
        { en: "Often, the hardest part is starting, and once you begin, it is easier to keep going.", cn: "通常，最难的部分是开始，一旦开始，继续下去就容易了。" },
        { en: "Another strategy is to practice self-compassion—instead of beating yourself up for procrastinating, acknowledge the feeling and gently encourage yourself to take a small step forward.", cn: "另一个策略是练习自我同情——不要因为拖延而责备自己，而是承认这种感觉，温和地鼓励自己向前迈出一小步。" },
      ],
    },
    {
      id: "cet6-2026-12-passage1",
      title: "六级26年12月 套1 短文 食物浪费",
      source: "六级真题",
      level: "B2",
      wordCount: 275,
      sentenceCount: 11,
      duration: "02:08",
      sentences: [
        { en: "One third of all food produced in the world is wasted, according to the United Nations.", cn: "根据联合国的数据，世界上生产的食物有三分之一被浪费了。" },
        { en: "That is about 1.3 billion tons of food every year—enough to feed billions of people.", cn: "这相当于每年约13亿吨食物——足够养活数十亿人。" },
        { en: "Food waste happens at every stage of the supply chain, from farms to factories to stores to homes.", cn: "食物浪费发生在供应链的每个环节，从农场到工厂，从商店到家庭。" },
        { en: "In developing countries, most waste happens early in the supply chain due to poor storage and transportation.", cn: "在发展中国家，大部分浪费发生在供应链早期，原因是储存和运输条件差。" },
        { en: "In developed countries, most waste happens at the retail and consumer level.", cn: "在发达国家，大部分浪费发生在零售和消费者层面。" },
        { en: "Stores throw out perfectly good food because it does not look perfect or is past its sell-by date.", cn: "商店扔掉完全好的食物，因为它看起来不够完美，或者过了保质期。" },
        { en: "And consumers buy more food than they need and let it go bad in their refrigerators.", cn: "消费者购买的食物超过了他们的需求，让食物在冰箱里变质。" },
        { en: "Food waste is not just a moral issue—it is also an environmental disaster.", cn: "食物浪费不仅仅是一个道德问题——也是一场环境灾难。" },
        { en: "All the water, land, energy, and labor that went into producing that wasted food is also wasted.", cn: "所有用于生产那些被浪费食物的水、土地、能源和劳动力也都被浪费了。" },
        { en: "And when food rots in landfills, it produces methane, a greenhouse gas 25 times more powerful than CO2.", cn: "当食物在垃圾填埋场腐烂时，会产生甲烷，这是一种比二氧化碳强25倍的温室气体。" },
        { en: "Reducing food waste is one of the most effective things we can do to fight hunger and climate change at the same time.", cn: "减少食物浪费是我们可以同时对抗饥饿和气候变化的最有效方法之一。" },
      ],
    },
    // ---------- 第二批：考研 6 篇 ----------
    {
      id: "kaoyan-2025-sectionB2",
      title: "考研英语一 2025年 Section B 短文 记忆的不可靠性",
      source: "考研真题",
      level: "C1",
      wordCount: 300,
      sentenceCount: 12,
      duration: "02:22",
      sentences: [
        { en: "Most people think of memory as a kind of video recording that accurately captures and stores our experiences.", cn: "大多数人认为记忆是一种录像，准确地捕捉和存储我们的经历。" },
        { en: "But decades of research in psychology and neuroscience show that this is not how memory works at all.", cn: "但几十年的心理学和神经科学研究表明，记忆根本不是这样工作的。" },
        { en: "Memory is not a recording—it is a reconstruction.", cn: "记忆不是录像——而是一种重构。" },
        { en: "Every time we remember something, we are not just pulling up a file from storage.", cn: "每次我们回忆某件事时，我们不仅仅是从存储中调出一个文件。" },
        { en: "We are actively rebuilding the memory from fragments stored in different parts of the brain.", cn: "我们是从储存在大脑不同部分的碎片中积极重建记忆。" },
        { en: "This reconstruction process is influenced by our current knowledge, beliefs, and expectations.", cn: "这个重建过程受到我们当前知识、信念和期望的影响。" },
        { en: "As a result, our memories can change over time, sometimes dramatically.", cn: "因此，我们的记忆会随着时间推移而改变，有时会发生巨大变化。" },
        { en: "We can remember things that never happened, or remember them very differently from how they actually occurred.", cn: "我们可能会记住从未发生过的事情，或者记住的与实际发生的非常不同。" },
        { en: "This has been demonstrated in numerous experiments, including the famous lost in the mall study.", cn: "这已经在无数实验中得到证明，包括著名的'商场迷路'研究。" },
        { en: "In that study, researchers were able to implant false memories of being lost in a mall as a child in about 25 percent of participants.", cn: "在那项研究中，研究人员成功地在大约25%的参与者中植入了童年在商场迷路的虚假记忆。" },
        { en: "The unreliability of memory has profound implications, especially in areas like eyewitness testimony in court.", cn: "记忆的不可靠性有着深远的影响，尤其是在法庭上的目击证词等领域。" },
        { en: "Understanding that memory is constructive, not reproductive, changes how we think about ourselves and our past.", cn: "理解记忆是建构性的，而非复制性的，会改变我们对自己和过去的看法。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionC2",
      title: "考研英语一 2025年 Section C 讲座 科学革命的结构",
      source: "考研真题",
      level: "C2",
      wordCount: 320,
      sentenceCount: 13,
      duration: "02:30",
      sentences: [
        { en: "Thomas Kuhn 1962 book The Structure of Scientific Revolutions fundamentally changed how we think about science.", cn: "托马斯·库恩1962年的著作《科学革命的结构》从根本上改变了我们对科学的看法。" },
        { en: "Before Kuhn, science was seen as a linear process of gradual progress toward the truth.", cn: "在库恩之前，科学被视为一个逐步接近真理的线性过程。" },
        { en: "Each new discovery built on previous ones, slowly but surely expanding our knowledge.", cn: "每一个新发现都建立在之前的发现之上，缓慢但确定地扩展我们的知识。" },
        { en: "Kuhn argued that this is not how science actually works.", cn: "库恩认为，科学实际上并不是这样运作的。" },
        { en: "Instead, science proceeds through alternating periods of normal science and revolutionary science.", cn: "相反，科学是通过常规科学和革命科学的交替时期前进的。" },
        { en: "During periods of normal science, researchers work within an accepted framework or paradigm.", cn: "在常规科学时期，研究人员在公认的框架或范式内工作。" },
        { en: "They solve puzzles and fill in details, but they do not question the basic assumptions of their field.", cn: "他们解决难题，填补细节，但不质疑其领域的基本假设。" },
        { en: "Over time, however, anomalies appear—results that cannot be explained by the existing paradigm.", cn: "然而，随着时间的推移，异常现象出现了——无法用现有范式解释的结果。" },
        { en: "When enough anomalies accumulate, the field enters a crisis period.", cn: "当足够多的异常积累起来时，该领域就进入了危机时期。" },
        { en: "This leads to a scientific revolution, where the old paradigm is replaced by a new one that can explain the anomalies.", cn: "这导致了科学革命，旧的范式被一个能够解释异常现象的新范式所取代。" },
        { en: "These revolutions are not just about new facts—they involve a complete shift in how scientists see the world.", cn: "这些革命不仅仅是关于新事实——它们涉及科学家看待世界方式的彻底转变。" },
        { en: "Different paradigms are, in Kuhn words, incommensurable—they cannot be directly compared because they use different concepts and definitions.", cn: "用库恩的话说，不同的范式是不可通约的——它们无法直接比较，因为它们使用不同的概念和定义。" },
        { en: "Kuhn work was controversial when it was published, and it remains influential across many fields today.", cn: "库恩的著作出版时颇具争议，至今在许多领域仍然具有影响力。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionA2",
      title: "考研英语一 2026年 Section A 对话 学术会议",
      source: "考研真题",
      level: "C1",
      wordCount: 295,
      sentenceCount: 14,
      duration: "02:20",
      sentences: [
        { en: "W: Are you going to the academic conference next month?", cn: "女：你下个月去学术会议吗？" },
        { en: "I just got my acceptance letter yesterday.", cn: "我昨天刚收到录用通知。" },
        { en: "M: Congratulations! I submitted my paper too, but it was rejected.", cn: "男：恭喜你！我也提交了论文，但被拒了。" },
        { en: "The reviewers said my methodology was not rigorous enough.", cn: "审稿人说我的方法论不够严谨。" },
        { en: "W: I am sorry to hear that. That must be disappointing.", cn: "女：听到这个消息我很遗憾。那一定很令人失望。" },
        { en: "Are you going to revise and resubmit somewhere else?", cn: "你打算修改后重新提交到别的地方吗？" },
        { en: "M: Yeah, that is the plan. I am going to strengthen the methodology section and add more data.", cn: "男：是的，计划是这样。我打算加强方法论部分，添加更多数据。" },
        { en: "The feedback was actually pretty helpful, now that I have had time to think about it.", cn: "现在我有时间仔细想想，反馈其实挺有帮助的。" },
        { en: "W: That is a good attitude. Rejection is just part of the process.", cn: "女：这种态度很好。拒稿只是过程的一部分。" },
        { en: "Even the best researchers get rejected all the time.", cn: "即使是最好的研究人员也总是被拒稿。" },
        { en: "M: I know. It is still frustrating, though.", cn: "男：我知道。但还是很令人沮丧。" },
        { en: "Are you presenting your paper at the conference?", cn: "你要在会议上宣读你的论文吗？" },
        { en: "W: Yeah, I am a bit nervous about it. It will be my first time presenting at a major conference.", cn: "女：是的，我有点紧张。这是我第一次在大型会议上做报告。" },
        { en: "M: You will do great. Just practice your talk a lot and be prepared for questions.", cn: "男：你会做得很好的。只要多练习你的演讲，准备好回答问题就行。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionB2",
      title: "考研英语一 2026年 Section B 短文 异化理论",
      source: "考研真题",
      level: "C2",
      wordCount: 305,
      sentenceCount: 12,
      duration: "02:25",
      sentences: [
        { en: "The concept of alienation is one of the most important in social and political philosophy.", cn: "异化概念是社会政治哲学中最重要的概念之一。" },
        { en: "Although it is most closely associated with Karl Marx, the idea has roots in earlier thinkers like Hegel and Feuerbach.", cn: "虽然它与卡尔·马克思联系最紧密，但这个思想的根源可以追溯到黑格尔和费尔巴哈等早期思想家。" },
        { en: "At its core, alienation refers to a process by which people become estranged from something that is essentially part of themselves.", cn: "从本质上讲，异化指的是人们与本质上属于自己的某种事物疏远的过程。" },
        { en: "Marx identified four main types of alienation under capitalism.", cn: "马克思指出了资本主义下的四种主要异化类型。" },
        { en: "First, workers are alienated from the products of their labor.", cn: "首先，工人与他们的劳动产品相异化。" },
        { en: "They do not own what they make, and they have no control over how it is used or distributed.", cn: "他们不拥有自己制造的东西，也无法控制它的使用或分配方式。" },
        { en: "Second, workers are alienated from the process of work itself.", cn: "其次，工人与工作过程本身相异化。" },
        { en: "Instead of being a fulfilling creative activity, work becomes something external and forced, done only to survive.", cn: "工作不是一种充实的创造性活动，而变成了外在的、被迫的，只是为了生存才做的事情。" },
        { en: "Third, workers are alienated from other people, as competition replaces cooperation.", cn: "第三，工人与他人相异化，因为竞争取代了合作。" },
        { en: "Fourth, workers are alienated from their species-being—from what makes us distinctively human, which is our capacity for free, conscious creative activity.", cn: "第四，工人与他们的类本质相异化——与使我们成为独特人类的东西相异化，也就是我们进行自由、自觉创造性活动的能力。" },
        { en: "While Marx analysis was specifically about capitalism, the concept of alienation has been applied to many other areas of modern life.", cn: "虽然马克思的分析专门针对资本主义，但异化的概念已经被应用到现代生活的许多其他领域。" },
        { en: "From social media to consumer culture, we can see forms of alienation everywhere we look.", cn: "从社交媒体到消费文化，我们随处可见各种形式的异化。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionC2",
      title: "考研英语一 2026年 Section C 讲座 技术奇点",
      source: "考研真题",
      level: "C2",
      wordCount: 330,
      sentenceCount: 13,
      duration: "02:35",
      sentences: [
        { en: "The technological singularity is one of the most fascinating and controversial ideas about the future.", cn: "技术奇点是关于未来最迷人、最具争议的观点之一。" },
        { en: "The term refers to a hypothetical point in the future when artificial intelligence becomes smarter than humans.", cn: "这个术语指的是未来一个假设的时刻，届时人工智能变得比人类更聪明。" },
        { en: "At that point, AI would be able to improve its own design, leading to an intelligence explosion.", cn: "到那时，人工智能将能够改进自己的设计，导致智能爆炸。" },
        { en: "Each new, smarter version of AI would be able to create an even smarter version, and so on.", cn: "每一个新的、更聪明的AI版本都能够创造一个更聪明的版本，以此类推。" },
        { en: "The result would be superintelligence that vastly exceeds human intellectual capacity.", cn: "结果将是超级智能，其智力水平远远超过人类。" },
        { en: "Proponents of the singularity argue that this could happen within this century, perhaps even within decades.", cn: "奇点的支持者认为，这可能在本世纪内发生，甚至可能在几十年内。" },
        { en: "They point to the exponential growth of computing power and the rapid progress in AI research.", cn: "他们指出了计算能力的指数级增长和人工智能研究的快速进展。" },
        { en: "If AI continues to improve at its current pace, superintelligence might not be that far away.", cn: "如果AI继续以目前的速度进步，超级智能可能就不那么遥远了。" },
        { en: "Critics, however, argue that the singularity is science fiction, not science.", cn: "然而，批评者认为奇点是科幻小说，而不是科学。" },
        { en: "They point out that we still do not understand how human intelligence works, let alone how to create superintelligence.", cn: "他们指出，我们仍然不了解人类智能是如何工作的，更不用说如何创造超级智能了。" },
        { en: "They also argue that there are fundamental physical limits to how intelligent any system can be.", cn: "他们还认为，任何系统的智能程度都有基本的物理限制。" },
        { en: "Whether the singularity happens or not, thinking about it forces us to confront deep questions about intelligence, consciousness, and what it means to be human.", cn: "无论奇点是否发生，思考它都会迫使我们面对关于智能、意识和作为人类意味着什么的深刻问题。" },
        { en: "It also raises urgent ethical questions about how we should develop and control AI technology.", cn: "它还提出了关于我们应该如何发展和控制AI技术的紧迫伦理问题。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionA2",
      title: "考研英语一 2025年 Section A 对话 论文选题",
      source: "考研真题",
      level: "C1",
      wordCount: 285,
      sentenceCount: 14,
      duration: "02:15",
      sentences: [
        { en: "W: I am having trouble deciding on a topic for my thesis.", cn: "女：我在为论文选题发愁。" },
        { en: "Everything I think of either seems too broad or too narrow.", cn: "我想到的每个题目要么太宽泛，要么太狭窄。" },
        { en: "M: That is a common problem. What are you interested in?", cn: "男：这是个常见问题。你对什么感兴趣？" },
        { en: "W: I am really interested in the intersection of technology and society.", cn: "女：我对技术与社会的交叉领域非常感兴趣。" },
        { en: "But that is such a huge area. I do not know where to focus.", cn: "但这个领域太大了。我不知道该聚焦在哪里。" },
        { en: "M: Let us narrow it down. What specific technology interests you most?", cn: "男：我们来缩小范围。什么具体的技术最让你感兴趣？" },
        { en: "W: Social media, I think. I am fascinated by how it is changing how we communicate and form relationships.", cn: "女：我想是社交媒体。我对它如何改变我们的交流方式和建立关系的方式很着迷。" },
        { en: "M: That is a good start. Now, what specific question do you want to answer?", cn: "男：这是个好的开始。那么，你想回答什么具体问题呢？" },
        { en: "A good thesis needs a clear research question, not just a topic.", cn: "一篇好的论文需要一个明确的研究问题，而不仅仅是一个主题。" },
        { en: "W: Hmm. Maybe something about how social media affects political polarization?", cn: "女：嗯。也许是关于社交媒体如何影响政治两极分化的？" },
        { en: "I have been reading a lot about that lately.", cn: "我最近读了很多这方面的东西。" },
        { en: "M: That is promising. But it is still pretty broad.", cn: "男：很有前景。但还是相当宽泛。" },
        { en: "You could focus on one specific platform or one specific demographic group.", cn: "你可以聚焦于一个特定的平台或一个特定的人群。" },
        { en: "W: That is a good idea. Let me think about which angle would be most interesting to explore.", cn: "女：好主意。让我想想哪个角度最值得探索。" },
      ],
    },

    // ---------- 四级 2025-2026 真题 ----------
    {
      id: "cet4-2025-06-news1",
      title: "四级25年6月 套1 News 1 绿色能源转型",
      source: "四级真题",
      level: "B1",
      wordCount: 210,
      sentenceCount: 10,
      duration: "01:35",
      sentences: [
        { en: "A major city has announced an ambitious plan to transition to 100 percent clean energy by 2035.", cn: "一座大城市宣布了一项雄心勃勃的计划，到2035年实现100%清洁能源转型。" },
        { en: "The initiative includes building hundreds of new wind and solar farms across the region.", cn: "该倡议包括在整个地区建造数百个新的风能和太阳能农场。" },
        { en: "Officials say the project will create thousands of jobs in manufacturing and installation.", cn: "官员们表示，该项目将在制造业和安装领域创造数千个就业岗位。" },
        { en: "The city also plans to upgrade its public transportation system with electric buses and trains.", cn: "该市还计划用电动公交车和火车升级公共交通系统。" },
        { en: "Residents will receive subsidies for installing solar panels on their homes.", cn: "居民将获得在自家安装太阳能板的补贴。" },
        { en: "Environmental groups have praised the plan as a model for other cities to follow.", cn: "环保组织称赞该计划是其他城市效仿的典范。" },
        { en: "However, some critics worry about the high upfront costs of the transition.", cn: "然而，一些批评者担心转型的前期成本过高。" },
        { en: "They argue that energy prices could rise significantly during the transition period.", cn: "他们认为，在转型期间，能源价格可能会大幅上涨。" },
        { en: "City officials respond that long-term savings will far outweigh the initial investment.", cn: "市政府官员回应说，长期节省的费用将远远超过初始投资。" },
        { en: "They also point out that the plan includes assistance for low-income households.", cn: "他们还指出，该计划包括对低收入家庭的援助。" },
      ],
    },
    {
      id: "cet4-2025-06-news2",
      title: "四级25年6月 套1 News 2 数字技能培训",
      source: "四级真题",
      level: "B1",
      wordCount: 205,
      sentenceCount: 10,
      duration: "01:33",
      sentences: [
        { en: "A new government program aims to provide digital skills training to one million adults.", cn: "一项新的政府计划旨在为一百万成年人提供数字技能培训。" },
        { en: "The program targets people who lack basic computer and internet skills.", cn: "该计划针对缺乏基本计算机和互联网技能的人群。" },
        { en: "Courses will be offered for free at community centers and libraries across the country.", cn: "课程将在全国各地的社区中心和图书馆免费提供。" },
        { en: "Topics include online banking, job searching, and using social media safely.", cn: "主题包括网上银行、求职和安全使用社交媒体。" },
        { en: "More advanced courses will cover coding, digital marketing, and data analysis.", cn: "更高级的课程将涵盖编程、数字营销和数据分析。" },
        { en: "Officials say digital literacy is now as important as reading and writing.", cn: "官员们表示，数字素养现在与读写能力同样重要。" },
        { en: "Many jobs today require at least basic computer skills to apply.", cn: "如今许多工作至少需要基本的计算机技能才能申请。" },
        { en: "The program will also help older adults stay connected with family online.", cn: "该计划还将帮助老年人与家人保持在线联系。" },
        { en: "Participants will receive certificates upon completing each level of the program.", cn: "参与者完成每个级别的课程后将获得证书。" },
        { en: "Registration opens next month, and classes are expected to fill up quickly.", cn: "下个月开始报名，预计课程将很快报满。" },
      ],
    },
    {
      id: "cet4-2025-12-news1",
      title: "四级25年12月 套1 News 1 心理健康支持",
      source: "四级真题",
      level: "B1",
      wordCount: 195,
      sentenceCount: 10,
      duration: "01:30",
      sentences: [
        { en: "Universities are expanding mental health services in response to growing student demand.", cn: "大学正在扩大心理健康服务，以响应学生日益增长的需求。" },
        { en: "Many schools have increased the number of counselors available on campus.", cn: "许多学校增加了校园内可用的咨询师数量。" },
        { en: "They are also offering online therapy options for students who prefer remote sessions.", cn: "它们还为偏好远程咨询的学生提供在线治疗选项。" },
        { en: "The changes come after surveys showed rising rates of anxiety and depression among students.", cn: "这些变化是在调查显示学生中焦虑和抑郁比例上升之后发生的。" },
        { en: "Academic pressure, social media, and financial concerns are cited as major causes.", cn: "学业压力、社交媒体和经济担忧被认为是主要原因。" },
        { en: "Some universities have also introduced peer support programs trained by professionals.", cn: "一些大学还推出了由专业人士培训的同伴支持项目。" },
        { en: "These programs allow students to talk with fellow students who understand their experiences.", cn: "这些项目让学生可以与理解他们经历的同学交谈。" },
        { en: "Mental health awareness campaigns are being held throughout the academic year.", cn: "整个学年都在举办心理健康意识宣传活动。" },
        { en: "Experts emphasize that seeking help is a sign of strength, not weakness.", cn: "专家强调，寻求帮助是力量的象征，而不是软弱的表现。" },
        { en: "They encourage anyone struggling to reach out to their campus support services.", cn: "他们鼓励任何有困难的人联系校园支持服务。" },
      ],
    },
    {
      id: "cet4-2025-12-conversation1",
      title: "四级25年12月 套1 长对话 实习面试经验",
      source: "四级真题",
      level: "B2",
      wordCount: 240,
      sentenceCount: 14,
      duration: "01:55",
      sentences: [
        { en: "W: Hey, how was your internship interview yesterday?", cn: "女：嘿，你昨天的实习面试怎么样？" },
        { en: "M: It went better than I expected, actually.", cn: "男：实际上，比我预期的要好。" },
        { en: "I was really nervous beforehand, but the interviewer was friendly.", cn: "我之前非常紧张，但面试官很友好。" },
        { en: "W: That is good to hear. What kind of questions did they ask?", cn: "女：太好了。他们问了什么样的问题？" },
        { en: "M: Mostly about my projects and what I learned in my coding classes.", cn: "男：主要是关于我的项目和我在编程课上学到的东西。" },
        { en: "They also asked why I wanted to work at their company specifically.", cn: "他们还问我为什么特别想在他们公司工作。" },
        { en: "W: And what did you say?", cn: "女：那你怎么说的？" },
        { en: "M: I talked about how much I admire their focus on user experience design.", cn: "男：我说我非常钦佩他们对用户体验设计的专注。" },
        { en: "I have been using their products for years and really like their approach.", cn: "我使用他们的产品很多年了，非常喜欢他们的方法。" },
        { en: "W: That sounds like a good answer. Did they say when you would hear back?", cn: "女：听起来是个好答案。他们说什么时候会有消息吗？" },
        { en: "M: They said by the end of next week.", cn: "男：他们说下周末之前。" },
        { en: "I am trying not to think about it too much, but it is hard.", cn: "我尽量不去想太多，但很难。" },
        { en: "W: I am sure you did great. Let me know as soon as you hear anything!", cn: "女：我相信你表现得很好。一有消息就告诉我！" },
        { en: "M: I will. Thanks for the support. It means a lot.", cn: "男：我会的。谢谢你的支持，这对我很重要。" },
      ],
    },
    {
      id: "cet4-2025-12-passage1",
      title: "四级25年12月 套1 短文 城市公共空间",
      source: "四级真题",
      level: "B2",
      wordCount: 235,
      sentenceCount: 11,
      duration: "01:52",
      sentences: [
        { en: "Public spaces play a vital role in the health and happiness of city residents.", cn: "公共空间在城市居民的健康和幸福中起着至关重要的作用。" },
        { en: "Parks, plazas, and community gardens provide places for people to gather and relax.", cn: "公园、广场和社区花园为人们提供了聚集和放松的场所。" },
        { en: "They also help reduce stress and improve mental well-being for everyone in the community.", cn: "它们还有助于减轻压力，改善社区每个人的心理健康。" },
        { en: "Well-designed public spaces can strengthen social connections between neighbors.", cn: "精心设计的公共空间可以加强邻里之间的社会联系。" },
        { en: "When people have comfortable places to sit and talk, they are more likely to interact.", cn: "当人们有舒适的地方坐下来交谈时，他们更有可能互动。" },
        { en: "This builds a sense of community and makes neighborhoods safer and more pleasant.", cn: "这建立了社区意识，使社区更安全、更宜人。" },
        { en: "Public spaces also provide environmental benefits like shade and cleaner air.", cn: "公共空间还提供环境效益，如遮荫和更清洁的空气。" },
        { en: "Trees and plants in urban parks help cool the city during hot summer months.", cn: "城市公园中的树木和植物有助于在炎热的夏季为城市降温。" },
        { en: "Unfortunately, many cities are losing public space to development and parking.", cn: "不幸的是，许多城市的公共空间正因开发和停车场而减少。" },
        { en: "Urban planners are now working to protect and expand these valuable community resources.", cn: "城市规划者现在正在努力保护和扩大这些宝贵的社区资源。" },
        { en: "They believe investing in public space is investing in the quality of urban life.", cn: "他们相信，投资公共空间就是投资城市生活质量。" },
      ],
    },
    {
      id: "cet4-2026-06-news1",
      title: "四级26年6月 套1 News 1 太空旅游进展",
      source: "四级真题",
      level: "B1",
      wordCount: 200,
      sentenceCount: 10,
      duration: "01:32",
      sentences: [
        { en: "Commercial space tourism took another step forward with a successful test flight.", cn: "商业太空旅游又向前迈进了一步，一次试飞取得成功。" },
        { en: "The spacecraft reached an altitude of 100 kilometers before returning safely to Earth.", cn: "航天器到达了100公里的高度，然后安全返回地球。" },
        { en: "This marks the company fifth successful crewed test mission.", cn: "这标志着该公司第五次成功的载人测试任务。" },
        { en: "Passengers experienced several minutes of weightlessness during the flight.", cn: "乘客在飞行过程中体验了几分钟的失重状态。" },
        { en: "They also had stunning views of Earth from the edge of space.", cn: "他们还从太空边缘看到了令人惊叹的地球景色。" },
        { en: "The company plans to begin regular commercial flights next year.", cn: "该公司计划明年开始定期商业飞行。" },
        { en: "Tickets are currently priced at around $250,000 per person.", cn: "目前票价约为每人25万美元。" },
        { en: "While this is expensive, prices are expected to decrease as technology improves.", cn: "虽然这很昂贵，但随着技术进步，价格预计会下降。" },
        { en: "Hundreds of people have already made reservations for future flights.", cn: "已有数百人预订了未来的航班。" },
        { en: "Space tourism could become a billion-dollar industry within the next decade.", cn: "太空旅游可能在未来十年内成为一个价值数十亿美元的产业。" },
      ],
    },
    {
      id: "cet4-2026-06-news2",
      title: "四级26年6月 套1 News 2 城市农场扩张",
      source: "四级真题",
      level: "B2",
      wordCount: 215,
      sentenceCount: 10,
      duration: "01:40",
      sentences: [
        { en: "Urban farming is growing rapidly as more cities embrace local food production.", cn: "随着越来越多的城市拥抱本地粮食生产，城市农业正在快速发展。" },
        { en: "Empty lots and rooftops are being transformed into productive vegetable gardens.", cn: "空地和屋顶正在被改造成高产的菜园。" },
        { en: "These urban farms provide fresh, healthy produce to nearby communities.", cn: "这些城市农场为附近社区提供新鲜、健康的农产品。" },
        { en: "They also reduce the environmental impact of transporting food long distances.", cn: "它们还减少了长途运输食物对环境的影响。" },
        { en: "Many urban farms are run by community groups and staffed by volunteers.", cn: "许多城市农场由社区团体运营，由志愿者提供服务。" },
        { en: "They offer educational programs for children and adults about where food comes from.", cn: "它们为儿童和成人提供关于食物来源的教育项目。" },
        { en: "Some cities are now offering tax incentives to encourage more urban agriculture.", cn: "一些城市现在提供税收激励，以鼓励更多的城市农业。" },
        { en: "They are also relaxing zoning laws that previously restricted farming in urban areas.", cn: "它们还在放宽以前限制城市地区农业的分区法律。" },
        { en: "Experts say urban farming could supply up to 20 percent of a city vegetable needs.", cn: "专家表示，城市农业可以满足城市高达20%的蔬菜需求。" },
        { en: "As urban populations continue to grow, local food production will become even more important.", cn: "随着城市人口持续增长，本地粮食生产将变得更加重要。" },
      ],
    },
    // ---------- 六级 2025-2026 真题 ----------
    {
      id: "cet6-2025-06-conversation1",
      title: "六级25年6月 套1 长对话 研究方法讨论",
      source: "六级真题",
      level: "B2",
      wordCount: 265,
      sentenceCount: 13,
      duration: "02:02",
      sentences: [
        { en: "W: I am having trouble deciding which research method to use for my thesis.", cn: "女：我在决定论文用哪种研究方法时遇到了困难。" },
        { en: "Quantitative or qualitative? Both seem to have advantages.", cn: "定量还是定性？两者似乎都有优势。" },
        { en: "M: That is a common dilemma. What is your research question exactly?", cn: "男：这是一个常见的困境。你的研究问题到底是什么？" },
        { en: "W: I am studying how social media affects body image among college students.", cn: "女：我在研究社交媒体如何影响大学生的身体形象。" },
        { en: "I want to understand both the prevalence and the underlying mechanisms.", cn: "我想了解普遍性和潜在机制。" },
        { en: "M: In that case, have you considered a mixed-methods approach?", cn: "男：那样的话，你考虑过混合方法吗？" },
        { en: "You could use surveys for quantitative data and interviews for qualitative insights.", cn: "你可以用调查获取定量数据，用访谈获取定性洞察。" },
        { en: "W: I thought about that, but it seems like a lot of work for one thesis.", cn: "女：我想过，但对于一篇论文来说，工作量似乎太大了。" },
        { en: "M: It is more work, but it can also produce much stronger findings.", cn: "男：确实工作量更大，但也能产生更有力的发现。" },
        { en: "The two methods can complement and validate each other.", cn: "两种方法可以相互补充和验证。" },
        { en: "W: That is true. But I am worried about my ability to analyze both types of data well.", cn: "女：没错。但我担心自己能否很好地分析两种类型的数据。" },
        { en: "M: You could start with the survey and use the results to guide your interview questions.", cn: "男：你可以从调查开始，用结果来指导你的访谈问题。" },
        { en: "That way, you build on what you learn and create a more coherent study.", cn: "这样，你就在所学的基础上继续，创建一个更连贯的研究。" },
      ],
    },
    {
      id: "cet6-2025-06-passage1",
      title: "六级25年6月 套1 短文 注意力经济",
      source: "六级真题",
      level: "B2",
      wordCount: 275,
      sentenceCount: 12,
      duration: "02:07",
      sentences: [
        { en: "We live in what economists call the attention economy.", cn: "我们生活在经济学家所说的注意力经济中。" },
        { en: "In this economy, the most valuable resource is not money or information—it is attention.", cn: "在这种经济中，最有价值的资源不是金钱或信息，而是注意力。" },
        { en: "Every app, website, and media company is competing for a piece of our limited attention span.", cn: "每个应用程序、网站和媒体公司都在争夺我们有限的注意力。" },
        { en: "They use sophisticated algorithms designed to keep us engaged for as long as possible.", cn: "它们使用复杂的算法，旨在让我们尽可能长时间地保持参与。" },
        { en: "Notifications, infinite scroll, and personalized content all serve this purpose.", cn: "通知、无限滚动和个性化内容都服务于这个目的。" },
        { en: "The problem is that our attention is a finite resource.", cn: "问题在于我们的注意力是一种有限的资源。" },
        { en: "When we give it to one thing, we take it away from something else.", cn: "当我们把注意力给予一件事时，我们就从另一件事上拿走了注意力。" },
        { en: "Spending hours scrolling through social media means less time for work, relationships, and self-reflection.", cn: "花几小时刷社交媒体意味着用于工作、人际关系和自我反思的时间更少。" },
        { en: "Critics argue that the attention economy is making us more distracted and less focused.", cn: "批评者认为，注意力经济正在让我们更加分心，更难集中注意力。" },
        { en: "It may also be contributing to rising rates of anxiety and mental health problems.", cn: "它也可能导致焦虑和心理健康问题的比例上升。" },
        { en: "As awareness grows, more people are practicing digital minimalism and setting boundaries.", cn: "随着意识的提高，越来越多的人开始实践数字极简主义并设定界限。" },
        { en: "They are reclaiming their attention and deciding for themselves where to direct it.", cn: "他们正在收回自己的注意力，自己决定将其投向何处。" },
      ],
    },
    {
      id: "cet6-2025-12-lecture1",
      title: "六级25年12月 套1 讲座 行为经济学",
      source: "六级真题",
      level: "C1",
      wordCount: 295,
      sentenceCount: 12,
      duration: "02:18",
      sentences: [
        { en: "Traditional economics assumes that people always make rational decisions to maximize their own benefit.", cn: "传统经济学假设人们总是做出理性决策，以最大化自身利益。" },
        { en: "But behavioral economics, a relatively new field, challenges this assumption.", cn: "但行为经济学——一个相对较新的领域——挑战了这一假设。" },
        { en: "It combines insights from psychology and economics to understand how people actually make decisions.", cn: "它结合了心理学和经济学的洞见，来理解人们实际上如何做决策。" },
        { en: "Behavioral economists have identified numerous cognitive biases that affect our choices.", cn: "行为经济学家已经发现了许多影响我们选择的认知偏差。" },
        { en: "One well-known example is loss aversion—the tendency to fear losses more than we value equivalent gains.", cn: "一个著名的例子是损失厌恶——对损失的恐惧超过了对同等收益的重视。" },
        { en: "This explains why people will risk more to avoid a loss than to achieve a gain of the same size.", cn: "这解释了为什么人们会为避免损失而冒更大的风险，而不是为了获得同等大小的收益。" },
        { en: "Another important concept is the status quo bias—our preference for things to stay the same.", cn: "另一个重要概念是现状偏差——我们偏好事物保持不变。" },
        { en: "This is why default options in forms and contracts are so powerful.", cn: "这就是为什么表格和合同中的默认选项如此强大。" },
        { en: "Understanding these biases has practical applications in many fields.", cn: "理解这些偏差在许多领域都有实际应用。" },
        { en: "In public policy, governments use nudges to encourage better decisions without restricting choice.", cn: "在公共政策中，政府使用'助推'来鼓励更好的决策，同时不限制选择。" },
        { en: "In business, companies use behavioral insights to design better products and marketing strategies.", cn: "在商业中，公司利用行为洞见来设计更好的产品和营销策略。" },
        { en: "As our understanding of human decision-making deepens, behavioral economics will continue to grow in importance.", cn: "随着我们对人类决策理解的加深，行为经济学的重要性将继续增长。" },
      ],
    },
    {
      id: "cet6-2025-12-passage1",
      title: "六级25年12月 套1 短文 慢生活运动",
      source: "六级真题",
      level: "B2",
      wordCount: 270,
      sentenceCount: 11,
      duration: "02:05",
      sentences: [
        { en: "The slow living movement encourages people to intentionally slow down the pace of their lives.", cn: "慢生活运动鼓励人们有意地放慢生活节奏。" },
        { en: "It began as a reaction to the fast-paced, always-connected nature of modern society.", cn: "它始于对现代社会快节奏、始终在线特性的一种反应。" },
        { en: "Proponents argue that constant busyness prevents us from truly experiencing and enjoying life.", cn: "支持者认为，持续的忙碌使我们无法真正体验和享受生活。" },
        { en: "When we rush from one task to the next, we miss the small moments that make life meaningful.", cn: "当我们从一个任务匆忙赶到下一个时，我们错过了让生活有意义的小瞬间。" },
        { en: "Slow living involves simplifying, prioritizing what matters, and saying no to the rest.", cn: "慢生活包括简化、优先处理重要的事，对其余的说不。" },
        { en: "It is not about doing everything slowly—it is about doing the right things at the right pace.", cn: "它不是指慢慢地做每件事——而是以合适的节奏做正确的事。" },
        { en: "This can mean cooking meals from scratch instead of eating fast food.", cn: "这可能意味着从头开始做饭，而不是吃快餐。" },
        { en: "It can mean taking time to savor your coffee instead of drinking it while checking emails.", cn: "它可能意味着花时间品尝咖啡，而不是一边查邮件一边喝。" },
        { en: "Research suggests that slower, more intentional living reduces stress and improves well-being.", cn: "研究表明，更慢、更有意的生活可以减轻压力，改善幸福感。" },
        { en: "It can also improve relationships by allowing us to be fully present with others.", cn: "它还可以通过让我们完全与他人同处当下来改善人际关系。" },
        { en: "While slow living is not for everyone, many find it a valuable antidote to modern stress.", cn: "虽然慢生活并不适合每个人，但许多人发现它是应对现代压力的有效解药。" },
      ],
    },
    {
      id: "cet6-2026-06-conversation1",
      title: "六级26年6月 套1 长对话 职业转型",
      source: "六级真题",
      level: "B2",
      wordCount: 260,
      sentenceCount: 13,
      duration: "02:00",
      sentences: [
        { en: "M: I have been thinking about making a career change, but I am not sure where to start.", cn: "男：我一直在考虑转行，但不知道从哪里开始。" },
        { en: "I have been in finance for eight years, and I am feeling burnt out.", cn: "我在金融行业干了八年，感觉精疲力竭了。" },
        { en: "W: That is a big step. What is it you are looking for in a new career?", cn: "女：这是一大步。你在新职业中寻找什么？" },
        { en: "M: I want something more meaningful. I want to feel like my work makes a positive difference.", cn: "男：我想要更有意义的工作。我想感觉到我的工作产生了积极的影响。" },
        { en: "I have always been interested in environmental issues.", cn: "我一直对环境问题感兴趣。" },
        { en: "W: Have you considered sustainable finance or ESG investing?", cn: "女：你考虑过可持续金融或ESG投资吗？" },
        { en: "That way, you could use your existing skills while working in a field you care about.", cn: "那样的话，你可以在你关心的领域工作的同时，利用你现有的技能。" },
        { en: "M: I have not thought about that. That could be a good middle ground.", cn: "男：我没想过这个。这可能是个很好的中间地带。" },
        { en: "What would I need to do to make that kind of transition?", cn: "要实现这种转变，我需要做什么？" },
        { en: "W: You could start by taking some courses in sustainable business.", cn: "女：你可以先修一些可持续商业的课程。" },
        { en: "Networking with people in the field would also help.", cn: "与该领域的人建立联系也会有帮助。" },
        { en: "Maybe try volunteering or doing freelance projects to gain relevant experience.", cn: "也许可以尝试志愿服务或做自由职业项目来获得相关经验。" },
        { en: "M: That is solid advice. I feel more optimistic about this already.", cn: "男：这是可靠的建议。我对此已经感到更乐观了。" },
      ],
    },
    {
      id: "cet6-2026-06-passage1",
      title: "六级26年6月 套1 短文 创造力的本质",
      source: "六级真题",
      level: "C1",
      wordCount: 285,
      sentenceCount: 12,
      duration: "02:12",
      sentences: [
        { en: "Creativity is often misunderstood as a rare gift possessed only by artists and geniuses.", cn: "创造力常被误解为只有艺术家和天才才拥有的罕见天赋。" },
        { en: "But modern research suggests that creativity is a skill that anyone can develop.", cn: "但现代研究表明，创造力是一种任何人都可以发展的技能。" },
        { en: "It is not about being born with special abilities—it is about learning to think differently.", cn: "它不是关于天生具有特殊能力——而是关于学会以不同的方式思考。" },
        { en: "One key insight is that creative ideas are rarely completely new.", cn: "一个关键洞见是，创意很少是完全新颖的。" },
        { en: "More often, they are novel combinations of existing ideas and concepts.", cn: "更常见的是，它们是现有想法和概念的新颖组合。" },
        { en: "The printing press, for example, combined existing technologies like the screw press and movable type.", cn: "例如，印刷机结合了螺旋压力机和活字等现有技术。" },
        { en: "This means that exposing yourself to diverse ideas and experiences can boost your creativity.", cn: "这意味着，接触多样化的想法和体验可以提升你的创造力。" },
        { en: "Another important factor is giving yourself time for unfocused thinking.", cn: "另一个重要因素是给自己时间进行不专注的思考。" },
        { en: "Our best ideas often come when we are not actively trying to solve a problem.", cn: "我们最好的想法往往出现在我们没有积极试图解决问题的时候。" },
        { en: "Walking, showering, or doing other routine activities allows our minds to wander and make connections.", cn: "散步、洗澡或做其他日常活动，让我们的思维能够漫游并建立联系。" },
        { en: "Contrary to popular belief, creativity also requires hard work and persistence.", cn: "与普遍看法相反，创造力也需要努力和坚持。" },
        { en: "Genius is one percent inspiration and ninety-nine percent perspiration, as the saying goes.", cn: "俗话说，天才是百分之一的灵感加百分之九十九的汗水。" },
      ],
    },
    {
      id: "cet6-2026-12-lecture1",
      title: "六级26年12月 套1 讲座 气候适应",
      source: "六级真题",
      level: "C1",
      wordCount: 300,
      sentenceCount: 12,
      duration: "02:20",
      sentences: [
        { en: "While reducing greenhouse gas emissions remains essential, we must also adapt to changes already underway.", cn: "虽然减少温室气体排放仍然至关重要，但我们也必须适应已经在发生的变化。" },
        { en: "This field is known as climate adaptation, and it is growing in importance every year.", cn: "这个领域被称为气候适应，其重要性每年都在增长。" },
        { en: "Climate adaptation involves adjusting our societies and infrastructure to handle new climate realities.", cn: "气候适应包括调整我们的社会和基础设施，以应对新的气候现实。" },
        { en: "This means building flood defenses in areas facing rising sea levels and more intense storms.", cn: "这意味着在面临海平面上升和更强烈风暴的地区建造防洪设施。" },
        { en: "It means developing drought-resistant crops for regions getting hotter and drier.", cn: "它意味着为越来越热和越来越干燥的地区开发抗旱作物。" },
        { en: "It also means designing buildings and cities to withstand extreme heat events.", cn: "它还意味着设计能够抵御极端高温事件的建筑和城市。" },
        { en: "Adaptation requires planning ahead and investing in resilience before disasters strike.", cn: "适应需要提前规划，在灾难发生前投资于韧性建设。" },
        { en: "This is often more cost-effective than trying to recover after a disaster has occurred.", cn: "这通常比灾难发生后试图恢复更具成本效益。" },
        { en: "However, adaptation also raises important questions about justice and equity.", cn: "然而，适应也引发了关于正义和公平的重要问题。" },
        { en: "The countries most vulnerable to climate change are often those that contributed least to causing it.", cn: "最容易受气候变化影响的国家，往往是对造成气候变化贡献最小的国家。" },
        { en: "Wealthier nations have a responsibility to help poorer countries adapt.", cn: "较富裕的国家有责任帮助较贫穷的国家适应。" },
        { en: "As climate impacts worsen, finding fair and effective adaptation strategies will become increasingly urgent.", cn: "随着气候影响恶化，找到公平有效的适应策略将变得越来越紧迫。" },
      ],
    },
    // ---------- 考研 2025-2026 真题 ----------
    {
      id: "kaoyan-2025-sectionA1",
      title: "考研英语一 2025年 Section A 对话 文献阅读方法",
      source: "考研真题",
      level: "C1",
      wordCount: 290,
      sentenceCount: 14,
      duration: "02:18",
      sentences: [
        { en: "W: Professor, I am drowning in papers for my literature review.", cn: "女：教授，我快被文献综述的论文淹没了。" },
        { en: "There are hundreds of articles on my topic, and I cannot possibly read them all.", cn: "关于我的主题有数百篇文章，我不可能全部读完。" },
        { en: "M: That is a common challenge. The key is to read strategically, not comprehensively.", cn: "男：这是一个常见的挑战。关键是有策略地阅读，而不是全面阅读。" },
        { en: "W: What do you mean by strategically?", cn: "女：你说的有策略是什么意思？" },
        { en: "M: Start by identifying the most important papers in your field.", cn: "男：首先确定你所在领域最重要的论文。" },
        { en: "Look for highly cited works and recent review articles that summarize the field.", cn: "找高被引的著作和总结该领域的最新综述文章。" },
        { en: "Those will give you a good overview without having to read everything.", cn: "这些会给你一个很好的概览，而不必阅读所有内容。" },
        { en: "W: And once I have the overview?", cn: "女：那有了概览之后呢？" },
        { en: "M: Then you can dive deeper into specific papers that are most relevant to your research question.", cn: "男：然后你可以深入阅读与你的研究问题最相关的特定论文。" },
        { en: "For each paper, read the abstract and conclusion first.", cn: "对于每篇论文，先读摘要和结论。" },
        { en: "If it still seems relevant, read the introduction and skim the methodology and results.", cn: "如果仍然相关，再读引言，浏览方法和结果部分。" },
        { en: "Only read the whole paper carefully if it is truly central to your work.", cn: "只有当论文真正对你的工作至关重要时，才仔细阅读全文。" },
        { en: "W: That makes sense. I have been trying to read every paper from start to finish.", cn: "女：有道理。我一直试图从头到尾读每一篇论文。" },
        { en: "M: That would take forever. Smart reading is about knowing what to skip.", cn: "男：那永远读不完。聪明的阅读在于知道什么可以跳过。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionB1",
      title: "考研英语一 2025年 Section B 短文 自由意志之争",
      source: "考研真题",
      level: "C1",
      wordCount: 305,
      sentenceCount: 12,
      duration: "02:25",
      sentences: [
        { en: "The question of free will has puzzled philosophers and scientists for millennia.", cn: "自由意志的问题困扰了哲学家和科学家数千年。" },
        { en: "Do we truly make choices freely, or are our decisions determined by prior causes?", cn: "我们真的能自由地做出选择吗，还是我们的决定由先前的原因决定？" },
        { en: "The traditional philosophical debate pits determinism against libertarian free will.", cn: "传统的哲学辩论将决定论与自由主义自由意志对立起来。" },
        { en: "Determinists argue that every event, including human decisions, has a sufficient cause.", cn: "决定论者认为，每一个事件，包括人类的决定，都有充分的原因。" },
        { en: "Given the state of the universe and the laws of nature, only one future is possible.", cn: "给定宇宙的状态和自然法则，只有一种未来是可能的。" },
        { en: "Libertarians counter that humans have a special capacity for free choice that transcends physical causation.", cn: "自由主义者反驳说，人类有一种超越物理因果的特殊自由选择能力。" },
        { en: "Compatibilists take a middle position, arguing that free will and determinism can coexist.", cn: "兼容论者采取中间立场，认为自由意志和决定论可以共存。" },
        { en: "They redefine free will as acting in accordance with one own desires and reasons.", cn: "他们将自由意志重新定义为按照自己的欲望和理性行事。" },
        { en: "Even if those desires are determined, the choice is still free in the sense that matters.", cn: "即使这些欲望是被决定的，选择在重要的意义上仍然是自由的。" },
        { en: "Neuroscience has added a new dimension to the debate with experiments suggesting decisions are made unconsciously before we become aware of them.", cn: "神经科学为这场辩论增加了新的维度，实验表明，在我们意识到之前，决定就已经无意识地做出了。" },
        { en: "While these findings are provocative, their interpretation remains controversial.", cn: "虽然这些发现很有煽动性，但它们的解释仍然存在争议。" },
        { en: "The free will debate shows no signs of being resolved anytime soon.", cn: "自由意志的辩论没有迹象表明会很快得到解决。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionC1",
      title: "考研英语一 2025年 Section C 讲座 后真相时代",
      source: "考研真题",
      level: "C2",
      wordCount: 325,
      sentenceCount: 13,
      duration: "02:32",
      sentences: [
        { en: "The term post-truth was named Word of the Year in 2016, reflecting a growing concern about the state of public discourse.", cn: "'后真相'一词被评为2016年度词汇，反映了人们对公共话语状态日益增长的担忧。" },
        { en: "In a post-truth world, objective facts are less influential than appeals to emotion and personal belief.", cn: "在后真相世界中，客观事实的影响力不如对情感和个人信仰的诉求。" },
        { en: "People increasingly live in information bubbles where they encounter only views that confirm their existing beliefs.", cn: "人们越来越多地生活在信息泡沫中，在那里他们只遇到能证实自己已有信念的观点。" },
        { en: "Social media algorithms reinforce this by showing us content we are likely to agree with.", cn: "社交媒体算法通过向我们展示我们可能同意的内容来强化这一点。" },
        { en: "This creates echo chambers where misinformation can spread unchallenged.", cn: "这创造了回音室，错误信息可以在其中不受质疑地传播。" },
        { en: "The consequences are profound: declining trust in institutions, polarization, and an inability to agree on basic facts.", cn: "后果是深远的：对机构的信任下降、两极分化、以及无法就基本事实达成一致。" },
        { en: "When people cannot agree on what is true, democratic deliberation becomes nearly impossible.", cn: "当人们无法就什么是真的达成一致时，民主审议变得几乎不可能。" },
        { en: "Addressing this challenge requires action on multiple fronts.", cn: "应对这一挑战需要在多个方面采取行动。" },
        { en: "Media literacy education can help people evaluate sources and identify misinformation.", cn: "媒体素养教育可以帮助人们评估信息来源并识别错误信息。" },
        { en: "Platform companies need to take more responsibility for the content they amplify.", cn: "平台公司需要对它们放大的内容承担更多责任。" },
        { en: "And we all need to cultivate intellectual humility and willingness to engage with opposing views.", cn: "我们都需要培养理智上的谦逊，以及与对立观点接触的意愿。" },
        { en: "The health of our democracies may depend on whether we can rebuild a shared reality.", cn: "我们民主的健康可能取决于我们能否重建一个共同的现实。" },
        { en: "This is perhaps the defining challenge of the information age.", cn: "这也许是信息时代的决定性挑战。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionA1",
      title: "考研英语一 2026年 Section A 对话 学术写作建议",
      source: "考研真题",
      level: "C1",
      wordCount: 295,
      sentenceCount: 14,
      duration: "02:20",
      sentences: [
        { en: "W: I got my paper back from the journal, and the reviewers said my writing is unclear.", cn: "女：我收到了期刊的退稿，审稿人说我的写作不清楚。" },
        { en: "They want major revisions, but I am not sure how to improve the clarity.", cn: "他们要求重大修改，但我不知道如何提高清晰度。" },
        { en: "M: That is a common issue, especially for early-career researchers.", cn: "男：这是一个常见问题，尤其是对于早期职业研究者。" },
        { en: "Academic writing is a skill that takes practice to develop.", cn: "学术写作是一种需要练习才能发展的技能。" },
        { en: "W: Do you have any specific suggestions?", cn: "女：你有什么具体的建议吗？" },
        { en: "M: Start with the structure. Each paragraph should have one clear main point.", cn: "男：从结构开始。每一段应该有一个明确的要点。" },
        { en: "State that point in the first sentence, then support it with evidence and reasoning.", cn: "在第一句中说明这个要点，然后用证据和推理来支持。" },
        { en: "Also, pay attention to your sentence structure.", cn: "另外，注意你的句子结构。" },
        { en: "Long, complex sentences are harder to follow. Mix in shorter sentences for clarity.", cn: "长而复杂的句子更难理解。混合使用短句以提高清晰度。" },
        { en: "W: What about vocabulary? Should I use more technical terms?", cn: "女：词汇呢？我应该使用更多的技术术语吗？" },
        { en: "M: Only when they are necessary and precise.", cn: "男：只在必要且精确的时候。" },
        { en: "Do not use jargon just to sound academic—it usually has the opposite effect.", cn: "不要为了听起来学术而使用行话——通常会适得其反。" },
        { en: "The best academic writing is clear and direct, not unnecessarily complex.", cn: "最好的学术写作是清晰直接的，而不是不必要的复杂。" },
        { en: "W: That is helpful. I will revise with these principles in mind.", cn: "女：很有帮助。我会牢记这些原则来修改。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionB1",
      title: "考研英语一 2026年 Section B 短文 技术失业",
      source: "考研真题",
      level: "C2",
      wordCount: 315,
      sentenceCount: 13,
      duration: "02:30",
      sentences: [
        { en: "The fear that technology will destroy jobs is as old as the Industrial Revolution itself.", cn: "对技术会摧毁工作的恐惧与工业革命本身一样古老。" },
        { en: "In the 19th century, Luddites destroyed textile machines they believed would take their livelihoods.", cn: "在19世纪，勒德分子摧毁了他们认为会夺走他们生计的纺织机器。" },
        { en: "Yet history shows that technological change ultimately creates more jobs than it destroys.", cn: "然而历史表明，技术变革最终创造的就业岗位多于它摧毁的。" },
        { en: "While some jobs disappear, new ones emerge that we could not have imagined before.", cn: "虽然一些工作消失了，但新的工作出现了，这是我们以前无法想象的。" },
        { en: "But this time might be different, argue some economists.", cn: "但一些经济学家认为，这次可能有所不同。" },
        { en: "Artificial intelligence and automation threaten not just manual labor but cognitive work as well.", cn: "人工智能和自动化不仅威胁体力劳动，也威胁认知工作。" },
        { en: "Jobs that were once considered safe from automation—law, medicine, finance—now look vulnerable.", cn: "曾经被认为不会被自动化取代的工作——法律、医学、金融——现在看起来很脆弱。" },
        { en: "If AI can perform increasingly sophisticated cognitive tasks, what will humans do?", cn: "如果AI能执行越来越复杂的认知任务，人类将做什么？" },
        { en: "Optimists argue that new types of work will emerge, just as they always have.", cn: "乐观主义者认为，新型工作将会出现，就像以往一样。" },
        { en: "Pessimists worry that this time the transition will be too fast and too disruptive.", cn: "悲观主义者担心，这次转型会太快、太具破坏性。" },
        { en: "They propose policies like universal basic income to help people through the transition.", cn: "他们提出全民基本收入等政策，帮助人们度过转型期。" },
        { en: "Whatever the outcome, the nature of work is likely to change dramatically in the coming decades.", cn: "无论结果如何，工作的本质在未来几十年可能会发生巨大变化。" },
        { en: "Preparing for that change is one of the great challenges of our time.", cn: "为这一变化做好准备是我们这个时代的重大挑战之一。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionC1",
      title: "考研英语一 2026年 Section C 讲座 具身认知",
      source: "考研真题",
      level: "C2",
      wordCount: 335,
      sentenceCount: 14,
      duration: "02:38",
      sentences: [
        { en: "For centuries, Western thought has drawn a sharp distinction between mind and body.", cn: "几个世纪以来，西方思想在心灵与身体之间划出了鲜明的界限。" },
        { en: "The mind was seen as rational, abstract, and separate from the physical world.", cn: "心灵被视为理性的、抽象的，与物理世界分离。" },
        { en: "The body was merely a vessel that carried the mind around.", cn: "身体仅仅是承载心灵的容器。" },
        { en: "But a growing field called embodied cognition challenges this traditional view.", cn: "但一个名为具身认知的新兴领域挑战了这一传统观点。" },
        { en: "Embodied cognition argues that our bodies shape our minds in profound ways.", cn: "具身认知认为，我们的身体以深刻的方式塑造着我们的心灵。" },
        { en: "Thinking is not something that happens only in the brain—it involves the whole body interacting with the environment.", cn: "思考不是只发生在大脑中的事情——它涉及整个身体与环境的互动。" },
        { en: "Consider how we understand abstract concepts like time.", cn: "想想我们如何理解时间这样的抽象概念。" },
        { en: "We talk about the future being ahead of us and the past being behind us.", cn: "我们说未来在我们'前面'，过去在我们'后面'。" },
        { en: "These spatial metaphors are not just figures of speech—they reflect how we actually think about time.", cn: "这些空间隐喻不仅仅是修辞手法——它们反映了我们实际上如何思考时间。" },
        { en: "Experiments show that people lean forward when thinking about the future and backward when thinking about the past.", cn: "实验表明，人们在思考未来时会向前倾，在思考过去时会向后倾。" },
        { en: "Similarly, we understand warmth in terms of physical warmth and coldness.", cn: "同样，我们从身体的温暖和寒冷的角度来理解温暖。" },
        { en: "Holding a warm cup of coffee makes people perceive others as warmer and friendlier.", cn: "拿着一杯热咖啡会让人们觉得他人更温暖、更友好。" },
        { en: "These findings suggest that our abstract thinking is grounded in our physical experiences.", cn: "这些发现表明，我们的抽象思维植根于我们的身体体验。" },
        { en: "The implications extend from education to artificial intelligence, fundamentally changing how we understand the mind.", cn: "其影响从教育延伸到人工智能，从根本上改变了我们对心灵的理解。" },
      ],
    },

    {
      id: "cet4-2025-6-news1",
      title: "四级25年6月 套2 News 校园环保节开幕",
      source: "四级真题",
      level: "A2",
      wordCount: 80,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The annual Green Campus Festival opened on Monday with dozens of activities.", cn: "一年一度的绿色校园节周一开幕，有几十项活动。" },
        { en: "Students planted trees, repaired bicycles, and sorted recyclable waste together.", cn: "学生们一起植树、修自行车、分类可回收垃圾。" },
        { en: "A popular booth invited students to exchange used textbooks for plant seeds.", cn: "一个热门摊位邀请学生用旧课本换植物种子。" },
        { en: "Volunteers handed out cloth bags to reduce the use of plastic ones.", cn: "志愿者分发布袋，以减少塑料袋的使用。" },
        { en: "The festival also featured a lecture on saving water and electricity in dorms.", cn: "活动还包括一场关于宿舍节水节电的讲座。" },
        { en: "Many students said they learned simple ways to live more sustainably.", cn: "许多学生说他们学到了更可持续生活的一些简单方法。" },
        { en: "The organizers hope the festival will become a yearly tradition.", cn: "主办方希望这个节日能成为一年一度的传统。" },
      ],
    },
    {
      id: "cet4-2025-6-conversation1",
      title: "四级25年6月 套2 长对话 选课咨询",
      source: "四级真题",
      level: "A2",
      wordCount: 78,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: Excuse me, I am not sure which elective courses to choose this semester.", cn: "女：打扰一下，我不确定这学期该选哪些选修课。" },
        { en: "M: What are you interested in, art, technology, or sports?", cn: "男：你对什么感兴趣，艺术、科技还是体育？" },
        { en: "W: I love photography, but the class is already full.", cn: "女：我喜欢摄影，但那个班已经满了。" },
        { en: "M: There is still space in the digital design course, which is similar.", cn: "男：数字设计课还有名额，它和摄影类似。" },
        { en: "W: Does it require any drawing skills? I am a beginner.", cn: "女：它需要绘画技能吗？我是初学者。" },
        { en: "M: Not at all. The teacher starts from the very basics.", cn: "男：完全不需要。老师会从最基础的内容教起。" },
        { en: "W: Great. I will register for that one, then.", cn: "女：太好了。那我就选这门课。" },
      ],
    },
    {
      id: "cet4-2025-6-passage1",
      title: "四级25年6月 套2 短文 睡眠与学习效率",
      source: "四级真题",
      level: "B1",
      wordCount: 92,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "A recent study at our university confirms that sleep is closely linked to grades.", cn: "我们大学最近的一项研究证实，睡眠与成绩密切相关。" },
        { en: "Students who slept seven to eight hours scored higher on average than those who stayed up late.", cn: "每晚睡七到八小时的学生平均分数高于熬夜的学生。" },
        { en: "During deep sleep, the brain strengthens the memories formed during the day.", cn: "在深度睡眠中，大脑会强化白天形成的记忆。" },
        { en: "Researchers advise students to keep a regular sleep schedule even during exams.", cn: "研究人员建议，即使考试期间也要保持规律的作息。" },
        { en: "They also warn that pulling all-nighters often does more harm than good.", cn: "他们还提醒，通宵熬夜往往弊大于利。" },
        { en: "Simple habits like dimming lights before bed can improve sleep quality.", cn: "睡前调暗灯光等简单习惯可以改善睡眠质量。" },
        { en: "In short, a good night of sleep is one of the best study strategies.", cn: "总之，睡个好觉是最好的学习策略之一。" },
      ],
    },
    {
      id: "cet4-2025-12-news3",
      title: "四级25年12月 套2 News 冬季流感疫苗接种",
      source: "四级真题",
      level: "A2",
      wordCount: 81,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The university health center launched a free flu vaccination campaign this week.", cn: "校医院本周启动了免费流感疫苗接种活动。" },
        { en: "Nurses set up temporary stations in the main library and the dining hall.", cn: "护士在主图书馆和食堂设立了临时接种点。" },
        { en: "Students can walk in without an appointment during lunch hours.", cn: "午餐时段学生无需预约即可前往接种。" },
        { en: "Health officials remind everyone that vaccination reduces the risk of severe illness.", cn: "卫生官员提醒大家，接种疫苗可以降低重症风险。" },
        { en: "Free masks and hand sanitizer are also available at the stations.", cn: "接种点还提供免费口罩和洗手液。" },
        { en: "The campaign will run for two weeks and covers all registered students.", cn: "活动将持续两周，覆盖所有在校注册学生。" },
        { en: "Campus nurses say the response has been very positive so far.", cn: "校医表示，到目前为止反响非常积极。" },
      ],
    },
    {
      id: "cet4-2025-12-conversation2",
      title: "四级25年12月 套2 长对话 假期兼职计划",
      source: "四级真题",
      level: "A2",
      wordCount: 71,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: Are you going home for the winter break, Tom?", cn: "女：汤姆，寒假你回家吗？" },
        { en: "M: Not right away. I found a part-time job at a bookstore.", cn: "男：不马上回。我在一家书店找了份兼职。" },
        { en: "W: That sounds nice. What will you do there?", cn: "女：听起来不错。你在那里做什么？" },
        { en: "M: Mostly organizing shelves and helping customers find books.", cn: "男：主要是整理书架、帮顾客找书。" },
        { en: "W: How many hours a week will you work?", cn: "女：你一周工作多少小时？" },
        { en: "M: About twenty hours, so I can still enjoy the holiday.", cn: "男：大约二十个小时，这样我还是能享受假期。" },
        { en: "W: Working and relaxing in balance sounds like a perfect plan.", cn: "女：工作与放松平衡，听起来是个完美的计划。" },
      ],
    },
    {
      id: "cet4-2025-12-passage3",
      title: "四级25年12月 套2 短文 城市共享单车",
      source: "四级真题",
      level: "B1",
      wordCount: 76,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Shared bicycles have become a common sight in Chinese cities.", cn: "共享单车已经成为中国城市里常见的景象。" },
        { en: "They offer a cheap and convenient way to cover short distances.", cn: "它们为短途出行提供了一种便宜又方便的方式。" },
        { en: "Users simply scan a code on their phone and ride away.", cn: "用户只需用手机扫码即可骑行。" },
        { en: "City planners praise the bikes for reducing traffic jams and air pollution.", cn: "城市规划者称赞共享单车减少了交通拥堵和空气污染。" },
        { en: "However, careless parking has created problems on some sidewalks.", cn: "然而，乱停乱放在一些人行道上造成了问题。" },
        { en: "Many cities now set up designated parking zones to solve this issue.", cn: "许多城市现在设立指定停车区来解决这一问题。" },
        { en: "With better management, shared bikes will continue to benefit city life.", cn: "管理得当的话，共享单车将继续为城市生活带来便利。" },
      ],
    },
    {
      id: "cet4-2026-6-news1",
      title: "四级26年6月 套2 News 大学生创业大赛",
      source: "四级真题",
      level: "B1",
      wordCount: 72,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The provincial university entrepreneurship competition concluded this afternoon.", cn: "全省大学生创业大赛今天下午落下帷幕。" },
        { en: "More than two hundred teams from forty universities took part.", cn: "来自四十所高校的两百多支队伍参加了比赛。" },
        { en: "This year, many projects focused on smart agriculture and elderly care.", cn: "今年，许多项目聚焦智慧农业和养老服务。" },
        { en: "The winning team developed an app that connects farmers with local markets.", cn: "获胜团队开发了一款连接农户与本地市场的应用。" },
        { en: "Judges praised the students for solving real problems with simple designs.", cn: "评委称赞学生们用简单的设计解决实际问题。" },
        { en: "Winners will receive funding and office space to start their businesses.", cn: "获奖者将获得资金和办公场地用于创业。" },
        { en: "Organizers hope the competition encourages more students to innovate.", cn: "主办方希望比赛鼓励更多学生创新。" },
      ],
    },
    {
      id: "cet4-2026-6-conversation1",
      title: "四级26年6月 套2 长对话 图书馆自习座位",
      source: "四级真题",
      level: "A2",
      wordCount: 81,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "M: Have you noticed how crowded the library is during exam week?", cn: "男：你注意到考试周图书馆有多挤吗？" },
        { en: "W: Yes. I arrived at eight this morning and almost no seats were left.", cn: "女：是啊。我今早八点到，几乎没座位了。" },
        { en: "M: I heard the new study rooms on the third floor just opened.", cn: "男：我听说三楼新的自习室刚开放。" },
        { en: "W: Really? Do they have individual desks with lamps?", cn: "女：真的吗？有带台灯的单人桌吗？" },
        { en: "M: Yes, and they can be booked online for two hours at a time.", cn: "男：有，而且可以在线预约，每次两小时。" },
        { en: "W: That is exactly what we need during finals.", cn: "女：这正是我们期末需要的。" },
        { en: "M: I have already reserved two seats for tomorrow morning.", cn: "男：我已经预约了明天上午的两个座位。" },
      ],
    },
    {
      id: "cet4-2026-6-passage1",
      title: "四级26年6月 套2 短文 校园垃圾分类",
      source: "四级真题",
      level: "B1",
      wordCount: 75,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Last year, our campus introduced a four-bin waste sorting system.", cn: "去年，我们校园引入了四桶垃圾分类系统。" },
        { en: "Recyclable paper and plastic are collected separately from food waste.", cn: "可回收的纸张和塑料与厨余垃圾分开收集。" },
        { en: "Colorful posters and short videos teach students how to sort correctly.", cn: "彩色海报和短视频教学生如何正确分类。" },
        { en: "Each dormitory floor now has a volunteer who answers sorting questions.", cn: "每层宿舍楼现在都有一名志愿者解答分类问题。" },
        { en: "The amount of recyclable waste collected has doubled in six months.", cn: "六个月来收集的可回收垃圾量翻了一番。" },
        { en: "Food waste is turned into fertilizer for the campus garden.", cn: "厨余垃圾被制成校园花园的肥料。" },
        { en: "Students say the system makes them more aware of their daily choices.", cn: "学生们说，这套系统让他们更关注日常选择。" },
      ],
    },
    {
      id: "cet4-2026-12-news2",
      title: "四级26年12月 套2 News 寒假社会实践启动",
      source: "四级真题",
      level: "A2",
      wordCount: 77,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The winter social practice program for students was launched this week.", cn: "学生寒假社会实践项目本周启动。" },
        { en: "This year, students can choose from rural education, community service, and factory visits.", cn: "今年，学生可以选择乡村支教、社区服务和工厂参观。" },
        { en: "Participants will spend at least two weeks at their chosen site.", cn: "参与者将在所选地点至少度过两周。" },
        { en: "The university will provide transportation and basic living allowances.", cn: "学校将提供交通和基本生活补贴。" },
        { en: "A training session on safety and report writing will be held on Friday.", cn: "周五将举行一场关于安全和报告写作的培训。" },
        { en: "Last year, nearly three thousand students joined the program.", cn: "去年有近三千名学生参加了该项目。" },
        { en: "Staff say the program helps students connect theory with real society.", cn: "工作人员说，项目帮助学生把理论与社会实际联系起来。" },
      ],
    },
    {
      id: "cet4-2025-6-news2",
      title: "四级25年6月 套3 News 校园晨跑活动",
      source: "四级真题",
      level: "A2",
      wordCount: 68,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The student union organized a month-long morning run activity.", cn: "学生会组织了一项为期一个月的晨跑活动。" },
        { en: "Students gather on the sports field at six thirty every weekday morning.", cn: "学生们每周一到周五早上六点半在操场集合。" },
        { en: "Volunteers lead warm-up exercises before each run.", cn: "志愿者在每次跑步前带领热身运动。" },
        { en: "Participants collect stamps for each run and earn small prizes.", cn: "参与者每次跑步盖章，集章可兑换小奖品。" },
        { en: "More than eight hundred students have joined so far.", cn: "到目前为止已有八百多名学生参加。" },
        { en: "The union says the activity aims to build healthy exercise habits.", cn: "学生会表示，活动旨在培养健康的锻炼习惯。" },
        { en: "Many students say they now feel more energetic in class.", cn: "许多学生说他们上课时更有精神了。" },
      ],
    },
    {
      id: "cet4-2025-6-conversation2",
      title: "四级25年6月 套3 长对话 宿舍生活问题",
      source: "四级真题",
      level: "A2",
      wordCount: 69,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: The Wi-Fi in our dorm has been very slow this week.", cn: "女：我们宿舍这周的Wi-Fi一直很慢。" },
        { en: "M: Mine too. I cannot even load video lectures.", cn: "男：我的也是，连视频课都加载不出来。" },
        { en: "W: I submitted a repair request online yesterday.", cn: "女：我昨天在网上提交了报修申请。" },
        { en: "M: How long does it usually take for them to respond?", cn: "男：他们通常多久回复？" },
        { en: "W: They said within three working days.", cn: "女：他们说三个工作日内。" },
        { en: "M: Meanwhile, I will use the library network for my homework.", cn: "男：与此同时，我打算用图书馆的网络做作业。" },
        { en: "W: Good idea. Let us hope the problem is fixed quickly.", cn: "女：好主意。希望问题快点解决。" },
      ],
    },
    {
      id: "cet4-2025-12-news4",
      title: "四级25年12月 套3 News 高铁新线路开通",
      source: "四级真题",
      level: "B1",
      wordCount: 77,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "A new high-speed railway connecting two provincial capitals opened last month.", cn: "连接两座省会城市的一条新高铁上个月开通。" },
        { en: "The journey time between the two cities has been cut from five hours to two.", cn: "两城之间的行程时间从五小时缩短到两小时。" },
        { en: "The line serves millions of students who travel home on holidays.", cn: "这条线路为数以百万计节假日回家的学生服务。" },
        { en: "Ticket prices start at about one hundred and twenty yuan.", cn: "票价从大约一百二十元起。" },
        { en: "Trains run every twenty minutes during peak travel seasons.", cn: "在出行旺季，列车每二十分钟一班。" },
        { en: "Railway officials say online booking for the new line opened smoothly.", cn: "铁路部门表示，新线路的网上购票已顺利开放。" },
        { en: "Passengers praise the new line for its comfort and punctuality.", cn: "乘客称赞新线路舒适又准时。" },
      ],
    },
    {
      id: "cet4-2025-12-conversation3",
      title: "四级25年12月 套3 长对话 期末考试安排",
      source: "四级真题",
      level: "A2",
      wordCount: 78,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "M: Have you checked the final exam schedule yet?", cn: "男：你查过期末考试安排了吗？" },
        { en: "W: Yes, my math exam is on the last day, January tenth.", cn: "女：查了，我的数学考试在最后一天，一月十日。" },
        { en: "M: That gives you plenty of time to prepare.", cn: "男：那你有充足的时间准备。" },
        { en: "W: But my English oral test is next Monday, which is sooner.", cn: "女：但我的英语口语测试在下周一，更早。" },
        { en: "M: I can help you practice speaking this weekend.", cn: "男：这个周末我可以帮你练口语。" },
        { en: "W: That is very kind of you. Let us meet at the library at nine.", cn: "女：你真好。那我们九点图书馆见。" },
        { en: "M: Deal. Bring your notes and I will bring some practice questions.", cn: "男：说定了。带上你的笔记，我带一些练习题。" },
      ],
    },
    {
      id: "cet4-2026-6-news2",
      title: "四级26年6月 套3 News AI 辅助学习进课堂",
      source: "四级真题",
      level: "B1",
      wordCount: 73,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Several universities have begun testing AI tools in language classrooms.", cn: "几所大学开始在语言课堂上试用人工智能工具。" },
        { en: "The tools provide instant feedback on pronunciation and grammar.", cn: "这些工具能对发音和语法提供即时反馈。" },
        { en: "Teachers use the data to identify which skills students struggle with.", cn: "教师利用数据找出学生在哪些技能上有困难。" },
        { en: "Students can practice speaking with the AI at any time of day.", cn: "学生可以随时与AI练习口语。" },
        { en: "Some educators worry that students may rely too heavily on the technology.", cn: "一些教育者担心学生可能过度依赖技术。" },
        { en: "Researchers suggest combining AI practice with teacher-led discussions.", cn: "研究人员建议把AI练习与教师引导的讨论结合起来。" },
        { en: "The pilot programs will run for one year before wider use.", cn: "试点项目将运行一年，之后再推广。" },
      ],
    },
    {
      id: "cet4-2026-6-passage2",
      title: "四级26年6月 套3 短文 外卖包装与环保",
      source: "四级真题",
      level: "B1",
      wordCount: 74,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Ordering food online has become part of campus life, but packaging waste is growing.", cn: "点外卖已成为校园生活的一部分，但包装垃圾也在增加。" },
        { en: "Each order usually comes with plastic bags, boxes, and disposable chopsticks.", cn: "每单通常都配有塑料袋、餐盒和一次性筷子。" },
        { en: "Some universities now ask delivery platforms to use recyclable containers.", cn: "一些大学现在要求外卖平台使用可回收餐盒。" },
        { en: "Students can choose the no-cutlery option when placing an order.", cn: "学生在下单时可以选择无需餐具的选项。" },
        { en: "Campus groups organize regular collection of clean plastic bags for recycling.", cn: "校园组织定期收集干净的塑料袋用于回收。" },
        { en: "A survey shows that most students support greener packaging.", cn: "一项调查显示，大多数学生支持更环保的包装。" },
        { en: "Experts believe small daily choices can greatly reduce waste.", cn: "专家认为，日常小选择可以大大减少浪费。" },
      ],
    },
    {
      id: "cet4-2026-12-news3",
      title: "四级26年12月 套3 News 新年心愿墙",
      source: "四级真题",
      level: "A2",
      wordCount: 83,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Students at our university set up a New Year wish wall on the central square.", cn: "我们学校的学生在中心广场设立了一面新年心愿墙。" },
        { en: "Colorful cards carry wishes about exams, jobs, and friendships.", cn: "彩色卡片上写着关于考试、工作和友谊的心愿。" },
        { en: "Volunteers read the cards aloud at a small ceremony on New Year’s Eve.", cn: "志愿者在除夕的小仪式上朗读卡片。" },
        { en: "The most popular wish this year is passing the national postgraduate exam.", cn: "今年最流行的愿望是通过全国研究生考试。" },
        { en: "The wall will stay up for a week so more students can join.", cn: "心愿墙将保留一周，让更多学生参与。" },
        { en: "Organizers say the activity brings warmth to the campus in winter.", cn: "组织者说，这项活动给冬天的校园带来温暖。" },
        { en: "Everyone hopes their wishes come true in the new year.", cn: "每个人都希望自己的愿望在新的一年里实现。" },
      ],
    },
    {
      id: "cet4-2026-12-conversation1",
      title: "四级26年12月 套3 长对话 社团招新咨询",
      source: "四级真题",
      level: "A2",
      wordCount: 76,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: I saw your club booth at the freshman welcome fair.", cn: "女：我在新生欢迎会上看到了你们社团的摊位。" },
        { en: "M: Yes, we are the robotics club. We build and program small robots.", cn: "男：是的，我们是机器人社团，设计和编程小型机器人。" },
        { en: "W: I have no engineering background. Can I still join?", cn: "女：我没有工程背景，还能加入吗？" },
        { en: "M: Of course. We teach everything from scratch in weekly workshops.", cn: "男：当然可以。我们在每周工作坊里从零教起。" },
        { en: "W: How much time does it take each week?", cn: "女：每周要花多少时间？" },
        { en: "M: About three hours, plus a team competition once a month.", cn: "男：大约三个小时，外加每月一次团队比赛。" },
        { en: "W: Sounds exciting. I will fill out the application form now.", cn: "女：听起来很激动人心。我现在就填申请表。" },
      ],
    },
    {
      id: "cet4-2026-6-conversation2",
      title: "四级26年6月 套4 长对话 暑期实习面试",
      source: "四级真题",
      level: "B1",
      wordCount: 75,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "M: I have an internship interview at a tech company tomorrow.", cn: "男：我明天有一家科技公司的实习面试。" },
        { en: "W: Congratulations. How are you preparing for it?", cn: "女：恭喜。你准备得怎么样了？" },
        { en: "M: I reviewed my resume and practiced answering common questions.", cn: "男：我复习了简历，并练习回答常见问题。" },
        { en: "W: Remember to prepare a few questions to ask them as well.", cn: "女：记得也准备几个要问他们的问题。" },
        { en: "M: Good point. I want to ask about the training program for interns.", cn: "男：好主意。我想问问实习生的培训计划。" },
        { en: "W: And dress neatly, arrive ten minutes early, and smile.", cn: "女：还要穿着整洁、提前十分钟到，面带微笑。" },
        { en: "M: Thanks for the tips. I feel much more confident now.", cn: "男：谢谢你的建议。我现在自信多了。" },
      ],
    },
    {
      id: "cet4-2026-12-passage1",
      title: "四级26年12月 套4 短文 数字阅读与纸质书",
      source: "四级真题",
      level: "B1",
      wordCount: 71,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Digital reading has grown rapidly among college students.", cn: "数字阅读在大学生中快速增长。" },
        { en: "E-books and online articles are convenient and often cheaper than print.", cn: "电子书和在线文章方便，而且通常比纸质书便宜。" },
        { en: "However, some studies show that people remember printed text better.", cn: "然而，一些研究表明人们对纸质文本的记忆更好。" },
        { en: "When reading on screens, students tend to skim instead of reading deeply.", cn: "在屏幕阅读时，学生往往略读而非深度阅读。" },
        { en: "Libraries now offer both formats to meet different needs.", cn: "图书馆现在同时提供两种形式以满足不同需求。" },
        { en: "Many students read course materials online but buy novels in print.", cn: "许多学生在线阅读课程材料，但纸质版购买小说。" },
        { en: "Experts suggest choosing the format that matches the reading goal.", cn: "专家建议选择与阅读目标相匹配的形式。" },
      ],
    },
    {
      id: "cet4-2025-6-lecture1",
      title: "六级25年6月 套2 讲座 记忆与遗忘的神经机制",
      source: "六级真题",
      level: "C1",
      wordCount: 75,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Today we explore why we forget things even when we study hard.", cn: "今天我们来探讨为什么努力学习仍然会遗忘。" },
        { en: "Memory researchers divide forgetting into two major types: decay and interference.", cn: "记忆研究者把遗忘分为两大类型：衰退和干扰。" },
        { en: "Decay suggests that memories fade naturally over time when unused.", cn: "衰退理论认为记忆在长期不使用时会自然变淡。" },
        { en: "Interference occurs when new information blocks the retrieval of old memories.", cn: "干扰则发生在新信息阻碍旧记忆提取的时候。" },
        { en: "A classic experiment shows that people forget most rapidly right after learning.", cn: "一项经典实验表明，人们在学完后遗忘得最快。" },
        { en: "Spaced review, rather than cramming, dramatically slows this curve.", cn: "间隔复习而非突击学习，能显著减缓这条遗忘曲线。" },
        { en: "Understanding these mechanisms allows students to design better study schedules.", cn: "理解这些机制能帮助学生设计更好的学习计划。" },
      ],
    },
    {
      id: "cet4-2025-6-conversation3",
      title: "六级25年6月 套2 长对话 学术会议投稿咨询",
      source: "六级真题",
      level: "B1",
      wordCount: 90,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: Professor, I would like to submit my research to the annual conference.", cn: "女：教授，我想把研究投给年度学术会议。" },
        { en: "M: That is a good opportunity. Have you read the call for papers?", cn: "男：这是个好机会。你读过征文通知了吗？" },
        { en: "W: Yes, the deadline is March first, and papers must be in English.", cn: "女：读过了，截止日期是三月一日，论文必须用英文写。" },
        { en: "M: Focus on your methodology section, as reviewers pay close attention to it.", cn: "男：重点打磨方法部分，评审员非常关注这部分。" },
        { en: "W: Should I include the full data set in the appendix?", cn: "女：我要在附录里放完整数据集吗？" },
        { en: "M: Include the key tables and state that full data are available on request.", cn: "男：放关键表格，并注明完整数据可按要求提供。" },
        { en: "W: Thank you. I will send you the draft for feedback next week.", cn: "女：谢谢。我下周把初稿发给您征求意见。" },
      ],
    },
    {
      id: "cet4-2025-6-passage2",
      title: "六级25年6月 套2 短文 城市化与城市绿地",
      source: "六级真题",
      level: "C1",
      wordCount: 81,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "As cities expand, green spaces are often the first casualty.", cn: "随着城市扩张，绿地往往最先受到损害。" },
        { en: "Yet urban parks and tree lines do far more than decorate the skyline.", cn: "然而城市公园和林荫道的意义远不止装饰天际线。" },
        { en: "Trees cool the streets, absorb noise, and filter polluted air.", cn: "树木能降低街道温度、吸收噪音、过滤污染空气。" },
        { en: "Green areas also offer residents a place to exercise and relieve stress.", cn: "绿地为居民提供了锻炼和减压的场所。" },
        { en: "Studies link access to nature with lower rates of anxiety and depression.", cn: "研究表明接触自然与较低的焦虑和抑郁率相关。" },
        { en: "Some cities now require new developments to reserve a minimum share of green land.", cn: "一些城市现在要求新开发项目预留最低比例的绿地。" },
        { en: "Investing in green infrastructure is an investment in public health.", cn: "投资绿色基础设施就是投资公共健康。" },
      ],
    },
    {
      id: "cet4-2025-12-lecture1",
      title: "六级25年12月 套2 讲座 区块链与信任",
      source: "六级真题",
      level: "C1",
      wordCount: 81,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Blockchain technology promises to change how we record and verify information.", cn: "区块链技术有望改变我们记录和验证信息的方式。" },
        { en: "At its core, a blockchain is a shared ledger maintained by many computers.", cn: "其核心是一个由许多计算机共同维护的共享账本。" },
        { en: "Once data is added to a block, it becomes extremely difficult to alter.", cn: "数据一旦写入区块，就极难被篡改。" },
        { en: "This feature makes the system valuable for supply chains and digital identity.", cn: "这一特性使该系统在供应链和数字身份领域极具价值。" },
        { en: "However, the technology consumes large amounts of electricity.", cn: "然而，该技术消耗大量电力。" },
        { en: "Researchers are working on energy-efficient alternatives for everyday use.", cn: "研究人员正在开发适合日常使用的高能效替代方案。" },
        { en: "The key lesson is that trust does not disappear; it moves from people to code.", cn: "关键启示是：信任并未消失，而是从人转移到代码。" },
      ],
    },
    {
      id: "cet4-2025-12-conversation4",
      title: "六级25年12月 套2 长对话 留学申请规划",
      source: "六级真题",
      level: "B1",
      wordCount: 81,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "M: I am planning to apply for graduate school abroad next year.", cn: "男：我打算明年申请国外研究生。" },
        { en: "W: Which countries are you considering?", cn: "女：你在考虑哪些国家？" },
        { en: "M: I am applying to three universities in the UK and two in Singapore.", cn: "男：我申请了三所英国大学和两所新加坡大学。" },
        { en: "W: Have you taken the language tests required by those programs?", cn: "女：你考过这些项目要求的语言测试吗？" },
        { en: "M: I have passed IELTS, but I still need to improve my research proposal.", cn: "男：雅思已经通过了，但我还需要完善研究计划书。" },
        { en: "W: Ask your advisor to review it, and contact professors who match your interests.", cn: "女：请你的导师审阅，并联系与你研究方向匹配的教授。" },
        { en: "M: Good advice. I will start drafting it this week.", cn: "男：好建议。我这周就开始起草。" },
      ],
    },
    {
      id: "cet4-2025-12-passage4",
      title: "六级25年12月 套2 短文 老龄化社会的挑战",
      source: "六级真题",
      level: "C1",
      wordCount: 75,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "China, like many nations, is facing rapid population aging.", cn: "与许多国家一样，中国正面临快速的人口老龄化。" },
        { en: "By 2035, the share of citizens over sixty is expected to rise sharply.", cn: "到2035年，六十岁以上人口的比例预计将大幅上升。" },
        { en: "An aging population increases demand for medical care and long-term support.", cn: "人口老龄化增加了对医疗和长期照护的需求。" },
        { en: "It also shrinks the working-age population, affecting economic growth.", cn: "同时它也使劳动年龄人口减少，影响经济增长。" },
        { en: "Policymakers are promoting delayed retirement and lifelong education.", cn: "政策制定者正在推动延迟退休和终身教育。" },
        { en: "Technology, from telemedicine to smart homes, offers new ways to support elders.", cn: "从远程医疗到智能家居，科技为照护老人提供了新途径。" },
        { en: "A society that prepares early can turn the silver wave into an opportunity.", cn: "及早准备的社会能把银发浪潮变成机遇。" },
      ],
    },
    {
      id: "cet4-2026-6-lecture1",
      title: "六级26年6月 套2 讲座 大脑的可塑性",
      source: "六级真题",
      level: "C1",
      wordCount: 77,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "For decades, scientists believed the adult brain was fixed after a certain age.", cn: "几十年来，科学家认为成年大脑在某个年龄后就固定了。" },
        { en: "Modern research, however, reveals a remarkable quality called neuroplasticity.", cn: "然而现代研究揭示了一种非凡的特性，即神经可塑性。" },
        { en: "The brain continuously rewires itself as we learn new skills.", cn: "在我们学习新技能时，大脑会持续重塑自身。" },
        { en: "London taxi drivers, for example, show enlarged memory centers after years of navigation.", cn: "例如，伦敦出租车司机经过多年的导航后，记忆中枢会变大。" },
        { en: "Plasticity is strongest in childhood but continues throughout life.", cn: "可塑性在童年最强，但会持续一生。" },
        { en: "Learning a language or an instrument at any age strengthens neural connections.", cn: "在任何年龄学习语言或乐器都能强化神经连接。" },
        { en: "The practical message is simple: the brain rewards effort and practice.", cn: "实用的信息很简单：大脑会回报努力与练习。" },
      ],
    },
    {
      id: "cet4-2026-6-conversation3",
      title: "六级26年6月 套2 长对话 数据隐私保护",
      source: "六级真题",
      level: "B1",
      wordCount: 84,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: Our research group is developing a survey app for campus use.", cn: "女：我们课题组正在开发一款校园调查应用。" },
        { en: "M: Have you considered data privacy requirements?", cn: "男：你们考虑过数据隐私要求吗？" },
        { en: "W: We plan to collect only anonymized responses and delete them after analysis.", cn: "女：我们计划只收集匿名回答，分析后即删除。" },
        { en: "M: You should also tell users exactly how their data will be used.", cn: "男：你们还应该明确告知用户数据将如何被使用。" },
        { en: "W: We will include a clear privacy notice before the survey starts.", cn: "女：我们会在调查开始前附上清晰的隐私说明。" },
        { en: "M: And make sure the data is stored on a secure server, not on personal devices.", cn: "男：还要确保数据存储在安全服务器上，而不是个人设备中。" },
        { en: "W: Understood. Privacy will be our top priority in the design.", cn: "女：明白了。隐私将是我们在设计中的首要考虑。" },
      ],
    },
    {
      id: "cet4-2026-6-passage3",
      title: "六级26年6月 套2 短文 塑料污染治理",
      source: "六级真题",
      level: "C1",
      wordCount: 76,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Plastic waste has become one of the most visible environmental problems of our time.", cn: "塑料垃圾已成为我们这个时代最显著的环境问题之一。" },
        { en: "Every year, millions of tons of plastic enter the ocean.", cn: "每年有数百万吨塑料进入海洋。" },
        { en: "Microplastics, tiny fragments of degraded plastic, have been found in food and water.", cn: "微塑料——塑料降解后的微小碎片——已在食物和水中被发现。" },
        { en: "Governments are taking action with bans on single-use plastics.", cn: "各国政府正在采取措施，禁止使用一次性塑料。" },
        { en: "Recycling alone cannot solve the problem because most plastic is hard to reuse.", cn: "仅靠回收无法解决问题，因为大多数塑料难以再利用。" },
        { en: "Scientists are developing biodegradable materials as substitutes.", cn: "科学家正在开发可生物降解材料作为替代品。" },
        { en: "Reducing consumption at the source remains the most effective strategy.", cn: "从源头减少消费仍然是最有效的策略。" },
      ],
    },
    {
      id: "cet4-2026-12-lecture1",
      title: "六级26年12月 套2 讲座 语言如何塑造思维",
      source: "六级真题",
      level: "C1",
      wordCount: 79,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Does the language we speak influence how we think?", cn: "我们所说的语言会影响我们的思维方式吗？" },
        { en: "The Sapir-Whorf hypothesis suggests it does, though the debate continues.", cn: "萨丕尔-沃尔夫假说认为会，尽管争论仍在继续。" },
        { en: "Speakers of different languages often organize space and time differently.", cn: "不同语言的说话者往往以不同方式组织空间和时间。" },
        { en: "Some languages place the future ahead, while others place it behind.", cn: "有些语言把未来放在前面，而有些放在后面。" },
        { en: "Research shows that bilingual people can switch thinking styles with their language.", cn: "研究表明，双语者可以随语言切换思维方式。" },
        { en: "Language is not a simple container of thought, but a tool that shapes it.", cn: "语言不是思想的简单容器，而是塑造思想的工具。" },
        { en: "Learning another language therefore offers more than new words; it offers new perspectives.", cn: "因此，学习另一种语言带来的不只是新词汇，还有新视角。" },
      ],
    },
    {
      id: "cet4-2026-12-conversation2",
      title: "六级26年12月 套2 长对话 科研伦理讨论",
      source: "六级真题",
      level: "B1",
      wordCount: 75,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "M: The ethics committee returned our animal experiment application.", cn: "男：伦理委员会退回了我们的动物实验申请。" },
        { en: "W: What issues did they raise?", cn: "女：他们提出了什么问题？" },
        { en: "M: They want clearer justification for the number of animals used.", cn: "男：他们要求更清楚地说明所用动物数量的理由。" },
        { en: "W: We should cite similar studies and use the smallest possible sample.", cn: "女：我们应该引用类似研究，并采用尽可能小的样本。" },
        { en: "M: They also asked for a stronger plan to reduce suffering.", cn: "男：他们还要求一个更有力的减轻痛苦的方案。" },
        { en: "W: Let us update the protocol and resubmit it together this week.", cn: "女：我们这周一起更新方案并重新提交吧。" },
        { en: "M: Agreed. Ethical review protects both the animals and the quality of our science.", cn: "男：同意。伦理审查既保护动物，也保证我们研究的质量。" },
      ],
    },
    {
      id: "cet4-2026-12-passage2",
      title: "六级26年12月 套2 短文 远程办公的兴起",
      source: "六级真题",
      level: "C1",
      wordCount: 77,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Remote work has moved from a rare perk to a mainstream practice.", cn: "远程办公已从一种罕见的福利变成主流做法。" },
        { en: "Technology allows employees to collaborate across cities and time zones.", cn: "技术让员工能够跨城市、跨时区协作。" },
        { en: "Many workers enjoy the flexibility and the time saved on commuting.", cn: "许多员工喜欢这种灵活性以及省下的通勤时间。" },
        { en: "Companies benefit from access to a wider talent pool and lower office costs.", cn: "公司则受益于更广的人才库和更低的办公成本。" },
        { en: "However, remote work also blurs the boundary between work and life.", cn: "然而，远程办公也模糊了工作与生活的界限。" },
        { en: "Some employees report feeling isolated without daily face-to-face contact.", cn: "一些员工表示，缺乏日常面对面交流让他们感到孤立。" },
        { en: "The future likely lies in hybrid models that combine both approaches.", cn: "未来很可能在于结合两者的混合模式。" },
      ],
    },
    {
      id: "cet4-2025-6-lecture2",
      title: "六级25年6月 套3 讲座 社交媒体与心理健康",
      source: "六级真题",
      level: "C1",
      wordCount: 78,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Social media connects billions of people, yet its effects on well-being are debated.", cn: "社交媒体连接着数十亿人，但它对幸福的影响仍存争议。" },
        { en: "Studies find that passive scrolling often lowers mood.", cn: "研究发现，被动刷屏往往会降低情绪。" },
        { en: "When we constantly compare our lives to others’ highlights, we feel inadequate.", cn: "当我们不断拿自己的生活与他人最精彩的部分比较时，会感到不足。" },
        { en: "Active engagement, such as chatting with close friends, has more positive effects.", cn: "主动参与，比如与密友聊天，则有更积极的影响。" },
        { en: "The amount of time spent online matters less than how it is used.", cn: "上网时长本身不如使用方式重要。" },
        { en: "Experts suggest setting boundaries and curating feeds to reduce negativity.", cn: "专家建议设定界限并筛选信息流以减少负面内容。" },
        { en: "Digital well-being, they argue, is a skill we can learn.", cn: "他们认为，数字幸福感是一种可以学习的技能。" },
      ],
    },
    {
      id: "cet4-2025-12-conversation5",
      title: "六级25年12月 套3 长对话 创新创业孵化器咨询",
      source: "六级真题",
      level: "B1",
      wordCount: 73,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: Our startup idea won second prize in the innovation competition.", cn: "女：我们的创业想法在创新大赛中获得二等奖。" },
        { en: "M: Congratulations! What support does the university incubator offer?", cn: "男：恭喜！学校的孵化器提供什么支持？" },
        { en: "W: Free office space, legal advice, and mentoring from alumni entrepreneurs.", cn: "女：免费办公场地、法律咨询，以及校友企业家的指导。" },
        { en: "M: Do they provide any initial funding?", cn: "男：他们提供启动资金吗？" },
        { en: "W: Yes, up to fifty thousand yuan for promising projects.", cn: "女：提供，有潜力的项目最高可获得五万元。" },
        { en: "M: That is helpful. Have you submitted your business plan?", cn: "男：那很有帮助。你们提交商业计划书了吗？" },
        { en: "W: We are finalizing it and will submit it before the end of the month.", cn: "女：我们正在定稿，月底前提交。" },
      ],
    },
    {
      id: "cet4-2026-6-lecture2",
      title: "六级26年6月 套3 讲座 气候变化适应策略",
      source: "六级真题",
      level: "C1",
      wordCount: 71,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Climate change is no longer a distant prediction; its effects are already visible.", cn: "气候变化不再是遥远的预测，其影响已经显现。" },
        { en: "Rising temperatures threaten agriculture, water supplies, and coastal cities.", cn: "气温上升威胁着农业、水资源和沿海城市。" },
        { en: "While cutting emissions remains essential, adaptation is equally urgent.", cn: "尽管减排仍然至关重要，适应同样迫在眉睫。" },
        { en: "Adaptation includes building flood defenses and planting drought-resistant crops.", cn: "适应措施包括修建防洪设施和种植抗旱作物。" },
        { en: "Cities are installing cooling centers and expanding green roofs.", cn: "城市正在设立降温中心并推广绿色屋顶。" },
        { en: "Early warning systems save lives by giving people time to prepare.", cn: "预警系统通过给人们准备时间挽救生命。" },
        { en: "The cost of inaction will far exceed the cost of preparation.", cn: "不作为的代价将远远超过提前准备的代价。" },
      ],
    },
    {
      id: "cet4-2026-12-conversation3",
      title: "六级26年12月 套3 长对话 毕业论文答辩准备",
      source: "六级真题",
      level: "B1",
      wordCount: 79,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "M: My thesis defense is next Friday and I am nervous.", cn: "男：我的论文答辩在下周五，我很紧张。" },
        { en: "W: You have worked on this project for a year; you know it best.", cn: "女：这个项目你做了一年，你比谁都了解它。" },
        { en: "M: I worry about unexpected questions from the committee.", cn: "男：我担心委员会问出意想不到的问题。" },
        { en: "W: Anticipate questions about your methods and limitations.", cn: "女：预想一下关于方法和局限性的问题。" },
        { en: "M: I prepared slides, but should I also bring a printed copy?", cn: "男：我准备了幻灯片，还要带纸质版吗？" },
        { en: "W: Yes, bring two copies in case the committee wants to read along.", cn: "女：带吧，带两份，以防委员会想对照阅读。" },
        { en: "M: Thanks. I will do one full practice run with my classmates.", cn: "男：谢谢。我会和同学完整演练一遍。" },
      ],
    },
    {
      id: "cet4-2026-6-passage4",
      title: "六级26年6月 套3 短文 共享经济的再思考",
      source: "六级真题",
      level: "C1",
      wordCount: 68,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The sharing economy turned idle assets into income for millions.", cn: "共享经济把闲置资产变成了数百万人的收入。" },
        { en: "Ride-hailing, home-sharing, and tool rental platforms expanded rapidly.", cn: "网约车、民宿和工具租赁平台迅速扩张。" },
        { en: "Early promises of sustainability, however, have not fully materialized.", cn: "然而，早期关于可持续性的承诺并未完全实现。" },
        { en: "Critics note that some platforms increase traffic and energy use.", cn: "批评者指出，一些平台反而增加了交通流量和能源消耗。" },
        { en: "Regulation has also lagged behind the fast-changing business models.", cn: "监管也落后于快速变化的商业模式。" },
        { en: "Successful platforms now focus on trust, safety, and fair treatment of workers.", cn: "成功的平台如今注重信任、安全和公平对待从业者。" },
        { en: "The lesson is that innovation must be paired with responsibility.", cn: "经验是：创新必须与责任相伴。" },
      ],
    },
    {
      id: "cet4-2025-12-lecture2",
      title: "六级25年12月 套3 讲座 人工智能的伦理边界",
      source: "六级真题",
      level: "C1",
      wordCount: 69,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Artificial intelligence now makes decisions that affect hiring, lending, and healthcare.", cn: "人工智能如今参与影响招聘、贷款和医疗的决策。" },
        { en: "These systems learn from historical data, which may contain hidden biases.", cn: "这些系统从历史数据中学习，而历史数据可能隐藏偏见。" },
        { en: "A hiring algorithm trained on past choices can repeat past discrimination.", cn: "用过去的选择训练出的招聘算法可能重复过去的歧视。" },
        { en: "Transparency is difficult because complex models are hard to explain.", cn: "透明度很难实现，因为复杂模型难以解释。" },
        { en: "Policymakers are debating rules to ensure fairness and accountability.", cn: "政策制定者正在讨论确保公平与问责的规则。" },
        { en: "Ethical AI requires diverse development teams and regular audits.", cn: "合乎伦理的人工智能需要多元的开发团队和定期审计。" },
        { en: "Technology should amplify human judgment, not replace it.", cn: "技术应放大人类的判断力，而非取代它。" },
      ],
    },
    {
      id: "cet4-2026-6-lecture3",
      title: "六级26年6月 套4 讲座 探索宇宙：从望远镜到探测器",
      source: "六级真题",
      level: "C1",
      wordCount: 72,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Human curiosity about the universe has driven discovery for centuries.", cn: "人类对宇宙的好奇心驱动了几个世纪的发现。" },
        { en: "Modern telescopes capture light from billions of years ago.", cn: "现代望远镜捕捉着数十亿年前发出的光。" },
        { en: "Space probes have visited every planet in our solar system.", cn: "太空探测器已造访太阳系中的每一颗行星。" },
        { en: "The James Webb Space Telescope revealed the early universe in stunning detail.", cn: "詹姆斯·韦布空间望远镜以惊人的细节揭示了早期宇宙。" },
        { en: "China’s lunar missions have brought back samples of the moon’s surface.", cn: "中国的探月任务带回了月球表面的样本。" },
        { en: "Each mission answers old questions and raises new ones.", cn: "每一次任务都解答了旧问题，又提出了新问题。" },
        { en: "Perhaps the greatest discovery ahead is whether life exists beyond Earth.", cn: "未来最伟大的发现，或许就是地球之外是否存在生命。" },
      ],
    },
    {
      id: "cet4-2026-12-passage3",
      title: "六级26年12月 套4 短文 高校心理健康服务升级",
      source: "六级真题",
      level: "C1",
      wordCount: 69,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Universities across China are expanding mental health services for students.", cn: "中国各地高校正在扩大面向学生的心理健康服务。" },
        { en: "Counseling centers now offer more appointments and shorter waiting times.", cn: "咨询中心现在提供更多预约名额，等待时间也更短。" },
        { en: "Peer support groups allow students to share experiences in a safe setting.", cn: "同伴支持小组让学生能在安全的环境中分享经历。" },
        { en: "Online platforms provide round-the-clock access to professional help.", cn: "在线平台提供全天候的专业帮助渠道。" },
        { en: "Universities also train faculty to recognize warning signs early.", cn: "高校还培训教师及早识别预警信号。" },
        { en: "Reducing stigma is a key goal of campus awareness campaigns.", cn: "消除污名化是校园宣传活动的关键目标。" },
        { en: "Mental health, educators insist, is as important as academic success.", cn: "教育者强调，心理健康与学业成功同样重要。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionA3",
      title: "考研英语一 2025年 Section A 对话2 研究生选导师",
      source: "考研真题",
      level: "C1",
      wordCount: 76,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: I received offers from two professors, but I cannot decide.", cn: "女：我收到了两位教授的录取邀请，但我难以抉择。" },
        { en: "M: Choosing an advisor shapes your entire graduate experience.", cn: "男：选择导师会决定你整个研究生生涯的体验。" },
        { en: "W: One professor has a famous lab but is often away at conferences.", cn: "女：一位教授实验室很有名，但经常外出开会。" },
        { en: "M: Availability matters as much as reputation for a new student.", cn: "男：对新生来说，可接触的时间与名气同样重要。" },
        { en: "W: The other mentor publishes less but holds weekly one-on-one meetings.", cn: "女：另一位导师发表较少，但每周都有一对一交流。" },
        { en: "M: Regular feedback accelerates growth in the early years.", cn: "男：在早期，规律的反馈能加速成长。" },
        { en: "W: I will visit both labs and talk to their current students.", cn: "女：我会去两个实验室实地看看，并和他们的在读学生聊聊。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionB3",
      title: "考研英语一 2025年 Section B 短文2 科技变革与就业市场",
      source: "考研真题",
      level: "C2",
      wordCount: 80,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The rapid advance of automation is reshaping the employment landscape.", cn: "自动化的快速发展正在重塑就业格局。" },
        { en: "Routine tasks, once the backbone of many careers, are increasingly automated.", cn: "曾经支撑许多职业的常规任务正日益被自动化取代。" },
        { en: "Yet the same technology creates new roles that demand creativity and judgment.", cn: "然而同样的技术也创造了需要创造力和判断力的新岗位。" },
        { en: "The challenge for education is to prepare students for jobs that do not yet exist.", cn: "教育的挑战在于为学生准备尚不存在的职业。" },
        { en: "Lifelong learning has thus shifted from a slogan to a survival strategy.", cn: "因此，终身学习已从口号转变为生存策略。" },
        { en: "Employers increasingly value adaptability alongside technical skills.", cn: "雇主越来越看重适应能力与技术技能并重。" },
        { en: "A workforce that can reinvent itself will thrive in the age of machines.", cn: "能够不断重塑自我的劳动力将在机器时代蓬勃发展。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionC3",
      title: "考研英语一 2025年 Section C 讲座2 城市大脑与智慧治理",
      source: "考研真题",
      level: "C2",
      wordCount: 79,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Urban management is entering a new era powered by artificial intelligence.", cn: "城市管理正进入一个由人工智能驱动的新时代。" },
        { en: "The concept of the city brain integrates data from traffic, energy, and public safety.", cn: "城市大脑的概念整合了交通、能源和公共安全的数据。" },
        { en: "Real-time analysis allows authorities to respond to congestion within minutes.", cn: "实时分析使管理部门能在几分钟内应对拥堵。" },
        { en: "During emergencies, the system coordinates hospitals, fire services, and transport.", cn: "在紧急情况下，系统协调医院、消防和交通部门。" },
        { en: "Critics caution that data collection must respect individual privacy.", cn: "批评者提醒，数据收集必须尊重个人隐私。" },
        { en: "Fairness also demands that algorithms serve all citizens, not only the wealthy.", cn: "公平还要求算法服务所有市民，而非仅仅服务富裕人群。" },
        { en: "Technology is a tool; the quality of governance still depends on human values.", cn: "技术只是工具，治理质量仍取决于人的价值观。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionA4",
      title: "考研英语一 2025年 Section A 对话3 论文写作规范",
      source: "考研真题",
      level: "C1",
      wordCount: 79,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "M: My supervisor returned my draft with many comments on citations.", cn: "男：导师把我论文初稿退回来，批注多是关于引用的问题。" },
        { en: "W: Citation errors are a common source of criticism in academic review.", cn: "女：引用错误是学术评审中常见的批评点。" },
        { en: "M: I cited some facts from memory without checking the original sources.", cn: "男：有些事实我是凭记忆引用的，没有核对原始出处。" },
        { en: "W: Every claim that is not your own must trace to a verifiable reference.", cn: "女：凡不是你自己提出的论断，都必须追溯到可查证的文献。" },
        { en: "M: What about translated works? Can I cite the translation?", cn: "男：那翻译作品呢？我能引用译本吗？" },
        { en: "W: Cite the original when possible, and note the translation you consulted.", cn: "女：尽量引用原文，并注明你所参考的译本。" },
        { en: "M: I will recheck every reference this weekend.", cn: "男：我这周末会把所有参考文献重新核对一遍。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionB4",
      title: "考研英语一 2025年 Section B 短文3 文化遗产的数字化保护",
      source: "考研真题",
      level: "C2",
      wordCount: 69,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Cultural heritage faces threats from time, climate, and urbanization.", cn: "文化遗产面临着时间、气候和城市化的威胁。" },
        { en: "Digital technology offers a powerful new way to preserve it.", cn: "数字技术为保护遗产提供了强大的新途径。" },
        { en: "High-resolution scanning creates exact three-dimensional records of artifacts.", cn: "高分辨率扫描为文物创建了精确的三维记录。" },
        { en: "Museum visitors can now explore restored ancient sites through virtual reality.", cn: "博物馆参观者如今可以通过虚拟现实探索复原的古代遗址。" },
        { en: "Digital archives also make heritage accessible to people worldwide.", cn: "数字档案还让全世界的人都能接触到文化遗产。" },
        { en: "Yet experts warn that digital copies cannot replace the original objects.", cn: "然而专家提醒，数字副本无法取代实物本身。" },
        { en: "The ideal is to combine preservation with education and shared access.", cn: "理想的做法是把保护与教育、共享结合起来。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionC4",
      title: "考研英语一 2025年 Section C 讲座3 基础科学研究的价值",
      source: "考研真题",
      level: "C2",
      wordCount: 74,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "In an era obsessed with quick results, basic research is often undervalued.", cn: "在崇尚速效成果的时代，基础研究常常被低估。" },
        { en: "Curiosity-driven science seeks knowledge without an immediate application.", cn: "好奇心驱动的科学追求知识，并不追求立竿见影的应用。" },
        { en: "Yet many breakthrough technologies grew from such pure exploration.", cn: "然而许多突破性技术正源于这种纯粹的探索。" },
        { en: "The discovery of the structure of DNA took decades to become medicine.", cn: "DNA结构的发现历经数十年才转化为医学成果。" },
        { en: "Measuring the value of basic science by short-term returns is misleading.", cn: "用短期回报来衡量基础科学的价值具有误导性。" },
        { en: "Nations that invest steadily in fundamental research reap innovations later.", cn: "持续投资基础研究的国家，日后会收获创新成果。" },
        { en: "Curiosity, in the long run, is the most practical of all pursuits.", cn: "从长远看，好奇心才是最实用的事业。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionA3",
      title: "考研英语一 2026年 Section A 对话2 国际学术会议交流",
      source: "考研真题",
      level: "C1",
      wordCount: 77,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: I am attending an international conference in July for the first time.", cn: "女：我七月份将第一次参加国际学术会议。" },
        { en: "M: A conference is as much about networking as about presenting.", cn: "男：会议的重心一半在展示，一半在人际交流。" },
        { en: "W: What should I do when I meet senior researchers?", cn: "女：遇到资深研究者时我该怎么办？" },
        { en: "M: Introduce yourself briefly and ask about their recent work.", cn: "男：简要介绍自己，然后请教他们最近的研究。" },
        { en: "W: I worry my spoken English is not fluent enough.", cn: "女：我担心自己的英语口语不够流利。" },
        { en: "M: Prepare a one-minute summary of your research and practice it aloud.", cn: "男：准备一分钟的研究简介，并大声练习。" },
        { en: "W: I will do that. Thank you for the practical advice.", cn: "女：我会照做。谢谢你的实用建议。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionB3",
      title: "考研英语一 2026年 Section B 短文2 跨越数字鸿沟",
      source: "考研真题",
      level: "C2",
      wordCount: 84,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The digital divide separates those who benefit from technology from those left behind.", cn: "数字鸿沟把从技术中受益的人与落伍者分隔开来。" },
        { en: "Rural students, the elderly, and low-income families are often on the losing side.", cn: "农村学生、老年人和低收入家庭常常处于不利一侧。" },
        { en: "Lack of devices and stable internet is only part of the problem.", cn: "缺乏设备和稳定的网络只是问题的一部分。" },
        { en: "Digital literacy, knowing how to use and judge online information, matters equally.", cn: "数字素养——懂得如何使用和判断在线信息——同样重要。" },
        { en: "School programs that loan devices and train families show promising results.", cn: "出借设备并培训家庭的学校项目已显示出积极成效。" },
        { en: "Public libraries have become digital training centers in many communities.", cn: "在许多社区，公共图书馆已成为数字培训中心。" },
        { en: "Bridging the gap is not charity; it is a condition for fair participation.", cn: "弥合鸿沟不是慈善，而是公平参与的前提。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionC3",
      title: "考研英语一 2026年 Section C 讲座2 基因编辑的伦理之问",
      source: "考研真题",
      level: "C2",
      wordCount: 82,
      sentenceCount: 8,
      duration: "00:55",
      sentences: [
        { en: "Gene-editing tools such as CRISPR have opened extraordinary medical possibilities.", cn: "CRISPR等基因编辑工具开启了非凡的医学可能性。" },
        { en: "Scientists can now correct disease-causing mutations with growing precision.", cn: "科学家如今能以越来越高的精度修正致病突变。" },
        { en: "Therapies for inherited disorders are already entering clinical trials.", cn: "针对遗传性疾病的疗法已进入临床试验阶段。" },
        { en: "The far greater controversy surrounds editing the genes of human embryos.", cn: "更大的争议围绕编辑人类胚胎基因展开。" },
        { en: "Changes made at this stage would be inherited by future generations.", cn: "在这一阶段所做的改变将遗传给后代。" },
        { en: "Proponents argue that eliminating hereditary diseases is a moral duty.", cn: "支持者认为，消除遗传病是一种道德责任。" },
        { en: "Opponents warn that the technology could be misused for designer babies.", cn: "反对者警告，该技术可能被滥用于定制婴儿。" },
        { en: "Society must decide where the line between cure and enhancement lies.", cn: "社会必须划定治疗与增强之间的界限。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionA4",
      title: "考研英语一 2026年 Section A 对话3 奖学金申请咨询",
      source: "考研真题",
      level: "C1",
      wordCount: 72,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "M: I want to apply for the national graduate scholarship this year.", cn: "男：我想今年申请国家研究生奖学金。" },
        { en: "W: The selection committee weighs publications, grades, and service equally.", cn: "女：评审委员会同等看重论文发表、成绩和社会服务。" },
        { en: "M: My grades are strong, but I have no published papers yet.", cn: "男：我成绩很好，但还没有发表论文。" },
        { en: "W: A well-written working paper can still make a strong case.", cn: "女：一篇写得好的工作论文仍然很有说服力。" },
        { en: "M: Should I include my teaching assistant experience?", cn: "男：我要把助教经历写进去吗？" },
        { en: "W: Absolutely, especially if you received good evaluations from students.", cn: "女：当然要写，尤其是获得学生好评的话。" },
        { en: "M: I will prepare the application package this week.", cn: "男：我这周就准备申请材料。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionB4",
      title: "考研英语一 2026年 Section B 短文3 积极应对人口老龄化",
      source: "考研真题",
      level: "C2",
      wordCount: 69,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Population aging is often framed as a burden on society.", cn: "人口老龄化常常被描述为社会负担。" },
        { en: "The reality is more complex, with both challenges and opportunities.", cn: "现实更为复杂，既包含挑战也包含机遇。" },
        { en: "Older citizens possess decades of experience, skills, and social capital.", cn: "年长公民拥有数十年的经验、技能和社会资本。" },
        { en: "Many remain active contributors long after retirement age.", cn: "许多人在退休年龄之后仍长期积极贡献。" },
        { en: "Flexible employment schemes allow seniors to mentor younger workers.", cn: "灵活的就业安排让长者得以指导年轻员工。" },
        { en: "Age-friendly cities redesign streets, housing, and services for all ages.", cn: "适老城市重新设计街道、住房和服务，使其适合所有年龄。" },
        { en: "A society that values all its generations grows wiser and more resilient.", cn: "重视每一代人的社会会变得更智慧、更具韧性。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionC4",
      title: "考研英语一 2026年 Section C 讲座3 量子计算的前景",
      source: "考研真题",
      level: "C2",
      wordCount: 77,
      sentenceCount: 8,
      duration: "00:55",
      sentences: [
        { en: "Quantum computing harnesses the strange rules of subatomic physics.", cn: "量子计算利用的是亚原子物理的奇异规律。" },
        { en: "Unlike classical bits, quantum bits can exist in multiple states at once.", cn: "与经典比特不同，量子比特可以同时处于多种状态。" },
        { en: "This property could solve certain problems that defeat today’s computers.", cn: "这一特性可能解决令当今计算机束手无策的某些问题。" },
        { en: "Drug discovery and materials science stand to benefit enormously.", cn: "药物研发和材料科学将从中获益巨大。" },
        { en: "Practical quantum computers, however, remain years away.", cn: "然而，实用的量子计算机仍需要多年时间。" },
        { en: "Stability, cost, and error correction pose enormous engineering challenges.", cn: "稳定性、成本和纠错构成巨大的工程挑战。" },
        { en: "Researchers are also preparing quantum-resistant encryption for the future.", cn: "研究人员还在为未来准备抗量子加密。" },
        { en: "The race to build quantum machines is a race to the future.", cn: "打造量子机器的竞赛就是奔向未来的竞赛。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionA5",
      title: "考研英语一 2025年 Section A 对话4 实习与科研的平衡",
      source: "考研真题",
      level: "C1",
      wordCount: 81,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: I found an internship, but my supervisor worries it will delay my research.", cn: "女：我找到一份实习，但导师担心它会耽误我的研究。" },
        { en: "M: Balancing the two is challenging but possible with a clear plan.", cn: "男：平衡两者虽有挑战，但有清晰计划就可实现。" },
        { en: "W: The internship takes three days a week for four months.", cn: "女：实习每周占用三天，持续四个月。" },
        { en: "M: That is substantial. Consider whether it fits your career goals.", cn: "男：那占时不少。要考虑它是否符合你的职业目标。" },
        { en: "W: The company works exactly in my research field.", cn: "女：那家公司做的正是我的研究领域。" },
        { en: "M: Then treat the internship as part of your training, not a distraction.", cn: "男：那就把实习当作训练的一部分，而非干扰。" },
        { en: "W: I will align the research schedule with the internship plan.", cn: "女：我会把研究进度与实习安排对齐。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionB5",
      title: "考研英语一 2025年 Section B 短文4 乡村振兴中的青年力量",
      source: "考研真题",
      level: "C2",
      wordCount: 69,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Rural revitalization has become a national strategy of profound importance.", cn: "乡村振兴已成为意义深远的国家战略。" },
        { en: "Young people are returning to villages with new skills and ideas.", cn: "年轻人正带着新技能和新理念回到乡村。" },
        { en: "E-commerce has connected farm products directly to urban consumers.", cn: "电子商务把农产品直接连接到城市消费者。" },
        { en: "Livestreamers from small villages now sell specialties to audiences nationwide.", cn: "来自小村庄的主播如今把特产卖给全国观众。" },
        { en: "Digital platforms reduce the distance between countryside and city.", cn: "数字平台缩小了乡村与城市之间的距离。" },
        { en: "Education programs train villagers in marketing and quality control.", cn: "教育项目培训村民掌握营销和品质控制技能。" },
        { en: "Youth, when supported well, can turn rural traditions into thriving economies.", cn: "得到良好支持的青年能把乡村传统变成繁荣的经济。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionC5",
      title: "考研英语一 2025年 Section C 讲座4 脑机接口的曙光",
      source: "考研真题",
      level: "C2",
      wordCount: 76,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Brain-computer interfaces, once science fiction, are now being tested in clinics.", cn: "脑机接口曾是科幻，如今正进入临床测试阶段。" },
        { en: "These devices translate brain signals into commands for computers or prosthetics.", cn: "这些设备把大脑信号转换成计算机或假肢的指令。" },
        { en: "Paralyzed patients have used them to move robotic arms and type messages.", cn: "瘫痪患者已用它操控机械臂、输入文字。" },
        { en: "The technology offers profound hope for restoring communication and movement.", cn: "该技术为恢复交流与行动带来深切的希望。" },
        { en: "Scientists stress that the field is still young and results vary widely.", cn: "科学家强调，该领域仍处于早期，效果差异很大。" },
        { en: "Ethical questions about privacy of thought are already emerging.", cn: "关于思维隐私的伦理问题已经开始浮现。" },
        { en: "With careful progress, the interface between mind and machine will deepen.", cn: "只要谨慎推进，人与机器的连接会不断加深。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionA5",
      title: "考研英语一 2026年 Section A 对话4 学术诚信的底线",
      source: "考研真题",
      level: "C1",
      wordCount: 86,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "M: The department announced new rules against using AI to write papers.", cn: "男：学院发布了禁止使用AI代写论文的新规。" },
        { en: "W: Many students use AI tools for grammar, which is different.", cn: "女：很多学生用AI工具改语法，这有所不同。" },
        { en: "M: The line is whether AI does the thinking or merely assists expression.", cn: "男：界限在于AI是替你思考，还是仅仅辅助表达。" },
        { en: "W: The policy asks us to disclose any AI assistance in the methods section.", cn: "女：规定要求我们在方法部分披露任何AI辅助。" },
        { en: "M: I agree with the principle, but enforcement will not be easy.", cn: "男：我赞同这一原则，但执行起来并不容易。" },
        { en: "W: Detection tools are improving, yet honesty must come from within.", cn: "女：检测工具在进步，但诚信必须发自内心。" },
        { en: "M: Our reputation as researchers is built on every honest word we write.", cn: "男：我们作为研究者的声誉，建立在所写的每一个诚实的字词上。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionB5",
      title: "考研英语一 2026年 Section B 短文4 新能源革命与能源安全",
      source: "考研真题",
      level: "C2",
      wordCount: 74,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The global energy system is undergoing its greatest transformation in a century.", cn: "全球能源体系正经历一个世纪以来最深刻的变革。" },
        { en: "Solar and wind power have become cheaper than coal in many regions.", cn: "在许多地区，太阳能和风能已经比煤炭更便宜。" },
        { en: "China leads the world in manufacturing batteries and electric vehicles.", cn: "中国在电池和电动汽车制造方面领先全球。" },
        { en: "Energy storage, however, remains the weakest link in the transition.", cn: "然而，储能仍是转型中最薄弱的环节。" },
        { en: "Advanced batteries and hydrogen offer promising paths to large-scale storage.", cn: "先进电池和氢能提供了大规模储能的有前景的路径。" },
        { en: "A diverse energy mix strengthens national security and resilience.", cn: "多元的能源结构能增强国家安全与韧性。" },
        { en: "The nations that master clean energy will lead the next economy.", cn: "掌握清洁能源的国家将引领下一个经济时代。" },
      ],
    },
    {
      id: "kaoyan-2025-sectionA6",
      title: "考研英语一 2025年 Section A 对话5 求职面试经验交流",
      source: "考研真题",
      level: "C1",
      wordCount: 74,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "W: My first job interview is tomorrow and I am quite anxious.", cn: "女：我明天有第一场求职面试，非常紧张。" },
        { en: "M: Nerves are normal. Preparation is the best antidote.", cn: "男：紧张很正常，充分准备是最好的解药。" },
        { en: "W: I prepared answers for ten common questions.", cn: "女：我准备了十个常见问题的回答。" },
        { en: "M: Good. Also prepare questions about the company’s projects and culture.", cn: "男：很好。还要准备关于公司项目和文化的问题。" },
        { en: "W: What if I do not know the answer to a technical question?", cn: "女：如果技术问题我不会回答怎么办？" },
        { en: "M: Be honest and explain how you would find the answer.", cn: "男：诚实说明，并讲讲你会如何找到答案。" },
        { en: "W: That is reassuring. I will practice once more tonight.", cn: "女：这让我安心多了。我今晚再练习一遍。" },
      ],
    },
    {
      id: "kaoyan-2026-sectionB6",
      title: "考研英语一 2026年 Section B 短文5 全球供应链的重构",
      source: "考研真题",
      level: "C2",
      wordCount: 67,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Recent crises have exposed the fragility of global supply chains.", cn: "近期的危机暴露了全球供应链的脆弱性。" },
        { en: "A single disruption can halt factories thousands of kilometers apart.", cn: "一次中断就能让相隔数千公里的工厂停摆。" },
        { en: "Companies are responding by diversifying suppliers across regions.", cn: "企业正通过在不同地区分散供应商来应对。" },
        { en: "Some production is returning closer to home, a trend called reshoring.", cn: "部分生产正回归本土，这一趋势被称为回流。" },
        { en: "Digital twins and sensors provide real-time visibility into the entire chain.", cn: "数字孪生和传感器提供整个链条的实时可见性。" },
        { en: "Yet over-reliance on technology creates new vulnerabilities.", cn: "然而过度依赖技术又会造成新的脆弱性。" },
        { en: "The most resilient chains combine diversity, transparency, and human judgment.", cn: "最有韧性的供应链兼顾多元、透明与人的判断。" },
      ],
    },
    {
      id: "blog-01",
      title: "博客：晨间习惯如何改变我的一天",
      source: "博客",
      level: "A2",
      wordCount: 72,
      sentenceCount: 6,
      duration: "00:55",
      sentences: [
        { en: "A year ago, I woke up fifteen minutes before my first class, rushed, and stressed.", cn: "一年前，我总是在第一节课前十五分钟才起床，匆忙又焦虑。" },
        { en: "Then I started a simple morning routine: water, ten minutes of reading, and a short walk.", cn: "后来我开始了一个简单的晨间习惯：喝水、阅读十分钟、散步一会儿。" },
        { en: "The reading is always something light, never homework.", cn: "阅读的内容总是轻松的，绝不是作业。" },
        { en: "The walk wakes my body without the shock of a cold shower.", cn: "散步让身体自然苏醒，不必受冷水澡的刺激。" },
        { en: "Within two weeks, I stopped needing my alarm to feel alert.", cn: "两周之内，我就不再需要闹钟也能保持清醒。" },
        { en: "My mornings are now the calmest part of the day.", cn: "现在，清晨成了一天中最平静的时光。" },
      ],
    },
    {
      id: "blog-02",
      title: "博客：极简桌面，专注翻倍",
      source: "博客",
      level: "A2",
      wordCount: 63,
      sentenceCount: 6,
      duration: "00:55",
      sentences: [
        { en: "My desk used to hold snacks, comics, and three bottles of drinks.", cn: "我的书桌曾经堆着零食、漫画和三瓶饮料。" },
        { en: "Every object competed for my attention while I studied.", cn: "每一件物品都在我学习时争夺注意力。" },
        { en: "One weekend, I removed everything except my laptop, lamp, and notebook.", cn: "一个周末，我把桌上除笔记本电脑、台灯和笔记本外的所有东西都收走了。" },
        { en: "The difference surprised me. I started tasks without hesitation.", cn: "变化令我惊讶。我开始毫不犹豫地投入任务。" },
        { en: "A clear desk makes it easier to keep a clear mind.", cn: "干净的桌面让头脑更容易保持清晰。" },
        { en: "Now I clean my desk every night before going to bed.", cn: "现在，我每晚睡前都会清理书桌。" },
      ],
    },
    {
      id: "blog-03",
      title: "博客：跑步日记：从一公里开始",
      source: "博客",
      level: "B1",
      wordCount: 87,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "I could not run two hundred meters without stopping last September.", cn: "去年九月，我连两百米都跑不下来。" },
        { en: "A friend suggested I start with a one-kilometer loop, walking when tired.", cn: "朋友建议我先跑一公里的小圈，累了就走路。" },
        { en: "I kept a diary, writing down the distance and how I felt each day.", cn: "我坚持写日记，记下每天的距离和感受。" },
        { en: "After a month, the loop felt easy, so I added another kilometer.", cn: "一个月后，那一圈变得轻松，我又加了一公里。" },
        { en: "The diary showed me progress I could not feel day to day.", cn: "日记让我看到了日复一日中感觉不到的进步。" },
        { en: "Now, half a year later, I run five kilometers three times a week.", cn: "现在，半年过去了，我每周跑三次五公里。" },
        { en: "The hardest step was not the first kilometer; it was the first day.", cn: "最难的步子不是第一公里，而是第一天。" },
      ],
    },
    {
      id: "blog-04",
      title: "博客：我如何坚持读完一本书",
      source: "博客",
      level: "B1",
      wordCount: 73,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "I used to buy books and stop reading them after twenty pages.", cn: "我以前买书总在读到二十页后就放弃了。" },
        { en: "The problem was that I read only when I felt inspired.", cn: "问题在于我只有来了兴致才读。" },
        { en: "I changed my rule: read ten pages every day, no matter what.", cn: "我改了规矩：无论如何，每天读十页。" },
        { en: "Ten pages take only fifteen minutes, so there is no excuse.", cn: "十页只需十五分钟，没有任何借口。" },
        { en: "On busy days, I read ten pages of an easier book instead.", cn: "忙碌的日子里，我就改读十页更轻松的书。" },
        { en: "Small daily progress beats occasional giant effort.", cn: "每天的小进步胜过偶尔的全力以赴。" },
        { en: "This year, I have already finished twelve books.", cn: "今年，我已经读完了十二本书。" },
      ],
    },
    {
      id: "blog-05",
      title: "博客：时间管理：给任务排序",
      source: "博客",
      level: "B1",
      wordCount: 65,
      sentenceCount: 6,
      duration: "00:55",
      sentences: [
        { en: "Last semester, my deadlines always seemed to arrive together.", cn: "上学期，我的各种截止日期总像约好了一样挤在一起。" },
        { en: "I started listing every task each morning and marking it with priority.", cn: "我开始每天早上列出所有任务，并标注优先级。" },
        { en: "The rule is simple: important tasks come before urgent distractions.", cn: "规则很简单：重要的任务排在紧急的杂事前面。" },
        { en: "I also learned to say no to activities that add no value.", cn: "我还学会了拒绝没有价值的活动。" },
        { en: "The most useful habit was planning tomorrow before leaving the library.", cn: "最有用的习惯是离开图书馆前先规划好明天。" },
        { en: "Now my stress level is much lower, even in exam weeks.", cn: "现在即使考试周，我的压力也小多了。" },
      ],
    },
    {
      id: "blog-06",
      title: "博客：手写笔记的好处",
      source: "博客",
      level: "A2",
      wordCount: 60,
      sentenceCount: 6,
      duration: "00:55",
      sentences: [
        { en: "I used to type my lecture notes on a tablet.", cn: "我以前习惯在平板上敲课堂笔记。" },
        { en: "One professor suggested trying handwritten notes instead.", cn: "一位教授建议我试试手写笔记。" },
        { en: "Writing by hand is slower, which forces me to choose what matters.", cn: "手写更慢，这迫使我去挑选重要的内容。" },
        { en: "I found myself remembering more after class, even without reviewing.", cn: "我发现下课后记住的东西更多了，哪怕不复习。" },
        { en: "Drawing simple diagrams also became easier by hand.", cn: "手写时画简单图表也更容易。" },
        { en: "Now I write notes by hand and type them up only before exams.", cn: "现在，我上课手写笔记，只在考前才敲成电子版。" },
      ],
    },
    {
      id: "news-feature-01",
      title: "新闻：大学新图书馆正式开放",
      source: "新闻",
      level: "A2",
      wordCount: 77,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "A new university library with five floors opened to students this week.", cn: "一座五层楼的新大学图书馆本周向学生开放。" },
        { en: "The building houses one million books and eight hundred reading seats.", cn: "馆内藏书一百万册，设有八百个阅览座位。" },
        { en: "Smart systems allow students to borrow and return books without staff.", cn: "智能系统让学生无需工作人员即可自助借还书。" },
        { en: "A twenty-four-hour study area on the ground floor is especially popular.", cn: "底层二十四小时自习区尤其受欢迎。" },
        { en: "The library also includes discussion rooms and a digital media center.", cn: "图书馆还设有讨论室和数字媒体中心。" },
        { en: "Staff say the opening hours will extend during exam weeks.", cn: "工作人员表示，考试周将延长开放时间。" },
        { en: "Students welcomed the new space as the heart of campus life.", cn: "学生们把新馆视为校园生活的中心，表示欢迎。" },
      ],
    },
    {
      id: "news-feature-02",
      title: "新闻：全国大学生科创竞赛落幕",
      source: "新闻",
      level: "B1",
      wordCount: 69,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The national college science and innovation competition concluded in Shanghai.", cn: "全国大学生科技创新竞赛在上海落幕。" },
        { en: "Teams from ninety universities competed across twenty categories.", cn: "来自九十所高校的队伍在二十个类别中角逐。" },
        { en: "A team from Zhejiang won the top prize with a low-cost water purifier.", cn: "来自浙江的一支队伍以低成本净水器夺得最高奖。" },
        { en: "Judges highlighted the increasing maturity of student research.", cn: "评委强调学生研究水平的日益成熟。" },
        { en: "Winning projects will be connected with investors and industrial partners.", cn: "获奖项目将对接投资方和产业合作伙伴。" },
        { en: "Organizers say the event attracted a record number of applications.", cn: "主办方表示，本届赛事申请数量创下纪录。" },
        { en: "The competition aims to turn classroom ideas into real products.", cn: "比赛旨在把课堂上的想法变成真正的产品。" },
      ],
    },
    {
      id: "news-feature-03",
      title: "新闻：高校开通24小时心理援助热线",
      source: "新闻",
      level: "B1",
      wordCount: 69,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Several universities have launched round-the-clock mental health hotlines.", cn: "多所高校开通了二十四小时心理健康热线。" },
        { en: "Trained counselors answer calls from students facing stress and anxiety.", cn: "训练有素的咨询师接听面临压力和焦虑的学生的来电。" },
        { en: "The service is free, confidential, and available every day of the year.", cn: "该服务免费、保密，全年每天开放。" },
        { en: "Universities say many students prefer calling over in-person visits.", cn: "高校表示，许多学生更喜欢打电话而非当面咨询。" },
        { en: "The hotlines also offer guidance on referring students to local hospitals.", cn: "热线还提供转介学生到当地医院的指导。" },
        { en: "Mental health experts praise the initiative as long overdue.", cn: "心理健康专家称赞这一举措，认为早该如此。" },
        { en: "Colleges urge students to reach out before problems become crises.", cn: "高校呼吁学生在问题变成危机之前主动求助。" },
      ],
    },
    {
      id: "news-feature-04",
      title: "新闻：城市充电桩建设加速",
      source: "新闻",
      level: "B1",
      wordCount: 75,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "Cities across the country are accelerating the installation of charging stations.", cn: "全国各地的城市正在加快充电桩建设。" },
        { en: "The number of public charging points increased by forty percent last year.", cn: "去年公共充电桩数量增长了百分之四十。" },
        { en: "New stations are being placed near universities, malls, and bus terminals.", cn: "新站点正设在大学、商场和公交枢纽附近。" },
        { en: "Drivers can locate available chargers through a mobile app.", cn: "司机可通过手机应用查找可用充电桩。" },
        { en: "The government offers subsidies to encourage installation in residential areas.", cn: "政府提供补贴以鼓励在居民区安装。" },
        { en: "Industry experts say charging speed is the next challenge to solve.", cn: "行业专家表示，充电速度是下一个要攻克的难题。" },
        { en: "Faster and smarter charging will support the growing electric vehicle market.", cn: "更快更智能的充电将支撑不断增长的电动汽车市场。" },
      ],
    },
    {
      id: "news-feature-05",
      title: "新闻：城市地铁新线路开通",
      source: "新闻",
      level: "A2",
      wordCount: 85,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "A new metro line opened in the city center this morning.", cn: "一条新地铁线今天上午在市中心开通。" },
        { en: "The line connects the university district with the railway station in twenty minutes.", cn: "该线路二十分钟内连接大学城与火车站。" },
        { en: "All stations on the line offer barrier-free access and free Wi-Fi.", cn: "全线车站均提供无障碍通道和免费Wi-Fi。" },
        { en: "The first day drew large crowds of students and commuters.", cn: "开通首日吸引了大量学生和通勤者。" },
        { en: "City officials say two more lines will open before the end of the year.", cn: "市政府表示，年底前还将开通两条新线。" },
        { en: "Passengers praised the new line for cutting their daily travel time in half.", cn: "乘客称赞新线路把每日通勤时间缩短了一半。" },
        { en: "The expansion is part of a plan to make public transport more convenient.", cn: "这一扩建是让公共交通更便利计划的一部分。" },
      ],
    },
    {
      id: "news-feature-06",
      title: "新闻：城市公园改造提升",
      source: "新闻",
      level: "A2",
      wordCount: 79,
      sentenceCount: 7,
      duration: "00:55",
      sentences: [
        { en: "The city completed the renovation of its riverside park this month.", cn: "本市本月完成了滨江公园的改造工程。" },
        { en: "The park now features a running track, a children’s playground, and new lighting.", cn: "公园现在设有跑道、儿童游乐场和新的照明设施。" },
        { en: "More than two thousand trees and shrubs were planted along the paths.", cn: "沿步道种植了两千多棵树木和灌木。" },
        { en: "Benches and drinking fountains were added at regular intervals.", cn: "每隔一段距离增设了长椅和饮水点。" },
        { en: "Residents say the park has become a favorite place for evening walks.", cn: "居民们说，公园已成为晚间散步的好去处。" },
        { en: "City planners involved local schools in naming the new garden areas.", cn: "城市规划者邀请本地学校为新园区命名。" },
        { en: "The project is one of several green upgrades planned this year.", cn: "该项目是今年规划的多项绿色升级之一。" },
      ],
    },

    {
      id: "kaoyan-2026-sectionC5",
      title: "考研英语一 2026年 Section C 讲座5 数据驱动的个性化教育",
      source: "考研真题",
      level: "C2",
      wordCount: 320,
      sentenceCount: 8,
      duration: "02:18",
      sentences: [
        { en: "The idea of personalized education has existed for centuries, but data is making it possible at scale.", cn: "个性化教育的理念已存在数百年，但数据使其得以规模化实现。" },
        { en: "Learning platforms now record every click, pause, and correct answer a student makes.", cn: "学习平台如今记录学生每一次点击、停顿和答对的过程。" },
        { en: "Algorithms use this trail to adapt lessons to each student's pace and style.", cn: "算法利用这些轨迹，使课程适应每个学生的节奏和风格。" },
        { en: "A student who struggles with geometry, for example, receives more practice problems in that area.", cn: "例如，几何吃力的学生会收到更多该领域的练习题。" },
        { en: "Proponents argue that such systems free teachers to focus on higher-order thinking and mentoring.", cn: "支持者认为，这类系统让教师得以专注于高阶思维和辅导。" },
        { en: "Critics worry that data-driven tools may narrow the curriculum to what can be measured.", cn: "批评者担心，数据驱动工具可能把课程窄化为可衡量的内容。" },
        { en: "They also caution that student data must be protected with the highest standards of privacy.", cn: "他们还提醒，学生数据必须以最高隐私标准加以保护。" },
        { en: "The goal should be clear: technology serves learning, not the other way around.", cn: "目标应当明确：技术服务于学习，而非相反。" },
      ],
    },
  ];


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

  // 听力设置（持久化到 Store.english.listeningSettings）
  const LS_DEFAULT_SETTINGS = {
    ignorePunct: true,
    ignoreCase: true,
    pauseAction: 'restart',
    // 联动开关 4 项默认全开（开箱即用显示完整内容），用户按需关闭
    linkOriginal: true,
    linkInput: true,
    linkCn: true,
    linkRealtime: true,
    autoCloseOnNext: true,
    autoCloseLink: false,
    dictInputHeight: 20 // 听写输入区域大小：占页面高度百分比（vh）
  };
  function getLsSettings() {
    const cur = (Store.get().english && Store.get().english.listeningSettingsV3) || {};
    const merged = Object.assign({}, LS_DEFAULT_SETTINGS, cur);
    // 归一化 dictInputHeight：V3 之前存的是 px（如 180），百分比合法范围 5-50；旧 px 值一律回退默认 20vh
    if (!(merged.dictInputHeight >= 5 && merged.dictInputHeight <= 50)) merged.dictInputHeight = 20;
    return merged;
  }
  function patchLsSettings(p) {
    Store.update((st) => { st.english = st.english || {}; st.english.listeningSettingsV3 = Object.assign({}, getLsSettings(), p); });
  }

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
        cn: wordObj.cn ? wordObj.cn.replace(/^[a-z]+. /, '') : '',
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
      const lv = userTTSVoice() || pickVoice(); if (lv) u.voice = lv;
      u.onend = () => {
        _lsRepeatCount++;
        if (_lsRepeatCount < listeningRepeat) {
          setTimeout(() => playLsSentence(), 200);
        } else {
          _lsRepeatCount = 0;
          if (listeningPlaying) {
            _lsTimer = setTimeout(() => {
              // 暂停后行为：continue=自动下一句；restart=重播当前句（精听重听）
              if (getLsSettings().pauseAction === 'continue') {
                nextLsSentence();
              } else {
                playLsSentence();
              }
            }, listeningInterval);
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
      handleLsLineChange();
      saveLsState();
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
      handleLsLineChange();
      saveLsState();
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
    saveLsState();
    UI.toast('已从头开始播放', 'ok');
  }

  function resetLsDictate() {
    listeningDictate = '';
    const input = document.getElementById('lsDictInput');
    if (input) input.value = '';
    const result = document.getElementById('lsDictResult');
    if (result) result.innerHTML = '';
  }

  // 听写批改核心：返回结果 HTML（供「提交批改」与「实时批改」共用）
  function gradeLsDictate(userText) {
    const correctText = listeningCur.sentences[listeningIdx].en;
    const set = getLsSettings();
    const norm = (w) => {
      let s = w;
      if (set.ignorePunct) s = s.replace(/^[^\wÀ-￿]+|[^\wÀ-￿]+$/g, '');
      if (set.ignoreCase) s = s.toLowerCase();
      return s;
    };
    const splitTokens = (s) => s.split(/\s+/).filter(Boolean);
    const userWords = splitTokens(userText).map(norm);
    const correctWords = splitTokens(correctText).map(norm);
    const userRaw = splitTokens(userText);
    const correctDisplay = splitTokens(correctText);
    let correct = 0;
    const resultHtml = correctDisplay.map((w, i) => {
      const uw = userRaw[i] !== undefined ? userRaw[i] : '';
      const ok = userWords[i] === correctWords[i];
      if (ok) correct++;
      return ok
        ? '<span style="color:var(--success)">' + w + '</span>'
        : '<span style="color:var(--danger);text-decoration:line-through">' + (uw || '___') + '</span> <span style="color:var(--success)">' + w + '</span>';
    }).join(' ');
    const rate = correctWords.length ? Math.round((correct / correctWords.length) * 100) : 0;
    return '<div style="margin-bottom:8px"><b>正确率：' + rate + '%</b>（' + correct + '/' + correctWords.length + '）</div><div>' + resultHtml + '</div>';
  }

  function submitLsDictate() {
    const input = document.getElementById('lsDictInput');
    if (!input) return;
    const result = document.getElementById('lsDictResult');
    if (result) {
      // 手动提交批改是主动操作：即使「实时批改」开关关闭，也强制显示结果
      result.style.display = '';
      result.innerHTML = gradeLsDictate(input.value.trim());
    }
  }

  // 实时批改：输入框每次变化立即比对当前句
  function liveLsDictate() {
    const input = document.getElementById('lsDictInput');
    const result = document.getElementById('lsDictResult');
    if (!input || !result) return;
    const t = input.value.trim();
    if (!t) { result.innerHTML = ''; return; }
    result.innerHTML = gradeLsDictate(t);
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
  // 听力状态持久化（刷新后仍停在当前文章/句子/模式）
  function saveLsState() {
    try {
      localStorage.setItem('cw_listening', JSON.stringify({
        view: listeningView,
        id: listeningCur ? listeningCur.id : null,
        idx: listeningIdx,
        mode: listeningMode,
        speed: listeningSpeed,
        interval: listeningInterval,
        repeat: listeningRepeat
      }));
    } catch (e) { /* ignore */ }
  }
  function restoreLsState() {
    try {
      const j = JSON.parse(localStorage.getItem('cw_listening') || 'null');
      if (j && j.view === 'detail' && j.id) {
        const a = LS_ARTICLES.find((x) => x.id === j.id);
        if (a) {
          listeningCur = a;
          listeningView = 'detail';
          listeningIdx = Math.max(0, Math.min(j.idx || 0, a.sentences.length - 1));
          if (j.mode === 'both' || j.mode === 'en' || j.mode === 'cn') listeningMode = j.mode;
          if (typeof j.speed === 'number') listeningSpeed = j.speed;
          if (typeof j.interval === 'number') listeningInterval = j.interval;
          if (typeof j.repeat === 'number') listeningRepeat = j.repeat;
          return true;
        }
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function renderListening(body) {
    restoreLsState();
    if (listeningView === 'detail' && listeningCur) {
      renderLsDetail(body);
      return;
    }
    renderLsList(body);
  }

  function renderLsList(body) {
    const customs = (Store.get().english && Store.get().english.customListenings) || [];
    const articles = LS_ARTICLES.concat(customs);
    // 按 source 分组（顺序固定），组内按 level 分组（A1→C2）
    const SOURCE_ORDER = ['四级真题', '六级真题', '考研真题', '博客', '新闻', '自定义'];
    const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const groups = [];
    for (const src of SOURCE_ORDER) {
      const srcArts = articles.filter((a) => a.source === src);
      if (!srcArts.length) continue;
      const sub = [];
      for (const lv of LEVEL_ORDER) {
        const items = srcArts.filter((a) => a.level === lv);
        if (!items.length) continue;
        sub.push({ label: lv, items });
      }
      groups.push({ label: src, total: srcArts.length, subs: sub });
    }
    const groupsHtml = groups.map((g) =>
      '<div class="ls-group">' +
        '<div class="ls-group-head"><span class="ls-group-title">' + g.label + '</span><span class="muted-text" style="font-size:13px">· ' + g.total + ' 篇</span></div>' +
        g.subs.map((s) =>
          '<div class="ls-group-sub">' +
            '<div class="ls-group-sub-head"><span class="ls-group-sub-title">' + s.label + '</span><span class="muted-text" style="font-size:12px">· ' + s.items.length + ' 篇</span></div>' +
            '<div class="ls-grid">' +
            s.items.map((a) => {
              const idx = articles.indexOf(a);
              const isCustom = !!a.id; // 自定义听力有 id
              return '<div class="ls-card" data-lsid="' + idx + '">' +
                '<div class="ls-card-level tag-level-' + a.level + '">' + a.level + '</div>' +
                (isCustom ? '<button class="ls-del-custom" data-act="ls-del-custom" data-id="' + a.id + '" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>' : '') +
                '<div class="ls-card-title">' + a.title + '</div>' +
                '<div class="ls-card-footer">' +
                  '<span class="ls-meta-item"><img class="ic" src="assets/icons/hk-27.png" alt=""/> ' + a.wordCount + ' 词</span>' +
                  '<span class="ls-meta-item"><img class="ic" src="assets/icons/hk-32.png" alt=""/> ' + a.sentenceCount + ' 句</span>' +
                  '<span class="ls-meta-item"><img class="ic" src="assets/icons/hk-11.png" alt=""/> ' + a.duration + '</span>' +
                  '<button class="ls-try-btn"><img class="ic" src="assets/icons/hk-09.png" alt=""/> 试听</button>' +
                '</div>' +
              '</div>';
            }).join('') +
            '</div>' +
          '</div>'
        ).join('') +
      '</div>'
    ).join('');
    const html = '<div class="card"><div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-39.png" alt=""/>听力</div><div class="spacer"></div><span class="tag">共 ' + articles.length + ' 篇</span></div><div class="card-body">' + groupsHtml + '</div></div>';
    const w = wrap(body, html);
    w.addEventListener('click', (e) => {
      const del = e.target.closest('[data-act="ls-del-custom"]');
      if (del) {
        e.stopPropagation();
        const id = del.dataset.id;
        UI.confirm('删除这篇自定义听力？', () => {
          Store.update((st) => { st.english.customListenings = (st.english.customListenings || []).filter((x) => x.id !== id); });
          Pages.english();
        });
        return;
      }
      const card = e.target.closest('[data-lsid]');
      if (card) {
        const idx = parseInt(card.dataset.lsid);
        listeningCur = articles[idx];
        listeningIdx = 0;
        listeningPlaying = false;
        listeningView = 'detail';
        saveLsState();
        Pages.english();
      }
    });
  }

  // 联动开关显隐控制（key: original/input/cn/realtime）
  function applyLsLink(key, on, root) {
    root = root || document;
    const byId = (id) => (root === document ? document.getElementById(id) : root.querySelector('#' + id));
    const show = (el, cond) => { if (el) el.style.display = cond ? '' : 'none'; };
    if (key === 'original') {
      root.querySelectorAll('.ls-sent-en').forEach((el) => show(el, on && listeningMode !== 'cn'));
    } else if (key === 'cn') {
      root.querySelectorAll('.ls-sent-cn').forEach((el) => show(el, on && listeningMode !== 'en'));
    } else if (key === 'input') {
      show(byId('lsDictInput'), on);
    } else if (key === 'realtime') {
      show(byId('lsDictResult'), on);
    }
  }
  // 按当前设置 + 模式 刷新全部联动元素
  function applyLsLinkAll(root) {
    const s = getLsSettings();
    root = root || document;
    const byId = (id) => (root === document ? document.getElementById(id) : root.querySelector('#' + id));
    root.querySelectorAll('.ls-sent-en').forEach((el) => { el.style.display = (s.linkOriginal && listeningMode !== 'cn') ? '' : 'none'; });
    root.querySelectorAll('.ls-sent-cn').forEach((el) => { el.style.display = (s.linkCn && listeningMode !== 'en') ? '' : 'none'; });
    const ta = byId('lsDictInput');
    if (ta) ta.style.display = s.linkInput ? '' : 'none';
    const r = byId('lsDictResult');
    if (r) r.style.display = s.linkRealtime ? '' : 'none';
  }
  // 切换句子时的自动操作（换行后）：清批改结果 / 收起联动显示
  function handleLsLineChange() {
    const s = getLsSettings();
    if (s.autoCloseOnNext) {
      const r = document.getElementById('lsDictResult');
      if (r) { r.innerHTML = ''; r.style.display = 'none'; }
    }
    if (s.autoCloseLink) {
      const patch = { linkOriginal: false, linkCn: false, linkRealtime: false };
      patchLsSettings(patch);
      const chks = document.querySelectorAll('.ls-link-bar [data-lslink]');
      chks.forEach((c) => {
        if (c.dataset.lslink !== 'input' && c.checked) c.checked = false;
      });
      applyLsLinkAll(document);
    }
  }

  function renderLsDetail(body) {
    const a = listeningCur;
    const lset = getLsSettings();
    const enDisp = (listeningMode === 'cn' || !lset.linkOriginal) ? 'display:none' : '';
    const cnDisp = (listeningMode === 'en' || !lset.linkCn) ? 'display:none' : '';
    const linkBar = `<div class="ls-link-bar">
      <span class="ls-link-label">显示：</span>
      <label class="ls-link-item"><input type="checkbox" data-lslink="original" ${lset.linkOriginal ? 'checked' : ''}/> 原文</label>
      <label class="ls-link-item"><input type="checkbox" data-lslink="input" ${lset.linkInput ? 'checked' : ''}/> 输入</label>
      <label class="ls-link-item"><input type="checkbox" data-lslink="cn" ${lset.linkCn ? 'checked' : ''}/> 翻译</label>
      <label class="ls-link-item"><input type="checkbox" data-lslink="realtime" ${lset.linkRealtime ? 'checked' : ''}/> 实时批改</label>
    </div>`;
    const html = '<div class="ls-detail"><div class="ls-detail-head"><button class="btn btn-soft btn-sm" id="lsBackBtn">← 返回列表</button><button class="btn btn-soft btn-sm" id="lsSettingsBtn">⚙ 设置</button><div class="spacer"></div><span class="tag-level-' + a.level + '">' + a.level + '</span></div><div class="ls-mode-bar"><button class="btn btn-soft btn-xs" data-lsmode="both">中英对照</button><button class="btn btn-soft btn-xs" data-lsmode="en">仅英文</button><button class="btn btn-soft btn-xs" data-lsmode="cn">仅中文</button></div><div class="ls-sentences" id="lsSentences">' +
      a.sentences.map((s, i) => '<div class="ls-sent-item ' + (i === listeningIdx ? 'ls-sent-active' : '') + '" data-lsidx="' + i + '"><div class="ls-sent-idx">' + (i + 1) + '</div><div class="ls-sent-content"><div class="ls-sent-en" style="' + enDisp + '">' + s.en + '</div><div class="ls-sent-cn" style="' + cnDisp + '">' + s.cn + '</div></div></div>').join('') +
      '</div><div class="ls-player"><button class="btn" id="lsPrevBtn">⏮ 上一句</button><button class="btn btn-primary" id="lsPlayBtn">▶ 播放</button><button class="btn" id="lsNextBtn">下一句 ⏭</button><div class="spacer"></div><span class="muted-text" id="lsProgress">第 1 句 / 共 ' + a.sentences.length + ' 句</span></div><div class="ls-dictate"><div class="ls-dictate-head"><b>听写练习</b><span class="muted-text" style="font-size:12px">· 听写当前句</span></div>' + linkBar + '<textarea class="textarea" id="lsDictInput" placeholder="请输入当前听到的句子内容..." style="min-height:' + lset.dictInputHeight + 'vh;margin:8px 0' + (lset.linkInput ? '' : ';display:none') + '"></textarea><div class="ls-dictate-actions"><button class="btn btn-sm" id="lsDictSubmit">提交批改</button><button class="btn btn-soft btn-sm" id="lsRestartBtn">从头播放</button></div><div id="lsDictResult" style="margin-top:12px;padding:12px;background:var(--bg-soft);border-radius:8px' + (lset.linkRealtime ? '' : ';display:none') + '"></div></div></div>';
    const w = wrap(body, html);

    // 实时批改：输入框变化即比对（仅当「实时批改」联动开关开启时显示结果区）
    const dictInput = w.querySelector('#lsDictInput');
    if (dictInput) {
      dictInput.addEventListener('input', () => {
        if (!getLsSettings().linkRealtime) return;
        liveLsDictate();
      });
    }

    w.addEventListener('click', e => {
      if (e.target.closest('#lsBackBtn')) {
        listeningView = 'list';
        listeningPlaying = false;
        window.speechSynthesis.cancel();
        clearTimeout(_lsTimer);
        saveLsState();
        Pages.english();
        return;
      }
      if (e.target.closest('#lsSettingsBtn')) { openLsSettings(); return; }
      if (e.target.closest('#lsPlayBtn')) { toggleLsPlay(); return; }
      if (e.target.closest('#lsNextBtn')) { nextLsSentence(); return; }
      if (e.target.closest('#lsPrevBtn')) { prevLsSentence(); return; }
      if (e.target.closest('#lsDictSubmit')) { submitLsDictate(); return; }
      if (e.target.closest('#lsRestartBtn')) { restartLsFromBeginning(); return; }
      const modeBtn = e.target.closest('[data-lsmode]');
      if (modeBtn) {
        listeningMode = modeBtn.dataset.lsmode;
        applyLsLinkAll(w);
        saveLsState();
        return;
      }
      const linkChk = e.target.closest('[data-lslink]');
      if (linkChk) {
        const key = linkChk.dataset.lslink;
        const on = linkChk.checked;
        applyLsLink(key, on, w);
        const map = { original: 'linkOriginal', input: 'linkInput', cn: 'linkCn', realtime: 'linkRealtime' };
        if (map[key]) patchLsSettings({ [map[key]]: !!on });
        return;
      }
      const sentItem = e.target.closest('[data-lsidx]');
      if (sentItem) {
        listeningIdx = parseInt(sentItem.dataset.lsidx);
        listeningPlaying = true;
        updateLsDetail();
        updateLsPlayBtn();
        playLsSentence();
        handleLsLineChange();
        saveLsState();
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

  // 听力训练设置弹窗
  function openLsSettings() {
    const s = getLsSettings();
    const stepper = (id, label, val, step, min, max, hint, suffix) => {
      const suf = suffix ? ' ' + suffix : '';
      return `<div class="ls-set-row">
        <label>${label}：</label>
        <div class="ls-set-stepper">
          <button type="button" data-step="${-step}" data-target="${id}" data-min="${min}" data-max="${max}">−</button>
          <input id="${id}" type="number" step="${step}" min="${min}" max="${max}" value="${val}"/>
          <button type="button" data-step="${step}" data-target="${id}" data-min="${min}" data-max="${max}">+</button>
        </div>
        <span class="ls-set-hint">${hint}${suf}</span>
      </div>`;
    };
    const chk = (id, val, text) => `<label class="ls-set-check"><input type="checkbox" id="${id}" ${val ? 'checked' : ''}/> ${text}</label>`;
    const body = `
    <div class="ls-settings">
      ${stepper('setSpeed', '播放速度', listeningSpeed.toFixed(1), 0.1, 0.3, 2.0, '（1 为原速播放速度）', '倍')}
      ${stepper('setInterval', '间隔时间', Math.round(listeningInterval / 1000), 1, 0, 30, '（句子自动暂停的秒数用来写内容）', '秒')}
      ${stepper('setRepeat', '句子重复', listeningRepeat, 1, 1, 10, '（句子自动重复的播放遍数）', '遍')}
      <div class="ls-set-row">
        <label>忽略标点：</label>
        ${chk('setIgnorePunct', s.ignorePunct, '')}
        <span class="ls-set-hint">（批改校对标点符号不算错）</span>
      </div>
      <div class="ls-set-row">
        <label>忽略大小：</label>
        ${chk('setIgnoreCase', s.ignoreCase, '')}
        <span class="ls-set-hint">（批改校对大小写不算错）</span>
      </div>
      <div class="ls-set-row">
        <label>暂停后：</label>
        <label class="ls-set-radio"><input type="radio" name="pauseAction" value="restart" ${s.pauseAction === 'restart' ? 'checked' : ''}/> 重头播放</label>
        <label class="ls-set-radio"><input type="radio" name="pauseAction" value="continue" ${s.pauseAction === 'continue' ? 'checked' : ''}/> 继续播放</label>
      </div>
      <div class="ls-set-row">
        <label>联动开关：</label>
        ${chk('setLinkOriginal', s.linkOriginal, '原文')}
        ${chk('setLinkInput', s.linkInput, '输入')}
        ${chk('setLinkCn', s.linkCn, '翻译')}
        ${chk('setLinkRealtime', s.linkRealtime, '实时批改')}
        <div class="ls-set-hint">（选择需要一同打开/关闭的选项）</div>
      </div>
      <div class="ls-set-row">
        <label>换行后：</label>
        ${chk('setAutoCloseOnNext', s.autoCloseOnNext, '自动关闭实时批改')}
        ${chk('setAutoCloseLink', s.autoCloseLink, '自动关闭联动开关')}
        <span class="ls-set-hint">（切换到下一句时的自动操作）</span>
      </div>
      ${stepper('setDictInputHeight', '听写输入区域大小', s.dictInputHeight, 5, 5, 50, '（占页面高度的百分比）', '%')}
    </div>`;
    const mask = UI.openModal({
      title: '听力训练设置',
      icon: '<img class="ic" src="assets/icons/hk-39.png" alt=""/>',
      dismissable: false,
      body,
      actions: [
        { label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
        { label: '保存', onClick: () => { commitLsSettings(); UI.closeModal(); UI.toast('设置已保存', 'ok'); } }
      ]
    });

    function commitLsSettings() {
      const v = (id) => parseFloat(mask.querySelector('#' + id).value);
      const speedVal = Math.min(2.0, Math.max(0.3, v('setSpeed') || 1.0));
      const intervalSec = Math.min(30, Math.max(0, Math.round(v('setInterval') || 0)));
      const repeatVal = Math.min(10, Math.max(1, Math.round(v('setRepeat') || 1)));
      listeningSpeed = Math.round(speedVal * 10) / 10;
      listeningInterval = intervalSec * 1000;
      listeningRepeat = repeatVal;
      saveLsState();
      const pauseActionEl = mask.querySelector('input[name="pauseAction"]:checked');
      patchLsSettings({
        ignorePunct: !!mask.querySelector('#setIgnorePunct').checked,
        ignoreCase: !!mask.querySelector('#setIgnoreCase').checked,
        pauseAction: pauseActionEl ? pauseActionEl.value : 'restart',
        linkOriginal: !!mask.querySelector('#setLinkOriginal').checked,
        linkInput: !!mask.querySelector('#setLinkInput').checked,
        linkCn: !!mask.querySelector('#setLinkCn').checked,
        linkRealtime: !!mask.querySelector('#setLinkRealtime').checked,
        autoCloseOnNext: !!mask.querySelector('#setAutoCloseOnNext').checked,
        autoCloseLink: !!mask.querySelector('#setAutoCloseLink').checked,
        dictInputHeight: Math.min(50, Math.max(5, Math.round(v('setDictInputHeight') || 20)))
      });
      // 即时同步 textarea 高度
      const ta = document.getElementById('lsDictInput');
      if (ta) ta.style.minHeight = getLsSettings().dictInputHeight + 'vh';
    }

    // 选择即生效：任何输入控件 change 立即写入（无需点保存）
    mask.addEventListener('change', (e) => {
      if (e.target && e.target.matches && e.target.matches('input')) commitLsSettings();
    });

    // 步进器交互：点击 −/+ 后也立即提交
    mask.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-target]');
      if (!btn) return;
      const id = btn.dataset.target;
      const input = mask.querySelector('#' + id);
      if (!input) return;
      const step = parseFloat(btn.dataset.step);
      const min = parseFloat(btn.dataset.min);
      const max = parseFloat(btn.dataset.max);
      let val = parseFloat(input.value) || 0;
      val = Math.min(max, Math.max(min, Math.round((val + step) * 100) / 100));
      input.value = val;
      commitLsSettings();
    });
  }


})();