#!/bin/bash
# Health Check Script for Bonus Simulation System
# This script performs comprehensive health checks on all system components

set -euo pipefail

# Configuration
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:80"}
BACKEND_URL=${BACKEND_URL:-"http://localhost:3002"}
TIMEOUT=${HEALTH_CHECK_TIMEOUT:-10}
VERBOSE=${VERBOSE:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global status
OVERALL_STATUS=0

log() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    fi
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    OVERALL_STATUS=1
}

error() {
    echo -e "${RED}✗${NC} $1"
    OVERALL_STATUS=2
}

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local expected_status=${2:-200}
    local name=$3
    
    log "Checking $name at $url"
    
    if command -v curl &> /dev/null; then
        local response
        response=$(curl -s -w "%{http_code}" -o /dev/null --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")
        
        if [ "$response" = "$expected_status" ]; then
            success "$name is healthy (HTTP $response)"
            return 0
        else
            error "$name is unhealthy (HTTP $response)"
            return 1
        fi
    else
        warning "curl not available, skipping HTTP check for $name"
        return 1
    fi
}

# Function to check Docker container
check_docker_container() {
    local container_name=$1
    local display_name=$2
    
    if ! command -v docker &> /dev/null; then
        warning "Docker not available, skipping container checks"
        return 1
    fi
    
    log "Checking Docker container: $container_name"
    
    if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
        success "$display_name container is running"
        
        # Check container health if health check is configured
        local health_status
        health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")
        
        case $health_status in
            "healthy")
                success "$display_name container is healthy"
                return 0
                ;;
            "unhealthy")
                error "$display_name container is unhealthy"
                return 1
                ;;
            "starting")
                warning "$display_name container is starting"
                return 1
                ;;
            "none")
                log "$display_name container has no health check configured"
                return 0
                ;;
            *)
                warning "$display_name container health status: $health_status"
                return 1
                ;;
        esac
    else
        error "$display_name container is not running"
        return 1
    fi
}

# Function to check database files
check_database_files() {
    log "Checking database files"
    
    # Check if database directory exists
    if [ -d "./database" ]; then
        success "Database directory exists"
        
        # Check for essential database files
        local essential_files=("users.db" "employees.db" "roles.db")
        local missing_files=()
        
        for file in "${essential_files[@]}"; do
            if [ -f "./database/$file" ]; then
                success "Database file exists: $file"
            else
                missing_files+=("$file")
                warning "Database file missing: $file"
            fi
        done
        
        if [ ${#missing_files[@]} -eq 0 ]; then
            success "All essential database files present"
            return 0
        else
            warning "Some database files are missing: ${missing_files[*]}"
            return 1
        fi
    else
        error "Database directory not found"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    log "Checking disk space"
    
    local usage
    usage=$(df . | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        success "Disk space usage: ${usage}%"
        return 0
    elif [ "$usage" -lt 90 ]; then
        warning "Disk space usage: ${usage}% (getting high)"
        return 1
    else
        error "Disk space usage: ${usage}% (critically high)"
        return 1
    fi
}

# Function to check memory usage
check_memory() {
    log "Checking memory usage"
    
    if command -v free &> /dev/null; then
        local mem_usage
        mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2 }')
        
        if [ "$mem_usage" -lt 80 ]; then
            success "Memory usage: ${mem_usage}%"
            return 0
        elif [ "$mem_usage" -lt 90 ]; then
            warning "Memory usage: ${mem_usage}% (getting high)"
            return 1
        else
            error "Memory usage: ${mem_usage}% (critically high)"
            return 1
        fi
    else
        warning "Memory check not available on this system"
        return 1
    fi
}

# Function to check API endpoints
check_api_endpoints() {
    log "Checking API endpoints"
    
    # Health endpoint
    check_http "$BACKEND_URL/api/health" 200 "Backend Health API"
    
    # Auth endpoint (should return 401 without auth)
    check_http "$BACKEND_URL/api/auth/verify" 401 "Backend Auth API"
    
    # API docs (if enabled in production)
    if check_http "$BACKEND_URL/api/docs" 200 "API Documentation" 2>/dev/null; then
        log "API documentation is accessible"
    fi
}

# Function to check frontend
check_frontend() {
    log "Checking frontend"
    
    # Main page
    check_http "$FRONTEND_URL" 200 "Frontend Main Page"
    
    # Health endpoint
    check_http "$FRONTEND_URL/health" 200 "Frontend Health Check"
}

# Function to check SSL certificates (if HTTPS is used)
check_ssl_certificates() {
    if [[ "$FRONTEND_URL" == https://* ]]; then
        log "Checking SSL certificates"
        
        local domain
        domain=$(echo "$FRONTEND_URL" | sed 's/https:\/\///' | sed 's/\/.*//')
        
        if command -v openssl &> /dev/null; then
            local cert_info
            cert_info=$(echo | timeout 10 openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
            
            if [ $? -eq 0 ]; then
                local expiry_date
                expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
                
                if [ -n "$expiry_date" ]; then
                    local expiry_timestamp
                    expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                    local current_timestamp
                    current_timestamp=$(date +%s)
                    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                    
                    if [ "$days_until_expiry" -gt 30 ]; then
                        success "SSL certificate valid for $days_until_expiry days"
                    elif [ "$days_until_expiry" -gt 7 ]; then
                        warning "SSL certificate expires in $days_until_expiry days"
                    else
                        error "SSL certificate expires in $days_until_expiry days"
                    fi
                else
                    warning "Could not parse SSL certificate expiry date"
                fi
            else
                error "Could not check SSL certificate"
            fi
        else
            warning "OpenSSL not available, skipping certificate check"
        fi
    fi
}

# Function to perform comprehensive health check
main() {
    echo "=== Bonus System Health Check ==="
    echo "Timestamp: $(date)"
    echo "Frontend URL: $FRONTEND_URL"
    echo "Backend URL: $BACKEND_URL"
    echo

    # System checks
    echo "--- System Resources ---"
    check_disk_space
    check_memory
    echo

    # Database checks
    echo "--- Database ---"
    check_database_files
    echo

    # Docker container checks (if Docker is available)
    if command -v docker &> /dev/null; then
        echo "--- Docker Containers ---"
        check_docker_container "bonus-backend-prod" "Backend"
        check_docker_container "bonus-frontend-prod" "Frontend"
        check_docker_container "bonus-redis-prod" "Redis"
        echo
    fi

    # Service checks
    echo "--- Services ---"
    check_api_endpoints
    check_frontend
    echo

    # Security checks
    echo "--- Security ---"
    check_ssl_certificates
    echo

    # Overall status
    echo "--- Overall Status ---"
    case $OVERALL_STATUS in
        0)
            success "All systems healthy"
            ;;
        1)
            warning "Some warnings detected"
            ;;
        2)
            error "Critical issues detected"
            ;;
    esac

    echo
    echo "Health check completed at $(date)"
    
    exit $OVERALL_STATUS
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
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
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -v, --verbose           Enable verbose logging"
            echo "  --frontend-url URL      Frontend URL (default: $FRONTEND_URL)"
            echo "  --backend-url URL       Backend URL (default: $BACKEND_URL)"
            echo "  --timeout SECONDS       HTTP timeout (default: $TIMEOUT)"
            echo "  -h, --help             Show this help message"
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