@echo off
echo 실행 중인 Node.js 서버를 찾고 있습니다...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8888') do (
    echo 포트 8888을 사용하는 프로세스 ID: %%a
    taskkill /F /PID %%a
    echo 서버가 종료되었습니다.
)
echo 완료!
pause
