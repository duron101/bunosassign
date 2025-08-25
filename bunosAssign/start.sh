#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 设置标题
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    奖金模拟系统 - 一键启动                    ║"
echo "║                   Bonus Simulation System                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo

# 错误处理函数
error_exit() {
    echo -e "${RED}❌ 错误: $1${NC}"
    echo
    echo "按任意键退出..."
    read -n 1
    exit 1
}

# 成功信息函数
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 信息函数
info_msg() {
    echo -e "${BLUE}$1${NC}"
}

# 警告函数
warn_msg() {
    echo -e "${YELLOW}$1${NC}"
}

# 检查Node.js
echo -e "${CYAN}[1/5] 检查Node.js环境...${NC}"
if ! command -v node &> /dev/null; then
    error_exit "未检测到Node.js，请先安装Node.js 16+
下载地址: https://nodejs.org/"
fi

NODE_VERSION=$(node --version)
echo "Node.js版本: $NODE_VERSION"
success_msg "Node.js环境正常"

echo

# 检查npm
if ! command -v npm &> /dev/null; then
    error_exit "未检测到npm，请检查Node.js安装"
fi

echo -e "${CYAN}[2/5] 检查项目依赖...${NC}"

# 检查并安装后端依赖
if [ ! -d "backend/node_modules" ]; then
    info_msg "📦 安装后端依赖..."
    cd backend
    if ! npm install; then
        cd ..
        error_exit "后端依赖安装失败"
    fi
    cd ..
    success_msg "后端依赖安装完成"
else
    success_msg "后端依赖已存在"
fi

# 检查并安装前端依赖
if [ ! -d "frontend/node_modules" ]; then
    info_msg "📦 安装前端依赖..."
    cd frontend
    if ! npm install; then
        cd ..
        error_exit "前端依赖安装失败"
    fi
    cd ..
    success_msg "前端依赖安装完成"
else
    success_msg "前端依赖已存在"
fi

echo

# 构建前端
echo -e "${CYAN}[3/5] 构建前端项目...${NC}"
cd frontend
if [ ! -d "dist" ]; then
    info_msg "🔨 构建前端项目..."
    if ! npm run build; then
        cd ..
        error_exit "前端构建失败"
    fi
    success_msg "前端构建完成"
else
    success_msg "前端已构建"
fi
cd ..

echo

# 检查端口占用
echo -e "${CYAN}[4/5] 检查端口状态...${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn_msg "⚠️  端口3000已被占用，请检查是否有其他服务在运行"
    echo "是否继续启动？(y/N)"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "启动已取消"
        exit 0
    fi
else
    success_msg "端口3000可用"
fi

# 启动服务器
echo -e "${CYAN}[5/5] 启动应用服务器...${NC}"
info_msg "🚀 启动中..."

# 在后台启动服务器
nohup node simple-server.js > server.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
echo "等待服务器启动..."
sleep 3

# 检查服务器是否启动成功
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                      🎉 启动成功！                           ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  📱 访问地址: http://localhost:3000                          ║"
    echo "║  👤 默认账户: admin                                          ║"
    echo "║  🔑 默认密码: admin123                                       ║"
    echo "║  📚 API文档: http://localhost:3000/api/docs                  ║"
    echo "║  📋 服务进程: $SERVER_PID                                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    echo -e "${BLUE}💡 提示:${NC}"
    echo "   - 服务器在后台运行，日志输出到 server.log"
    echo "   - 访问 http://localhost:3000 开始使用系统"
    echo "   - 停止服务器: kill $SERVER_PID"
    echo "   - 查看日志: tail -f server.log"
    echo
    
    # 尝试打开浏览器
    if command -v xdg-open &> /dev/null; then
        sleep 2
        xdg-open http://localhost:3000 >/dev/null 2>&1 &
    elif command -v open &> /dev/null; then
        sleep 2
        open http://localhost:3000 >/dev/null 2>&1 &
    fi
    
    echo "服务器启动完成！按任意键退出启动脚本..."
    read -n 1
else
    error_exit "服务器启动失败，请检查 server.log 文件"
fi