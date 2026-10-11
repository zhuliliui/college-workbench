// 多通道下载 GitHub Actions APK artifact：先取 302 Location，再逐个镜像尝试
const fs = require('fs'), path = require('path'), os = require('os');

let TOKEN = process.env.GH_TOKEN || '';
if (!TOKEN) {
  const tf = path.join(os.tmpdir(), 'gh_token.txt');
  if (fs.existsSync(tf)) TOKEN = fs.readFileSync(tf, 'utf8').trim();
}
if (!TOKEN) { console.error('NO_TOKEN'); process.exit(1); }

const ART = process.argv[2] || '10982065959';
const OUT = path.join(__dirname, '..', 'app-debug.artifact.zip');

async function getLoc() {
  const r = await fetch(
    'https://api.github.com/repos/zhuliliui/college-workbench/actions/artifacts/' + ART + '/zip',
    { headers: { Authorization: 'Bearer ' + TOKEN, 'User-Agent': 'cw-dl' }, redirect: 'manual' }
  );
  const loc = r.headers.get('location') || '';
  console.log('STATUS ' + r.status + ' LOC_HOST ' + (loc ? new URL(loc).host : 'none'));
  return loc;
}

async function tryUrl(url, headers, label) {
  try {
    const d = await fetch(url, { headers: headers, signal: AbortSignal.timeout(90000) });
    if (!d.ok) { console.log(label + ' HTTP_' + d.status); return false; }
    const buf = Buffer.from(await d.arrayBuffer());
    if (buf.length < 1000000) { console.log(label + ' TOO_SMALL ' + buf.length); return false; }
    if (buf.slice(0, 2).toString('ascii') !== 'PK') { console.log(label + ' NOT_ZIP'); return false; }
    fs.writeFileSync(OUT, buf);
    console.log(label + ' OK ' + buf.length);
    return true;
  } catch (e) {
    console.log(label + ' FAIL ' + String(e.message).slice(0, 70));
    return false;
  }
}

async function main() {
  const loc = await getLoc();
  if (!loc) { console.log('NO_LOCATION'); process.exit(1); }
  const enc = encodeURIComponent(loc);
  const tries = [
    ['direct', loc, { 'User-Agent': 'cw-dl' }],
    ['gh-proxy', 'https://gh-proxy.com/' + loc, { 'User-Agent': 'cw-dl' }],
    ['ghproxy.net', 'https://ghproxy.net/' + loc, { 'User-Agent': 'cw-dl' }],
    ['gh.llkk', 'https://gh.llkk.cc/' + loc, { 'User-Agent': 'cw-dl' }],
    ['ghfast.top', 'https://ghfast.top/' + loc, { 'User-Agent': 'cw-dl' }],
    ['gh-proxy-enc', 'https://gh-proxy.com/' + enc, { 'User-Agent': 'cw-dl' }],
  ];
  for (const [label, url, headers] of tries) {
    if (await tryUrl(url, headers, label)) { console.log('DONE ' + OUT); return; }
  }
  console.log('ALL_FAILED');
  process.exit(2);
}
main();
