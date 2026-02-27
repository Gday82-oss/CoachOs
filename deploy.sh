#!/bin/bash

# MyCareCoach Deployment Script
# Usage: ./deploy.sh [environment]

ENV=${1:-production}
echo "🚀 Deploying MyCareCoach to $ENV..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

# Function to deploy frontend
deploy_frontend() {
    echo "📦 Building frontend..."
    cd client
    
    # Install dependencies
    pnpm install
    
    # Build
    pnpm build
    
    # Deploy to Vercel
    if [ "$ENV" = "production" ]; then
        echo "🚀 Deploying to Vercel (production)..."
        vercel --prod
    else
        echo "🚀 Deploying to Vercel (preview)..."
        vercel
    fi
    
    cd ..
    echo -e "${GREEN}✅ Frontend deployed${NC}"
}

# Function to deploy backend
deploy_backend() {
    echo "📦 Building backend..."
    cd server
    
    # Install dependencies
    pnpm install
    
    # Build
    pnpm build
    
    # Deploy to VPS
    echo "🚀 Deploying to VPS..."
    rsync -avz --exclude='node_modules' --exclude='.env' \
        ./ root@$VPS_HOST:/root/mycarecoach/server/
    
    # Restart PM2
    ssh root@$VPS_HOST "cd /root/mycarecoach/server && pm2 restart mycarecoach-api || pm2 start dist/index.js --name mycarecoach-api"
    
    cd ..
    echo -e "${GREEN}✅ Backend deployed${NC}"
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Frontend tests
    cd client
    pnpm test
    cd ..
    
    # Backend tests
    cd server
    pnpm test
    cd ..
    
    echo -e "${GREEN}✅ Tests passed${NC}"
}

# Function to setup environment
setup_env() {
    echo "⚙️ Setting up environment..."
    
    # Check required env vars
    if [ -z "$VPS_HOST" ]; then
        echo -e "${RED}❌ Error: VPS_HOST not set${NC}"
        exit 1
    fi
    
    # Create .env files if they don't exist
    if [ ! -f "client/.env" ]; then
        echo "VITE_API_URL=http://$VPS_HOST:3000" > client/.env
        echo "⚠️ Created client/.env - please review"
    fi
    
    if [ ! -f "server/.env" ]; then
        echo "PORT=3000" > server/.env
        echo "DATABASE_URL=" >> server/.env
        echo "JWT_SECRET=$(openssl rand -base64 32)" >> server/.env
        echo "⚠️ Created server/.env - please review and add database URL"
    fi
    
    echo -e "${GREEN}✅ Environment setup complete${NC}"
}

# Main deployment flow
case "${2:-all}" in
    frontend)
        setup_env
        deploy_frontend
        ;;
    backend)
        setup_env
        deploy_backend
        ;;
    test)
        run_tests
        ;;
    setup)
        setup_env
        ;;
    *)
        setup_env
        run_tests
        deploy_frontend
        deploy_backend
        echo -e "${GREEN}🎉 MyCareCoach deployed successfully!${NC}"
        ;;
esac