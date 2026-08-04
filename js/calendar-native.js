/* ============================================================
   本地日历同步（Capacitor 6 兼容方案）
   - 现状：Capacitor 6 没有可直接写系统日历的官方/三方插件
     （官方 @capacitor/calendar 仅支持 Cap 8；三方 capacitor-calendar 是 Cap 3 时代、AGP/compileSdk 不兼容）
   - 因此采用「生成 .ics（含提前提醒）→ 调起系统日历一键导入」的方式：
     * 离线可用、由系统日历授权、原生 App 与浏览器均可用
     * 原生环境用 @capacitor/share 直接拉起系统日历导入；失败则回退 .ics 下载
     * 浏览器/PWA：直接下载 .ics，用户手动导入系统日历
   ============================================================ */
window.NativeCalendar = (function () {
  function isNative() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  function sharePlugin() { return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.Share : null; }
  function fsPlugin() { return window.Capacitor && window.Capacitor.Plugins ? window.Capacitor.Plugins.Filesystem : null; }
  function available() { return isNative() && !!sharePlugin() && !!fsPlugin(); }

  // 收集事件并构造 .ics（DDL + 学习计划 + 提前提醒）
  function buildICS() {
    const s = (typeof Store !== 'undefined' && Store.get) ? Store.get() : { ddls: [], tasks: [], cal: {} };
    const cal = s.cal || {};
    const reminders = (cal.reminders && cal.reminders.length) ? cal.reminders : [1440, 720, 60];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (str) => ('' + (str || '')).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
    const toLocal = (str) => { const m = ('' + str).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/); return m ? m[1] + m[2] + m[3] + 'T' + m[4] + m[5] + '00' : null; };
    const addHour = (str) => { const d = new Date(str); if (isNaN(d)) return toLocal(str); d.setHours(d.getHours() + 1); const p = (n) => String(n).padStart(2, '0'); return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00'; };
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CollegeWorkbench//CN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    let count = 0;
    const pushEv = (id, name, due) => {
      const dt = toLocal(due); if (!dt) return;
      lines.push('BEGIN:VEVENT');
      lines.push('UID:cw-' + (id || 'x') + '@collegeworkbench');
      lines.push('DTSTAMP:' + stamp);
      lines.push('DTSTART:' + dt);
      lines.push('DTEND:' + addHour(due));
      lines.push('SUMMARY:' + esc(name || '未命名'));
      lines.push('DESCRIPTION:' + esc('大学生AI万能工作台 · 截止提醒'));
      reminders.forEach((m) => {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push('DESCRIPTION:' + esc('即将到期：' + (name || '未命名')));
        lines.push('TRIGGER:-PT' + m + 'M');
        lines.push('END:VALARM');
      });
      lines.push('END:VEVENT');
      count++;
    };
    (s.ddls || []).filter((d) => d.due && !d.done).forEach((d) => pushEv(d.id, 'DDL：' + (d.name || '未命名'), d.due));
    (s.tasks || []).filter((t) => t.due && !t.done).forEach((t) => pushEv(t.id, '计划：' + (t.name || '未命名'), t.due));
    lines.push('END:VCALENDAR');
    return { ics: lines.join('\r\n'), count };
  }

  // 浏览器/PWA：直接下载 .ics
  function downloadFallback() {
    const { ics } = buildICS();
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cw-calendar.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // 同步：原生走系统分享导入；非原生走下载
  async function sync() {
    const { ics, count } = buildICS();
    if (!count) { if (window.UI) UI.toast('没有可同步的 DDL / 计划', 'warn'); return { ok: false, reason: 'empty' }; }
    if (available()) {
      try {
        const fs = fsPlugin();
        const ret = await fs.writeFile({ path: 'cw-calendar.ics', data: ics, directory: 'CACHE', recursive: true });
        const uri = (ret && (ret.uri || ret.path)) ? (ret.uri || ('file://' + ret.path)) : null;
        if (!uri) throw new Error('no file uri');
        await sharePlugin().share({ title: '小朱工作台 · 同步到系统日历', text: '将以下 DDL / 计划导入系统日历', files: [uri], mimeType: 'text/calendar' });
        if (window.Store) Store.update((st) => { st.cal = st.cal || {}; st.cal.local = { authorized: true, syncedCount: count, lastAt: Date.now() }; });
        return { ok: true, count };
      } catch (e) {
        console.warn('[cal] 分享失败，回退下载', e);
        downloadFallback();
        if (window.UI) UI.toast('已生成 .ics，请在系统日历中导入', 'ok');
        return { ok: true, count, fallback: true };
      }
    }
    // 非原生：下载
    downloadFallback();
    if (window.UI) UI.toast('已生成 .ics 文件', 'ok');
    return { ok: true, count, fallback: true };
  }

  // 清除「本地同步记录」（仅清本地标记；已导入系统日历的事件请在系统日历中删除）
  function clearRecord() {
    if (window.Store) Store.update((st) => { st.cal = st.cal || {}; st.cal.local = { authorized: false, syncedCount: 0, lastAt: 0 }; });
  }

  return { isNative: isNative, available: available, sync: sync, clearRecord: clearRecord, buildICS: buildICS };
})();
