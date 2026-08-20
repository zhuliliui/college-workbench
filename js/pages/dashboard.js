/* ============================================================
  页面1 · 万能工作台（首页）
  清新首页：欢迎横幅 + 4 统计卡 + 今日任务/临近DDL(含考试倒计时) + 每日打卡 + 关键词演讲挑战
  ============================================================ */
window.Pages = window.Pages || {};
// 关键词演讲挑战：状态（模块级，重渲染不丢）
let _kcCur = null;
let _kcT1 = false; let _kcT2 = false;
let _kcInt1 = null; let _kcInt2 = null;
let _kcLeft1 = 300; let _kcLeft2 = 300;
let _kcAudioCtx = null; // 闹钟 AudioContext（需在用户手势内预热解锁，到点才响得了）
let _kcActiveTab = 1;
let _kcSpinInt = null;
const KC_MIN_OPTS = [2, 3, 5, 8, 10, 15, 20, 30];
const KC_HINT1 = '围绕关键词，搜索资料 → 记录要点 → 形成思路';
const KC_HINT2 = '按整理的要点，口头或书面展开你的演讲';
// 关键词演讲挑战·内置词库（心理学 / 认知 / 思维 / 商业概念）
const KC_TOPICS = [
'认知失调','确认偏误','锚定效应','可得性启发','框架效应','过度自信','后见之明偏误','幸存者偏差','基本归因错误','虚假共识效应','达克效应','破窗效应','旁观者效应','霍桑效应','皮格马利翁效应','刻板印象威胁','习得性无助','自我实现预言','计划谬误','沉没成本谬误','禀赋效应','损失厌恶','现状偏误','峰终定律','宜家效应','鸡蛋理论','选择过载','决策疲劳','自我损耗','认知负荷','社会认同','羊群效应','信息瀑布','从众行为','服从权威','去个性化','群体极化','团体迷思','互惠原则','承诺一致性','稀缺效应','喜好效应','社会比较','向上比较','向下比较','自我效能感','控制点','成长型思维','固定型思维','防御性悲观','战略性乐观','情绪调节','延迟满足','多巴胺驱动','内稳态','边界效应','舒适区','学习区','恐慌区','心流通道','注意力残留','多任务处理','单任务专注','深度工作','表面工作','时间贫困','认知储备','心理账户','心理距离','解释水平理论','具身认知','镜像神经元','通感','联觉','阈下刺激','启动效应','内隐记忆','外显记忆','工作记忆','长期记忆','记忆重构','闪光灯记忆','舌尖现象','鸡尾酒会效应','变化盲视','非注意盲视','无意视盲','功能固着','心理定势','酝酿效应','顿悟','发散思维','聚合思维','头脑风暴','名义群体法','德尔菲法','六顶思考帽','水平思考','垂直思考','逆向思维','第一性原理','奥卡姆剃刀','汉隆剃刀','休谟断头台','帕金森定律','彼得原理','墨菲定律','古德哈特定律','斯特金定律','齐普夫定律','幂律分布','长尾理论','黑天鹅事件','灰犀牛事件','飞轮效应','复利效应','马太效应','蝴蝶效应','多米诺效应','寒蝉效应','鲶鱼效应','青蛙效应','螃蟹效应','乌鸦定律','刺猬法则','豪猪困境','囚徒困境','公地悲剧','搭便车问题','道德风险','逆向选择','信号理论','筛选理论','博弈论','纳什均衡','帕累托最优','卡尔多-希克斯效率','零和博弈','正和博弈','负和博弈','比较优势','绝对优势','机会成本','边际效用','边际递减','规模效应','范围经济','网络效应','交叉网络效应','转化成本','锁定效应','路径依赖','制度惯性','文化惰性','范式转换','飞跃式发展','渐进式改进','颠覆式创新','延续性创新','开放式创新','封闭式创新','蓝海战略','红海战略','差异化战略','成本领先战略','聚焦战略','核心竞争力','动态能力','组织韧性','抗逆力','心理韧性','情绪韧性','社会支持系统','依恋理论','安全基地','探索行为','冒险行为','风险感知','风险偏好','风险承受力','不确定性容忍度','模糊容忍度','歧义容忍度','基本盘','护城河','晴雨表','风向标','温水煮青蛙'
];
// 考试倒计时：内置常见考试日期（可到「DDL」里自行调整）
const EXAM_DEFAULTS = [
{ name: '考研', date: '2026-12-19' },
{ name: '四级', date: '2026-12-12' },
{ name: '六级', date: '2026-12-12' },
];
Pages.dashboard = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const today = D.todayStr();
  const now = new Date();

  // —— 今日计划自动清空与归档 ——
  // 规则：① 无截止日期的任务，仅在「添加当天」显示，过 24 点（第二天）自动清空并存入「历史计划存档」；
  //       ② 有截止日期的任务，按截止日期清空（到期/过期后移出今日计划并归档）；
  //       ③ 归档的任务不再参与今日统计，可在底部「历史计划存档」回看。
  const archiveRolledOverTasks = () => {
    Store.update((st) => {
      st.tasks = st.tasks || [];
      st.taskArchive = st.taskArchive || [];
      const keep = [];
      st.tasks.forEach((t) => {
        const added = t.addedDate || '';          // 旧数据无 addedDate → 视为「非今天添加」，次日即归档
        const noDue = !t.due;
        let stillToday;
        if (noDue) {
          stillToday = (added === today);
        } else {
          const dueStr = D.fmtDate(D.parseLDT(t.due));
          stillToday = (added === today) || (dueStr >= today); // 截止当天及之前都留在今日，过期即归档
        }
        if (stillToday) keep.push(t);
        else st.taskArchive.push(Object.assign({}, t, { planDate: added || today, archivedDate: today }));
      });
      st.tasks = keep;
    });
  };
  archiveRolledOverTasks();
  // 归档可能已改写 tasks，重新取一次
  const liveTasks = Store.get().tasks;
  const isTodayPlan = (t) => {
    const added = t.addedDate || '';
    if (!t.due) return added === today;
    const dueStr = D.fmtDate(D.parseLDT(t.due));
    return (added === today) || (dueStr >= today);
  };
  // 今日学习任务统计
  const todayTasks = liveTasks.filter(isTodayPlan);
  const todayDone = todayTasks.filter((t) => t.done).length;
  const todayTotal = todayTasks.length;

  // 临近 DDL：未完成的、未来 7 天内截止（含已过期）
  const upcomingDDLs = s.ddls.filter((d) => !d.done).filter((d) => {
  if (!d.due) return false;
  const due = new Date(d.due);
  const diff = (due - now) / 86400000;
  return diff <= 7;
  }).sort((a, b) => new Date(a.due) - new Date(b.due));

  // 存钱罐余额
  const piggyBalance = s.piggy.balance || 0;

  // 本月支出
  const thisMonth = today.slice(0, 7);
  const monthExpense = s.finance.records
  .filter((r) => r.type === 'expense' && (r.date || '').startsWith(thisMonth))
  .reduce((sum, r) => sum + (r.amount || 0), 0);

  // 问候语
  const hour = now.getHours();
  const greet = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  // 今日任务列表（最多展示 5 条，空状态友好提示）
  let taskListHtml;
  if (todayTotal === 0) {
  taskListHtml = `<div class="empty soft"><img class="emoji" src="assets/icons/hk-38.png" alt=""/>
  <div class="t">今天还没有安排学习任务</div>
  <div class="s">去「复习计划」添加吧</div></div>`;
  } else {
  const items = todayTasks.slice().sort((a, b) => (a.done - b.done) || (a.due || '').localeCompare(b.due || '')).slice(0, 5);
  taskListHtml = '<div class="list home-list">' + items.map((t) => {
  return `<div class="item ${t.done ? 'done' : ''}" data-id="${t.id}">
  <button class="check" data-act="toggle-task" data-id="${t.id}" aria-label="完成">${t.done ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
  <div class="body"><div class="name">${UI.esc(t.name)}</div>
  <div class="meta">${t.category ? `<span class="tag">${UI.esc(t.category)}</span>` : ''}<span>${t.due ? D.fmtDateTime(D.parseLDT(t.due)) : '无截止'}</span></div>
  </div>
  </div>`;
  }).join('') + '</div>';
  }

  // 临近 DDL 列表
  let ddlListHtml;
  if (upcomingDDLs.length === 0) {
  ddlListHtml = `<div class="empty soft"><img class="emoji" src="assets/icons/hk-41.png" alt=""/>
  <div class="t">暂无临近的 DDL</div>
  <div class="s">继续保持，加油～</div></div>`;
  } else {
  ddlListHtml = '<div class="list home-list">' + upcomingDDLs.slice(0, 5).map((d) => {
  const due = new Date(d.due);
  const hours = Math.max(0, Math.ceil((due - now) / 3600000));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  let remText = days > 0 ? `剩余 ${days} 天 ${remHours} 小时` : `剩余 ${hours} 小时`;
  if (hours === 0) remText = '已到期';
  let cls = '';
  if (hours <= 12) cls = 'danger';
  else if (hours <= 24) cls = 'warn';
  return `<div class="item ${cls}" data-id="${d.id}">
  <div class="body">
  <div class="name">${UI.esc(d.name)}</div>
  <div class="meta"><span class="tag ${cls === 'danger' ? 'danger' : cls === 'warn' ? 'warn' : 'muted'}">${remText}</span><span>${D.fmtDateTime(due)}</span></div>
  </div>
  <button class="btn btn-sm btn-success" data-act="finish-ddl" data-id="${d.id}">完成</button>
  </div>`;
  }).join('') + '</div>';
  }

  // 每日打卡数据
  const checkinItems = s.discipline.items || [];
  const checkedN = checkinItems.filter((it) => !!(it.records && it.records[today])).length;
  const dayStartTs = new Date(today + 'T00:00:00').getTime();
  const todayFocus = (s.focus.sessions || []).filter((x) => x.start >= dayStartTs && !x.abandoned);
  const focusCount = todayFocus.length;
  const focusMin = Math.round(todayFocus.reduce((a, x) => a + (x.dur || 0), 0) / 60000);
  const enDaily = s.english.daily;
  const learnedWords = (enDaily && enDaily.date === today) ? (enDaily.learned || 0) : 0;
  const cntToday = (s.discipline.counters || {})[today] || {};
  const checkinListHtml = checkinItems.length ? checkinItems.map((it) => {
  const ck = !!(it.records && it.records[today]);
  return `<div class="item ${ck ? 'done' : ''}" data-id="${it.id}">
  <button class="check" data-act="toggle-checkin" data-id="${it.id}" aria-label="打卡">${ck ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
  <div class="body"><div class="name">${it.icon ? UI.esc(it.icon) : '<img class="ic" src="assets/icons/hk-06.png" alt=""/>'} ${UI.esc(it.name)}</div><div class="meta"><span class="tag muted">${ck ? '已打卡' : '待打卡'}</span></div></div>
  </div>`;
  }).join('') : '<div class="empty soft"><div class="t">还没有打卡项目</div><div class="s">去「自律成长」添加</div></div>';
  // 考试倒计时（内置，可在「DDL」里调整日期）
  const exams = (s.exams && s.exams.length) ? s.exams : EXAM_DEFAULTS;
  const examChips = exams.filter((e) => e && e.date).map((e) => {
  const days = Math.ceil((new Date(e.date + 'T00:00:00') - now) / 86400000);
  if (days < 0) return '';
  const cls = days <= 30 ? 'danger' : days <= 90 ? 'warn' : '';
  return `<span class="tag ${cls}" style="${days <= 30 ? 'background:var(--danger-soft, #fee2e2);color:var(--danger, #dc2626)' : ''}">${UI.esc(e.name)} 倒计时 ${days} 天</span>`;
  }).filter(Boolean).join(' ');
  const examHtml = examChips ? `<div class="exam-countdown"><img class="ic" src="assets/icons/hk-11.png" alt=""/> ${examChips}</div>` : '';

  // ---------- 关键词演讲挑战（词条 + 随机闪词条 + 整理/汇报两阶段计时） ----------
  const getKcTopics = () => {
  const ss = Store.get().skill;
  ss.researchTopics = ss.researchTopics || [];
  return KC_TOPICS.map((n) => ({ name: n, en: '' })).concat(ss.researchTopics.map((x) => Object.assign({}, x, { _user: true })));
  };
  const kcFmt = (sec) => { sec = Math.max(0, sec); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
  const kcGetMin = (phase) => {
  const ss = Store.get().skill;
  ss.researchSettings = ss.researchSettings || { phase1Min: 5, phase2Min: 5 };
  const v = phase === 2 ? ss.researchSettings.phase2Min : ss.researchSettings.phase1Min;
  return Math.max(1, parseInt(v) || 5);
  };
  const kcStop = (phase) => {
  if (phase === 1) { _kcT1 = false; if (_kcInt1) { clearInterval(_kcInt1); _kcInt1 = null; } }
  else if (phase === 2) { _kcT2 = false; if (_kcInt2) { clearInterval(_kcInt2); _kcInt2 = null; } }
  };
  const kcStopAll = () => { kcStop(1); kcStop(2); if (_kcSpinInt) { clearInterval(_kcSpinInt); _kcSpinInt = null; } };
  const kcSpeak = (text) => {
  try {
  const nat = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech);
  if (nat && nat.speak) { nat.speak({ text, lang: 'zh-CN' }).catch(() => kcSpeakFallback(text)); return; }
  } catch (e) {}
  kcSpeakFallback(text);
  };
  const kcSpeakFallback = (text) => {
  if (!('speechSynthesis' in window)) return;
  try {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  window.speechSynthesis.resume();
  } catch (e) {}
  };
  // 预热/复用 AudioContext：必须在用户手势（点按钮）内调用，浏览器才会解锁音频；
  // 解锁后倒计时到点（无手势）才能正常响铃（移动端/主屏幕 PWA 必须这样，否则被挂起无声）
  const kcEnsureAudio = () => {
  try {
  if (!_kcAudioCtx) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  _kcAudioCtx = new Ctx();
  }
  if (_kcAudioCtx.state === 'suspended') {
  try { _kcAudioCtx.resume(); } catch (e) {}
  }
  return _kcAudioCtx;
  } catch (e) { return null; }
  };
  // 闹钟提醒：清脆「叮叮叮」铃声（用已预热的 AudioContext）+ 震动；到点响铃
  const kcAlarm = () => {
  try { if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 300]); } catch (e) {}
  const ctx = kcEnsureAudio();
  if (!ctx) return;
  try {
  // 每个「叮」= 高频短促音（基频 E6 + 泛音，三角波更清脆，快速衰减），每声间隔 0.42s，共 4 声
  const ding = (t0) => {
  [1318.5, 2637].forEach((freq, i) => {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = freq;
  o.connect(g); g.connect(ctx.destination);
  const t = ctx.currentTime + t0;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(i === 0 ? 0.5 : 0.14, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o.start(t); o.stop(t + 0.38);
  });
  };
  for (let i = 0; i < 4; i++) ding(i * 0.42);
  // 不 close：保留 context 复用（关闭后下次又需手势解锁）
  } catch (e) {}
  };
  const kcStartSpin = () => {
  const all = getKcTopics();
  if (!all.length) return;
  if (all.length < 2) { _kcCur = all[0]; kcStopAll(); Pages.dashboard(); return; }
  kcStopAll();
  const final = all[Math.floor(Math.random() * all.length)];
  const totalTicks = 14 + Math.floor(Math.random() * 8);
  let i = 0;
  _kcSpinInt = setInterval(() => {
  i++;
  if (i >= totalTicks) {
  clearInterval(_kcSpinInt); _kcSpinInt = null;
  _kcCur = final;
  const el = UI.$('#kcName'); if (el) el.textContent = _kcCur.name;
  _kcT1 = false; _kcT2 = false;
  _kcLeft1 = kcGetMin(1) * 60; _kcLeft2 = kcGetMin(2) * 60;
  const d1 = UI.$('#kcDisp1'); if (d1) d1.textContent = kcFmt(_kcLeft1);
  const d2 = UI.$('#kcDisp2'); if (d2) d2.textContent = kcFmt(_kcLeft2);
  UI.toast('选中：' + _kcCur.name, 'ok');
  kcSpeak(_kcCur.name); // 选中后自动朗读
  return;
  }
  _kcCur = all[Math.floor(Math.random() * all.length)];
  const el = UI.$('#kcName'); if (el) el.textContent = _kcCur.name;
  }, 75);
  };
  function renderChallenge() {
  const all = getKcTopics();
  if (!all.length) {
  return `<div class="card mt16"><div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>关键词演讲挑战</div><div class="spacer"></div><button class="btn btn-soft btn-icon kc-add-icon" data-act="kc-add" title="添加词条"><img class="ic" src="assets/icons/hk-33.png" alt=""/></button><button class="collapse-btn" title="折叠">▾</button></div><div class="card-body"><div class="empty soft"><div class="t">还没有词条</div><div class="s">点右上角「＋」图标添加</div></div></div></div>`;
  }
  if (!_kcCur || !all.some((t) => t.name === _kcCur.name)) _kcCur = all[0];
  const cur = _kcCur;
  const phase = _kcActiveTab === 2 ? 2 : 1;
  const running = phase === 1 ? _kcT1 : _kcT2;
  const left = phase === 1 ? _kcLeft1 : _kcLeft2;
  const dispId = phase === 1 ? 'kcDisp1' : 'kcDisp2';
  const btnId = phase === 1 ? 'kcBtn1' : 'kcBtn2';
  const hint = phase === 1 ? KC_HINT1 : KC_HINT2;
  const phaseIcon = phase === 1 ? '<img class="ic" src="assets/icons/hk-32.png" alt=""/>' : '<img class="ic" src="assets/icons/hk-09.png" alt=""/>';
  const phaseName = phase === 1 ? '整理' : '汇报';
  const long = cur.name.length > 10 ? ' long' : '';
  return `
  <div class="card mt16">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>关键词演讲挑战</div>
  <div class="spacer"></div>
  <span class="tag muted">词条 ${all.length}</span>
  <button class="btn btn-soft btn-icon kc-add-icon" data-act="kc-add" title="添加词条"><img class="ic" src="assets/icons/hk-33.png" alt=""/></button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">
  <div class="kc-pick-card">
  <div class="kc-name-wrap">
  <div class="kc-name${long}" id="kcName">${UI.esc(cur.name)}</div>
  </div>
  <div class="kc-ops">
  <button class="btn btn-sm" data-act="kc-spin"><img class="ic" src="assets/icons/hk-38.png" alt=""/> 随机</button>
  </div>
  <div class="kc-tabs">
  <button class="kc-tab ${_kcActiveTab === 1 ? 'on' : ''}" data-act="kc-tab" data-tab="1"><img class="ic" src="assets/icons/hk-32.png" alt=""/> 整理</button>
  <button class="kc-tab ${_kcActiveTab === 2 ? 'on' : ''}" data-act="kc-tab" data-tab="2"><img class="ic" src="assets/icons/hk-09.png" alt=""/> 汇报</button>
  </div>
  <div class="kc-timer-card">
  <div class="kc-phase-title">${phaseIcon} ${phaseName}阶段</div>
  <div class="kc-timer-controls">
  <select class="input kc-min-sel" data-act="kc-set-min" data-phase="${phase}">${KC_MIN_OPTS.map((m) => `<option value="${m}" ${m === kcGetMin(phase) ? 'selected' : ''}>${m}</option>`).join('')}</select>
  <span class="muted-text" style="font-size:12px">分钟</span>
  <button class="btn ${running ? 'btn-danger' : 'btn-primary'} btn-sm" data-act="kc-timer" data-phase="${phase}" id="${btnId}">${running ? '<img class="ic" src="assets/icons/hk-18.png" alt=""/> 停止' : '<img class="ic" src="assets/icons/hk-09.png" alt=""/> 开始'}</button>
  </div>
  <div class="kc-timer" id="${dispId}">${kcFmt(left)}</div>
  <div class="muted-text center" style="font-size:12px;margin-top:6px">${UI.esc(hint)}</div>
  </div>
  </div>
  </div>
  </div>`;
  }

  // 历史计划存档（按添加日分组，今天/昨天/前天/具体日期）
  const relLabel = (d) => {
    if (!d) return '';
    const diff = Math.round((new Date(today + 'T00:00:00') - new Date(d + 'T00:00:00')) / 86400000);
    if (diff === 0) return d + '（今天）';
    if (diff === 1) return d + '（昨天）';
    if (diff === 2) return d + '（前天）';
    if (diff === 3) return d + '（大前天）';
    return d;
  };
  const archive = (Store.get().taskArchive || []).slice();
  let archiveHtml = '';
  if (archive.length) {
    const groups = {};
    archive.forEach((t) => { const k = t.planDate || today; (groups[k] = groups[k] || []).push(t); });
    const groupHtml = Object.keys(groups).sort((a, b) => b.localeCompare(a)).map((k) => {
      const rows = groups[k].map((t) => `<div class="item ${t.done ? 'done' : ''}">
        <div class="body"><div class="name">${UI.esc(t.name)}</div>
        <div class="meta">${t.category ? `<span class="tag">${UI.esc(t.category)}</span>` : ''}<span>${t.due ? D.fmtDateTime(D.parseLDT(t.due)) : '无截止'}</span>${t.done ? '<span class="tag muted">已完成</span>' : '<span class="tag warn">未做</span>'}</div></div>
      </div>`).join('');
      return `<div class="archive-day"><div class="archive-day-head"><img class="ic" src="assets/icons/hk-33.png" alt=""/> ${relLabel(k)} · ${groups[k].length} 项</div><div class="list home-list">${rows}</div></div>`;
    }).join('');
    archiveHtml = `<div class="card mt16">
      <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-33.png" alt=""/>历史计划存档</div><div class="spacer"></div><span class="tag muted">${archive.length} 项</span><button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body">${groupHtml}</div>
    </div>`;
  } else {
    archiveHtml = `<div class="card mt16">
      <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-33.png" alt=""/>历史计划存档</div><div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
      <div class="card-body"><div class="empty soft"><div class="t">还没有历史计划</div><div class="s">过期的今日计划会自动归档到这里</div></div></div>
    </div>`;
  }

  c.innerHTML = `
  <!-- 欢迎横幅 -->
  <div class="welcome-banner">
  <div class="welcome-text">
  <div class="welcome-title">${greet}，今天也要元气满满呀！</div>
  <div class="welcome-sub">这里是你的专属学习生活中枢，所有进度自动同步到虚拟存钱罐 <img class="welcome-piggy" src="assets/icons/hk-02.png" alt="存钱罐"/></div>
  </div>
  </div>

  <!-- 统计卡 -->
  <div class="grid grid-4 stat-row">
  <div class="stat-card">
  <div class="stat-icon"><img src="assets/icons/hk-38.png" alt=""/></div>
  <div class="stat-label">今日学习任务</div>
  <div class="stat-value">${todayTotal} 项</div>
  </div>
  <div class="stat-card">
  <div class="stat-icon"><img src="assets/icons/hk-41.png" alt=""/></div>
  <div class="stat-label">临近 DDL</div>
  <div class="stat-value">${upcomingDDLs.length} 项</div>
  </div>
  <div class="stat-card">
  <div class="stat-icon"><img class="stat-piggy" src="assets/icons/hk-02.png" alt="存钱罐"/></div>
  <div class="stat-label">存钱罐余额</div>
  <div class="stat-value">${D.money(piggyBalance)}</div>
  </div>
  <div class="stat-card">
  <div class="stat-icon"><img src="assets/icons/hk-23.png" alt=""/></div>
  <div class="stat-label">本月支出</div>
  <div class="stat-value">${D.money(monthExpense)}</div>
  </div>
  </div>

  <!-- 今日任务 / 临近 DDL -->
  <div class="grid grid-2">
  <div class="card">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-38.png" alt=""/>今日学习任务 <span class="sub" style="margin-left:8px">${todayDone}/${todayTotal} 已完成</span></div>
  <div class="spacer"></div>
  <button class="btn btn-sm btn-soft" data-act="go-study"><img class="ic" src="assets/icons/hk-33.png" alt=""/> 添加</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">${taskListHtml}</div>
  </div>
  <div class="card">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-41.png" alt=""/>临近 DDL <span class="sub" style="margin-left:8px">${upcomingDDLs.length} 项</span></div>
  <div class="spacer"></div>
  <button class="btn btn-sm btn-soft" data-act="go-ddl">管理</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">${examHtml}${ddlListHtml}</div>
  </div>
  </div>

  <!-- 每日打卡 -->
  <div class="card">
  <div class="card-head">
  <div class="title"><img class="ic" src="assets/icons/hk-06.png" alt=""/>每日打卡 <span class="sub" style="margin-left:8px">今日完成 ${checkedN}/${checkinItems.length}</span></div>
  <div class="spacer"></div>
  <button class="btn btn-sm btn-soft" data-act="go-checkin">去打卡</button>
  <button class="collapse-btn" title="折叠">▾</button>
  </div>
  <div class="card-body">
  <div class="list home-list">${checkinListHtml}</div>
  <div class="flex-wrap gap8 mt12">
  <span class="tag"><img class="ic" src="assets/icons/hk-09.png" alt=""/> 专注 ${focusCount} 次 ${focusMin ? '· ' + focusMin + ' 分钟' : ''}</span>
  <span class="tag"><img class="ic" src="assets/icons/hk-27.png" alt=""/> 学词 ${learnedWords} 个</span>
  <span class="tag"><img class="ic" src="assets/icons/hk-06.png" alt=""/> 关怀 ${cntToday.care || 0}</span>
  <span class="tag"><img class="ic" src="assets/icons/hk-38.png" alt=""/> 导师 ${cntToday.mentor || 0}</span>
  <span class="tag"><img class="ic" src="assets/icons/hk-32.png" alt=""/> 投稿 ${cntToday.submit || 0}</span>
  </div>
  </div>
  </div>

  ${renderChallenge()}
  ${archiveHtml}`;

  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act], [data-nav]');
  if (!b) return;
  const act = b.dataset.act, id = b.dataset.id, nav = b.dataset.nav;

  if (nav) return (location.hash = '#/' + nav);
  if (act === 'go-study') return (location.hash = '#/study');
  if (act === 'go-ddl') return (location.hash = '#/ddl');
  if (act === 'go-checkin') return (location.hash = '#/checkin');

  if (act === 'toggle-checkin') {
  const it = s.discipline.items.find((x) => x.id === id); if (!it) return;
  Store.update((st) => {
  const x = st.discipline.items.find((y) => y.id === id); if (!x) return;
  x.records = x.records || {};
  x.records[today] = !x.records[today];
  });
  Pages.dashboard();
  return;
  }

  // 关键词演讲挑战
  if (act === 'kc-add') {
  UI.openModal({
  title: '添加演讲词条', icon: '<img class="ic" src="assets/icons/hk-38.png" alt=""/>',
  body: `<div class="field"><label>词条名称</label><input class="input" id="kcName" placeholder="如：沉没成本谬误"/></div>`,
  actions: [
  { label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: '保存', onClick: () => {
  const nm = UI.val('#kcName').trim();
  if (!nm) { UI.toast('请填写词条名称', 'warn'); return; }
  Store.update((st) => {
  st.skill.researchTopics = st.skill.researchTopics || [];
  st.skill.researchTopics.push({ id: Store.uid(), name: nm, en: '' });
  });
  UI.closeModal(); UI.toast('已添加词条', 'ok'); Pages.dashboard();
  } }
  ]
  });
  return;
  }
  if (act === 'kc-tab') { kcEnsureAudio(); _kcActiveTab = +b.dataset.tab; Pages.dashboard(); return; }
  if (act === 'kc-spin') { kcEnsureAudio(); kcStartSpin(); return; }
  if (act === 'kc-set-min') {
  const phase = +b.dataset.phase;
  const v = Math.max(1, parseInt(b.value) || 5);
  Store.update((st) => {
  st.skill.researchSettings = st.skill.researchSettings || { phase1Min: 5, phase2Min: 5 };
  if (phase === 2) st.skill.researchSettings.phase2Min = v; else st.skill.researchSettings.phase1Min = v;
  });
  if (phase === 1 && !_kcT1) { _kcLeft1 = v * 60; const d = UI.$('#kcDisp1'); if (d) d.textContent = kcFmt(_kcLeft1); }
  if (phase === 2 && !_kcT2) { _kcLeft2 = v * 60; const d = UI.$('#kcDisp2'); if (d) d.textContent = kcFmt(_kcLeft2); }
  return;
  }
  if (act === 'kc-timer') {
  const phase = +b.dataset.phase;
  kcEnsureAudio(); // 用户手势内预热音频，保证倒计时到点能响铃
  const running = phase === 1 ? _kcT1 : _kcT2;
  if (running) { kcStop(phase); Pages.dashboard(); return; }
  if (phase === 1) { _kcT1 = true; _kcLeft1 = kcGetMin(1) * 60; }
  else { _kcT2 = true; _kcLeft2 = kcGetMin(2) * 60; }
  Pages.dashboard();
  const dispId = phase === 1 ? 'kcDisp1' : 'kcDisp2';
  const phaseName = phase === 1 ? '整理' : '汇报';
  const tick = () => {
  if (phase === 1) _kcLeft1--; else _kcLeft2--;
  const left = phase === 1 ? _kcLeft1 : _kcLeft2;
  if (left <= 0) {
  kcStop(phase);
  kcAlarm(); // 闹钟响铃 + 震动提醒
  UI.toast(phaseName + '阶段时间到！⏰', 'love');
  Pages.dashboard();
  return;
  }
  const d = UI.$('#' + dispId);
  if (d) d.textContent = kcFmt(left);
  };
  tick();
  if (phase === 1) _kcInt1 = setInterval(tick, 1000);
  else _kcInt2 = setInterval(tick, 1000);
  return;
  }

  if (act === 'toggle-task') {
  const t = s.tasks.find((x) => x.id === id); if (!t) return;
  const wasDone = t.done;
  const willDone = !wasDone;
  Store.update((st) => {
  const x = st.tasks.find((y) => y.id === id);
  x.done = willDone; x.doneAt = willDone ? new Date().toISOString() : null;
  });
  if (willDone) { Store.earn(1, '完成学习复习任务'); UI.toast('任务完成 +1 金币', 'ok'); }
  else if (wasDone) { Store.deduct(1, '取消完成任务'); UI.toast('已取消，-1 金币', 'warn'); }
  Pages.dashboard();
  return;
  }
  if (act === 'finish-ddl') {
  const d = s.ddls.find((x) => x.id === id); if (!d || d.done) return;
  Store.update((st) => { const x = st.ddls.find((y) => y.id === id); x.done = true; x.doneAt = new Date().toISOString(); });
    Store.earn(1, '完成 DDL 任务');
    Pages.dashboard();
    return;
  }
  };
};
