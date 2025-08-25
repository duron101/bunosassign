@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔧 安装纯 JavaScript SQLite 依赖脚本
echo ======================================
echo.

echo [INFO] 切换到后端目录...
cd ..\backend

echo [INFO] 安装 sqlite 依赖（纯 JavaScript 实现）...
npm install sqlite

echo [INFO] 安装完成后，依赖列表：
npm list sqlite

echo.
echo ======================================
echo 安装完成
echo ======================================

pause
