/* 使用系统 git credential helper 推送 update/ 到 Gitee updates 分支
 * 不修改主仓库的工作状态，在临时目录操作
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const UPD = path.join(ROOT, 'update');
const BRANCH = 'updates';
const USER = process.env.GITEE_USER || 'monichang';
const REPO = 'college-workbench';
const TMP = path.join(ROOT, '.update-push-tmp');

// 1) 准备临时目录
if (fs.existsSync(TMP)) {
  fs.rmSync(TMP, { recursive: true, force: true });
}
fs.mkdirSync(TMP, { recursive: true });

function sh(cmd, cwd) {
  return execSync(cmd, { stdio: 'inherit', cwd: cwd || ROOT });
}
function shq(cmd, cwd) {
  return execSync(cmd, { stdio: 'pipe', cwd: cwd || ROOT });
}

try {
  // 2) 初始化临时仓库
  sh('git init', TMP);
  sh('git checkout --orphan ' + BRANCH, TMP);
  sh('git remote add origin "https://gitee.com/' + USER + '/' + REPO + '.git"', TMP);

  // 3) 配置提交身份
  sh('git config user.email "workbench@local"', TMP);
  sh('git config user.name "Hot Updater"', TMP);

  // 4) 复制 update/ 内容到临时仓库
  function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, e.name), d = path.join(dst, e.name);
      if (e.isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  }
  copyDir(UPD, TMP);
  console.log('Copied update/ contents');

  // 5) 提交
  sh('git add -A', TMP);
  // 仅当有变更时提交
  try {
    sh('git commit -m "hot-update"', TMP);
  } catch (e) {
    console.log('(nothing to commit)');
  }

  // 6) 推送（git credential helper 会自动提供凭证）
  console.log('→ Pushing to gitee.com:' + USER + '/' + REPO + ' branch=' + BRANCH);
  sh('git push -f origin ' + BRANCH, TMP);

  console.log('✅ 热更新已推送');
} catch (e) {
  console.error('推送失败：', e.message);
  process.exit(1);
} finally {
  // 清理临时目录
  if (fs.existsSync(TMP)) {
    fs.rmSync(TMP, { recursive: true, force: true });
  }
}