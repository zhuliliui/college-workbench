/* ============================================================
   大学生AI万能工作台 · 轻量后端（零依赖，原生 Node）
   功能：
   1. 托管静态前端
   2. 接收前端同步的 DDL 清单
   3. 动态生成可订阅的 iCalendar(.ics) 日历 feed
   4. 微信推送（WxPusher / PushPlus / Server酱）— 定时 cron 自动推送 DDL 提醒
   ============================================================ */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');

// ---------- 代理支持（本机被墙时走本地代理抓外媒；Railway 等海外节点无此变量不受影响）----------
// 注意：Node 内置 fetch()（undici）默认不读 HTTP_PROXY/HTTPS_PROXY，必须显式挂 dispatcher。
// 用全局包装：检测到代理时，所有外网 fetch 自动走代理，localhost 自身请求直连。
//
// 关键修复（2026-08-07）：
//  1) 代理失败降级直连时，必须给直连「新建一个 AbortSignal」——旧代码复用已被超时取消的
//     原 signal，导致直连瞬间被取消，表现为 The Guardian/Atlantic/TIME 频繁 timeout / 502。
//  2) 代理返回 5xx（502/503/504，多为代理出口不稳）时，自动换直连重试一次。
//  3) 未显式设置 HTTP_PROXY 时，自动读取 Windows 系统代理（Clash 开启「系统代理」即生效，
//     无需手动 set 环境变量），解决“明明开了代理却没走”的问题。
function detectWindowsProxy() {
  if (process.platform !== 'win32') return '';
  try {
    const { execSync } = require('child_process');
    const out = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /v ProxyServer', { encoding: 'utf8', timeout: 3000 });
    let enabled = false, server = '';
    for (const line of out.split('\n')) {
      if (/ProxyEnable/i.test(line)) enabled = /0x1\b/i.test(line);
      if (/ProxyServer/i.test(line)) { const p = line.trim().split(/\s+/); server = (p[p.length - 1] || '').trim(); }
    }
    if (enabled && server) {
      if (server.includes('=')) {
        const m = server.match(/https=([^\s;]+)/i) || server.match(/http=([^\s;]+)/i) || server.match(/([^\s;]+)/);
        server = m ? m[1] : server;
      }
      if (!/^https?:\/\//i.test(server)) server = 'http://' + server;
      return server;
    }
  } catch (e) {}
  return '';
}
let proxyDispatcher = null;
let proxyUrl = (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || '').trim();
if (!proxyUrl) proxyUrl = detectWindowsProxy();
try {
  if (proxyUrl) {
    const undici = require('undici');
    proxyDispatcher = new undici.ProxyAgent(proxyUrl);
    const undiciFetch = undici.fetch;
    // 注意：Node 内置 globalThis.fetch 不认 dispatcher 参数，必须用 undici.fetch 才能走代理
    const isLocal = (u) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)/i.test(u);
    const freshSignal = () => AbortSignal.timeout(15000); // 直连/重试用全新计时器，避免复用已取消的 signal
    globalThis.fetch = (input, init) => {
      const u = typeof input === 'string' ? input : (input && input.url) || '';
      if (isLocal(u) || !proxyDispatcher) return undiciFetch(input, init);
      const proxyInit = Object.assign({}, init, { dispatcher: proxyDispatcher });
      return undiciFetch(input, proxyInit).then((r) => {
        // 4xx（含 406）是源站/反爬决定，不重试；5xx（502/503/504 多为代理出口不稳）换直连重试
        if (r.ok || (r.status >= 400 && r.status < 500)) return r;
        const directInit = Object.assign({}, init);
        if (init && init.signal) delete directInit.signal;
        directInit.signal = freshSignal();
        return undiciFetch(input, directInit);
      }, (err) => { // 代理连接失败/超时：直连重试
        const directInit = Object.assign({}, init);
        if (init && init.signal) delete directInit.signal;
        directInit.signal = freshSignal();
        return undiciFetch(input, directInit);
      });
    };
    console.log('[proxy] 已启用代理：' + proxyUrl + '（代理不可用时自动降级直连，5xx 自动重试）');
  } else {
    console.warn('[proxy] 未检测到代理（也未设置 HTTP_PROXY）。外媒/外刊抓取可能被墙；开启 Clash 系统代理后重启，或用 HTTP_PROXY=http://127.0.0.1:7897 node server.js');
  }
} catch (e) { console.warn('[proxy] 代理初始化失败（忽略，走直连）：' + e.message); }

const PORT = process.env.PORT || 3000;
// 浏览器风格请求头：New Scientist/TIME/Atlantic 等外媒 RSS 对简单 User-Agent 返回 406/403
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5',
  'Accept-Language': 'en-US,en;q=0.9',
};
const REG_FILE = path.join(__dirname, 'registrations.json');
const REG_TTL = 30 * 24 * 60 * 60 * 1000; // 30 天未更新则清理

// ---------- 持久化注册表 ----------
function loadRegs() {
  try { return JSON.parse(fs.readFileSync(REG_FILE, 'utf8') || '{}'); } catch (e) { return {}; }
}
function saveRegs(regs) {
  try { fs.writeFileSync(REG_FILE, JSON.stringify(regs, null, 2)); } catch (e) { console.error('保存注册表失败', e); }
}
let regs = loadRegs();

// ---------- MIME ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.ics': 'text/calendar; charset=utf-8',
};

function send(res, status, data, type) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-cache',
  };
  if (type) headers['Content-Type'] = type;
  res.writeHead(status, headers);
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 2e6) reject(new Error('body too large')); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// ---------- iCalendar 生成 ----------
function icsEscape(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
function toICSLocal(s) {
  if (!s) return null;
  const m = ('' + s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return null;
  return m[1] + m[2] + m[3] + 'T' + m[4] + m[5] + '00';
}
function addHourICS(s) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return toICSLocal(s);
  d.setHours(d.getHours() + 1);
  const p = (n) => String(n).padStart(2, '0');
  return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00';
}
function addMinutesICS(s, mins) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return toICSLocal(s);
  d.setMinutes(d.getMinutes() + (Number(mins) || 60));
  const p = (n) => String(n).padStart(2, '0');
  return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00';
}

// ---------- CalDAV（系统日历「添加账户」式订阅，零手动链接）----------
function xmlEscape(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function davHeaders() {
  return {
    'DAV': '1, 2, calendar-access, calendar-auto-schedule',
    'Allow': 'OPTIONS, PROPFIND, REPORT, GET',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, PROPFIND, REPORT, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Depth, Prefer',
    'Cache-Control': 'no-cache',
  };
}
function sendXML(res, xml) {
  res.writeHead(207, {
    'Content-Type': 'application/xml; charset=utf-8',
    'DAV': '1, 2, calendar-access',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
  });
  res.end(xml);
}
function emptyMultistatus() {
  return '<?xml version="1.0" encoding="utf-8"?>\n<d:multistatus xmlns:d="DAV:"></d:multistatus>';
}
function handleCalDAV(req, res, pathname, parsed) {
  // Basic Auth：用户名 = clientId，密码 = CALDAV_PASS（默认 workbench）
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Basic\s+(.+)$/i);
  let user = '', pass = '';
  if (m) { try { const dec = Buffer.from(m[1], 'base64').toString('utf8'); const i = dec.indexOf(':'); user = dec.slice(0, i); pass = dec.slice(i + 1); } catch (e) {} }
  const requiredPass = process.env.CALDAV_PASS || 'workbench';
  if (!user || pass !== requiredPass) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="CollegeWorkbench"', 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Unauthorized');
    return;
  }
  const clientId = user;
  const reg = regs[clientId];
  const ics = reg ? buildICS(reg.ddls, reg.tasks, reg.reminders)
    : 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CollegeWorkbench//CN\r\nCALSCALE:GREGORIAN\r\nEND:VCALENDAR';
  const ctag = reg ? reg.updatedAt : 0;

  if (req.method === 'OPTIONS') {
    res.writeHead(200, davHeaders());
    res.end();
    return;
  }
  const p = pathname.replace(/\/$/, '');
  // 账户根：返回 principal + calendar-home-set
  if (p === '/caldav' || p === '/caldav/') {
    if (req.method === 'PROPFIND') {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/">
 <d:response>
  <d:href>/caldav/</d:href>
  <d:propstat><d:prop>
   <d:current-user-principal><d:href>/caldav/</d:href></d:current-user-principal>
   <cal:calendar-home-set><d:href>/caldav/${clientId}/</d:href></cal:calendar-home-set>
   <d:displayname>Workbody</d:displayname>
  </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
 </d:response>
</multistatus>`;
      sendXML(res, xml);
      return;
    }
    res.writeHead(405, { 'Allow': 'OPTIONS, PROPFIND' }); res.end(); return;
  }
  // 日历集合
  if (p === '/caldav/' + clientId || p === '/caldav/' + clientId + '/') {
    if (req.method === 'PROPFIND') {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/">
 <d:response>
  <d:href>/caldav/${clientId}/</d:href>
  <d:propstat><d:prop>
   <d:displayname>Workbody 日历</d:displayname>
   <d:resourcetype><d:collection/><cal:calendar/></d:resourcetype>
   <cal:supported-calendar-component-set><cal:comp name="VEVENT"/></cal:supported-calendar-component-set>
   <cs:getctag>${ctag}</cs:getctag>
   <d:getetag>"${ctag}"</d:getetag>
  </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
 </d:response>
</multistatus>`;
      sendXML(res, xml);
      return;
    }
    if (req.method === 'REPORT') {
      readBody(req).then(() => {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav">
 <d:response>
  <d:href>/caldav/${clientId}/workbody.ics</d:href>
  <d:propstat><d:prop>
   <cal:calendar-data>${xmlEscape(ics)}</cal:calendar-data>
   <d:getetag>"${ctag}"</d:getetag>
  </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
 </d:response>
</multistatus>`;
        sendXML(res, xml);
      }).catch(() => sendXML(res, emptyMultistatus()));
      return;
    }
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/calendar; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
      res.end(ics);
      return;
    }
    res.writeHead(405, { 'Allow': 'OPTIONS, PROPFIND, REPORT, GET' }); res.end(); return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not Found');
}
function buildICS(ddls, tasks, reminders) {
  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//CollegeWorkbench//DDL//CN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const rms = (reminders && reminders.length ? reminders : [1440, 720, 60]);
  // ---- DDL（截止任务）----
  (ddls || []).filter((d) => d.due && !d.done).forEach((d) => {
    const dt = toICSLocal(d.due);
    if (!dt) return;
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + (d.id || 'x') + '@collegeworkbench');
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART:' + dt);
    lines.push('DTEND:' + addHourICS(d.due));
    lines.push('SUMMARY:' + icsEscape('⏰ DDL：' + (d.name || '未命名')));
    lines.push('DESCRIPTION:' + icsEscape('大学生AI万能工作台 · 截止提醒'));
    rms.forEach((m) => {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push('DESCRIPTION:' + icsEscape('⏰ 即将到期：' + (d.name || '未命名')));
      lines.push('TRIGGER:-PT' + m + 'M');
      lines.push('END:VALARM');
    });
    lines.push('END:VEVENT');
  });
  // ---- 待办 / 学习复习计划（带 due 时间的任务）----
  (tasks || []).filter((t) => t.due && !t.done).forEach((t) => {
    const dt = toICSLocal(t.due);
    if (!dt) return;
    const end = t.est ? addMinutesICS(t.due, t.est) : addHourICS(t.due);
    const cat = t.category ? (' · ' + t.category) : '';
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + (t.id || 't') + '@collegeworkbench');
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART:' + dt);
    lines.push('DTEND:' + end);
    lines.push('SUMMARY:' + icsEscape('📌 待办：' + (t.name || '未命名') + cat));
    lines.push('DESCRIPTION:' + icsEscape('大学生AI万能工作台 · 学习复习计划' + cat + (t.est ? (' · 预计 ' + t.est + ' 分钟') : '')));
    rms.forEach((m) => {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push('DESCRIPTION:' + icsEscape('📌 待办提醒：' + (t.name || '未命名')));
      lines.push('TRIGGER:-PT' + m + 'M');
      lines.push('END:VALARM');
    });
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ---------- 微信推送（WxPusher / PushPlus / Server酱）----------
function httpsPost(host, apiPath, bodyObj) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(bodyObj);
    const req = https.request({
      hostname: host,
      port: 443,
      path: apiPath,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 10000,
    }, (res) => {
      let chunks = '';
      res.on('data', (c) => { chunks += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(chunks) }); }
        catch (e) { resolve({ status: res.statusCode, data: chunks }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('push request timeout')); });
    req.write(data);
    req.end();
  });
}

async function sendPush(service, token, title, content, uid) {
  if (!token) return { ok: false, error: '缺少 token' };
  try {
    if (service === 'wxpusher') {
      // WxPusher: POST https://wxpusher.zjiecode.com/api/send/message
      if (!uid) return { ok: false, error: '缺少 UID' };
      const r = await httpsPost('wxpusher.zjiecode.com', '/api/send/message', {
        appToken: token, content, summary: (title || '').slice(0, 100), contentType: 1, uids: [uid],
      });
      if (r.status === 200 && r.data && r.data.code === 1000 && r.data.success) return { ok: true };
      return { ok: false, error: (r.data && r.data.msg) || ('HTTP ' + r.status) };
    }
    if (service === 'pushplus') {
      // PushPlus: POST https://www.pushplus.plus/send
      const r = await httpsPost('www.pushplus.plus', '/send', { token, title, content, template: 'txt' });
      if (r.status === 200 && r.data && r.data.code === 200) return { ok: true };
      return { ok: false, error: (r.data && r.data.msg) || ('HTTP ' + r.status) };
    }
    if (service === 'serverchan') {
      // Server酱 Turbo: POST https://sctapi.ftqq.com/<key>.send
      const r = await httpsPost('sctapi.ftqq.com', '/' + token + '.send', { title, desp: content });
      if (r.status === 200 && r.data && r.data.code === 0) return { ok: true };
      return { ok: false, error: (r.data && r.data.message) || ('HTTP ' + r.status) };
    }
    return { ok: false, error: '不支持的推送服务：' + service };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

// ---------- DDL 时间计算 ----------
function parseDue(s) {
  if (!s) return null;
  // datetime-local 格式 "2026-08-05T23:59" → 按本地时间解析
  const m = ('' + s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}
function minutesLeft(due) {
  const d = parseDue(due);
  if (!d) return Infinity;
  return Math.round((d.getTime() - Date.now()) / 60000);
}

// ---------- 定时 cron：每 30 分钟扫描并推送 ----------
function cronPush() {
  const now = Date.now();
  let pushedCount = 0;
  for (const clientId in regs) {
    const reg = regs[clientId];
    if (!reg.push || !reg.push.token) continue;
    const reminders = reg.reminders && reg.reminders.length ? reg.reminders : [1440, 720, 60];
    reg.pushedLog = reg.pushedLog || {};
    let changed = false;

    for (const ddl of (reg.ddls || [])) {
      if (ddl.done) continue;
      const ml = minutesLeft(ddl.due);
      if (ml === Infinity) continue;

      // 对每个提醒窗口检查：如果剩余时间 <= 提醒时间 且 > 0，且尚未推送过
      for (const rm of reminders) {
        const key = ddl.id + '_' + rm;
        if (ml <= rm && ml > 0 && !reg.pushedLog[key]) {
          const hours = Math.round(ml / 60 * 10) / 10;
          const title = '⏰ DDL 提醒：' + (ddl.name || '未命名');
          const content = '任务「' + (ddl.name || '未命名') + '」将在 ' + hours + ' 小时后到期（' + ddl.due + '）。\n\n请抓紧时间完成！\n\n— 大学生AI万能工作台';
          sendPush(reg.push.service, reg.push.token, title, content, reg.push.uid).then((r) => {
            if (r.ok) console.log('[cron] 推送成功:', title);
            else console.warn('[cron] 推送失败:', r.error);
          });
          reg.pushedLog[key] = now;
          changed = true;
          pushedCount++;
        }
      }

      // 已过期且未推送过过期提醒（仅推一次）
      if (ml <= 0 && !reg.pushedLog[ddl.id + '_overdue']) {
        const title = '🚨 DDL 已过期：' + (ddl.name || '未命名');
        const content = '任务「' + (ddl.name || '未命名') + '」已过期（截止：' + ddl.due + '）。\n\n请尽快处理！\n\n— 大学生AI万能工作台';
        sendPush(reg.push.service, reg.push.token, title, content, reg.push.uid).then(() => {});
        reg.pushedLog[ddl.id + '_overdue'] = now;
        changed = true;
        pushedCount++;
      }
    }

    // 清理已完成 DDL 的推送记录
    const doneIds = new Set((reg.ddls || []).filter((d) => d.done).map((d) => d.id));
    if (doneIds.size) {
      for (const k in reg.pushedLog) {
        const did = k.split('_')[0];
        if (doneIds.has(did)) { delete reg.pushedLog[k]; changed = true; }
      }
    }

    if (changed) saveRegs(regs);
  }
  if (pushedCount > 0) console.log('[cron] 本次推送', pushedCount, '条提醒');
}

// 每 30 分钟执行一次
setInterval(cronPush, 30 * 60 * 1000);
// 启动后 10 秒先跑一轮
setTimeout(cronPush, 10000);

// ---------- 外刊阅读：服务端真实实时抓取（每日定时拉取最新外刊，中英对照，落盘持久化）----------
// 抓取源：考研/四六级题源聚焦 ——《卫报》社会·科技·科学·教育·文化·生活 + 《新科学家》+ 《大西洋月刊》(科学/科技分区) + TIME
// 仅取 社会 / 教育 / 职场 / 大众科技 板块，避开硬核金融与地缘政治（EXCLUDE_KW 二次过滤）
// 原版外网直连易 406/反爬：请求已用完整浏览器 UA 伪装（BROWSER_HEADERS）；若持续失败，请带本地代理启动（HTTP_PROXY）
// 应急：内置 REALNEWS_SEED 离线题源库（36 篇）随时可用，不依赖海外源
// 可通过环境变量覆盖：RSS_SOURCES（JSON 数组）、LLM_API_KEY/LLM_BASE_URL/LLM_MODEL（翻译，默认 DeepSeek 国内可直连）
const FEEDS = (() => {
  try { if (process.env.RSS_SOURCES) return JSON.parse(process.env.RSS_SOURCES); } catch (e) {}
  return [
    { name: 'The Guardian', rss: 'https://www.theguardian.com/society/rss' },
    { name: 'The Guardian', rss: 'https://www.theguardian.com/science/rss' },
    { name: 'The Guardian', rss: 'https://www.theguardian.com/technology/rss' },
    { name: 'The Guardian', rss: 'https://www.theguardian.com/education/rss' },
    { name: 'The Guardian', rss: 'https://www.theguardian.com/culture/rss' },
    { name: 'The Guardian', rss: 'https://www.theguardian.com/lifeandstyle/rss' },
    // New Scientist 源站 CDN（Varnish 边缘）对 Node/undici 的 TLS 指纹返回 406，换 UA/Accept 均无效；
    // 改为经 Google News RSS 聚合（undici 可正常拉取），buildArticle 内对 news.google.com 链接走 jina 全文。
    { name: 'New Scientist', rss: 'https://news.google.com/rss/search?q=site:newscientist.com&hl=en-US&gl=US&ceid=US:en' },
    // Smithsonian 科普（undici 直连即可，无需特殊头，作为 New Scientist 的稳定补充）
    { name: 'Smithsonian', rss: 'https://www.smithsonianmag.com/rss/science-nature/' },
    { name: 'The Atlantic', rss: 'https://www.theatlantic.com/feed/science/' },
    { name: 'The Atlantic', rss: 'https://www.theatlantic.com/feed/technology/' },
    { name: 'TIME', rss: 'https://time.com/feed/' },
    // ---- 学生友好题源（2026-08 新增）：免费英语学习网站 ----
    { name: 'TIME for Kids', rss: 'https://www.timeforkids.com/feed/' },
    { name: 'Breaking News English', rss: 'https://breakingnewsenglish.com/rss.xml' },
  ];
})();
// 排除词：命中任一即视为金融/地缘政治/硬新闻，跳过（中英对照阅读以社会·教育·职场·大众科技为主）
const EXCLUDE_KW = ['war', 'ukraine', 'russia', 'putin', 'gaza', 'israel', 'palestine', 'iran', 'tariff', 'election', 'trump', 'biden', 'xi jinping', 'geopolit', 'stock market', 'fed ', 'interest rate', 'inflation rate', 'gdp ', 'sanction', 'military', 'troop', 'missile', 'nuclear weapon', 'ceasefire', 'invasion', 'occupation', 'summit', 'treaty', 'referendum', 'parliament', 'senate', 'congress', 'prime minister', 'president', 'sanctions', 'conflict', 'border'];
function topicOk(text) {
  const t = (text || '').toLowerCase();
  for (const kw of EXCLUDE_KW) if (t.includes(kw)) return false;
  return true;
}
// 本地日期 YYYY-MM-DD（与前端 D.todayStr() 一致，避免 UTC 时区差一天导致 AI 选题/外刊"今日"校验不匹配）
function todayISO() { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
// 文章去重键：优先归一化链接（去 query/hash、小写），否则取英文标题指纹。用于入库前去重，避免重复灌。
function articleKey(a) {
  const link = (a && a.link || '').trim().toLowerCase().replace(/[?#].*$/, '');
  if (link) return 'L:' + link;
  const t = (a && a.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  return 'T:' + t;
}
// 将新文章去重后并入库：已存在的（link/标题相同）跳过，仅真实新增置顶返回。返回新增篇数。
function mergeArticles(fresh) {
  if (!Array.isArray(fresh) || !fresh.length) return 0;
  const existing = new Set((journal.articles || []).map(articleKey));
  const add = fresh.filter((a) => { const k = articleKey(a); if (existing.has(k)) return false; existing.add(k); return true; });
  if (add.length) journal.articles = add.concat(journal.articles || []);
  return add.length;
}
const JOURNAL_FILE = path.join(__dirname, 'data', 'journal.json');
// 去除 RSS 摘要常见的尾部噪声链接文字（"Continue reading..." / "Read more" / 末尾来源链接行），
// 避免正文被截断片段污染。应用于新抓取与已落盘文章加载两处。
function cleanFeedNoise(s) {
  if (!s || typeof s !== 'string') return s;
  return s
    .replace(/\n?\s*Continue reading\.?\s*/gi, '\n')
    .replace(/\n?\s*Read more\.?\s*/gi, '\n')
    .replace(/\n?\s*Read more on [^\n]*/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function loadJournal() {
  try {
    const j = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf8'));
    const articles = (j.articles || []).map((a) => {
      if (!a) return a;
      const n = Object.assign({}, a);
      if (typeof n.text === 'string') n.text = cleanFeedNoise(n.text);
      if (Array.isArray(n.chapters)) n.chapters = n.chapters.map((ch) => {
        if (!ch) return ch;
        const nc = Object.assign({}, ch);
        if (typeof nc.en === 'string') nc.en = cleanFeedNoise(nc.en);
        if (Array.isArray(nc.paras)) nc.paras = nc.paras.map((p) => {
          if (!p || typeof p !== 'object') return p;
          const np = Object.assign({}, p);
          if (typeof np.en === 'string') np.en = cleanFeedNoise(np.en);
          return np;
        });
        return nc;
      });
      return n;
    });
    return { articles, lastDaily: j.lastDaily || '' };
  } catch (e) { return { articles: [], lastDaily: '' }; }
}
function saveJournal() { try { fs.mkdirSync(path.dirname(JOURNAL_FILE), { recursive: true }); fs.writeFileSync(JOURNAL_FILE, JSON.stringify(journal, null, 2)); } catch (e) { console.error('[reader] 保存外刊库失败', e.message); } }
let journal = loadJournal();

function parseRss(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const g = (tag) => { const mm = block.match(new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>', 'i')); return mm ? mm[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };
    const gc = (tag) => { const mm = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i')); return mm ? mm[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };
    const title = g('title'); const link = g('link'); const date = g('pubDate');
    const desc = gc('description'); const content = gc('content:encoded');
    if (title && link) items.push({ title, link, date, desc, content });
  }
  return items;
}
async function fetchRSS(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: BROWSER_HEADERS });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text();
}
// 翻译：优先用 OpenAI 兼容的大模型接口（默认 DeepSeek，国内可直连）；无密钥则仅英文（前端「仅英文」阅读）
async function translateParas(paras) {
  const key = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!key) return {};
  const base = (process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '');
  const model = process.env.LLM_MODEL || 'deepseek-chat';
  const prompt = 'You are a professional translator for a Chinese university student. Translate the following English paragraphs into fluent Simplified Chinese. Keep the exact same order and count. Respond with a JSON object of the form {"translations":["中文1","中文2",...]} and nothing else. Do not add notes or numbering.\n\n' + JSON.stringify(paras);
  try {
    const r = await fetch(base + '/chat/completions', {
      method: 'POST', signal: AbortSignal.timeout(25000),
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.3, response_format: { type: 'json_object' } }),
    });
    const j = await r.json().catch(() => null);
    const content = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!content) return {};
    let obj; try { obj = JSON.parse(content); } catch (e) { return {}; }
    const arr = Array.isArray(obj) ? obj : (obj.translations || []);
    const out = {};
    paras.forEach((p, i) => { if (arr[i]) out[p] = arr[i]; });
    return out;
  } catch (e) { console.warn('[reader] 翻译失败', e.message); return {}; }
}
// 把一段过长的文本（无自然分段）按“句子边界”切成若干可读小段：
// 绝不切断句子、绝不丢弃内容，只调整段落归并，以便后续按字数切分为多个【篇章】。
function splitSentencesToParas(longText, targetWords) {
  const sentences = (longText.match(/[^.!?]+[.!?]+(?:["')\]”’]+)?|\S[^.!?]*$/g) || [longText]).map((s) => s.trim()).filter(Boolean);
  const out = []; let cur = ''; let curW = 0;
  for (const s of sentences) {
    const w = s.split(/\s+/).filter(Boolean).length;
    if (cur && curW + w > targetWords) { out.push(cur); cur = ''; curW = 0; }
    cur = cur ? cur + ' ' + s : s; curW += w;
  }
  if (cur) out.push(cur);
  return out;
}
// 准备段落：保留已有 \n\n 自然分段；仅对“超过 400 词的超大段”按句子重分段（保证可切出多篇【篇章】）。
function prepareParas(text) {
  const raw = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 40);
  const out = [];
  for (const p of raw) {
    const w = p.split(/\s+/).filter(Boolean).length;
    if (w > 200) out.push(...splitSentencesToParas(p, 300));
    else out.push(p);
  }
  return out.filter((p) => p.length > 20);
}
// 按字数把段落聚合成「篇章」：目标每段约 targetWords 词，最少 minWords，避免在段落中间切断；
// 不固定 4 段，完全按原文字数自动划分；合并过短的尾章，保证上下文连贯。
function splitChapters(paras, targetWords, minWords) {
  targetWords = targetWords || 650; minWords = minWords || 250;
  const chapters = []; let cur = []; let curWords = 0;
  for (const p of paras) {
    const w = p.split(/\s+/).filter(Boolean).length;
    if (cur.length && curWords + w > targetWords) { chapters.push(cur); cur = []; curWords = 0; }
    cur.push(p); curWords += w;
  }
  if (cur.length) chapters.push(cur);
  if (chapters.length > 1) {
    const last = chapters[chapters.length - 1];
    const lastW = last.join(' ').split(/\s+/).filter(Boolean).length;
    if (lastW < minWords) { chapters.pop(); chapters[chapters.length - 1] = chapters[chapters.length - 1].concat(last); }
  }
  // 兜底：若整篇只生成 1 个篇章、但字数远超目标（如某段超长未被 prepareParas 切分），
  // 按句子边界强制再切为多个【篇章】，确保长文完整呈现 篇章1/篇章2…，绝不只显示一段。
  if (chapters.length === 1) {
    const totalW = chapters[0].join(' ').split(/\s+/).filter(Boolean).length;
    if (totalW > targetWords * 1.5) {
      const chunks = splitSentencesToParas(chapters[0].join('\n\n'), Math.floor(targetWords));
      const reCh = []; let rc = []; let rcW = 0;
      for (const p of chunks) {
        const w = p.split(/\s+/).filter(Boolean).length;
        if (rc.length && rcW + w > targetWords) { reCh.push(rc); rc = []; rcW = 0; }
        rc.push(p); rcW += w;
      }
      if (rc.length) reCh.push(rc);
      if (reCh.length > 1) {
        const lw = reCh[reCh.length - 1].join(' ').split(/\s+/).filter(Boolean).length;
        if (lw < minWords) { const last = reCh.pop(); reCh[reCh.length - 1] = reCh[reCh.length - 1].concat(last); }
        chapters.length = 0; reCh.forEach((c) => chapters.push(c));
      }
    }
  }
  return chapters.map((c, i) => ({ label: '【篇章' + (i + 1) + '】', paras: c }));
}
// 全文主旨概括（中文 3-4 句）；无 LLM 密钥返回空串（前端显示「仅英文」阅读，不报错）
async function summarize(text) {
  const key = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!key) return '';
  const base = (process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '');
  const model = process.env.LLM_MODEL || 'deepseek-chat';
  const prompt = 'Summarize the following English article in 3 to 4 concise Simplified Chinese sentences capturing its main point and key arguments. Output only the Chinese summary, no headings, no English.\n\n' + text.slice(0, 6000);
  try {
    const r = await fetch(base + '/chat/completions', { method: 'POST', signal: AbortSignal.timeout(25000), headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key }, body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 }) });
    const j = await r.json().catch(() => null);
    const c = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    return c ? c.trim() : '';
  } catch (e) { console.warn('[reader] 概括失败', e.message); return ''; }
}
// 把一条 RSS 条目构建成完整外刊对象：全文抓取 → 篇章切分 → 逐篇章中英对照 → 主旨概括
// 严格保留原文段落顺序/语序/全部内容；无密钥时篇章仅英文、summary 为空（优雅降级）。
// 从文章网页 HTML 直接抽取正文：优先 JSON-LD 的 articleBody（最干净完整），
// 回退到 <article> 标签内的 <p> 文本；不依赖第三方全文服务（r.jina.ai 仅作兜底）。
function extractArticleFromHtml(html) {
  if (!html || typeof html !== 'string') return '';
  // 1) JSON-LD 里的 articleBody（Guardian / 多数主流媒体都内嵌完整正文）
  try {
    const ld = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const m of ld) {
      const json = m.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        const obj = JSON.parse(json);
        const arr = Array.isArray(obj) ? obj : (obj['@graph'] ? (Array.isArray(obj['@graph']) ? obj['@graph'] : [obj['@graph']]) : [obj]);
        for (const o of arr) {
          const body = o && o.articleBody;
          if (body && typeof body === 'string' && body.length > 500) return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      } catch (e) {}
    }
  } catch (e) {}
  // 2) <article> 块内所有 <p>
  try {
    const art = html.match(/<article[\s\S]*?<\/article>/i);
    if (art) {
      const ps = art[0].match(/<p[\s\S]*?<\/p>/ig) || [];
      const txt = ps.map((p) => p.replace(/<[^>]+>/g, ' ')).join('\n\n');
      if (txt.length > 500) return txt.replace(/\s+/g, ' ').trim();
    }
  } catch (e) {}
  return '';
}

async function buildArticle(it) {
  // 先去掉 HTML 标签（换成换行），再只压缩“空格/制表符”而保留换行，以还原原文段落结构
  let text = (it.content || it.desc || '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // 只要有链接，优先用 r.jina.ai 抓取完整全文（RSS 的 description/content 常为摘要截断）；
  // 仅当 jina 返回的正文比 RSS 现有文本更长时才采用，绝不把已有的完整正文降级为摘要。
  if (it.link) {
    try {
      let full = await (async () => {
        // 聚合链接（Google News 等）：其页面不是原文，直接走 r.jina.ai 全文（jina 会跟随跳转抓取真实原文）
        if (/news\.google\.com|r\.jina\.ai/i.test(it.link)) {
          try {
            const j = await fetch('https://r.jina.ai/' + it.link, { signal: AbortSignal.timeout(12000) }).then((x) => x.text());
            if (j && j.length > 80 && !/<!DOCTYPE|<html|<head/i.test(j)) return j;
          } catch (e) {}
          return '';
        }
        // 优先：直接抓取文章网页，从 JSON-LD articleBody / <article> 抽正文（不依赖第三方）
        try {
          const html = await fetch(it.link, { signal: AbortSignal.timeout(9000), headers: BROWSER_HEADERS }).then((x) => x.text());
          const ex = extractArticleFromHtml(html);
          if (ex && ex.length > text.length) return ex;
        } catch (e) {}
        // 兜底：r.jina.ai 全文（其不可达/返回错误页时跳过）
        try {
          const j = await fetch('https://r.jina.ai/' + it.link, { signal: AbortSignal.timeout(9000) }).then((x) => x.text());
          if (j && j.length > text.length && !/<!DOCTYPE|<html|<head/i.test(j)) return j;
        } catch (e) {}
        return '';
      })();
      if (full && full.length > text.length) {
        text = full
          .replace(/ /g, ' ')
          .replace(/[ \t]+/g, ' ')
          .replace(/\r\n|\r/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }
    } catch (e) {}
  }
  text = cleanFeedNoise(text); // 去掉 RSS 摘要末尾的 Continue reading... / Read more 等噪声
  if (text.length < 200) return null;
  const paras = prepareParas(text);
  if (!paras.length) return null;
  const chapDefs = splitChapters(paras, parseInt(process.env.CHAPTER_TARGET_WORDS || '1000', 10), parseInt(process.env.CHAPTER_MIN_WORDS || '200', 10));
  const chapters = [];
  for (const ch of chapDefs) {
    const cnMap = await translateParas(ch.paras);
    // 逐段落保存 {en, cn} 配对，前端按段落中英交叉渲染时绝不错位（即使个别段落漏译也能对齐）
    const paraPairs = ch.paras.map((p) => ({ en: p, cn: cnMap[p] || '' }));
    chapters.push({ label: ch.label, paras: paraPairs, en: ch.paras.join('\n\n') });
  }
  const summary = await summarize(text);
  const date = it.date ? new Date(it.date).toISOString().slice(0, 10) : todayISO();
  return { title: it.title, source: it.source, link: it.link, date, fetchDate: todayISO(), category: '', summary, chapters, text: chapters.map((c) => c.en).join('\n\n'), translation: {} };
}
// 抓取最新 count 篇（去重：已入库的 link/title 跳过；话题过滤：跳过金融/地缘）
async function fetchLatestArticles(count, force) {
  const existing = force ? new Set() : new Set((journal.articles || []).map((a) => a.link || a.title));
  const candidates = [];
  for (const f of FEEDS) {
    try {
      const xml = await fetchRSS(f.rss);
      const items = parseRss(xml);
      for (const it of items) {
        if (existing.has(it.link || it.title)) continue;
        if (!topicOk(it.title + ' ' + (it.desc || ''))) continue;
        candidates.push({ source: f.name, title: it.title, link: it.link, date: it.date, desc: it.desc, content: it.content });
      }
    } catch (e) { console.warn('[reader] 源失败', f.name, e.message); }
  }
  candidates.sort((a, b) => (new Date(b.date || 0)) - (new Date(a.date || 0)));
  const picked = candidates.slice(0, count);
  const arts = [];
  for (const it of picked) {
    try { const art = await buildArticle(it); if (art) arts.push(art); } catch (e) { console.warn('[reader] 构建失败', it.title, e.message); }
  }
  // 海外源不足（无梯子/被墙/超时）→ 回退国内可直连英文源：中国日报双语（免梯子，中英对照）
  if (arts.length < count) {
    try {
      const cn = await fetchCnDailyArticles(count - arts.length + 2);
      const seen2 = new Set(arts.map((a) => a.link || a.title));
      for (const a of cn) {
        if (!a || seen2.has(a.link || a.title)) continue;
        seen2.add(a.link || a.title);
        arts.push(a);
      }
      if (arts.length > count) arts.length = count;
      console.log('[reader] 海外源不足，已用国内双语源补齐', arts.length, '篇');
    } catch (e) { console.warn('[reader] 国内双语补齐失败', e.message); }
  }
  return arts;
}
// 每日定时抓取：每天首次运行时拉取最新 5 篇外刊 + 3 篇国内双语入库（落盘持久化，重启不丢），每篇标记 fetchDate=当日
function checkDailyFetch() {
  const today = todayISO();
  if (journal.lastDaily === today) return;
  Promise.allSettled([fetchLatestArticles(5, true), fetchCnDailyArticles(3)]).then(([r1, r2]) => {
    let n = 0;
    if (r1.status === 'fulfilled') { const a = mergeArticles(r1.value || []); n += a; if (a) console.log('[reader] 今日实时入库', a, '篇'); else console.log('[reader] 外刊已是最新，无新增'); }
    if (r2.status === 'fulfilled') { const a = mergeArticles(r2.value || []); n += a; if (a) console.log('[cn-daily] 国内双语入库', a, '篇'); else console.log('[cn-daily] 双语已是最新，无新增'); }
    if (!n) console.log('[reader] 今日无新外刊可入库');
    journal.lastDaily = today; saveJournal();
  }).catch((e) => { console.warn('[reader] 每日抓取失败', e.message); journal.lastDaily = today; saveJournal(); });
}

// ---------- 国内双语自动爬取：中国日报双语新闻（language.chinadaily.com.cn，国内可达、HTML 非 SPA）----------
// 列表页提取文章链接 -> 详情页提取英文段落 + 中文译文段落 -> 中英配对入库
const CN_DAILY_LIST = 'https://language.chinadaily.com.cn/';
async function fetchCnDailyArticles(max) {
  const out = [];
  try {
    const html = await fetch(CN_DAILY_LIST, { signal: AbortSignal.timeout(12000), headers: BROWSER_HEADERS }).then((r) => r.text());
    const links = [];
    const re = /href="(\/\/language\.chinadaily\.com\.cn\/a\/\d{6}\/\d{2}\/[^"]+\.html)"/g;
    let m;
    while ((m = re.exec(html)) && links.length < 15) if (!links.includes(m[1])) links.push(m[1]);
    if (!links.length) { console.warn('[cn-daily] 列表页未找到文章链接'); return out; }
    for (const l of links) {
      if (out.length >= max) break;
      try { const art = await buildCnDailyArticle('https:' + l); if (art) out.push(art); }
      catch (e) { console.warn('[cn-daily] 构建失败', e.message); }
    }
  } catch (e) { console.warn('[cn-daily] 列表抓取失败', e.message); }
  return out;
}
async function buildCnDailyArticle(url) {
  const html = await fetch(url, { signal: AbortSignal.timeout(12000), headers: BROWSER_HEADERS }).then((r) => r.text());
  const tMatch = html.match(/<title>([^<]+)<\/title>/);
  let title = tMatch ? tMatch[1].replace(/_中国日报网.*|_China Daily.*/g, '').trim() : '';
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (h1) { const h = h1[1].replace(/<[^>]+>/g, '').trim(); if (h) title = h; }
  if (!title) return null;
  const ps = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) || [];
  const enParas = [], cnParas = [];
  for (const p of ps) {
    const t = p.replace(/<[^>]+>/g, '').replace(/&nbsp;|&amp;/g, ' ').trim();
    if (t.length < 40) continue;
    if (/[\u4e00-\u9fa5]{4,}/.test(t)) cnParas.push(t);
    else if (/[a-zA-Z]{3,}/.test(t)) enParas.push(t);
  }
  if (!enParas.length) return null;
  const text = enParas.join('\n\n');
  const map = {};
  if (cnParas.length) {
    if (cnParas.length >= Math.floor(enParas.length * 0.5)) {
      const n = Math.min(enParas.length, cnParas.length);
      for (let i = 0; i < n; i++) map[enParas[i]] = cnParas[i];
    } else {
      map[enParas[0]] = cnParas.join('\n\n'); // 译文集中在尾部
    }
  }
  const date = todayISO();
  return { title, source: '中国日报双语新闻', link: url, date, fetchDate: date, category: 'chinadaily',
    text, translation: map, chapters: [{ label: '全文', en: text, paras: enParas.map((p) => ({ en: p, cn: map[p] || '' })) }] };
}
setInterval(checkDailyFetch, 60 * 60 * 1000);
setTimeout(checkDailyFetch, 5000);

// ---------- 每日 AI 学习选题：后端实时抓取真实热门 AI 话题 ----------
// 数据源优先级（均免费、无需密钥；本地后端走代理可访问 GitHub）：
//   1) GitHub 搜索热门仓库（用户偏好方向：vibe coding / agent / skill(MCP) / 黑客 / 网络安全），按 star 排序取真实项目
//   2) Hacker News 热门故事（按 AI 关键词过滤，偏实战 / 产品）—— GitHub 不足时补充
//   3) arXiv 最新 AI 论文 —— 仍不足时补充
// 每日首次启动抓取并落盘 data/ai-topics.json（含 date）；同日刷新不重复抓；GET /api/ai/topics?refresh=1 强制重抓。
// 全部失败则回退内置种子，保证永不返回空列表。
const AI_TOPICS_FILE = path.join(__dirname, 'data', 'ai-topics.json');
const AI_TOPICS_SEED = [
  { title: 'Awesome-Hacking：黑客与安全研究资源大全（GitHub 精选）', tags: ['黑客', '网络安全', '资源集'], url: 'https://github.com/Hack-with-Github/Awesome-Hacking' },
  { title: 'awesome-pentest：渗透测试工具与方法集合（GitHub 精选）', tags: ['渗透测试', '网络安全', '工具集'], url: 'https://github.com/enaqx/awesome-pentest' },
  { title: 'Metasploit Framework：主流渗透测试 / 漏洞利用框架', tags: ['Metasploit', '渗透', 'Exploit'], url: 'https://github.com/rapid7/metasploit-framework' },
  { title: 'Vibe Coding：用自然语言让 AI 自动写程序（2025 热门范式）', tags: ['VibeCoding', 'AI编程'], url: 'https://github.com/filipecalegario/awesome-vibe-coding' },
  { title: 'Model Context Protocol (MCP)：让 AI 连接外部工具与数据', tags: ['MCP', '协议', 'Agent'], url: 'https://modelcontextprotocol.io' },
  { title: 'Context Engineering：用 CLAUDE.md 给 AI 编程助手完整上下文', tags: ['ContextEngineering', '提示词', '工程化'], url: 'https://github.com/coleam00/context-engineering-intro' },
  { title: 'CrewAI 多智能体协作框架实战：组建会分工的 AI 团队', tags: ['CrewAI', '多智能体', '协作'], url: 'https://github.com/crewAIInc/crewAI' },
  { title: 'LangGraph：用图状态机构建可控、可循环的 Agent 工作流', tags: ['LangGraph', 'Agent', '工作流'], url: 'https://github.com/langchain-ai/langgraph' },
  { title: 'RAG 检索增强生成实战：向量库 + Embeddings 搭建知识问答', tags: ['RAG', '向量库', 'LLM应用'], url: 'https://github.com/langchain-ai/langchain' },
  { title: 'LLMs from Scratch：从零构建大语言模型', tags: ['LLM', 'Transformer', '从零构建'], url: 'https://github.com/rasbt/LLMs-from-scratch' },
  { title: 'Hands-On Large Language Models 大型语言模型实战指南', tags: ['LLM', '实战', 'Python'], url: 'https://github.com/HandsOnLLM/Hands-On-Large-Language-Models' },
  { title: 'Awesome AI Applications：100+ AI 应用开发实例', tags: ['AI应用', 'RAG', 'CrewAI'], url: 'https://github.com/Arindam200/awesome-ai-apps' },
  { title: 'Agents Engineering Mastery：企业级 AI 智能体工程实践', tags: ['Agent工程', 'MCP', 'AutoGen'], url: 'https://github.com/ed-donner/agents' },
  { title: 'Claude Code 设置与命令集：把规格驱动开发带入 Vibe Coding', tags: ['ClaudeCode', '规格驱动', 'Agent'], url: 'https://github.com/feiskyer/claude-code-settings' },
  { title: 'Made With ML：生产级机器学习系统工程', tags: ['MLOps', 'Ray', '生产部署'], url: 'https://github.com/GokuMohandas/Made-With-ML' },
  { title: 'Firecrawl：用 AI 把任意网页转成结构化数据（搜索/抓取 API）', tags: ['爬虫', '数据采集', 'API'], url: 'https://github.com/firecrawl/firecrawl' },
  { title: 'Scrapy：Python 高性能网页爬虫与数据采集框架', tags: ['爬虫', 'Python', 'Scraping'], url: 'https://github.com/scrapy/scrapy' },
  { title: 'MediaCrawler：小红书/抖音/B站多平台内容爬虫（含评论）', tags: ['爬虫', '社交媒体', '数据采集'], url: 'https://github.com/NaiboWang/EasySpider' },
  { title: 'build-your-own-x：通过复刻经典项目掌握编程（GitHub 高星）', tags: ['GitHub热门', '练手项目', '全栈'], url: 'https://github.com/codecrafters-io/build-your-own-x' },
  { title: 'awesome：各类优质资源清单合集（GitHub 最高星仓库之一）', tags: ['GitHub热门', '资源集', '清单'], url: 'https://github.com/sindresorhus/awesome' },
];
function loadAITopics() {
  try { const j = JSON.parse(fs.readFileSync(AI_TOPICS_FILE, 'utf8')); return { date: j.date || '', topics: Array.isArray(j.topics) ? j.topics : [] }; }
  catch (e) { return { date: '', topics: [] }; }
}
function saveAITopics(obj) { try { fs.mkdirSync(path.dirname(AI_TOPICS_FILE), { recursive: true }); fs.writeFileSync(AI_TOPICS_FILE, JSON.stringify(obj, null, 2)); } catch (e) { console.error('[ai-topics] 保存失败', e.message); } }
let aiTopics = loadAITopics();

const HN_AI_KW = ['ai', 'llm', 'gpt', 'openai', 'anthropic', 'claude', 'gemini', 'deepseek', 'llama', 'chatgpt', 'machine learning', 'neural', 'diffusion', 'transformer', 'agent', 'rag', 'mcp', 'fine-tun', 'embedding', 'prompt', 'copilot', 'mistral', 'qwen', 'grok', 'vibe coding'];
async function fetchText(url, ms) {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms || 9000), headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text();
}
// GitHub 搜索热门仓库：按用户偏好方向取真实项目（vibe coding / agent / skill(MCP) / 黑客 / 网络安全 / 爬虫 / GitHub全局热门）
// 返回「分桶」结果（每个方向一桶），由 buildAITopics 轮转混合，保证 6 类主题都出现
async function fetchGitHubTopics() {
  const queries = [
    { q: 'vibe+coding', spec: ['VibeCoding', 'AI编程'] },
    { q: 'ai+agent+framework', spec: ['Agent', 'AI框架'] },
    { q: 'mcp+server', spec: ['MCP', 'Skill', '工具连接'] },
    { q: 'cybersecurity+pentest+stars:%3E500', spec: ['网络安全', '黑客', '渗透'] },
    { q: 'crawler+OR+web+scraping+stars:%3E200', spec: ['爬虫', '数据采集', 'Scraping'] },
    { q: 'created:%3E2025-06-01+stars:%3E2000', spec: ['GitHub热门', '高星仓库', '趋势'] },
  ];
  const buckets = [];
  await Promise.all(queries.map(async (spec) => {
    const items = [];
    try {
      const u = 'https://api.github.com/search/repositories?q=' + spec.q + '&sort=stars&order=desc&per_page=12';
      const json = JSON.parse(await fetchText(u, 12000));
      for (const it of (json.items || [])) {
        const key = (it.full_name || '').toLowerCase();
        const desc = (it.description || '').replace(/\s+/g, ' ').trim();
        const title = desc ? (it.full_name + ' — ' + (desc.length > 90 ? desc.slice(0, 90) + '…' : desc)) : it.full_name;
        const tags = ['GitHub'].concat((it.topics || []).slice(0, 3)).concat(spec.spec);
        items.push({ _k: key, title, url: it.html_url || '', tags: [...new Set(tags)].slice(0, 5) });
      }
    } catch (e) { /* 单查询失败忽略，其他查询继续 */ }
    buckets.push(items);
  }));
  return buckets;
}
async function fetchArxivTopics() {
  const url = 'http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=20';
  const xml = await fetchText(url, 12000);
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
  const out = [];
  for (const e of entries) {
    const tm = e.match(/<title>([\s\S]*?)<\/title>/);
    const im = e.match(/<id>([\s\S]*?)<\/id>/);
    if (!tm) continue;
    const title = tm[1].replace(/\s+/g, ' ').trim();
    if (title.length < 8) continue;
    out.push({ title: title, url: im ? im[1].trim() : '', tags: ['arXiv', 'AI论文'] });
  }
  return out;
}
async function fetchHNTopics() {
  const idsJson = await fetchText('https://hacker-news.firebaseio.com/v0/topstories.json', 9000);
  const ids = JSON.parse(idsJson).slice(0, 30);
  const out = [];
  await Promise.all(ids.map(async (id) => {
    try {
      const item = JSON.parse(await fetchText('https://hacker-news.firebaseio.com/v0/item/' + id + '.json', 6000));
      if (!item || item.type !== 'story' || !item.title) return;
      const t = item.title.toLowerCase();
      if (!HN_AI_KW.some((k) => t.includes(k))) return;
      out.push({ title: item.title.trim(), url: item.url || ('https://news.ycombinator.com/item?id=' + id), tags: ['HackerNews', 'AI热点'] });
    } catch (e) { /* 单条失败忽略 */ }
  }));
  return out;
}
// ---------- 国内直连 AI 热点源（免梯子：VPN 不可用时的降级源）----------
const CN_AI_KW = /AI|人工智能|大模型|GPT|智能体|模型|算法|机器人|自动驾驶|芯片|OpenAI|ChatGPT|DeepSeek|文心|豆包|通义|Gemini|Claude|神经网络|深度学习|Agent|算力|AIGC|机器学习|编程/;
// 量子位（AI 原生科技媒体，国内直连，列表页 h2/h3 标题解析）
async function fetchQbitai() {
  const h = await fetchText('https://www.qbitai.com/', 10000);
  const out = [];
  const blocks = h.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g) || [];
  const seen = new Set();
  for (const blk of blocks) {
    const am = blk.match(/href="([^"]+)"/);
    const title = blk.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    if (title.length < 8 || seen.has(title)) continue;
    seen.add(title);
    out.push({ title, url: am ? (am[1].startsWith('http') ? am[1] : 'https://www.qbitai.com' + am[1]) : 'https://www.qbitai.com/', tags: ['量子位', 'AI'] });
    if (out.length >= 20) break;
  }
  return out;
}
// 今日头条热榜（JSON，国内直连；按 AI 关键词过滤）
async function fetchToutiaoHot() {
  const t = await fetchText('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc', 10000);
  const j = JSON.parse(t);
  const out = [];
  for (const it of (j.data || [])) {
    const title = it.Title || '';
    if (!title || !CN_AI_KW.test(title)) continue;
    out.push({ title: title.trim(), url: it.Url || 'https://www.toutiao.com/', tags: ['头条热榜', 'AI'] });
  }
  return out;
}
// 腾讯新闻热榜（JSON，国内直连；按 AI 关键词过滤）
async function fetchTencentHot() {
  const t = await fetchText('https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=50', 10000);
  const j = JSON.parse(t);
  const out = [];
  for (const idl of (j.idlist || [])) {
    for (const it of (idl.newslist || [])) {
      const title = it.title || '';
      if (!title || !CN_AI_KW.test(title)) continue;
      out.push({ title: title.trim(), url: it.url || 'https://news.qq.com/', tags: ['腾讯热榜', 'AI'] });
    }
  }
  return out;
}
// 国内直连聚合（量子位为主，不足补头条/腾讯热榜）
async function fetchAIDomestic() {
  let out = [];
  try { out = await fetchQbitai(); } catch (e) { console.warn('[ai-topics] 量子位失败', e.message); }
  if (out.length < 8) {
    try {
      const tt = await fetchToutiaoHot();
      const seen = new Set(out.map((x) => x.title));
      for (const x of tt) if (!seen.has(x.title)) out.push(x);
    } catch (e) { console.warn('[ai-topics] 头条热榜失败', e.message); }
  }
  if (out.length < 8) {
    try {
      const tx = await fetchTencentHot();
      const seen = new Set(out.map((x) => x.title));
      for (const x of tx) if (!seen.has(x.title)) out.push(x);
    } catch (e) { console.warn('[ai-topics] 腾讯热榜失败', e.message); }
  }
  return out;
}
async function buildAITopics() {
  const collected = [];
  const seen = new Set();
  const pushUnique = (arr) => { for (const x of (arr || [])) { const k = (x.title || '').toLowerCase().trim(); if (k && !seen.has(k)) { seen.add(k); collected.push(x); } } };
  // 1) 优先 GitHub 真实热门仓库（vibe coding / agent / skill(MCP) / 黑客安全 / 爬虫 / GitHub全局热门）
  //    6 个方向分桶后「轮转取样」，每桶 2 条 → 12 条均衡覆盖各类主题，不被高星仓库淹没
  const ghBuckets = await fetchGitHubTopics().catch(() => []);
  const perBucket = 2;
  for (let round = 0; round < perBucket; round++) {
    for (const bucket of ghBuckets) {
      const it = bucket[round];
      if (!it || seen.has(it._k)) continue;
      seen.add(it._k);
      const { _k, ...rest } = it;
      collected.push(rest);
    }
  }
  // 2) GitHub 不足时补充 Hacker News 热点（仍按 AI 关键词过滤）
  if (collected.length < 8) {
    const hn = await fetchHNTopics().catch(() => []);
    pushUnique(hn);
  }
  // 3) 仍不足时补充 arXiv 最新论文
  if (collected.length < 8) {
    const ax = await fetchArxivTopics().catch(() => []);
    pushUnique(ax);
  }
  let topics = collected.slice(0, 12);
  let sourceTag = 'GitHub/海外';
  // 4) 海外源全部失败（无梯子/被墙）→ 回退国内直连源（知乎热榜 / IT之家 AI，免梯子）
  if (!topics.length) {
    const dom = await fetchAIDomestic().catch(() => []);
    if (dom.length) { topics = dom.slice(0, 12); sourceTag = '国内直连'; }
  }
  if (!topics.length) topics = AI_TOPICS_SEED.slice(0, 12); // 全部失败则回退内置种子
  const obj = { date: todayISO(), source: sourceTag, topics, generatedAt: Date.now() };
  aiTopics = obj;
  saveAITopics(obj);
  console.log('[ai-topics] 今日选题生成', topics.length, '条（' + sourceTag + '，海外命中', collected.length, '条）');
  return obj;
}
function checkDailyAITopics() {
  if (aiTopics.date === todayISO() && aiTopics.topics.length) return;
  buildAITopics().catch((e) => console.warn('[ai-topics] 生成失败', e.message));
}
setInterval(checkDailyAITopics, 60 * 60 * 1000);
setTimeout(checkDailyAITopics, 5000);

// ---------- 路由 ----------
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'OPTIONS') { send(res, 204, ''); return; }
  if (pathname.startsWith('/caldav')) { handleCalDAV(req, res, pathname, parsed); return; }
  if (pathname === '/health') { send(res, 200, JSON.stringify({ ok: true }), 'application/json'); return; }

  // TTS 兜底（前端 WebView 无 speechSynthesis 时调用）。代理 Google translate_tts
  // 走海外（Railway 节点不受 GFW 影响），返回 audio/mpeg 给前端用 <audio> 播放。
  if (pathname === '/api/tts' && req.method === 'GET') {
    const text = String(parsed.query.text || '').slice(0, 200);
    const lang = String(parsed.query.lang || 'en').slice(0, 8).replace(/[^a-zA-Z-]/g, '') || 'en';
    if (!text) { send(res, 400, JSON.stringify({ ok: false, error: 'text required' }), 'application/json'); return; }
    try {
      const u = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + encodeURIComponent(lang) + '&q=' + encodeURIComponent(text);
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
      if (!r.ok) { send(res, 502, JSON.stringify({ ok: false, error: 'upstream ' + r.status }), 'application/json'); return; }
      const ct = r.headers.get('content-type') || 'audio/mpeg';
      const ab = await r.arrayBuffer();
      res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' });
      res.end(Buffer.from(ab));
    } catch (e) { send(res, 500, JSON.stringify({ ok: false, error: e.message }), 'application/json'); }
    return;
  }

  // 接收前端同步的 DDL 清单 + 提醒配置 + 推送配置
  if (pathname === '/api/ddl/register' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req));
      const clientId = body.clientId;
      if (!clientId) { send(res, 400, JSON.stringify({ ok: false, error: 'clientId required' }), 'application/json'); return; }
      const existing = regs[clientId] || {};
      regs[clientId] = {
        ddls: body.ddls || [],
        tasks: body.tasks || [],
        reminders: body.reminders && body.reminders.length ? body.reminders : [1440, 720, 60],
        push: body.push || existing.push || null,
        pushedLog: existing.pushedLog || {},
        updatedAt: Date.now(),
      };
      saveRegs(regs);
      send(res, 200, JSON.stringify({ ok: true, count: regs[clientId].ddls.length }), 'application/json');
    } catch (e) { send(res, 400, JSON.stringify({ ok: false, error: e.message }), 'application/json'); }
    return;
  }

  // 动态日历 feed：手机日历 App 订阅此链接
  if (pathname === '/api/ddl/calendar.ics') {
    const clientId = parsed.query.clientId;
    const reg = clientId && regs[clientId];
    const ics = reg ? buildICS(reg.ddls, reg.tasks, reg.reminders) : 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CollegeWorkbench//DDL//CN\r\nCALSCALE:GREGORIAN\r\nEND:VCALENDAR';
    res.writeHead(200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="ddl.ics"',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    res.end(ics);
    return;
  }

  // 测试推送（前端直接调，验证 token 是否有效）
  if (pathname === '/api/push/test' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req));
      const r = await sendPush(body.service || 'serverchan', body.token, '🔔 测试推送', '大学生AI万能工作台 · 微信推送绑定成功！\n\n之后 DDL 到期前会自动推送提醒到此微信。', body.uid);
      send(res, 200, JSON.stringify(r), 'application/json');
    } catch (e) { send(res, 400, JSON.stringify({ ok: false, error: e.message }), 'application/json'); }
    return;
  }

  // 直接推送（前端在无后端 cron 时，页面打开期间主动推送）
  if (pathname === '/api/push/send' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req));
      const r = await sendPush(body.service || 'serverchan', body.token, body.title || '提醒', body.content || '', body.uid);
      send(res, 200, JSON.stringify(r), 'application/json');
    } catch (e) { send(res, 400, JSON.stringify({ ok: false, error: e.message }), 'application/json'); }
    return;
  }

  // 外刊阅读：返回已持久化的实时外刊库（前端自动同步 / 「实时外刊」按钮从此拉取）
  if (pathname === '/api/reader/list' && req.method === 'GET') {
    const today = todayISO();
    const arts = journal.articles || [];
    const todayArticles = arts.filter((a) => (a.fetchDate || '') === today);
    send(res, 200, JSON.stringify({ ok: true, articles: arts, todayArticles, todayCount: todayArticles.length, lastDaily: journal.lastDaily || null }), 'application/json');
    return;
  }
  // AI 活动：返回仓库维护的可报名活动清单（assets/ai-events.json，前端「实时刷新」时拉取合并）
  if (pathname === '/api/ai/events' && req.method === 'GET') {
    try {
      const f = path.join(__dirname, 'assets', 'ai-events.json');
      if (fs.existsSync(f)) {
        const arr = JSON.parse(fs.readFileSync(f, 'utf8'));
        send(res, 200, JSON.stringify({ date: todayISO(), events: Array.isArray(arr) ? arr : [] }), 'application/json');
        return;
      }
    } catch (e) { /* 文件缺失/损坏则返回空，前端回退本地种子 */ }
    send(res, 200, JSON.stringify({ date: todayISO(), events: [] }), 'application/json');
    return;
  }
  // 每日 AI 学习选题：后端实时抓取真实热门 AI 话题（?refresh=1 强制重新抓取一批）
  if (pathname === '/api/ai/topics' && req.method === 'GET') {
    const refresh = parsed.query.refresh === '1';
    if (refresh) {
      try { const obj = await buildAITopics(); send(res, 200, JSON.stringify(obj), 'application/json'); return; }
      catch (e) { /* 抓取失败则回退已缓存的当日选题 */ }
    }
    if (!aiTopics.topics.length) { try { await buildAITopics(); } catch (e) {} }
    // 用户筛选关键词（逗号分隔）：标题/标签包含任一即保留；无匹配回退全部
    const kwRaw = parsed.query.keywords || '';
    const kws = kwRaw.split(/[,，;；\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    let payload = aiTopics;
    if (kws.length && aiTopics.topics && aiTopics.topics.length) {
      const hit = aiTopics.topics.filter((t) => {
        const text = ((t.title || '') + ' ' + ((t.tags || []).join(' '))).toLowerCase();
        return kws.some((k) => text.includes(k));
      });
      if (hit.length) payload = Object.assign({}, aiTopics, { topics: hit });
    }
    send(res, 200, JSON.stringify(payload), 'application/json');
    return;
  }
  // 手动触发立即抓取入库（「实时外刊」按钮的强制刷新）：外刊 2 篇 + 国内双语 2 篇
  if (pathname === '/api/reader/fetch' && req.method === 'POST') {
    try {
      const [r1, r2] = await Promise.allSettled([fetchLatestArticles(2, true), fetchCnDailyArticles(2)]);
      const arts = [];
      if (r1.status === 'fulfilled') arts.push.apply(arts, r1.value || []);
      if (r2.status === 'fulfilled') arts.push.apply(arts, r2.value || []);
      let added = 0, cnAdded = 0;
      if (arts.length) {
        const existing = new Set((journal.articles || []).map(articleKey));
        const add = arts.filter((a) => {
          const k = articleKey(a);
          if (existing.has(k)) return false;
          if ((a.source || '').includes('中国日报')) cnAdded++;
          existing.add(k);
          return true;
        });
        if (add.length) journal.articles = add.concat(journal.articles || []);
        added = add.length;
        journal.lastDaily = todayISO(); saveJournal();
        if (cnAdded > 0) console.log('[cn-daily] 实时双语入库', cnAdded, '篇');
        else console.log('[cn-daily] 双语已是最新，无新增');
      }
      send(res, 200, JSON.stringify({ ok: true, added: added, articles: arts }), 'application/json');
    } catch (e) { send(res, 500, JSON.stringify({ ok: false, error: e.message }), 'application/json'); }
    return;
  }
  // 单篇外刊：返回库内最新一篇；force=1 时立即再抓 1 篇入库并返回（兼容原「联网获取」按钮）
  if (pathname === '/api/reader/article' && req.method === 'GET') {
    const force = parsed.query.force === '1';
    try {
      let art = (journal.articles && journal.articles[0]) || null;
      if (force || !art) {
        const arr = await fetchLatestArticles(1, true);
        if (arr.length) { const seen = new Set(arr.map((a) => a.link || a.title)); journal.articles = arr.concat((journal.articles || []).filter((a) => !seen.has(a.link || a.title))); journal.lastDaily = todayISO(); saveJournal(); art = arr[0]; }
      }
      if (!art) { send(res, 502, JSON.stringify({ ok: false, error: '暂无外刊（后端网络可能不可达境外源）' }), 'application/json'); return; }
      send(res, 200, JSON.stringify(art), 'application/json');
    } catch (e) { send(res, 502, JSON.stringify({ ok: false, error: e.message }), 'application/json'); }
    return;
  }

  // 静态文件托管（单页应用）；优先 dist/ 构建产物，回退根目录源码；禁止直接访问后端数据目录 /data/
  let file = pathname === '/' ? '/index.html' : pathname;
  const distFile = path.join(__dirname, 'dist', file);
  const rootFile = path.join(__dirname, file);
  const target = fs.existsSync(distFile) ? distFile : rootFile;
  if (target.indexOf(path.join(__dirname, 'data')) === 0) { send(res, 404, 'Not Found', 'text/plain'); return; }
  fs.readFile(target, (err, data) => {
    if (err) {
      const fallback = fs.existsSync(path.join(__dirname, 'dist', 'index.html'))
        ? path.join(__dirname, 'dist', 'index.html')
        : path.join(__dirname, 'index.html');
      fs.readFile(fallback, (e2, idx) => {
        if (e2) send(res, 404, 'Not Found', 'text/plain');
        else send(res, 200, idx, 'text/html; charset=utf-8');
      });
      return;
    }
    const ext = path.extname(target).toLowerCase();
    send(res, 200, data, MIME[ext] || 'application/octet-stream');
  });
});

// 仅列出真实局域网私有 IP（过滤虚拟网卡与异常地址），供手机填写
function getLanIps() {
  const ifaces = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(ifaces)) {
    for (const ni of (ifaces[name] || [])) {
      if (ni.family !== 'IPv4' || ni.internal) continue;
      const ip = ni.address;
      const priv = /^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\./.test(ip);
      if (!priv) continue; // 跳过公网/异常地址（如 2.0.0.1）
      const virt = /^192\.168\.(56|122|99|187|211|137|0)\./.test(ip) || /vEthernet|VirtualBox|VMware|Hyper-V|WSL|Loopback/i.test(name);
      out.push({ ip: ip, virt: virt, name: name });
    }
  }
  return out;
}

server.listen(PORT, () => {
  console.log('工作台后端启动：http://localhost:' + PORT);
  console.log('日历订阅：http://localhost:' + PORT + '/api/ddl/calendar.ics?clientId=<clientId>');
  console.log('微信推送 cron：每 30 分钟自动扫描 DDL 并推送');
  const lan = getLanIps();
  if (lan.length) {
    const real = lan.filter((x) => !x.virt);
    console.log('');
    console.log('📱 手机/局域网访问地址（手机须与电脑连同一 WiFi，把下面地址填到 App 的「后端地址」）：');
    (real.length ? real : lan).forEach(function (x, i) {
      const kind = x.virt ? '虚拟网卡' : (/WLAN|Wi-?Fi|Wireless|无线/i.test(x.name) ? 'WiFi' : '以太网');
      console.log('   http://' + x.ip + ':' + PORT + '   [' + kind + ']' + (x.virt ? '（一般不用）' : (i === 0 ? '   <-- 推荐' : '')));
    });
    console.log('   💡 若手机连不上：① 确认手机与电脑连同一 WiFi；② 电脑 IP 变化后需把 App 地址改成上面最新 IP；③ 代理开关不影响局域网访问。');
  } else {
    console.log('（未检测到局域网 IP，手机请填电脑的 IPv4 地址 + :3000）');
  }
});
