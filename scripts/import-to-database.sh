#!/bin/bash

# 数据库数据导入脚本
# 将 bonus_system.json 中的数据导入到真实数据库

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 数据库数据导入脚本"
echo "======================"
echo ""

log_info "检查环境..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    log_error "未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查数据文件
if [ ! -f "../database/bonus_system.json" ]; then
    log_error "未找到数据文件 ../database/bonus_system.json"
    exit 1
fi

log_success "环境检查通过"
echo ""

log_info "开始导入数据到数据库..."
echo ""

# 设置环境变量
export NODE_ENV=development
export PORT=3001

# 运行导入脚本
cd backend
node ../scripts/import-to-database.js

if [ $? -eq 0 ]; then
    echo ""
    log_success "数据导入成功！"
    echo ""
    log_info "下一步操作:"
    echo "  1. 重启后端服务"
    echo "  2. 刷新前端页面"
    echo "  3. 检查员工管理页面是否显示正确的部门和岗位信息"
else
    echo ""
    log_error "数据导入失败，请检查错误信息"
    exit 1
fi

echo ""
