const https = require('https');
function req(path, method, timeoutMs) {
  return new Promise((res, rej) => {
    const r = https.request({ hostname: 'cw-backup-production.up.railway.app', path, method, headers: { 'User-Agent': 'node', 'Content-Type': 'application/json' }, timeout: timeoutMs || 25000 }, (resp) => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => res({ status: resp.statusCode, body: d })); });
    r.on('timeout', () => { r.destroy(new Error('TIMEOUT')); });
    r.on('error', e => rej(e));
    r.end();
  });
}
(async () => {
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const f = await req('/api/reader/fetch', 'POST', 30000);
      const j = JSON.parse(f.body);
      console.log('=== attempt', attempt, 'status', f.status, 'added', j.added, '===');
      const arts = j.articles || [];
      if (arts.length) {
        arts.forEach((a, i) => {
          const wc = (a.text || '').split(/\s+/).filter(Boolean).length;
          const ch = (a.chapters || []).length;
          console.log((i + 1) + '. 《' + (a.title || '').slice(0, 50) + '》 词数=' + wc + ' 篇章=' + ch + ' summary?=' + !!(a.summary && a.summary.trim()));
          console.log('   首段: ' + (a.text || '').slice(0, 60).replace(/\n/g, ' '));
          console.log('   末段: ' + (a.text || '').slice(-80).replace(/\n/g, ' '));
        });
        return;
      }
    } catch (e) { console.log('attempt', attempt, 'ERR', e.message); }
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log('多次重试仍失败（Railway 可能仍在部署或网络不可达）');
})();
