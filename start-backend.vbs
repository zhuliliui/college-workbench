' 大学生AI万能工作台 - 后端启动脚本（双击运行）
' 实际启动逻辑在 start-backend.bat 中，本 VBS 仅做调用，避免 VBS 字符串转义问题。
Option Explicit
Dim WshShell
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "D:\buddycode\college-workbench\start-backend.bat visible", 1, False
