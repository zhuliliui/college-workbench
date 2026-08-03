/* 打包静态站点到 dist/（供 Capacitor 读取）。不触碰 git。 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

const INCLUDE = [
  'index.html',
  'manifest.json',
  'manifest.webmanifest',
  'sw.js',
  '.nojekyll',
  'css',
  'js',
  'assets',
];

function cpDir(s, d) {
  fs.mkdirSync(d, { recursive: true });
  for (const e of fs.readdirSync(s, { withFileTypes: true })) {
    const a = path.join(s, e.name);
    const b = path.join(d, e.name);
    if (e.isDirectory()) cpDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

fs.mkdirSync(DIST, { recursive: true }); // 直接覆盖复制，不整体删除（避免批量删除保护）
for (const it of INCLUDE) {
  const s = path.join(ROOT, it);
  if (!fs.existsSync(s)) { console.warn('跳过（不存在）:', it); continue; }
  const d = path.join(DIST, it);
  if (fs.statSync(s).isDirectory()) cpDir(s, d);
  else fs.copyFileSync(s, d);
}
let n = 0, sz = 0;
(function w(p) {
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, e.name);
    if (e.isDirectory()) w(f);
    else { n++; sz += fs.statSync(f).size; }
  }
})(DIST);
// 记录本次打包版本，供原生 App 首装时作为「已安装版本」基线（避免重复下载同版本）
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  fs.writeFileSync(path.join(DIST, 'version.json'), JSON.stringify({ version: pkg.version || '0.0.0', builtAt: new Date().toISOString() }));
} catch (_) {}
console.log('已打包 ' + n + ' 个文件到 dist/（' + (sz / 1048576).toFixed(2) + ' MB）');
