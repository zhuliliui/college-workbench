/* ============================================================
   原生 App 静默热更新（Capacitor Updater）
   - 仅在原生 APP（window.Capacitor 存在）下生效；浏览器/PWA 自动跳过
   - 启动后自动拉取 manifest，比对版本，新则下载 zip 并热替换，不用重装 apk
   - 走原生 HTTP（CapacitorHttp / CapacitorUpdater 均为原生请求），不受浏览器 CORS 限制
   依赖（需 npm install）：@capgo/capacitor-updater（即 CapacitorUpdater 全局）、@capacitor-community/http
   ============================================================ */
(function () {
  // 更新清单地址（国内用 Gitee raw，稳定且免 CORS 困扰；如需更快可改用 jsDelivr：
  //   https://cdn.jsdelivr.net/gh/zhuliliui/college-workbench@updates/manifest.json ）
  const MANIFEST_URL = 'https://gitee.com/monichang/college-workbench/raw/updates/manifest.json';
  const VER_KEY = 'cw_bundle_version'; // 已安装版本号（存 Capacitor Preferences）

  function cap() { return window.Capacitor || null; }
  function isNative() { return Store && Store.isNative ? Store.isNative() : false; }
  function pref() { return Store && Store.nativePref ? Store.nativePref() : null; }
  function updater() { const C = cap(); return C && C.Plugins && C.Plugins.CapacitorUpdater ? C.Plugins.CapacitorUpdater : null; }
  function http() {
    const C = cap();
    if (!C || !C.Plugins) return null;
    // 兼容三种注册名：@capacitor-community/http 的 Http、Capacitor 6 内置 CapacitorHttp、旧版 CapacitorHttp
    return C.Plugins.Http || C.Plugins.CapacitorHttp || null;
  }

  async function getInstalledVersion() {
    const p = pref();
    if (p) { try { const r = await p.get({ key: VER_KEY }); if (r && r.value) return r.value; } catch (_) {} }
    // 首次：回退到打包时写入 dist/version.json 的版本，避免重复下载同版本
    try { const res = await fetch('version.json'); if (res.ok) { const j = await res.json(); return j.version || ''; } } catch (_) {}
    return '';
  }
  async function setInstalledVersion(v) {
    const p = pref();
    if (p) { try { await p.set({ key: VER_KEY, value: v }); } catch (_) {} }
  }

  // 带超时的请求，避免后端/网络卡死阻塞启动
  function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  }
  async function fetchManifest() {
  // 优先用原生 HTTP（CORS 无关）；失败回退普通 fetch
  const H = http();
  if (H) {
  try {
  const r = await withTimeout(H.get({ url: MANIFEST_URL, headers: { 'Accept': 'application/json' } }), 8000);
  if (r && r.status >= 200 && r.status < 300) {
  return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
  }
  } catch (_) {}
  }
  try { const res = await withTimeout(fetch(MANIFEST_URL), 8000); if (res.ok) return await res.json(); } catch (_) {}
  return null;
  }

  // 语义化版本比较：a>b 返回 1，a<b 返回 -1，相等 0
  function verCmp(a, b) {
  const pa = String(a || '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
  const x = pa[i] || 0, y = pb[i] || 0;
  if (x > y) return 1; if (x < y) return -1;
  }
  return 0;
  }

  // 启动后调用：发现新版本则静默热更新
  // 关键修复：失败/无更新/线上版本更旧时一律静默跳过，绝不再弹「更新失败」骚扰用户
  async function check() {
  if (!isNative()) { console.log('[hot] 非原生环境，跳过'); return; }
  const U = updater();
  if (!U) { console.warn('[hot] CapacitorUpdater 未安装，跳过'); return; }
  let manifest, installed;
  try { manifest = await fetchManifest(); installed = await getInstalledVersion(); }
  catch (e) { console.warn('[hot] 检查异常，静默跳过', e); return; }
  if (!manifest || !manifest.version) { console.warn('[hot] 清单拉取失败（网络/CORS），静默跳过'); return; }
  console.log('[hot] 线上版本', manifest.version, '已装', installed);
  // 无更新 或 线上版本不比已装新（避免误降级到旧包）-> 静默跳过
  if (verCmp(manifest.version, installed) <= 0) { console.log('[hot] 已是最新，无需更新'); return; }
  if (!manifest.url) return;

  if (window.UI) UI.toast('发现新版本 ' + manifest.version + '，正在后台更新…', 'ok');
  try {
  const bundle = await U.download({ url: manifest.url, version: String(manifest.version) });
  await U.set({ id: bundle.id });
  await setInstalledVersion(String(manifest.version));
  // 立即重载到新版本（reload 会重启 WebView 加载新包）
  if (window.UI) UI.toast('更新完成，正在重启…', 'ok');
  await U.reload();
  } catch (e) {
  console.warn('[hot] 热更新失败，静默跳过', e); // 不再弹「更新失败」干扰用户
  }
  }

  // 启动成功（新包已稳定）后调用：标记当前包正常，避免异常回滚
  async function ready() {
    if (!isNative()) return;
    const U = updater();
    if (U && U.notifyAppReady) { try { await U.notifyAppReady(); } catch (_) {} }
  }

  window.AppUpdater = { check, ready, MANIFEST_URL };
})();
