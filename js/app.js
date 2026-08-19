/* ============================================================
  应用骨架 · 路由 / 导航 / 备份 / 全局动效
  ============================================================ */
(function () {
  const NAV = [
  { id: 'dashboard', emoji: '<img class="emoji" src="assets/icons/hk-07.png" alt=""/>', label: '万能工作台' },
  { id: 'checkin', emoji: '<img class="emoji" src="assets/icons/hk-09.png" alt=""/>', label: '专注打卡' },
  { id: 'skill', emoji: '<img class="emoji" src="assets/icons/hk-01.png" alt=""/>', label: '技能学习' },
  { id: 'english', emoji: '<img class="emoji" src="assets/icons/hk-27.png" alt=""/>', label: '英语学习' },
  { id: 'study', emoji: '<img class="emoji" src="assets/icons/hk-38.png" alt=""/>', label: '复习计划' },
  { id: 'ddl', emoji: '<img class="emoji" src="assets/icons/hk-41.png" alt=""/>', label: 'DDL' },
  { id: 'finance', emoji: '<img class="emoji" src="assets/icons/hk-02.png" alt=""/>', label: '记账存钱' },
  { id: 'discipline', emoji: '<img class="emoji" src="assets/icons/hk-06.png" alt=""/>', label: '自律成长' },
  { id: 'review', emoji: '<img class="emoji" src="assets/icons/hk-37.png" alt=""/>', label: '月度复盘' },
  { id: 'travel', emoji: '<img class="emoji" src="assets/icons/hk-35.png" alt=""/>', label: '假期规划' },
  ];
  const TITLES = {
  dashboard: '万能工作台', study: '复习计划', ddl: 'DDL',
  finance: '记账存钱', discipline: '自律成长', travel: '假期规划',
  review: '月度复盘', english: '英语学习', skill: '技能学习', checkin: '专注打卡计时',
  };
  // 首页与学习计划已拆分为独立页面（dashboard.js / study.js）

  const ROUTE = { dashboard: 'dashboard', study: 'study' };
  let current = 'dashboard';

  function route() {
  let id = (location.hash || '').replace('#/', '').replace('#', '') || 'dashboard';
  if (!NAV.some((n) => n.id === id)) id = 'dashboard';
  const pageId = ROUTE[id] || id;
  current = id;
  window.__currentPage = id; // 暴露给各页面异步回调判断"当前页是否还是我"
  document.getElementById('pageTitle').textContent = TITLES[id];
  // 高亮
  UI.$all('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.nav === id));
  UI.$all('.bn-item').forEach((el) => el.classList.toggle('active', el.dataset.nav === id));
  (window.Pages[pageId] || window.Pages.dashboard)();
  wireCommon();
  closeSidebar();
  window.scrollTo(0, 0);
  }

  function wireCommon() { /* 折叠已由 #content 委托处理，无需逐元素绑定 */ }

  // ---- 侧栏 / 底部导航渲染 ----
  function buildNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = NAV.map((n) => `<button class="nav-item" data-nav="${n.id}"><span class="emoji">${n.emoji}</span><span>${n.label}</span></button>`).join('');
  nav.addEventListener('click', (e) => {
  const b = e.target.closest('[data-nav]'); if (!b) return;
  location.hash = '#/' + b.dataset.nav;
  });
  // 底部导航（移动端）
  let bn = document.querySelector('.bottom-nav');
  if (!bn) {
  bn = document.createElement('nav'); bn.className = 'bottom-nav';
  document.body.appendChild(bn);
  }
  bn.innerHTML = NAV.map((n) => `<button class="bn-item" data-nav="${n.id}"><span class="e">${n.emoji}</span><span>${n.label}</span></button>`).join('');
  bn.addEventListener('click', (e) => {
  const b = e.target.closest('[data-nav]'); if (!b) return;
  location.hash = '#/' + b.dataset.nav;
  });
  // 移动端遮罩
  let scrim = document.querySelector('.scrim');
  if (!scrim) { scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.appendChild(scrim); }
  scrim.addEventListener('click', closeSidebar);
  document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  scrim.classList.toggle('show');
  });
  }
  function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const scrim = document.querySelector('.scrim'); if (scrim) scrim.classList.remove('show');
  }

  // ---- 备份 ----
  function exportBackup() {
  const data = Store.exportJSON();
  const d = new Date();
  const name = 'cw-backup-' + d.getFullYear() + ('' + (d.getMonth() + 1)).padStart(2, '0') + ('' + d.getDate()).padStart(2, '0') + '.json';
  NativeIO.writeText(name, data).then((r) => {
    if (r && r.ok) {
      if (r.native) UI.toast('已写入手机下载目录：' + name, 'ok');
      else UI.toast('已导出完整备份 JSON', 'ok');
    } else {
      UI.toast('导出失败：' + ((r && r.error) || '未知错误'), 'warn');
    }
  });
  }
  async function importBackup() {
  const text = await NativeIO.pickText();
  if (text == null) return;
  if (Store.importJSON(text)) { UI.toast('导入成功，数据已恢复', 'ok'); route(); }
  else UI.toast('导入失败：文件格式不正确', 'warn');
  }

  // ---- 全局存钱罐反馈 ----
  const CHEERS = ['奖励 +1元 到账', '又完成一项，真棒！', '自律的你在发光', '奖励金又多啦～', '坚持就是胜利'];
  function globalEarn(detail) {
  UI.toast(CHEERS[Math.floor(Math.random() * CHEERS.length)], 'love');
  const coin = document.createElement('div');
  coin.className = 'piggy-anim-coin';
  coin.style.position = 'fixed';
  coin.style.left = '50%'; coin.style.top = '70px';
  coin.style.zIndex = 400;
  document.body.appendChild(coin);
  setTimeout(() => coin.remove(), 1050);
  }
  function globalWithdraw(detail) {
  UI.toast('已扣减 ' + D.money(detail.amount) + '， Enjoy~', 'ok');
  }

  // ---- 侧栏存钱罐余额 ----
  function renderSidebarPiggy() {
  const el = document.getElementById('sidebarPiggyValue');
  if (el) el.textContent = D.money(Store.get().piggy.balance || 0);
  }

  // ---- 提醒设置弹窗（微信推送 / 日历订阅 / 本地日历 三 tab）----
  function openRemindModal() {
  const cal = Store.get().cal || {};
  const push = Store.get().push || {};
  const local = cal.local || {};
  const localAuthorized = !!local.authorized;
  const localStatusText = localAuthorized
  ? ('已授权 · 最近同步 ' + (local.syncedCount || 0) + ' 个日程（' + new Date(local.lastAt).toLocaleString('zh-CN') + '）')
  : '尚未授权本地日历';
  const nativeOn = !!(window.NativeCalendar && window.NativeCalendar.available());
  const cloudOn = !!cal.backendUrl;

  const mask = UI.openModal({
  title: '🔔 提醒设置', icon: '<img class="ic" src="assets/icons/hk-41.png" alt=""/>',
  body: `
  <div class="muted-text mb8">统一管理三类提醒：微信推送 / 手机日历订阅 / 本地日历写入。点下方按钮分别配置。</div>
  <div class="grid grid-3" style="gap:8px;margin-bottom:10px">
  <button type="button" class="btn btn-soft btn-sm rtab" data-rtab="push">💬 微信推送</button>
  <button type="button" class="btn btn-soft btn-sm rtab" data-rtab="cal">📅 日历订阅</button>
  <button type="button" class="btn btn-soft btn-sm rtab" data-rtab="local">📲 本地日历</button>
  </div>

  <!-- Tab: 微信推送 -->
  <div data-rpane="push">
  <div class="field">
  <label>SendKey（推送密钥）</label>
  <input class="input" id="rPushToken" value="${UI.esc(push.token || '')}" placeholder="SCT 开头，Server酱官网获取"/>
  </div>
  <div class="field">
  <label>后端地址（选填，关页面后自动推送）</label>
  <input class="input" id="rPushBackend" value="${UI.esc(push.backendUrl || '')}" placeholder="https://your-server:3000"/>
  <div style="font-size:12px;color:var(--text-faint);margin-top:6px">填写后即使关闭网页，后端也会每 30 分钟自动扫描并推送 DDL 提醒到微信。需运行 <code>server.js</code>。</div>
  </div>
  <label class="row" style="align-items:center;gap:8px;cursor:pointer;font-weight:700;margin:8px 0">
  <input type="checkbox" id="rPushEnable" ${push.enabled ? 'checked' : ''}/>
  <span>开启微信推送</span>
  </label>
  </div>

  <!-- Tab: 日历订阅 + 云端同步 -->
  <div data-rpane="cal" style="display:none">
  <div class="field">
  <label>后端地址</label>
  <input class="input" id="rCalBackend" value="${UI.esc(cal.backendUrl || '')}" placeholder="如 https://cw-backup-production.up.railway.app"/>
  <div style="font-size:12px;color:var(--text-faint);margin-top:6px">部署 <code>server.js</code> 后填入地址，可生成可订阅日历链接。DDL 自动进手机日历并到期提醒。无后端也可在「学业 DDL」页下载 .ics 导入。</div>
  </div>
  <div class="field">
  <label>固定客户端 ID（多设备共用同一日历，留空则本机自动生成）</label>
  <input class="input" id="rCalFixedId" value="${UI.esc(cal.clientId || '')}" placeholder="如 my-workbench（两设备填相同即共享日历与跨设备 DDL）"/>
  </div>
  <div class="field">
  <label>提前提醒时间</label>
  <div class="row gap8">
  <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rRm1" ${cal.reminders && cal.reminders.indexOf(1440) >= 0 ? 'checked' : ''}/> 1 天前</label>
  <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rRm2" ${cal.reminders && cal.reminders.indexOf(720) >= 0 ? 'checked' : ''}/> 12 小时前</label>
  <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rRm3" ${cal.reminders && cal.reminders.indexOf(60) >= 0 ? 'checked' : ''}/> 1 小时前</label>
  </div>
  </div>
  </div>

  <!-- Tab: 本地日历 -->
  <div data-rpane="local" style="display:none">
  ${nativeOn
  ? `<div class="flex-wrap gap8 mb8">
  <button type="button" class="btn btn-sm" id="rLocalSync">${localAuthorized ? '重新同步到系统日历' : '一键写入系统日历'}</button>
  ${localAuthorized ? '<button type="button" class="btn btn-soft btn-sm" id="rLocalRevoke">清除系统日历日程</button>' : ''}
  </div>
  <div class="muted-text">${localStatusText}</div>
  <div class="muted-text mt8" style="font-size:12px">💡 vivo/华为/小米/鸿蒙等国产系统的日历 App 默认不显示 LOCAL 账户日历（系统行为，无法绕过）。遇到这种情况时，会自动把 webcal 订阅链接复制到剪贴板——到系统日历 App 「通过链接订阅」粘贴即可。</div>`
  : `<div class="muted-text" style="color:var(--text-faint);margin-bottom:8px">当前是浏览器环境，无法直接写入系统日历。请用下面任一方式让 DDL 进手机日历：</div>
  <button type="button" class="btn btn-sm" id="rLocalWebcal" style="margin-bottom:8px">复制订阅链接（推荐）</button>
  <button type="button" class="btn btn-soft btn-sm" id="rLocalIcs">下载 .ics 文件</button>
  <div class="muted-text mt8" style="font-size:12px">订阅链接需先填好「📅 日历订阅」tab 里的后端地址；国产日历 App 大多不支持 .ics 导入，首选订阅链接。</div>`}
  </div>
  `,
  actions: [
  { label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: '测试推送', cls: 'btn-soft', onClick: () => {
  const token = (UI.val('#rPushToken') || '').trim();
  const backendUrl = (UI.val('#rPushBackend') || '').trim().replace(/\/$/, '');
  if (!token) return UI.toast('请先填写 SendKey', 'warn');
  UI.toast('正在发送测试推送…', 'ok');
  if (window.doPush) doPush('serverchan', token, '测试推送', '大学生AI万能工作台 · 微信推送绑定成功！', backendUrl, '')
  .then((r) => { if (r.ok) UI.toast('测试推送成功，请查看微信', 'ok'); else UI.toast('推送失败：' + r.error, 'warn'); });
  } },
  { label: '复制订阅链接', cls: 'btn-soft', onClick: () => {
  const backendUrl = (UI.val('#rCalBackend') || '').trim().replace(/\/$/, '');
  if (!backendUrl) return UI.toast('请先填写后端地址', 'warn');
  const fixedId = (UI.val('#rCalFixedId') || '').trim();
  const cid = fixedId || getClientId();
  const url = backendUrl + '/api/ddl/calendar.ics?clientId=' + encodeURIComponent(cid);
  const webcal = 'webcal://' + url.replace(/^https?:\/\//, '');
  try {
  if (navigator.clipboard) { navigator.clipboard.writeText(webcal).then(() => UI.toast('订阅链接已复制（含 webcal:// 协议）', 'ok'), () => fallbackCopy(webcal)); }
  else fallbackCopy(webcal);
  } catch (e) { fallbackCopy(webcal); }
  function fallbackCopy(text) {
  const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); UI.toast('订阅链接已复制', 'ok'); } catch (e) { UI.toast('复制失败，请手动复制', 'warn'); }
  document.body.removeChild(ta);
  }
  } },
  { label: '保存并同步到云端', onClick: () => {
  const pushToken = (UI.val('#rPushToken') || '').trim();
  const pushBackend = (UI.val('#rPushBackend') || '').replace(/\/$/, '').trim();
  const pushEnabled = UI.$('#rPushEnable').checked && !!pushToken;
  const calBackend = (UI.val('#rCalBackend') || '').replace(/\/$/, '').trim();
  const fixedId = (UI.val('#rCalFixedId') || '').trim();
  const cid = fixedId || getClientId();
  const reminders = [];
  if (UI.$('#rRm1') && UI.$('#rRm1').checked) reminders.push(1440);
  if (UI.$('#rRm2') && UI.$('#rRm2').checked) reminders.push(720);
  if (UI.$('#rRm3') && UI.$('#rRm3').checked) reminders.push(60);
  Store.update((st) => {
  st.push = { service: 'serverchan', token: pushToken, uid: '', enabled: pushEnabled, backendUrl: pushBackend };
  st.cal = st.cal || {};
  st.cal.backendUrl = calBackend;
  st.cal.clientId = cid;
  st.cal.reminders = reminders.length ? reminders : [1440, 720, 60];
  st.cal.subscribed = !!calBackend;
  // 与「外刊阅读→联网设置」同步（唯一入口 = cal.backendUrl）
  st.english = st.english || {};
  st.english.readerBackend = calBackend;
  });
  if (pushEnabled) { if (window.syncPush) syncPush(); if (window.checkAndPushDirect) checkAndPushDirect(); }
  if (calBackend && window.syncDDLCloud) syncDDLCloud(false);
  UI.closeModal();
  UI.toast('提醒设置已保存', 'ok');
  // 只在当前页是 DDL 时才刷新，避免从其他页面保存后被强制跳到 DDL 页
  if (window.__currentPage === 'ddl' && window.Pages && Pages.ddl) Pages.ddl();
  } },
  ],
  });

  // tab 切换（直接用 openModal 返回的 mask 引用绑定，最可靠）
  setTimeout(() => {
  if (!mask) return;
  mask.querySelectorAll('.rtab').forEach((btn) => {
  btn.addEventListener('click', () => {
  const tab = btn.dataset.rtab;
  mask.querySelectorAll('[data-rpane]').forEach((p) => p.style.display = 'none');
  const pane = mask.querySelector('[data-rpane="' + tab + '"]');
  if (pane) pane.style.display = '';
  });
  });
  // 本地日历按钮
  const syncBtn = document.getElementById('rLocalSync');
  if (syncBtn && window.NativeCalendar) {
  syncBtn.addEventListener('click', () => {
  UI.toast('正在同步到系统日历…', 'ok');
  window.NativeCalendar.sync().then((r) => {
  if (r.ok) {
  if (r.fallback === 'webcal') UI.toast((r.copied ? '订阅链接已复制' : '订阅链接生成失败') + '，请到系统日历 App 粘贴订阅' + (r.hint ? '（' + r.hint + '）' : ''), 'ok');
  else if (r.fallback === 'ics') UI.toast('已下载 .ics 文件，请到系统日历导入', 'ok');
  else UI.toast('已写入系统日历 ' + r.count + ' 个日程' + (r.where || ''), 'ok');
  }
  else if (r.reason === 'empty') UI.toast('没有可同步的日程', 'warn');
  else if (r.reason === 'denied') UI.toast('日历权限被拒绝，请到系统设置开启', 'warn');
  else UI.toast(r.error || '同步失败', 'warn');
  });
  });
  }
  const revBtn = document.getElementById('rLocalRevoke');
  if (revBtn && window.NativeCalendar) {
  revBtn.addEventListener('click', () => {
  window.NativeCalendar.clearRecord();
  UI.toast('已清除系统日历日程', 'ok');
  });
  }
  // 浏览器环境：复制订阅链接 / 下载 .ics
  const webcalBtn = document.getElementById('rLocalWebcal');
  if (webcalBtn) {
  webcalBtn.addEventListener('click', () => {
  const cal = Store.get().cal || {};
  if (!cal.backendUrl) return UI.toast('请先在「📅 日历订阅」tab 填后端地址并保存', 'warn');
  const url = cal.backendUrl.replace(/\/$/, '') + '/api/ddl/calendar.ics?clientId=' + encodeURIComponent(cal.clientId || 'cw_device');
  const webcal = 'webcal://' + url.replace(/^https?:\/\//, '');
  const fb = (t) => {
  const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.left = '-9999px';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); UI.toast('订阅链接已复制，到系统日历「通过链接订阅」粘贴', 'ok'); } catch (e) { UI.toast('复制失败，请手动复制', 'warn'); }
  document.body.removeChild(ta);
  };
  if (navigator.clipboard) { navigator.clipboard.writeText(webcal).then(() => UI.toast('订阅链接已复制，到系统日历「通过链接订阅」粘贴', 'ok'), () => fb(webcal)); }
  else fb(webcal);
  });
  }
  const icsBtn = document.getElementById('rLocalIcs');
  if (icsBtn) {
  icsBtn.addEventListener('click', () => {
  let cnt = 0;
  if (window.NativeCalendar && window.NativeCalendar.downloadICS) cnt = window.NativeCalendar.downloadICS();
  else if (window.downloadICS) cnt = window.downloadICS();
  UI.toast('已生成 .ics 文件（含 ' + cnt + ' 个日程），请到系统日历导入', 'ok');
  });
  }
  }, 30);
  }

  // ---- 云端同步（码云 Gitee / GitHub 私有仓库）----
  function openSyncModal(forceSetup) {
  const c = Store.get().cloud || {};
  const ready = !forceSetup && c.owner && c.repo && c.token;
  const last = c.lastSync ? new Date(c.lastSync).toLocaleString('zh-CN') : '从未';
  const prov = c.provider || 'gitee';
  const provLabel = (Cloud.adapters[prov] && Cloud.adapters[prov].label) || prov;
  const body = ready
  ? `<div style="background:#fff7ed;border:1px solid #fcd9b6;border-radius:12px;padding:10px 12px;margin-bottom:14px;font-size:12.5px;color:#9a3412;line-height:1.7">
  浏览器清理缓存会丢失本地数据，请定期<b>备份（导出 JSON）</b>或上传云端。
  </div>
  <div style="background:var(--surface-1);border-radius:14px;padding:12px 14px;margin-bottom:14px">
  <div style="font-size:12px;color:var(--text-faint)">云端仓库（${UI.esc(provLabel)}）</div>
  <div style="font-weight:700;margin:2px 0">${UI.esc(c.owner)}/${UI.esc(c.repo)}</div>
  <div style="font-size:12px;color:var(--text-faint)">上次同步：${UI.esc(last)}</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:10px">
  <button class="btn" data-sync="up">上传到 ${UI.esc(provLabel)}（备份）</button>
  <button class="btn btn-soft" data-sync="down">从 ${UI.esc(provLabel)} 恢复（导入）</button>
  <div style="display:flex;gap:8px">
  <button class="btn btn-soft btn-sm" data-sync="exp" style="flex:1">导出本地JSON</button>
  <button class="btn btn-soft btn-sm" data-sync="imp" style="flex:1">导入本地JSON</button>
  </div>
  <button class="btn btn-soft btn-sm" data-sync="set">修改设置</button>
  </div>`
  : `<div style="background:#fff7ed;border:1px solid #fcd9b6;border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:12.5px;color:#9a3412;line-height:1.7">
  浏览器清理缓存会丢失本地数据，请定期<b>备份（导出 JSON）</b>或上传云端。
  </div>
  <div style="font-size:13px;color:var(--text-faint);margin-bottom:12px;line-height:1.6">把数据备份到你自己的私有仓库，电脑/手机可互相同步，电脑关机也能从云端恢复。</div>
  <div class="field"><label>备份平台</label>
  <select class="input" id="sProvider">
  <option value="gitee" ${prov === 'gitee' ? 'selected' : ''}>码云 Gitee（国内直连·免代理·推荐）</option>
  <option value="github" ${prov === 'github' ? 'selected' : ''}>GitHub（需代理）</option>
  </select>
  </div>
  <div class="field"><label>用户名 / 空间地址</label><input class="input" id="sOwner" value="${UI.esc(c.owner || '')}" placeholder="如 zhuliliui"/></div>
  <div class="field"><label>仓库名</label><input class="input" id="sRepo" value="${UI.esc(c.repo || '')}" placeholder="如 cw-backup"/></div>
  <div class="field"><label>私人访问令牌</label><input class="input" id="sToken" value="${UI.esc(c.token || '')}" placeholder="Gitee/GitHub 私人令牌"/></div>
  <div class="field"><label>备份文件名</label><input class="input" id="sPath" value="${UI.esc(c.path || 'cw-backup.json')}"/></div>
  <details style="margin:6px 0;font-size:12px;color:var(--text-faint)">
  <summary style="cursor:pointer;color:var(--primary-strong)">如何配置？（点开看步骤）</summary>
  <ol style="margin:8px 0;padding-left:18px;line-height:1.8">
  <li><b>码云 Gitee</b>（推荐，免代理）：注册 <a href="https://gitee.com" target="_blank" rel="noopener">gitee.com</a> → 新建<b>私有</b>仓库（如 cw-backup，勾选初始化 README）→ 在 <a href="https://gitee.com/profile/personal_access_tokens" target="_blank" rel="noopener">私人令牌</a> 页生成令牌（勾选 projects 权限）→ 填入上方。</li>
  <li><b>GitHub</b>（需代理）：注册 <a href="https://github.com" target="_blank" rel="noopener">github.com</a> → 新建<b>私有</b>仓库 → 在 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">Tokens</a> 页生成令牌（勾选 repo 权限）→ 填入上方。</li>
  <li>点「验证并保存」后，即可上传/恢复。</li>
  </ol>
  <div style="color:var(--text-faint)">令牌仅存在你的浏览器本地，不会发到本站任何服务器。</div>
  </details>`;
  const mask = UI.openModal({
  title: '数据云端同步', icon: '<img class="ic" src="assets/icons/hk-33.png" alt=""/>', body,
  actions: ready
  ? [{ label: '关闭', cls: 'btn-soft', onClick: UI.closeModal }]
  : [
  { label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: '验证并保存', onClick: async () => {
  const owner = UI.val('#sOwner'), repo = UI.val('#sRepo'), token = UI.val('#sToken'), path = UI.val('#sPath') || 'cw-backup.json';
  const prov = UI.val('#sProvider') || 'gitee';
  if (!owner || !repo || !token) return UI.toast('请填写完整', 'warn');
  UI.toast('正在验证…', 'ok');
  let branch = (Cloud.adapters[prov] && Cloud.adapters[prov].defaultBranch) || 'master';
  try { const t = await Cloud.testConfig(owner, repo, token, prov); branch = t.branch; }
  catch (e) { return UI.toast(e.message, 'warn'); }
  Store.update((st) => { st.cloud = { provider: prov, owner, repo, token, path, branch, lastSync: (st.cloud && st.cloud.lastSync) || '' }; });
  UI.closeModal();
  UI.toast('云端已配置，点「备份」即可上传', 'ok');
  } },
  ],
  });
  UI.$all('[data-sync]', mask).forEach((b) => {
  b.onclick = async () => {
  const act = b.dataset.sync;
  if (act === 'set') { openSyncModal(true); return; }
  if (act === 'exp') { exportBackup(); return; }
  if (act === 'imp') { importBackup(); return; }
  if (act === 'up') {
  b.disabled = true; const old = b.textContent; b.textContent = '上传中…';
  try { await Cloud.upload(); UI.toast('已上传备份到云端', 'ok'); UI.closeModal(); }
  catch (e) { UI.toast('上传失败：' + e.message, 'warn'); b.disabled = false; b.textContent = old; }
  }
  if (act === 'down') {
  UI.closeModal();
  UI.confirm('将从云端恢复并覆盖当前本地数据，确定？', async () => {
  UI.toast('恢复中…', 'ok');
  try { await Cloud.download(); UI.toast('已从云端恢复', 'ok'); route(); }
  catch (e) { UI.toast('恢复失败：' + e.message, 'warn'); }
  }, { yesText: '恢复', danger: true });
  }
  };
  });
  }

  // ---- 初始化 ----
  async function init() {
  await Store.init(); // 原生环境优先从 Capacitor 原生存储加载（持久、清缓存不丢）
  if (window.AppUpdater) window.AppUpdater.check(); // 原生 App：启动即检查静默热更新
  buildNav();
  renderSidebarPiggy();
  document.getElementById('exportBtn').addEventListener('click', () => openSyncModal());
  const wb = document.getElementById('calBtn'); if (wb) wb.addEventListener('click', openRemindModal);
  window.addEventListener('hashchange', route);
  window.addEventListener('piggy:earn', (e) => { globalEarn(e); renderSidebarPiggy(); });
  window.addEventListener('piggy:withdraw', (e) => { globalWithdraw(e); renderSidebarPiggy(); });
  window.addEventListener('piggy:deduct', renderSidebarPiggy);
  window.addEventListener('cw:changed', renderSidebarPiggy);
  // 统一委托点击：各页面通过 window.PageHandler 注册处理器，避免重复绑定
  const _content = document.getElementById('content');
  _content.addEventListener('click', (e) => {
  const cbtn = e.target.closest && e.target.closest('.collapse-btn');
  if (cbtn) {
  const card = cbtn.closest('.card');
  if (card) card.classList.toggle('collapsed');
  return;
  }
  if (window.PageHandler) window.PageHandler(e);
  });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  route();
  if (window.AppUpdater) window.AppUpdater.ready(); // 标记当前包正常（热更新防回滚）
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
