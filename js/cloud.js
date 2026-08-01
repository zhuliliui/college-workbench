/* ============================================================
   云端同步模块 · 基于 GitHub 私有仓库（浏览器直连 GitHub API）
   - 国内实测 api.github.com 可达、CORS 全支持、免费
   - 令牌仅存浏览器 localStorage，不经过本站任何服务器
   - 文件存于仓库指定路径，内容为标准 base64 编码的 state JSON
   ============================================================ */
(function () {
  const API = 'https://api.github.com';

  function cfg() { return Store.get().cloud || {}; }
  function configured() { const c = cfg(); return !!(c.owner && c.repo && c.token); }
  function filePath() { return cfg().path || 'cw-backup.json'; }
  function branch() { return cfg().branch || 'main'; }

  // UTF-8 安全的 base64
  function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64dec(b) { return decodeURIComponent(escape(atob(String(b).replace(/\s/g, '')))); }

  function repoBase() {
    const c = cfg();
    return API + '/repos/' + encodeURIComponent(c.owner) + '/' + encodeURIComponent(c.repo) + '/contents/' + encodeURIComponent(filePath());
  }
  function authHeaders(extra) {
    const c = cfg();
    return Object.assign({ 'Authorization': 'Bearer ' + c.token, 'Accept': 'application/vnd.github+json' }, extra || {});
  }

  // 读取云端文件头信息（是否存在 / sha / 内容）
  async function getHead() {
    if (!configured()) throw new Error('请先配置云端');
    const u = repoBase() + '?ref=' + encodeURIComponent(branch());
    const r = await fetch(u, { headers: authHeaders() });
    if (r.status === 404) return { exists: false };
    if (!r.ok) throw new Error('读取云端文件失败 HTTP ' + r.status);
    const j = await r.json();
    return { exists: true, sha: j.sha, content: j.content, size: j.size };
  }

  // 上传（新建或更新）完整 state JSON 到 GitHub
  async function upload() {
    if (!configured()) throw new Error('请先配置云端');
    const c = cfg();
    const json = Store.exportJSON();
    const content = b64enc(json);
    // 先取 sha：存在则更新(PUT+sha)，不存在则新建(PUT 不带 sha)
    let sha = null;
    try { const h = await getHead(); if (h && h.exists) sha = h.sha; } catch (e) { /* 忽略，按新建处理 */ }
    const body = {
      message: '☁️ 工作台备份 ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
      content,
      branch: branch(),
    };
    if (sha) body.sha = sha;
    const r = await fetch(repoBase(), {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      let msg = '';
      try { msg = (await r.json()).message || ''; } catch (e) {}
      throw new Error('上传失败 HTTP ' + r.status + (msg ? '：' + msg : ''));
    }
    Store.update((st) => { st.cloud = st.cloud || {}; st.cloud.lastSync = new Date().toISOString(); });
    return true;
  }

  // 从云端恢复：下载 JSON 并导入
  async function download() {
    if (!configured()) throw new Error('请先配置云端');
    const h = await getHead();
    if (!h || !h.exists) throw new Error('云端暂无备份文件');
    const json = b64dec(h.content);
    if (!Store.importJSON(json)) throw new Error('云端数据格式异常');
    return true;
  }

  // 验证配置并返回默认分支
  async function testConfig(owner, repo, token) {
    const r = await fetch(API + '/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo), {
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' },
    });
    if (r.status === 404) throw new Error('仓库不存在或无权限（请确认仓库名、令牌及 repo 权限）');
    if (!r.ok) throw new Error('验证失败 HTTP ' + r.status);
    const j = await r.json();
    return { ok: true, branch: j.default_branch || 'main' };
  }

  window.Cloud = { configured, getHead, upload, download, testConfig, cfg };
})();
