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
  // 大文件内容读取（contents API 超 1MB 不返回 content 时，用 git blob API 取完整内容）
  async getBlob(o, r, sha, token) {
  const u = `https://gitee.com/api/v5/repos/${enc(o)}/${enc(r)}/git/blobs/${enc(sha)}?access_token=${enc(token)}`;
  return fetch(u, { headers: { 'Accept': 'application/json' } });
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
  // 大文件内容读取（contents API 超 1MB 返回空 content 时用 git blob API）
  async getBlob(o, r, sha, token) {
  const u = `https://api.github.com/repos/${enc(o)}/${enc(r)}/git/blobs/${enc(sha)}`;
  return fetch(u, { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' } });
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
  // 上传成功后立即回读验证，防止平台返回成功但实际写入空文件（大文件走 blob 兜底）
  try {
  const { raw: r2 } = await getContent();
  if (!r2 || !r2.trim()) throw new Error('上传后回读失败：云端文件内容为空');
  const json2 = b64dec(r2);
  if (!json2 || !json2.trim()) throw new Error('上传后回读失败：解码后为空');
  if (!Store.importJSON(json2)) throw new Error('上传后回读失败：数据无法导入');
  } catch (e) {
  throw new Error('上传已成功，但回读验证失败：' + e.message + '；请检查网络或重新上传');
  }
  Store.update((st) => { st.cloud = st.cloud || {}; st.cloud.lastSync = new Date().toISOString(); });
  return true;
  }

  // 读取云端备份完整内容（base64 文本）：contents API 超 1MB 不返回 content 时，用 git blob API 兜底
  async function getContent() {
  if (!configured()) throw new Error('请先配置云端');
  const h = await getHead();
  if (!h || !h.exists) throw new Error('云端暂无备份文件');
  if (h.content && h.content.trim()) return { raw: String(h.content).replace(/\s/g, ''), sha: h.sha, size: h.size };
  // 大文件：content 为空 → 用 blob API 取完整内容
  if (h.sha) {
  const c = cfg(), a = adapter();
  const r = await a.getBlob(c.owner, c.repo, h.sha, c.token);
  if (r.ok) {
    const j = await r.json();
    if (j && j.content) return { raw: String(j.content).replace(/\s/g, ''), sha: h.sha, size: j.size || h.size };
  }
  }
  throw new Error('云端备份文件内容读取失败（文件过大或接口异常，size=' + (h.size || '未知') + '）');
  }

  // 从云端恢复：下载 JSON 并导入
  async function download() {
  if (!configured()) throw new Error('请先配置云端');
  const { raw, sha, size } = await getContent();
  const hasContent = !!(raw && raw.trim());
  // 尝试 1：当作 base64（标准备份格式）解码后导入
  try {
  const json = b64dec(raw);
  if (Store.importJSON(json)) {
    // 导入成功后，把本地 lastSync 同步为备份里的云端同步时间，避免下次自动导入重复执行
    try {
    const st = JSON.parse(json);
    const cloudSync = (st.cloud && st.cloud.lastSync) || new Date().toISOString();
    Store.update((c2) => { c2.cloud = c2.cloud || {}; c2.cloud.lastSync = cloudSync; });
    } catch (e) {}
    return true;
  }
  } catch (e) { /* 解码失败，继续尝试其它格式 */ }
  // 尝试 2：文件本身可能就是明文 JSON（未做 base64 包装）
  try {
  if (Store.importJSON(raw)) {
    try {
    const st = JSON.parse(raw);
    const cloudSync = (st.cloud && st.cloud.lastSync) || new Date().toISOString();
    Store.update((c2) => { c2.cloud = c2.cloud || {}; c2.cloud.lastSync = cloudSync; });
    } catch (e) {}
    return true;
  }
  } catch (e) { /* 继续 */ }
  // 两种格式都失败 → 抛出详细诊断信息
  const info = [
  '平台=' + provider(),
  'branch=' + branch(),
  'path=' + filePath(),
  'size=' + (size == null ? '未知' : size),
  'content=' + (hasContent ? '非空' : '为空'),
  'sha=' + (sha ? sha.slice(0, 12) : '无'),
  'preview=' + (raw ? raw.slice(0, 60) : '（空）'),
  ].join(' | ');
  throw new Error('云端数据格式异常，无法识别。' + info + '。请重新上传一份备份覆盖它');
  }

  // 打开网页自动导入最新备份（2026-08-22）：仅在「云端备份比本地新」时导入，避免覆盖本地更新
  // - 读取云端备份里的 cloud.lastSync 与本地 lastSync 比较；云端更新才下载导入
  // - 会话内只尝试一次（sessionStorage 防重复）
  async function autoImportIfNewer() {
  if (!configured()) return false;
  try {
  if (sessionStorage.getItem('cw_auto_import_done')) return false; // 本会话已检查过
  sessionStorage.setItem('cw_auto_import_done', '1');
  const { raw } = await getContent();
  let cloudSync = '';
  try { const st = JSON.parse(b64dec(raw)); cloudSync = (st.cloud && st.cloud.lastSync) || ''; } catch (e) { return false; }
  if (!cloudSync) return false;
  const localSync = (Store.get().cloud || {}).lastSync || '';
  if (localSync && cloudSync <= localSync) return false; // 云端不新 → 跳过
  await download();
  try { UI.toast('已自动导入云端最新备份', 'ok'); } catch (e) {}
  return true;
  } catch (e) { /* 网络失败/未配置：静默，下次打开再试 */ return false; }
  }

  // 自动备份改为「关闭页面触发」（2026-08-22 v2）：每次离开页面都上传（不再按天限次）
  // - 页面打开立即补传一次；visibilitychange(hidden) + pagehide 触发
  // - 防抖：5 分钟内不重复上传（避免频繁切后台/刷新触发多次 API 调用）
  let _autoRunning = false;
  let _lastAutoAt = 0;
  function scheduleAutoBackup() {
  if (_autoRunning) return; _autoRunning = true;
  const triggerBackup = async (reason) => {
  if (!configured()) return; // 未配置云端（无 owner/repo/token）不启用
  const now = Date.now();
  if (now - _lastAutoAt < 5 * 60 * 1000) return; // 5 分钟内已上传过 → 跳过
  _lastAutoAt = now; // 先占位，避免并发重复
  try {
  await upload();
  try { console.log('[cloud] 关闭触发自动备份成功', reason, new Date().toISOString()); } catch (e) {}
  } catch (e) {
  // 失败：整个会话只提示 1 次，避免反复弹窗
  try {
  if (!sessionStorage.getItem('cw_auto_backup_warned')) { sessionStorage.setItem('cw_auto_backup_warned', '1'); UI.toast('自动备份失败：' + (e && e.message ? e.message : '网络错误') + '（下次离开页面会重试）', 'warn'); }
  } catch (e2) { /* 隐私模式忽略 */ }
  }
  };
  triggerBackup('页面打开'); // 进入页面立刻补传一次（兼容老用户的错过补传）
  document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') triggerBackup('页面隐藏');
  });
  window.addEventListener('pagehide', () => triggerBackup('页面卸载'));
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

  window.Cloud = { configured, getHead, upload, download, autoImportIfNewer, testConfig, cfg, provider, adapters: ADAPTERS, scheduleAutoBackup };
})();
