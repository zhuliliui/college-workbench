' ============================================
' 大学生AI万能工作台 - 后端开机自启动
' 隐藏窗口运行 server.js（零依赖原生 Node）
' 开机后自动拉起：外刊/每日AI选题/AI活动 实时后端
' ============================================
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\buddycode\college-workbench"
' 0 = 隐藏窗口；node 从系统 PATH 查找
WshShell.Run "cmd /c node server.js", 0, False
