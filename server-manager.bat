@echo off
echo === 아이리포트 서버 관리 ===
echo.
echo 1. 서버 재시작
echo 2. 서버 종료만
echo 3. 서버 시작만
echo 4. 데이터베이스 확인
echo 5. 테스트 데이터 추가 후 서버 재시작
echo.
set /p choice=선택하세요 (1-5): 

if "%choice%"=="1" goto restart
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto start
if "%choice%"=="4" goto check
if "%choice%"=="5" goto adddata
goto end

:restart
echo.
echo === 서버 재시작 중 ===
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8888') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
cd /d C:\workspace\ireport
start "IReport Server" node main.js
echo 서버가 재시작되었습니다!
goto end

:stop
echo.
echo === 서버 종료 중 ===
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8888') do (
    taskkill /F /PID %%a
)
echo 서버가 종료되었습니다!
goto end

:start
echo.
echo === 서버 시작 중 ===
cd /d C:\workspace\ireport
start "IReport Server" node main.js
echo 서버가 시작되었습니다!
goto end

:check
echo.
echo === 데이터베이스 확인 중 ===
cd /d C:\workspace\ireport\debug
node check-database.js
goto end

:adddata
echo.
echo === 테스트 데이터 추가 중 ===
cd /d C:\workspace\ireport
node add-test-cases-api.js
echo.
echo 데이터 추가 완료! 서버를 재시작합니다...
timeout /t 2 /nobreak >nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8888') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
start "IReport Server" node main.js
echo 서버가 재시작되었습니다!
goto end

:end
echo.
echo http://localhost:8888/construction-cases 에서 확인하세요.
echo.
pause
