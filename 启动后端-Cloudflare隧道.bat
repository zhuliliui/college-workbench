@echo off
chcp 65001 >nul
title 小朱工作台 - 后端 + Cloudflare 隧道
echo ==============================================
echo  小朱工作台后端 + Cloudflare 隧道一键启动
echo ==============================================
echo.

rem --- 1. 检查 node ---
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [错误] 未找到 Node.js，请先安装：https://nodejs.org/
  pause
  exit /b 1
)
echo [1/4] Node.js 正常：%node%

rem --- 2. 检查 cloudflared ---
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
  echo [2/4] 未找到 cloudflared，开始下载...
  set CF_VER=2024.11.1
  curl -L -o "%TEMP%\cloudflared-windows-amd64.zip" "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe.zip" 2>nul
  if not exist "%TEMP%\cloudflared-windows-amd64.zip" (
    echo [错误] 下载失败，请手动安装 cloudflared：
    echo   1. 打开 https://github.com/cloudflare/cloudflared/releases/latest
    echo   2. 下载 cloudflared-windows-amd64.exe
    echo   3. 改名为 cloudflared.exe 放到本目录（和 server.js 同级）
    pause
    exit /b 1
  )
  powershell -NoProfile -Command "Expand-Archive -Force '%TEMP%\cloudflared-windows-amd64.zip' '%TEMP%\cloudflared'" >nul 2>nul
  copy /Y "%TEMP%\cloudflared\cloudflared.exe" cloudflared.exe >nul 2>nul
  if exist cloudflared.exe (
    echo       cloudflared.exe 已下载到当前目录
  ) else (
    echo [错误] 解压失败，请手动下载 cloudflared.exe 到本目录
    pause
    exit /b 1
  )
)

rem --- 3. 启动后端 server.js ---
echo [3/4] 启动后端 server.js（端口 3000）...
start "小朱工作台后端" cmd /k "cd /d %~dp0 && node server.js"
echo       后端已在后台启动，稍候...

timeout /t 3 /nobreak >nul

rem --- 4. 启动 Cloudflare 隧道 ---
echo [4/4] 启动 Cloudflare 隧道（国内可访问）...
echo.
echo 等待几秒后，下方会显示一行：
echo   https://xxxxxxxx.trycloudflare.com   ^<-- 这就是公网地址
echo 把它填到 App 的「提醒设置 → 日历订阅 → 后端地址」即可。
echo.
echo 注意：此窗口不要关闭，关了就断网。
echo ==============================================
cloudflared tunnel --url http://localhost:3000

pause
