@echo off
echo Starting Backend on 0.0.0.0:8000...
start cmd /k "cd backend && python manage.py runserver 0.0.0.0:8000"

echo Starting Frontend on 0.0.0.0:3000...
start cmd /k "cd frontend && set HOST=0.0.0.0&& npm start"

echo.
echo ========================================================
echo Servers are starting in new windows.
echo.
echo To access from another computer on your network, use:
echo http://YOUR_IP_ADDRESS:3000
echo ========================================================
pause
