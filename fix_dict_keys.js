const fs = require('fs');

const filePath = 'D:\\buddycode\\college-workbench\\js\\pages\\english.js';
let content = fs.readFileSync(filePath, 'utf8');

// 修复词典中带连字符的键名
const fixes = [
  ['decision-making:', "'decision-making':"],
  ['well-being:', "'well-being':"],
  ['drought-resistant:', "'drought-resistant':"],
  ['cost-effective:', "'cost-effective':"],
  ['post-truth:', "'post-truth':"],
  ['fast-paced:', "'fast-paced':"],
  ['ninety-nine:', "'ninety-nine':"],
  ['early-career:', "'early-career':"],
  ['19th:', "'19th':"],
];

fixes.forEach(([oldStr, newStr]) => {
  content = content.replace(new RegExp(oldStr.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newStr);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 已修复词典键名');
