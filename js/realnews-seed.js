// 外媒精选合并入口：汇总各源种子（Guardian / New Scientist / TIME / The Atlantic），
// 统一暴露为 window.REALNEWS_SEED，供 english.js 的「 外媒精选」一键导入使用。
// 各源文件由脚本从对应外媒 RSS 真实抓取 + 段落级中英翻译生成（仅含社会/教育/职场/大众科技板块）。
(function () {
  var parts = [
  (typeof window.REALNEWS_SEED_GUARDIAN !== 'undefined' ? window.REALNEWS_SEED_GUARDIAN : []),
  (typeof window.REALNEWS_SEED_NEWSCIENTIST !== 'undefined' ? window.REALNEWS_SEED_NEWSCIENTIST : []),
  (typeof window.REALNEWS_SEED_TIME !== 'undefined' ? window.REALNEWS_SEED_TIME : []),
  (typeof window.REALNEWS_SEED_ATLANTIC !== 'undefined' ? window.REALNEWS_SEED_ATLANTIC : []),
  (typeof window.REALNEWS_SEED_CN !== 'undefined' ? window.REALNEWS_SEED_CN : [])
  ];
  var all = [];
  parts.forEach(function (p) { if (Array.isArray(p)) all = all.concat(p); });
  window.REALNEWS_SEED = all;
})();
