#!/bin/bash

# 奖金模拟系统生产环境启动脚本
# 使用优化版混合服务器方案

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查PM2
check_pm2() {
    log_info "检查PM2..."
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2未安装，正在安装..."
        npm install -g pm2
        if [ $? -eq 0 ]; then
            log_success "PM2安装成功"
        else
            log_error "PM2安装失败"
            exit 1
        fi
    else
        log_success "PM2已安装: $(pm2 --version)"
    fi
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用..."
    
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
        npm install --production=false
        cd ..
    fi
    
    # 安装后端依赖
    if [ ! -d "backend/node_modules" ]; then
        log_info "安装后端依赖..."
        cd backend
        npm install --production=false
        cd ..
    fi
    
    log_success "依赖安装完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端生产版本..."
    
    cd frontend
    
    # 检查是否需要构建
    if [ ! -d "dist" ] || [ "$(find dist -maxdepth 0 -empty 2>/dev/null)" ]; then
        log_info "开始构建前端..."
        npm run build
        
        if [ $? -eq 0 ]; then
            log_success "前端构建成功"
        else
            log_error "前端构建失败"
            exit 1
        fi
    else
        log_info "前端已构建，跳过构建步骤"
    fi
    
    cd ..
}

# 创建日志目录
create_log_dirs() {
    log_info "创建日志目录..."
    mkdir -p logs
    log_success "日志目录创建完成"
}

# 启动生产服务
start_production_service() {
    log_info "启动生产服务..."
    
    # 使用PM2启动服务
    pm2 start ecosystem.config.js --env production
    
    if [ $? -eq 0 ]; then
        log_success "生产服务启动成功"
        
        # 保存PM2配置
        pm2 save
        
        # 设置开机自启
        pm2 startup 2>/dev/null || log_warning "无法设置开机自启，请手动执行: pm2 startup"
        
        # 显示服务状态
        log_info "服务状态:"
        pm2 status
        
        # 显示访问信息
        echo ""
        log_success "🎉 奖金模拟系统部署成功！"
        log_info "访问地址: http://localhost:3000"
        log_info "默认账号: admin"
        log_info "默认密码: admin123"
        echo ""
        log_info "PM2管理命令:"
        log_info "  查看状态: pm2 status"
        log_info "  查看日志: pm2 logs bonus-system"
        log_info "  重启服务: pm2 restart bonus-system"
        log_info "  停止服务: pm2 stop bonus-system"
        
    else
        log_error "生产服务启动失败"
        exit 1
    fi
}

# 主函数
main() {
    echo "🚀 奖金模拟系统生产环境部署"
    echo "=================================="
    
    check_nodejs
    check_pm2
    check_ports
    install_dependencies
    build_frontend
    create_log_dirs
    start_production_service
    
    echo ""
    log_success "部署完成！系统正在运行中..."
}

# 执行主函数
main "$@"
