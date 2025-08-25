#!/bin/bash

# 奖金模拟系统开发环境停止脚本

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

# 停止开发服务
stop_dev_services() {
    log_info "停止开发环境服务..."
    
    # 停止后端服务
    if [ -f "backend-dev.pid" ]; then
        local backend_pid=$(cat backend-dev.pid)
        if kill -0 $backend_pid 2>/dev/null; then
            kill $backend_pid
            log_success "后端服务已停止 (PID: $backend_pid)"
        else
            log_warning "后端服务进程不存在"
        fi
        rm -f backend-dev.pid
    else
        log_warning "未找到后端服务PID文件"
    fi
    
    # 停止前端服务
    if [ -f "frontend-dev.pid" ]; then
        local frontend_pid=$(cat frontend-dev.pid)
        if kill -0 $frontend_pid 2>/dev/null; then
            kill $frontend_pid
            log_success "前端服务已停止 (PID: $frontend_pid)"
        else
            log_warning "前端服务进程不存在"
        fi
        rm -f frontend-dev.pid
    else
        log_warning "未找到前端服务PID文件"
    fi
    
    # 强制停止可能残留的Node.js进程
    local node_processes=$(pgrep -f "node.*dev" || true)
    if [ ! -z "$node_processes" ]; then
        log_info "停止残留的Node.js开发进程..."
        echo $node_processes | xargs kill -9 2>/dev/null || true
        log_success "残留进程已清理"
    fi
    
    # 检查端口占用
    log_info "检查端口占用状态..."
    
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口8080仍被占用，强制清理..."
        lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    fi
    
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口3001仍被占用，强制清理..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    fi
    
    log_success "开发环境服务已完全停止"
}

# 清理开发环境
cleanup_dev_env() {
    log_info "清理开发环境..."
    
    # 清理PID文件
    rm -f backend-dev.pid frontend-dev.pid
    
    # 清理日志文件（可选）
    if [ -f "backend.log" ]; then
        rm -f backend.log
        log_info "后端日志文件已清理"
    fi
    
    if [ -f "frontend.log" ]; then
        rm -f frontend.log
        log_info "前端日志文件已清理"
    fi
    
    log_success "开发环境清理完成"
}

# 显示帮助信息
show_help() {
    echo "🚀 奖金模拟系统开发环境停止脚本"
    echo "=================================="
    echo ""
    echo "使用方法: $0 [选项]"
    echo ""
    echo "可用选项:"
    echo "  stop      停止开发服务（默认）"
    echo "  cleanup   清理开发环境"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0         # 停止开发服务"
    echo "  $0 cleanup # 清理开发环境"
    echo "  $0 help    # 显示帮助"
}

# 主函数
main() {
    case "${1:-stop}" in
        stop)
            stop_dev_services
            ;;
        cleanup)
            stop_dev_services
            cleanup_dev_env
            ;;
        help|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
