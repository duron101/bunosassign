@echo off
echo 🚀 快速测试开始...
echo 目标: localhost:3002

echo.
echo 1️⃣ 检查NeDB数据...
node scripts/check-nedb-data.js

echo.
echo 2️⃣ 验证数据一致性...
node scripts/data-consistency-check.js

echo.
echo 3️⃣ 快速API测试...
node scripts/test-available-api.js --quick

echo.
echo ✅ 快速测试完成！
pause
