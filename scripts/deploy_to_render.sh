#!/bin/bash
# Deploy F1-Slipstream to Render (Free Tier)
# This script helps you deploy to Render with proper configuration

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
log "F1-Slipstream Render Deployment Helper"
log "========================================="
echo ""

# Check if git repository
check_git_repo() {
    log "Checking Git repository..."
    
    if [ ! -d "${PROJECT_ROOT}/.git" ]; then
        error "Not a Git repository"
        info "Initialize with: git init"
        exit 1
    fi
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        warning "You have uncommitted changes"
        read -p "Commit changes now? (yes/no): " commit_now
        if [ "$commit_now" = "yes" ]; then
            git add .
            read -p "Commit message: " commit_msg
            git commit -m "$commit_msg"
        fi
    fi
    
    log "Git repository check passed ✓"
}

# Check if GitHub remote exists
check_github_remote() {
    log "Checking GitHub remote..."
    
    if ! git remote get-url origin &>/dev/null; then
        warning "No GitHub remote configured"
        info "You need to:"
        info "  1. Create a repository on GitHub"
        info "  2. Add remote: git remote add origin https://github.com/YOUR_USERNAME/f1-slipstream.git"
        info "  3. Push code: git push -u origin main"
        echo ""
        read -p "Have you created a GitHub repository? (yes/no): " has_repo
        if [ "$has_repo" != "yes" ]; then
            info "Please create a GitHub repository first at: https://github.com/new"
            exit 0
        fi
        
        read -p "Enter your GitHub repository URL: " repo_url
        git remote add origin "$repo_url"
        log "Remote added ✓"
    fi
    
    # Check if code is pushed
    if ! git ls-remote origin &>/dev/null; then
        warning "Code not pushed to GitHub"
        read -p "Push now? (yes/no): " push_now
        if [ "$push_now" = "yes" ]; then
            git push -u origin main || git push -u origin master
            log "Code pushed ✓"
        fi
    fi
    
    log "GitHub remote check passed ✓"
}

# Collect API keys
collect_api_keys() {
    log "Collecting API keys..."
    echo ""
    info "You'll need API keys from:"
    info "  - OpenAI: https://platform.openai.com/api-keys"
    info "  - Pinecone: https://app.pinecone.io"
    info "  - Tavily: https://app.tavily.com"
    echo ""
    
    # Create .env.render file
    local env_file="${PROJECT_ROOT}/.env.render"
    
    echo "# Render Environment Variables" > "$env_file"
    echo "# Copy these to Render Dashboard → Environment" >> "$env_file"
    echo "" >> "$env_file"
    
    read -p "OpenAI API Key: " -s openai_key
    echo ""
    echo "OPENAI_API_KEY=$openai_key" >> "$env_file"
    
    read -p "Pinecone API Key: " -s pinecone_key
    echo ""
    echo "PINECONE_API_KEY=$pinecone_key" >> "$env_file"
    
    read -p "Pinecone Index Name [f1-knowledge-free]: " pinecone_index
    pinecone_index=${pinecone_index:-f1-knowledge-free}
    echo "PINECONE_INDEX_NAME=$pinecone_index" >> "$env_file"
    
    read -p "Tavily API Key: " -s tavily_key
    echo ""
    echo "TAVILY_API_KEY=$tavily_key" >> "$env_file"
    
    # Add other environment variables
    cat >> "$env_file" << 'EOF'

# Application Settings
ENVIRONMENT=production
LOG_LEVEL=INFO
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# Rate Limiting (Free Tier Protection)
MAX_REQUESTS_PER_MINUTE=3
MAX_REQUESTS_PER_DAY=100
ENABLE_RATE_LIMITING=true

# Tavily Settings
TAVILY_MAX_RESULTS=3
TAVILY_DAILY_LIMIT=30

# Caching
CACHE_TTL_SECONDS=3600
ENABLE_CACHING=true
EOF
    
    chmod 600 "$env_file"
    log "API keys saved to $env_file ✓"
    warning "Keep this file secure and never commit it to Git!"
}

# Setup Pinecone index
setup_pinecone() {
    log "Setting up Pinecone index..."
    
    # Load environment
    if [ -f "${PROJECT_ROOT}/.env.render" ]; then
        export $(cat "${PROJECT_ROOT}/.env.render" | grep -v '^#' | xargs)
    fi
    
    if [ -z "$PINECONE_API_KEY" ]; then
        error "PINECONE_API_KEY not set"
        return 1
    fi
    
    python3 "${SCRIPT_DIR}/setup_production_pinecone.py"
}

# Display deployment instructions
display_instructions() {
    log "========================================="
    log "Ready to Deploy! 🚀"
    log "========================================="
    echo ""
    info "Next Steps:"
    echo ""
    echo "1️⃣  Go to Render: https://dashboard.render.com"
    echo ""
    echo "2️⃣  Click 'New +' → 'Web Service'"
    echo ""
    echo "3️⃣  Connect your GitHub repository"
    echo ""
    echo "4️⃣  Configure the service:"
    echo "    Name: f1-slipstream-ui"
    echo "    Region: Choose closest to you"
    echo "    Branch: main (or master)"
    echo "    Root Directory: apps/f1-slipstream-agent"
    echo "    Runtime: Python 3"
    echo "    Build Command: pip install -r requirements.txt"
    echo "    Start Command: streamlit run src/ui/app.py --server.port \$PORT --server.address 0.0.0.0 --server.headless true"
    echo "    Instance Type: Free"
    echo ""
    echo "5️⃣  Add Environment Variables:"
    echo "    Copy from: ${PROJECT_ROOT}/.env.render"
    echo "    (Click 'Environment' tab and paste each variable)"
    echo ""
    echo "6️⃣  Click 'Create Web Service'"
    echo ""
    echo "7️⃣  Wait 5-10 minutes for deployment"
    echo ""
    echo "8️⃣  Your app will be live at:"
    echo "    https://f1-slipstream-ui.onrender.com"
    echo ""
    log "========================================="
    echo ""
    info "Alternative: Use render.yaml for automatic deployment"
    info "  1. Copy render.yaml to repository root"
    info "  2. In Render Dashboard, click 'New +' → 'Blueprint'"
    info "  3. Connect repository and deploy"
    echo ""
    info "Documentation: ${PROJECT_ROOT}/docs/FREE_DEPLOYMENT_GUIDE.md"
    echo ""
    log "Good luck! 🍀"
}

# Main deployment flow
main() {
    check_git_repo
    check_github_remote
    collect_api_keys
    
    read -p "Setup Pinecone index now? (yes/no): " setup_pine
    if [ "$setup_pine" = "yes" ]; then
        setup_pinecone
    fi
    
    display_instructions
}

# Run main function
main "$@"
