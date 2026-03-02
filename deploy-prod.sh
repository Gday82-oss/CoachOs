#!/bin/bash

# MyCareCoach - Super Agent Deployment Script
# Usage: ./deploy-prod.sh [frontend|backend|all]

set -e  # Exit on error

ENV=${1:-all}
APP_NAME="mycarecoach"
DOMAIN="mycarecoach.app"
VPS_HOST="${VPS_HOST:-your-vps-ip}"

echo "🚀 MyCareCoach Production Deployer"
echo "=================================="
echo "Target: $DOMAIN"
echo "VPS: $VPS_HOST"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Check prerequisites
check_prereqs() {
    log "Checking prerequisites..."
    
    command -v node >/dev/null 2>&1 || { error "Node.js is required"; exit 1; }
    command -v pm2 >/dev/null 2>&1 || { warn "PM2 not found, will install"; }
    
    if [ ! -f "client/.env.production" ]; then
        warn "client/.env.production not found, creating from template..."
        cat > client/.env.production << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.$DOMAIN
EOF
    fi
    
    success "Prerequisites OK"
}

# Build frontend
build_frontend() {
    log "Building frontend..."
    cd client
    
    # Clean install
    rm -rf node_modules dist
    npm ci
    
    # Build with production env
    cp .env.production .env
    npm run build
    
    cd ..
    success "Frontend built"
}

# Deploy frontend to VPS (static hosting with Nginx)
deploy_frontend() {
    log "Deploying frontend to VPS..."
    
    # Create deployment package
    tar -czf frontend.tar.gz -C client dist
    
    # Upload and extract
    scp frontend.tar.gz root@$VPS_HOST:/tmp/
    ssh root@$VPS_HOST "
        mkdir -p /var/www/$APP_NAME
        tar -xzf /tmp/frontend.tar.gz -C /var/www/$APP_NAME
        rm /tmp/frontend.tar.gz
        chown -R www-data:www-data /var/www/$APP_NAME
    "
    
    rm frontend.tar.gz
    success "Frontend deployed"
}

# Build backend
build_backend() {
    log "Building backend..."
    cd server
    
    rm -rf node_modules dist
    npm ci
    npm run build
    
    cd ..
    success "Backend built"
}

# Deploy backend to VPS
deploy_backend() {
    log "Deploying backend to VPS..."
    
    # Create deployment package
    tar -czf backend.tar.gz -C server dist package.json
    
    # Upload and setup
    scp backend.tar.gz root@$VPS_HOST:/tmp/
    ssh root@$VPS_HOST "
        mkdir -p /opt/$APP_NAME
        tar -xzf /tmp/backend.tar.gz -C /opt/$APP_NAME
        cd /opt/$APP_NAME
        npm ci --production
        
        # Setup PM2
        if ! pm2 list | grep -q '$APP_NAME-api'; then
            pm2 start dist/index.js --name '$APP_NAME-api' --env production
            pm2 save
            pm2 startup
        else
            pm2 reload '$APP_NAME-api'
        fi
        
        rm /tmp/backend.tar.gz
    "
    
    rm backend.tar.gz
    success "Backend deployed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    cd client
    npm run test:unit -- --run || { error "Client unit tests failed"; exit 1; }
    cd ..
    
    cd server
    npm test || { error "Server tests failed"; exit 1; }
    cd ..
    
    success "All tests passed"
}

# Health check
health_check() {
    log "Running health checks..."
    
    sleep 2
    
    # Check frontend
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN || echo "000")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        success "Frontend accessible (HTTP $FRONTEND_STATUS)"
    else
        warn "Frontend returned HTTP $FRONTEND_STATUS"
    fi
    
    # Check API
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.$DOMAIN/health || echo "000")
    if [ "$API_STATUS" = "200" ]; then
        success "API accessible (HTTP $API_STATUS)"
    else
        warn "API returned HTTP $API_STATUS"
    fi
}

# Main
case "$ENV" in
    frontend)
        check_prereqs
        build_frontend
        deploy_frontend
        ;;
    backend)
        check_prereqs
        build_backend
        deploy_backend
        ;;
    test)
        run_tests
        ;;
    all|*)
        check_prereqs
        run_tests
        build_frontend
        deploy_frontend
        build_backend
        deploy_backend
        health_check
        echo ""
        success "🎉 MyCareCoach deployed successfully!"
        echo ""
        echo "URLs:"
        echo "  Frontend: https://$DOMAIN"
        echo "  API:      https://api.$DOMAIN"
        ;;
esac
