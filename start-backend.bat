@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
set LOG=D:\buddycode\college-workbench\backend-launch.log
echo [%date% %time%] 启动脚本开始 > "%LOG%"

set BACKEND_DIR=D:\buddycode\college-workbench

:: ---- 探测 node.exe ----
set NODE_EXE=
if exist "D:\backdown\Backend\nodejs\node.exe" (
  set NODE_EXE=D:\backdown\Backend\nodejs\node.exe
) else if exist "C:\Users\zhu\.workbuddy\binaries\node\versions\22.22.2\node.exe" (
  set NODE_EXE=C:\Users\zhu\.workbuddy\binaries\node\versions\22.22.2\node.exe
) else (
  for /f "tokens=*" %%a in ('where node 2^>nul') do (
    if not defined NODE_EXE set NODE_EXE=%%a
  )
)
echo node路径: %NODE_EXE% >> "%LOG%"
if not defined NODE_EXE (
  echo 未找到 node.exe，无法启动后端。请确认 Node.js 已安装。 >> "%LOG%"
  echo 未找到 node.exe，无法启动后端。请确认 Node.js 已安装。
  goto :end
)

:: ---- 端口 3000 是否被本机监听（精确：只认本地 LISTENING 的 :3000 行，排除出站连接） ----
netstat -ano | findstr /R /I "TCP.*:3000.*LISTENING" >nul
if %errorlevel% == 0 (
  echo 端口3000已被本机监听，后端可能已在运行。 >> "%LOG%"
  echo 端口3000已被本机监听，后端可能已在运行。
  goto :end
)

:: ---- 启动后端 ----
cd /d %BACKEND_DIR%
echo 正在启动后端... >> "%LOG%"
echo 正在启动后端...
start "CW-Backend" %NODE_EXE% server.js

:: ---- 等待并用 /health 验证（最权威） ----
set OK=0
for /L %%i in (1,1,10) do (
  timeout /t 1 /nobreak >nul
  curl -s -m 3 http://localhost:3000/health >nul 2>&1
  if !errorlevel! == 0 (
    set OK=1
    goto :checked
  )
)
:checked
if %OK% == 1 (
  echo 启动成功，后端 /health 正常响应（端口3000监听中）。 >> "%LOG%"
  echo 启动成功，后端 /health 正常响应（端口3000监听中）。
) else (
  echo 启动后 /health 无响应，请查看上方node窗口中的报错日志。 >> "%LOG%"
  echo 启动后 /health 无响应，请查看上方node窗口中的报错日志。
)

:end
echo [结束] 详见 %LOG% >> "%LOG%"
if not "%~1"=="hidden" pause
