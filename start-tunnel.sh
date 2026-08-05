#!/usr/bin/env bash
# 小朱工作台后端 + Cloudflare 隧道一键启动 (Linux/macOS)
set -e
echo "=============================================="
echo " 小朱工作台后端 + Cloudflare 隧道一键启动"
echo "=============================================="
cd "$(dirname "$0")"

# 1. 检查 node
if ! command -v node >/dev/null 2>&1; then
  echo "[错误] 未找到 Node.js，请先安装：https://nodejs.org/"
  exit 1
fi
echo "[1/4] Node.js 正常: $(node -v)"

# 2. 检查 cloudflared
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "[2/4] 未找到 cloudflared，请先安装："
  echo "  macOS: brew install cloudflared"
  echo "  Linux: 见 https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 1
fi
echo "[2/4] cloudflared 正常"

# 3. 启动后端
echo "[3/4] 启动后端 server.js (端口 3000)..."
if command -v python3 >/dev/null 2>&1; then
  nohup node server.js > server.log 2>&1 &
else
  nohup node server.js > server.log 2>&1 &
fi
echo "      后端已在后台启动 (日志: server.log)"
sleep 3

# 4. 启动隧道
echo "[4/4] 启动 Cloudflare 隧道（国内可访问）..."
echo ""
echo "等待几秒后，下方会显示："
echo "  https://xxxxxxxx.trycloudflare.com  <-- 这就是公网地址"
echo "把它填到 App 的「提醒设置 → 日历订阅 → 后端地址」即可。"
echo ""
echo "注意：此窗口不要关闭，关了就断网。"
echo "=============================================="
cloudflared tunnel --url http://localhost:3000
