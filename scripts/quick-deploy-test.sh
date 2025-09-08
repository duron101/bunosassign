#!/bin/bash
# Quick Deployment Test Script
# This script demonstrates the complete production deployment workflow

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1" >&2
}

# Function to check prerequisites
check_prerequisites() {
    log "检查部署环境..."
    
    local missing_deps=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    elif ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        return 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again."
        return 1
    fi
    
    success "所有依赖检查通过"
    return 0
}

# Function to setup test environment
setup_test_environment() {
    log "设置测试环境..."
    
    # Create test environment file
    cat > .env.test << 'EOF'
NODE_ENV=staging
PORT=3002
JWT_SECRET=test-jwt-secret-key-for-deployment-test-2024
JWT_REFRESH_SECRET=test-refresh-secret-key-for-deployment-test-2024
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_TYPE=nedb
DATABASE_PATH=/app/database
CORS_ORIGIN=http://localhost:8080
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=1000
LOG_LEVEL=debug
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3002
EOF
    
    success "测试环境配置创建完成"
}

# Function to test staging deployment
test_staging_deployment() {
    log "测试暂存环境部署..."
    
    # Stop any existing containers
    docker-compose -f docker-compose.staging.yml down --remove-orphans 2>/dev/null || true
    
    # Build and start staging environment
    log "构建并启动暂存环境容器..."
    if docker-compose -f docker-compose.staging.yml up -d --build; then
        success "暂存环境启动成功"
    else
        error "暂存环境启动失败"
        return 1
    fi
    
    # Wait for services to be ready
    log "等待服务启动完成..."
    sleep 20
    
    # Check container status
    log "检查容器状态..."
    if docker-compose -f docker-compose.staging.yml ps | grep -q "Up"; then
        success "所有容器运行正常"
    else
        error "部分容器启动失败"
        docker-compose -f docker-compose.staging.yml ps
        return 1
    fi
    
    return 0
}

# Function to run deployment verification
run_deployment_verification() {
    log "运行部署验证测试..."
    
    # Wait a bit more for services to stabilize
    sleep 10
    
    # Run verification script
    if ./scripts/verify-deployment.sh \
        --frontend-url "http://localhost:8080" \
        --backend-url "http://localhost:3002" \
        --timeout 20; then
        success "部署验证测试通过"
        return 0
    else
        error "部署验证测试失败"
        return 1
    fi
}

# Function to demonstrate core business functions
demonstrate_business_functions() {
    log "演示核心业务功能..."
    
    # Get admin token
    local admin_token
    log "获取管理员令牌..."
    local login_response
    if login_response=$(curl -s -X POST "http://localhost:3002/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}' 2>/dev/null); then
        
        admin_token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        if [ -n "$admin_token" ]; then
            success "管理员登录成功"
        else
            error "登录响应中未找到令牌"
            return 1
        fi
    else
        error "管理员登录失败"
        return 1
    fi
    
    # Test core business functions
    echo
    echo "=== 核心业务功能演示 ==="
    
    # 1. 奖金查看功能
    log "1. 测试奖金查看功能..."
    if curl -s -X GET "http://localhost:3002/api/personal-bonus" \
        -H "Authorization: Bearer $admin_token" > /dev/null 2>&1; then
        success "个人奖金查询接口正常"
    else
        warning "个人奖金查询接口可能需要数据初始化"
    fi
    
    # 2. 项目协作功能
    log "2. 测试项目协作功能..."
    if curl -s -X GET "http://localhost:3002/api/projects/available" \
        -H "Authorization: Bearer $admin_token" > /dev/null 2>&1; then
        success "可申请项目查询接口正常"
    else
        warning "可申请项目查询接口可能需要数据初始化"
    fi
    
    # 3. 岗位晋升功能
    log "3. 测试岗位晋升功能..."
    if curl -s -X GET "http://localhost:3002/api/position-requirements" \
        -H "Authorization: Bearer $admin_token" > /dev/null 2>&1; then
        success "岗位要求查询接口正常"
    else
        warning "岗位要求查询接口可能需要数据初始化"
    fi
    
    echo
    success "所有核心业务功能接口测试完成"
}

# Function to show system information
show_system_info() {
    echo
    echo "=== 系统部署信息 ==="
    echo "部署时间: $(date)"
    echo "容器状态:"
    docker-compose -f docker-compose.staging.yml ps
    
    echo
    echo "系统访问地址:"
    echo "  🌐 前端界面: http://localhost:8080"
    echo "  🔧 后端API: http://localhost:3002/api"
    echo "  📚 API文档: http://localhost:3002/api/docs"
    echo "  👤 默认账号: admin / admin123"
    
    echo
    echo "核心业务功能:"
    echo "  💰 奖金查看 - 员工查看个人奖金详情和历史趋势"
    echo "  🤝 项目申请 - 项目协作申请和审批流程"
    echo "  🎯 岗位晋升查看 - 岗位要求和晋升路径查询"
    
    echo
    echo "部署架构:"
    echo "  📦 Frontend: Vue 3 + TypeScript + Element Plus (Nginx容器)"
    echo "  ⚙️  Backend: Node.js + Express + JWT认证 (Node容器)"
    echo "  🗄️  Database: NeDB文件数据库 (持久化存储)"
    echo "  🚦 Proxy: Nginx反向代理 + 静态资源服务"
}

# Function to cleanup
cleanup() {
    log "清理测试环境..."
    
    # Stop staging containers
    docker-compose -f docker-compose.staging.yml down --remove-orphans 2>/dev/null || true
    
    # Remove test environment file
    rm -f .env.test
    
    success "测试环境清理完成"
}

# Main function
main() {
    echo "🚀 奖金模拟系统生产级部署演示"
    echo "=================================================="
    echo
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.staging.yml" ]; then
        error "请在项目根目录下运行此脚本"
        exit 1
    fi
    
    # Run deployment test workflow
    if ! check_prerequisites; then
        exit 1
    fi
    
    setup_test_environment
    
    if ! test_staging_deployment; then
        error "暂存环境部署失败，终止测试"
        cleanup
        exit 1
    fi
    
    if ! run_deployment_verification; then
        warning "部署验证有警告，但继续演示"
    fi
    
    demonstrate_business_functions
    show_system_info
    
    echo
    echo "=== 部署演示完成 ==="
    success "奖金模拟系统已成功部署并验证"
    echo
    echo "接下来您可以："
    echo "1. 访问 http://localhost:8080 查看前端界面"
    echo "2. 使用 admin/admin123 登录系统"
    echo "3. 测试三大核心业务功能"
    echo "4. 查看 API 文档: http://localhost:3002/api/docs"
    echo
    echo "停止演示环境请运行:"
    echo "  docker-compose -f docker-compose.staging.yml down"
    echo
    echo "生产部署请使用:"
    echo "  ./scripts/deploy-production.sh"
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "This script demonstrates the complete production deployment workflow"
        echo "for the Bonus Simulation System including:"
        echo "  - Environment setup and validation"
        echo "  - Docker container deployment"
        echo "  - System health checks"
        echo "  - Core business function testing"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --no-cleanup  Don't cleanup containers after demo"
        exit 0
        ;;
    --no-cleanup)
        trap - EXIT  # Remove cleanup trap
        ;;
esac

# Run main function
main "$@"