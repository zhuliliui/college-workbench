@echo off
cd /d "%~dp0."
if not exist server.js (
  echo ERROR: server.js not found in this folder.
  echo Put this .bat inside the college-workbench folder and run again.
  pause
  exit /b 1
)
echo Starting College Workbench backend...
echo Keep this window open. Close it to stop the server.
echo.
node server.js
pause
