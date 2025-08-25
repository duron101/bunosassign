@echo off
title Bonus Simulation System - Start

echo.
echo ========================================
echo    Bonus Simulation System Start
echo    (Jiang Jin Mo Ni Xi Tong)
echo ========================================
echo.

:: Check Node.js installation
echo [1/5] Checking Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found, please install Node.js 16+
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
node --version
echo OK: Node.js is available

echo.
echo [2/5] Checking project dependencies...

:: Check backend dependencies
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Backend dependency installation failed
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo OK: Backend dependencies installed
) else (
    echo OK: Backend dependencies exist
)

:: Check frontend dependencies
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Frontend dependency installation failed
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo OK: Frontend dependencies installed
) else (
    echo OK: Frontend dependencies exist
)

echo.
echo [3/5] Building frontend...
cd frontend
if not exist "dist" (
    echo Building frontend project...
    npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Frontend build failed
        cd ..
        pause
        exit /b 1
    )
    echo OK: Frontend build completed
) else (
    echo OK: Frontend already built
)
cd ..

echo.
echo [4/5] Starting application server...
echo Starting...

:: Start simple-server.js
start "Bonus System Server" cmd /k "node simple-server.js"

echo.
echo [5/5] Waiting for server to start...
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo           Startup Successful!
echo ========================================
echo  Access URL: http://localhost:3000
echo  Username: admin
echo  Password: admin123
echo  API Docs: http://localhost:3000/api/docs
echo ========================================
echo.
echo Tips:
echo  - Browser will open automatically
echo  - If not, manually visit http://localhost:3000
echo  - Press Ctrl+C in server window to stop
echo.

:: Try to open browser
timeout /t 2 /nobreak > nul
start http://localhost:3000 > nul 2>&1

echo Press any key to close this window...
pause > nul