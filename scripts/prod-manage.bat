@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 奖金模拟系统生产环境管理脚本 (Windows版本)
REM 用于日常运维操作

set APP_NAME=bonus-system

if "%1"=="" goto show_help

if "%1"=="start" goto start_service
if "%1"=="stop" goto stop_service
if "%1"=="restart" goto restart_service
if "%1"=="status" goto show_status
if "%1"=="logs" goto show_logs
if "%1"=="monitor" goto start_monitor
if "%1"=="update" goto update_app
if "%1"=="backup" goto backup_data
if "%1"=="health" goto health_check
if "%1"=="help" goto show_help

goto show_help

:show_help
echo 🚀 奖金模拟系统生产环境管理脚本
echo ==================================
echo.
echo 使用方法: %0 [命令]
echo.
echo 可用命令:
echo   start     启动生产服务
echo   stop      停止生产服务
echo   restart   重启生产服务
echo   status    查看服务状态
echo   logs      查看服务日志
echo   monitor   启动监控面板
echo   update    更新应用代码
echo   backup    备份数据
echo   health    健康检查
echo   help      显示此帮助信息
echo.
echo 示例:
echo   %0 start    # 启动服务
echo   %0 status   # 查看状态
echo   %0 logs     # 查看日志
goto end

:start_service
echo [INFO] 启动生产服务...
pm2 list | findstr "%APP_NAME%" >nul
if %errorlevel% equ 0 (
    echo [WARNING] 服务已在运行中，正在重启...
    pm2 restart "%APP_NAME%"
) else (
    pm2 start ecosystem.config.js --env production
)
pm2 save
echo [SUCCESS] 服务启动成功
pm2 status
goto end

:stop_service
echo [INFO] 停止生产服务...
pm2 stop "%APP_NAME%"
pm2 save
echo [SUCCESS] 服务已停止
goto end

:restart_service
echo [INFO] 重启生产服务...
pm2 restart "%APP_NAME%"
pm2 save
echo [SUCCESS] 服务重启成功
pm2 status
goto end

:show_status
echo [INFO] 服务状态:
pm2 status
goto end

:show_logs
echo [INFO] 显示服务日志 (按 Ctrl+C 退出)...
pm2 logs "%APP_NAME%" --lines 100
goto end

:start_monitor
echo [INFO] 启动PM2监控面板...
echo [INFO] 监控面板地址: http://localhost:9615
pm2 web
goto end

:update_app
echo [INFO] 开始更新应用代码...

REM 备份当前版本
if exist "frontend\dist" (
    echo [INFO] 备份当前前端版本...
    set BACKUP_DIR=frontend\dist.backup.%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set BACKUP_DIR=!BACKUP_DIR: =0!
    xcopy "frontend\dist" "!BACKUP_DIR!" /E /I /Y >nul
)

REM 拉取最新代码（如果有git）
if exist ".git" (
    echo [INFO] 拉取最新代码...
    git pull origin main 2>nul || echo [WARNING] 无法拉取最新代码，继续使用当前版本
)

REM 重新安装依赖
echo [INFO] 重新安装依赖...
cd frontend
call npm install --production=false
cd ..
cd backend
call npm install --production=false
cd ..

REM 重新构建前端
echo [INFO] 重新构建前端...
cd frontend
call npm run build
cd ..

REM 重启服务
echo [INFO] 重启服务...
pm2 restart "%APP_NAME%"
pm2 save

echo [SUCCESS] 应用更新完成
goto end

:backup_data
echo [INFO] 开始备份数据...

set BACKUP_DIR=backups\%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=!BACKUP_DIR: =0!
if not exist "!BACKUP_DIR!" mkdir "!BACKUP_DIR!"

REM 备份数据库文件
if exist "database\bonus_system.json" (
    echo [INFO] 备份数据库文件...
    copy "database\bonus_system.json" "!BACKUP_DIR!" >nul
)

REM 备份日志文件
if exist "logs" (
    echo [INFO] 备份日志文件...
    xcopy "logs" "!BACKUP_DIR!\logs" /E /I /Y >nul
)

REM 备份前端构建文件
if exist "frontend\dist" (
    echo [INFO] 备份前端构建文件...
    xcopy "frontend\dist" "!BACKUP_DIR!\dist" /E /I /Y >nul
)

REM 创建备份信息文件
echo 备份时间: %date% %time% > "!BACKUP_DIR!\backup_info.txt"
echo 备份类型: 完整备份 >> "!BACKUP_DIR!\backup_info.txt"
echo 备份内容: 数据库、日志、前端构建文件 >> "!BACKUP_DIR!\backup_info.txt"

echo [SUCCESS] 数据备份完成: !BACKUP_DIR!
goto end

:health_check
echo [INFO] 执行健康检查...

REM 检查服务状态
pm2 list | findstr "%APP_NAME%.*online" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] 服务状态: 正常
) else (
    echo [ERROR] 服务状态: 异常
    goto end
)

REM 检查端口监听
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] 端口监听: 正常 (3000)
) else (
    echo [ERROR] 端口监听: 异常 (3000)
    goto end
)

REM 检查API响应
curl -f http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] API响应: 正常
) else (
    echo [ERROR] API响应: 异常
    goto end
)

echo [SUCCESS] 健康检查完成
goto end

:end
pause
