const fs = require('fs');
const content = fs.readFileSync('D:\\buddycode\\college-workbench\\js\\pages\\english.js', 'utf8');

// 找到 LISTENING_ARTICLES 数组开始位置
const startMarker = 'const LISTENING_ARTICLES = [';
const startIdx = content.indexOf(startMarker);
console.log('数组开始位置:', startIdx);

// 找到第一篇文章的位置
const firstIdIdx = content.indexOf("id: '", startIdx);
console.log('第一篇文章位置:', firstIdIdx);

// 找到第20篇文章结束的位置
let count = 0;
let pos = firstIdIdx;
let endPos = pos;
while (count < 20 && pos < content.length) {
  const nextId = content.indexOf("id: '", pos + 1);
  if (nextId === -1) break;
  count++;
  if (count === 20) {
    endPos = nextId;
    break;
  }
  pos = nextId;
}

console.log('第20篇结束位置:', endPos);
console.log('前20篇字符数:', endPos - firstIdIdx);

// 保存位置信息供后续使用
fs.writeFileSync('D:\\buddycode\\college-workbench\\replace_pos.json', JSON.stringify({
  firstIdIdx,
  endPos
}, null, 2));

console.log('位置信息已保存');
