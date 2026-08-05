// 下载 GitHub Actions artifact：取 SAS -> Range 续传 -> gzip 兜底
const https = require('https');
const fs = require('fs');
const zlib = require('zlib');
const TOKEN = process.env.GITHUB_TOKEN;
const ARTIFACT_ID = process.argv[2];
const EXPECT = parseInt(process.argv[3] || '0', 10);
const OUT = 'artifact.zip';
const API = 'https://api.github.com';
const OWNER_REPO = 'repos/zhuliliui/college-workbench';
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function getSas() {
  return new Promise((resolve, reject) => {
    const req = https.request(API + '/' + OWNER_REPO + '/actions/artifacts/' + ARTIFACT_ID + '/zip', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json', 'User-Agent': 'wb-dl' },
    }, (res) => {
      if (res.statusCode === 302) { resolve(res.headers.location); return; }
      let data = ''; res.on('data', (c) => data += c);
      res.on('end', () => reject(new Error('sas http ' + res.statusCode)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function download() {
  if (fs.existsSync(OUT) && fs.statSync(OUT).size >= EXPECT) { console.log('ALREADY_DONE'); return; }
  for (let attempt = 0; attempt < 80; attempt++) {
    let pos = fs.existsSync(OUT) ? fs.statSync(OUT).size : 0;
    if (pos >= EXPECT) { console.log('DONE'); return; }
    let sas;
    try { sas = await getSas(); } catch (e) { console.log('sas fail', e.message); await sleep(3000); continue; }
    console.log('[' + attempt + '] pos=' + pos + '/' + EXPECT);
    const ok = await new Promise((resolve) => {
      const u = new URL(sas);
      const headers = { 'User-Agent': 'wb-dl', 'Accept-Encoding': 'identity' };
      if (pos > 0) headers['Range'] = 'bytes=' + pos + '-';
      const req = https.request(u, { method: 'GET', headers, rejectUnauthorized: false }, (res) => {
        if (res.statusCode !== 200 && res.statusCode !== 206) { console.log('http', res.statusCode); resolve(false); return; }
        const fd = fs.openSync(OUT, pos > 0 ? 'a' : 'w');
        let got = 0;
        res.on('data', (chunk) => { fs.writeSync(fd, chunk); got += chunk.length; pos += chunk.length; if (got % (256 * 1024) < chunk.length) process.stdout.write('\r' + pos + '/' + EXPECT); });
        res.on('end', () => { fs.closeSync(fd); console.log(''); resolve(true); });
        res.on('error', () => { try { fs.closeSync(fd); } catch (e) {} resolve(false); });
      });
      req.on('error', () => resolve(false));
      req.setTimeout(90000, () => { req.destroy(); resolve(false); });
      req.end();
    });
    if (!ok) await sleep(2000);
  }
  throw new Error('attempts exhausted');
}

(async () => {
  await download();
  let data = fs.readFileSync(OUT);
  if (data[0] === 0x1f && data[1] === 0x8b) { data = zlib.gunzipSync(data); fs.writeFileSync(OUT, data); console.log('ungzipped'); }
  if (data.length < EXPECT) throw new Error('incomplete ' + data.length);
  console.log('OK size=' + data.length);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });