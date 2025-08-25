@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 数据库数据导入脚本
echo ======================
echo.

echo [INFO] 检查环境...
echo.

REM 检查Node.js
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查数据文件
if not exist "..\database\bonus_system.json" (
    echo ❌ 错误: 未找到数据文件 ..\database\bonus_system.json
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

echo [INFO] 开始导入数据到数据库...
echo.

REM 设置环境变量
set NODE_ENV=development
set PORT=3001

REM 运行导入脚本
cd backend
node ..\scripts\import-to-database.js

if !errorlevel! equ 0 (
    echo.
    echo 🎉 数据导入成功！
    echo.
    echo [INFO] 下一步操作:
    echo   1. 重启后端服务
    echo   2. 刷新前端页面
    echo   3. 检查员工管理页面是否显示正确的部门和岗位信息
) else (
    echo.
    echo ❌ 数据导入失败，请检查错误信息
)

echo.
pause
