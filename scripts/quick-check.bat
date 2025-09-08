@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔍 快速数据检查脚本
echo ===================
echo.

echo [INFO] 检查数据库状态...
echo.

REM 检查健康状态
echo === 健康检查 ===
curl -s http://localhost:3001/health
echo.
echo.

REM 检查部门总数
echo === 部门数据 ===
for /f "tokens=2 delims=:" %%a in ('curl -s "http://localhost:3001/api/departments?pageSize=1" ^| findstr "total"') do (
    echo 部门总数: %%a
)
echo.

REM 检查岗位总数
echo === 岗位数据 ===
for /f "tokens=2 delims=:" %%a in ('curl -s "http://localhost:3001/api/positions?pageSize=1" ^| findstr "total"') do (
    echo 岗位总数: %%a
)
echo.

REM 检查业务线总数
echo === 业务线数据 ===
for /f "tokens=2 delims=:" %%a in ('curl -s "http://localhost:3001/api/business-lines?pageSize=1" ^| findstr "total"') do (
    echo 业务线总数: %%a
)
echo.

echo ===================
echo 检查完成
echo ===================

pause
