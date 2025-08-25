#!/bin/bash

# Docker服务监控脚本
# 用于监控容器健康状态和资源使用情况

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# 检查容器健康状态
check_container_health() {
    local container_name=$1
    
    # 检查容器是否运行
    if ! docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
        error "容器 $container_name 未运行"
        return 1
    fi
    
    # 检查健康状态
    local health_status=$(docker inspect "$container_name" --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    
    case $health_status in
        "healthy")
            success "容器 $container_name 健康状态: 正常"
            return 0
            ;;
        "unhealthy")
            error "容器 $container_name 健康状态: 异常"
            return 1
            ;;
        "starting")
            warning "容器 $container_name 健康状态: 启动中"
            return 0
            ;;
        "unknown")
            warning "容器 $container_name 健康状态: 未知"
            return 0
            ;;
        *)
            warning "容器 $container_name 健康状态: $health_status"
            return 0
            ;;
    esac
}

# 检查应用服务健康
check_app_health() {
    log "检查应用服务健康状态..."
    
    # 检查后端服务
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        success "后端服务健康检查通过"
    else
        error "后端服务健康检查失败"
        return 1
    fi
    
    # 检查前端服务
    if curl -f -s http://localhost:8080 > /dev/null 2>&1 || curl -f -s http://localhost > /dev/null 2>&1; then
        success "前端服务健康检查通过"
    else
        error "前端服务健康检查失败"
        return 1
    fi
}

# 监控资源使用情况
monitor_resources() {
    log "监控容器资源使用情况..."
    
    echo "容器资源统计:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo ""
    echo "磁盘使用情况:"
    docker system df
}

# 检查服务端口
check_ports() {
    log "检查服务端口状态..."
    
    local ports=("3000:Backend" "8080:Frontend" "3306:MySQL" "6379:Redis")
    
    for port_info in "${ports[@]}"; do
        local port=${port_info%:*}
        local service=${port_info#*:}
        
        if netstat -tuln | grep -q ":$port "; then
            success "端口 $port ($service) 正在监听"
        else
            warning "端口 $port ($service) 未在监听"
        fi
    done
}

# 检查日志错误
check_logs() {
    log "检查最近的错误日志..."
    
    local containers=("bonus-system-backend" "bonus-system-frontend" "bonus-system-mysql" "bonus-system-redis")
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            local error_count=$(docker logs "$container" --since=5m 2>&1 | grep -i "error\|exception\|fail" | wc -l)
            
            if [ "$error_count" -gt 0 ]; then
                warning "容器 $container 在过去5分钟内有 $error_count 个错误"
                echo "最新错误:"
                docker logs "$container" --since=5m --tail=5 2>&1 | grep -i "error\|exception\|fail" | head -3
                echo ""
            else
                success "容器 $container 无错误日志"
            fi
        fi
    done
}

# 生成监控报告
generate_report() {
    local report_file="monitoring_report_$(date +%Y%m%d_%H%M%S).log"
    
    log "生成监控报告: $report_file"
    
    {
        echo "=========================================="
        echo "奖金系统Docker监控报告"
        echo "生成时间: $(date)"
        echo "=========================================="
        echo ""
        
        echo "容器状态:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        echo "资源使用:"
        docker stats --no-stream
        echo ""
        
        echo "磁盘使用:"
        docker system df
        echo ""
        
        echo "网络连接:"
        docker network ls
        echo ""
        
    } > "$report_file"
    
    success "监控报告已生成: $report_file"
}

# 自动修复尝试
auto_fix() {
    log "尝试自动修复常见问题..."
    
    # 重启不健康的容器
    local containers=("bonus-system-backend" "bonus-system-frontend" "bonus-system-mysql" "bonus-system-redis")
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            local health_status=$(docker inspect "$container" --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
            
            if [ "$health_status" = "unhealthy" ]; then
                warning "尝试重启不健康的容器: $container"
                docker restart "$container"
                sleep 10
                
                if check_container_health "$container"; then
                    success "容器 $container 重启后恢复正常"
                else
                    error "容器 $container 重启后仍然异常"
                fi
            fi
        fi
    done
}

# 主监控函数
main_monitor() {
    log "开始Docker服务监控..."
    
    local overall_status=0
    
    # 检查容器健康状态
    local containers=("bonus-system-backend" "bonus-system-frontend")
    for container in "${containers[@]}"; do
        if ! check_container_health "$container"; then
            overall_status=1
        fi
    done
    
    # 检查应用健康状态
    if ! check_app_health; then
        overall_status=1
    fi
    
    # 监控资源使用
    monitor_resources
    echo ""
    
    # 检查端口状态
    check_ports
    echo ""
    
    # 检查日志错误
    check_logs
    echo ""
    
    # 如果有问题，尝试自动修复
    if [ $overall_status -ne 0 ]; then
        warning "检测到问题，尝试自动修复..."
        auto_fix
    fi
    
    return $overall_status
}

# 显示用法
usage() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  monitor     - 执行完整监控检查 (默认)"
    echo "  health      - 仅检查健康状态"
    echo "  resources   - 仅监控资源使用"
    echo "  logs        - 仅检查日志错误"
    echo "  report      - 生成详细报告"
    echo "  fix         - 尝试自动修复"
    echo "  -h, --help  - 显示帮助"
}

# 处理命令行参数
case "${1:-monitor}" in
    "monitor")
        main_monitor
        ;;
    "health")
        check_app_health
        ;;
    "resources")
        monitor_resources
        ;;
    "logs")
        check_logs
        ;;
    "report")
        generate_report
        ;;
    "fix")
        auto_fix
        ;;
    "-h"|"--help")
        usage
        ;;
    *)
        error "未知选项: $1"
        usage
        exit 1
        ;;
esac

success "监控任务完成"