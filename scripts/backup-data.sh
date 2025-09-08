#!/bin/bash
# Data Backup Script for Bonus Simulation System
# This script creates compressed backups of database files and logs

set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backups/bonus-system"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="bonus-system-backup-${DATE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting backup process..."

# Function to backup Docker volumes
backup_docker_volumes() {
    log "Backing up Docker volumes..."
    
    # Create temporary directory for volume exports
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Backup backend data volume
    if docker volume ls | grep -q "bunosassign_backend_data"; then
        log "Exporting backend data volume..."
        docker run --rm \
            -v bunosassign_backend_data:/data:ro \
            -v "$TEMP_DIR":/backup \
            alpine:latest \
            tar czf /backup/backend_data.tar.gz -C /data .
    else
        warning "Backend data volume not found"
    fi
    
    # Backup backend logs volume
    if docker volume ls | grep -q "bunosassign_backend_logs"; then
        log "Exporting backend logs volume..."
        docker run --rm \
            -v bunosassign_backend_logs:/data:ro \
            -v "$TEMP_DIR":/backup \
            alpine:latest \
            tar czf /backup/backend_logs.tar.gz -C /data .
    fi
    
    # Backup frontend logs volume
    if docker volume ls | grep -q "bunosassign_frontend_logs"; then
        log "Exporting frontend logs volume..."
        docker run --rm \
            -v bunosassign_frontend_logs:/data:ro \
            -v "$TEMP_DIR":/backup \
            alpine:latest \
            tar czf /backup/frontend_logs.tar.gz -C /data .
    fi
    
    # Backup Redis data if enabled
    if docker volume ls | grep -q "bunosassign_redis_data"; then
        log "Exporting Redis data volume..."
        docker run --rm \
            -v bunosassign_redis_data:/data:ro \
            -v "$TEMP_DIR":/backup \
            alpine:latest \
            tar czf /backup/redis_data.tar.gz -C /data .
    fi
    
    # Create final backup archive
    tar czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$TEMP_DIR" .
    
    # Cleanup temporary directory
    rm -rf "$TEMP_DIR"
    
    log "Docker volumes backup completed: $BACKUP_NAME.tar.gz"
}

# Function to backup local database files (if not using Docker)
backup_local_files() {
    log "Backing up local database files..."
    
    TEMP_DIR=$(mktemp -d)
    
    # Backup database directory
    if [ -d "./database" ]; then
        cp -r ./database "$TEMP_DIR/"
        log "Database files copied"
    else
        warning "Database directory not found"
    fi
    
    # Backup backend logs
    if [ -d "./backend/logs" ]; then
        cp -r ./backend/logs "$TEMP_DIR/backend_logs"
        log "Backend logs copied"
    fi
    
    # Create backup archive
    if [ "$(ls -A $TEMP_DIR)" ]; then
        tar czf "$BACKUP_DIR/$BACKUP_NAME-local.tar.gz" -C "$TEMP_DIR" .
        log "Local files backup completed: $BACKUP_NAME-local.tar.gz"
    else
        warning "No local files found to backup"
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
}

# Function to upload to S3 (if configured)
upload_to_s3() {
    if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ] && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
        log "Uploading backup to S3..."
        
        export AWS_ACCESS_KEY_ID
        export AWS_SECRET_ACCESS_KEY
        export AWS_DEFAULT_REGION=${AWS_REGION:-us-west-2}
        
        # Upload to S3 using AWS CLI (if available)
        if command -v aws &> /dev/null; then
            aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "s3://$BACKUP_S3_BUCKET/bonus-system/$BACKUP_NAME.tar.gz"
            log "Backup uploaded to S3: s3://$BACKUP_S3_BUCKET/bonus-system/$BACKUP_NAME.tar.gz"
        else
            warning "AWS CLI not found, skipping S3 upload"
        fi
    else
        log "S3 configuration not found, skipping upload"
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -name "bonus-system-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "bonus-system-backup-*-local.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # Also cleanup old backups from S3 if configured
    if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v aws &> /dev/null; then
        CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls "s3://$BACKUP_S3_BUCKET/bonus-system/" | while read -r line; do
            FILE_DATE=$(echo "$line" | awk '{print $1}')
            FILE_NAME=$(echo "$line" | awk '{print $4}')
            if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
                aws s3 rm "s3://$BACKUP_S3_BUCKET/bonus-system/$FILE_NAME"
                log "Deleted old S3 backup: $FILE_NAME"
            fi
        done
    fi
    
    log "Cleanup completed"
}

# Function to verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity: $backup_file"
    
    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        log "Backup verification successful"
        return 0
    else
        error "Backup verification failed!"
        return 1
    fi
}

# Main backup process
main() {
    log "=== Bonus System Backup Started ==="
    
    # Check if Docker is available
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        backup_docker_volumes
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME.tar.gz"
    else
        backup_local_files  
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME-local.tar.gz"
    fi
    
    # Verify backup if file was created
    if [ -f "$BACKUP_FILE" ]; then
        if verify_backup "$BACKUP_FILE"; then
            # Calculate and log backup size
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log "Backup size: $BACKUP_SIZE"
            
            # Upload to S3 if configured
            upload_to_s3
        else
            error "Backup verification failed, not uploading"
            exit 1
        fi
    else
        error "Backup file not created"
        exit 1
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "=== Backup Process Completed Successfully ==="
    log "Backup location: $BACKUP_FILE"
}

# Run main function
main "$@"