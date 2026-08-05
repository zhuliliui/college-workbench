/* ============================================================
  页面2 · 学业 DDL 倒计时
  ============================================================ */
window.Pages = window.Pages || {};
let reminderTimers = [];
let reminderInterval = null;
Pages.ddl = function () {
  const s = Store.get();
  const c = UI.$('#content');
  if (reminderInterval) { clearInterval(reminderInterval); reminderInterval = null; }
  reminderTimers.forEach((t) => clearTimeout(t)); reminderTimers = [];
  const ddls = s.ddls.slice().sort((a, b) => (a.done - b.done) || (a.due || '').localeCompare(b.due || ''));
  const exams = ddls.filter((d) => (d.type || 'ddl') === 'exam' && !d.done);
  const tasks = ddls.filter((d) => (d.type || 'ddl') !== 'exam');
  const total = tasks.length;
  const doneCount = tasks.filter((d) => d.done).length;
  const soon = tasks.filter((d) => !d.done && D.hoursLeft(d.due) <= 48).length;

  const stats = `
  <div class="grid grid-3">
  <div class="stat accent"><div class="label"><img class="ic" src="assets/icons/hk-37.png" alt=""/>总 DDL 任务</div><div class="value">${total}</div></div>
  <div class="stat"><div class="label"><img class="ic" src="assets/icons/hk-41.png" alt=""/>即将到期</div><div class="value" style="color:var(--warn)">${soon}</div><div class="hint">48 小时内</div></div>
  <div class="stat"><div class="label"><img class="ic" src="assets/icons/hk-38.png" alt=""/>已完成</div><div class="value" style="color:var(--success)">${doneCount}</div></div>
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
  <div class="progress ${barCls} mt8"><span data-bar="${d.id}" style="width:${pct}%"></span></div>
  <div class="flex-between mt8 gap8 prog-edit">
  <input type="range" min="0" max="100" value="${pct}" data-prog="${d.id}" class="prog-range" ${d.done ? 'disabled' : ''}/>
  <span class="prog-val" style="font-size:13px;font-weight:700;color:var(--primary-deep);white-space:nowrap">${pct}%</span>
  </div>
  <div class="flex-between mt12 gap8">
  ${d.done ? '' : `<button class="btn btn-success btn-sm" data-act="done" data-id="${d.id}">完成</button>`}
  <button class="btn btn-soft btn-sm" data-act="edit" data-id="${d.id}">编辑</button>
  <button class="btn btn-soft btn-sm" data-act="del" data-id="${d.id}">删除</button>
  </div>
  </div>`;
  }

  // 考试倒计时：卡片式（左侧大数字天数，右侧名称/类型/日期，删除按钮）
  function examRow(d) {
    const hl = D.hoursLeft(d.due);
    const danger = hl <= 72;
    const leftText = D.daysLeftText(d.due);
    const num = leftText.replace(/[^0-9\-]/g, '') || '—';
    const unit = leftText.includes('分钟') ? '分钟后' : leftText.includes('小时') ? '小时后' : leftText.includes('逾期') ? '已逾期' : '天后';
    const dateStr = d.due ? (d.due.split('T')[0] || '') : '';
    const typeStr = d.name ? d.name : '考试';
    return `<div class="exam-card ${danger ? 'danger' : ''}">
      <div class="exam-days-big">
        <div class="exam-num">${num}</div>
        <div class="exam-unit">${unit}</div>
      </div>
      <div class="exam-info">
        <div class="exam-name">${UI.esc(d.name)}</div>
        <div class="exam-meta">${UI.esc(typeStr)} · ${dateStr}</div>
      </div>
      <button class="btn btn-soft btn-icon exam-del" data-act="del" data-id="${d.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
    </div>`;
  }
  // 学业 DDL 清单：每行一项（名称 / 剩余 / 进度 / 完成·编辑·删除）
  function listRow(d) {
    const hl = D.hoursLeft(d.due);
    let level = 'normal';
    if (d.done) level = 'done';
    else if (hl <= 12) level = 'danger';
    else if (hl <= 24) level = 'warn';
    const pct = Math.max(0, Math.min(100, d.progress || 0));
    const left = D.daysLeftText(d.due);
    const style = d.done ? 'opacity:.6' : (level === 'danger' ? 'border-color:#f3c7c2' : level === 'warn' ? 'border-color:#fbeec2' : '');
    return `<div class="item ddl-item" style="${style}">
      <button class="check" data-act="done" data-id="${d.id}" aria-label="完成">${d.done ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
      <div class="body">
        <div class="name">${UI.esc(d.name)} ${d.done ? '<span class="tag success">已完成</span>' : level === 'danger' ? '<span class="tag danger">紧急</span>' : level === 'warn' ? '<span class="tag warn">预警</span>' : ''}</div>
        <div class="meta"><span>截止 ${d.due ? D.fmtDateTime(D.parseLDT(d.due)) : '未设置'}</span><span>剩余 ${left}</span></div>
        <div class="progress mt8"><span data-bar="${d.id}" style="width:${pct}%"></span></div>
      </div>
      <div class="ops">
        <input type="range" min="0" max="100" value="${pct}" data-prog="${d.id}" class="prog-range" ${d.done ? 'disabled' : ''}/>
        <button class="btn btn-soft btn-icon" data-act="edit" data-id="${d.id}" title="编辑"><img class="ic" src="assets/icons/hk-32.png" alt=""/></button>
        <button class="btn btn-soft btn-icon" data-act="del" data-id="${d.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button>
      </div>
    </div>`;
  }

  const listHtml = tasks.length
  ? '<div class="list ddl-list">' + tasks.map(listRow).join('') + '</div>'
  : `<div class="empty"><img class="emoji" src="assets/icons/hk-41.png" alt=""/><div class="t">还没有学业 DDL</div><div class="s">添加课程作业、提交节点等，到期前自动提醒</div></div>`;

  // 手机日历订阅
  const cal = s.cal;
  const calHtml = `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-37.png" alt=""/>手机日历订阅（DDL 自动进手机日历）</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="row">
  <div class="field"><label>定时推送 / 日历后端地址</label>
  <input class="input" id="calUrl" value="${UI.esc(cal.backendUrl || '')}" placeholder="https://your-server.example.com"/></div>
  </div>
  <div class="field"><label>固定客户端 ID（多设备共用同一日历 / CalDAV 用户名，留空则本机自动生成）</label>
  <input class="input" id="calFixedId" value="${UI.esc(cal.clientId || '')}" placeholder="如 my-workbench（两设备填相同即共享日历）"/></div>
  <div class="field"><label>提前提醒时间</label>
  <div class="row gap8">
  <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rm1" ${cal.reminders.indexOf(1440) >= 0 ? 'checked' : ''}/> 1 天前</label>
  <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rm2" ${cal.reminders.indexOf(720) >= 0 ? 'checked' : ''}/> 12 小时前</label>
  <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rm3" ${cal.reminders.indexOf(60) >= 0 ? 'checked' : ''}/> 1 小时前</label>
  </div>
  </div>
  <div class="flex-wrap gap8 mt8">
  <button class="btn btn-sm" data-act="cal-bind">绑定并同步</button>
  <button class="btn btn-soft btn-sm" data-act="cal-download">下载 .ics（无需后端）</button>
  ${cal.subscribed ? '<button class="btn btn-soft btn-sm" data-act="cal-refresh">刷新同步</button>' : ''}
  ${cal.subscribed ? '<button class="btn btn-soft btn-sm" data-act="cal-unbind">解绑</button>' : ''}
  <span class="tag ${cal.subscribed ? 'success' : 'muted'}">${cal.subscribed ? '已订阅' : '未绑定'}</span>
  </div>
  ${cal.subscribed ? `
  <div class="field mt12"><label>订阅链接（复制到手机日历 App 订阅）</label>
  <div class="row gap8"><input class="input" id="calLink" readonly value="${UI.esc(calSubUrl(cal))}"/><button class="btn btn-soft btn-sm" data-act="cal-copy">复制</button></div>
  <div style="font-size:12px;color:var(--text-faint);margin-top:6px">把链接复制到系统日历 App 的「通过链接订阅」即可。</div>
  </div>` : ''}
  </div>
  </div>`;

  // 本地日历（离线自动同步）：直接写入设备系统日历，无需后端
  const local = cal.local || {};
  const localAuthorized = !!local.authorized;
  const localStatusText = localAuthorized
  ? ('已授权 · 最近同步 ' + (local.syncedCount || 0) + ' 个日程（' + new Date(local.lastAt).toLocaleString('zh-CN') + '）')
  : '尚未授权本地日历';
  const nativeOn = !!(window.NativeCalendar && window.NativeCalendar.available());
  const localCalHtml = `
  <div class="card" style="margin-top:16px">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-37.png" alt=""/>本地日历（一键写入系统日历）</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  ${nativeOn
  ? `<div class="flex-wrap gap8">
  <button class="btn btn-sm" data-act="cal-local-sync">${localAuthorized ? '重新同步到系统日历' : '同步到系统日历'}</button>
  ${localAuthorized ? '<button class="btn btn-soft btn-sm" data-act="cal-local-revoke">清除系统日历日程</button>' : ''}
  </div>
  <div class="muted-text mt12">${localStatusText}</div>`
  : `<div class="muted-text" style="color:var(--text-faint)">浏览器环境请使用「下载 .ics」导入。</div>`}
  </div>
  </div>`;

  // 微信推送（通过 Server酱 推送到微信，仅 DDL 任务会触发推送）
  const push = s.push;
  const pushHtml = `
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-36.png" alt=""/>微信推送提醒（Server酱 自动推送）</div>
  <div class="spacer"></div><button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">
  <div class="row">
  <div class="field"><label>SendKey（推送密钥）</label>
  <input class="input" id="pushToken" value="${UI.esc(push.token || '')}" placeholder="SCT 开头，Server酱官网获取"/></div>
  </div>
  <div class="row">
  <div class="field"><label>后端地址（选填，不填也能用）</label>
  <input class="input" id="pushBackend" value="${UI.esc(push.backendUrl || '')}" placeholder="留空 = 打开页面时推送；填写 = 关页面也能推送"/></div>
  </div>
  <div class="flex-wrap gap8 mt8">
  <button class="btn btn-sm" data-act="push-save">保存绑定</button>
  <button class="btn btn-soft btn-sm" data-act="push-test">测试推送</button>
  ${push.enabled ? '<button class="btn btn-soft btn-sm" data-act="push-unbind">解绑</button>' : ''}
  <span class="tag ${push.enabled ? 'success' : 'muted'}">${push.enabled ? ' 已绑定' : '未绑定'}</span>
  </div>
  <div class="muted-text mt12">SendKey 从 sct.ftqq.com 获取，仅 DDL 到期前推送。</div>
  </div>
  </div>`;

  // 遗留问题
  const issues = s.issues;
  const iTotal = issues.length, iSolved = issues.filter((i) => i.solved).length, iOpen = iTotal - iSolved;
  const iHtml = issues.length ? '<div class="list">' + issues.map((i) => `
  <div class="item ${i.solved ? 'done' : ''}" data-id="${i.id}">
  <button class="check" data-act="i-toggle" data-id="${i.id}">${i.solved ? '<img class="ic" src="assets/icons/hk-38.png" alt=""/>' : ''}</button>
  <div class="body"><div class="name">${UI.esc(i.text)}</div></div>
  <div class="ops"><button class="btn btn-soft btn-icon" data-act="i-del" data-id="${i.id}" title="删除"><img class="ic" src="assets/icons/hk-18.png" alt=""/></button></div>
  </div>`).join('') + '</div>'
  : `<div class="empty"><img class="emoji" src="assets/icons/hk-39.png" alt=""/><div class="t">暂无遗留问题</div><div class="s">记录没搞懂的难题，逐个攻克</div></div>`;

  const examListHtml = exams.length ? '<div class="exam-list">' + exams.map(examRow).join('') + '</div>'
  : `<div class="empty"><img class="emoji" src="assets/icons/hk-41.png" alt=""/><div class="t">暂无考试安排</div><div class="s">新增 DDL 时类型选「考试」，这里会显示倒计时</div></div>`;
  const examDone = s.ddls.filter((d) => (d.type || 'ddl') === 'exam' && d.done).length;
  const examStat = `<div class="muted-text mb8">共 <b>${exams.length + examDone}</b> 场考试 · 待考 <b style="color:var(--danger)">${exams.length}</b> · 已结束 <b style="color:var(--success)">${examDone}</b></div>`;
  const examHtml = `
    ${examStat}
    ${examListHtml}
    <button class="btn btn-soft btn-sm" data-act="add-exam" style="margin-top:12px">＋ 添加考试</button>
  `;
  c.innerHTML = `
  ${stats}
  <div class="card" style="margin-top:16px">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-41.png" alt=""/>考试倒计时</div>
  <div class="spacer"></div>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">${examHtml}</div>
  </div>
  <div class="card" style="margin-top:16px">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-41.png" alt=""/>学业 DDL 清单</div>
  <div class="spacer"></div><button class="btn btn-sm" data-act="add">＋ 新增 DDL</button>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">${listHtml}</div>
  </div>
  <div class="card">
  <div class="card-head"><div class="title"><img class="ic" src="assets/icons/hk-39.png" alt=""/>遗留问题记录区</div>
  <div class="spacer"></div>
  <div class="muted-text">总 <b style="color:var(--text)">${iTotal}</b> · 已解决 <b style="color:var(--success)">${iSolved}</b> · 待攻克 <b style="color:var(--danger)">${iOpen}</b></div>
  <button class="btn btn-sm btn-soft" data-act="i-add" style="margin-left:10px">＋ 记录问题</button>
  <button class="collapse-btn" title="折叠">▾</button></div>
  <div class="card-body">${iHtml}</div>
  </div>
  ${pushHtml}
  ${calHtml}
  ${localCalHtml}`;

  // 列表内联进度条：拖动实时更新进度条与百分比，松开即保存
  c.querySelectorAll('input[data-prog]').forEach((inp) => {
  const card = inp.closest('.card');
  const bar = card ? card.querySelector('[data-bar="' + inp.dataset.prog + '"]') : null;
  const vt = card ? card.querySelector('.prog-val') : null;
  inp.addEventListener('input', () => {
  const v = inp.value;
  if (bar) bar.style.width = v + '%';
  if (vt) vt.textContent = v + '%';
  });
  inp.addEventListener('change', () => {
  const id = inp.dataset.prog;
  const v = parseInt(inp.value, 10) || 0;
  Store.update((st) => { const x = st.ddls.find((y) => y.id === id); if (x) x.progress = v; });
  UI.toast('进度已更新为 ' + v + '%', 'ok');
  });
  });

  // 已订阅则每次打开页面都同步一次，保证日历内容最新
  if (cal.subscribed) syncCalendar(true);
  // 已启用推送则同步到后端，并在页面打开期间主动检查一次
  if (push.enabled) syncPush();
  checkReminders();
  scheduleReminders();

  window.PageHandler = (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'add') return openModal();
  if (act === 'add-exam') return openModal(null, 'exam');
  if (act === 'edit') return openModal(id);
  if (act === 'del') return UI.confirm('删除这条 DDL？', () => {
  Store.update((st) => { st.ddls = st.ddls.filter((x) => x.id !== id); }); maybeSyncLocal(); Pages.ddl();
  });
  if (act === 'done') {
  Store.update((st) => { const x = st.ddls.find((y) => y.id === id); x.done = true; x.progress = 100; });
  Store.earn(1, '完成 DDL 任务');
  syncCalendar(true);
  syncPush();
  maybeSyncLocal();
  Pages.ddl(); return;
  }
  if (act === 'cal-bind') {
  const backend = (UI.val('#calUrl') || '').trim().replace(/\/$/, '');
  if (!backend) return UI.toast('请填写后端地址', 'warn');
  const fixedId = (UI.val('#calFixedId') || '').trim();
  const reminders = [];
  if (UI.$('#rm1') && UI.$('#rm1').checked) reminders.push(1440);
  if (UI.$('#rm2') && UI.$('#rm2').checked) reminders.push(720);
  if (UI.$('#rm3') && UI.$('#rm3').checked) reminders.push(60);
  const cid = fixedId || getClientId();
  Store.update((st) => {
  st.cal = st.cal || {};
  st.cal.backendUrl = backend;
  st.cal.clientId = cid;
  st.cal.reminders = reminders.length ? reminders : [1440, 720, 60];
  st.cal.subscribed = true;
  });
  syncCalendar(true).then((ok) => {
  if (ok) UI.toast('已绑定并同步 DDL 到后端', 'ok');
  else UI.toast('已保存配置，但后端不可达：订阅链接已生成，待后端恢复后点「刷新同步」即可生效；无后端也可点「下载 .ics」直接导入日历。', 'warn');
  Pages.ddl();
  });
  return;
  }
  if (act === 'cal-refresh') { syncCalendar(true).then((ok) => UI.toast(ok ? '已刷新同步' : '刷新失败：后端不可达', ok ? 'ok' : 'warn')); return; }
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
  if (act === 'cal-local-sync') {
  if (!window.NativeCalendar) return UI.toast('本地日历模块未加载', 'warn');
  UI.toast('正在同步到系统日历…', 'ok');
  window.NativeCalendar.sync().then((r) => {
  if (r.ok) {
  if (r.fallback) UI.toast('已生成日历文件，请在系统日历中导入', 'ok');
  else UI.toast('已同步 ' + r.count + ' 个日程到系统日历', 'ok');
  }
  Pages.ddl();
  }).catch(() => { UI.toast('同步失败', 'warn'); Pages.ddl(); });
  return;
  }
  if (act === 'cal-local-revoke') {
  if (window.NativeCalendar) window.NativeCalendar.clearRecord();
  UI.toast('已清除系统日历日程', 'ok'); Pages.ddl();
  return;
  }
  // ---- 微信推送（Server酱）----
  if (act === 'push-save') {
  const token = (UI.val('#pushToken') || '').trim();
  const backendUrl = (UI.val('#pushBackend') || '').trim().replace(/\/$/, '');
  if (!token) return UI.toast('请填写 SendKey', 'warn');
  Store.update((st) => { st.push = { service: 'serverchan', token, uid: '', enabled: true, backendUrl }; });
  syncPush();
  UI.toast('已保存微信推送配置' + (backendUrl ? '，DDL 已同步到后端' : ''), 'ok');
  Pages.ddl(); return;
  }
  if (act === 'push-test') {
  const token = (UI.val('#pushToken') || '').trim();
  const backendUrl = (UI.val('#pushBackend') || '').trim().replace(/\/$/, '');
  if (!token) return UI.toast('请先填写 SendKey', 'warn');
  UI.toast('正在发送测试推送…', 'ok');
  doPush('serverchan', token, '测试推送', '大学生AI万能工作台 · 微信推送绑定成功！\n\n之后 DDL 到期前会自动推送提醒到此微信。', backendUrl, '')
  .then((r) => { if (r.ok) UI.toast('已发送，请查看微信（未收到请确认已微信关注「Server酱」服务号）', 'ok'); else UI.toast('推送失败：' + r.error, 'warn'); });
  return;
  }
  if (act === 'push-unbind') return UI.confirm('解绑微信推送？', () => {
  Store.update((st) => { st.push.enabled = false; st.push.token = ''; st.push.uid = ''; });
  Pages.ddl();
  });
  if (act === 'i-add') {
  UI.openModal({ title: '记录遗留问题', icon: '<img class="ic" src="assets/icons/hk-39.png" alt=""/>',
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

  function openModal(editId, forceType) {
  const d = editId ? s.ddls.find((x) => x.id === editId) : null;
  const typeDef = forceType || (d ? (d.type || 'ddl') : 'ddl');
  const progDef = d ? (d.progress || 0) : 0;
  const remindDef = d ? (d.remindBefore != null ? d.remindBefore : 120) : 120;
  UI.openModal({
  title: d ? '编辑 DDL' : '新增 DDL', icon: '<img class="ic" src="assets/icons/hk-41.png" alt=""/>',
  body: `
  <div class="row">
  <div class="field" style="flex:2"><label>任务名称</label><input class="input" id="dName" value="${UI.esc(d ? d.name : '')}" placeholder="如：数据库大作业提交"/></div>
  <div class="field" style="flex:1"><label>类型</label><select class="input" id="dType"><option value="ddl" ${typeDef==='ddl'?'selected':''}>普通 DDL</option><option value="exam" ${typeDef==='exam'?'selected':''}>考试</option></select></div>
  </div>
  <div class="row">
  <div class="field"><label>截止日期时间</label><input class="input" id="dDue" type="datetime-local" value="${d ? (d.due || '') : ''}"/></div>
  <div class="field"><label>提前提醒（到点推送微信 / 站内提醒）</label>
  <select class="input" id="dRemind">
  <option value="0">不提醒</option>
  <option value="30" ${remindDef === 30 ? 'selected' : ''}>30 分钟前</option>
  <option value="60" ${remindDef === 60 ? 'selected' : ''}>1 小时前</option>
  <option value="120" ${remindDef === 120 ? 'selected' : ''}>2 小时前</option>
  <option value="360" ${remindDef === 360 ? 'selected' : ''}>6 小时前</option>
  <option value="720" ${remindDef === 720 ? 'selected' : ''}>12 小时前</option>
  <option value="1440" ${remindDef === 1440 ? 'selected' : ''}>1 天前</option>
  <option value="2880" ${remindDef === 2880 ? 'selected' : ''}>2 天前</option>
  </select></div>
  </div>
  <div class="field"><label>完成进度 <span id="dProgVal">${progDef}%</span></label>
  <input class="input" id="dProg" type="range" min="0" max="100" value="${progDef}"/></div>`,
  actions: [{ label: '取消', cls: 'btn-soft', onClick: UI.closeModal },
  { label: d ? '保存' : '添加', onClick: () => {
  const name = UI.val('#dName'); if (!name) return UI.toast('请填写名称', 'warn');
  const data = { name, type: UI.val('#dType') || 'ddl', due: UI.val('#dDue'), progress: parseInt(UI.val('#dProg')) || 0, remindBefore: parseInt(UI.val('#dRemind')) || 0 };
  Store.update((st) => {
  if (d) { const x = st.ddls.find((y) => y.id === editId); Object.assign(x, data); x.remindedAt = null; }
  else st.ddls.unshift(Object.assign({ id: Store.uid(), done: false, remindedAt: null }, data));
  });
  UI.closeModal(); maybeSyncLocal(); Pages.ddl();
  } }],
  });
  setTimeout(() => {
  const p = UI.$('#dProg'), v = UI.$('#dProgVal');
  if (p && v) p.addEventListener('input', () => { v.textContent = p.value + '%'; });
  const dn = UI.$('#dName'); if (dn) dn.focus();
  }, 50);
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
function syncCalendar(silent) {
  const cal = Store.get().cal;
  if (!cal || !cal.backendUrl || !cal.subscribed) return Promise.resolve(false);
  const payload = {
  clientId: getClientId(),
  reminders: cal.reminders && cal.reminders.length ? cal.reminders : [1440, 720, 60],
  ddls: Store.get().ddls.map((d) => ({ id: d.id, name: d.name, due: d.due, done: d.done, remindBefore: d.remindBefore })),
  tasks: Store.get().tasks.map((t) => ({ id: t.id, name: t.name, due: t.due, done: t.done, est: t.est, category: t.category })),
  };
  return fetch(cal.backendUrl.replace(/\/$/, '') + '/api/ddl/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  }).then((r) => {
  if (r.ok) return true;
  if (!silent) UI.toast('日历同步失败：后端返回 ' + r.status, 'warn');
  return false;
  }).catch(() => {
  if (!silent) UI.toast('日历同步失败：后端不可达（地址填错 / 已暂停 / 国内连不上）', 'warn');
  return false;
  });
}
window.syncCalendar = syncCalendar;

// DDL 变化后若已授权本地日历，则静默重新同步（不刷新界面，不打扰）
function maybeSyncLocal() {
  try {
    const local = Store.get().cal && Store.get().cal.local;
    if (window.NativeCalendar && window.NativeCalendar.available() && local && local.authorized) {
      window.NativeCalendar.sync().catch(() => {});
    }
  } catch (e) {}
}

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
  lines.push('SUMMARY:' + esc('DDL：' + (d.name || '未命名')));
  lines.push('DESCRIPTION:' + esc('大学生AI万能工作台 · 截止提醒'));
  (reminders && reminders.length ? reminders : [1440, 720, 60]).forEach((m) => {
  lines.push('BEGIN:VALARM');
  lines.push('ACTION:DISPLAY');
  lines.push('DESCRIPTION:' + esc('即将到期：' + (d.name || '未命名')));
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
  ddls: Store.get().ddls.map((d) => ({ id: d.id, name: d.name, due: d.due, done: d.done, remindBefore: d.remindBefore })),
  push: { service: push.service, token: push.token, uid: push.uid },
  };
  fetch(push.backendUrl.replace(/\/$/, '') + '/api/ddl/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
  }).catch(() => {});
}
window.syncPush = syncPush;

// 发送一条推送消息（默认 Server酱，浏览器可直连 GET；有后端走后端代理）
async function doPush(service, token, title, content, backendUrl, uid) {
  if (!token) return { ok: false, error: '请先填写 Token / AppToken' };
  // 有后端：走后端代理（支持 POST，最稳定）
  if (backendUrl) {
  try {
  const r = await fetch(backendUrl.replace(/\/$/, '') + '/api/push/send', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ service, token, uid, title, content }),
  }).then((r) => r.json()).catch(() => null);
  if (r && r.ok) return { ok: true };
  return { ok: false, error: (r && r.error) || '后端请求失败' };
  } catch (e) { return { ok: false, error: '无法连接后端：' + (e.message || e) }; }
  }
  // 无后端：Server酱 支持浏览器直连 GET（失败自动走公共代理兜底），完全免费无需部署
  const proxy = (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u);
  try {
  if (service === 'wxpusher') {
  if (!uid) return { ok: false, error: '请填写 UID' };
  const body = { appToken: token, content, summary: (title || '').slice(0, 100), contentType: 1, uids: [uid] };
  // 先尝试直连（WxPusher 已返回 Access-Control-Allow-Origin: *），失败再用公共代理
  let r = null;
  try {
  r = await fetch('https://wxpusher.zjiecode.com/api/send/message', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body), cache: 'no-store',
  }).then((r) => r.json()).catch(() => null);
  } catch (e) {}
  if (!r) {
  r = await fetch(proxy('https://wxpusher.zjiecode.com/api/send/message'), {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body), cache: 'no-store',
  }).then((r) => r.json()).catch(() => null);
  }
  if (r && r.code === 1000 && r.success) return { ok: true };
  return { ok: false, error: (r && r.msg) || '推送失败，请检查 AppToken / UID' };
  }
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
  // Server酱 为简单 GET，浏览器会以 no-cors 发出请求（服务端照常接收并推送到微信），
  // 但跨域响应无法读取，旧逻辑读不到响应就被误判为失败。改为 no-cors 发出即视为已送达。
  try {
  await fetch(apiUrl, { mode: 'no-cors', cache: 'no-store' });
  return { ok: true, sent: true };
  } catch (e1) {
  try {
  await fetch(proxy(apiUrl), { cache: 'no-store' });
  return { ok: true, sent: true };
  } catch (e2) {
  return { ok: false, error: '推送请求失败：请检查网络或 SendKey 是否正确' };
  }
  }
  }
  return { ok: false, error: '不支持的服务' };
  } catch (e) { return { ok: false, error: '推送请求失败：' + (e.message || e) }; }
}
window.doPush = doPush;

// 页面打开时 / 定时器到点时，逐个检查 DDL 是否进入「提前提醒」窗口并推送（仅 DDL 任务会推送）
function fmtRemind(min) {
  if (!min) return '不提醒';
  if (min < 60) return min + ' 分钟';
  if (min < 1440) return (min / 60) + ' 小时';
  return (min / 1440) + ' 天';
}
function checkReminders() {
  const push = Store.get().push;
  Store.update((st) => {
  (st.ddls || []).forEach((d) => {
  if (d.done) return;
  const rb = (d.remindBefore != null ? d.remindBefore : 120) || 0; // 默认提前 2 小时
  const ms = D.msLeft(d.due);
  if (ms === null) return;
  if (ms <= 0) { if (d.remindedAt) d.remindedAt = null; return; } // 逾期清除标记，改期后可重新提醒
  if (rb > 0 && ms <= rb * 60000 && !d.remindedAt) {
  const left = D.daysLeftText(d.due);
  const content = '即将到期：' + d.name + '\n剩余 ' + left + '\n（提前 ' + fmtRemind(rb) + ' 提醒）';
  UI.toast(d.name + ' 还剩 ' + left + '，记得处理！', 'warn');
  if (push && push.enabled && push.token) {
  doPush(push.service, push.token, 'DDL 提醒：' + d.name, content, push.backendUrl, push.uid);
  }
  d.remindedAt = Date.now();
  }
  });
  });
}
function scheduleReminders() {
  reminderTimers.forEach((t) => clearTimeout(t)); reminderTimers = [];
  if (reminderInterval) { clearInterval(reminderInterval); reminderInterval = null; }
  (Store.get().ddls || []).forEach((d) => {
  if (d.done) return;
  const rb = (d.remindBefore != null ? d.remindBefore : 120) || 0;
  if (rb <= 0) return;
  const ms = D.msLeft(d.due);
  if (ms === null) return;
  const fireAt = ms - rb * 60000; // 距离「提前提醒时刻」的毫秒数
  if (fireAt > 0 && fireAt < 30 * 24 * 3600 * 1000) {
  reminderTimers.push(setTimeout(() => { checkReminders(); }, Math.min(fireAt, 2147483647)));
  }
  });
  reminderInterval = setInterval(() => { checkReminders(); }, 60000); // 兜底：每 60 秒检查一次
}
window.checkAndPushDirect = checkReminders;
window.checkReminders = checkReminders;
window.scheduleReminders = scheduleReminders;
