/* ============================================================
   数据存储层 · 全局本地存储 + 虚拟奖励存钱罐
   所有模块共用一份 state，统一导出/导入 JSON 备份
   ============================================================ */
(function () {
  const KEY = 'cw_state_v1';

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function blankState() {
    return {
      version: 1,
      // 复习计划（万能工作台首页 + 月度日历联动数据源）
      tasks: [],
      weakNotes: [],
      dailySummary: {},            // { 'YYYY-MM-DD': text }
      // 学业 DDL
      ddls: [],
      issues: [],
      // 考试倒计时（首页临近DDL显示；默认内置考研/四六级，可自行调整）
      exams: [],
      // 手机日历订阅（DDL 自动进日历并到期提醒）
      cal: { backendUrl: '', clientId: '', subscribed: false, reminders: [1440, 720, 60], local: { authorized: false, calendarId: '', syncedCount: 0, lastAt: 0 } },
      // 微信推送（通过 Server酱 推送到微信，仅 DDL 任务会触发推送）
      push: { service: 'serverchan', token: '', uid: '', enabled: false, backendUrl: '' },
      // 记账存钱
      finance: {
        budget: 2000,
        savingsGoal: 5000,
        records: [],              // {id,type,amount,category,date,note}
        reflections: {},          // { 'YYYY-MM-DD': text }
      },
      // 虚拟奖励存钱罐
      piggy: { balance: 0, totalEarned: 0, withdrawals: [] },
      // 自律成长
      discipline: {
        items: [],                // {id,name,icon,records:{date:true}}
        scores: {},               // {date:{score,reason,pros,cons}}
        tempTasks: [],            // 今日执行计划·临时任务 [{id,name,done,doneAt}]
        counters: {},             // { 'YYYY-MM-DD': { care:0, mentor:0, submit:0 } }
      },
      // 专注计时（自律模块·工作台底部）
      focus: {
        sessions: [],             // [{id,theme,category,note,start,end,dur(ms),abandoned}]
        categories: ['学习', '科研', '阅读', '运动', '写作', '其他'],
      },
      // 假期旅行
      travel: {
        schedule: [],             // {id,day,time,spot,route}
        budget: [],               // {id,category,planned,actual}
        checklist: [],            // {id,name,checked}
        notes: '',
      },
      // 月度复盘
      monthly: {
        goals: {},                // {month:[{id,text}]}
        done: [],                 // {id,text,month}
        undone: [],               // {id,text,month}
        harvest: {},
        undoneReason: {},
        nextPlan: {},
        summary: {},
      },
      // 英语学习
      english: {
        words: [],                // 唯一个人背诵词库
        articles: [],             // 外刊收藏
        reader: null,             // 当日外刊缓存 {date,title,source,text,link}
        readerBackend: 'http://localhost:3000', // 联网后端（默认本地 server.js：实时外刊 + 每日AI选题）
        readerToday: null,         // 当日后端摘取的外刊缓存 {date, list:[...]}，每日刷新
        lastGroupDoneAt: null,
        daily: { date: '', learned: 0 }, // 每日已学单词数（满 20 词奖励 +1 元）
        customListenings: [],   // 听力导入·自建听力 [{id,title,source:'自定义',level,wordCount,sentenceCount,duration,sentences:[{en,cn}]}]
      },
      // 技能学习（独立模块，不接入虚拟存钱罐）
      skill: {
        topics: [],               // [{id,name,icon,intro,courses:[{id,icon,title,tags:[],desc,duration,url,done}]}]
        dailyTopics: [],          // 每日AI学习选题 [{id,title,tags[],url}]
        aiTopicsDate: '',          // 已从后端加载当日选题的日期（同日不重复覆盖用户编辑）
        aiSource: '',              // 选题来源标记（GitHub/海外 或 国内直连）
        topicSeedIndex: 0,        // 内置热门话题种子读取位置
        topicPool: [],            // 后端爬到的热点累积池（自动去重，离线回退首选）
        researchTopics: [],       // 调研汇报练习·自建词条 [{id,name,en}]
        researchSettings: { phase1Min: 5, phase2Min: 5 }, // 调研两阶段计时：整理(phase1)/汇报(phase2)，单位分钟
        aiEvents: [],             // AI活动·用户自建 [{id,title,cat,date,url,benefit,tutorial,org}]
        aiEventsDate: '',          // 已从后端加载活动的日期（同日不重复拉取）
      },
      // 云端同步配置（默认码云 Gitee 私有仓库备份，国内直连免代理；亦可切 GitHub）
      cloud: {
        provider: 'gitee',
        owner: '', repo: '', token: '', path: 'cw-backup.json', branch: 'master', lastSync: '',
      },
    };
  }

  let state = null;

  // ---------- 原生存储（Capacitor） ----------
  // 在原生 APP 里改用 Capacitor Preferences 持久化，避免 WebView 清缓存丢数据；
  // 在浏览器 / PWA 里 window.Capacitor 不存在，自动回退到 localStorage。
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  let _pref = null;
  function nativePref() {
    if (!isNative()) return null;
    if (!_pref && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
      _pref = window.Capacitor.Plugins.Preferences;
    }
    return _pref;
  }

  function seedFrom(raw) {
    const parsed = JSON.parse(raw);
    state = Object.assign(blankState(), parsed);
    // 兜底字段
    const base = blankState();
    for (const k in base) if (state[k] === undefined) state[k] = base[k];
    // 深层兜底：各模块可能部分字段缺失（如旧数据 discipline 无 tempTasks/counters、focus 无 categories）。
    // 只补 undefined 子字段，避免用 Object.assign 展开破坏数组字段（sessions/items/words 等会变对象）。
    for (const key of ['push', 'cal', 'discipline', 'focus', 'travel', 'finance', 'monthly', 'english']) {
      if (!state[key]) { state[key] = base[key]; continue; }
      for (const sub in base[key]) {
        if (state[key][sub] === undefined) state[key][sub] = base[key][sub];
      }
    }
    normSkill(state);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) seedFrom(raw);
      else state = blankState();
    } catch (e) {
      console.warn('状态读取失败，重置', e);
      state = blankState();
    }
    return state;
  }

  // 启动水合：原生环境优先从 Capacitor Preferences 读取（持久、不被清缓存）
  async function init() {
    if (isNative()) {
      try {
        const p = nativePref();
        if (p) {
          const { value } = await p.get({ key: KEY });
          if (value) { seedFrom(value); return state; }
        }
      } catch (e) { console.warn('原生存储读取失败，回退', e); }
      // 原生首次启动：若 localStorage 里已有旧数据，做一次迁移到原生存储
      load();
      if (state && JSON.stringify(state) !== JSON.stringify(blankState())) save();
    } else {
      load();
    }
    return state;
  }

  function get() {
    if (!state) load();
    return state;
  }

  function save() {
    const raw = JSON.stringify(state);
    try {
      localStorage.setItem(KEY, raw);
    } catch (e) { /* localStorage 可能已满或被禁用，忽略，原生环境另有 Preferences 兜底 */ }
    // 原生环境：实时镜像到 Capacitor Preferences（持久存储，清缓存也丢不了）
    const p = nativePref();
    if (p) { p.set({ key: KEY, value: raw }).catch(() => {}); }
    window.dispatchEvent(new CustomEvent('cw:changed'));
  }

  function update(mutator) {
    mutator(get());
    save();
  }

  // ---------- 虚拟奖励存钱罐 ----------
  // 仅任务完成自动增加；仅允许手动扣款；禁止手动充值；余额不为负
  function earn(amount, reason) {
    amount = Math.max(0, Math.round(amount * 100) / 100);
    if (amount <= 0) return get().piggy.balance;
    const p = get().piggy;
    p.balance = Math.round((p.balance + amount) * 100) / 100;
    p.totalEarned = Math.round((p.totalEarned + amount) * 100) / 100;
    save();
    window.dispatchEvent(new CustomEvent('piggy:earn', { detail: { amount, reason, balance: p.balance } }));
    return p.balance;
  }

  function withdraw(amount, reason) {
    amount = Math.max(0, Math.round(amount * 100) / 100);
    const p = get().piggy;
    if (amount <= 0) return { ok: false, msg: '金额无效' };
    if (amount > p.balance) return { ok: false, msg: '存钱罐余额不足，无法扣减' };
    p.balance = Math.round((p.balance - amount) * 100) / 100;
    p.withdrawals.unshift({ id: uid(), amount, reason: reason || '休闲消费', date: new Date().toISOString() });
    // 存钱罐消费同步记一笔「娱乐消费」支出，与真实收入/支出统一统计
    const f = get().finance;
    f.records.unshift({
      id: uid(), type: 'expense', amount,
      category: '娱乐消费',
      note: '存钱罐扣减' + (reason ? '：' + reason : ''),
      date: new Date().toISOString().slice(0, 10),
    });
    save();
    window.dispatchEvent(new CustomEvent('piggy:withdraw', { detail: { amount, balance: p.balance } }));
    return { ok: true };
  }

  // 取消已完成任务时扣回对应金币（非手动提现，不记入 withdrawals）
  function deduct(amount, reason) {
    amount = Math.max(0, Math.round(amount * 100) / 100);
    if (amount <= 0) return get().piggy.balance;
    const p = get().piggy;
    const old = p.balance;
    p.balance = Math.max(0, Math.round((p.balance - amount) * 100) / 100);
    p.totalEarned = Math.max(0, Math.round((p.totalEarned - amount) * 100) / 100);
    save();
    window.dispatchEvent(new CustomEvent('piggy:deduct', { detail: { amount, reason, balance: p.balance, old } }));
    return p.balance;
  }

  // ---------- 备份 ----------
  function exportJSON() {
    return JSON.stringify(get(), null, 2);
  }

  function importJSON(str) {
    try {
      str = String(str).replace(/^﻿/, '');
      const obj = JSON.parse(str);
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('格式错误');
      state = Object.assign(blankState(), obj);
      const base = blankState();
      for (const k in base) if (state[k] === undefined) state[k] = base[k];
      if (!state.push) state.push = base.push;
      else state.push = Object.assign({}, base.push, state.push);
      if (!state.cal) state.cal = base.cal;
      else state.cal = Object.assign({}, base.cal, state.cal);
      save();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function reset() {
    state = blankState();
    save();
  }

  // 解析联网后端地址：本地后端运行时优先走同源 /api（不依赖外部 Railway）
  const DEFAULT_RAILWAY_BACKEND = 'https://cw-backup-production.up.railway.app';
  function readerBackend() {
    const calUrl = ((get().cal && get().cal.backendUrl) || '').replace(/\/$/, '');
    const raw = (get().english.readerBackend || '').replace(/\/$/, '');
    // 「提醒→日历订阅」是统一入口（cal.backendUrl）优先；外刊页的历史设置（english.readerBackend）兜底
    let candidate = calUrl || (raw && raw !== DEFAULT_RAILWAY_BACKEND ? raw : '');
    if (candidate && candidate !== DEFAULT_RAILWAY_BACKEND) return candidate;
    const loc = (typeof location !== 'undefined' && location) || {};
    const h = loc.hostname || '';
    const isLocalhost = /^localhost$|^127\.0\.0\.1$|^\[::1\]$/i.test(h);
    // 局域网/私网 IP（10.x / 192.168.x / 172.16-31.x / 169.254.x / 0.0.0.0）：
    // 此时前端由本机 server.js 同源托管，API 直接走相对路径 /api/...，无需再指向公网 Railway，
    // 也避免了“本地后端已抓到 cn-daily，App 却去读 Railway 而看不到”的问题。
    const isPrivate = /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^169\.254\./.test(h) || h === '0.0.0.0';
    // 同源后端：返回当前页面 origin（如 http://10.96.45.34:3000），调用方用 backend + '/api/...' 即可打到本机后端。
    // 注意：必须返回真实 origin，不能返回 '' —— 所有调用方用 if(backend) 判断，'' 会被当成「无后端」而跳过拉取。
    if (isLocalhost || isPrivate) return loc.origin || '';
    return candidate || DEFAULT_RAILWAY_BACKEND;
  }

  // 技能学习数据结构兜底（topic/course 字段完整性）
  function normSkill(st) {
    if (!st.skill || !Array.isArray(st.skill.topics)) { st.skill = { topics: [], dailyTopics: [], topicSeedIndex: 0, topicPool: [] }; return; }
    if (!Array.isArray(st.skill.dailyTopics)) st.skill.dailyTopics = [];
    if (!Array.isArray(st.skill.topicPool)) st.skill.topicPool = []; // 后端爬到的热点累积池（离线可用）
    if (!Array.isArray(st.skill.researchTopics)) st.skill.researchTopics = []; // 调研汇报练习·自建词条
    if (!Array.isArray(st.skill.aiEvents)) st.skill.aiEvents = []; // AI活动·用户自建
    if (typeof st.skill.aiEventsDate !== 'string') st.skill.aiEventsDate = '';
    if (typeof st.skill.aiSource !== 'string') st.skill.aiSource = ''; // 选题来源标记
    if (!st.skill.researchSettings) st.skill.researchSettings = { phase1Min: 5, phase2Min: 5 };
    if (typeof st.skill.researchSettings.phase1Min !== 'number' || st.skill.researchSettings.phase1Min < 1) st.skill.researchSettings.phase1Min = 5;
    if (typeof st.skill.researchSettings.phase2Min !== 'number' || st.skill.researchSettings.phase2Min < 1) st.skill.researchSettings.phase2Min = 5;
    if (typeof st.skill.topicSeedIndex !== 'number') st.skill.topicSeedIndex = 0;
    st.skill.topics.forEach((t) => {
      if (!t.id) t.id = uid();
      if (!Array.isArray(t.courses)) t.courses = [];
      t.courses.forEach((c) => { if (typeof c.done !== 'boolean') c.done = false; });
    });
    st.skill.dailyTopics.forEach((t) => {
      if (!t.id) t.id = uid();
      if (!Array.isArray(t.tags)) t.tags = [];
    });
  }

  window.Store = {
    uid, load, get, save, update, earn, withdraw, deduct,
    exportJSON, importJSON, reset, init, isNative, readerBackend,
  };
})();
