@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🗄️ 数据库数据检查脚本
echo ======================
echo.

echo [INFO] 检查数据库中的部门和岗位数据...
echo.

REM 检查部门数据
echo === 部门数据检查 ===
curl -s "http://localhost:3001/api/departments?pageSize=100" | findstr /C:"departments" /C:"total" /C:"code" /C:"message"
echo.

REM 检查岗位数据  
echo === 岗位数据检查 ===
curl -s "http://localhost:3001/api/positions?pageSize=100" | findstr /C:"positions" /C:"total" /C:"code" /C:"message"
echo.

REM 检查业务线数据
echo === 业务线数据检查 ===
curl -s "http://localhost:3001/api/business-lines?pageSize=100" | findstr /C:"businessLines" /C:"total" /C:"code" /C:"message"
echo.

echo ======================
echo 检查完成
echo ======================

pause
