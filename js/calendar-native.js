window.NativeCalendar = (function () {
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

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

  function downloadFallback(ics) {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cw-calendar.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function errorText(e) {
    const msg = (e && (e.message || e.code || String(e))) || '';
    if (msg.indexOf('no-writable-calendar') >= 0) return '没有可写入的日历账户';
    if (msg.indexOf('permission') >= 0) return '日历权限被拒绝';
    if (msg.indexOf('insert-event-returned-null') >= 0) return '系统拒绝写入事件';
    return '同步失败：' + msg;
  }

  async function sync() {
    const events = collectEvents();
    const reminders = remindersArray();
    if (!events.length) { if (window.UI) UI.toast('没有可同步的日程', 'warn'); return { ok: false, reason: 'empty' }; }
    const plugin = nativePlugin();
    if (plugin) {
      try {
        const p = await plugin.checkPermissions();
        if (!(p && p.granted)) {
          const r = await plugin.requestPermissions();
          if (!(r && r.granted)) { if (window.UI) UI.toast('日历授权被拒绝', 'warn'); return { ok: false, reason: 'denied' }; }
        }
        const res = await plugin.sync({ events: events, reminders: reminders });
        const cnt = (res && typeof res.count === 'number') ? res.count : 0;
        if (window.Store) Store.update((st) => { st.cal = st.cal || {}; st.cal.local = { authorized: true, syncedCount: cnt, lastAt: Date.now() }; });
        if (cnt > 0) {
          if (window.UI) UI.toast('已写入系统日历 ' + cnt + ' 个日程', 'ok');
          return { ok: true, count: cnt };
        }
        const err = (res && res.lastError) ? res.lastError : 'unknown';
        if (window.UI) UI.toast('写入 0 个日程：' + err, 'warn');
        return { ok: false, reason: err };
      } catch (e) {
        console.warn('[cal] 原生写入失败', e);
        if (window.UI) UI.toast(errorText(e), 'warn');
      }
    }
    const { ics } = buildICS();
    downloadFallback(ics);
    if (window.UI) UI.toast('已生成 .ics，请在系统日历中导入', 'ok');
    return { ok: true, count: events.length, fallback: true };
  }

  async function clearRecord() {
    const plugin = nativePlugin();
    if (plugin) { try { await plugin.clear(); } catch (e) { console.warn('[cal] clear failed', e); } }
    if (window.Store) Store.update((st) => { st.cal = st.cal || {}; st.cal.local = { authorized: false, syncedCount: 0, lastAt: 0 }; });
  }

  return { isNative: isNative, available: available, sync: sync, clearRecord: clearRecord, buildICS: buildICS };
})();
