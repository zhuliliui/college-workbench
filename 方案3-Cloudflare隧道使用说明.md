# 方案3：自托管后端 + Cloudflare 隧道（国内可达 · 实时抓外网）

## 原理
- **本机跑 `server.js`**（Node + undici，抓外网时走本地代理）→ 提供 AI 选题实时抓取（arXiv+HN）、外刊实时抓取（The Guardian / TIME / New Scientist 等）
- **Cloudflare 隧道**把本机 3000 端口映射成公网 `https://xxx.trycloudflare.com`（免费、无需账号、国内直连快）
- 手机/平板上的 App 和 PWA 填这个公网地址即可实时拉取，**不再依赖 Railway（国内不稳）**

## 一、整体启动流程（两个窗口，缺一不可）

```
窗口A（后端）                    窗口B（隧道）
cd /d D:\buddycode\college-workbench     双击 启动后端-Cloudflare隧道.bat
set HTTP_PROXY=http://127.0.0.1:7897     （或手动 cloudflared tunnel --url http://localhost:3000）
set HTTPS_PROXY=http://127.0.0.1:7897
node server.js
```

> ⚠️ 两个窗口都**不能关**。关 A 后端断、关 B 隧道断。
> ⚠️ 代理端口按你代理软件实际端口填（Clash 新版一般是 **7897**，旧版 7890；V2rayN 常见 10809）。`netstat -ano | findstr 7897` 能查到监听端口。
> ⚠️ 只有**抓外刊/外网**需要代理；AI 选题（arXiv/HN）不设代理也能抓。不设代理变量时后端也能正常跑（外刊会抓不到）。

## 二、Windows 隧道启动（bat 纯隧道版）

**`启动后端-Cloudflare隧道.bat`** 只负责开隧道：
1. 检查 localhost:3000 后端是否活着（活着才继续）
2. 检查本目录 `cloudflared.exe`（已随项目附带；缺失会提示手动放置）
3. 启动隧道，等几秒出现地址

> 隧道地址每次启动都会变。**这个窗口别关**，关了隧道就断了。
> ⚠️ 若双击后窗口一闪而过：确认本目录有 `cloudflared.exe`；没有就从 https://github.com/cloudflare/cloudflared/releases/latest 下载 `cloudflared-windows-amd64.exe` 改名 `cloudflared.exe` 放进来。

## 三、怎么找到「最新隧道地址」（重要）

终端里**带上下边框竖线**、形如下面的就是地址（一般在窗口中间附近，往下翻几行就能看到）：

```
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://therefore-precision-diversity-mortality.trycloudflare.com                         |
```

**快速定位**：在终端里搜索 `https://` —— 以 `.trycloudflare.com` 结尾的那一行就是。
每次启动地址都变，**手机端要跟着改**（「提醒 → 日历订阅 → 后端地址」）。

## 四、手机端配置
1. 记下终端里的 `https://xxxxxxxx.trycloudflare.com`
2. 打开 App/网页 → 「学业 DDL」→「🔔 提醒」→「📅 日历订阅」→ 后端地址填这个网址 → 「保存并同步到云端」
3. 之后「技能学习」页**每日 AI 选题**、「考研英语」页**外刊**都走这个后端

## 五、外刊自动进本地文库（已内置）
每次打开「考研英语」页，前端会自动：
- 拉取后端 `/api/reader/list` → **合并进本地文库**（`Store.english.articles`），按标题去重、保留已读状态、离线可看
- 今日后端抓到的 5 篇单独按天缓存（`readerToday`），**后端休眠也能离线回看今日外刊**
- 后端不可达时回退内置 20 篇离线种子

后端侧：每天首次启动自动抓 5 篇入库（落盘 `data/journal.json`，重启不丢）；随时可手动补抓（POST `/api/reader/fetch` 每次 +2 篇）。

## 六、手动验证后端
- 本机：浏览器打开 `http://localhost:3000/health` → `{"ok":true}`
- 外刊库：`http://localhost:3000/api/reader/list` → `"articles":[...]` 有内容即成功
- 公网：浏览器打开 `https://你的隧道地址/health`

## 七、常见问题
| 问题 | 解决 |
|---|---|
| 外刊抓不到（源失败 timeout） | 后端没走代理：在跑 server.js 的窗口 `set HTTP_PROXY=http://127.0.0.1:7897` + `set HTTPS_PROXY=...` 后重启；端口换成你代理软件实际端口 |
| 代理端口是多少 | `netstat -ano \| findstr LISTENING` 找 7890/7897/10809 等常见端口 |
| server.js 已带代理还失败 | 确认已 `npm install undici`（server.js 用 undici 走代理；Node 内置 fetch 不读代理环境变量） |
| 今天已抓过但失败 | `data/journal.json` 里 `lastDaily` 是今天 → 改成昨天再重启后端，或直接调 `POST /api/reader/fetch` |
| 隧道地址变了 | 每次启动都变；改 App 里的后端地址即可 |
| 电脑休眠/关屏断网 | 隧道会断；保持电脑开机且不睡眠（电源设置里关掉睡眠） |
| 不想开电脑 | 继续用 Railway（可能国内不稳），或让 AI 定期刷新内置种子（方案1+2） |
