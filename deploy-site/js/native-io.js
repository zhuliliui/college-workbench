/* ============================================================
   原生文件读写（Capacitor Filesystem）
   - 原生 APP：备份写成真实文件落到手机「下载」目录，可读可写
   - 浏览器 / PWA：自动回退为「下载」或「选择文件」对话框
   仅在原生 WebView 里 window.Capacitor 才存在，故无需额外依赖也能跑网页版。
   ============================================================ */
(function () {
  function cap() { return window.Capacitor || null; }
  function isNative() {
    const C = cap();
    return !!(C && C.isNativePlatform && C.isNativePlatform());
  }
  function fsPlugin() {
    const C = cap();
    if (C && C.Plugins && C.Plugins.Filesystem) return C.Plugins.Filesystem;
    return null;
  }
  function DownloadsDir() {
    const f = fsPlugin();
    // Capacitor Filesystem.Directory.Downloads 对应手机公共下载目录（Android 10+ 走 MediaStore，无需权限）
    return f && f.Directory ? f.Directory.Downloads : 'Download';
  }

  // 写文本文件：原生→真实文件；网页→浏览器下载
  async function writeText(filename, text) {
    if (isNative()) {
      const f = fsPlugin();
      if (f) {
        try {
          await f.writeFile({
            path: filename,
            data: text,
            directory: DownloadsDir(),
            recursive: true,
          });
          return { ok: true, native: true, path: filename };
        } catch (e) {
          console.warn('原生写文件失败', e);
          return { ok: false, native: true, error: e && e.message };
        }
      }
    }
    // 回退：网页下载
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return { ok: true, native: false };
  }

  // 读文本文件：统一用文件选择框（原生 WebView 与普通浏览器都支持）
  function pickText() {
    return new Promise((resolve) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json,application/json';
      inp.onchange = () => {
        const file = inp.files && inp.files[0];
        if (!file) return resolve(null);
        const rd = new FileReader();
        rd.onload = () => resolve(String(rd.result || ''));
        rd.onerror = () => resolve(null);
        rd.readAsText(file);
      };
      inp.click();
    });
  }

  window.NativeIO = { isNative, writeText, pickText };
})();
