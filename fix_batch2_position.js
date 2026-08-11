const fs = require('fs');

const filePath = 'D:\\buddycode\\college-workbench\\js\\pages\\english.js';
let content = fs.readFileSync(filePath, 'utf8');

// 找到数组结束标记的位置
const arrayEndMarker = '  ];';
const arrayEndIdx = content.indexOf(arrayEndMarker);

// 找到第二批文章开始的位置
const batch2Start = content.indexOf('    // ---------- 第二批：四级 7 篇 ----------');

if (arrayEndIdx > -1 && batch2Start > -1 && batch2Start > arrayEndIdx) {
  // 提取第二批文章内容
  const batch2End = content.indexOf('  // 听力阅读状态', batch2Start);
  const batch2Content = content.substring(batch2Start, batch2End);
  
  // 删除错误位置的第二批文章
  content = content.substring(0, batch2Start) + content.substring(batch2End);
  
  // 在数组结束标记前插入第二批文章
  content = content.substring(0, arrayEndIdx) + batch2Content + '\n' + content.substring(arrayEndIdx);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ 已修复第二批文章位置');
} else {
  console.log('位置检查：', { arrayEndIdx, batch2Start });
}
