// Node 下载 GitHub Actions artifact：同步落盘 + Range 断点续传 + 停滞探测
const https = require('https');
const fs = require('fs');

const TOKEN = process.env.GITHUB_TOKEN;
const API = 'https://api.github.com/repos/zhuliliui/college-workbench/actions/artifacts/8895970827/zip';
const OUT = 'artifact.zip';
const EXPECT = 12308840;

function getRedirect() {
  return new Promise((resolve, reject) => {
    const u = new URL(API);
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
      headers: { Authorization: 'Bearer ' + TOKEN, 'User-Agent': 'node' },
      rejectUnauthorized: false,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); resolve(res.headers.location); }
      else { res.resume(); reject(new Error('unexpected status ' + res.statusCode)); }
    });
    req.on('error', reject);
    req.end();
  });
}

function downloadBlob(loc, start) {
  return new Promise((resolve, reject) => {
    const u = new URL(loc);
    const headers = { 'User-Agent': 'node' };
    if (start > 0) headers['Range'] = 'bytes=' + start + '-';
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
      headers, rejectUnauthorized: false, timeout: 20000,
    }, (res) => {
      const code = res.statusCode;
      if (code !== 200 && code !== 206) { res.resume(); return reject(new Error('blob status ' + code)); }
      const fd = fs.openSync(OUT, (start > 0 && code === 206) ? 'a' : 'w');
      let pos = start;
      let last = Date.now();
      res.on('data', (c) => { fs.writeSync(fd, c, 0, c.length, pos); pos += c.length; last = Date.now(); process.stdout.write('\r' + pos + ' / ' + EXPECT); });
      res.on('end', () => { fs.closeSync(fd); resolve(pos); });
      res.on('error', (e) => { try { fs.closeSync(fd); } catch (_) {} reject(e); });
      const timer = setInterval(() => {
        if (Date.now() - last > 15000) { clearInterval(timer); try { fs.closeSync(fd); } catch (_) {} req.destroy(); reject(new Error('stall at ' + pos)); }
      }, 3000);
      res.on('end', () => clearInterval(timer));
    });
    req.on('timeout', () => req.destroy(new Error('req timeout')));
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  let loc;
  for (let i = 0; i < 5; i++) { try { loc = await getRedirect(); break; } catch (e) { if (i === 4) throw e; console.log('getRedirect retry', e.message); } }
  let pos = fs.existsSync(OUT) ? fs.statSync(OUT).size : 0;
  if (pos >= EXPECT) { console.log('ALREADY_DONE'); return; }
  for (let i = 0; i < 60; i++) {
    try {
      pos = await downloadBlob(loc, pos);
      console.log('\nprogress', pos, '/', EXPECT);
      if (pos >= EXPECT) { console.log('DONE'); return; }
    } catch (e) {
      console.log('\nretry', i, e.message, 'pos=', pos);
      await new Promise((r) => setTimeout(r, 1500));
      pos = fs.existsSync(OUT) ? fs.statSync(OUT).size : 0;
    }
  }
  const size = fs.existsSync(OUT) ? fs.statSync(OUT).size : 0;
  if (size < EXPECT) throw new Error('incomplete ' + size);
})().catch((e) => { console.error('\nFAIL', e.message); process.exit(1); });
