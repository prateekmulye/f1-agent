#!/bin/bash
# Production Environment Setup Script for F1-Slipstream Agent
# Configures production API keys, Pinecone index, and secrets management

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log "========================================="
log "F1-Slipstream Production Environment Setup"
log "========================================="

# Check if running in production mode
check_environment() {
    log "Checking environment..."
    
    if [ "${ENVIRONMENT:-}" != "production" ]; then
        warning "ENVIRONMENT is not set to 'production'"
        read -p "Continue with production setup? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log "Setup cancelled"
            exit 0
        fi
    fi
    
    log "Environment check passed ✓"
}

# Setup production API keys
setup_api_keys() {
    log "Setting up production API keys..."
    
    local env_file="${PROJECT_ROOT}/.env.production"
    
    # Check if .env.production exists
    if [ ! -f "$env_file" ]; then
        log "Creating .env.production from template..."
        cp "${PROJECT_ROOT}/.env.example" "$env_file"
    fi
    
    info "Please provide the following API keys:"
    info "(Press Enter to skip if already configured)"
    echo ""
    
    # OpenAI API Key
    read -p "OpenAI API Key: " -s openai_key
    echo ""
    if [ -n "$openai_key" ]; then
        sed -i.bak "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$openai_key|" "$env_file"
        log "✓ OpenAI API key configured"
    fi
    
    # Pinecone API Key
    read -p "Pinecone API Key: " -s pinecone_key
    echo ""
    if [ -n "$pinecone_key" ]; then
        sed -i.bak "s|PINECONE_API_KEY=.*|PINECONE_API_KEY=$pinecone_key|" "$env_file"
        log "✓ Pinecone API key configured"
    fi
    
    # Tavily API Key
    read -p "Tavily API Key: " -s tavily_key
    echo ""
    if [ -n "$tavily_key" ]; then
        sed -i.bak "s|TAVILY_API_KEY=.*|TAVILY_API_KEY=$tavily_key|" "$env_file"
        log "✓ Tavily API key configured"
    fi
    
    # Remove backup file
    rm -f "${env_file}.bak"
    
    # Set secure permissions
    chmod 600 "$env_file"
    log "Set secure permissions on .env.production ✓"
}

# Configure Pinecone production index
setup_pinecone_index() {
    log "Configuring Pinecone production index..."
    
    # Load environment variables
    if [ -f "${PROJECT_ROOT}/.env.production" ]; then
        export $(cat "${PROJECT_ROOT}/.env.production" | grep -v '^#' | xargs)
    else
        error ".env.production not found"
        return 1
    fi
    
    if [ -z "$PINECONE_API_KEY" ]; then
        error "PINECONE_API_KEY not set"
        return 1
    fi
    
    info "Checking Pinecone index configuration..."
    
    python3 << EOF
import os
import sys
from pinecone import Pinecone, ServerlessSpec

try:
    # Initialize Pinecone
    pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
    
    index_name = os.environ.get('PINECONE_INDEX_NAME', 'f1-knowledge-prod')
    dimension = 1536  # text-embedding-3-small dimension
    
    # List existing indexes
    indexes = pc.list_indexes()
    index_names = [idx.name for idx in indexes]
    
    if index_name in index_names:
        print(f"✓ Production index '{index_name}' already exists")
        
        # Get index stats
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        print(f"  Total vectors: {stats.get('total_vector_count', 0)}")
        print(f"  Dimension: {stats.get('dimension', 'unknown')}")
    else:
        print(f"Creating production index '{index_name}'...")
        
        # Create serverless index
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric='cosine',
            spec=ServerlessSpec(
                cloud='aws',
                region='us-east-1'
            )
        )
        
        print(f"✓ Production index '{index_name}' created successfully")
        print(f"  Dimension: {dimension}")
        print(f"  Metric: cosine")
        print(f"  Cloud: AWS (us-east-1)")
        
except Exception as e:
    print(f"✗ Error configuring Pinecone index: {e}")
    sys.exit(1)
EOF
    
    if [ $? -eq 0 ]; then
        log "Pinecone index configuration completed ✓"
    else
        error "Pinecone index configuration failed"
        return 1
    fi
}

# Setup secrets management
setup_secrets_management() {
    log "Setting up secrets management..."
    
    info "Secrets Management Options:"
    info "  1. Environment Variables (current)"
    info "  2. Docker Secrets"
    info "  3. AWS Secrets Manager"
    info "  4. HashiCorp Vault"
    echo ""
    
    read -p "Select secrets management method (1-4) [1]: " secrets_method
    secrets_method=${secrets_method:-1}
    
    case $secrets_method in
        1)
            log "Using environment variables for secrets"
            log "Ensure .env.production is secured with proper permissions ✓"
            ;;
        2)
            log "Setting up Docker Secrets..."
            setup_docker_secrets
            ;;
        3)
            log "AWS Secrets Manager selected"
            info "Please configure AWS Secrets Manager manually"
            info "See: https://docs.aws.amazon.com/secretsmanager/"
            ;;
        4)
            log "HashiCorp Vault selected"
            info "Please configure Vault manually"
            info "See: https://www.vaultproject.io/docs"
            ;;
        *)
            warning "Invalid selection, using environment variables"
            ;;
    esac
}

# Setup Docker Secrets
setup_docker_secrets() {
    log "Configuring Docker Secrets..."
    
    # Check if Docker Swarm is initialized
    if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
        warning "Docker Swarm is not initialized"
        read -p "Initialize Docker Swarm? (yes/no): " init_swarm
        if [ "$init_swarm" = "yes" ]; then
            docker swarm init
            log "Docker Swarm initialized ✓"
        else
            warning "Skipping Docker Secrets setup"
            return 0
        fi
    fi
    
    # Create secrets from .env.production
    if [ -f "${PROJECT_ROOT}/.env.production" ]; then
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ $key =~ ^#.*$ ]] && continue
            [[ -z $key ]] && continue
            
            # Create secret if it doesn't exist
            if ! docker secret ls | grep -q "$key"; then
                echo "$value" | docker secret create "$key" - 2>/dev/null && \
                    log "Created secret: $key" || \
                    warning "Failed to create secret: $key"
            fi
        done < "${PROJECT_ROOT}/.env.production"
    fi
    
    log "Docker Secrets configured ✓"
}

# Configure logging and monitoring
setup_logging_monitoring() {
    log "Configuring logging and monitoring..."
    
    # Create logs directory
    mkdir -p "${PROJECT_ROOT}/logs"
    chmod 755 "${PROJECT_ROOT}/logs"
    
    # Configure log rotation
    cat > "${PROJECT_ROOT}/logs/logrotate.conf" << EOF
${PROJECT_ROOT}/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 appuser appuser
    sharedscripts
    postrotate
        docker-compose -f ${PROJECT_ROOT}/docker-compose.prod.yml restart api ui
    endscript
}
EOF
    
    log "Logging configuration created ✓"
    
    # Setup monitoring
    if [ -f "${SCRIPT_DIR}/setup_monitoring.sh" ]; then
        read -p "Setup monitoring stack now? (yes/no): " setup_mon
        if [ "$setup_mon" = "yes" ]; then
            bash "${SCRIPT_DIR}/setup_monitoring.sh"
        else
            info "You can setup monitoring later with: ./scripts/setup_monitoring.sh"
        fi
    fi
}

# Validate production configuration
validate_configuration() {
    log "Validating production configuration..."
    
    if [ -f "${SCRIPT_DIR}/validate_config.py" ]; then
        python3 "${SCRIPT_DIR}/validate_config.py" --env production || {
            error "Configuration validation failed"
            return 1
        }
    else
        warning "Configuration validation script not found"
    fi
    
    log "Configuration validation passed ✓"
}

# Create production checklist
create_checklist() {
    local checklist_file="${PROJECT_ROOT}/PRODUCTION_CHECKLIST.md"
    
    log "Creating production deployment checklist..."
    
    cat > "$checklist_file" << 'EOF'
# F1-Slipstream Production Deployment Checklist

## Pre-Deployment

- [ ] All API keys configured in `.env.production`
- [ ] Pinecone production index created and configured
- [ ] Secrets management configured
- [ ] Monitoring stack deployed and configured
- [ ] Alert recipients configured in `alertmanager.yml`
- [ ] SSL/TLS certificates obtained (if applicable)
- [ ] Domain DNS configured (if applicable)
- [ ] Backup strategy defined and tested
- [ ] Disaster recovery plan documented

## Security

- [ ] `.env.production` has secure permissions (600)
- [ ] API keys rotated from development keys
- [ ] Rate limiting configured
- [ ] CORS policies configured
- [ ] Input validation enabled
- [ ] Security headers configured
- [ ] Container security scanning completed
- [ ] Dependency vulnerability scan completed

## Infrastructure

- [ ] Docker and Docker Compose installed
- [ ] Sufficient disk space available (>20GB recommended)
- [ ] Sufficient memory available (>4GB recommended)
- [ ] Network ports opened (8000, 8501)
- [ ] Firewall rules configured
- [ ] Load balancer configured (if applicable)
- [ ] CDN configured (if applicable)

## Data

- [ ] Historical F1 data ingested into Pinecone
- [ ] Vector store index validated
- [ ] Data backup completed
- [ ] Data migration tested (if upgrading)

## Testing

- [ ] Configuration validation passed
- [ ] Health checks passing
- [ ] Smoke tests completed
- [ ] Load testing completed
- [ ] Failover testing completed
- [ ] Rollback procedure tested

## Monitoring

- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards configured
- [ ] Alertmanager routing configured
- [ ] Alert notifications tested
- [ ] Log aggregation configured
- [ ] Error tracking configured

## Documentation

- [ ] Deployment documentation updated
- [ ] Runbook created for common issues
- [ ] On-call procedures documented
- [ ] API documentation published
- [ ] User documentation updated

## Post-Deployment

- [ ] Deployment verified with health checks
- [ ] Smoke tests passed
- [ ] Monitoring dashboards reviewed
- [ ] Alert thresholds validated
- [ ] Performance metrics baseline established
- [ ] Stakeholders notified
- [ ] Deployment documented in changelog

## Rollback Plan

- [ ] Previous version backup available
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging
- [ ] Rollback decision criteria defined
- [ ] Rollback contacts identified

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Approved By:** _________________

**Notes:**

EOF
    
    log "Production checklist created: $checklist_file"
}

# Display summary
display_summary() {
    log "========================================="
    log "Production Environment Setup Complete! ✓"
    log "========================================="
    log ""
    log "Configuration Files:"
    log "  Environment: ${PROJECT_ROOT}/.env.production"
    log "  Checklist:   ${PROJECT_ROOT}/PRODUCTION_CHECKLIST.md"
    log "  Logs:        ${PROJECT_ROOT}/logs/"
    log ""
    log "Next Steps:"
    log "  1. Review and complete PRODUCTION_CHECKLIST.md"
    log "  2. Ingest production data: poetry run python -m src.ingestion.cli"
    log "  3. Run deployment: ./scripts/deploy_production.sh"
    log "  4. Verify deployment: ./scripts/health_check.sh"
    log ""
    log "Important Security Notes:"
    log "  - Never commit .env.production to version control"
    log "  - Rotate API keys regularly"
    log "  - Monitor costs and usage"
    log "  - Keep dependencies updated"
    log ""
}

# Main setup flow
main() {
    check_environment
    setup_api_keys
    setup_pinecone_index
    setup_secrets_management
    setup_logging_monitoring
    validate_configuration
    create_checklist
    display_summary
}

# Run main function
main "$@"
