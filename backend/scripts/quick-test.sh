#!/bin/bash

# 快速测试脚本 - 用于快速验证系统状态

echo "🚀 快速测试开始..."
echo "目标: localhost:3002"

# 1. 检查数据
echo "\n1️⃣ 检查NeDB数据..."
node scripts/check-nedb-data.js

# 2. 验证数据一致性
echo "\n2️⃣ 验证数据一致性..."
node scripts/data-consistency-check.js

# 3. 快速API测试
echo "\n3️⃣ 快速API测试..."
node scripts/test-available-api.js --quick

echo "\n✅ 快速测试完成！"
