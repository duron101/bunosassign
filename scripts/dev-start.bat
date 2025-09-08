@echo off
echo Starting Bonus System Development Environment
echo ============================================

echo.
echo Starting backend service...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting frontend service...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Services are starting...
echo Frontend: http://localhost:3001
echo Backend: http://localhost:3000
echo API Docs: http://localhost:3000/api/docs
echo.
echo Press any key to exit...
pause