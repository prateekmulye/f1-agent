#!/bin/bash
# Health Check Script for F1-Slipstream Agent
# Validates all services are running correctly

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

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
UI_URL="${UI_URL:-http://localhost:8501}"
TIMEOUT=10
OVERALL_STATUS=0

log "========================================="
log "F1-Slipstream Health Check"
log "========================================="

# Check API health endpoint
check_api_health() {
    log "Checking API health..."
    
    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "${API_URL}/health" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        log "✓ API is healthy (HTTP $http_code)"
        
        # Parse response for detailed status
        if echo "$body" | grep -q "healthy"; then
            log "  Status: $(echo "$body" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
        fi
        
        return 0
    else
        error "✗ API is unhealthy (HTTP $http_code)"
        OVERALL_STATUS=1
        return 1
    fi
}

# Check UI health
check_ui_health() {
    log "Checking UI health..."
    
    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "${UI_URL}/_stcore/health" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        log "✓ UI is healthy (HTTP $http_code)"
        return 0
    else
        # Try alternative health check
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "${UI_URL}" 2>/dev/null || echo "000")
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "200" ]; then
            log "✓ UI is accessible (HTTP $http_code)"
            return 0
        else
            error "✗ UI is unhealthy (HTTP $http_code)"
            OVERALL_STATUS=1
            return 1
        fi
    fi
}

# Check Docker containers
check_containers() {
    log "Checking Docker containers..."
    
    if ! command -v docker &> /dev/null; then
        warning "Docker not found, skipping container check"
        return 0
    fi
    
    # Check API container
    if docker ps --filter "name=f1-slipstream-api" --filter "status=running" | grep -q "f1-slipstream-api"; then
        log "✓ API container is running"
    else
        error "✗ API container is not running"
        OVERALL_STATUS=1
    fi
    
    # Check UI container
    if docker ps --filter "name=f1-slipstream-ui" --filter "status=running" | grep -q "f1-slipstream-ui"; then
        log "✓ UI container is running"
    else
        error "✗ UI container is not running"
        OVERALL_STATUS=1
    fi
}

# Check external dependencies
check_dependencies() {
    log "Checking external dependencies..."
    
    # Check OpenAI API (if API key is set)
    if [ -n "${OPENAI_API_KEY:-}" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
            -H "Authorization: Bearer $OPENAI_API_KEY" \
            "https://api.openai.com/v1/models" 2>/dev/null || echo "000")
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "200" ]; then
            log "✓ OpenAI API is accessible"
        else
            warning "⚠ OpenAI API check failed (HTTP $http_code)"
        fi
    else
        warning "⚠ OPENAI_API_KEY not set, skipping OpenAI check"
    fi
    
    # Check Pinecone API (if API key is set)
    if [ -n "${PINECONE_API_KEY:-}" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
            -H "Api-Key: $PINECONE_API_KEY" \
            "https://api.pinecone.io/indexes" 2>/dev/null || echo "000")
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "200" ]; then
            log "✓ Pinecone API is accessible"
        else
            warning "⚠ Pinecone API check failed (HTTP $http_code)"
        fi
    else
        warning "⚠ PINECONE_API_KEY not set, skipping Pinecone check"
    fi
    
    # Check Tavily API (if API key is set)
    if [ -n "${TAVILY_API_KEY:-}" ]; then
        # Tavily doesn't have a simple health endpoint, so we skip detailed check
        log "✓ Tavily API key is configured"
    else
        warning "⚠ TAVILY_API_KEY not set"
    fi
}

# Check system resources
check_resources() {
    log "Checking system resources..."
    
    # Check disk space
    disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 90 ]; then
        log "✓ Disk usage: ${disk_usage}%"
    else
        warning "⚠ High disk usage: ${disk_usage}%"
    fi
    
    # Check memory (if free command is available)
    if command -v free &> /dev/null; then
        mem_usage=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
        if [ "$mem_usage" -lt 90 ]; then
            log "✓ Memory usage: ${mem_usage}%"
        else
            warning "⚠ High memory usage: ${mem_usage}%"
        fi
    fi
}

# Check logs for errors
check_logs() {
    log "Checking recent logs for errors..."
    
    if ! command -v docker &> /dev/null; then
        warning "Docker not found, skipping log check"
        return 0
    fi
    
    # Check API logs for errors in last 5 minutes
    if docker ps --filter "name=f1-slipstream-api" --filter "status=running" | grep -q "f1-slipstream-api"; then
        error_count=$(docker logs --since 5m f1-slipstream-api-prod 2>&1 | grep -i "error" | wc -l || echo "0")
        
        if [ "$error_count" -eq 0 ]; then
            log "✓ No errors in API logs (last 5 minutes)"
        else
            warning "⚠ Found $error_count errors in API logs (last 5 minutes)"
        fi
    fi
}

# Main health check flow
main() {
    check_api_health
    check_ui_health
    check_containers
    check_dependencies
    check_resources
    check_logs
    
    log "========================================="
    
    if [ $OVERALL_STATUS -eq 0 ]; then
        log "Overall Status: HEALTHY ✓"
        log "========================================="
        exit 0
    else
        error "Overall Status: UNHEALTHY ✗"
        error "========================================="
        exit 1
    fi
}

# Run main function
main "$@"
