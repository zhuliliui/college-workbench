/* ============================================================
   本地系统日历同步
   - 原生 App（安卓 APK）：通过自写 Capacitor 本地插件 CalendarLocal 直接写入
     设备系统级 CalendarContract 数据库（华为/安卓日历 App 共享该数据源），
     写入后系统日历自动显示，离线可用，不用 Google 服务、不依赖 .ics 导入。
   - 浏览器 / PWA：降级为生成 .ics 文件下载，由用户手动导入系统日历。
   ============================================================ */
window.NativeCalendar = (function () {
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  // 取得原生 CalendarLocal 插件（必要时显式注册）
  function nativePlugin() {
    try {
      if (!isNative()) return null;
      if (window.Capacitor.Plugins && window.Capacitor.Plugins.CalendarLocal) return window.Capacitor.Plugins.CalendarLocal;
      if (window.Capacitor.registerPlugin) {
        try { return window.Capacitor.registerPlugin('CalendarLocal'); } catch (e) {}
      }
      return null;
    } catch (e) { return null; }
  }

  function available() { return !!nativePlugin(); }

  // 收集待同步事件（DDL + 学习计划，未完成且有截止时间）
  function collectEvents() {
    const s = (typeof Store !== 'undefined' && Store.get) ? Store.get() : { ddls: [], tasks: [] };
    const out = [];
    const toMs = (str) => { const t = Date.parse(str); return isNaN(t) ? null : t; };
    (s.ddls || []).filter((d) => d.due && !d.done).forEach((d) => {
      const start = toMs(d.due); if (start == null) return;
      out.push({ title: 'DDL：' + (d.name || '未命名'), description: '大学生AI万能工作台 · 截止提醒', location: '', start: start, end: start + 3600000 });
    });
    (s.tasks || []).filter((t) => t.due && !t.done).forEach((t) => {
      const start = toMs(t.due); if (start == null) return;
      out.push({ title: '计划：' + (t.name || '未命名'), description: '大学生AI万能工作台 · 学习计划', location: '', start: start, end: start + 3600000 });
    });
    return out;
  }

  function remindersArray() {
    const cal = (typeof Store !== 'undefined' && Store.get && Store.get().cal) || {};
    let arr = (cal.reminders || [60]).map(Number).filter((n) => n > 0);
    if (!arr.length) arr = [60];
    return arr;
  }

  // 构造 .ics（浏览器降级用）
  function buildICS() {
    const events = collectEvents();
    const reminders = remindersArray();
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (str) => ('' + (str || '')).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const toICS = (ms) => { const d = new Date(ms); const p = (n) => String(n).padStart(2, '0'); return '' + d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + 'T' + p(d.getUTCHours()) + p(d.getUTCMinutes()) + '00Z'; };
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CollegeWorkbench//CN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    let count = 0;
    events.forEach((e, i) => {
      lines.push('BEGIN:VEVENT');
      lines.push('UID:cw-' + i + '-' + e.start + '@collegeworkbench');
      lines.push('DTSTAMP:' + stamp);
      lines.push('DTSTART:' + toICS(e.start));
      lines.push('DTEND:' + toICS(e.end));
      lines.push('SUMMARY:' + esc(e.title));
      lines.push('DESCRIPTION:' + esc(e.description));
      reminders.forEach((m) => {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push('DESCRIPTION:' + esc('即将到期：' + e.title));
        lines.push('TRIGGER:-PT' + m + 'M');
        lines.push('END:VALARM');
      });
      lines.push('END:VEVENT');
      count++;
    });
    lines.push('END:VCALENDAR');
    return { ics: lines.join('\r\n'), count };
  }

  // 浏览器：下载 .ics
  function downloadFallback(ics) {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cw-calendar.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // 同步主入口
  async function sync() {
    const events = collectEvents();
    const reminders = remindersArray();
    if (!events.length) { if (window.UI) UI.toast('没有可同步的 DDL / 计划', 'warn'); return { ok: false, reason: 'empty' }; }
    const plugin = nativePlugin();
    if (plugin) {
      try {
        const p = await plugin.checkPermissions();
        if (!(p && p.granted)) {
          const r = await plugin.requestPermissions();
          if (!(r && r.granted)) { if (window.UI) UI.toast('日历授权被拒绝', 'warn'); return { ok: false, reason: 'denied' }; }
        }
        const res = await plugin.sync({ events: events, reminders: reminders });
        const cnt = (res && typeof res.count === 'number') ? res.count : events.length;
        if (window.Store) Store.update((st) => { st.cal = st.cal || {}; st.cal.local = { authorized: true, syncedCount: cnt, lastAt: Date.now() }; });
        if (window.UI) UI.toast('已写入系统日历 ' + cnt + ' 个日程', cnt > 0 ? 'ok' : 'warn');
        return { ok: cnt > 0, count: cnt };
      } catch (e) {
        console.warn('[cal] 原生写入失败，降级 .ics', e);
        if (window.UI) UI.toast('系统日历写入失败，已改用 .ics', 'warn');
      }
    }
    // 降级：下载 .ics
    const { ics } = buildICS();
    downloadFallback(ics);
    if (window.UI) UI.toast('已生成 .ics，请在系统日历中导入', 'ok');
    return { ok: true, count: events.length, fallback: true };
  }

  // 清除系统日历里本插件写入的日程 + 本地标记
  async function clearRecord() {
    const plugin = nativePlugin();
    if (plugin) { try { await plugin.clear(); } catch (e) { console.warn('[cal] clear failed', e); } }
    if (window.Store) Store.update((st) => { st.cal = st.cal || {}; st.cal.local = { authorized: false, syncedCount: 0, lastAt: 0 }; });
  }

  return { isNative: isNative, available: available, sync: sync, clearRecord: clearRecord, buildICS: buildICS };
})();
