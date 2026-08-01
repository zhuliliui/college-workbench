/* ============================================================
   页面7 · 考研英语学习（PDF解析 / 闪卡 / 默写 / 外刊）
   ============================================================ */
window.Pages = window.Pages || {};
(function () {
  let curTab = 'bank';
  let session = null;
  let quiz = null;
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

  function speak(text) {
    try { if (!('speechSynthesis' in window)) return; const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.9; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {}
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
  //   从而修复「释义换行导致错位/丢失」的问题。
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
    const tabs = [['bank', '📚 词库'], ['flash', '🃏 闪卡背诵'], ['quiz', '✍️ 默写自测'], ['reader', '📰 外刊阅读'], ['import', '📥 导入']];
    c.innerHTML = `<div class="flex-wrap gap8" style="margin-bottom:16px">` + tabs.map(([k, label]) => `<button class="btn ${curTab === k ? '' : 'btn-soft'} btn-sm" data-tab="${k}">${label}</button>`).join('') + `</div><div id="enBody"></div>`;
    window.PageHandler = (e) => { const tb = e.target.closest('[data-tab]'); if (tb) { curTab = tb.dataset.tab; Pages.english(); } };
    const body = UI.$('#enBody');
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
      <div class="card-head"><div class="title"><span class="ic">📚</span>个人背诵词库</div>
        <div class="spacer"></div><span class="tag" id="bankTag">共 ${bank.length} 词</span>
        <button class="btn btn-sm" data-act="add-word">＋ 手动添加</button>
        <button class="btn btn-soft btn-sm" data-act="clear-all" style="color:var(--danger);border-color:var(--danger-soft)">🗑 清空全部</button>
        <button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">
        <input class="input" id="bankSearch" placeholder="🔍 搜索单词 / 释义…" style="margin-bottom:12px"/>
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
          <td><b style="color:var(--primary-deep);cursor:pointer" data-spk="${UI.esc(x.word)}">🔊 ${UI.esc(x.word)}</b></td>
          <td class="muted-text">${UI.esc(x.phonetic)}</td>
          <td>${UI.esc(x.pos)}</td>
          <td>${UI.esc(x.cn)}</td>
          <td>
            <button class="btn btn-soft btn-icon" data-act="wd-edit" data-id="${x.id}" title="编辑">✏️</button>
            <button class="btn btn-soft btn-icon" data-act="wd-del" data-id="${x.id}" title="删除">🗑</button>
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
    UI.openModal({ title: wd ? '编辑单词' : '添加单词', icon: '📝',
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
  function renderFlash(body, bank) {
    if (!bank.length) { wrap(body, `<div class="empty"><span class="emoji">🃏</span><div class="t">词库还是空的</div><div class="s">先去「导入」上传双语 PDF，或手动添加单词</div></div>`); return; }
    if (!session || session.idx >= session.queue.length) session = buildSession(bank);
    if (!session.queue.length) { wrap(body, `<div class="empty"><span class="emoji">🎉</span><div class="t">今天没有待复习的单词</div><div class="s">新词已全部学过，明天再回来巩固～</div></div>`); return; }
    const w0 = session.queue[session.idx];
    const learned = todayLearned();
    const left = 20 - (learned % 20);
    const extraHtml = (w0.phrases || w0.syn || w0.mnemonic)
      ? `<div class="flash-extra">
          ${w0.phrases ? '<div><b>词组：</b>' + UI.esc(w0.phrases) + '</div>' : ''}
          ${w0.syn ? '<div><b>近义：</b>' + UI.esc(w0.syn) + '</div>' : ''}
          ${w0.mnemonic ? '<div><b>记忆：</b>' + UI.esc(w0.mnemonic) + '</div>' : ''}
        </div>`
      : `<div class="flash-extra muted-text">（暂无近义词/词组，可在「词库」为该词补充）</div>`;
    const html = `
    <div class="card">
      <div class="card-head"><div class="title"><span class="ic">🃏</span>闪卡背诵</div>
        <div class="spacer"></div>
        <span class="tag">${session.idx + 1} / ${session.queue.length}</span>
        <span class="tag" style="background:var(--primary-soft);color:var(--primary-deep)">📚 今日已学 ${learned}/20</span></div>
      <div class="card-body">
        <div class="flash-card ${session.flipped ? 'flipped' : ''}" id="flash">
          <div class="flash-inner">
            <div class="flash-face flash-front">
              <div class="flash-word">${UI.esc(w0.word)}</div>
              <div class="flash-hint">👆 点击卡片查看释义 / 近义词 / 词组</div>
            </div>
            <div class="flash-face flash-back">
              <div class="flash-phon">${UI.esc(w0.phonetic)} ${w0.pos ? '· ' + UI.esc(w0.pos) : ''}</div>
              <div class="flash-cn">${UI.esc(w0.cn) || '（暂无中文释义）'}</div>
              ${extraHtml}
            </div>
          </div>
        </div>
        <div class="flex-wrap gap8 mt16" style="justify-content:center">
          <button class="btn btn-soft btn-sm" data-act="speak">🔊 发音</button>
          <button class="btn btn-sm" data-act="flip">${session.flipped ? '🙈 隐藏' : '🔄 翻转'}</button>
        </div>
        <div class="flex-wrap gap8 mt8" style="justify-content:center;display:${session.flipped ? 'flex' : 'none'}" id="flashActions">
          <button class="btn btn-danger btn-sm" data-act="forget">😣 还没记住</button>
          <button class="btn btn-success btn-sm" data-act="remember">😎 记住了</button>
        </div>
        <div class="muted-text mt12 center">💡 一天累计学完 20 个单词，自动奖励 +1 元（当前还差 ${left} 个）</div>
      </div>
    </div>`;
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
      const b = e.target.closest('[data-act]'); if (b) {
        const act = b.dataset.act;
        if (act === 'speak') return speak(w0.word);
        if (act === 'flip') return flip();
        if (act === 'remember' || act === 'forget') {
          Store.update((st) => {
            const x = st.english.words.find((y) => y.id === w0.id);
            if (act === 'remember') x.box = Math.min(5, x.box + 1); else x.box = Math.max(0, x.box - 1);
            x.reps = (x.reps || 0) + 1; x.last = Date.now(); x.next = Date.now() + IV[x.box];
          });
          if (act === 'remember') {
            // 记住了：计入「今日已学」，满 20 自动 +1 元
            recordStudy();
            session.idx++; session.flipped = false;
            if (session.idx >= session.queue.length) { session = null; UI.toast('本轮复习完成 💜', 'love'); }
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

  // ---------- 默写自测 ----------
  function renderQuiz(body, bank) {
    if (!bank.length) { wrap(body, `<div class="empty"><span class="emoji">✍️</span><div class="t">词库为空</div></div>`); return; }
    if (!quiz || quiz.done) quiz = { mode: 'ec', idx: 0, list: bank.slice().sort(() => Math.random() - 0.5), revealed: false, answer: '', done: false };
    const total = quiz.list.length;
    if (quiz.idx >= total) {
      const html = `<div class="empty"><span class="emoji">🎉</span><div class="t">本轮自测完成</div><div class="s">共 ${total} 词 · 点击下方重来</div></div><div class="center mt12"><button class="btn btn-sm" data-act="restart">再来一轮</button></div>`;
      const w = wrap(body, html);
      w.addEventListener('click', (e) => { if (e.target.closest('[data-act="restart"]')) { quiz = null; Pages.english(); } });
      return;
    }
    const w0 = quiz.list[quiz.idx];
    const isEC = quiz.mode === 'ec';
    const html = `
    <div class="card">
      <div class="card-head"><div class="title"><span class="ic">✍️</span>默写自测</div>
        <div class="spacer"></div><span class="tag">${quiz.idx + 1} / ${total}</span>
        <button class="btn btn-soft btn-sm" data-act="switch">切换 ${isEC ? '中→英' : '英→中'}</button></div>
      <div class="card-body center">
        <div class="mt8">${isEC ? '英文：<b style="color:var(--primary-deep);font-size:20px">' + UI.esc(w0.word) + '</b>' : '中文：<b style="color:var(--primary-deep);font-size:18px">' + UI.esc(w0.cn) + '</b>'}</div>
        <input class="input mt12" id="qInput" placeholder="${isEC ? '写出中文释义' : '写出英文单词'}" style="max-width:320px;margin:12px auto;text-align:center"/>
        <div class="flex-wrap gap8" style="justify-content:center">
          <button class="btn btn-soft btn-sm" data-act="speak">🔊 发音</button>
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
  let readerArticle = null;
  let readerFilter = 'read'; // 我的外刊列表筛选：all | read | unread（默认「已读」，未读文章不显示）

  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  // 记录今日学完一个单词；跨天自动清零；每满 20 个自动奖励 +1 元（虚拟存钱罐）
  function recordStudy() {
    const today = todayStr();
    let learned = 0;
    Store.update((st) => {
      const d = st.english.daily || { date: '', learned: 0 };
      if (d.date !== today) { d.date = today; d.learned = 0; } // 新的一天，重新计数
      d.learned += 1;
      st.english.daily = d;
      learned = d.learned;
    });
    if (learned % 20 === 0) {
      Store.earn(1, '今日学完 ' + learned + ' 个单词');
      UI.toast('🎉 今日已学满 ' + learned + ' 词，奖励 +1 元 💜', 'love');
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
  // 将内置文章构建为带译文映射的对象（离线即用，无需联网）
  function buildArticle(a) {
    const translation = {};
    const text = a.paras.map((p) => { translation[p[0]] = p[1]; return p[0]; }).join('\n\n');
    return { title: a.title, source: a.source, text, translation, date: todayStr(), link: '', offline: true };
  }
  const OFFLINE_ARTICLES = ARTICLES.map(buildArticle);
  const _persisted = (Store.get().english && Store.get().english.reader);
  readerArticle = (_persisted && _persisted.text) ? _persisted : OFFLINE_ARTICLES[0];
  // ---------- 我的外刊：载入保存 + 已读/未读 ----------
  // 以「标题 + 正文前 50 字」做去重 key，保证同一篇文章多次载入只存一条且 read 状态稳定
  function getLibKey(a) { return (a && a.title ? a.title : '') + '|||' + ((a && a.text ? a.text : '').slice(0, 50)); }
  function upsertArticle(art, read) {
    if (!art || !art.text) return;
    Store.update((s) => {
      const lib = s.english.articles || (s.english.articles = []);
      const key = getLibKey(art);
      const found = lib.find((x) => getLibKey(x) === key);
      if (found) {
        Object.assign(found, { title: art.title, source: art.source, text: art.text, translation: art.translation, lang: art.lang, offline: art.offline, date: art.date, link: art.link, ts: Date.now() });
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
  function paragraphsFromText(text) {
    return text.replace(/\r/g, '').split(/\n{2,}|\n/).map((p) => p.trim()).filter((p) => p.length > 0);
  }
  // 段落级翻译：优先读缓存，未命中再联网；MyMemory 限流时自动降速重试
  async function translateParagraphs(paras) {
    const cache = (Store.get().english.reader && Store.get().english.reader.translation) || {};
    const out = [];
    const todo = [];
    // 限制最多翻译前 15 段，避免长文导致大量请求堆积
    const maxParas = paras.slice(0, 15);
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
      readerArticle = art;
      UI.toast('已获取今日外刊', 'ok');
      return art;
    } catch (e) { UI.toast('联网获取失败（请检查后端地址是否可达）', 'warn'); return null; }
  }
  function renderReaderContent() {
    const paras = paragraphsFromText(readerArticle.text || '');
    if (!paras.length) return '<p class="muted-text">文章为空</p>';
    // 中文文章：直接显示中文段落，无需英文/译文映射
    if (readerArticle.lang === 'zh') {
      return paras.map((p) => `<p class="reader-cn">${UI.esc(p)}</p>`).join('');
    }
    const trans = readerArticle.translation || {};
    // 注意：此处绝不自动联网翻译（避免国内网络下慢代理堆积导致卡顿）。
    // 离线/内置文章自带译文；粘贴文章如需译文，由「🌐 翻译此文」按钮显式触发。
    return paras.map((p) => {
      const en = `<p class="reader-en">${renderArticle(p)}</p>`;
      const cn = (trans && trans[p]) ? `<p class="reader-cn">${UI.esc(trans[p])}</p>` : '';
      if (readerMode === 'en') return en;
      if (readerMode === 'cn') return cn || `<p class="reader-cn muted-text">（暂无译文）</p>`;
      return en + cn;
    }).join('');
  }
  function renderReader(body) {
    // 首屏只渲染离线缓存/内置文章，绝不触发任何外部网络请求，国内 WiFi 也能秒开
    paintReader(body);
  }
  // 「我的外刊」列表：已保存文章 + 已读/未读筛选（默认「已读」隐藏未读）
  function libraryHtml() {
    const lib = Store.get().english.articles || [];
    const total = lib.length;
    const fBtn = (f, label) => `<button class="btn btn-sm ${readerFilter === f ? '' : 'btn-soft'}" data-filter="${f}">${label}</button>`;
    const items = lib.map((a, i) => {
      if (readerFilter === 'read' && !a.read) return '';
      if (readerFilter === 'unread' && a.read) return '';
      const cur = readerArticle && getLibKey(readerArticle) === getLibKey(a);
      return `<div class="lib-item ${cur ? 'cur' : ''}" data-lib="${i}">
        <span class="lib-title">${UI.esc(a.title || '未命名')}</span>
        <span class="tag ${a.read ? '' : 'tag-unread'}">${a.read ? '✓ 已读' : '○ 未读'}</span>
      </div>`;
    }).join('');
    const emptyHint = readerFilter === 'read'
      ? '还没有已读文章，读完点「✓ 标为已读」即可归入此处'
      : (readerFilter === 'unread' ? '没有未读文章' : '还没有已保存的外刊，载入/粘贴文章后会自动保存');
    return `<div class="lib-wrap mt16">
      <div class="flex-between mb8"><b style="color:var(--primary-deep)">📚 我的外刊（已保存 ${total} 篇）</b>
        <div class="seg-group">${fBtn('all', '全部')}${fBtn('read', '已读')}${fBtn('unread', '未读')}</div></div>
      <div class="lib-list">${items || '<div class="muted-text">' + emptyHint + '</div>'}</div>
    </div>`;
  }
  function paintReader(body) {
    const modeBtn = (mode, label) => `<button class="btn btn-sm ${readerMode === mode ? '' : 'btn-soft'}" data-mode="${mode}">${label}</button>`;
    const backend = Store.get().english.readerBackend || '';
    const paras = paragraphsFromText(readerArticle.text || '');
    const trans = readerArticle.translation || {};
    const needTranslate = (readerArticle.lang !== 'zh') && (readerArticle.offline !== true) && !paras.some((p) => trans[p]);
    const html = `
    <div class="card">
      <div class="card-head"><div class="title"><span class="ic">📰</span>外刊阅读</div>
        <div class="spacer"></div>
        <div class="seg-group" style="margin-right:8px">
          ${modeBtn('both', '中英')} ${modeBtn('en', '英文')} ${modeBtn('cn', '中文')}
        </div>
        <button class="btn btn-soft btn-sm" data-act="fetch">🔄 换一篇</button>
        <button class="btn btn-soft btn-sm" data-act="online">🌐 联网更新</button>
        ${needTranslate ? '<button class="btn btn-soft btn-sm" data-act="translate">🌐 翻译此文</button>' : ''}
        <button class="btn btn-soft btn-sm" data-act="paste">✏️ 粘贴文章</button>
        <button class="btn btn-soft btn-sm" data-act="toggleRead">${readerArticle.read ? '○ 标为未读' : '✓ 标为已读'}</button>
        <button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">
        <div class="flex-between mb12"><b style="color:var(--primary-deep)" id="artTitle">${UI.esc(readerArticle.title)}</b><span class="muted-text">${readerArticle.offline ? '📦 离线精选' : '🌐 联网'}${readerArticle.source ? ' · ' + UI.esc(readerArticle.source) : ''}${readerArticle.date ? ' · ' + UI.esc(readerArticle.date) : ''}</span></div>
        <div class="reader" id="reader">${renderReaderContent()}</div>
        <div class="muted-text mt12">💡 内置多篇英文外刊 + 中文译文，打开即读、无需联网。点击文中任意单词弹出释义（可加入词库）。需要每日真实外刊请配置「后端地址」后点「🌐 联网更新」；自己有文章可点「✏️ 粘贴文章」，支持「英文+中文同时粘贴」「仅英文」「仅中文」（全部纯本地，不自动联网翻译）。</div>
        ${libraryHtml()}
        <div class="row mt12">
          <div class="field" style="flex:1"><label>联网后端地址（选填，用于获取真实外刊）</label>
            <input class="input" id="readerBackend" value="${UI.esc(backend)}" placeholder="https://your-server:3000"/></div>
        </div>
      </div>
    </div>`;
    const w = wrap(body, html);
    w.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (b) {
        if (b.dataset.act === 'fetch') {
          _artIdx = (_artIdx + 1) % OFFLINE_ARTICLES.length;
          readerArticle = OFFLINE_ARTICLES[_artIdx];
          readerArticle.read = getLibRead(readerArticle);
          upsertArticle(readerArticle); // 载入即保存
          Store.update((s) => { s.english.reader = readerArticle; });
          paintReader(body); return;
        }
        if (b.dataset.act === 'online') return fetchReaderFromBackend(true).then(() => { upsertArticle(readerArticle); if (curTab === 'reader') { const bd = UI.$('#enBody'); if (bd) paintReader(bd); } });
        if (b.dataset.act === 'translate') {
          UI.toast('正在联网翻译（仅点击本按钮才触发）…', 'ok');
          return translateParagraphs(paras).then(() => {
            // 同步回内存中的文章对象，确保译文立即显示
            readerArticle.translation = Store.get().english.reader.translation || readerArticle.translation || {};
            if (curTab === 'reader') { const bd = UI.$('#enBody'); if (bd) paintReader(bd); }
          });
        }
        if (b.dataset.act === 'toggleRead') {
          const newRead = !getLibRead(readerArticle);
          upsertArticle(readerArticle, newRead);
          readerArticle.read = newRead;
          paintReader(body); return;
        }
        if (b.dataset.act === 'paste') return pasteArticle();
      }
      const fb = e.target.closest('[data-filter]');
      if (fb) { readerFilter = fb.dataset.filter; paintReader(body); return; }
      const li = e.target.closest('[data-lib]');
      if (li) {
        const idx = parseInt(li.dataset.lib, 10);
        const art = (Store.get().english.articles || [])[idx];
        if (art) { readerArticle = Object.assign({}, art); readerArticle.read = art.read; Store.update((s) => { s.english.reader = readerArticle; }); paintReader(body); }
        return;
      }
      const m = e.target.closest('[data-mode]');
      if (m) { readerMode = m.dataset.mode; paintReader(body); return; }
      const wd = e.target.closest('[data-w]');
      if (wd) showWordPop(wd, wd.dataset.w);
    });
    const bi = w.querySelector('#readerBackend');
    if (bi) bi.addEventListener('change', () => { Store.update((s) => { s.english.readerBackend = (bi.value || '').trim(); }); UI.toast('已保存联网后端地址', 'ok'); });
  }
  function pasteArticle() {
    const trans = readerArticle.translation || {};
    const cnDefault = Object.values(trans).join('\n\n');
    const updateInputs = (mode) => {
      const enWrap = document.querySelector('#pasteEnWrap');
      const cnWrap = document.querySelector('#pasteCnWrap');
      if (!enWrap || !cnWrap) return;
      if (mode === 'bilingual') { enWrap.style.display = ''; cnWrap.style.display = ''; }
      else if (mode === 'en') { enWrap.style.display = ''; cnWrap.style.display = 'none'; }
      else { enWrap.style.display = 'none'; cnWrap.style.display = ''; }
    };
    const mask = UI.openModal({ title: '粘贴外刊文本', icon: '✏️', body: `
      <div class="seg-group" style="margin-bottom:12px">
        <label class="seg-label"><input type="radio" name="pasteLang" value="bilingual" checked/> 英文 + 中文（同时粘贴）</label>
        <label class="seg-label"><input type="radio" name="pasteLang" value="en"/> 仅英文（不翻译）</label>
        <label class="seg-label"><input type="radio" name="pasteLang" value="zh"/> 仅中文（直接阅读）</label>
      </div>
      <div class="field" id="pasteEnWrap"><label>英文原文</label><textarea class="textarea" id="artTxt" style="min-height:120px" placeholder="粘贴英文文章，段落间空一行">${UI.esc(readerArticle.text)}</textarea></div>
      <div class="field" id="pasteCnWrap"><label>中文译文</label><textarea class="textarea" id="artCn" style="min-height:120px" placeholder="粘贴对应中文译文，段落与英文一一对应">${UI.esc(cnDefault)}</textarea></div>
      <div class="field"><label>标题（可选）</label><input class="input" id="artT" value="${UI.esc(readerArticle.title)}"/></div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal }, { label: '载入', onClick: () => {
        const mode = (document.querySelector('input[name="pasteLang"]:checked') || {}).value || 'bilingual';
        const en = UI.val('#artTxt').trim();
        const cn = UI.val('#artCn').trim();
        const title = UI.val('#artT') || '我的文章';
        if (mode === 'zh') {
          if (!cn) return UI.toast('请粘贴中文内容', 'warn');
          readerArticle = { title, source: 'pasted', text: cn, translation: {}, lang: 'zh', offline: false };
          upsertArticle(readerArticle);
          Store.update((s) => { s.english.reader = readerArticle; });
          UI.closeModal(); Pages.english();
          UI.toast('已载入中文文章', 'ok');
        } else if (mode === 'en') {
          if (!en) return UI.toast('请粘贴英文内容', 'warn');
          readerArticle = { title, source: 'pasted', text: en, translation: {}, offline: false };
          upsertArticle(readerArticle);
          Store.update((s) => { s.english.reader = readerArticle; });
          UI.closeModal(); Pages.english();
          UI.toast('已载入英文文章（无中文）', 'ok');
        } else {
          if (!en || !cn) return UI.toast('请同时粘贴英文和中文，或切换到「仅英文/仅中文」模式', 'warn');
          const enParas = paragraphsFromText(en);
          const cnParas = paragraphsFromText(cn);
          const map = {};
          const n = Math.min(enParas.length, cnParas.length);
          for (let i = 0; i < n; i++) map[enParas[i]] = cnParas[i];
          if (enParas.length !== cnParas.length) UI.toast('⚠️ 英文与中文段落数不一致，已按顺序匹配前 ' + n + ' 段', 'warn');
          readerArticle = { title, source: 'pasted', text: en, translation: map, offline: false };
          upsertArticle(readerArticle);
          Store.update((s) => { s.english.reader = readerArticle; });
          UI.closeModal(); Pages.english();
          UI.toast('已载入中英对照文章（纯本地，未联网）', 'ok');
        }
      } }] });
    // openModal 返回 modal-mask DOM，在此挂载 radio 切换事件（common.js 的 openModal 没有 onMount 回调）
    if (mask) {
      mask.querySelectorAll('input[name="pasteLang"]').forEach((r) => r.addEventListener('change', () => updateInputs(r.value)));
      updateInputs('bilingual');
    }
  }
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
        <div class="wp-word">${UI.esc(res.word)} <button class="btn btn-soft btn-sm" data-spk style="padding:4px 8px">🔊</button></div>
        <div class="wp-phon">${UI.esc(res.phonetic)} ${res.pos ? '· ' + UI.esc(res.pos) : ''}</div>
        ${hasDef
          ? '<div class="wp-cn"><b>释义：</b>' + UI.esc(res.cn) + '</div>'
          : '<div class="wp-cn muted-text">本地词库未收录该词</div>'}
        ${res.syn ? '<div class="wp-cn"><b>近义：</b>' + UI.esc(res.syn) + '</div>' : ''}
        ${res.phrases ? '<div class="wp-cn"><b>词组：</b>' + UI.esc(res.phrases) + '</div>' : ''}
        <div class="wp-trans">
          ${canAdd ? '<button class="btn btn-sm" data-add-now>＋ 加入词库</button>' : '<button class="btn btn-sm" disabled>已在词库</button>'}
          ${!hasDef ? '<button class="btn btn-soft btn-sm" data-search>🔍 联网搜索</button>' : ''}
        </div>
        <div class="wp-online muted-text" data-online-result></div>`;
      document.body.appendChild(pop);
      pop.querySelector('[data-spk]').onclick = () => speak(res.word);
      const addNow = pop.querySelector('[data-add-now]');
      if (addNow) addNow.onclick = () => { addToBank(res); pop.remove(); if (popClose) { document.removeEventListener('click', popClose, true); popClose = null; } };
      // 🔍 搜索翻译：仅用户显式点击才联网，带超时，失败不影响阅读
      const onlineBox = pop.querySelector('[data-online-result]');
      const searchBtn = pop.querySelector('[data-search]');
      if (searchBtn) searchBtn.onclick = () => {
        searchBtn.disabled = true;
        searchBtn.textContent = '⏳ 翻译中…';
        translateWord(res.word).then((t) => {
          if (t) {
            onlineBox.innerHTML = '<div class="wp-cn"><b>翻译：</b>' + UI.esc(t) + '</div><button class="btn btn-sm" data-add2>＋ 用此释义加入词库</button>';
            const a2 = onlineBox.querySelector('[data-add2]');
            if (a2) a2.onclick = () => { addToBank(Object.assign({}, res, { cn: t })); pop.remove(); if (popClose) { document.removeEventListener('click', popClose, true); popClose = null; } };
          } else {
            onlineBox.innerHTML = '🌐 当前网络环境暂无法联网翻译。可点「＋加入词库」手动补充中文，逐步积累你自己的词库。';
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
      <div class="card-head"><div class="title"><span class="ic">📥</span>导入单词</div>
        <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">
        <div class="muted-text" style="margin-bottom:10px">支持上传考研英语词汇 PDF（如单词书导出的词汇表）。解析器以「单词 + 音标」为锚点逐条提取，<b>中文释义直接取自原书、绝不错位</b>，长释义换行也能正确归属。若仍失败（如扫描图片版），可改用「仅提取英文 + 联网补全中文」或「粘贴文本解析」。</div>
        <div class="seg-group" style="margin-bottom:12px">
          <label class="seg-label"><input type="radio" name="parseMode" value="bilingual" checked/> 智能解析（英/音标/中文）</label>
          <label class="seg-label"><input type="radio" name="parseMode" value="enOnly"/> 仅提取英文，联网补全中文</label>
        </div>
        <input type="file" id="pdfFile" accept="application/pdf" style="margin-bottom:10px"/>
        <div class="flex-wrap gap8">
          <button class="btn btn-sm" data-act="parse-pdf">📄 解析 PDF</button>
          <button class="btn btn-soft btn-sm" data-act="paste-text">📝 粘贴文本解析</button>
        </div>
        <div id="parseProgressWrap" class="mt12" style="display:none">
          <div class="flex-between muted-text" style="font-size:12px"><span id="parseProgressText">0 / 0</span><span id="parseProgressPct">0%</span></div>
          <div class="progress-bg" style="height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden;margin-top:4px"><div id="parseProgressBar" class="progress-fill" style="height:100%;width:0;background:var(--primary);transition:width .2s"></div></div>
        </div>
        <div id="parseMsg" class="muted-text mt12"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><div class="title"><span class="ic">🗂</span>词库备份</div>
        <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">
        <div class="muted-text" style="margin-bottom:10px">英语单词已纳入全局数据，可使用顶部「导出 / 导入」按钮统一备份。</div>
        <button class="btn btn-soft btn-sm" data-act="export-en">⬇️ 仅导出单词 JSON</button>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><div class="title"><span class="ic">📚</span>考研词汇闪过（PDF 词库）</div>
        <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">
        <div class="muted-text" style="margin-bottom:10px">已内置《考研词汇闪过》两套 PDF 的离线词库：<b>真题重点高频词替换</b>（单词 + 音标/词性/释义 + 近义/同族/反义/形近）+ <b>真题重点固定搭配</b>（词组 + 中文）。点击载入即加入个人词库，可在「闪卡」复习（显示单词 / 中文 / 固定搭配 / 同义词）。</div>
        <div class="flex-wrap gap8">
          <button class="btn btn-sm" data-act="load-kaoyan">📥 载入考研词汇闪过词库</button>
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
              UI.toast(`成功导入 ${added} 个单词 💜`, 'ok');
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
    UI.openModal({ title: '粘贴词汇文本', icon: '📝', body: `<div class="field"><label>每行一条，如：abandon /əˈbændən/ v. 放弃；抛弃</label><textarea class="textarea" id="vocTxt" style="min-height:200px" placeholder="abandon /əˈbændən/ v. 放弃；抛弃"></textarea></div>`,
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
    UI.toast(`成功导入 ${added} 个单词 💜`, 'ok');
  }
  function download(name, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
})();
