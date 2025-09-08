@echo off
echo Bonus System - Development Setup
echo =================================

echo.
echo 1. Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Please install Node.js first
    pause
    exit /b 1
)

echo.
echo 2. Checking MySQL service...
mysql --version
if %errorlevel% neq 0 (
    echo WARNING: MySQL not found, using memory storage
)

echo.
echo 3. Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend dependency installation failed
    pause
    exit /b 1
)

echo.
echo 4. Configuring backend environment...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo Please edit backend/.env file for database connection
        pause
    )
)

echo.
echo 5. Installing frontend dependencies...
cd ../frontend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependency installation failed
    pause
    exit /b 1
)

echo.
echo 6. Initializing database...
cd ..
if exist database\init.sql (
    mysql -u root -p < database/init.sql
    if %errorlevel% neq 0 (
        echo WARNING: Database initialization may have failed
    )
)

echo.
echo =================================
echo Development setup completed!
echo.
echo Start commands:
echo Backend: cd backend ^&^& npm run dev
echo Frontend: cd frontend ^&^& npm run dev
echo.
echo Access URLs:
echo Frontend: http://localhost:8080
echo Backend: http://localhost:3000
echo API Docs: http://localhost:3000/api/docs
echo.
echo Default account: admin / admin123
echo =================================
pause