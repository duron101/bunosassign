@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔧 安装 SQLite 依赖脚本
echo ========================
echo.

echo [INFO] 切换到后端目录...
cd ..\backend

echo [INFO] 安装 SQLite3 依赖...
npm install sqlite3

echo [INFO] 安装完成后，依赖列表：
npm list sqlite3

echo.
echo ========================
echo 安装完成
echo ========================

pause
