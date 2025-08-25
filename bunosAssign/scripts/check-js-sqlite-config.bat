@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🔍 JavaScript SQLite 数据库配置检查脚本
echo ==========================================
echo.

echo [INFO] 检查 JavaScript SQLite 配置...
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

REM 检查数据库目录
if exist "..\database" (
    echo ✅ 找到数据库目录: ..\database
) else (
    echo ❌ 未找到数据库目录: ..\database
)

echo.

REM 检查数据文件
if exist "..\database\bonus_system.json" (
    echo ✅ 找到数据源文件: ..\database\bonus_system.json
) else (
    echo ❌ 未找到数据源文件: ..\database\bonus_system.json
)

echo.

echo [INFO] 测试 JavaScript SQLite 连接...
echo.

cd ..\backend
set NODE_ENV=development

REM 创建 JavaScript SQLite 测试脚本
(
echo const fs = require('fs'^);
echo const path = require('path'^);
echo.
echo console.log('=== 环境变量检查 ==='^);
echo console.log('NODE_ENV:', process.env.NODE_ENV^);
echo console.log('DB_TYPE:', process.env.DB_TYPE^);
echo console.log('DB_PATH:', process.env.DB_PATH^);
echo console.log('DB_STORAGE:', process.env.DB_STORAGE^);
echo.
echo // 检查依赖
echo try {
echo   const sequelize = require('sequelize'^);
echo   console.log('✅ Sequelize模块加载成功'^);
echo } catch (e^) {
echo   console.error('❌ Sequelize模块加载失败:', e.message^);
echo   process.exit(1^);
echo }
echo.
echo try {
echo   const sqlite = require('sqlite'^);
echo   console.log('✅ JavaScript SQLite模块加载成功'^);
echo } catch (e^) {
echo   console.error('❌ JavaScript SQLite模块加载失败:', e.message^);
echo   process.exit(1^);
echo }
echo.
echo // 加载环境变量
echo require('dotenv'^).config({ path: 'env.development' }^);
echo console.log('✅ 环境变量加载成功'^);
echo.
echo // 检查数据库文件路径
echo const dbPath = process.env.DB_STORAGE || path.join(__dirname, '../database/bonus_system.db'^);
echo console.log('数据库文件路径:', dbPath^);
echo.
echo // 检查数据库文件是否存在
echo if (fs.existsSync(dbPath^)) {
echo   console.log('✅ 数据库文件已存在'^);
echo } else {
echo   console.log('ℹ️ 数据库文件不存在，将在连接时自动创建'^);
echo }
echo.
echo // 测试数据库连接
echo const { Sequelize } = require('sequelize'^);
echo const sequelize = new Sequelize({
echo   dialect: 'sqlite',
echo   storage: dbPath,
echo   logging: false
echo }^);
echo.
echo sequelize.authenticate(^).then((^) =^> {
echo   console.log('✅ JavaScript SQLite 数据库连接成功'^);
echo   console.log('   数据库文件:', dbPath^);
echo   console.log('   数据库类型:', 'JavaScript SQLite'^);
echo   process.exit(0^);
echo }^).catch(err =^> {
echo   console.error('❌ JavaScript SQLite 数据库连接失败:'^);
echo   console.error('   错误类型:', err.constructor.name^);
echo   console.error('   错误消息:', err.message^);
echo   process.exit(1^);
echo }^);
) > test-js-sqlite.js

echo ✅ JavaScript SQLite 测试脚本已创建

echo.

echo [INFO] 运行 JavaScript SQLite 测试...
echo.

node test-js-sqlite.js

echo.

echo [INFO] 清理测试文件...
echo.

del test-js-sqlite.js

cd ..\scripts

echo.
echo ==========================================
echo 检查完成
echo ==========================================

pause
