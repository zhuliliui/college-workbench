window.NativeCalendar = (function () {
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  // 缓存设备品牌信息（plugin 返回的 brand/manufacturer/isChinaRom）
  let deviceInfoCache = null;
  async function getDeviceInfo() {
    const plugin = nativePlugin();
    if (!plugin || !plugin.getDeviceInfo) return { brand: 'unknown', isChinaRom: false };
    if (deviceInfoCache) return deviceInfoCache;
    try {
      const r = await plugin.getDeviceInfo();
      deviceInfoCache = { brand: r.brand || 'unknown', manufacturer: r.manufacturer || '', isChinaRom: !!r.isChinaRom };
    } catch (e) { deviceInfoCache = { brand: 'unknown', isChinaRom: false }; }
    return deviceInfoCache;
  }

  // LOCAL 类方法（即同步到了 LOCAL 账户日历），在国产 ROM 下系统日历 App 默认不可见
  // 此时主动 fallback 到 webcal 链接，避免误导用户
  function isLocalMethod(m) { return m === 'ours' || m === 'local'; }

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

  function buildICS(eventsArg, remindersArg) {
    const events = eventsArg || collectEvents();
    const reminders = remindersArg || remindersArray();
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

  function downloadFallback(ics, filename) {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'cw-calendar.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // fallback 1：复制 webcal 订阅链接到剪贴板（推荐给华为/vivo 等不支持 .ics 导入的日历 App）
  function fallbackCopyWebcal(backendUrl) {
    const url = backendUrl.replace(/\/$/, '') + '/api/ddl/calendar.ics?clientId=' + getClientId();
    const webcal = 'webcal://' + url.replace(/^https?:\/\//, '');
    let copied = false;
    try { if (navigator.clipboard) { navigator.clipboard.writeText(webcal); copied = true; } } catch (e) {}
    return { webcal: webcal, httpUrl: url, copied: copied, fallback: 'webcal' };
  }

  // fallback 2：直接下载 .ics 文件（备用，部分日历 App 支持）
  function fallbackDownload(events, reminders) {
    const { ics, count } = buildICS(events, reminders);
    downloadFallback(ics);
    return { fallback: 'ics', count: count };
  }

  function errorText(e) {
    const msg = (e && (e.message || e.code || String(e))) || '';
    if (msg.indexOf('no-writable-calendar') >= 0) return '设备没有可写入的日历账户（请先在系统日历里添加 Google/QQ/邮箱账户）';
    if (msg.indexOf('permission') >= 0) return '日历权限被拒绝';
    if (msg.indexOf('insert-event-returned-null') >= 0) return '系统拒绝写入事件';
    return '同步失败：' + msg;
  }

  function getClientId() {
    const st = (typeof Store !== 'undefined' && Store.get) ? Store.get() : {};
    const cur = st.cal && st.cal.clientId;
    if (cur) return cur;
    let id = (typeof localStorage !== 'undefined') ? localStorage.getItem('cw_client_id') : null;
    if (!id) { id = 'cw_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); try { localStorage.setItem('cw_client_id', id); } catch (e) {} }
    if (window.Store) Store.update((st) => { st.cal = st.cal || {}; if (!st.cal.clientId) st.cal.clientId = id; });
    return id;
  }

  async function sync() {
    const events = collectEvents();
    const reminders = remindersArray();
    if (!events.length) {
      const st = (typeof Store !== 'undefined' && Store.get) ? Store.get() : { ddls: [], tasks: [] };
      const ddls = st.ddls || [];
      const tasks = st.tasks || [];
      const doneDdl = ddls.filter((d) => d.done).length;
      const noDateDdl = ddls.filter((d) => !d.due).length;
      const doneTask = tasks.filter((t) => t.done).length;
      const noDateTask = tasks.filter((t) => !t.due).length;
      console.warn('[cal] 无同步事件', { ddl: ddls.length, doneDdl, noDateDdl, task: tasks.length, doneTask, noDateTask });
      return {
        ok: false, reason: 'empty',
        diagnostic: { ddls: ddls.length, doneDdl, noDateDdl, tasks: tasks.length, doneTask, noDateTask },
      };
    }
    const plugin = nativePlugin();
    const st = (typeof Store !== 'undefined' && Store.get) ? Store.get() : { cal: {} };
    const backendUrl = (st.cal && st.cal.backendUrl) || '';
    const deviceInfo = await getDeviceInfo();
    const isChinaRom = !!deviceInfo.isChinaRom;
    const brandLabel = deviceInfo.brand || '';

    if (plugin) {
      try {
        const p = await plugin.checkPermissions();
        if (!(p && p.granted)) {
          const r = await plugin.requestPermissions();
          if (!(r && r.granted)) return { ok: false, reason: 'denied', diagnostic: { perm: false } };
        }
        const res = await plugin.sync({ events: events, reminders: reminders });
        const cnt = (res && typeof res.count === 'number') ? res.count : 0;
        const method = res && res.method;

        // 国产 ROM + 写入到 LOCAL 账户日历 → 系统日历 App 看不见，必须走 webcal
        if (cnt > 0 && isChinaRom && isLocalMethod(method)) {
          if (window.Store) Store.update((s) => { s.cal = s.cal || {}; s.cal.local = { authorized: true, syncedCount: cnt, lastAt: Date.now(), method: method, hiddenOnRom: true }; });
          if (backendUrl) {
            const fb = fallbackCopyWebcal(backendUrl);
            return {
              ok: true, count: cnt, method: method, fallback: 'webcal', webcal: fb.webcal, httpUrl: fb.httpUrl, copied: fb.copied,
              hint: '检测到 ' + brandLabel + '（国产 ROM），写入到 LOCAL 账户的日程在系统日历 App 默认不可见。已自动复制订阅链接，请到日历 App 粘贴订阅。',
            };
          }
          const fb = fallbackDownload(events, reminders);
          return {
            ok: true, count: cnt, method: method, fallback: 'ics',
            hint: '检测到 ' + brandLabel + '（国产 ROM），写入到 LOCAL 账户的日程在系统日历 App 默认不可见。已下载 .ics。',
          };
        }

        // 写入成功（非国产 ROM 或非 LOCAL 账户）
        if (cnt > 0) {
          if (window.Store) Store.update((s) => { s.cal = s.cal || {}; s.cal.local = { authorized: true, syncedCount: cnt, lastAt: Date.now(), method: method }; });
          const whereMap = { ours: '（小朱工作台日历）', local: '（本机 LOCAL 日历）' };
          const where = (method && whereMap[method]) ? whereMap[method] : '';
          return { ok: true, count: cnt, method: method, where: where, brand: brandLabel, isChinaRom: isChinaRom };
        }

        // 写入 0 条 → fallback
        if (backendUrl) {
          const fb = fallbackCopyWebcal(backendUrl);
          return { ok: true, count: events.length, fallback: 'webcal', webcal: fb.webcal, httpUrl: fb.httpUrl, copied: fb.copied, lastError: (res && res.lastError) || 'unknown' };
        }
        const fb = fallbackDownload(events, reminders);
        return { ok: true, count: events.length, fallback: 'ics', lastError: (res && res.lastError) || 'unknown' };
      } catch (e) {
        console.warn('[cal] 原生写入失败', e);
        if (backendUrl) {
          const fb = fallbackCopyWebcal(backendUrl);
          return { ok: false, reason: 'exception', error: errorText(e), fallback: 'webcal', webcal: fb.webcal, httpUrl: fb.httpUrl, copied: fb.copied };
        }
        const fb = fallbackDownload(events, reminders);
        return { ok: false, reason: 'exception', error: errorText(e), fallback: 'ics' };
      }
    }
    // 浏览器环境
    if (backendUrl) {
      const fb = fallbackCopyWebcal(backendUrl);
      return { ok: true, count: events.length, fallback: 'webcal', webcal: fb.webcal, httpUrl: fb.httpUrl, copied: fb.copied };
    }
    const fb = fallbackDownload(events, reminders);
    return { ok: true, count: events.length, fallback: 'ics' };
  }

  async function clearRecord() {
    const plugin = nativePlugin();
    if (plugin) { try { await plugin.clear(); } catch (e) { console.warn('[cal] clear failed', e); } }
    if (window.Store) Store.update((st) => { st.cal = st.cal || {}; st.cal.local = { authorized: false, syncedCount: 0, lastAt: 0 }; });
  }

  // 直接下载 .ics（用于「手动导出」场景）
  function downloadICS() {
    const { ics, count } = buildICS();
    downloadFallback(ics, 'cw-ddl-' + new Date().toISOString().slice(0, 10) + '.ics');
    return count;
  }

  // 仅复制 webcal 链接
  function copyWebcal() {
    const st = (typeof Store !== 'undefined' && Store.get) ? Store.get() : { cal: {} };
    const backendUrl = (st.cal && st.cal.backendUrl) || '';
    if (!backendUrl) return null;
    const fb = fallbackCopyWebcal(backendUrl);
    return fb;
  }

  return { isNative: isNative, available: available, sync: sync, clearRecord: clearRecord, buildICS: buildICS, downloadICS: downloadICS, copyWebcal: copyWebcal };
})();
