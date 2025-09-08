#!/bin/bash

# 奖金模拟系统开发环境快速启动脚本
# 自动解决端口冲突，快速启动开发环境

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

# 强制清理端口占用
force_clean_ports() {
    log_info "强制清理端口占用..."
    
    # 清理端口8080
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口8080被占用，强制清理..."
        lsof -ti:8080 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # 清理端口3001
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口3001被占用，强制清理..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # 清理端口3000（如果有其他服务）
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口3000被占用，强制清理..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # 强制停止所有Node.js进程
    local node_processes=$(pgrep -f "node" || true)
    if [ ! -z "$node_processes" ]; then
        log_warning "发现Node.js进程，强制清理..."
        echo $node_processes | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    log_success "端口清理完成"
}

# 检查并安装依赖
check_dependencies() {
    log_info "检查项目依赖..."
    
    # 检查前端依赖
    if [ ! -d "frontend/node_modules" ]; then
        log_warning "前端依赖缺失，正在安装..."
        cd frontend
        npm install
        cd ..
    fi
    
    # 检查后端依赖
    if [ ! -d "backend/node_modules" ]; then
        log_warning "后端依赖缺失，正在安装..."
        cd backend
        npm install
        cd ..
    fi
    
    log_success "依赖检查完成"
}

# 创建开发目录
create_dev_dirs() {
    log_info "创建开发环境目录..."
    
    mkdir -p backend/mock
    mkdir -p backend/uploads/dev
    mkdir -p backend/logs
    mkdir -p frontend/src/mock
    
    log_success "开发目录创建完成"
}

# 启动后端开发服务
start_backend() {
    log_info "启动后端开发服务..."
    
    cd backend
    
    # 设置开发环境变量
    export NODE_ENV=development
    export PORT=3001
    export ENABLE_MOCK_DATA=true
    export ENABLE_DB_LOGGING=true
    export ENABLE_API_LOGGING=true
    
    # 启动服务
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend-dev.pid
    
    cd ..
    
    log_success "后端服务启动成功 (PID: $BACKEND_PID)"
}

# 启动前端开发服务
start_frontend() {
    log_info "启动前端开发服务..."
    
    cd frontend
    
    # 启动Vite开发服务器
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend-dev.pid
    
    cd ..
    
    log_success "前端服务启动成功 (PID: $FRONTEND_PID)"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    
    local backend_ready=false
    local frontend_ready=false
    local max_wait=60
    
    for i in $(seq 1 $max_wait); do
        # 检查后端服务
        if ! $backend_ready && curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            log_success "后端服务已就绪: http://localhost:3001"
            backend_ready=true
        fi
        
        # 检查前端服务
        if ! $frontend_ready && curl -f http://localhost:8080 >/dev/null 2>&1; then
            log_success "前端服务已就绪: http://localhost:8080"
            frontend_ready=true
        fi
        
        # 如果两个服务都就绪，退出循环
        if $backend_ready && $frontend_ready; then
            break
        fi
        
        # 显示等待进度
        if [ $((i % 5)) -eq 0 ]; then
            log_info "等待服务启动... ($i/$max_wait)"
        fi
        
        sleep 1
    done
    
    if $backend_ready && $frontend_ready; then
        log_success "所有服务启动完成！"
    else
        log_warning "部分服务可能未完全启动，请检查日志"
        if ! $backend_ready; then
            log_warning "后端服务未就绪，查看日志: tail -f backend.log"
        fi
        if ! $frontend_ready; then
            log_warning "前端服务未就绪，查看日志: tail -f frontend.log"
        fi
    fi
}

# 显示启动信息
show_startup_info() {
    echo ""
    log_success "🎉 开发环境启动成功！"
    echo ""
    log_info "服务访问地址:"
    log_info "  前端页面: http://localhost:8080"
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
    log_info "  查看后端日志: tail -f backend.log"
    log_info "  查看前端日志: tail -f frontend.log"
    log_info "  停止服务: ./scripts/dev-stop.sh"
    echo ""
    log_warning "注意: 开发环境使用模拟数据，数据库功能暂未完善"
    echo ""
    log_info "按 Ctrl+C 停止所有服务"
}

# 清理函数
cleanup() {
    log_info "收到停止信号，正在清理..."
    
    # 停止后端服务
    if [ -f "backend-dev.pid" ]; then
        local backend_pid=$(cat backend-dev.pid)
        if kill -0 $backend_pid 2>/dev/null; then
            kill $backend_pid
        fi
        rm -f backend-dev.pid
    fi
    
    # 停止前端服务
    if [ -f "frontend-dev.pid" ]; then
        local frontend_pid=$(cat frontend-dev.pid)
        if kill -0 $frontend_pid 2>/dev/null; then
            kill $frontend_pid
        fi
        rm -f frontend-dev.pid
    fi
    
    log_success "开发环境已停止"
    exit 0
}

# 信号处理
trap cleanup EXIT INT TERM

# 主函数
main() {
    echo "🚀 奖金模拟系统开发环境快速启动"
    echo "=================================="
    
    # 强制清理端口
    force_clean_ports
    
    # 检查依赖
    check_dependencies
    
    # 创建目录
    create_dev_dirs
    
    # 启动服务
    start_backend
    start_frontend
    
    # 等待服务启动
    wait_for_services
    
    # 显示信息
    show_startup_info
    
    # 保持脚本运行
    wait
}

# 执行主函数
main "$@"
