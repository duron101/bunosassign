@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🌱 初始化示例数据脚本
echo ======================
echo.

echo [INFO] 开始初始化示例数据...
echo.

REM 创建业务线
echo === 创建业务线 ===
curl -X POST "http://localhost:3001/api/business-lines" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"name\":\"核心业务线\",\"code\":\"CORE\",\"description\":\"公司核心业务\",\"weight\":0.6}"
echo.

curl -X POST "http://localhost:3001/api/business-lines" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"name\":\"创新业务线\",\"code\":\"INNOV\",\"description\":\"创新业务探索\",\"weight\":0.4}"
echo.

REM 创建部门
echo === 创建部门 ===
curl -X POST "http://localhost:3001/api/departments" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"name\":\"技术部\",\"code\":\"TECH\",\"description\":\"负责技术开发\",\"businessLineId\":1}"
echo.

curl -X POST "http://localhost:3001/api/departments" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"name\":\"市场部\",\"code\":\"MKT\",\"description\":\"负责市场营销\",\"businessLineId\":1}"
echo.

curl -X POST "http://localhost:3001/api/departments" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"name\":\"人事部\",\"code\":\"HR\",\"description\":\"负责人力资源\",\"businessLineId\":2}"
echo.

REM 创建岗位
echo === 创建岗位 ===
curl -X POST "http://localhost:3001/api/positions" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"name\":\"高级工程师\",\"code\":\"SE\",\"level\":\"P5\",\"benchmarkValue\":150000,\"description\":\"高级技术开发岗位\"}"
echo.

curl -X POST "http://localhost:3001/api/positions" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"name\":\"市场经理\",\"code\":\"MM\",\"level\":\"M3\",\"benchmarkValue\":120000,\"description\":\"市场管理岗位\"}"
echo.

curl -X POST "http://localhost:3001/api/positions" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"name\":\"人事专员\",\"code\":\"HR\",\"level\":\"P3\",\"benchmarkValue\":80000,\"description\":\"人力资源专员岗位\"}"
echo.

echo ======================
echo 数据初始化完成
echo ======================
echo.
echo [INFO] 请刷新页面查看效果
echo.

pause
