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
      // 学习复习计划（万能工作台首页 + 月度日历联动数据源）
      tasks: [],
      weakNotes: [],
      dailySummary: {},            // { 'YYYY-MM-DD': text }
      // 学业 DDL
      ddls: [],
      issues: [],
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
      },
      // 假期旅行
      travel: {
        schedule: [],             // {id,day,time,spot,route}
        budget: [],               // {id,category,planned,actual}
        checklist: [],            // {id,name,checked}
        notes: '',
      },
      // 月度目标复盘
      monthly: {
        goals: {},                // {month:[{id,text}]}
        done: [],                 // {id,text,month}
        undone: [],               // {id,text,month}
        harvest: {},
        undoneReason: {},
        nextPlan: {},
        summary: {},
      },
      // 考研英语
      english: {
        words: [],                // 唯一个人背诵词库
        articles: [],             // 外刊收藏
        reader: null,             // 当日外刊缓存 {date,title,source,text,link}
        readerBackend: '',        // 联网获取外刊的后端地址（选填，用于绕过被墙代理）
        lastGroupDoneAt: null,
        daily: { date: '', learned: 0 }, // 每日已学单词数（满 20 词奖励 +1 元）
      },
      // 技能学习（独立模块，不接入虚拟存钱罐）
      skill: {
        topics: [],               // [{id,name,icon,intro,courses:[{id,icon,title,tags:[],desc,duration,url,done}]}]
        dailyTopics: [],          // 每日AI学习选题 [{id,title,tags[],url}]
        topicSeedIndex: 0,        // 内置热门话题种子读取位置
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
    // 深层兜底：push / cal 可能部分字段缺失
    if (!state.push) state.push = base.push;
    else state.push = Object.assign({}, base.push, state.push);
    if (!state.cal) state.cal = base.cal;
    else state.cal = Object.assign({}, base.cal, state.cal);
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

  // 技能学习数据结构兜底（topic/course 字段完整性）
  function normSkill(st) {
    if (!st.skill || !Array.isArray(st.skill.topics)) { st.skill = { topics: [], dailyTopics: [], topicSeedIndex: 0 }; return; }
    if (!Array.isArray(st.skill.dailyTopics)) st.skill.dailyTopics = [];
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
    exportJSON, importJSON, reset, init, isNative,
  };
})();
