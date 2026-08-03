/* ============================================================
  云端同步模块 · 支持码云 Gitee / GitHub（浏览器直连平台 API）
  - 码云 Gitee：国内直连、免代理，推荐
  - GitHub：需代理
  - 令牌仅存浏览器 localStorage，不经过本站任何服务器
  - 备份文件为标准 base64 编码的 state JSON
  ============================================================ */
(function () {
  function enc(s) { return encodeURIComponent(s); }

  // UTF-8 安全的 base64
  function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64dec(b) { return decodeURIComponent(escape(atob(String(b).replace(/\s/g, '')))); }

  // ---- 各平台适配器 ----
  const ADAPTERS = {
  gitee: {
  label: '码云 Gitee',
  defaultBranch: 'master',
  tokenDoc: 'https://gitee.com/profile/personal_access_tokens',
  // 读取文件（access_token 放查询参数）
  async getFile(o, r, path, token, branch) {
  const u = `https://gitee.com/api/v5/repos/${enc(o)}/${enc(r)}/contents/${enc(path)}?access_token=${enc(token)}&ref=${enc(branch)}`;
  return fetch(u, { headers: { 'Accept': 'application/json' } });
  },
  // 验证仓库存在 & 取默认分支
  async verify(o, r, token) {
  const u = `https://gitee.com/api/v5/repos/${enc(o)}/${enc(r)}?access_token=${enc(token)}`;
  return fetch(u, { headers: { 'Accept': 'application/json' } });
  },
  // 写入（新建 POST / 更新 PUT）
  async write(o, r, path, token, body) {
  const u = `https://gitee.com/api/v5/repos/${enc(o)}/${enc(r)}/contents/${enc(path)}?access_token=${enc(token)}`;
  const method = body.sha ? 'PUT' : 'POST';
  return fetch(u, {
  method,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  body: JSON.stringify(Object.assign({ access_token: token }, body)),
  });
  },
  },
  github: {
  label: 'GitHub',
  defaultBranch: 'main',
  tokenDoc: 'https://github.com/settings/tokens',
  async getFile(o, r, path, token, branch) {
  const u = `https://api.github.com/repos/${enc(o)}/${enc(r)}/contents/${enc(path)}?ref=${enc(branch)}`;
  return fetch(u, { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' } });
  },
  async verify(o, r, token) {
  const u = `https://api.github.com/repos/${enc(o)}/${enc(r)}`;
  return fetch(u, { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' } });
  },
  async write(o, r, path, token, body) {
  const u = `https://api.github.com/repos/${enc(o)}/${enc(r)}/contents/${enc(path)}`;
  return fetch(u, {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github+json' },
  body: JSON.stringify(body),
  });
  },
  },
  };

  function cfg() { return Store.get().cloud || {}; }
  function provider() { return (cfg().provider || 'gitee'); }
  function adapter() { return ADAPTERS[provider()] || ADAPTERS.gitee; }
  function configured() { const c = cfg(); return !!(c.owner && c.repo && c.token); }
  function filePath() { return cfg().path || 'cw-backup.json'; }
  function branch() { return cfg().branch || adapter().defaultBranch; }

  // 读取云端文件头信息（是否存在 / sha / 内容）
  async function getHead() {
  if (!configured()) throw new Error('请先配置云端');
  const c = cfg(), a = adapter();
  const r = await a.getFile(c.owner, c.repo, filePath(), c.token, branch());
  if (r.status === 404) return { exists: false };
  if (!r.ok) {
  let msg = '';
  try { msg = (await r.json()).message || ''; } catch (e) {}
  throw new Error('读取云端文件失败 HTTP ' + r.status + (msg ? '：' + msg : ''));
  }
  const j = await r.json();
  return { exists: true, sha: j.sha, content: j.content, size: j.size };
  }

  // 上传（新建或更新）完整 state JSON 到平台
  async function upload() {
  if (!configured()) throw new Error('请先配置云端');
  const c = cfg(), a = adapter();
  const json = Store.exportJSON();
  if (!json || !json.trim()) throw new Error('本地数据为空，无法上传');
  const content = b64enc(json);
  if (!content) throw new Error('编码后备份内容为空');
  // 先取 sha：存在则更新，不存在则新建
  let sha = null;
  try { const h = await getHead(); if (h && h.exists) sha = h.sha; } catch (e) { /* 按新建处理 */ }
  const body = {
  message: '工作台备份 ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
  content,
  branch: branch(),
  };
  if (sha) body.sha = sha;
  const r = await a.write(c.owner, c.repo, filePath(), c.token, body);
  if (!r.ok) {
  let msg = '';
  try { msg = (await r.json()).message || ''; } catch (e) {}
  throw new Error('上传失败 HTTP ' + r.status + (msg ? '：' + msg : ''));
  }
  // 上传成功后立即回读验证，防止平台返回成功但实际写入空文件
  try {
  const h2 = await getHead();
  if (!h2 || !h2.exists) throw new Error('上传后回读失败：文件不存在');
  if (!h2.content || !h2.content.trim()) throw new Error('上传后回读失败：云端文件内容为空（size=' + (h2.size || 0) + '）');
  const json2 = b64dec(String(h2.content).replace(/\s/g, ''));
  if (!json2 || !json2.trim()) throw new Error('上传后回读失败：解码后为空');
  if (!Store.importJSON(json2)) throw new Error('上传后回读失败：数据无法导入');
  } catch (e) {
  throw new Error('上传已成功，但回读验证失败：' + e.message + '；请检查网络或重新上传');
  }
  Store.update((st) => { st.cloud = st.cloud || {}; st.cloud.lastSync = new Date().toISOString(); });
  return true;
  }

  // 从云端恢复：下载 JSON 并导入
  async function download() {
  if (!configured()) throw new Error('请先配置云端');
  const h = await getHead();
  if (!h || !h.exists) throw new Error('云端暂无备份文件');
  const hasContent = !!(h.content && h.content.trim());
  const raw = String(h.content || '').replace(/\s/g, '');
  // 尝试 1：当作 base64（标准备份格式）解码后导入
  try {
  const json = b64dec(raw);
  if (Store.importJSON(json)) return true;
  } catch (e) { /* 解码失败，继续尝试其它格式 */ }
  // 尝试 2：文件本身可能就是明文 JSON（未做 base64 包装）
  try {
  if (Store.importJSON(raw)) return true;
  } catch (e) { /* 继续 */ }
  // 两种格式都失败 → 抛出详细诊断信息
  const info = [
  '平台=' + provider(),
  'branch=' + branch(),
  'path=' + filePath(),
  'size=' + (h.size == null ? '未知' : h.size),
  'content=' + (hasContent ? '非空' : '为空'),
  'sha=' + (h.sha ? h.sha.slice(0, 12) : '无'),
  'preview=' + (raw ? raw.slice(0, 60) : '（空）'),
  ].join(' | ');
  throw new Error('云端数据格式异常，无法识别。' + info + '。请重新上传一份备份覆盖它');
  }

  // 验证配置并返回默认分支
  async function testConfig(owner, repo, token, prov) {
  const a = ADAPTERS[prov] || ADAPTERS.gitee;
  const r = await a.verify(owner, repo, token);
  if (r.status === 404) throw new Error('仓库不存在或无权限（请确认仓库名、令牌及权限）');
  if (!r.ok) {
  let msg = '';
  try { msg = (await r.json()).message || ''; } catch (e) {}
  throw new Error('验证失败 HTTP ' + r.status + (msg ? '：' + msg : ''));
  }
  const j = await r.json();
  return { ok: true, branch: j.default_branch || a.defaultBranch };
  }

  window.Cloud = { configured, getHead, upload, download, testConfig, cfg, provider, adapters: ADAPTERS };
})();
