// 通过 GitHub REST API 创建 android-build 分支并提交全部文件
// 全部走 curl；curl 内部 --retry 扛过沙箱网络的间歇 TLS 失败
// 重跑安全：分支已存在则跳过；重新生成 commit 追加
const { execSync, execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const TOKEN = process.env.GH_TOKEN;
const OWNER = "zhuliliui";
const REPO = "college-workbench";
const BRANCH = "android-build";
const API = "https://api.github.com";
const TMP = os.tmpdir();

function curl(method, p, bodyObj) {
  const f = path.join(TMP, "ghb_" + Math.random().toString(36).slice(2) + ".json");
  if (bodyObj) fs.writeFileSync(f, JSON.stringify(bodyObj));
  const args = [
    "-sSL",
    "--retry", "15",
    "--retry-all-errors",
    "--retry-delay", "4",
    "--retry-max-time", "560",
    "--connect-timeout", "30",
    "--max-time", "120",
    "--tlsv1.2",
    "--http1.1",
    "-X", method,
    "-H", "Authorization: Bearer " + TOKEN,
    "-H", "Accept: application/vnd.github+json",
    "-H", "User-Agent: wb",
    "-w", "\n%{http_code}",
    API + p,
  ];
  if (bodyObj) { args.push("-H", "Content-Type: application/json"); args.push("--data-binary", "@" + f); }
  let out = "";
  try { out = execFileSync("curl", args, { encoding: "utf8" }); }
  catch (e) { out = (e.stdout || "") + ""; }
  try { fs.unlinkSync(f); } catch (e) {}
  const idx = out.lastIndexOf("\n");
  const code = out.slice(idx + 1).trim();
  const body = out.slice(0, idx);
  if (code === "200" || code === "201" || code === "204") {
    try { return JSON.parse(body || "{}"); } catch (e) { return {}; }
  }
  throw new Error(method + " " + p + " -> " + code + " " + body.slice(0, 160));
}

(async () => {
  const repo = curl("GET", "/repos/" + OWNER + "/" + REPO);
  const base = repo.default_branch;
  const baseRef = curl("GET", "/repos/" + OWNER + "/" + REPO + "/git/refs/heads/" + base);
  const baseSha = baseRef.object.sha;
  console.log("[1] base =", base, "sha =", baseSha.slice(0, 8));

  let exists = false;
  try { curl("GET", "/repos/" + OWNER + "/" + REPO + "/git/refs/heads/" + BRANCH); exists = true; }
  catch (e) { if (!/404/.test(e.message)) throw e; }
  if (!exists) {
    curl("POST", "/repos/" + OWNER + "/" + REPO + "/git/refs", { ref: "refs/heads/" + BRANCH, sha: baseSha });
    console.log("[2] created branch", BRANCH);
  } else {
    console.log("[2] branch", BRANCH, "exists, will append new commit");
  }

  const raw = execSync("git -c core.quotePath=false ls-files", { encoding: "utf8" });
  const files = raw.split("\n").map((s) => s.replace(/^"|"$/g, "")).filter(Boolean);
  console.log("[3] files =", files.length);

  const tree = [];
  let done = 0;
  for (const f of files) {
    const b64 = fs.readFileSync(f).toString("base64");
    const blob = curl("POST", "/repos/" + OWNER + "/" + REPO + "/git/blobs", { content: b64, encoding: "base64" });
    tree.push({ path: f, mode: "100644", type: "blob", sha: blob.sha });
    done++;
    if (done % 20 === 0) console.log("   blobs", done + "/" + files.length);
  }
  console.log("[4] blobs done =", tree.length);

  const newTree = curl("POST", "/repos/" + OWNER + "/" + REPO + "/git/trees", { base_tree: baseSha, tree });
  console.log("[5] tree =", newTree.sha.slice(0, 8));

  const commit = curl("POST", "/repos/" + OWNER + "/" + REPO + "/git/commits", {
    message: "feat: Capacitor 安卓原生工程 + GitHub Actions 在线打包 workflow (via REST API)",
    tree: newTree.sha,
    parents: [baseSha],
  });
  console.log("[6] commit =", commit.sha.slice(0, 8));

  curl("PATCH", "/repos/" + OWNER + "/" + REPO + "/git/refs/heads/" + BRANCH, { sha: commit.sha, force: true });
  console.log("[7] DONE -> " + BRANCH + " -> " + commit.sha.slice(0, 8));
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
