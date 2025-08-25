#!/bin/bash

# Docker部署脚本
# 用法: ./docker-deploy.sh [dev|prod] [up|down|restart|logs]

set -e

# 默认参数
ENVIRONMENT=${1:-dev}
ACTION=${2:-up}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose
check_prerequisites() {
    log "检查环境依赖..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装或不在PATH中"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose 未安装或不在PATH中"
        exit 1
    fi
    
    success "环境检查通过"
}

# 设置环境变量
setup_environment() {
    log "设置环境变量..."
    
    case $ENVIRONMENT in
        dev)
            export COMPOSE_FILE="docker-compose.yml:docker-compose.dev.yml"
            export COMPOSE_PROFILES="default"
            ;;
        prod)
            export COMPOSE_FILE="docker-compose.yml:docker-compose.prod.yml" 
            export COMPOSE_PROFILES="production,mysql,redis"
            ;;
        *)
            error "不支持的环境: $ENVIRONMENT"
            echo "支持的环境: dev, prod"
            exit 1
            ;;
    esac
    
    success "环境设置完成: $ENVIRONMENT"
}

# 创建必要的目录
create_directories() {
    log "创建必要目录..."
    
    mkdir -p docker/secrets
    mkdir -p logs/{backend,frontend,mysql,redis}
    mkdir -p data/{mysql,redis,nedb}
    
    success "目录创建完成"
}

# 生成secrets (仅生产环境)
generate_secrets() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        log "生成生产环境secrets..."
        
        # 生成随机密码
        if [ ! -f docker/secrets/mysql_root_password.txt ]; then
            openssl rand -base64 32 > docker/secrets/mysql_root_password.txt
            log "生成MySQL root密码"
        fi
        
        if [ ! -f docker/secrets/mysql_password.txt ]; then
            openssl rand -base64 32 > docker/secrets/mysql_password.txt
            log "生成MySQL用户密码"
        fi
        
        if [ ! -f docker/secrets/jwt_secret.txt ]; then
            openssl rand -base64 64 > docker/secrets/jwt_secret.txt
            log "生成JWT secret"
        fi
        
        if [ ! -f docker/secrets/jwt_refresh_secret.txt ]; then
            openssl rand -base64 64 > docker/secrets/jwt_refresh_secret.txt
            log "生成JWT refresh secret"
        fi
        
        # 设置权限
        chmod 600 docker/secrets/*
        
        success "Secrets生成完成"
    fi
}

# 构建镜像
build_images() {
    log "构建Docker镜像..."
    
    case $ENVIRONMENT in
        dev)
            docker-compose build --no-cache
            ;;
        prod)
            docker-compose build --no-cache backend frontend
            ;;
    esac
    
    success "镜像构建完成"
}

# 启动服务
start_services() {
    log "启动服务..."
    
    case $ENVIRONMENT in
        dev)
            docker-compose up -d
            ;;
        prod)
            # 先启动数据库服务
            docker-compose up -d mysql redis
            sleep 10
            
            # 再启动应用服务
            docker-compose up -d backend frontend adminer
            ;;
    esac
    
    success "服务启动完成"
}

# 停止服务
stop_services() {
    log "停止服务..."
    docker-compose down
    success "服务已停止"
}

# 重启服务
restart_services() {
    log "重启服务..."
    docker-compose restart
    success "服务已重启"
}

# 查看日志
view_logs() {
    log "查看服务日志..."
    docker-compose logs -f
}

# 显示服务状态
show_status() {
    log "服务状态:"
    docker-compose ps
    
    echo ""
    log "服务健康状态:"
    docker-compose exec backend curl -f http://localhost:3000/api/health 2>/dev/null && success "后端服务正常" || warning "后端服务异常"
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose exec mysql mysqladmin ping -h localhost --silent && success "MySQL正常" || warning "MySQL异常"
        docker-compose exec redis redis-cli ping >/dev/null 2>&1 && success "Redis正常" || warning "Redis异常"
    fi
}

# 清理资源
cleanup() {
    log "清理Docker资源..."
    
    # 停止并删除容器
    docker-compose down -v
    
    # 删除未使用的镜像
    docker image prune -f
    
    success "清理完成"
}

# 备份数据 (仅生产环境)
backup_data() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        log "备份生产数据..."
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p $BACKUP_DIR
        
        # 备份MySQL
        docker-compose exec mysql mysqldump -u root -p$(cat docker/secrets/mysql_root_password.txt) --all-databases > $BACKUP_DIR/mysql_backup.sql
        
        # 备份NeDB文件
        docker cp bonus-system-backend-prod:/app/database $BACKUP_DIR/nedb
        
        # 压缩备份
        tar -czf $BACKUP_DIR.tar.gz -C backups $(basename $BACKUP_DIR)
        rm -rf $BACKUP_DIR
        
        success "备份完成: $BACKUP_DIR.tar.gz"
    else
        warning "备份功能仅在生产环境可用"
    fi
}

# 主函数
main() {
    log "奖金模拟系统 Docker部署脚本"
    log "环境: $ENVIRONMENT, 操作: $ACTION"
    
    check_prerequisites
    setup_environment
    create_directories
    
    case $ACTION in
        up)
            generate_secrets
            build_images
            start_services
            sleep 5
            show_status
            ;;
        down)
            stop_services
            ;;
        restart)
            restart_services
            show_status
            ;;
        logs)
            view_logs
            ;;
        status)
            show_status
            ;;
        build)
            build_images
            ;;
        cleanup)
            cleanup
            ;;
        backup)
            backup_data
            ;;
        *)
            error "不支持的操作: $ACTION"
            echo "支持的操作: up, down, restart, logs, status, build, cleanup, backup"
            exit 1
            ;;
    esac
}

# 显示用法
usage() {
    echo "用法: $0 [环境] [操作]"
    echo ""
    echo "环境:"
    echo "  dev   - 开发环境 (默认)"
    echo "  prod  - 生产环境"
    echo ""
    echo "操作:"
    echo "  up      - 启动服务 (默认)"
    echo "  down    - 停止服务"
    echo "  restart - 重启服务"
    echo "  logs    - 查看日志"
    echo "  status  - 显示状态"
    echo "  build   - 重新构建镜像"
    echo "  cleanup - 清理资源"
    echo "  backup  - 备份数据 (仅生产环境)"
    echo ""
    echo "示例:"
    echo "  $0 dev up          # 启动开发环境"
    echo "  $0 prod up         # 启动生产环境"
    echo "  $0 prod backup     # 备份生产数据"
}

# 处理帮助参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

# 执行主函数
main