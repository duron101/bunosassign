#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}奖金模拟系统 - 开发环境设置${NC}"
echo "============================="
echo

# 错误处理函数
error_exit() {
    echo -e "${RED}错误: $1${NC}"
    echo "按任意键退出..."
    read -n 1
    exit 1
}

# 成功信息函数
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. 检查Node.js版本
echo -e "${BLUE}1. 检查Node.js版本...${NC}"
if ! command -v node &> /dev/null; then
    error_exit "请先安装Node.js"
fi
node --version
success_msg "Node.js版本检查通过"

echo

# 2. 检查MySQL服务（可选）
echo -e "${BLUE}2. 检查MySQL服务...${NC}"
if command -v mysql &> /dev/null; then
    mysql --version
    success_msg "MySQL已安装"
else
    echo -e "${YELLOW}警告: 未检测到MySQL，系统将使用内存存储${NC}"
fi

echo

# 3. 安装后端依赖
echo -e "${BLUE}3. 安装后端依赖...${NC}"
cd backend
if ! npm install; then
    error_exit "后端依赖安装失败"
fi
success_msg "后端依赖安装完成"

echo

# 4. 配置后端环境变量
echo -e "${BLUE}4. 配置后端环境变量...${NC}"
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    echo "请编辑 backend/.env 文件配置数据库连接"
    echo "按任意键继续..."
    read -n 1
fi

echo

# 5. 安装前端依赖
echo -e "${BLUE}5. 安装前端依赖...${NC}"
cd ../frontend
if ! npm install; then
    error_exit "前端依赖安装失败"
fi
success_msg "前端依赖安装完成"

echo

# 6. 初始化数据库（可选）
echo -e "${BLUE}6. 初始化数据库...${NC}"
cd ..
if command -v mysql &> /dev/null; then
    echo "是否初始化数据库？(y/N)"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mysql -u root -p < database/init.sql
        if [ $? -eq 0 ]; then
            success_msg "数据库初始化成功"
        else
            echo -e "${YELLOW}警告: 数据库初始化可能失败，请手动执行${NC}"
        fi
    fi
else
    echo -e "${YELLOW}跳过数据库初始化（未安装MySQL）${NC}"
fi

echo
echo "============================="
echo -e "${GREEN}开发环境设置完成！${NC}"
echo
echo -e "${BLUE}启动命令:${NC}"
echo "后端: cd backend && npm run dev"
echo "前端: cd frontend && npm run dev"
echo "一键启动: ./scripts/dev-start.sh"
echo
echo -e "${BLUE}访问地址:${NC}"
echo "前端: http://localhost:8080"
echo "后端: http://localhost:3000"
echo "API文档: http://localhost:3000/api/docs"
echo
echo -e "${BLUE}默认账户: admin / admin123${NC}"
echo "============================="
echo "按任意键退出..."
read -n 1