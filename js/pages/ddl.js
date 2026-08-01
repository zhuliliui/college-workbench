/* ============================================================
   页面2 · 学业 DDL 倒计时
   ============================================================ */
window.Pages = window.Pages || {};
Pages.ddl = function () {
  const s = Store.get();
  const c = UI.$('#content');
  const ddls = s.ddls.slice().sort((a, b) => (a.done - b.done) || (a.due || '').localeCompare(b.due || ''));
  const total = ddls.length;
  const doneCount = ddls.filter((d) => d.done).length;
  const soon = ddls.filter((d) => !d.done && D.hoursLeft(d.due) <= 48).length;

  const stats = `
  <div class="grid grid-3">
    <div class="stat accent"><div class="label">📋 总 DDL 任务</div><div class="value">${total}</div></div>
    <div class="stat"><div class="label">⏳ 即将到期</div><div class="value" style="color:var(--warn)">${soon}</div><div class="hint">48 小时内</div></div>
    <div class="stat"><div class="label">✅ 已完成</div><div class="value" style="color:var(--success)">${doneCount}</div></div>
  </div>`;

  function card(d) {
    const hl = D.hoursLeft(d.due);
    let level = 'normal', barCls = '', big = D.daysLeftText(d.due);
    if (d.done) { level = 'done'; barCls = 'success'; }
    else if (hl <= 12) { level = 'danger'; barCls = 'danger'; }
    else if (hl <= 24) { level = 'warn'; barCls = 'warn'; }
    const pct = Math.max(0, Math.min(100, d.progress || 0));
    const tag = d.done ? '<span class="tag success">已完成</span>'
      : level === 'danger' ? '<span class="tag danger">紧急 · 12h内</span>'
      : level === 'warn' ? '<span class="tag warn">预警 · 24h内</span>'
      : '<span class="tag muted">进行中</span>';
    const style = d.done ? 'opacity:.6' : (level === 'danger' ? 'border-color:#f3c7c2;background:#fff6f5' : level === 'warn' ? 'border-color:#fbeec2;background:#fffdf4' : '');
    return `<div class="card" style="${style}">
      <div class="flex-between">
        <div class="title" style="font-weight:800;font-size:16px;color:var(--text)">${UI.esc(d.name)}</div>
        ${tag}
      </div>
      <div class="muted-text mt8">截止：${d.due ? D.fmtDateTime(D.parseLDT(d.due)) : '未设置'}</div>
      <div class="flex-between mt12">
        <div class="muted-text">剩余</div>
        <div style="font-size:30px;font-weight:800;color:${d.done ? 'var(--success)' : level === 'danger' ? 'var(--danger)' : level === 'warn' ? '#caa23a' : 'var(--primary-deep)'}">${big}</div>
      </div>
      <div class="progress ${barCls} mt8"><span style="width:${pct}%"></span></div>
      <div class="flex-between mt12 gap8">
        ${d.done ? '' : `<button class="btn btn-success btn-sm" data-act="done" data-id="${d.id}">✓ 完成</button>`}
        <button class="btn btn-soft btn-sm" data-act="edit" data-id="${d.id}">✏️ 编辑</button>
        <button class="btn btn-soft btn-sm" data-act="del" data-id="${d.id}">🗑 删除</button>
      </div>
    </div>`;
  }

  const listHtml = ddls.length
    ? '<div class="grid grid-2">' + ddls.map(card).join('') + '</div>'
    : `<div class="empty"><span class="emoji">⏰</span><div class="t">还没有 DDL</div><div class="s">添加课程作业、考试、提交节点，到期前自动提醒</div></div>`;

  // 手机日历订阅
  const cal = s.cal;
  const calHtml = `
  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">📅</span>手机日历订阅（DDL 自动进手机日历）</div>
      <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">
      <div class="muted-text" style="margin-bottom:12px">把 DDL 同步到后端后，会生成一个可订阅的日历链接。在手机日历 App 里「订阅」该链接，所有 DDL 会自动出现在日历中，并在到期前按设定时间弹窗/通知提醒，无需打开本网页。</div>
      <div class="row">
        <div class="field"><label>定时推送后端地址</label>
          <input class="input" id="calUrl" value="${UI.esc(cal.backendUrl || '')}" placeholder="https://your-server.example.com"/></div>
      </div>
      <div class="field"><label>提前提醒时间</label>
        <div class="row gap8">
          <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rm1" ${cal.reminders.indexOf(1440) >= 0 ? 'checked' : ''}/> 1 天前</label>
          <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rm2" ${cal.reminders.indexOf(720) >= 0 ? 'checked' : ''}/> 12 小时前</label>
          <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rm3" ${cal.reminders.indexOf(60) >= 0 ? 'checked' : ''}/> 1 小时前</label>
        </div>
      </div>
      <div class="flex-wrap gap8 mt8">
        <button class="btn btn-sm" data-act="cal-bind">💾 绑定并同步</button>
        <button class="btn btn-soft btn-sm" data-act="cal-download">⬇️ 下载 .ics（无需后端）</button>
        ${cal.subscribed ? '<button class="btn btn-soft btn-sm" data-act="cal-refresh">🔄 刷新同步</button>' : ''}
        ${cal.subscribed ? '<button class="btn btn-soft btn-sm" data-act="cal-unbind">解绑</button>' : ''}
        <span class="tag ${cal.subscribed ? 'success' : 'muted'}">${cal.subscribed ? '✓ 已订阅' : '未绑定'}</span>
      </div>
      ${cal.subscribed ? `
      <div class="field mt12"><label>订阅链接（复制到手机日历 App 订阅）</label>
        <div class="row gap8"><input class="input" id="calLink" readonly value="${UI.esc(calSubUrl(cal))}"/><button class="btn btn-soft btn-sm" data-act="cal-copy">📋 复制</button></div>
        <div style="font-size:12px;color:var(--text-faint);margin-top:6px">iOS / macOS：日历 App → 添加账户 → 其他 → 添加订阅日历，粘贴上面的 https 链接。Android：用 Google 日历「设置 → 导入」下载的 .ics 文件，或借助支持订阅的日历 App。</div>
      </div>` : ''}
    </div>
  </div>`;

  // 微信推送（通过 PushPlus / Server酱 公众号推送）
  const push = s.push;
  const pushHtml = `
  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">💬</span>微信推送提醒（公众号自动推送）</div>
      <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">
      <div class="muted-text" style="margin-bottom:12px">✅ <b>完全免费</b>——通过 PushPlus 或 Server酱 公众号推送，注册关注公众号即可，<b>无需部署后端</b>。打开本页面时自动检查 DDL 并推送到微信。</div>
      <div class="row">
        <div class="field"><label>推送服务</label>
          <select class="input" id="pushService">
            <option value="pushplus" ${push.service === 'pushplus' ? 'selected' : ''}>PushPlus（推荐，免费 200 条/天）</option>
            <option value="serverchan" ${push.service === 'serverchan' ? 'selected' : ''}>Server酱 Turbo（免费 5 条/天）</option>
          </select>
        </div>
        <div class="field"><label>Token / SendKey</label>
          <input class="input" id="pushToken" value="${UI.esc(push.token || '')}" placeholder="在对应平台注册后获取"/></div>
      </div>
      <div class="row">
        <div class="field"><label>后端地址（选填，不填也能用）</label>
          <input class="input" id="pushBackend" value="${UI.esc(push.backendUrl || '')}" placeholder="留空 = 打开页面时推送；填写 = 关页面也能推送"/></div>
      </div>
      <div class="flex-wrap gap8 mt8">
        <button class="btn btn-sm" data-act="push-save">💾 保存绑定</button>
        <button class="btn btn-soft btn-sm" data-act="push-test">🔔 测试推送</button>
        ${push.enabled ? '<button class="btn btn-soft btn-sm" data-act="push-unbind">解绑</button>' : ''}
        <span class="tag ${push.enabled ? 'success' : 'muted'}">${push.enabled ? '✓ 已绑定' : '未绑定'}</span>
      </div>
      <details style="margin-top:12px"><summary class="muted-text" style="cursor:pointer">📋 3 步搞定免费微信推送（点击展开）</summary>
        <div style="font-size:13px;color:var(--text-faint);margin-top:8px;line-height:1.8">
          <b>推荐 · PushPlus（免费 200 条/天）：</b><br/>
          ① 访问 <a href="https://www.pushplus.plus" target="_blank">pushplus.plus</a> 注册登录<br/>
          ② 在「一对一推送」页面复制你的 Token<br/>
          ③ 微信搜索并关注公众号「<b>pushplus推送加</b>」<br/>
          ④ 将 Token 填入上方，点「测试推送」——微信收到消息就成功了！<br/><br/>
          <b>备选 · Server酱 Turbo（免费 5 条/天）：</b><br/>
          ① 访问 <a href="https://sct.ftqq.com" target="_blank">sct.ftqq.com</a> 微信扫码登录<br/>
          ② 在「Key&API」页面复制 SendKey<br/>
          ③ 将 SendKey 填入上方，点「测试推送」<br/><br/>
          <b>不部署后端也能用：</b>打开本页面时自动检查并推送 DDL 提醒。<br/>
          <b>想关页面也推送？</b>在长期开机的电脑上运行 <code>server.js</code>（免费），把地址填入上方即可。
        </div>
      </details>
    </div>
  </div>`;

  // 遗留问题
  const issues = s.issues;
  const iTotal = issues.length, iSolved = issues.filter((i) => i.solved).length, iOpen = iTotal - iSolved;
  const iHtml = issues.length ? '<div class="list">' + issues.map((i) => `
    <div class="item ${i.solved ? 'done' : ''}" data-id="${i.id}">
      <button class="check" data-act="i-toggle" data-id="${i.id}">${i.solved ? '✓' : ''}</button>
      <div class="body"><div class="name">${UI.esc(i.text)}</div></div>
      <div class="ops"><button class="btn btn-soft btn-icon" data-act="i-del" data-id="${i.id}" title="删除">🗑</button></div>
    </div>`).join('') + '</div>'
    : `<div class="empty"><span class="emoji">🧩</span><div class="t">暂无遗留问题</div><div class="s">记录没搞懂的难题，逐个攻克</div></div>`;

  c.innerHTML = `
  ${stats}
  <div class="card" style="margin-top:16px">
    <div class="card-head"><div class="title"><span class="ic">⏰</span>学业 DDL 清单</div>
      <div class="spacer"></div><button class="btn btn-sm" data-act="add">＋ 新增 DDL</button>
      <button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">${listHtml}</div>
  </div>
  ${calHtml}
  ${pushHtml}
  <div class="card">
    <div class="card-head"><div class="title"><span class="ic">🧩</span>遗留问题记录区</div>
      <div class="spacer"></div>
      <div class="muted-text">总 <b style="color:var(--text)">${iTotal}</b> · 已解决 <b style="color:var(--success)">${iSolved}</b> · 待攻克 <b style="color:var(--danger)">${iOpen}</b></div>
      <button class="btn btn-sm btn-soft" data-act="i-add" style="margin-left:10px">＋ 记录问题</button>
      <button class="collapse-btn" title="折叠">▾</button></div>
    <div class="card-body">${iHtml}</div>
  </div>`;

  // 已订阅则每次打开页面都同步一次，保证日历内容最新
  if (cal.subscribed) syncCalendar();
  // 已启用推送则同步到后端，并在页面打开期间主动检查一次
  if (push.enabled) { syncPush(); checkAndPushDirect(); }

  window.PageHandler = (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'add') return openModal();
    if (act === 'edit') return openModal(id);
    if (act === 'del') return UI.confirm('删除这条 DDL？', () => {
      Store.update((st) => { st.ddls = st.ddls.filter((x) => x.id !== id); }); Pages.ddl();
    });
    if (act === 'done') {
      Store.update((st) => { const x = st.ddls.find((y) => y.id === id); x.done = true; x.progress = 100; });
      Store.earn(1, '完成 DDL 任务');
      syncCalendar();
      syncPush();
      Pages.ddl(); return;
    }
    if (act === 'cal-bind') {
      const backend = (UI.val('#calUrl') || '').trim().replace(/\/$/, '');
      if (!backend) return UI.toast('请填写后端地址', 'warn');
      const reminders = [];
      if (UI.$('#rm1') && UI.$('#rm1').checked) reminders.push(1440);
      if (UI.$('#rm2') && UI.$('#rm2').checked) reminders.push(720);
      if (UI.$('#rm3') && UI.$('#rm3').checked) reminders.push(60);
      Store.update((st) => {
        st.cal = st.cal || {};
        st.cal.backendUrl = backend;
        st.cal.clientId = getClientId();
        st.cal.reminders = reminders.length ? reminders : [1440, 720, 60];
        st.cal.subscribed = true;
      });
      syncCalendar();
      UI.toast('已绑定并同步 DDL 到后端', 'ok'); Pages.ddl(); return;
    }
    if (act === 'cal-refresh') { syncCalendar(); UI.toast('已刷新同步', 'ok'); return; }
    if (act === 'cal-download') { downloadICS(); UI.toast('已生成 .ics 文件', 'ok'); return; }
    if (act === 'cal-unbind') return UI.confirm('解绑日历订阅？', () => {
      Store.update((st) => { st.cal.subscribed = false; st.cal.backendUrl = ''; }); Pages.ddl();
    });
    if (act === 'cal-copy') {
      const link = UI.$('#calLink') ? UI.$('#calLink').value : calSubUrl(Store.get().cal);
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => UI.toast('订阅链接已复制', 'ok'), () => UI.toast('复制失败，请手动复制', 'warn'));
      else UI.toast('当前环境不支持自动复制', 'warn');
      return;
    }
    // ---- 微信推送 ----
    if (act === 'push-save') {
      const service = UI.val('#pushService') || 'pushplus';
      const token = (UI.val('#pushToken') || '').trim();
      const backendUrl = (UI.val('#pushBackend') || '').trim().replace(/\/$/, '');
      if (!token) return UI.toast('请填写 Token / SendKey', 'warn');
      Store.update((st) => { st.push = { service, token, enabled: true, backendUrl }; });
      syncPush();
      UI.toast('已保存微信推送配置' + (backendUrl ? '，DDL 已同步到后端' : ''), 'ok');
      Pages.ddl(); return;
    }
    if (act === 'push-test') {
      const service = UI.val('#pushService') || 'pushplus';
      const token = (UI.val('#pushToken') || '').trim();
      const backendUrl = (UI.val('#pushBackend') || '').trim().replace(/\/$/, '');
      if (!token) return UI.toast('请先填写 Token', 'warn');
      UI.toast('正在发送测试推送…', 'ok');
      doPush(service, token, '🔔 测试推送', '大学生AI万能工作台 · 微信推送绑定成功！\n\n之后 DDL 到期前会自动推送提醒到此微信。', backendUrl)
        .then((r) => { if (r.ok) UI.toast('测试推送成功，请查看微信', 'ok'); else UI.toast('推送失败：' + r.error, 'warn'); });
      return;
    }
    if (act === 'push-unbind') return UI.confirm('解绑微信推送？', () => {
      Store.update((st) => { st.push.enabled = false; st.push.token = ''; });
      Pages.ddl();
    });
    if (act === 'i-add') {
      UI.openModal({ title: '记录遗留问题', icon: '🧩',
        body: `<div class="field"><label>问题描述</label><textarea class="textarea" id="iBody" placeholder="例如：动态规划背包问题还没完全理解"></textarea></div>`,
        actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
          { label: '保存', onClick: () => { const v = UI.val('#iBody'); if (!v) return UI.toast('写点内容吧', 'warn');
            Store.update((st) => st.issues.unshift({ id: Store.uid(), text: v, solved: false }));
            UI.closeModal(); Pages.ddl(); } }] });
      setTimeout(() => UI.$('#iBody') && UI.$('#iBody').focus(), 50); return;
    }
    if (act === 'i-del') return UI.confirm('删除这条问题？', () => {
      Store.update((st) => { st.issues = st.issues.filter((i) => i.id !== id); }); Pages.ddl();
    });
    if (act === 'i-toggle') {
      Store.update((st) => { const x = st.issues.find((y) => y.id === id); x.solved = !x.solved; }); Pages.ddl();
    }
  };

  function openModal(editId) {
    const d = editId ? s.ddls.find((x) => x.id === editId) : null;
    UI.openModal({
      title: d ? '编辑 DDL' : '新增 DDL', icon: '⏰',
      body: `
      <div class="field"><label>任务名称</label><input class="input" id="dName" value="${UI.esc(d ? d.name : '')}" placeholder="如：数据库大作业提交"/></div>
      <div class="row">
        <div class="field"><label>截止日期时间</label><input class="input" id="dDue" type="datetime-local" value="${d ? (d.due || '') : ''}"/></div>
        <div class="field"><label>完成进度 ${d ? d.progress || 0 : 0}%</label>
          <input class="input" id="dProg" type="range" min="0" max="100" value="${d ? (d.progress || 0) : 0}"/></div>
      </div>`,
      actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
        { label: d ? '保存' : '添加', onClick: () => {
          const name = UI.val('#dName'); if (!name) return UI.toast('请填写名称', 'warn');
          const data = { name, due: UI.val('#dDue'), progress: parseInt(UI.val('#dProg')) || 0 };
          Store.update((st) => {
            if (d) Object.assign(st.ddls.find((x) => x.id === editId), data);
            else st.ddls.unshift(Object.assign({ id: Store.uid(), done: false }, data));
          });
          UI.closeModal(); Pages.ddl();
        } }],
    });
    setTimeout(() => UI.$('#dName') && UI.$('#dName').focus(), 50);
  }
};

// 生成/读取本设备 ID，用于后端区分不同客户端（同时写入 cal.clientId）
function getClientId() {
  const cur = Store.get().cal && Store.get().cal.clientId;
  if (cur) return cur;
  let id = localStorage.getItem('cw_client_id');
  if (!id) { id = 'cw_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('cw_client_id', id); }
  Store.update((st) => { st.cal = st.cal || {}; if (!st.cal.clientId) st.cal.clientId = id; });
  return id;
}

// 把当前 DDL 清单 + 提醒配置同步到后端，供日历 feed 使用
function syncCalendar() {
  const cal = Store.get().cal;
  if (!cal || !cal.backendUrl || !cal.subscribed) return;
  const payload = {
    clientId: getClientId(),
    reminders: cal.reminders && cal.reminders.length ? cal.reminders : [1440, 720, 60],
    ddls: Store.get().ddls.map((d) => ({ id: d.id, name: d.name, due: d.due, done: d.done })),
  };
  fetch(cal.backendUrl.replace(/\/$/, '') + '/api/ddl/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
window.syncCalendar = syncCalendar;

// 前端本地生成 .ics 并触发下载（无需后端）
function buildLocalICS(ddls, reminders) {
  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//CollegeWorkbench//DDL//CN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (str) => (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const toLocal = (str) => { const m = ('' + str).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/); return m ? m[1] + m[2] + m[3] + 'T' + m[4] + m[5] + '00' : null; };
  const addHour = (str) => { const d = new Date(str); if (isNaN(d)) return toLocal(str); d.setHours(d.getHours() + 1); const p = (n) => String(n).padStart(2, '0'); return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00'; };
  (ddls || []).filter((d) => d.due && !d.done).forEach((d) => {
    const dt = toLocal(d.due); if (!dt) return;
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + (d.id || 'x') + '@collegeworkbench');
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART:' + dt);
    lines.push('DTEND:' + addHour(d.due));
    lines.push('SUMMARY:' + esc('⏰ DDL：' + (d.name || '未命名')));
    lines.push('DESCRIPTION:' + esc('大学生AI万能工作台 · 截止提醒'));
    (reminders && reminders.length ? reminders : [1440, 720, 60]).forEach((m) => {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push('DESCRIPTION:' + esc('⏰ 即将到期：' + (d.name || '未命名')));
      lines.push('TRIGGER:-PT' + m + 'M');
      lines.push('END:VALARM');
    });
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
function downloadICS() {
  const cal = Store.get().cal;
  const ics = buildLocalICS(Store.get().ddls, cal && cal.reminders);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ddl-calendar.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
window.downloadICS = downloadICS;

// 订阅链接（calendar.ics 的远程地址）
function calSubUrl(cal) {
  if (!cal || !cal.backendUrl || !cal.clientId) return '';
  return cal.backendUrl.replace(/\/$/, '') + '/api/ddl/calendar.ics?clientId=' + encodeURIComponent(cal.clientId);
}
window.calSubUrl = calSubUrl;

// ---------- 微信推送相关 ----------
// 把 DDL 清单 + 推送配置同步到后端（后端 cron 会据此定时推送）
function syncPush() {
  const push = Store.get().push;
  if (!push || !push.enabled || !push.token || !push.backendUrl) return;
  const payload = {
    clientId: getClientId(),
    reminders: (Store.get().cal && Store.get().cal.reminders) || [1440, 720, 60],
    ddls: Store.get().ddls.map((d) => ({ id: d.id, name: d.name, due: d.due, done: d.done })),
    push: { service: push.service, token: push.token },
  };
  fetch(push.backendUrl.replace(/\/$/, '') + '/api/ddl/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
window.syncPush = syncPush;

// 发送一条推送消息（有后端走后端代理；无后端用 GET+allorigins 代理绕过 CORS，完全免费）
async function doPush(service, token, title, content, backendUrl) {
  if (!token) return { ok: false, error: '请先填写 Token' };
  // 有后端：走后端代理（支持 POST，最稳定）
  if (backendUrl) {
    try {
      const r = await fetch(backendUrl.replace(/\/$/, '') + '/api/push/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, token, title, content }),
      }).then((r) => r.json()).catch(() => null);
      if (r && r.ok) return { ok: true };
      return { ok: false, error: (r && r.error) || '后端请求失败' };
    } catch (e) { return { ok: false, error: '无法连接后端：' + (e.message || e) }; }
  }
  // 无后端：用 GET 请求 + allorigins 公共代理绕过 CORS（完全免费，无需部署任何东西）
  const proxy = (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u);
  try {
    if (service === 'pushplus') {
      const apiUrl = 'https://www.pushplus.plus/send?token=' + encodeURIComponent(token) +
        '&title=' + encodeURIComponent(title) + '&content=' + encodeURIComponent(content) + '&template=txt';
      // 先尝试直连（部分浏览器/环境允许），失败再用代理
      let r = null;
      try {
        r = await fetch(apiUrl, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
      } catch (e) {}
      if (!r) {
        r = await fetch(proxy(apiUrl), { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
      }
      if (r && r.code === 200) return { ok: true };
      return { ok: false, error: (r && r.msg) || '推送失败，请检查 Token 是否正确' };
    }
    if (service === 'serverchan') {
      const apiUrl = 'https://sctapi.ftqq.com/' + encodeURIComponent(token) + '.send?title=' +
        encodeURIComponent(title) + '&desp=' + encodeURIComponent(content);
      let r = null;
      try {
        r = await fetch(apiUrl, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
      } catch (e) {}
      if (!r) {
        r = await fetch(proxy(apiUrl), { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
      }
      if (r && r.code === 0) return { ok: true };
      return { ok: false, error: (r && r.message) || '推送失败，请检查 SendKey 是否正确' };
    }
    return { ok: false, error: '不支持的服务' };
  } catch (e) { return { ok: false, error: '推送请求失败：' + (e.message || e) }; }
}
window.doPush = doPush;

// 页面打开时检查 DDL 并主动推送一次（仅本会话一次，无后端时也能收到提醒）
function checkAndPushDirect() {
  const push = Store.get().push;
  if (!push || !push.enabled || !push.token) return;
  if (sessionStorage.getItem('ddl_push_checked')) return;
  sessionStorage.setItem('ddl_push_checked', '1');
  const dueSoon = Store.get().ddls.filter((d) => !d.done && D.hoursLeft(d.due) <= 24);
  if (!dueSoon.length) return;
  const title = '⏰ 你有 ' + dueSoon.length + ' 个 DDL 即将到期';
  const content = dueSoon.map((d) => '· ' + d.name + '（' + D.daysLeftText(d.due) + '）').join('\n') + '\n\n— 大学生AI万能工作台';
  doPush(push.service, push.token, title, content, push.backendUrl).then((r) => {
    if (r.ok) UI.toast('已推送 DDL 提醒到微信', 'ok');
  });
}
window.checkAndPushDirect = checkAndPushDirect;
