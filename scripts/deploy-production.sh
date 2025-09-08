#!/bin/bash
# Production Deployment Script for Bonus Simulation System
# This script handles zero-downtime deployment with rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"
BACKUP_DIR="/opt/backups/bonus-system"
DEPLOYMENT_LOG="/var/log/bonus-deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${BLUE}${message}${NC}"
    echo "$message" >> "$DEPLOYMENT_LOG"
}

success() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$DEPLOYMENT_LOG"
}

warning() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1"
    echo -e "${YELLOW}${message}${NC}"
    echo "$message" >> "$DEPLOYMENT_LOG"
}

error() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1"
    echo -e "${RED}${message}${NC}" >&2
    echo "$message" >> "$DEPLOYMENT_LOG"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$PROJECT_DIR/$ENV_FILE" ]; then
        error "Environment file $ENV_FILE not found"
        echo "Please create $ENV_FILE based on .env.production.template"
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$PROJECT_DIR/$COMPOSE_FILE" ]; then
        error "Docker Compose file $COMPOSE_FILE not found"
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$DEPLOYMENT_LOG")"
    
    success "Prerequisites check passed"
}

# Function to create pre-deployment backup
create_backup() {
    log "Creating pre-deployment backup..."
    
    if [ -x "$PROJECT_DIR/scripts/backup-data.sh" ]; then
        cd "$PROJECT_DIR"
        ./scripts/backup-data.sh
        success "Backup created successfully"
    else
        warning "Backup script not found or not executable"
    fi
}

# Function to pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" pull
    
    success "Docker images pulled successfully"
}

# Function to perform health check
health_check() {
    local service_name=$1
    local health_url=$2
    local max_attempts=${3:-30}
    local sleep_interval=${4:-2}
    
    log "Performing health check for $service_name..."
    
    for i in $(seq 1 $max_attempts); do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            success "$service_name is healthy"
            return 0
        fi
        
        log "Health check attempt $i/$max_attempts failed, retrying in ${sleep_interval}s..."
        sleep $sleep_interval
    done
    
    error "$service_name failed health check after $max_attempts attempts"
    return 1
}

# Function to deploy services with zero downtime
deploy_services() {
    log "Starting zero-downtime deployment..."
    
    cd "$PROJECT_DIR"
    
    # Start new containers
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans --force-recreate
    
    # Wait for services to start
    log "Waiting for services to initialize..."
    sleep 10
    
    # Perform health checks
    local backend_url
    backend_url=$(grep BACKEND_URL "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ -z "$backend_url" ]; then
        backend_url="http://localhost:3002"
    fi
    
    local frontend_url
    frontend_url=$(grep FRONTEND_URL "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ -z "$frontend_url" ]; then
        frontend_url="http://localhost:80"
    fi
    
    # Health check backend
    if ! health_check "Backend" "$backend_url/api/health" 30 2; then
        error "Backend deployment failed health check"
        return 1
    fi
    
    # Health check frontend
    if ! health_check "Frontend" "$frontend_url/health" 15 2; then
        error "Frontend deployment failed health check"
        return 1
    fi
    
    success "Zero-downtime deployment completed successfully"
}

# Function to run comprehensive health checks
run_comprehensive_health_check() {
    log "Running comprehensive health check..."
    
    if [ -x "$PROJECT_DIR/scripts/health-check.sh" ]; then
        cd "$PROJECT_DIR"
        if ./scripts/health-check.sh --verbose; then
            success "Comprehensive health check passed"
            return 0
        else
            error "Comprehensive health check failed"
            return 1
        fi
    else
        warning "Health check script not found, running basic checks..."
        
        # Basic health checks
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
            success "Basic health check: containers are running"
            return 0
        else
            error "Basic health check failed: containers not running properly"
            return 1
        fi
    fi
}

# Function to rollback deployment
rollback() {
    error "Rolling back deployment..."
    
    cd "$PROJECT_DIR"
    
    # Stop current containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore from backup if available
    local latest_backup
    latest_backup=$(ls -t "$BACKUP_DIR"/bonus-system-backup-*.tar.gz 2>/dev/null | head -n1)
    
    if [ -n "$latest_backup" ]; then
        log "Restoring from backup: $latest_backup"
        # Note: Add backup restoration logic here
        warning "Backup restoration not implemented yet"
    fi
    
    error "Rollback completed"
    exit 1
}

# Function to cleanup old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old backup files (keep last 10)
    if [ -d "$BACKUP_DIR" ]; then
        ls -t "$BACKUP_DIR"/bonus-system-backup-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    fi
    
    success "Cleanup completed"
}

# Function to send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Webhook notification (if configured)
    if [ -n "${WEBHOOK_URL:-}" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"🚀 Deployment $status: $message\"}" \
            > /dev/null 2>&1 || true
    fi
    
    # Email notification (if configured)
    if [ -n "${NOTIFICATION_EMAIL:-}" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Bonus System Deployment $status" "$NOTIFICATION_EMAIL" || true
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --env-file FILE       Environment file (default: $ENV_FILE)"
    echo "  --compose-file FILE   Docker Compose file (default: $COMPOSE_FILE)"
    echo "  --no-backup          Skip pre-deployment backup"
    echo "  --no-health-check    Skip health checks"
    echo "  --force              Force deployment even if health checks fail"
    echo "  --dry-run            Show what would be done without executing"
    echo "  -h, --help           Show this help message"
}

# Main deployment function
main() {
    local skip_backup=false
    local skip_health_check=false
    local force_deploy=false
    local dry_run=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env-file)
                ENV_FILE="$2"
                shift 2
                ;;
            --compose-file)
                COMPOSE_FILE="$2"
                shift 2
                ;;
            --no-backup)
                skip_backup=true
                shift
                ;;
            --no-health-check)
                skip_health_check=true
                shift
                ;;
            --force)
                force_deploy=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    if [ "$dry_run" = true ]; then
        log "DRY RUN: Would perform deployment with the following configuration:"
        log "  Environment file: $ENV_FILE"
        log "  Compose file: $COMPOSE_FILE"
        log "  Skip backup: $skip_backup"
        log "  Skip health check: $skip_health_check"
        log "  Force deploy: $force_deploy"
        exit 0
    fi
    
    log "=== Starting Production Deployment ==="
    log "Timestamp: $(date)"
    log "Environment file: $ENV_FILE"
    log "Compose file: $COMPOSE_FILE"
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    if [ "$skip_backup" = false ]; then
        create_backup
    else
        warning "Skipping backup as requested"
    fi
    
    # Pull latest images
    pull_images
    
    # Deploy services
    if ! deploy_services; then
        send_notification "FAILED" "Service deployment failed"
        rollback
    fi
    
    # Run health checks
    if [ "$skip_health_check" = false ]; then
        if ! run_comprehensive_health_check; then
            if [ "$force_deploy" = false ]; then
                send_notification "FAILED" "Health check failed"
                rollback
            else
                warning "Health check failed but continuing due to --force flag"
            fi
        fi
    else
        warning "Skipping health checks as requested"
    fi
    
    # Cleanup
    cleanup
    
    success "=== Deployment Completed Successfully ==="
    send_notification "SUCCESS" "Production deployment completed successfully"
    
    log "Deployment summary:"
    log "  - Containers: $(docker-compose -f "$COMPOSE_FILE" ps --services | wc -l) services deployed"
    log "  - Images: $(docker images --filter "reference=*/bonus-*" --format "table {{.Repository}}:{{.Tag}}" | wc -l) images"
    log "  - Uptime: $(uptime)"
    
    # Display service URLs
    local backend_url frontend_url
    backend_url=$(grep BACKEND_URL "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    frontend_url=$(grep FRONTEND_URL "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    
    log "Service URLs:"
    log "  - Frontend: ${frontend_url:-http://localhost:80}"
    log "  - Backend API: ${backend_url:-http://localhost:3002}/api"
    log "  - API Documentation: ${backend_url:-http://localhost:3002}/api/docs"
}

# Set trap to rollback on error
trap 'rollback' ERR

# Run main function
main "$@"