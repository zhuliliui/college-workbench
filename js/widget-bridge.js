/* ============================================================
  安卓桌面小组件 · 数据桥
  原生 App 里把「今日计划 + 临近 DDL + 存钱罐余额」推给 WidgetData 插件，
  组件内容在 JS 端拼好（Java 只渲染）；Store 每次保存都会自动推送（防抖）。
  浏览器/PWA 环境无插件，静默跳过。
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

  // 剩余时间文案（与工作台首页口径一致）
  function ddlRemain(due) {
    try {
      if (window.D && D.daysLeftText) return D.daysLeftText(due);
    } catch (e) {}
    return '';
  }
  function ddlWarn(due) {
    try {
      if (window.D && D.hoursLeft) return D.hoursLeft(due) <= 12;
    } catch (e) {}
    return false;
  }

  function buildPayload() {
    var s = Store.get();
    var today = window.D ? D.todayStr() : new Date().toISOString().slice(0, 10);
    var lines = [];

    // 今日计划：无截止（今天添加的）或今天到期；未完成在前，已完成带 ✓
    var tasks = (s.tasks || []).filter(function (t) {
      if (!t.due) return (t.addedDate || '') === today;
      return (t.due.slice(0, 10) === today) || (t.addedDate === today);
    });
    tasks.sort(function (a, b) { return (a.done - b.done) || (a.due || '').localeCompare(b.due || ''); });
    tasks.slice(0, 3).forEach(function (t) {
      var time = t.due ? ' ' + t.due.slice(11, 16) : '';
      lines.push({ t: (t.done ? '✓ ' : '○ ') + t.name + time, d: !!t.done, w: false });
    });

    // 临近 DDL：未完成、按截止时间升序，取 2 条
    var now = Date.now();
    var ddls = (s.ddls || []).filter(function (d) { return d.due && !d.done; })
      .sort(function (a, b) { return (a.due || '').localeCompare(b.due || ''); })
      .slice(0, 2);
    ddls.forEach(function (d) {
      lines.push({ t: '⏰ ' + d.name + ' · ' + ddlRemain(d.due), d: false, w: ddlWarn(d.due) });
    });

    if (!lines.length) lines.push({ t: '今天还没有安排，点开看看 ›', d: false, w: false });

    return {
      date: today,
      piggy: '¥' + ((s.piggy && s.piggy.balance) || 0).toFixed(2),
      lines: lines.slice(0, 6),
    };
  }

  function push() {
    var nat = plugin();
    if (!nat || !nat.save) return; // 浏览器 / PWA：无原生插件，跳过
    try {
      nat.save({ data: JSON.stringify(buildPayload()) }).catch(function () {});
    } catch (e) {}
  }

  function pushDebounced() {
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(push, 800); // 防抖：拖进度条等高频变化只推最后一次
  }

  window.CwWidget = { push: push };

  // Store.save() 每次都会派发 cw:changed → 自动同步组件
  window.addEventListener('cw:changed', pushDebounced);
  // 回到前台也刷一次（组件数据可能过期）
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') push();
  });
  // 启动后先推一次（等 store 加载完成）
  document.addEventListener('DOMContentLoaded', function () { setTimeout(push, 2000); });
  setTimeout(push, 4000); // 兜底
})();
