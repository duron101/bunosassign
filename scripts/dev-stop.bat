@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 奖金模拟系统开发环境停止脚本 (Windows版本)

if "%1"=="" goto stop_services
if "%1"=="stop" goto stop_services
if "%1"=="cleanup" goto cleanup_env
if "%1"=="help" goto show_help

goto show_help

:stop_services
echo [INFO] 停止开发环境服务...

REM 停止后端服务
if exist "backend-dev.pid" (
    set /p backend_pid=<backend-dev.pid
    echo [INFO] 停止后端服务 (PID: !backend_pid!)...
    taskkill /F /PID !backend_pid! >nul 2>&1
    if !errorlevel! equ 0 (
        echo [SUCCESS] 后端服务已停止
    ) else (
        echo [WARNING] 后端服务进程不存在或已停止
    )
    del backend-dev.pid
) else (
    echo [WARNING] 未找到后端服务PID文件
)

REM 停止前端服务
if exist "frontend-dev.pid" (
    set /p frontend_pid=<frontend-dev.pid
    echo [INFO] 停止前端服务 (PID: !frontend_pid!)...
    taskkill /F /PID !frontend_pid! >nul 2>&1
    if !errorlevel! equ 0 (
        echo [SUCCESS] 前端服务已停止
    ) else (
        echo [WARNING] 前端服务进程不存在或已停止
    )
    del frontend-dev.pid
) else (
    echo [WARNING] 未找到前端服务PID文件
)

REM 强制停止所有Node.js进程
echo [INFO] 停止所有Node.js进程...
taskkill /F /IM node.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo [SUCCESS] 所有Node.js进程已停止
) else (
    echo [INFO] 没有找到运行的Node.js进程
)

REM 检查端口占用
echo [INFO] 检查端口占用状态...

netstat -ano | findstr :8080 >nul
if !errorlevel! equ 0 (
    echo [WARNING] 端口8080仍被占用，强制清理...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)

netstat -ano | findstr :3001 >nul
if !errorlevel! equ 0 (
    echo [WARNING] 端口3001仍被占用，强制清理...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo [SUCCESS] 开发环境服务已完全停止
goto end

:cleanup_env
echo [INFO] 清理开发环境...

call :stop_services

REM 清理日志文件
if exist "backend.log" (
    del backend.log
    echo [INFO] 后端日志文件已清理
)

if exist "frontend.log" (
    del frontend.log
    echo [INFO] 前端日志文件已清理
)

echo [SUCCESS] 开发环境清理完成
goto end

:show_help
echo 🚀 奖金模拟系统开发环境停止脚本
echo ==================================
echo.
echo 使用方法: %0 [选项]
echo.
echo 可用选项:
echo   stop      停止开发服务（默认）
echo   cleanup   清理开发环境
echo   help      显示此帮助信息
echo.
echo 示例:
echo   %0         # 停止开发服务
echo   %0 cleanup # 清理开发环境
echo   %0 help    # 显示帮助
goto end

:end
pause
