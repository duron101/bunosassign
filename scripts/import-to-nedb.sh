#!/bin/bash

echo "🚀 开始使用 NeDB 导入数据..."
echo "====================================="

echo "📥 运行 NeDB 数据导入脚本..."
node scripts/import-to-nedb.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ NeDB 数据导入成功！"
    echo "💾 数据已自动持久化到 database 目录"
    echo "💡 现在前端应该可以从 NeDB 获取数据了"
else
    echo ""
    echo "❌ NeDB 数据导入失败！"
    echo "🔍 请检查错误信息并重试"
fi
