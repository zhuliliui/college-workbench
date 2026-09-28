// 下载 GitHub Actions APK artifact：先手动取 302 Location，直连失败换 gh-proxy 镜像
const fs = require('fs'), path = require('path'), os = require('os');
let TOKEN = process.env.GH_TOKEN || '';
if (!TOKEN) {
  const tf = path.join(os.tmpdir(), 'gh_token.txt');
  if (fs.existsSync(tf)) TOKEN = fs.readFileSync(tf, 'utf8').trim();
}
if (!TOKEN) { console.error('NO_TOKEN'); process.exit(1); }
const ART = 10969346064;
const API = 'https://api.github.com/repos/zhuliliui/college-workbench/actions/artifacts/' + ART + '/zip';

async function main() {
  // 1) 拿 302 Location（不自动跟随）
  const r = await fetch(API, { headers: { Authorization: 'Bearer ' + TOKEN, 'User-Agent': 'cw-downloader' }, redirect: 'manual' });
  const loc = r.headers.get('location') || (await r.json().catch(() => ({}))).url || '';
  console.log('STATUS ' + r.status);
  if (!loc) { console.error('NO_LOCATION'); process.exit(1); }
  console.log('LOC_HOST ' + new URL(loc).host);

  // 2) 依次尝试：直连 → gh-proxy 镜像
  const tries = [loc, 'https://gh-proxy.com/' + loc];
  for (let i = 0; i < tries.length; i++) {
    try {
      const d = await fetch(tries[i], { headers: i === 0 ? { Authorization: 'Bearer ' + TOKEN, 'User-Agent': 'cw-downloader' } : { 'User-Agent': 'cw-downloader' }, signal: AbortSignal.timeout(60000) });
      if (!d.ok) { console.log('TRY' + i + ' HTTP_' + d.status); continue; }
      const buf = Buffer.from(await d.arrayBuffer());
      if (buf.length < 1000000) { console.log('TRY' + i + ' TOO_SMALL ' + buf.length); continue; }
      const out = path.join(__dirname, '..', 'app-debug.artifact.zip');
      fs.writeFileSync(out, buf);
      console.log('SAVED ' + out + ' ' + buf.length + ' MAGIC ' + buf.slice(0, 2).toString('ascii'));
      return;
    } catch (e) { console.log('TRY' + i + ' FAIL ' + e.message.slice(0, 60)); }
  }
  process.exit(2);
}
main();
