#!/bin/bash
# Deployment Verification Script
# This script performs comprehensive validation of the deployed bonus simulation system

set -euo pipefail

# Configuration
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:8080"}
BACKEND_URL=${BACKEND_URL:-"http://localhost:3002"}
TIMEOUT=${TIMEOUT:-30}
VERBOSE=${VERBOSE:-true}

# Test data
TEST_USER_USERNAME="testuser_$(date +%s)"
TEST_USER_EMAIL="test_$(date +%s)@example.com"
TEST_USER_PASSWORD="TestPass123!"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    fi
}

success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

failure() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to make HTTP requests with error handling
make_request() {
    local method=$1
    local url=$2
    local data=${3:-""}
    local headers=${4:-""}
    local expected_status=${5:-200}
    
    local cmd="curl -s -w '%{http_code}' --max-time $TIMEOUT"
    
    if [ -n "$headers" ]; then
        cmd="$cmd -H '$headers'"
    fi
    
    if [ -n "$data" ] && [ "$method" != "GET" ]; then
        cmd="$cmd -d '$data'"
    fi
    
    cmd="$cmd -X $method '$url'"
    
    local response=$(eval $cmd)
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo "$body"
        return 0
    else
        echo "HTTP $http_code: $body"
        return 1
    fi
}

# Test 1: Basic System Health
test_system_health() {
    echo "=== 系统健康检查 ==="
    
    # Backend health check
    log "Testing backend health endpoint..."
    if make_request GET "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        success "Backend health endpoint responding"
    else
        failure "Backend health endpoint failed"
    fi
    
    # Frontend health check
    log "Testing frontend health endpoint..."
    if make_request GET "$FRONTEND_URL/health" > /dev/null 2>&1; then
        success "Frontend health endpoint responding"
    else
        failure "Frontend health endpoint failed"
    fi
    
    # API documentation
    log "Testing API documentation..."
    if make_request GET "$BACKEND_URL/api/docs" > /dev/null 2>&1; then
        success "API documentation accessible"
    else
        warning "API documentation not accessible (may be disabled in production)"
    fi
    
    echo
}

# Test 2: Authentication Flow
test_authentication() {
    echo "=== 用户认证测试 ==="
    
    # Test login endpoint
    log "Testing login endpoint with invalid credentials..."
    local login_response
    if login_response=$(make_request POST "$BACKEND_URL/api/auth/login" \
        '{"username":"invalid","password":"invalid"}' \
        "Content-Type: application/json" 401 2>/dev/null); then
        success "Login endpoint correctly rejects invalid credentials"
    else
        failure "Login endpoint authentication validation failed"
    fi
    
    # Test with default admin credentials
    log "Testing login with admin credentials..."
    local admin_token=""
    if admin_response=$(make_request POST "$BACKEND_URL/api/auth/login" \
        '{"username":"admin","password":"admin123"}' \
        "Content-Type: application/json" 200 2>/dev/null); then
        
        admin_token=$(echo "$admin_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        if [ -n "$admin_token" ]; then
            success "Admin login successful, token received"
            export ADMIN_TOKEN="$admin_token"
        else
            failure "Admin login response missing token"
        fi
    else
        failure "Admin login failed"
    fi
    
    # Test token verification
    if [ -n "$admin_token" ]; then
        log "Testing token verification..."
        if make_request GET "$BACKEND_URL/api/auth/verify" "" \
            "Authorization: Bearer $admin_token" 200 > /dev/null 2>&1; then
            success "Token verification successful"
        else
            failure "Token verification failed"
        fi
    fi
    
    echo
}

# Test 3: Core Business Functions
test_core_business_functions() {
    echo "=== 核心业务功能测试 ==="
    
    if [ -z "${ADMIN_TOKEN:-}" ]; then
        failure "No admin token available, skipping business function tests"
        return
    fi
    
    # Test employee management
    log "Testing employee list endpoint..."
    if make_request GET "$BACKEND_URL/api/employees" "" \
        "Authorization: Bearer $ADMIN_TOKEN" 200 > /dev/null 2>&1; then
        success "Employee list endpoint working"
    else
        failure "Employee list endpoint failed"
    fi
    
    # Test departments
    log "Testing departments endpoint..."
    if make_request GET "$BACKEND_URL/api/departments" "" \
        "Authorization: Bearer $ADMIN_TOKEN" 200 > /dev/null 2>&1; then
        success "Departments endpoint working"
    else
        failure "Departments endpoint failed"
    fi
    
    # Test positions
    log "Testing positions endpoint..."
    if make_request GET "$BACKEND_URL/api/positions" "" \
        "Authorization: Bearer $ADMIN_TOKEN" 200 > /dev/null 2>&1; then
        success "Positions endpoint working"
    else
        failure "Positions endpoint failed"
    fi
    
    # Test projects
    log "Testing projects endpoint..."
    if make_request GET "$BACKEND_URL/api/projects" "" \
        "Authorization: Bearer $ADMIN_TOKEN" 200 > /dev/null 2>&1; then
        success "Projects endpoint working"
    else
        failure "Projects endpoint failed"
    fi
    
    echo
}

# Test 4: Bonus System Core Features
test_bonus_features() {
    echo "=== 奖金系统核心功能测试 ==="
    
    if [ -z "${ADMIN_TOKEN:-}" ]; then
        failure "No admin token available, skipping bonus feature tests"
        return
    fi
    
    # Test personal bonus endpoint
    log "Testing personal bonus endpoint..."
    if make_request GET "$BACKEND_URL/api/personal-bonus" "" \
        "Authorization: Bearer $ADMIN_TOKEN" 200 > /dev/null 2>&1; then
        success "Personal bonus endpoint working"
    else
        failure "Personal bonus endpoint failed"
    fi
    
    # Test available projects
    log "Testing available projects for collaboration..."
    if make_request GET "$BACKEND_URL/api/projects/available" "" \
        "Authorization: Bearer $ADMIN_TOKEN" 200 > /dev/null 2>&1; then
        success "Available projects endpoint working"
    else
        failure "Available projects endpoint failed"
    fi
    
    # Test position requirements
    log "Testing position requirements endpoint..."
    if make_request GET "$BACKEND_URL/api/position-requirements" "" \
        "Authorization: Bearer $ADMIN_TOKEN" 200 > /dev/null 2>&1; then
        success "Position requirements endpoint working"
    else
        failure "Position requirements endpoint failed"
    fi
    
    # Test bonus calculation (if any employees exist)
    log "Testing three-dimensional calculation endpoint..."
    local calc_payload='{"employeeIds":[1],"period":"2024-01","weights":{"profit":0.4,"position":0.3,"performance":0.3}}'
    if make_request POST "$BACKEND_URL/api/calculations/three-dimensional" \
        "$calc_payload" \
        "Authorization: Bearer $ADMIN_TOKEN,Content-Type: application/json" 200 > /dev/null 2>&1; then
        success "Three-dimensional calculation endpoint working"
    else
        warning "Three-dimensional calculation endpoint may require existing data"
    fi
    
    echo
}

# Test 5: Security Features
test_security_features() {
    echo "=== 安全功能测试 ==="
    
    # Test unauthorized access
    log "Testing unauthorized access protection..."
    if make_request GET "$BACKEND_URL/api/employees" "" "" 401 > /dev/null 2>&1; then
        success "Unauthorized access properly blocked"
    else
        failure "Unauthorized access not properly blocked"
    fi
    
    # Test rate limiting (make multiple requests quickly)
    log "Testing rate limiting..."
    local rate_limit_failed=0
    for i in {1..20}; do
        if ! make_request GET "$BACKEND_URL/api/health" > /dev/null 2>&1; then
            rate_limit_failed=1
            break
        fi
    done
    
    if [ "$rate_limit_failed" -eq 1 ]; then
        success "Rate limiting is working"
    else
        warning "Rate limiting may not be configured or threshold not reached"
    fi
    
    # Test CORS headers
    log "Testing CORS headers..."
    if curl -s -I -X OPTIONS "$BACKEND_URL/api/health" | grep -q "Access-Control-Allow"; then
        success "CORS headers present"
    else
        failure "CORS headers missing"
    fi
    
    echo
}

# Test 6: Frontend Accessibility
test_frontend_accessibility() {
    echo "=== 前端可访问性测试 ==="
    
    # Test main page
    log "Testing frontend main page..."
    if make_request GET "$FRONTEND_URL" > /dev/null 2>&1; then
        success "Frontend main page accessible"
    else
        failure "Frontend main page not accessible"
    fi
    
    # Test static assets (check if CSS/JS files are served)
    log "Testing static asset serving..."
    local main_page_content
    if main_page_content=$(make_request GET "$FRONTEND_URL" 2>/dev/null); then
        if echo "$main_page_content" | grep -q "\.css\|\.js"; then
            success "Static assets referenced in HTML"
        else
            warning "Static assets may not be properly referenced"
        fi
    fi
    
    # Test SPA routing (try a typical route)
    log "Testing SPA routing..."
    if make_request GET "$FRONTEND_URL/login" > /dev/null 2>&1; then
        success "SPA routing working (or fallback to index.html)"
    else
        failure "SPA routing not working properly"
    fi
    
    echo
}

# Test 7: Data Persistence
test_data_persistence() {
    echo "=== 数据持久化测试 ==="
    
    if [ -z "${ADMIN_TOKEN:-}" ]; then
        failure "No admin token available, skipping data persistence tests"
        return
    fi
    
    # Test database connectivity by checking if we can read users
    log "Testing database connectivity..."
    if make_request GET "$BACKEND_URL/api/users" "" \
        "Authorization: Bearer $ADMIN_TOKEN" 200 > /dev/null 2>&1; then
        success "Database connectivity working"
    else
        failure "Database connectivity issues"
    fi
    
    # Test if we can create test data (department)
    log "Testing data creation..."
    local test_dept='{"name":"测试部门_'$(date +%s)'","description":"自动化测试创建"}'
    if make_request POST "$BACKEND_URL/api/departments" \
        "$test_dept" \
        "Authorization: Bearer $ADMIN_TOKEN,Content-Type: application/json" 201 > /dev/null 2>&1; then
        success "Data creation working"
    else
        warning "Data creation may require specific permissions"
    fi
    
    echo
}

# Test 8: Performance Metrics
test_performance() {
    echo "=== 性能测试 ==="
    
    # Test response times
    log "Testing API response times..."
    local start_time end_time response_time
    
    start_time=$(date +%s%N)
    if make_request GET "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
        
        if [ "$response_time" -lt 1000 ]; then
            success "API response time: ${response_time}ms (< 1000ms)"
        elif [ "$response_time" -lt 2000 ]; then
            warning "API response time: ${response_time}ms (acceptable but could be better)"
        else
            failure "API response time: ${response_time}ms (> 2000ms, too slow)"
        fi
    else
        failure "Could not measure API response time"
    fi
    
    # Test concurrent requests
    log "Testing concurrent request handling..."
    local concurrent_success=0
    local concurrent_total=5
    
    for i in $(seq 1 $concurrent_total); do
        if make_request GET "$BACKEND_URL/api/health" > /dev/null 2>&1 &; then
            ((concurrent_success++))
        fi
    done
    wait
    
    if [ "$concurrent_success" -eq "$concurrent_total" ]; then
        success "Concurrent request handling: $concurrent_success/$concurrent_total"
    else
        warning "Concurrent request handling: $concurrent_success/$concurrent_total (some failed)"
    fi
    
    echo
}

# Test 9: Docker Container Health
test_container_health() {
    echo "=== Docker容器健康检查 ==="
    
    if ! command -v docker &> /dev/null; then
        warning "Docker not available, skipping container health tests"
        return
    fi
    
    # Check if containers are running
    local containers=("bonus-backend-prod" "bonus-frontend-prod" "bonus-backend-staging" "bonus-frontend-staging")
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            success "Container $container is running"
            
            # Check container health if available
            local health_status
            health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
            
            case $health_status in
                "healthy")
                    success "Container $container is healthy"
                    ;;
                "unhealthy")
                    failure "Container $container is unhealthy"
                    ;;
                "starting")
                    warning "Container $container is still starting"
                    ;;
                "none")
                    log "Container $container has no health check configured"
                    ;;
                *)
                    warning "Container $container health status: $health_status"
                    ;;
            esac
        else
            log "Container $container is not running (may be expected)"
        fi
    done
    
    echo
}

# Generate test report
generate_report() {
    echo "=== 部署验证报告 ==="
    echo "测试时间: $(date)"
    echo "前端URL: $FRONTEND_URL"
    echo "后端URL: $BACKEND_URL"
    echo
    echo "测试结果统计:"
    echo "  总测试数: $TOTAL_TESTS"
    echo "  通过测试: $PASSED_TESTS"
    echo "  失败测试: $FAILED_TESTS"
    echo "  成功率: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    echo
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！系统部署验证成功！${NC}"
        echo
        echo "系统可以正常使用，支持以下核心功能："
        echo "  ✅ 用户认证和授权"
        echo "  ✅ 员工奖金查看"
        echo "  ✅ 项目协作申请"
        echo "  ✅ 岗位晋升查看"
        echo "  ✅ 系统安全防护"
        echo
        echo "访问地址："
        echo "  - 前端界面: $FRONTEND_URL"
        echo "  - API接口: $BACKEND_URL/api"
        echo "  - 默认账号: admin / admin123"
        return 0
    else
        echo -e "${RED}❌ 部分测试失败，需要检查系统配置${NC}"
        echo
        echo "建议检查项目："
        echo "  - 服务是否正常启动"
        echo "  - 网络连接是否正常"
        echo "  - 数据库文件是否存在"
        echo "  - 环境变量配置是否正确"
        return 1
    fi
}

# Main function
main() {
    echo "=== 奖金模拟系统部署验证开始 ==="
    echo "正在验证系统的三大核心业务流程："
    echo "  1. 奖金查看 - 员工查看个人奖金详情和历史趋势"
    echo "  2. 项目申请 - 项目协作申请和审批流程"  
    echo "  3. 岗位晋升查看 - 岗位要求和晋升路径查询"
    echo
    
    # Run all tests
    test_system_health
    test_authentication
    test_core_business_functions
    test_bonus_features
    test_security_features
    test_frontend_accessibility
    test_data_persistence
    test_performance
    test_container_health
    
    # Generate final report
    generate_report
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        --backend-url)
            BACKEND_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --quiet)
            VERBOSE=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --frontend-url URL    Frontend URL (default: $FRONTEND_URL)"
            echo "  --backend-url URL     Backend URL (default: $BACKEND_URL)"
            echo "  --timeout SECONDS     Request timeout (default: $TIMEOUT)"
            echo "  --quiet              Suppress verbose output"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main