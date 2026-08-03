/* 发布「原生 App 热更新包」到 Gitee 的 updates 分支
 * - 重新打包前端到 dist/
 * - 把 dist/ 压缩成 update/cw-<version>.zip
 * - 生成 update/manifest.json（含版本 + 可直接下载的 Gitee raw 地址）
 * - 推送到 Gitee 仓库的 updates 分支（原生 App 启动时自动拉取）
 *
 * 用法（在项目根目录执行）：
 *   set GITEE_TOKEN=你的私人令牌
 *   set GITEE_USER=monichang
 *   node deploy-update.js            # 自动把版本号 +0.0.1
 *   node deploy-update.js --version 1.2.3   # 指定版本
 *   node deploy-update.js --no-push   # 只本地打包+生成，不推送（用于测试）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const UPD = path.join(ROOT, 'update');
const VERSION_FILE = path.join(ROOT, 'update-last-version.txt');
const BRANCH = 'updates';
const REPO = 'college-workbench';

function sh(cmd, opts) {
  return execSync(cmd, Object.assign({ stdio: 'inherit', cwd: ROOT }, opts || {}));
}
function trim(s) { return String(s || '').trim(); }

// ---- 解析参数 ----
const args = process.argv.slice(2);
const NO_PUSH = args.includes('--no-push');
let forcedVersion = null;
const vi = args.indexOf('--version');
if (vi >= 0 && args[vi + 1]) forcedVersion = trim(args[vi + 1]);

// ---- 1) 确定版本号 ----
let version;
if (forcedVersion) {
  version = forcedVersion;
} else if (fs.existsSync(VERSION_FILE)) {
  const last = trim(fs.readFileSync(VERSION_FILE, 'utf8'));
  const parts = last.split('.').map((x) => parseInt(x, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1; // patch +1
  version = parts.join('.');
} else {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  version = pkg.version || '1.0.0';
}
console.log('发布版本：', version);

// ---- 2) 重新打包前端 ----
console.log('→ 打包前端 dist/');
sh('node build.js');

// ---- 3) 压缩 dist 为 zip ----
fs.mkdirSync(UPD, { recursive: true });
const zipName = 'cw-' + version + '.zip';
const zipPath = path.join(UPD, zipName);
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
console.log('→ 压缩 dist 为 ' + zipName);
try {
  // Git for Windows 自带 zip 命令
  sh('zip -r "' + zipPath + '" . -i "*"', { cwd: DIST });
} catch (e) {
  console.warn('zip 命令不可用，改用 PowerShell Compress-Archive');
  const ps = 'Compress-Archive -Path "' + DIST + '\\*" -DestinationPath "' + zipPath + '" -Force';
  sh('powershell -NoProfile -Command "' + ps + '"');
}

// ---- 4) 生成 manifest.json ----
const user = process.env.GITEE_USER || 'monichang';
const zipUrl = 'https://gitee.com/' + user + '/' + REPO + '/raw/' + BRANCH + '/' + zipName;
const manifest = {
  version: version,
  url: zipUrl,
  note: '热更新包',
  updatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(UPD, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('→ manifest.json 指向', zipUrl);

// ---- 5) 推送（可选）----
if (NO_PUSH) {
  console.log('（--no-push）已生成本地 update/ 目录，未推送。');
  fs.writeFileSync(VERSION_FILE, version);
  process.exit(0);
}

const token = process.env.GITEE_TOKEN;
if (!token) { console.error('缺少 GITEE_TOKEN 环境变量，无法推送。'); process.exit(1); }
const remote = 'https://' + encodeURIComponent(user) + ':' + encodeURIComponent(token) + '@gitee.com/' + user + '/' + REPO + '.git';

console.log('→ 提交并推送到 ' + BRANCH + ' 分支');
try { sh('git remote remove origin'); } catch (_) {}
sh('git remote add origin "' + remote + '"');
// 仅跟踪 updates 分支（独立孤儿分支，只放更新包）
sh('git fetch origin ' + BRANCH + ' || true');
sh('git checkout --orphan ' + BRANCH + ' 2>/dev/null || git checkout ' + BRANCH);
// 只把 update/ 放进该分支
sh('git rm -rf --cached . >/dev/null 2>&1 || true');
fs.writeFileSync(path.join(ROOT, '.gitignore.update'), '*\n!update/\n');
sh('git add update/');
sh('git commit -m "hot-update ' + version + '" --allow-empty');
sh('git push -f origin ' + BRANCH);
fs.writeFileSync(VERSION_FILE, version);
console.log('✅ 热更新已发布：' + version);
console.log('   原生 App 下次启动时将自动拉取并静默更新。');
