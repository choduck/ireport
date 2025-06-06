@echo off
echo === Server Restart ===
echo.
echo 1. Stopping existing server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8888') do (
    taskkill /F /PID %%a >nul 2>&1
    echo    Port 8888 server stopped.
)
echo.
echo 2. Waiting 3 seconds...
timeout /t 3 /nobreak >nul
echo.
echo 3. Starting server...
cd /d C:\workspace\ireport
start "IReport Server" node main.js
echo.
echo === Server restarted successfully! ===
echo.
echo Check http://localhost:8888/construction-cases in your browser.
echo.
pause
