@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 奖金模拟系统生产环境启动脚本 (Windows版本)
REM 使用优化版混合服务器方案

echo 🚀 奖金模拟系统生产环境部署
echo ==================================

REM 检查Node.js环境
echo [INFO] 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js未安装，请先安装Node.js 16+
    pause
    exit /b 1
)

for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=!NODE_VERSION:~1!
if !NODE_VERSION! lss 16 (
    echo [ERROR] Node.js版本过低，需要16+，当前版本: 
    node --version
    pause
    exit /b 1
)

echo [SUCCESS] Node.js版本检查通过: 
node --version

REM 检查PM2
echo [INFO] 检查PM2...
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] PM2未安装，正在安装...
    npm install -g pm2
    if %errorlevel% neq 0 (
        echo [ERROR] PM2安装失败
        pause
        exit /b 1
    )
    echo [SUCCESS] PM2安装成功
) else (
    echo [SUCCESS] PM2已安装: 
    pm2 --version
)

REM 检查端口占用
echo [INFO] 检查端口占用...
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [WARNING] 端口3000已被占用，正在停止冲突进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 >nul
)
echo [SUCCESS] 端口检查完成

REM 安装依赖
echo [INFO] 安装项目依赖...

REM 安装前端依赖
if not exist "frontend\node_modules" (
    echo [INFO] 安装前端依赖...
    cd frontend
    call npm install --production=false
    if %errorlevel% neq 0 (
        echo [ERROR] 前端依赖安装失败
        pause
        exit /b 1
    )
    cd ..
)

REM 安装后端依赖
if not exist "backend\node_modules" (
    echo [INFO] 安装后端依赖...
    cd backend
    call npm install --production=false
    if %errorlevel% neq 0 (
        echo [ERROR] 后端依赖安装失败
        pause
        exit /b 1
    )
    cd ..
)

echo [SUCCESS] 依赖安装完成

REM 构建前端
echo [INFO] 构建前端生产版本...
cd frontend

REM 检查是否需要构建
if not exist "dist" (
    echo [INFO] 开始构建前端...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] 前端构建失败
        pause
        exit /b 1
    )
    echo [SUCCESS] 前端构建成功
) else (
    echo [INFO] 前端已构建，跳过构建步骤
)

cd ..

REM 创建日志目录
echo [INFO] 创建日志目录...
if not exist "logs" mkdir logs
echo [SUCCESS] 日志目录创建完成

REM 启动生产服务
echo [INFO] 启动生产服务...

REM 使用PM2启动服务
pm2 start ecosystem.config.js --env production
if %errorlevel% equ 0 (
    echo [SUCCESS] 生产服务启动成功
    
    REM 保存PM2配置
    pm2 save
    
    REM 显示服务状态
    echo [INFO] 服务状态:
    pm2 status
    
    REM 显示访问信息
    echo.
    echo [SUCCESS] 🎉 奖金模拟系统部署成功！
    echo [INFO] 访问地址: http://localhost:3000
    echo [INFO] 默认账号: admin
    echo [INFO] 默认密码: admin123
    echo.
    echo [INFO] PM2管理命令:
    echo [INFO]   查看状态: pm2 status
    echo [INFO]   查看日志: pm2 logs bonus-system
    echo [INFO]   重启服务: pm2 restart bonus-system
    echo [INFO]   停止服务: pm2 stop bonus-system
    
) else (
    echo [ERROR] 生产服务启动失败
    pause
    exit /b 1
)

echo.
echo [SUCCESS] 部署完成！系统正在运行中...
pause
