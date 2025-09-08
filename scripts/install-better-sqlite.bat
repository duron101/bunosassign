@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔧 安装 Better-SQLite3 依赖脚本
echo ===================================
echo.

echo [INFO] 切换到后端目录...
cd ..\backend

echo [INFO] 安装 better-sqlite3 依赖...
npm install better-sqlite3

echo [INFO] 安装完成后，依赖列表：
npm list better-sqlite3

echo.
echo ===================================
echo 安装完成
echo ===================================

pause
