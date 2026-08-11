const fs = require('fs');

const filePath = 'D:\\buddycode\\college-workbench\\js\\pages\\english.js';
let content = fs.readFileSync(filePath, 'utf8');

// 找到第二批文章开始的位置（在 ARTICLES 数组里）
const batch2StartMarker = '    // ---------- 第二批：四级 7 篇 ----------';
const batch2Start = content.indexOf(batch2StartMarker);

// 找到第二批文章结束的位置（ARTICLES 数组结束）
const articlesEndMarker = '  ];\n  let _artIdx = 0;';
const articlesEnd = content.indexOf(articlesEndMarker);

// 找到 LS_ARTICLES 数组结束的位置
const lsArticlesEndMarker = '  ];\n\n  // 内置听力词典';
const lsArticlesEnd = content.indexOf(lsArticlesEndMarker);

if (batch2Start > -1 && articlesEnd > -1 && lsArticlesEnd > -1) {
  // 提取第二批文章内容
  const batch2Content = content.substring(batch2Start, articlesEnd);
  
  // 删除 ARTICLES 数组里的第二批文章
  content = content.substring(0, batch2Start) + content.substring(articlesEnd);
  
  // 重新计算 LS_ARTICLES 结束位置（因为删除了内容，位置变了）
  const newLsEnd = content.indexOf(lsArticlesEndMarker);
  
  // 在 LS_ARTICLES 数组结束前插入第二批文章
  content = content.substring(0, newLsEnd) + batch2Content + '\n' + content.substring(newLsEnd);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ 已修复第二批文章位置');
} else {
  console.log('位置检查：', { batch2Start, articlesEnd, lsArticlesEnd });
}
