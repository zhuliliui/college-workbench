# 方案3：自托管后端 + Cloudflare 隧道（国内可达 · 实时抓外网）

## 原理
- **本机跑 `server.js`**（Node 零依赖）→ 提供 AI 选题实时抓取（arXiv+HN）、外刊实时抓取
- **Cloudflare 隧道**把本机 3000 端口映射成公网 `https://xxx.trycloudflare.com`（免费、无需账号、国内直连快）
- 手机/平板上的 App 和 PWA 填这个公网地址即可实时拉取，**不再依赖 Railway（国内不稳）**

## 一、Windows 一键启动
双击 **`启动后端-Cloudflare隧道.bat`**：
1. 自动检查 Node.js（没有会提示安装）
2. 自动检查 cloudflared（没有会自动下载到当前目录）
3. 后台启动 server.js（端口 3000）
4. 前台启动隧道，几秒后显示 `https://xxxxxxxx.trycloudflare.com`

> 隧道地址每次启动都会变。**这个窗口别关**，关了隧道就断了。

## 二、Linux / macOS
```bash
chmod +x start-tunnel.sh
./start-tunnel.sh
```

## 三、手机端配置
1. 记下终端里显示的 `https://xxxxxxxx.trycloudflare.com`
2. 打开 App/网页 → 「学业 DDL」→「🔔 提醒」→「📅 日历订阅」→ 后端地址填这个网址
3. 保存并同步 → 之后「技能学习」页每日 AI 选题、「考研英语」页外刊实时抓取都走这个后端

## 四、手动验证后端
浏览器打开 `http://localhost:3000/health`，应返回 `{"ok":true,...}`。
公网验证：浏览器打开 `https://你的隧道地址/health`。

## 五、常见问题
| 问题 | 解决 |
|---|---|
| 下载 cloudflared 失败（GitHub 被墙） | 用国内镜像：`https://ghproxy.com/https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe.zip` 或让 AI 代下 |
| 隧道地址变了 | 每次启动都变；改 App 里的后端地址即可 |
| 电脑休眠/关屏断网 | 隧道会断；保持电脑开机且不睡眠（电源设置里关掉睡眠） |
| 不想开电脑 | 继续用 Railway（可能国内不稳），或让 AI 定期刷新内置种子（方案1+2） |
