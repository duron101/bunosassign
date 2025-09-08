@echo off
REM Windows Docker部署脚本
REM 用法: docker-deploy.bat [dev|prod] [up|down|restart|logs]

setlocal enabledelayedexpansion

REM 默认参数
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

set ACTION=%2
if "%ACTION%"=="" set ACTION=up

echo [INFO] 奖金模拟系统 Docker部署脚本 (Windows)
echo [INFO] 环境: %ENVIRONMENT%, 操作: %ACTION%

REM 检查Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker 未安装或不在PATH中
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose 未安装或不在PATH中
    exit /b 1
)

echo [SUCCESS] 环境检查通过

REM 创建必要目录
if not exist "docker\secrets" mkdir "docker\secrets"
if not exist "logs\backend" mkdir "logs\backend"
if not exist "logs\frontend" mkdir "logs\frontend"
if not exist "data\nedb" mkdir "data\nedb"

REM 设置环境变量
if "%ENVIRONMENT%"=="dev" (
    set COMPOSE_FILE=docker-compose.yml;docker-compose.dev.yml
    set COMPOSE_PROFILES=default
) else if "%ENVIRONMENT%"=="prod" (
    set COMPOSE_FILE=docker-compose.yml;docker-compose.prod.yml
    set COMPOSE_PROFILES=production,mysql,redis
) else (
    echo [ERROR] 不支持的环境: %ENVIRONMENT%
    echo 支持的环境: dev, prod
    exit /b 1
)

echo [SUCCESS] 环境设置完成: %ENVIRONMENT%

REM 执行操作
if "%ACTION%"=="up" (
    echo [INFO] 启动服务...
    docker-compose up -d
    if %errorlevel% equ 0 (
        echo [SUCCESS] 服务启动完成
        timeout /t 5 /nobreak >nul
        goto :show_status
    ) else (
        echo [ERROR] 服务启动失败
        exit /b 1
    )
) else if "%ACTION%"=="down" (
    echo [INFO] 停止服务...
    docker-compose down
    if %errorlevel% equ 0 (
        echo [SUCCESS] 服务已停止
    )
) else if "%ACTION%"=="restart" (
    echo [INFO] 重启服务...
    docker-compose restart
    if %errorlevel% equ 0 (
        echo [SUCCESS] 服务已重启
        goto :show_status
    )
) else if "%ACTION%"=="logs" (
    echo [INFO] 查看服务日志...
    docker-compose logs -f
) else if "%ACTION%"=="status" (
    goto :show_status
) else if "%ACTION%"=="build" (
    echo [INFO] 重新构建镜像...
    docker-compose build --no-cache
    if %errorlevel% equ 0 (
        echo [SUCCESS] 镜像构建完成
    )
) else if "%ACTION%"=="cleanup" (
    echo [INFO] 清理Docker资源...
    docker-compose down -v
    docker image prune -f
    echo [SUCCESS] 清理完成
) else (
    echo [ERROR] 不支持的操作: %ACTION%
    echo 支持的操作: up, down, restart, logs, status, build, cleanup
    goto :usage
    exit /b 1
)

goto :end

:show_status
echo [INFO] 服务状态:
docker-compose ps
echo.

echo [INFO] 访问地址:
if "%ENVIRONMENT%"=="dev" (
    echo   前端: http://localhost:8080
    echo   后端API: http://localhost:3000/api
    echo   API文档: http://localhost:3000/api/docs
) else (
    echo   前端: http://localhost
    echo   后端API: http://localhost:3000/api
    echo   数据库管理: http://localhost:8081
)
goto :end

:usage
echo.
echo 用法: %0 [环境] [操作]
echo.
echo 环境:
echo   dev   - 开发环境 (默认)
echo   prod  - 生产环境
echo.
echo 操作:
echo   up      - 启动服务 (默认)
echo   down    - 停止服务
echo   restart - 重启服务
echo   logs    - 查看日志
echo   status  - 显示状态
echo   build   - 重新构建镜像
echo   cleanup - 清理资源
echo.
echo 示例:
echo   %0 dev up      # 启动开发环境
echo   %0 prod up     # 启动生产环境
echo   %0 logs        # 查看日志

:end
endlocal