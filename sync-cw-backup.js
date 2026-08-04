const fs = require('fs');
const https = require('https');
const path = require('path');

const TOKEN = process.env.GH_TOKEN;
const OWNER = 'zhuliliui';
const REPO = 'cw-backup';
const FILE = 'server.js';
const BRANCH = 'main';
const API = 'https://api.github.com';

function req(method, p, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = https.request(API + p, {
      method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'wb-sync',
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0,
      },
    }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks || '{}') }); }
        catch (e) { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  if (!TOKEN) { console.error('GH_TOKEN required'); process.exit(1); }
  const content = fs.readFileSync(path.join(__dirname, FILE), 'utf8');
  const b64 = Buffer.from(content).toString('base64');
  const shaRes = await req('GET', '/repos/' + OWNER + '/' + REPO + '/contents/' + FILE + '?ref=' + BRANCH);
  const sha = shaRes.body.sha;
  console.log('existing sha', sha);
  const put = await req('PUT', '/repos/' + OWNER + '/' + REPO + '/contents/' + FILE, {
    message: 'sync: ' + FILE + ' from college-workbench',
    content: b64,
    sha,
    branch: BRANCH,
  });
  console.log('PUT status', put.status, put.body);
})();
