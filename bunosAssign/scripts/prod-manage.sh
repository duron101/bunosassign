#!/bin/bash

# 奖金模拟系统生产环境管理脚本
# 用于日常运维操作

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 应用名称
APP_NAME="bonus-system"

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

# 显示帮助信息
show_help() {
    echo "🚀 奖金模拟系统生产环境管理脚本"
    echo "=================================="
    echo ""
    echo "使用方法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  start     启动生产服务"
    echo "  stop      停止生产服务"
    echo "  restart   重启生产服务"
    echo "  status    查看服务状态"
    echo "  logs      查看服务日志"
    echo "  monitor   启动监控面板"
    echo "  update    更新应用代码"
    echo "  backup    备份数据"
    echo "  health    健康检查"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动服务"
    echo "  $0 status   # 查看状态"
    echo "  $0 logs     # 查看日志"
}

# 启动服务
start_service() {
    log_info "启动生产服务..."
    
    if pm2 list | grep -q "$APP_NAME"; then
        log_warning "服务已在运行中，正在重启..."
        pm2 restart "$APP_NAME"
    else
        pm2 start ecosystem.config.js --env production
    fi
    
    pm2 save
    log_success "服务启动成功"
    pm2 status
}

# 停止服务
stop_service() {
    log_info "停止生产服务..."
    pm2 stop "$APP_NAME"
    pm2 save
    log_success "服务已停止"
}

# 重启服务
restart_service() {
    log_info "重启生产服务..."
    pm2 restart "$APP_NAME"
    pm2 save
    log_success "服务重启成功"
    pm2 status
}

# 查看状态
show_status() {
    log_info "服务状态:"
    pm2 status
    echo ""
    log_info "系统资源使用情况:"
    pm2 monit --no-daemon &
    sleep 5
    pkill -f "pm2 monit" || true
}

# 查看日志
show_logs() {
    log_info "显示服务日志 (按 Ctrl+C 退出)..."
    pm2 logs "$APP_NAME" --lines 100
}

# 启动监控面板
start_monitor() {
    log_info "启动PM2监控面板..."
    log_info "监控面板地址: http://localhost:9615"
    pm2 web
}

# 更新应用代码
update_app() {
    log_info "开始更新应用代码..."
    
    # 备份当前版本
    if [ -d "frontend/dist" ]; then
        log_info "备份当前前端版本..."
        cp -r frontend/dist frontend/dist.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # 拉取最新代码（如果有git）
    if [ -d ".git" ]; then
        log_info "拉取最新代码..."
        git pull origin main || log_warning "无法拉取最新代码，继续使用当前版本"
    fi
    
    # 重新安装依赖
    log_info "重新安装依赖..."
    cd frontend && npm install --production=false && cd ..
    cd backend && npm install --production=false && cd ..
    
    # 重新构建前端
    log_info "重新构建前端..."
    cd frontend && npm run build && cd ..
    
    # 重启服务
    log_info "重启服务..."
    pm2 restart "$APP_NAME"
    pm2 save
    
    log_success "应用更新完成"
}

# 备份数据
backup_data() {
    log_info "开始备份数据..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份数据库文件
    if [ -f "database/bonus_system.json" ]; then
        log_info "备份数据库文件..."
        cp database/bonus_system.json "$BACKUP_DIR/"
    fi
    
    # 备份日志文件
    if [ -d "logs" ]; then
        log_info "备份日志文件..."
        cp -r logs "$BACKUP_DIR/"
    fi
    
    # 备份前端构建文件
    if [ -d "frontend/dist" ]; then
        log_info "备份前端构建文件..."
        cp -r frontend/dist "$BACKUP_DIR/"
    fi
    
    # 创建备份信息文件
    echo "备份时间: $(date)" > "$BACKUP_DIR/backup_info.txt"
    echo "备份类型: 完整备份" >> "$BACKUP_DIR/backup_info.txt"
    echo "备份内容: 数据库、日志、前端构建文件" >> "$BACKUP_DIR/backup_info.txt"
    
    log_success "数据备份完成: $BACKUP_DIR"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查服务状态
    if pm2 list | grep -q "$APP_NAME.*online"; then
        log_success "服务状态: 正常"
    else
        log_error "服务状态: 异常"
        return 1
    fi
    
    # 检查端口监听
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "端口监听: 正常 (3000)"
    else
        log_error "端口监听: 异常 (3000)"
        return 1
    fi
    
    # 检查API响应
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "API响应: 正常"
    else
        log_error "API响应: 异常"
        return 1
    fi
    
    # 检查磁盘空间
    DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        log_success "磁盘空间: 正常 ($DISK_USAGE%)"
    else
        log_warning "磁盘空间: 警告 ($DISK_USAGE%)"
    fi
    
    # 检查内存使用
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    log_info "内存使用: ${MEMORY_USAGE}%"
    
    log_success "健康检查完成"
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        monitor)
            start_monitor
            ;;
        update)
            update_app
            ;;
        backup)
            backup_data
            ;;
        health)
            health_check
            ;;
        help|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
