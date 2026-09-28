/* ============================================================
  安卓桌面小组件 · 数据桥 v2
  - 推送「今日计划(5) + 临近DDL(2，全标红) + 未完成计数 + 存钱罐」给组件
  - 组件上点任务行可直接勾选/取消：原生端记录 ops 队列，这里在 App 回前台时
    consumeOps 同步回 Store（金币 ±1 与 App 内口径一致），再重推最新数据
  - 浏览器/PWA 无插件，静默跳过
  ============================================================ */
(function () {
  if (typeof window === 'undefined' || !window.Store) return;

  var _timer = null;

  function plugin() {
    try {
      var cap = window.Capacitor && window.Capacitor.Plugins;
      return (cap && cap.WidgetData) || null;
    } catch (e) { return null; }
  }

  function ddlRemain(due) {
    try {
      if (window.D && D.daysLeftText) return D.daysLeftText(due);
    } catch (e) {}
    return '';
  }

  // 今日计划口径：只显示当天的（今天添加的，或截止日=今天）；未来任务不上组件
  function isTodayTask(t, today) {
    var added = t.addedDate || '';
    if (!t.due) return added === today;
    var dueDay = String(t.due).slice(0, 10);
    return added === today || dueDay === today;
  }

  function buildPayload() {
    var s = Store.get();
    var today = window.D ? D.todayStr() : new Date().toISOString().slice(0, 10);
    // 未完成 DDL（全部推送，无截止时间的也显示）+ 今日任务，DDL 更紧急排前面
    var items = [];

    // 临近 DDL：未完成的全部推送（组件端可滚动），按截止升序，无截止的沉底；全部标红
    var ddls = (s.ddls || []).filter(function (d) { return !d.done; })
      .sort(function (a, b) { return (a.due || '9999').localeCompare(b.due || ''); });
    ddls.forEach(function (d) {
      var remain = d.due ? ' · ' + ddlRemain(d.due) : ' · 未设截止';
      items.push({ ddl: true, due: d.due || '', done: false, line: { id: d.id, kind: 'ddl', t: d.name + remain, d: false, w: true } });
    });

    var tasks = (s.tasks || []).filter(function (t) { return isTodayTask(t, today); });
    tasks.sort(function (a, b) { return (a.done - b.done) || ((a.due || '9999').localeCompare(b.due || '9999')); });
    tasks.slice(0, 12).forEach(function (t) {
      var time = t.due ? ' ' + t.due.slice(11, 16) : '';
      items.push({ due: t.due || '', done: !!t.done, line: { id: t.id, kind: 'task', t: (t.done ? '✓ ' : '○ ') + t.name + time, d: !!t.done, w: false } });
    });

    // 排序：已完成沉底，DDL 优先于任务，其余按截止时间升序，没有截止时间的沉底
    items.sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (!!a.ddl !== !!b.ddl) return a.ddl ? -1 : 1;
      return (a.due || '9999').localeCompare(b.due || '9999');
    });
    var lines = items.map(function (x) { return x.line; });

    if (!lines.length) lines.push({ id: '', kind: '', t: '今天还没有安排，点开看看 ›', d: false, w: false });

    var undone = tasks.filter(function (t) { return !t.done; }).length;
    var undoneDdl = (s.ddls || []).filter(function (d) { return !d.done; }).length;
    return {
      date: today,
      count: undone,
      ddlCount: undoneDdl,
      piggy: '¥' + ((s.piggy && s.piggy.balance) || 0).toFixed(2),
      lines: lines.slice(0, 30),
    };
  }

  // 把组件上的勾选操作同步回 Store（金币口径与 App 内一致：完成 +1，取消 -1）
  function applyOps(ops) {
    if (!ops || !ops.length) return;
    var s = Store.get();
    ops.forEach(function (op) {
      if (!op || !op.id) return;
      var want = !!op.done;
      if (op.kind === 'task') {
        var t = (s.tasks || []).find(function (x) { return x.id === op.id; });
        if (!t || !!t.done === want) return;
        Store.update(function (st) {
          var x = st.tasks.find(function (y) { return y.id === op.id; });
          if (x) { x.done = want; x.doneAt = want ? new Date().toISOString() : null; }
        });
        if (want) Store.earn(1, '组件完成学习任务'); else Store.deduct(1, '组件取消完成任务');
      } else if (op.kind === 'ddl') {
        var d = (s.ddls || []).find(function (x) { return x.id === op.id; });
        if (!d || !!d.done === want) return;
        Store.update(function (st) {
          var x = st.ddls.find(function (y) { return y.id === op.id; });
          if (x) { x.done = want; x.doneAt = want ? new Date().toISOString() : null; if (want) x.progress = 100; }
        });
        if (want) Store.earn(1, '组件完成 DDL'); else Store.deduct(1, '组件取消完成 DDL');
      }
    });
  }

  function push() {
    var nat = plugin();
    if (!nat || !nat.save) return; // 浏览器 / PWA：无原生插件，跳过
    var ready = Promise.resolve();
    if (nat.consumeOps) {
      // 先把组件上的勾选同步回来，再推最新数据（避免组件刚点的勾被旧数据盖掉）
      ready = nat.consumeOps().then(function (r) {
        try {
          var ops = r && r.ops;
          if (typeof ops === 'string') ops = JSON.parse(ops || '[]');
          applyOps(ops);
        } catch (e) {}
      }).catch(function () {});
    }
    ready.then(function () {
      try { nat.save({ data: JSON.stringify(buildPayload()) }).catch(function () {}); } catch (e) {}
    });
  }

  function pushDebounced() {
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(push, 800);
  }

  window.CwWidget = { push: push };

  window.addEventListener('cw:changed', pushDebounced);
  // 回到前台：先同步组件上的勾选，再刷新组件
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') push();
  });
  document.addEventListener('DOMContentLoaded', function () { setTimeout(push, 2000); });
  setTimeout(push, 4000);
})();
