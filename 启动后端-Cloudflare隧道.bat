@echo off
title Workbench Tunnel (backend must run separately)
cd /d "%~dp0"
echo [1/3] Checking backend on http://localhost:3000 ...
curl -s -o nul -w "%%{http_code}" --max-time 5 http://localhost:3000/health > _check.txt
set /p CODE=<_check.txt
del _check.txt >nul 2>nul
if not "%CODE%"=="200" (
  echo [ERROR] Backend is NOT running on port 3000.
  echo   Open a cmd window and run these lines first:
  echo     cd /d D:\buddycode\college-workbench
  echo     set HTTP_PROXY=http://127.0.0.1:7890
  echo     set HTTPS_PROXY=http://127.0.0.1:7890
  echo     node server.js
  echo   Keep that window open, then run this file again.
  pause
  exit /b 1
)
echo [2/3] Backend OK (port 3000 is alive)
if not exist "%~dp0cloudflared.exe" (
  echo [ERROR] cloudflared.exe missing. Put it in: %~dp0
  pause
  exit /b 1
)
echo [3/3] Starting Cloudflare tunnel...
echo   Wait for: https://xxxxxxxx.trycloudflare.com
echo   Paste it into App: Reminder  Calendar Subscription  Backend URL
echo   Keep this window open.
cloudflared tunnel --url http://localhost:3000
pause
