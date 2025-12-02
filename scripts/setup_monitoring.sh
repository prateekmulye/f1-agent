#!/bin/bash
# Setup Monitoring Stack for F1-Slipstream Agent
# Deploys Prometheus, Grafana, and Alertmanager

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
MONITORING_DIR="${PROJECT_ROOT}/monitoring"

log "========================================="
log "Setting up F1-Slipstream Monitoring Stack"
log "========================================="

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    log "Prerequisites check passed ✓"
}

# Create monitoring environment file
create_monitoring_env() {
    log "Creating monitoring environment configuration..."
    
    local env_file="${MONITORING_DIR}/.env.monitoring"
    
    if [ ! -f "$env_file" ]; then
        cat > "$env_file" << EOF
# Grafana Configuration
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=changeme

# Alertmanager Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL_FROM=alerts@f1-slipstream.com

# Alert Recipients
CRITICAL_ALERT_EMAIL=critical@example.com
API_TEAM_EMAIL=api-team@example.com
COST_ALERT_EMAIL=finance@example.com
INFRA_TEAM_EMAIL=infra@example.com

# Slack Webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PagerDuty (optional)
# PAGERDUTY_SERVICE_KEY=your-service-key
EOF
        
        log "Created monitoring environment file: $env_file"
        warning "Please update $env_file with your actual credentials"
    else
        log "Monitoring environment file already exists"
    fi
}

# Start monitoring stack
start_monitoring() {
    log "Starting monitoring stack..."
    
    cd "$MONITORING_DIR"
    
    # Load environment variables
    if [ -f .env.monitoring ]; then
        export $(cat .env.monitoring | grep -v '^#' | xargs)
    fi
    
    # Start monitoring services
    docker-compose -f docker-compose.monitoring.yml up -d || {
        error "Failed to start monitoring stack"
        exit 1
    }
    
    log "Monitoring stack started ✓"
}

# Wait for services to be ready
wait_for_services() {
    log "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        # Check Prometheus
        if curl -f -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
            log "✓ Prometheus is ready"
            
            # Check Grafana
            if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
                log "✓ Grafana is ready"
                
                # Check Alertmanager
                if curl -f -s http://localhost:9093/-/healthy > /dev/null 2>&1; then
                    log "✓ Alertmanager is ready"
                    return 0
                fi
            fi
        fi
        
        sleep 5
        attempt=$((attempt + 1))
    done
    
    error "Services did not become ready in time"
    return 1
}

# Display access information
display_info() {
    log "========================================="
    log "Monitoring Stack Setup Complete! ✓"
    log "========================================="
    log ""
    log "Access URLs:"
    log "  Prometheus:    http://localhost:9090"
    log "  Grafana:       http://localhost:3000"
    log "  Alertmanager:  http://localhost:9093"
    log "  cAdvisor:      http://localhost:8080"
    log ""
    log "Default Credentials:"
    log "  Grafana: admin / changeme (change in .env.monitoring)"
    log ""
    log "Next Steps:"
    log "  1. Update ${MONITORING_DIR}/.env.monitoring with your credentials"
    log "  2. Configure alert recipients in alertmanager.yml"
    log "  3. Import dashboards in Grafana"
    log "  4. Test alerts: docker-compose -f docker-compose.monitoring.yml logs alertmanager"
    log ""
}

# Main setup flow
main() {
    check_prerequisites
    create_monitoring_env
    start_monitoring
    
    if wait_for_services; then
        display_info
        exit 0
    else
        error "Setup failed - services did not start properly"
        log "Check logs with: docker-compose -f ${MONITORING_DIR}/docker-compose.monitoring.yml logs"
        exit 1
    fi
}

# Run main function
main "$@"
