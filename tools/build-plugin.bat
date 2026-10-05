@echo off
REM Double-clic : fabrique dist\matheasy.plugin (contourne le blocage PowerShell pour ce seul appel)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-plugin.ps1"
pause
