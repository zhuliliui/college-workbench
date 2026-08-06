/* 大学生AI万能工作台 - Service Worker（PWA 离线缓存） */
const CACHE = 'cw-v100';
const ICONS = Array.from({ length: 42 }, (_, i) => 'assets/icons/hk-' + String(i + 1).padStart(2, '0') + '.png');
const ASSETS = [
  '.',
  'index.html',
  'manifest.webmanifest',
  'manifest.json',
  'css/style.css',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/apple-touch-icon.png',
  'assets/piggy.svg',
  'js/store.js',
  'js/common.js',
  'js/pages/dashboard.js',
  'js/pages/checkin.js',
  'js/pages/study.js',
  'js/pages/ddl.js',
  'js/pages/finance.js',
  'js/pages/discipline.js',
  'js/pages/travel.js',
  'js/pages/review.js',
  'js/pages/en-dict.js',
  'js/pages/kaoyan-seed.js',
  'js/pages/english.js',
  'js/pages/skill.js',
  'js/cloud.js',
  'js/app.js',
  ...ICONS,
  'assets/icons/hk-bili.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigate = req.mode === 'navigate';

  // 跨源数据接口（RSS/翻译/Webhook 代理等）网络优先，失败时直接放行浏览器默认行为，
  // 绝不能用缓存的 index.html 兜底，否则会把应用 HTML 当作文本注入到页面里。
  if (!isSameOrigin) {
    e.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // 同源资源：网络优先，失败回退缓存；导航请求额外兜底到缓存的入口页
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((r) => r || (isNavigate ? caches.match('.') : undefined)))
  );
});
