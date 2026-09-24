// 通过 GitHub Git Data API 把本地 HEAD 快进推到指定分支（github.com 被墙时走 api.github.com）
// 用法: node api-push.js <branch> "<commit message>"
// 原理: 远程树(递归) vs 本地 HEAD 树(ls-tree) 逐 path 比 blob sha → 只上传差异 blob →
//       建 tree(base_tree=远程树) → 建 commit(parent=本地HEAD, 须为远程head的快进) → PATCH ref
const { execFileSync, execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

// token 来源：优先环境变量 GH_TOKEN，其次 %TEMP%\gh_token.txt（由 CredRead 从凭据管理器提取）
const fs0 = require("fs");
let TOKEN = process.env.GH_TOKEN || "";
if (!TOKEN) {
  const tf = path.join(os.tmpdir(), "gh_token.txt");
  if (fs0.existsSync(tf)) TOKEN = fs0.readFileSync(tf, "utf8").trim();
}
if (!TOKEN) { console.error("no token (GH_TOKEN or %TEMP%\\gh_token.txt)"); process.exit(1); }

const OWNER = "zhuliliui", REPO = "college-workbench", API = "https://api.github.com";
const BRANCH = process.argv[2];
const MSG = process.argv[3] || "update (via REST API)";
const FORCE = process.argv.includes("--force"); // 跳过本地祖先校验（远程 head 为 API 建的 commit 时用）
if (!BRANCH) { console.error("usage: node api-push.js <branch> <msg> [--force]"); process.exit(1); }
const TMP = os.tmpdir();

function curl(method, p, bodyObj, raw) {
  const f = path.join(TMP, "ghb_" + Math.random().toString(36).slice(2) + ".json");
  if (bodyObj) fs.writeFileSync(f, JSON.stringify(bodyObj));
  const args = ["-sSL", "--retry", "10", "--retry-all-errors", "--retry-delay", "3",
    "--retry-max-time", "480", "--connect-timeout", "20", "--max-time", "180",
    "--tlsv1.2", "--http1.1", "-X", method,
    "-H", "Authorization: Bearer " + TOKEN,
    "-H", "Accept: application/vnd.github+json",
    "-H", "User-Agent: wb", "-w", "\n%{http_code}", API + p];
  if (bodyObj) { args.push("-H", "Content-Type: application/json", "--data-binary", "@" + f); }
  let out = "";
  try { out = execFileSync("curl", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }); }
  catch (e) { out = (e.stdout || "") + ""; }
  try { fs.unlinkSync(f); } catch (e) {}
  const idx = out.lastIndexOf("\n");
  const code = out.slice(idx + 1).trim();
  const body = out.slice(0, idx);
  if (["200", "201", "204"].includes(code)) {
    if (raw) return { body, code };
    try { return JSON.parse(body || "{}"); } catch (e) { return {}; }
  }
  throw new Error(method + " " + p + " -> " + code + " " + body.slice(0, 200));
}

(async () => {
  const head = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  console.log("[1] local HEAD =", head.slice(0, 8), "-> branch", BRANCH);

  // 远程 ref
  const ref = curl("GET", "/repos/" + OWNER + "/" + REPO + "/git/refs/heads/" + BRANCH);
  const remoteHead = ref.object.sha;
  if (remoteHead === head) { console.log("already up to date"); return; }
  // 校验快进：远程 head 必须是本地 HEAD 祖先（--force 时跳过）
  if (FORCE) console.log("[2] remote head =", remoteHead.slice(0, 8), "(force mode, skip ancestry check)");
  else { execSync("git merge-base --is-ancestor " + remoteHead + " HEAD"); console.log("[2] remote head =", remoteHead.slice(0, 8), "(fast-forward ok)"); }

  // 远程树
  const rc = curl("GET", "/repos/" + OWNER + "/" + REPO + "/git/commits/" + remoteHead);
  const remoteTreeSha = rc.tree.sha;
  const rt = curl("GET", "/repos/" + OWNER + "/" + REPO + "/git/trees/" + remoteTreeSha + "?recursive=1");
  if (rt.truncated) throw new Error("remote tree truncated");
  const remoteMap = {};
  (rt.tree || []).forEach((e) => { if (e.type === "blob") remoteMap[e.path] = e.sha; });
  console.log("[3] remote tree blobs =", Object.keys(remoteMap).length);

  // 本地 HEAD 树
  const ls = execSync("git -c core.quotePath=false ls-tree -r HEAD", { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const localEntries = ls.split("\n").filter(Boolean).map((l) => {
    const meta = l.split("\t");
    const info = meta[0].split(" ");
    return { mode: info[0], type: info[1], sha: info[2], path: meta.slice(1).join("\t") };
  });
  console.log("[4] local tree blobs =", localEntries.length);

  // 差异（⚠️ 跳过 .github/workflows/*：OAuth 令牌缺 workflow scope 时，含 workflow 文件的 trees 请求会被整个 404 连坐）
  const changed = localEntries.filter((e) => e.type === "blob" && remoteMap[e.path] !== e.sha && !e.path.startsWith(".github/"));
  const removed = Object.keys(remoteMap).filter((p) => !localEntries.some((e) => e.path === p));
  console.log("[5] changed =", changed.length, "removed =", removed.length);

  // 上传差异 blob
  const tree = changed.map((e) => ({ path: e.path, mode: e.mode, type: "blob", sha: e.sha }));
  removed.forEach((p) => tree.push({ path: p, mode: "100644", type: "blob", sha: null }));
  for (let i = 0; i < changed.length; i++) {
    const e = changed[i];
    const b64 = execFileSync("git", ["cat-file", "blob", e.sha], { encoding: "buffer", maxBuffer: 128 * 1024 * 1024 }).toString("base64");
    const blob = curl("POST", "/repos/" + OWNER + "/" + REPO + "/git/blobs", { content: b64, encoding: "base64" });
    tree[i].sha = blob.sha; // 用服务端 sha（防本地 sha 计算口径差异）
    if ((i + 1) % 10 === 0) console.log("   blobs", i + 1 + "/" + changed.length);
  }
  console.log("[6] blobs uploaded");

  const newTree = curl("POST", "/repos/" + OWNER + "/" + REPO + "/git/trees", { base_tree: remoteTreeSha, tree });
  console.log("[7] tree =", newTree.sha.slice(0, 8));

  const commit = curl("POST", "/repos/" + OWNER + "/" + REPO + "/git/commits", {
    message: MSG, tree: newTree.sha, parents: [remoteHead], // parent 用远程已有 commit（本地 HEAD 不在服务端）
  });
  console.log("[8] commit =", commit.sha.slice(0, 8));

  curl("PATCH", "/repos/" + OWNER + "/" + REPO + "/git/refs/heads/" + BRANCH, { sha: commit.sha, force: true });
  console.log("[9] DONE", BRANCH, "->", commit.sha.slice(0, 8));
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
