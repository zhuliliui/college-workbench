/* ============================================================
   通用 UI 工具 & 日期工具
   ============================================================ */
(function () {
  // ---------- DOM ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  // ---------- Toast ----------
  function toast(msg, type) {
    let root = document.getElementById('toastRoot');
    if (!root) { root = document.createElement('div'); root.id = 'toastRoot'; document.body.appendChild(root); }
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .3s, transform .3s';
      t.style.opacity = '0'; t.style.transform = 'translateY(10px)';
      setTimeout(() => t.remove(), 320);
    }, 2200);
  }

  // ---------- Modal ----------
  let modalEl = null;
  function closeModal() {
    if (modalEl) { modalEl.remove(); modalEl = null; }
  }
  function openModal(opts) {
    closeModal();
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <h3>${opts.icon ? esc(opts.icon) + ' ' : ''}${esc(opts.title || '')}</h3>
      <div class="modal-body">${opts.body || ''}</div>
      <div class="modal-foot"></div>
    </div>`;
    document.body.appendChild(mask);
    modalEl = mask;
    const foot = $('.modal-foot', mask);
    const actions = opts.actions || [{ label: '关闭', cls: 'btn-soft', onClick: closeModal }];
    actions.forEach((a) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.cls || '');
      b.textContent = a.label;
      b.onclick = () => { if (a.onClick) a.onClick(closeModal); else closeModal(); };
      foot.appendChild(b);
    });
    mask.addEventListener('click', (e) => { if (e.target === mask && opts.dismissable !== false) closeModal(); });
    return mask;
  }
  // 轻量确认
  function confirm(msg, onYes, opts) {
    opts = opts || {};
    openModal({
      title: opts.title || '确认',
      body: `<p style="color:var(--text);line-height:1.7">${esc(msg)}</p>`,
      actions: [
        { label: '取消', cls: 'btn-soft', onClick: closeModal },
        { label: opts.yesText || '确定', cls: opts.danger ? 'btn-danger' : 'btn', onClick: (c) => { c(); onYes && onYes(); } },
      ],
    });
  }

  // ---------- 表单输入捕获 ----------
  function val(sel, root) { const e = $(sel, root); return e ? e.value.trim() : ''; }

  // ---------- 日期工具 ----------
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function monthKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function parseLDT(s) { // 'YYYY-MM-DDTHH:MM' -> local Date
    if (!s) return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) { const d = new Date(s); return isNaN(d) ? null : d; }
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  }
  function fmtDateTime(d) {
    d = (d instanceof Date) ? d : new Date(d);
    if (isNaN(d)) return '';
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function fmtDate(d) {
    d = (d instanceof Date) ? d : new Date(d);
    if (isNaN(d)) return '';
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  // 剩余毫秒/天（相对 now）
  function msLeft(iso) {
    const d = parseLDT(iso);
    if (!d) return null;
    return d.getTime() - Date.now();
  }
  function daysLeftText(iso) {
    const ms = msLeft(iso);
    if (ms === null) return '—';
    if (ms < 0) return '已逾期';
    const h = ms / 36e5;
    if (h < 1) return Math.max(1, Math.round(h * 60)) + ' 分钟';
    if (h < 24) return Math.round(h) + ' 小时';
    return Math.floor(h / 24) + ' 天';
  }
  function hoursLeft(iso) {
    const ms = msLeft(iso);
    if (ms === null) return Infinity;
    return ms / 36e5;
  }

  function money(n) {
    n = Number(n) || 0;
    return '¥' + (Math.round(n * 100) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  window.UI = { esc, $, $all, toast, openModal, closeModal, confirm, val };
  window.D = {
    pad, todayStr, monthKey, startOfDay, parseLDT, fmtDateTime, fmtDate,
    msLeft, daysLeftText, hoursLeft, money,
  };
})();
