// 2026-10-11 AI 活动更新：清过期 + 新增（CTFtime 官方 API 核实 + WebSearch 国内赛事）
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const TODAY = '2026-10-11';

// ---------- 1) 新赛事（security：CTFtime 官方 API，日期已转北京时间） ----------
const ctf = [
  ['CTF · Securinets CTF Quals 2026（Jeopardy）', '2026-10-17', '2026-10-19', 'https://ctf.securinets.tn/', 'Securinets'],
  ['CTF · SOLAR CTF 2026（Jeopardy）', '2026-10-17', '2026-10-18', 'https://solarctf.ru/', 'SOLARCTF'],
  ['CTF · cruXipher 2026 - ATMoS 26（BITS Hyderabad）', '2026-10-23', '2026-10-25', 'https://cruxipher.crux-bphc.com/', 'CRUx BPHC'],
  ['CTF · RSTCON 2026 CTF（Jeopardy）', '2026-10-24', '2026-10-26', 'https://ctf.rstcon.org/', 'RSTCON'],
  ['CTF · Cryovault 2026 Finals（现场赛）', '2026-10-24', '2026-10-25', 'https://isfcrpesu.ctfd.io/', 'ISFCR PESU'],
  ['CTF · BSides Peoria CTF 2026（现场赛）', '2026-10-24', '2026-10-25', 'https://bsidespeoriac.tf/', 'BSides Peoria CTF Village'],
  ['CTF · Srdnlen CTF 2026 Finals（现场赛）', '2026-10-29', '2026-10-30', 'https://ctf.srdnlen.it/', 'Srdnlen'],
  ['CTF · HI Cyber Con 2026 CTF（Jeopardy）', '2026-10-30', '2026-11-01', 'https://ctf.hiddeninvestigations.net/', 'HiddenInvestigations'],
  ['CTF · 强网杯 2026 网络内生安全挑战赛·资格赛', '2026-10-31', '2026-11-01', 'https://nest.pmlabs.com.cn/en/events/qiangwang-9/registration', '中国网络空间内生安全联盟'],
  ['CTF · Russian CTF Cup X Qualifier（Jeopardy）', '2026-10-31', '2026-11-01', 'https://ctfcup.ru/', 'ctfcup'],
  ['CTF · PINK+ CTF 2026（Jeopardy）', '2026-11-06', '2026-11-09', 'https://ctf.pink.bayern/', 'PINK+'],
  ['CTF · CSCTF 2026（Jeopardy）', '2026-11-06', '2026-11-08', 'https://2026.chronos-security.ro/', 'Mirachron'],
  ['CTF · SpookyCTF 2026（Jeopardy）', '2026-11-07', '2026-11-08', 'https://spooky.ctfd.io/', 'NICC'],
  ['CTF · BlackAlps CTF 2026（现场赛）', '2026-11-07', '2026-11-07', 'https://blackalps.ch/ba-26/contest', 'BlackAlps'],
  ['CTF · Mimic CTF（Rare Byte Hub）', '2026-11-07', '2026-11-08', 'https://ctf.rarebytehub.com/events/mimic', 'Rare Byte Hub'],
  ['CTF · CSAW CTF Final Round 2026（Jeopardy）', '2026-11-13', '2026-11-14', 'https://ctf.csaw.io/', 'NYUSEC'],
  ['CTF · Platypwn 2026（Jeopardy）', '2026-11-14', '2026-11-14', 'https://platypwnies.de/events/platypwn/', 'Platypwnies'],
  ['CTF · WolvCTF 2026（Jeopardy）', '2026-11-14', '2026-11-16', 'https://wolvctf.io/', 'w01verines'],
  ['CTF · InIt CTF 2026（Jeopardy）', '2026-11-14', '2026-11-15', 'https://hackersinindia.com/init-ctf', 'Hackers In India'],
  ['CTF · EyesOpenCTF 2026（第 7 届）', '2026-11-20', '2026-11-22', 'https://eyesopensecurity.com/ctf-briefing.html', 'EyesOpen Security'],
  ['CTF · GlacierCTF 2026（Jeopardy）', '2026-11-21', '2026-11-22', 'https://glacierctf.com/', 'LosFuzzys'],
  ['CTF · Outback Overflow 2026（Jeopardy）', '2026-11-21', '2026-11-22', 'http://hscyber.org/', 'HSCC'],
  ['CTF · Crate-CTF 2026（Jeopardy）', '2026-11-21', '2026-11-22', 'https://foi.se/cratectf', 'Crate-CTF'],
  ['CTF · CyberSci Regional Qualifiers 2026-27（现场赛）', '2026-11-21', '2026-11-22', 'https://cybersecuritychallenge.ca/', 'CyberSci'],
  ['CTF · Seize da Flaq 2026（现场赛）', '2026-11-21', '2026-11-22', 'https://seizedaflaq.cyberonites.com/', 'Cyberonites'],
  ['CTF · LakeCTF Quals 26-27（Jeopardy）', '2026-11-28', '2026-11-29', 'https://lakectf.epfl.ch/', 'polygl0ts (EPFL)'],
  ['CTF · BlackHat MEA CTF Final 2026（现场赛）', '2026-12-01', '2026-12-03', 'https://blackhatmea.com/capture-the-flag', 'SAFCSP'],
  ['CTF · x3CTF 2026（Jeopardy）', '2026-12-05', '2026-12-07', 'https://x3c.tf/', 'x3CTF'],
  ['CTF · niteCTF 2026（Jeopardy）', '2026-12-11', '2026-12-13', 'https://nitectf.cryptonitemit.in/', 'Cryptonite'],
  ['CTF · BSides Algiers 2026（Jeopardy）', '2026-12-18', '2026-12-19', 'https://shellmates.club/', 'Shellmates'],
  ['CTF · BackdoorCTF 2026（Jeopardy）', '2026-12-19', '2026-12-20', 'https://backdoor.infoseciitr.in/', 'InfoSecIITR'],
];

const ctfEvents = ctf.map(function (r) {
  return {
    title: r[0], cat: 'security', type: 'event',
    start: r[1], end: r[2], deadline: r[2],
    url: r[3],
    benefit: 'CTFtime 实时收录的全球 CTF 赛事（国际场次，线上赛可远程参加）',
    org: r[4], tutorial: '',
  };
});

// ---------- 2) 国内 AI 赛事（WebSearch 核实） ----------
const cnEvents = [
  {
    title: '第七届中国人工智能大赛（厦门）',
    cat: 'student', type: 'event',
    start: '2026-10-20', end: '2026-11-30', deadline: '2026-10-18',
    url: 'https://www.jingjiribao.cn/static/detail.jsp?id=686484',
    benefit: '国家网信办、公安部指导，厦门市政府主办。聚焦大模型 / 具身智能 / 智能体三大方向，共 10 道赛题（技术赛 + 案例赛 + 场景赛）；技术赛线上、案例赛线上路演、场景赛厦门现场；11 月 12 日厦门颁奖，A/B 级奖项报国家网信办、公安部审批',
    org: '厦门市人民政府', tutorial: '',
  },
  {
    title: '第十一届全国青年人工智能创新创业大赛',
    cat: 'student', type: 'event',
    start: '2026-11-16', end: '2026-12-31', deadline: '2026-11-08',
    url: 'https://carc.hitsz.edu.cn/info/1022/3911.htm',
    benefit: '哈工大（深圳）计算机应用研究中心主办，不收报名费。不限专业，分创新赛道 / 创业赛道 / 中学赛道；初赛 11 月中下旬线上评审，总决赛 12 月在深圳现场答辩；需提交 PPT 项目材料',
    org: '哈尔滨工业大学（深圳）', tutorial: '',
  },
  {
    title: '2026 第九届传智杯全国大学生数智创新与AI应用大赛',
    cat: 'student', type: 'event',
    start: '2026-11-06', end: '2026-12-31', deadline: '2026-11-01',
    url: 'https://www.boxuegu.com/match/',
    benefit: '程序设计 / AIGC 设计 / 企业共创三类赛项（含具身智能机器人、金山 WPS 智能办公、无人车虚实融合）；校赛→省赛→国赛三级，11/22 省赛、12 月国赛，与期末错峰；官方免费公开课 + 往届真题',
    org: '传智教育（博学谷）', tutorial: '',
  },
  {
    title: '昇腾AI行业创新大赛 · 2026 电力行业算子专场',
    cat: 'student', type: 'event',
    start: '2026-09-22', end: '2026-11-15', deadline: '2026-11-06',
    url: 'https://www.competehub.dev/instalily.ai/competitions/urls9cae53a2d504a4b1cb52bef0bd99dc67',
    benefit: '全球计算联盟（GCC）联合华为、南方电网超高压等主办，CANN 开源社区支撑。1-3 人组队，聚焦电力场景 AI 算子开发；线上预赛至 11/6 12:00，11/15 广州线下决赛；预赛单题最高 5000 元、决赛冠军 2 万元，优秀者可加入 GCC 开发者成长计划',
    org: '全球计算联盟（GCC）· 华为', tutorial: '',
  },
  {
    title: '雾客松 2027（Wakeathon · 重庆）',
    cat: 'student', type: 'event',
    start: '2027-01-22', end: '2027-01-24', deadline: '2026-11-30',
    url: 'https://www.feishu.cn/share/base/form/shrcnbx655zRQAs0wo423C75nag',
    benefit: '技术 + 创意 + 城市 + 未来方向，面向青年（学生 / 开发者 / 设计师 / 产品经理），重庆线下 72 小时；报名截止 11/30，活动 2027/1/22-24',
    org: '雾客松组委会', tutorial: '',
  },
];

// ---------- 3) 清理过期 + 合并 ----------
const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/ai-events.json'), 'utf8'));
const kept = cur.filter(function (e) {
  if (e.type === 'daily' || e.type === 'tool') return true;
  const d = String(e.deadline || e.end || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return true;
  return d >= TODAY;
});
const removed = cur.length - kept.length;
const merged = kept.concat(ctfEvents, cnEvents);

fs.writeFileSync(path.join(ROOT, 'assets/ai-events.json'), JSON.stringify(merged, null, 1) + '\n');

// ---------- 4) 重建 skill.js 的 AI_EVENTS_SEED（整块重写，避免字符串手术） ----------
const sp = path.join(ROOT, 'js/pages/skill.js');
const lines = fs.readFileSync(sp, 'utf8').split('\n');
const start = lines.findIndex(function (l) { return l.indexOf('const AI_EVENTS_SEED = [') >= 0; });
if (start < 0) throw new Error('未找到 seed 起始行');
let close = -1;
for (let i = start + 1; i < lines.length; i++) {
  if (/\}\];\s*$/.test(lines[i])) { close = i; break; }
}
if (close < 0) throw new Error('未找到 seed 闭合行');
const body = merged.map(function (e, i) {
  return '  ' + JSON.stringify(e) + (i === merged.length - 1 ? '];' : ',');
});
lines.splice(start + 1, close - start - 1, ...body);
fs.writeFileSync(sp, lines.join('\n'));

console.log('清理过期: ' + removed + ' 条');
console.log('新增: CTF ' + ctfEvents.length + ' 条 + 国内赛事 ' + cnEvents.length + ' 条');
console.log('总数: ' + merged.length + ' 条（seed 重建于第 ' + (start + 1) + ' 行起，闭合行 ' + (close + 1) + '）');
