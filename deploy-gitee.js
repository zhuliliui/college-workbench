#!/usr/bin/env node
/**
 * 部署「大学生AI万能工作台」到 Gitee Pages（纯静态 PWA）
 *
 * 用法（在本地 Windows / 有 git 的机器上运行）：
 *   set GITEE_TOKEN=你的私人令牌
 *   set GITEE_USER=你的Gitee用户名
 *   node deploy-gitee.js
 *
 * 可选环境变量：
 *   GITEE_REPO   仓库名，默认 college-workbench
 *   GITEE_BRANCH 部署分支，默认 master（Gitee Pages 默认分支）
 *
 * 说明：
 *   - 脚本只打包「站点需要的静态文件」到 dist/，不含 server.js / data / 后端等。
 *   - Gitee Pages 免费版仅支持【公开仓库】，且首次需要到网页点「启动」。
 *   - 之后每次改完前端，重跑本脚本即可（会强制推送并触发重新构建）。
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const readline = require('readline');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const API = 'https://gitee.com/api/v5';
const REPO = process.env.GITEE_REPO || 'college-workbench';
const BRANCH = process.env.GITEE_BRANCH || 'master';

// 仅站点静态文件（server.js / data / 后端脚本不进 Pages）
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

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a.trim()); }));
}
function sh(cmd, opts = {}) {
  return cp.execSync(cmd, { cwd: DIST, stdio: 'inherit', ...opts });
}
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function main() {
  let token = process.env.GITEE_TOKEN;
  let user = process.env.GITEE_USER;
  if (!token && process.stdin.isTTY) token = await ask('Gitee 私人令牌 ( scopes: projects ): ');
  if (!user && process.stdin.isTTY) user = await ask('Gitee 用户名: ');
  if (!token || !user) {
    console.error('缺少 GITEE_TOKEN / GITEE_USER。请用环境变量提供，或交互输入。');
    process.exit(1);
  }

  // 1) 准备 dist
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  for (const item of INCLUDE) {
    const s = path.join(ROOT, item);
    if (!fs.existsSync(s)) { console.warn('跳过不存在:', item); continue; }
    const d = path.join(DIST, item);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
  console.log('已打包静态文件到 dist/');

  // 2) git 初始化并提交
  sh('git init -q');
  sh('git config core.autocrlf false'); // 抑制 Windows CRLF 警告
  sh('git checkout -B ' + BRANCH);
  sh('git add -A');
  sh('git commit -q -m "deploy: ' + new Date().toISOString().slice(0, 19) + '"', { stdio: 'ignore' });

  // 3) 创建仓库（已存在则忽略）
  const mkRepo = `curl -s -X POST "${API}/user/repos?access_token=${token}" -H "Content-Type: application/json" -d "{\\"name\\":\\"${REPO}\\",\\"description\\":\\"大学生AI万能工作台 PWA\\",\\"private\\":false,\\"auto_init\\":true,\\"default_branch\\":\\"${BRANCH}\\"}"`;
  try {
    const out = cp.execSync(mkRepo, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const j = JSON.parse(out || '{}');
    if (j && j.full_name) console.log('仓库就绪:', j.full_name);
    else console.log('仓库可能已存在，继续。');
  } catch (_) { console.log('创建仓库未返回预期结果，继续尝试推送。'); }

  // 4) 推送（强制，因为 Pages 仓库以本站为准）
  // Gitee over HTTPS 鉴权：用户名 = Gitee 登录名，密码 = 私人令牌
  const remote = `https://${encodeURIComponent(user)}:${encodeURIComponent(token)}@gitee.com/${user}/${REPO}.git`;
  try { sh(`git remote remove origin`, {stdio: 'ignore'}); } catch (_) {}
  sh(`git remote add origin "${remote}"`);
  sh(`git push -f origin ${BRANCH} --set-upstream`);

  // 5) 触发 Gitee Pages 重新构建（免费版可能需网页手动启动）
  const build = `curl -s -X POST "${API}/repos/${user}/${REPO}/pages/builds?access_token=${token}" -H "Content-Type: application/json" -d "{\\"branch\\":\\"${BRANCH}\\",\\"build_directory\\":\\"/\\"}"`;
  try {
    const r = cp.execSync(build, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    console.log('Pages 构建触发返回:', (r || '').slice(0, 120));
  } catch (_) {
    console.log('自动构建未触发（免费版常见）。请到 Gitee 网页手动启动 Pages。');
  }

  console.log('\n==== 完成 ====');
  console.log('仓库:    https://gitee.com/' + user + '/' + REPO);
  console.log('页面地址(启动 Pages 后): https://' + user + '.gitee.io/' + REPO + '/');
  console.log('\n若页面地址打不开：');
  console.log('  1) 打开 https://gitee.com/' + user + '/' + REPO + ' → 服务 → Gitee Pages');
  console.log('  2) 点「启动」（分支选 ' + BRANCH + '，部署目录 /）→ 等待生成');
  console.log('  3) 手机浏览器打开上面页面地址 → 菜单「添加到主屏幕」即变成 App');
}

main().catch((e) => { console.error('部署失败:', e.message); process.exit(1); });
