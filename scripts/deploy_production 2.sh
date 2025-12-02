#!/bin/bash
# Production Deployment Script for F1-Slipstream Agent
# This script automates the deployment process to production environment

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG="${PROJECT_ROOT}/logs/deployment_$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="${PROJECT_ROOT}/backups/$(date +%Y%m%d_%H%M%S)"

# Ensure log directory exists
mkdir -p "$(dirname "$DEPLOYMENT_LOG")"
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env.production exists
    if [ ! -f "${PROJECT_ROOT}/.env.production" ]; then
        error ".env.production file not found. Please create it from .env.example"
        exit 1
    fi
    
    log "Prerequisites check passed ✓"
}

# Validate configuration
validate_config() {
    log "Validating configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Run configuration validation script
    if [ -f "${SCRIPT_DIR}/validate_config.py" ]; then
        python3 "${SCRIPT_DIR}/validate_config.py" --env production || {
            error "Configuration validation failed"
            exit 1
        }
    else
        warning "Configuration validation script not found, skipping..."
    fi
    
    log "Configuration validation passed ✓"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    # Backup environment file
    if [ -f "${PROJECT_ROOT}/.env.production" ]; then
        cp "${PROJECT_ROOT}/.env.production" "${BACKUP_DIR}/.env.production.backup"
        log "Backed up .env.production"
    fi
    
    # Backup docker-compose file
    if [ -f "${PROJECT_ROOT}/docker-compose.prod.yml" ]; then
        cp "${PROJECT_ROOT}/docker-compose.prod.yml" "${BACKUP_DIR}/docker-compose.prod.yml.backup"
        log "Backed up docker-compose.prod.yml"
    fi
    
    # Export current container logs
    if docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" ps -q api &> /dev/null; then
        docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" logs api > "${BACKUP_DIR}/api.log" 2>&1 || true
        docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" logs ui > "${BACKUP_DIR}/ui.log" 2>&1 || true
        log "Backed up container logs"
    fi
    
    log "Backup completed ✓"
}

# Pull latest code
pull_latest_code() {
    log "Pulling latest code..."
    
    cd "$PROJECT_ROOT"
    
    # Check if git repository
    if [ -d .git ]; then
        git fetch origin
        git pull origin main || git pull origin master
        log "Code updated ✓"
    else
        warning "Not a git repository, skipping code pull"
    fi
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build production images
    docker-compose -f docker-compose.prod.yml build --no-cache || {
        error "Docker build failed"
        exit 1
    }
    
    log "Docker images built successfully ✓"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Check if migration script exists
    if [ -f "${SCRIPT_DIR}/run_migrations.sh" ]; then
        bash "${SCRIPT_DIR}/run_migrations.sh" || {
            error "Database migrations failed"
            exit 1
        }
    else
        warning "Migration script not found, skipping migrations"
    fi
    
    log "Migrations completed ✓"
}

# Stop current containers
stop_containers() {
    log "Stopping current containers..."
    
    cd "$PROJECT_ROOT"
    
    # Gracefully stop containers
    docker-compose -f docker-compose.prod.yml down --timeout 30 || {
        warning "Failed to stop containers gracefully, forcing stop..."
        docker-compose -f docker-compose.prod.yml down --timeout 5
    }
    
    log "Containers stopped ✓"
}

# Start new containers
start_containers() {
    log "Starting new containers..."
    
    cd "$PROJECT_ROOT"
    
    # Start containers in detached mode
    docker-compose -f docker-compose.prod.yml up -d || {
        error "Failed to start containers"
        exit 1
    }
    
    log "Containers started ✓"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    local api_healthy=false
    local ui_healthy=false
    
    # Wait for API to be healthy
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        # Check API health
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            api_healthy=true
            log "API is healthy ✓"
        fi
        
        # Check UI health
        if curl -f -s http://localhost:8501/_stcore/health > /dev/null 2>&1; then
            ui_healthy=true
            log "UI is healthy ✓"
        fi
        
        # Both services healthy
        if [ "$api_healthy" = true ] && [ "$ui_healthy" = true ]; then
            log "All services are healthy ✓"
            return 0
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    # Test API endpoint
    if curl -f -s http://localhost:8000/health | grep -q "healthy"; then
        log "API smoke test passed ✓"
    else
        error "API smoke test failed"
        return 1
    fi
    
    # Test UI accessibility
    if curl -f -s http://localhost:8501 > /dev/null 2>&1; then
        log "UI smoke test passed ✓"
    else
        error "UI smoke test failed"
        return 1
    fi
    
    log "Smoke tests completed ✓"
}

# Cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f || true
    
    log "Cleanup completed ✓"
}

# Main deployment flow
main() {
    log "========================================="
    log "Starting F1-Slipstream Production Deployment"
    log "========================================="
    
    check_prerequisites
    validate_config
    backup_current
    pull_latest_code
    build_images
    stop_containers
    run_migrations
    start_containers
    
    if health_check; then
        run_smoke_tests
        cleanup
        
        log "========================================="
        log "Deployment completed successfully! ✓"
        log "========================================="
        log "API: http://localhost:8000"
        log "UI: http://localhost:8501"
        log "Logs: $DEPLOYMENT_LOG"
        log "Backup: $BACKUP_DIR"
        
        exit 0
    else
        error "========================================="
        error "Deployment failed - Health check did not pass"
        error "========================================="
        error "Rolling back to previous version..."
        
        # Rollback
        bash "${SCRIPT_DIR}/rollback.sh" "$BACKUP_DIR"
        
        exit 1
    fi
}

# Run main function
main "$@"
