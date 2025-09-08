@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔍 数据库配置检查脚本
echo ======================
echo.

echo [INFO] 检查数据库配置...
echo.

REM 检查环境变量文件
if exist "..\backend\env.development" (
    echo ✅ 找到环境配置文件: ..\backend\env.development
    echo.
    echo === 当前配置内容 ===
    type ..\backend\env.development
    echo ===================
) else (
    echo ❌ 未找到环境配置文件: ..\backend\env.development
)

echo.

REM 检查数据库连接
echo [INFO] 测试数据库连接...
echo.

cd ..\backend
set NODE_ENV=development

REM 创建临时测试脚本
(
echo const { Sequelize } = require('sequelize'^);
echo require('dotenv'^).config({ path: 'env.development' }^);
echo const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
echo   host: process.env.DB_HOST,
echo   port: process.env.DB_PORT,
echo   dialect: 'mysql',
echo   logging: false
echo }^);
echo sequelize.authenticate(^).then((^) =^> {
echo   console.log('✅ 数据库连接成功'^);
echo   console.log('   主机:', process.env.DB_HOST^);
echo   console.log('   用户:', process.env.DB_USER^);
echo   console.log('   数据库:', process.env.DB_NAME^);
echo   console.log('   端口:', process.env.DB_PORT^);
echo   process.exit(0^);
echo }^).catch(err =^> {
echo   console.error('❌ 数据库连接失败:', err.message^);
echo   process.exit(1^);
echo }^);
) > test-db.js

node test-db.js
del test-db.js

cd ..\scripts

echo.
echo ======================
echo 检查完成
echo ======================

pause
