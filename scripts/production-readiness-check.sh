#!/bin/bash

# 生产就绪性检查脚本
# 验证奖金模拟系统是否准备好生产部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 时间戳函数
timestamp() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC}"
}

# 检查结果计数器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# 检查函数
check_item() {
    local description="$1"
    local status="$2"
    local message="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [[ "$status" == "PASS" ]]; then
        echo -e "${GREEN}✅${NC} $description: $message"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [[ "$status" == "WARN" ]]; then
        echo -e "${YELLOW}⚠️${NC} $description: $message"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    else
        echo -e "${RED}❌${NC} $description: $message"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

echo -e "${CYAN}"
echo "🎯 奖金模拟系统生产就绪性检查"
echo "===================================================="
echo -e "${NC}"

# 1. 系统环境检查
echo -e "$(timestamp) ${PURPLE}1. 系统环境检查...${NC}"

# 检查Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    if [[ "$NODE_VERSION" =~ v([0-9]+) ]] && [[ ${BASH_REMATCH[1]} -ge 16 ]]; then
        check_item "Node.js 版本" "PASS" "$NODE_VERSION (满足 >=16.0 要求)"
    else
        check_item "Node.js 版本" "WARN" "$NODE_VERSION (推荐使用 >=18.0)"
    fi
else
    check_item "Node.js 安装" "FAIL" "未找到Node.js"
fi

# 检查npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    check_item "npm 版本" "PASS" "$NPM_VERSION"
else
    check_item "npm 安装" "FAIL" "未找到npm"
fi

# 2. 项目结构检查
echo -e "$(timestamp) ${PURPLE}2. 项目结构检查...${NC}"

# 检查关键目录
declare -a REQUIRED_DIRS=("backend" "frontend" "database" "scripts" "nginx")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        check_item "目录 $dir" "PASS" "存在"
    else
        check_item "目录 $dir" "FAIL" "不存在"
    fi
done

# 检查关键文件
declare -a REQUIRED_FILES=(
    "backend/package.json"
    "backend/src/app.js"
    "frontend/package.json"
    "docker-compose.production.yml"
    ".env.production.template"
)
for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        check_item "文件 $file" "PASS" "存在"
    else
        check_item "文件 $file" "FAIL" "不存在"
    fi
done

# 3. 后端服务检查
echo -e "$(timestamp) ${PURPLE}3. 后端服务检查...${NC}"

# 检查后端依赖
if [[ -f "backend/package.json" ]]; then
    cd backend
    if [[ -d "node_modules" ]]; then
        check_item "后端依赖" "PASS" "已安装"
    else
        check_item "后端依赖" "WARN" "需要运行 npm install"
    fi
    cd ..
fi

# 检查后端服务状态
if curl -s http://localhost:3002/api/health >/dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3002/api/health)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy\|OK"; then
        check_item "后端服务" "PASS" "运行正常 (http://localhost:3002)"
    else
        check_item "后端服务" "WARN" "响应异常"
    fi
else
    check_item "后端服务" "FAIL" "无法连接到 http://localhost:3002"
fi

# 4. 前端构建检查
echo -e "$(timestamp) ${PURPLE}4. 前端构建检查...${NC}"

if [[ -f "frontend/package.json" ]]; then
    cd frontend
    if [[ -d "node_modules" ]]; then
        check_item "前端依赖" "PASS" "已安装"
    else
        check_item "前端依赖" "WARN" "需要运行 npm install"
    fi
    
    if [[ -d "dist" ]]; then
        check_item "前端构建" "PASS" "构建产物存在"
    else
        check_item "前端构建" "WARN" "需要运行 npm run build"
    fi
    cd ..
fi

# 5. 数据库检查
echo -e "$(timestamp) ${PURPLE}5. 数据库检查...${NC}"

if [[ -f "database/bonus_system.json" ]]; then
    DB_SIZE=$(du -h "database/bonus_system.json" | cut -f1)
    check_item "NeDB 数据库" "PASS" "存在 (大小: $DB_SIZE)"
else
    check_item "NeDB 数据库" "WARN" "数据库文件不存在"
fi

# 6. API 端点检查
echo -e "$(timestamp) ${PURPLE}6. 核心API端点检查...${NC}"

# Check GET endpoints
declare -a GET_ENDPOINTS=(
    "/api/health"
    "/api/projects/available"
    "/api/positions"
)

for endpoint in "${GET_ENDPOINTS[@]}"; do
    if curl -s -w "%{http_code}" -o /dev/null "http://localhost:3002$endpoint" | grep -q "200\|401"; then
        check_item "API $endpoint (GET)" "PASS" "可访问"
    else
        check_item "API $endpoint (GET)" "FAIL" "无法访问"
    fi
done

# Check POST login endpoint specifically
if curl -s -X POST -H "Content-Type: application/json" \
    -d '{"username":"invalid","password":"invalid"}' \
    -w "%{http_code}" -o /dev/null "http://localhost:3002/api/auth/login" | grep -q "400\|401\|200"; then
    check_item "API /api/auth/login (POST)" "PASS" "可访问"
else
    check_item "API /api/auth/login (POST)" "FAIL" "无法访问"
fi

# 7. 安全配置检查
echo -e "$(timestamp) ${PURPLE}7. 安全配置检查...${NC}"

if [[ -f "backend/.env" ]]; then
    if grep -q "JWT_SECRET" "backend/.env"; then
        check_item "JWT 密钥配置" "PASS" "已配置"
    else
        check_item "JWT 密钥配置" "WARN" "未配置 JWT_SECRET"
    fi
else
    check_item "环境变量文件" "WARN" "backend/.env 不存在"
fi

# 8. 部署配置检查
echo -e "$(timestamp) ${PURPLE}8. 部署配置检查...${NC}"

if [[ -f "docker-compose.production.yml" ]]; then
    check_item "生产部署配置" "PASS" "docker-compose.production.yml 存在"
else
    check_item "生产部署配置" "FAIL" "缺少生产部署配置"
fi

if [[ -f "nginx/nginx.prod.conf" ]]; then
    check_item "Nginx 配置" "PASS" "nginx.prod.conf 存在"
else
    check_item "Nginx 配置" "WARN" "缺少Nginx配置"
fi

# 9. 监控配置检查
echo -e "$(timestamp) ${PURPLE}9. 监控配置检查...${NC}"

if [[ -f "monitoring/prometheus.yml" ]]; then
    check_item "Prometheus 配置" "PASS" "监控配置存在"
else
    check_item "Prometheus 配置" "WARN" "缺少监控配置"
fi

# 10. 测试覆盖率检查
echo -e "$(timestamp) ${PURPLE}10. 业务功能验证...${NC}"

# 简单的功能测试
if curl -s http://localhost:3002/api/health | grep -q "healthy\|OK"; then
    # 测试登录功能
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"1234qwer"}' 2>/dev/null || echo "")
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        check_item "用户登录功能" "PASS" "test用户登录正常"
        
        # 提取token并测试API - 支持不同的JSON结构
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        # Try alternative extraction for nested structure {"data":{"token":"..."}}
        if [[ -z "$TOKEN" ]]; then
            TOKEN=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
        fi
        if [[ -n "$TOKEN" ]]; then
            # 测试奖金查看API
            if curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3002/api/bonus/personal-overview >/dev/null 2>&1; then
                check_item "奖金查看流程" "PASS" "个人奖金查看功能正常"
            else
                check_item "奖金查看流程" "WARN" "奖金查看功能异常"
            fi
            
            # 测试项目申请API
            if curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3002/api/projects/available >/dev/null 2>&1; then
                check_item "项目申请流程" "PASS" "项目申请功能正常"
            else
                check_item "项目申请流程" "WARN" "项目申请功能异常"
            fi
            
            # 测试岗位查看API
            if curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3002/api/positions >/dev/null 2>&1; then
                check_item "岗位晋升查看" "PASS" "岗位查看功能正常"
            else
                check_item "岗位晋升查看" "WARN" "岗位查看功能异常"
            fi
        fi
    else
        check_item "用户登录功能" "FAIL" "登录功能异常"
    fi
else
    check_item "服务连通性" "FAIL" "后端服务无法访问"
fi

# 生成检查报告
echo -e "$(timestamp) ${PURPLE}生成检查报告...${NC}"

echo ""
echo -e "${CYAN}📊 生产就绪性检查报告${NC}"
echo "===================================================="
echo -e "总检查项: ${TOTAL_CHECKS}"
echo -e "${GREEN}通过: ${PASSED_CHECKS}${NC}"
echo -e "${YELLOW}警告: ${WARNING_CHECKS}${NC}"
echo -e "${RED}失败: ${FAILED_CHECKS}${NC}"

# 计算通过率
PASS_RATE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
echo -e "通过率: ${PASS_RATE}%"

echo ""
echo -e "${CYAN}🎯 生产就绪性评估${NC}"
echo "===================================================="

if [[ $FAILED_CHECKS -eq 0 && $WARNING_CHECKS -eq 0 ]]; then
    echo -e "${GREEN}🎉 系统完全准备好生产部署！${NC}"
    exit 0
elif [[ $FAILED_CHECKS -eq 0 && $WARNING_CHECKS -le 3 ]]; then
    echo -e "${YELLOW}⚠️ 系统基本准备好生产部署，建议解决警告项后部署${NC}"
    exit 0
elif [[ $FAILED_CHECKS -le 2 ]]; then
    echo -e "${YELLOW}🔧 系统需要解决关键问题后才能部署到生产环境${NC}"
    exit 1
else
    echo -e "${RED}❌ 系统尚未准备好生产部署，需要解决多个关键问题${NC}"
    exit 1
fi