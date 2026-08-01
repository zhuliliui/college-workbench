/* ============================================================
   应用骨架 · 路由 / 导航 / 备份 / 全局动效
   ============================================================ */
(function () {
  const NAV = [
    { id: 'dashboard', emoji: '📌', label: '万能工作台' },
    { id: 'study', emoji: '📖', label: '学习复习计划' },
    { id: 'ddl', emoji: '⏰', label: '学业DDL倒计时' },
    { id: 'finance', emoji: '💰', label: '记账存钱' },
    { id: 'discipline', emoji: '⭐', label: '自律成长' },
    { id: 'travel', emoji: '🏖', label: '假期旅行规划' },
    { id: 'review', emoji: '📅', label: '月度目标复盘' },
    { id: 'english', emoji: '📚', label: '考研英语学习' },
    { id: 'skill', emoji: '🛠️', label: '技能学习' },
  ];
  const TITLES = {
    dashboard: '万能工作台', study: '学习复习计划', ddl: '学业DDL倒计时',
    finance: '记账存钱', discipline: '自律成长', travel: '假期旅行规划',
    review: '月度目标复盘', english: '考研英语学习', skill: '技能学习',
  };
  // 首页与学习计划已拆分为独立页面（dashboard.js / study.js）

  const ROUTE = { dashboard: 'dashboard', study: 'study' };
  let current = 'dashboard';

  function route() {
    let id = (location.hash || '').replace('#/', '').replace('#', '') || 'dashboard';
    if (!NAV.some((n) => n.id === id)) id = 'dashboard';
    const pageId = ROUTE[id] || id;
    current = id;
    document.getElementById('pageTitle').textContent = TITLES[id];
    // 高亮
    UI.$all('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.nav === id));
    UI.$all('.bn-item').forEach((el) => el.classList.toggle('active', el.dataset.nav === id));
    (window.Pages[pageId] || window.Pages.dashboard)();
    wireCommon();
    closeSidebar();
    window.scrollTo(0, 0);
  }

  function wireCommon() {
    UI.$all('.collapse-btn').forEach((btn) => {
      if (btn._wired) return; btn._wired = true;
      btn.addEventListener('click', () => { const card = btn.closest('.card'); if (card) card.classList.toggle('collapsed'); });
    });
  }

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
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    UI.toast('已导出完整备份 JSON', 'ok');
  }
  function importBackup() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        if (Store.importJSON(rd.result)) { UI.toast('导入成功，数据已恢复', 'ok'); route(); }
        else UI.toast('导入失败：文件格式不正确', 'warn');
      };
      rd.readAsText(f);
    };
    inp.click();
  }

  // ---- 全局存钱罐反馈 ----
  const CHEERS = ['奖励 +1元 到账 💜', '又完成一项，真棒！', '自律的你在发光 ✨', '奖励金又多啦～', '坚持就是胜利 🌟'];
  function globalEarn(detail) {
    UI.toast('💜 ' + (CHEERS[Math.floor(Math.random() * CHEERS.length)]), 'love');
    const coin = document.createElement('div');
    coin.className = 'piggy-anim-coin';
    coin.style.position = 'fixed';
    coin.style.left = '50%'; coin.style.top = '70px';
    coin.style.zIndex = 400;
    document.body.appendChild(coin);
    setTimeout(() => coin.remove(), 1050);
  }
  function globalWithdraw(detail) {
    UI.toast('🎀 已扣减 ' + D.money(detail.amount) + '， Enjoy~', 'ok');
  }

  // ---- 侧栏存钱罐余额 ----
  function renderSidebarPiggy() {
    const el = document.getElementById('sidebarPiggyValue');
    if (el) el.textContent = D.money(Store.get().piggy.balance || 0);
  }

  // ---- 提醒设置弹窗（微信推送 + 日历订阅）----
  function openRemindModal() {
    const cal = Store.get().cal || {};
    const push = Store.get().push || {};
    UI.openModal({
      title: '提醒设置', icon: '🔔',
      body: `
      <div style="font-weight:700;margin-bottom:4px;color:var(--primary-deep)">💬 微信推送（✅ 完全免费）</div>
      <div style="font-size:12px;color:var(--text-faint);margin-bottom:10px">注册 PushPlus 关注公众号即可，无需后端、无需付费。</div>
      <div class="field">
        <label>推送服务</label>
        <select class="input" id="rPushService">
          <option value="pushplus" ${push.service === 'pushplus' ? 'selected' : ''}>PushPlus（推荐，免费 200 条/天）</option>
          <option value="serverchan" ${push.service === 'serverchan' ? 'selected' : ''}>Server酱 Turbo（免费 5 条/天）</option>
        </select>
      </div>
      <div class="field">
        <label>Token / SendKey</label>
        <input class="input" id="rPushToken" value="${UI.esc(push.token || '')}" placeholder="在 PushPlus 或 Server酱 注册后获取"/>
      </div>
      <div class="field">
        <label>后端地址（选填，关页面后自动推送）</label>
        <input class="input" id="rPushBackend" value="${UI.esc(push.backendUrl || '')}" placeholder="https://your-server:3000"/>
        <div style="font-size:12px;color:var(--text-faint);margin-top:6px">填写后即使关闭网页，后端也会每 30 分钟自动扫描并推送 DDL 提醒到微信。需运行 <code>server.js</code>。</div>
      </div>
      <div class="field" style="margin-top:12px">
        <label class="row" style="align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="rPushEnable" ${push.enabled ? 'checked' : ''}/>
          <span>开启微信推送</span>
        </label>
      </div>
      <hr style="border:none;border-top:1px solid var(--surface-2);margin:16px 0"/>
      <div style="font-weight:700;margin-bottom:8px;color:var(--primary-deep)">📅 手机日历订阅</div>
      <div class="field">
        <label>后端地址</label>
        <input class="input" id="rCalBackend" value="${UI.esc(cal.backendUrl || '')}" placeholder="https://your-server.example.com"/>
        <div style="font-size:12px;color:var(--text-faint);margin-top:6px">部署 <code>server.js</code> 后填入地址，可生成可订阅日历链接。DDL 自动进手机日历并到期提醒。无后端也可在「学业 DDL」页下载 .ics 导入。</div>
      </div>
      <div class="field" style="margin-top:12px">
        <label class="row" style="align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="rCalEnable" ${cal.subscribed ? 'checked' : ''}/>
          <span>开启日历订阅同步</span>
        </label>
      </div>`,
      actions: [
        { label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
        { label: '🔔 测试推送', cls: 'btn-soft', onClick: () => {
          const service = UI.val('#rPushService') || 'pushplus';
          const token = (UI.val('#rPushToken') || '').trim();
          const backendUrl = (UI.val('#rPushBackend') || '').trim().replace(/\/$/, '');
          if (!token) return UI.toast('请先填写 Token', 'warn');
          UI.toast('正在发送测试推送…', 'ok');
          if (window.doPush) doPush(service, token, '🔔 测试推送', '大学生AI万能工作台 · 微信推送绑定成功！', backendUrl)
            .then((r) => { if (r.ok) UI.toast('测试推送成功，请查看微信', 'ok'); else UI.toast('推送失败：' + r.error, 'warn'); });
        } },
        { label: '保存', onClick: () => {
          const pushService = UI.val('#rPushService') || 'pushplus';
          const pushToken = (UI.val('#rPushToken') || '').trim();
          const pushBackend = (UI.val('#rPushBackend') || '').replace(/\/$/, '').trim();
          const pushEnabled = UI.$('#rPushEnable').checked && !!pushToken;
          const calBackend = (UI.val('#rCalBackend') || '').replace(/\/$/, '').trim();
          const calSubscribed = UI.$('#rCalEnable').checked && !!calBackend;
          Store.update((st) => {
            st.push = { service: pushService, token: pushToken, enabled: pushEnabled, backendUrl: pushBackend };
            st.cal = st.cal || {};
            st.cal.backendUrl = calBackend;
            st.cal.subscribed = calSubscribed;
          });
          if (pushEnabled) { if (window.syncPush) syncPush(); if (window.checkAndPushDirect) checkAndPushDirect(); }
          if (calSubscribed && window.syncCalendar) syncCalendar();
          UI.closeModal();
          UI.toast('提醒设置已保存', 'ok');
          if (window.Pages && Pages.ddl) Pages.ddl();
        } },
      ],
    });
  }

  // ---- 云端同步（GitHub 私有仓库）----
  function openSyncModal(forceSetup) {
    const c = Store.get().cloud || {};
    const ready = !forceSetup && c.owner && c.repo && c.token;
    const last = c.lastSync ? new Date(c.lastSync).toLocaleString('zh-CN') : '从未';
    const body = ready
      ? `<div style="background:var(--surface-1);border-radius:14px;padding:12px 14px;margin-bottom:14px">
           <div style="font-size:12px;color:var(--text-faint)">云端仓库</div>
           <div style="font-weight:700;margin:2px 0">${UI.esc(c.owner)}/${UI.esc(c.repo)}</div>
           <div style="font-size:12px;color:var(--text-faint)">上次同步：${UI.esc(last)}</div>
         </div>
         <div style="display:flex;flex-direction:column;gap:10px">
           <button class="btn" data-sync="up">☁️ 上传备份到云端</button>
           <button class="btn btn-soft" data-sync="down">☁️ 从云端恢复</button>
           <div style="display:flex;gap:8px">
             <button class="btn btn-soft btn-sm" data-sync="exp" style="flex:1">📥 导出本地JSON</button>
             <button class="btn btn-soft btn-sm" data-sync="set" style="flex:1">⚙️ 修改设置</button>
           </div>
         </div>`
         : `<div style="font-size:13px;color:var(--text-faint);margin-bottom:12px;line-height:1.6">把数据备份到你自己的 <b>GitHub 私有仓库</b>，电脑/手机可互相同步，电脑关机也能从云端恢复。</div>
         <div class="field"><label>GitHub 用户名</label><input class="input" id="sOwner" value="${UI.esc(c.owner || '')}" placeholder="你的 GitHub 用户名"/></div>
         <div class="field"><label>仓库名</label><input class="input" id="sRepo" value="${UI.esc(c.repo || '')}" placeholder="如 cw-backup"/></div>
         <div class="field"><label>私人访问令牌</label><input class="input" id="sToken" value="${UI.esc(c.token || '')}" placeholder="GitHub Personal Access Token"/></div>
         <div class="field"><label>备份文件名</label><input class="input" id="sPath" value="${UI.esc(c.path || 'cw-backup.json')}"/></div>
         <details style="margin:6px 0;font-size:12px;color:var(--text-faint)">
           <summary style="cursor:pointer;color:var(--primary-strong)">如何配置？（点开看步骤）</summary>
           <ol style="margin:8px 0;padding-left:18px;line-height:1.8">
             <li>注册/登录 <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>（免费）</li>
             <li>新建一个 <b>私有</b> 仓库（如 cw-backup），勾选「Add a README file」初始化</li>
             <li>打开 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">Personal Access Tokens</a> 页，生成令牌（勾选 <code>repo</code> 权限）</li>
             <li>把用户名、仓库名、令牌填入上方，点「验证并保存」</li>
           </ol>
           <div style="color:var(--text-faint)">令牌仅存在你的浏览器本地，不会发到本站任何服务器。</div>
         </details>`;
    const mask = UI.openModal({
      title: '☁️ 数据云端同步', icon: '☁️', body,
      actions: ready
        ? [{ label: '关闭', cls: 'btn-soft', onClick: UI.closeModal }]
        : [
            { label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
            { label: '验证并保存', onClick: async () => {
                const owner = UI.val('#sOwner'), repo = UI.val('#sRepo'), token = UI.val('#sToken'), path = UI.val('#sPath') || 'cw-backup.json';
                if (!owner || !repo || !token) return UI.toast('请填写完整', 'warn');
                UI.toast('正在验证…', 'ok');
                let branch = 'master';
                try { const t = await Cloud.testConfig(owner, repo, token); branch = t.branch; }
                catch (e) { return UI.toast(e.message, 'warn'); }
                Store.update((st) => { st.cloud = { provider: 'github', owner, repo, token, path, branch, lastSync: (st.cloud && st.cloud.lastSync) || '' }; });
                UI.closeModal();
                UI.toast('☁️ 云端已配置，点「备份」即可上传', 'ok');
              } },
          ],
    });
    UI.$all('[data-sync]', mask).forEach((b) => {
      b.onclick = async () => {
        const act = b.dataset.sync;
        if (act === 'set') { openSyncModal(true); return; }
        if (act === 'exp') { exportBackup(); return; }
        if (act === 'up') {
          b.disabled = true; const old = b.textContent; b.textContent = '⏳ 上传中…';
          try { await Cloud.upload(); UI.toast('☁️ 已上传备份到云端', 'ok'); UI.closeModal(); }
          catch (e) { UI.toast('上传失败：' + e.message, 'warn'); b.disabled = false; b.textContent = old; }
        }
        if (act === 'down') {
          UI.closeModal();
          UI.confirm('将从云端恢复并覆盖当前本地数据，确定？', async () => {
            UI.toast('⏳ 恢复中…', 'ok');
            try { await Cloud.download(); UI.toast('☁️ 已从云端恢复', 'ok'); route(); }
            catch (e) { UI.toast('恢复失败：' + e.message, 'warn'); }
          }, { yesText: '恢复', danger: true });
        }
      };
    });
  }

  // ---- 初始化 ----
  function init() {
    Store.load();
    buildNav();
    renderSidebarPiggy();
    document.getElementById('exportBtn').addEventListener('click', () => openSyncModal());
    const wb = document.getElementById('calBtn'); if (wb) wb.addEventListener('click', openRemindModal);
    // 备份提示栏内的导入入口
    const hint = document.getElementById('backupHint');
    if (hint && !hint.querySelector('.import-link')) {
      const a = document.createElement('a'); a.className = 'import-link'; a.href = '#';
      a.style.cssText = 'margin-left:auto;color:var(--primary-strong);text-decoration:none;font-weight:600;';
      a.textContent = '导入备份';
      a.addEventListener('click', (e) => { e.preventDefault(); importBackup(); });
      hint.appendChild(a);
    }
    window.addEventListener('hashchange', route);
    window.addEventListener('piggy:earn', (e) => { globalEarn(e); renderSidebarPiggy(); });
    window.addEventListener('piggy:withdraw', (e) => { globalWithdraw(e); renderSidebarPiggy(); });
    window.addEventListener('cw:changed', renderSidebarPiggy);
    // 统一委托点击：各页面通过 window.PageHandler 注册处理器，避免重复绑定
    document.getElementById('content').addEventListener('click', (e) => { if (window.PageHandler) window.PageHandler(e); });
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    route();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
