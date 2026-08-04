/* ============================================================
   原生本地日历同步（@capacitor/calendar）
   - 仅在原生 App（Capacitor + Calendar 插件）下生效；浏览器/PWA 自动跳过
   - 授权后把 DDL + 学习复习计划写入设备「系统日历」，离线可用、到期弹提醒
   - 同步策略：用独立日历「小朱工作台」（Android），先清空再重建，保证与当前清单一致
   ============================================================ */
window.NativeCalendar = (function () {
  const CAL_NAME = '小朱工作台';
  function plugin() { return (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins.Calendar : null; }
  function isNative() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  function available() { return isNative() && !!plugin(); }

  // 解析 DDL 截止时间：支持 2026-08-10T23:59 / 2026-08-10 23:59 / 2026-08-10
  function parseDue(str) {
  if (!str) return null;
  const m = ('' + str).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3], h = m[4] ? +m[4] : 23, mi = m[5] ? +m[5] : 59;
  return new Date(y, mo - 1, d, h, mi, 0, 0);
  }

  function permGranted(st) {
  if (!st) return false;
  if (st.granted) return true;
  if (Array.isArray(st.results)) return st.results.every((r) => r.granted);
  if (st.readCalendar && st.writeCalendar) return st.readCalendar === 'granted' && st.writeCalendar === 'granted';
  return false;
  }

  async function ensurePermission() {
  const C = plugin();
  if (!C) return false;
  try {
  if (C.checkPermissions) {
  const st = await C.checkPermissions();
  if (permGranted(st)) return true;
  }
  const r = C.requestPermissions ? await C.requestPermissions()
  : (C.requestWritePermission ? await C.requestWritePermission() : { granted: false });
  return permGranted(r);
  } catch (e) { console.warn('[cal] 授权异常', e); return false; }
  }

  async function getOurCalendarId() {
  const C = plugin();
  try {
  if (!C.listCalendars) return undefined;
  const list = await C.listCalendars();
  const cals = (list && (list.calendars || list.calendarList)) || [];
  const ours = cals.find((c) => c && (c.title === CAL_NAME || c.name === CAL_NAME));
  if (ours) return ours.id != null ? ours.id : ours;
  // 没有则创建独立日历（Android）
  if (C.createCalendar) {
  const created = await C.createCalendar({ title: CAL_NAME, color: '#5e8268', source: { name: CAL_NAME, type: 'LOCAL' } });
  if (created && created.id != null) return created.id;
  }
  } catch (e) { console.warn('[cal] 获取日历失败，回退默认日历', e); }
  return undefined; // 默认日历（iOS 走这里）
  }

  // 收集要写入的事件：DDL（未完成的）+ 学习复习计划（未完成的）
  function buildEvents() {
  const s = Store.get();
  const calCfg = s.cal || {};
  const reminders = (calCfg.reminders && calCfg.reminders.length ? calCfg.reminders : [1440, 720, 60]).map((m) => ({ minutes: m }));
  const evs = [];
  (s.ddls || []).filter((d) => d.due && !d.done).forEach((d) => {
  const start = parseDue(d.due); if (!start) return;
  evs.push({ title: 'DDL·' + (d.name || '未命名'), notes: '大学生AI万能工作台 · 截止提醒', start, end: new Date(start.getTime() + 60 * 60 * 1000), reminders });
  });
  (s.tasks || []).filter((t) => t.due && !t.done).forEach((t) => {
  const start = parseDue(t.due); if (!start) return;
  evs.push({ title: '计划·' + (t.name || '未命名'), notes: '大学生AI万能工作台 · 学习复习计划', start, end: new Date(start.getTime() + 60 * 60 * 1000), reminders });
  });
  return evs;
  }

  async function clearOurEvents(calendarId) {
  const C = plugin();
  if (calendarId == null || !C.findEvents || !C.deleteEvent) return;
  const found = await C.findEvents({ calendarId, startDate: new Date(2000, 0, 1), endDate: new Date(2100, 0, 1) });
  const arr = (found && found.events) || [];
  for (const e of arr) {
  try { await C.deleteEvent({ id: e.id, calendarId, title: e.title, startDate: e.startDate, endDate: e.endDate, location: e.location }); }
  catch (_) { /* 单条失败不影响整体 */ }
  }
  }

  async function sync() {
  if (!available()) return { ok: false, reason: 'browser' };
  const granted = await ensurePermission();
  if (!granted) return { ok: false, reason: 'denied' };
  const C = plugin();
  let calendarId;
  try { calendarId = await getOurCalendarId(); } catch (_) { calendarId = undefined; }
  const events = buildEvents();
  try { await clearOurEvents(calendarId); } catch (e) { console.warn('[cal] 清空旧事件失败', e); }
  let count = 0;
  for (const ev of events) {
  try {
  const opt = { title: ev.title, notes: ev.notes, startDate: ev.start, endDate: ev.end };
  if (calendarId != null) opt.calendarId = calendarId;
  if (ev.reminders && ev.reminders.length) opt.reminders = ev.reminders;
  await C.createEvent(opt);
  count++;
  } catch (e) { console.warn('[cal] 创建事件失败:', ev.title, e); }
  }
  Store.update((st) => {
  st.cal = st.cal || {};
  st.cal.local = { authorized: true, calendarId: calendarId != null ? calendarId : '', syncedCount: count, lastAt: Date.now() };
  });
  return { ok: true, count };
  }

  async function revoke() {
  if (!available()) return;
  const C = plugin();
  const local = (Store.get().cal || {}).local;
  const calendarId = local && local.calendarId;
  try { if (calendarId != null && calendarId !== '') await clearOurEvents(calendarId); } catch (e) {}
  Store.update((st) => { st.cal = st.cal || {}; st.cal.local = { authorized: false, calendarId: '', syncedCount: 0, lastAt: 0 }; });
  }

  return { available: available, availableNow: available, sync: sync, revoke: revoke, ensurePermission: ensurePermission };
})();
