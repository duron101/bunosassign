#!/bin/bash

# 奖金模拟系统开发环境启动脚本
# 支持边开发边测试，热重载开发

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

# 检查Node.js环境
check_nodejs() {
    log_info "检查Node.js环境..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 16+"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js版本过低，需要16+，当前版本: $(node --version)"
        exit 1
    fi
    
    log_success "Node.js版本检查通过: $(node --version)"
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用..."
    
    # 检查前端端口3001
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口3001已被占用，正在停止冲突进程..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # 检查后端端口3000
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口3000已被占用，正在停止冲突进程..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    log_success "端口检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 安装前端依赖
    if [ ! -d "frontend/node_modules" ]; then
        log_info "安装前端依赖..."
        cd frontend
        npm install
        cd ..
    fi
    
    # 安装后端依赖
    if [ ! -d "backend/node_modules" ]; then
        log_info "安装后端依赖..."
        cd backend
        npm install
        cd ..
    fi
    
    log_success "依赖安装完成"
}

# 创建开发环境目录
create_dev_dirs() {
    log_info "创建开发环境目录..."
    
    # 创建模拟数据目录
    mkdir -p backend/mock
    mkdir -p backend/uploads/dev
    mkdir -p backend/logs
    
    # 创建前端开发目录
    mkdir -p frontend/src/mock
    
    log_success "开发环境目录创建完成"
}

# 启动后端开发服务
start_backend_dev() {
    log_info "启动后端开发服务..."
    
    cd backend
    
    # 设置开发环境变量
    export NODE_ENV=development
    export PORT=3001
    export ENABLE_MOCK_DATA=true
    export ENABLE_DB_LOGGING=true
    export ENABLE_API_LOGGING=true
    
    # 启动开发服务（支持热重载）
    npm run dev &
    
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend-dev.pid
    
    cd ..
    
    log_success "后端开发服务启动成功 (PID: $BACKEND_PID)"
}

# 启动前端开发服务
start_frontend_dev() {
    log_info "启动前端开发服务..."
    
    cd frontend
    
    # 启动Vite开发服务器（支持热重载）
    npm run dev &
    
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend-dev.pid
    
    cd ..
    
    log_success "前端开发服务启动成功 (PID: $FRONTEND_PID)"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    # 等待后端服务启动
    local backend_ready=false
    local frontend_ready=false
    
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            if [ "$backend_ready" = false ]; then
                log_success "后端服务已就绪: http://localhost:3001"
                backend_ready=true
            fi
        fi
        
        if curl -f http://localhost:3001 >/dev/null 2>&1; then
            if [ "$frontend_ready" = false ]; then
                log_success "前端服务已就绪: http://localhost:3001"
                frontend_ready=true
            fi
        fi
        
        if [ "$backend_ready" = true ] && [ "$frontend_ready" = true ]; then
            break
        fi
        
        sleep 1
    done
    
    if [ "$backend_ready" = true ] && [ "$frontend_ready" = true ]; then
        log_success "所有服务启动完成！"
    else
        log_warning "部分服务可能未完全启动，请检查日志"
    fi
}

# 显示开发信息
show_dev_info() {
    echo ""
    log_success "🎉 开发环境启动成功！"
    echo ""
    log_info "服务访问地址:"
    log_info "  前端页面: http://localhost:3001"
    log_info "  后端API: http://localhost:3001"
    log_info "  API文档: http://localhost:3001/api/docs"
    echo ""
    log_info "开发特性:"
    log_info "  ✅ 前端热重载 (Vite)"
    log_info "  ✅ 后端热重载 (Nodemon)"
    log_info "  ✅ 模拟数据支持"
    log_info "  ✅ 实时日志输出"
    echo ""
    log_info "开发工具:"
    log_info "  查看后端日志: tail -f backend/logs/app.log"
    log_info "  查看前端日志: 浏览器开发者工具"
    log_info "  重启后端: kill -HUP \$(cat backend-dev.pid)"
    log_info "  重启前端: kill -HUP \$(cat frontend-dev.pid)"
    echo ""
    log_info "停止服务:"
    log_info "  ./scripts/dev-stop.sh"
    echo ""
    log_warning "注意: 开发环境使用模拟数据，数据库功能暂未完善"
}

# 清理函数
cleanup() {
    log_info "清理开发环境..."
    
    # 停止后端服务
    if [ -f "backend-dev.pid" ]; then
        local backend_pid=$(cat backend-dev.pid)
        if kill -0 $backend_pid 2>/dev/null; then
            kill $backend_pid
            log_info "后端服务已停止"
        fi
        rm -f backend-dev.pid
    fi
    
    # 停止前端服务
    if [ -f "frontend-dev.pid" ]; then
        local frontend_pid=$(cat frontend-dev.pid)
        if kill -0 $frontend_pid 2>/dev/null; then
            kill $frontend_pid
            log_info "前端服务已停止"
        fi
        rm -f frontend-dev.pid
    fi
    
    log_success "开发环境清理完成"
}

# 信号处理
trap cleanup EXIT INT TERM

# 主函数
main() {
    echo "🚀 奖金模拟系统开发环境启动"
    echo "=================================="
    
    check_nodejs
    check_ports
    install_dependencies
    create_dev_dirs
    start_backend_dev
    start_frontend_dev
    wait_for_services
    show_dev_info
    
    log_info "开发环境运行中... 按 Ctrl+C 停止服务"
    
    # 保持脚本运行
    wait
}

# 执行主函数
main "$@"