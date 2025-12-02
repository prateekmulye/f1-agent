#!/bin/bash
# Rollback Script for F1-Slipstream Agent
# Restores previous deployment state in case of failure

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${1:-}"

# Validate backup directory
if [ -z "$BACKUP_DIR" ]; then
    error "Usage: $0 <backup_directory>"
    error "Example: $0 /path/to/backup/20231201_120000"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    error "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

log "========================================="
log "Starting Rollback Process"
log "========================================="
log "Backup directory: $BACKUP_DIR"

# Confirm rollback
read -p "Are you sure you want to rollback? This will stop current services. (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    log "Rollback cancelled"
    exit 0
fi

# Stop current containers
stop_current_containers() {
    log "Stopping current containers..."
    
    cd "$PROJECT_ROOT"
    
    if docker-compose -f docker-compose.prod.yml ps -q &> /dev/null; then
        docker-compose -f docker-compose.prod.yml down --timeout 30 || {
            warning "Failed to stop containers gracefully, forcing stop..."
            docker-compose -f docker-compose.prod.yml down --timeout 5
        }
        log "Containers stopped ✓"
    else
        warning "No running containers found"
    fi
}

# Restore configuration files
restore_config() {
    log "Restoring configuration files..."
    
    # Restore .env.production
    if [ -f "${BACKUP_DIR}/.env.production.backup" ]; then
        cp "${BACKUP_DIR}/.env.production.backup" "${PROJECT_ROOT}/.env.production"
        log "Restored .env.production ✓"
    else
        warning ".env.production backup not found, skipping..."
    fi
    
    # Restore docker-compose.prod.yml
    if [ -f "${BACKUP_DIR}/docker-compose.prod.yml.backup" ]; then
        cp "${BACKUP_DIR}/docker-compose.prod.yml.backup" "${PROJECT_ROOT}/docker-compose.prod.yml"
        log "Restored docker-compose.prod.yml ✓"
    else
        warning "docker-compose.prod.yml backup not found, skipping..."
    fi
}

# Restore Docker images
restore_images() {
    log "Restoring Docker images..."
    
    # Check if image backup exists
    if [ -f "${BACKUP_DIR}/docker-images.tar" ]; then
        docker load -i "${BACKUP_DIR}/docker-images.tar"
        log "Docker images restored ✓"
    else
        warning "Docker image backup not found"
        warning "Will use existing images or rebuild from code"
        
        # Rebuild from code
        cd "$PROJECT_ROOT"
        docker-compose -f docker-compose.prod.yml build || {
            error "Failed to rebuild Docker images"
            exit 1
        }
    fi
}

# Start previous version
start_previous_version() {
    log "Starting previous version..."
    
    cd "$PROJECT_ROOT"
    
    docker-compose -f docker-compose.prod.yml up -d || {
        error "Failed to start previous version"
        exit 1
    }
    
    log "Previous version started ✓"
}

# Verify rollback
verify_rollback() {
    log "Verifying rollback..."
    
    local max_attempts=20
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Verification attempt $attempt/$max_attempts..."
        
        # Check API health
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            log "API is healthy ✓"
            
            # Check UI health
            if curl -f -s http://localhost:8501/_stcore/health > /dev/null 2>&1; then
                log "UI is healthy ✓"
                log "Rollback verification successful ✓"
                return 0
            fi
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    error "Rollback verification failed after $max_attempts attempts"
    return 1
}

# Create rollback report
create_report() {
    local report_file="${BACKUP_DIR}/rollback_report.txt"
    
    log "Creating rollback report..."
    
    cat > "$report_file" << EOF
F1-Slipstream Rollback Report
========================================
Rollback Date: $(date +'%Y-%m-%d %H:%M:%S')
Backup Directory: $BACKUP_DIR
Project Root: $PROJECT_ROOT

Services Status:
EOF
    
    # Add container status
    if command -v docker &> /dev/null; then
        echo "" >> "$report_file"
        echo "Docker Containers:" >> "$report_file"
        docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" ps >> "$report_file" 2>&1 || true
    fi
    
    # Add health check results
    echo "" >> "$report_file"
    echo "Health Check Results:" >> "$report_file"
    curl -s http://localhost:8000/health >> "$report_file" 2>&1 || echo "API health check failed" >> "$report_file"
    
    log "Rollback report created: $report_file"
}

# Main rollback flow
main() {
    stop_current_containers
    restore_config
    restore_images
    start_previous_version
    
    if verify_rollback; then
        create_report
        
        log "========================================="
        log "Rollback completed successfully! ✓"
        log "========================================="
        log "Services have been restored to previous version"
        log "API: http://localhost:8000"
        log "UI: http://localhost:8501"
        log "Report: ${BACKUP_DIR}/rollback_report.txt"
        
        exit 0
    else
        error "========================================="
        error "Rollback verification failed"
        error "========================================="
        error "Please check logs and investigate manually"
        
        # Show recent logs
        log "Recent API logs:"
        docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" logs --tail=50 api
        
        exit 1
    fi
}

# Run main function
main "$@"
