// 一次性脚本：更新 AI_EVENTS_SEED（skill.js）+ assets/ai-events.json
// 1) 删除已过期（deadline < 2026-09-28）的 7 条 CTF
// 2) 插入 CTFtime 官方 API 核实的 13 条新赛事（日期 UTC→北京时间）
const fs = require('fs');
const path = 'D:/workbuddyspace/buddycode/college-workbench';
const skillPath = path + '/js/pages/skill.js';
const jsonPath = path + '/assets/ai-events.json';
const TODAY = '2026-09-28';

const EXPIRED_TITLES = [
  'CTF · FAUST CTF 2026', 'CTF · H7CTF 2026 Quals', 'CTF · BCS CTF 2026',
  'CTF · FlightPath2026', 'CTF · NileCTF', 'CTF · Null Origin CTF 2026', 'CTF · BreachPoint 2026',
];

const NEW = [
  { title: 'CTF · AltayCTF 2026（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-04', end: '2026-10-04', deadline: '2026-10-04', url: 'https://university.altayctf.ru/2026', benefit: 'CTFtime 实时收录的全球 CTF 赛事', org: 'SharLike', tutorial: '' },
  { title: 'CTF · FortID CTF 2026（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-10', end: '2026-10-12', deadline: '2026-10-12', url: 'https://ctf.fortid.com/', benefit: 'CTFtime 实时收录的全球 CTF 赛事', org: 'TBTL', tutorial: '' },
  { title: 'CTF · KubSTU CTF 2026（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-10', end: '2026-10-11', deadline: '2026-10-11', url: 'https://kubstu-ctf.ru/', benefit: 'CTFtime 实时收录的全球 CTF 赛事', org: 'Capybaras', tutorial: '' },
  { title: 'CTF · Narxoz CTF 2026（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-10', end: '2026-10-11', deadline: '2026-10-11', url: 'https://narxploit.narxoz.kz/register.html', benefit: 'CTFtime 实时收录的全球 CTF 赛事', org: 'NarXploit', tutorial: '' },
  { title: 'CTF · GaianSpace CTF 2026（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-11', end: '2026-10-15', deadline: '2026-10-15', url: 'https://gaian.space/ctf', benefit: 'CTFtime 实时收录的全球 CTF 赛事', org: 'GaianSpace', tutorial: '' },
  { title: 'CTF · DEADFACE CTF 2026（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-17', end: '2026-10-19', deadline: '2026-10-19', url: 'https://ctf.deadface.io/', benefit: 'CTFtime 实时收录的全球 CTF 赛事', org: 'Cyber Hacktics', tutorial: '' },
  { title: 'CTF · SAS CTF 2026 Finals（现场赛）', cat: 'security', type: 'event', start: '2026-10-20', end: '2026-10-20', deadline: '2026-10-20', url: 'https://ctf.thesascon.com/', benefit: 'CTFtime 实时收录的全球 CTF 赛事（现场决赛）', org: 'SAS CREW', tutorial: '' },
  { title: 'CTF · HITCON CTF 2026（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-23', end: '2026-10-25', deadline: '2026-10-25', url: 'https://ctf2026.hitcon.org/', benefit: 'CTFtime 实时收录的全球 CTF 赛事（国际高分场次）', org: 'HITCON', tutorial: '' },
  { title: 'CTF · Hack.lu CTF 2026（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-24', end: '2026-10-26', deadline: '2026-10-26', url: 'https://flu.xxx/', benefit: 'CTFtime 实时收录的全球 CTF 赛事（国际高分场次）', org: 'FluxFingers', tutorial: '' },
  { title: 'CTF · H7CTF 2026 Finals（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-24', end: '2026-10-25', deadline: '2026-10-25', url: 'https://2026.h7tex.com/', benefit: 'CTFtime 实时收录的全球 CTF 赛事', org: 'H7Tex', tutorial: '' },
  { title: 'CTF · Sudocrypt v16.0（Jeopardy）', cat: 'security', type: 'event', start: '2026-10-27', end: '2026-10-28', deadline: '2026-10-28', url: 'https://sudocrypt.com/', benefit: 'CTFtime 实时收录的全球 CTF 赛事', org: 'exunclan', tutorial: '' },
  { title: 'CTF · HKCERT CTF 2026 资格赛（中国香港）', cat: 'security', type: 'event', start: '2026-11-06', end: '2026-11-07', deadline: '2026-11-07', url: 'https://ctf.hkcert.org/', benefit: 'CTFtime 实时收录的全球 CTF 赛事（中国香港，新手友好）', org: 'HKCERT · Black Bauhinia', tutorial: '' },
  { title: "CTF · Hacker's Gambit 2026 (Round 2 – Grand Finale)（Jeopardy）", cat: 'security', type: 'event', start: '2026-10-30', end: '2026-10-31', deadline: '2026-10-31', url: 'https://unstop.com/p/hackers-gambit-2026-jaihind-college-of-engineering-kuran-1723293', benefit: 'CTFtime 实时收录的全球 CTF 赛事', org: 'JCOE Cyber Sentinels', tutorial: '' },
];

// ---- 1. 行级编辑 skill.js 的 AI_EVENTS_SEED ----
let lines = fs.readFileSync(skillPath, 'utf8').split('\n');
let inSeed = false, seedStart = -1, seedEnd = -1, removed = 0, inserted = false;
const out = [];
for (let i = 0; i < lines.length; i++) {
  const ln = lines[i];
  if (!inSeed && ln.includes('const AI_EVENTS_SEED = [')) { inSeed = true; seedStart = i; out.push(ln); continue; }
  if (inSeed) {
    if (/^\s*\];\s*$/.test(ln)) {
      if (!inserted) { // 追加新条目到 seed 末尾
        NEW.forEach(e => out.push('  ' + JSON.stringify(e) + ','));
        inserted = true;
      }
      seedEnd = i; inSeed = false; out.push(ln); continue;
    }
    if (EXPIRED_TITLES.some(t => ln.includes('"' + t))) { removed++; continue; } // 删过期行
    out.push(ln); continue;
  }
  out.push(ln);
}
if (removed !== EXPIRED_TITLES.length) throw new Error('过期条目删除数不符: ' + removed);
if (!inserted) throw new Error('未找到 seed 结束位置');
fs.writeFileSync(skillPath, out.join('\n'));
console.log('skill.js: 删除', removed, '条过期，新增', NEW.length, '条；seed 行范围', seedStart, '-', seedEnd);

// ---- 2. 从更新后的 skill.js 提取 seed，重新生成 ai-events.json ----
const m = out.join('\n').match(/const AI_EVENTS_SEED = \[([\s\S]*?)\n\s*\];/);
if (!m) throw new Error('提取 seed 失败');
const seed = new Function('return [' + m[1] + ']')();
const kept = seed.filter(e => {
  if (e.type === 'daily' || e.type === 'tool') return true;
  const d = String(e.deadline || e.end || '').trim();
  return !/^\d{4}-\d{2}-\d{2}$/.test(d) || d >= TODAY;
});
fs.writeFileSync(jsonPath, JSON.stringify(kept, null, 1) + '\n');
console.log('ai-events.json:', kept.length, '条（原', seed.length - NEW.length, '条）');
