/* ============================================================
   大学生AI万能工作台 · 轻量后端（零依赖，原生 Node）
   功能：
   1. 托管静态前端
   2. 接收前端同步的 DDL 清单
   3. 动态生成可订阅的 iCalendar(.ics) 日历 feed
   4. 微信推送（PushPlus / Server酱）— 定时 cron 自动推送 DDL 提醒
   ============================================================ */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
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
function buildICS(ddls, reminders) {
  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//CollegeWorkbench//DDL//CN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
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
    (reminders && reminders.length ? reminders : [1440, 720, 60]).forEach((m) => {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push('DESCRIPTION:' + icsEscape('⏰ 即将到期：' + (d.name || '未命名')));
      lines.push('TRIGGER:-PT' + m + 'M');
      lines.push('END:VALARM');
    });
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ---------- 微信推送（PushPlus / Server酱）----------
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

async function sendPush(service, token, title, content) {
  if (!token) return { ok: false, error: '缺少 token' };
  try {
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
          sendPush(reg.push.service, reg.push.token, title, content).then((r) => {
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
        sendPush(reg.push.service, reg.push.token, title, content).then(() => {});
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

// ---------- 外刊阅读：服务端抓取最新英文外刊（浏览器不再直连被墙代理）----------
const RSS_SOURCES = [
  { name: 'BBC News', rss: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'NPR News', rss: 'https://feeds.npr.org/1001/rss.xml' },
  { name: 'The Guardian', rss: 'https://www.theguardian.com/world/rss' },
];
let _lastArticle = null;
let _lastFetch = 0;

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
  const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return await r.text();
}
async function translateParas(paras) {
  const out = {};
  for (const p of paras) {
    try {
      const u = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(p.slice(0, 450)) + '&langpair=en|zh-CN';
      const j = await fetch(u, { signal: AbortSignal.timeout(5000) }).then((x) => x.json()).catch(() => null);
      if (j && j.responseData && j.responseData.translatedText) {
        const t = j.responseData.translatedText;
        if (!/LIMIT EXCEEDED|quota|MYMEMORY/i.test(t)) out[p] = t;
      }
    } catch (e) {}
  }
  return out;
}
async function fetchLatestArticle(force) {
  // 缓存 6 小时（同一后端只抓一次），force 时忽略
  if (!force && _lastArticle && Date.now() - _lastFetch < 6 * 3600 * 1000) return _lastArticle;
  for (const src of RSS_SOURCES) {
    try {
      const xml = await fetchRSS(src.rss);
      const items = parseRss(xml);
      if (!items.length) continue;
      items.sort((a, b) => (new Date(b.date || 0)) - (new Date(a.date || 0)));
      for (const it of items.slice(0, 5)) {
        let text = (it.content || it.desc || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text.length < 400 && it.link) {
          try {
            const full = await fetch('https://r.jina.ai/' + it.link, { signal: AbortSignal.timeout(8000) }).then((x) => x.text());
            if (full && full.length > 400) text = full.replace(/\s+/g, ' ').trim();
          } catch (e) {}
        }
        if (text.length > 300) {
          const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 40);
          const translation = await translateParas(paras.slice(0, 8));
          const art = { title: it.title, source: src.name, text: paras.slice(0, 12).join('\n\n'), translation, link: it.link };
          _lastArticle = art; _lastFetch = Date.now();
          return art;
        }
      }
    } catch (e) { console.warn('[reader] 源失败', src.name, e.message); }
  }
  return null;
}

// ---------- 路由 ----------
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'OPTIONS') { send(res, 204, ''); return; }
  if (pathname === '/health') { send(res, 200, JSON.stringify({ ok: true }), 'application/json'); return; }

  // 接收前端同步的 DDL 清单 + 提醒配置 + 推送配置
  if (pathname === '/api/ddl/register' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req));
      const clientId = body.clientId;
      if (!clientId) { send(res, 400, JSON.stringify({ ok: false, error: 'clientId required' }), 'application/json'); return; }
      const existing = regs[clientId] || {};
      regs[clientId] = {
        ddls: body.ddls || [],
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
    const ics = reg ? buildICS(reg.ddls, reg.reminders) : 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CollegeWorkbench//DDL//CN\r\nCALSCALE:GREGORIAN\r\nEND:VCALENDAR';
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
      const r = await sendPush(body.service || 'pushplus', body.token, '🔔 测试推送', '大学生AI万能工作台 · 微信推送绑定成功！\n\n之后 DDL 到期前会自动推送提醒到此微信。');
      send(res, 200, JSON.stringify(r), 'application/json');
    } catch (e) { send(res, 400, JSON.stringify({ ok: false, error: e.message }), 'application/json'); }
    return;
  }

  // 直接推送（前端在无后端 cron 时，页面打开期间主动推送）
  if (pathname === '/api/push/send' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req));
      const r = await sendPush(body.service || 'pushplus', body.token, body.title || '提醒', body.content || '');
      send(res, 200, JSON.stringify(r), 'application/json');
    } catch (e) { send(res, 400, JSON.stringify({ ok: false, error: e.message }), 'application/json'); }
    return;
  }

  // 外刊阅读：服务端抓取最新英文外刊（浏览器只请求本后端域名，不直连被墙代理）
  // 若后端所在网络无法访问 BBC 等境外源（如国内服务器），返回 502，前端自动回退离线文章
  if (pathname === '/api/reader/article' && req.method === 'GET') {
    try {
      const force = parsed.query.force === '1';
      const article = await fetchLatestArticle(force);
      if (!article) { send(res, 502, JSON.stringify({ ok: false, error: '无法抓取外刊（后端网络可能不可达境外源）' }), 'application/json'); return; }
      send(res, 200, JSON.stringify(article), 'application/json');
    } catch (e) { send(res, 502, JSON.stringify({ ok: false, error: e.message }), 'application/json'); }
    return;
  }

  // 静态文件托管（单页应用）
  let file = pathname === '/' ? '/index.html' : pathname;
  file = path.join(__dirname, file);
  fs.readFile(file, (err, data) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'index.html'), (e2, idx) => {
        if (e2) send(res, 404, 'Not Found', 'text/plain');
        else send(res, 200, idx, 'text/html; charset=utf-8');
      });
      return;
    }
    const ext = path.extname(file).toLowerCase();
    send(res, 200, data, MIME[ext] || 'application/octet-stream');
  });
});

server.listen(PORT, () => {
  console.log('工作台后端启动：http://localhost:' + PORT);
  console.log('日历订阅：http://localhost:' + PORT + '/api/ddl/calendar.ics?clientId=<clientId>');
  console.log('微信推送 cron：每 30 分钟自动扫描 DDL 并推送');
});
