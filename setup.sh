#!/bin/bash

# MyCareCoach - Setup Automatique Complet
# Usage: ./setup.sh

set -e

echo "🚀 MyCareCoach - Super Agent Setup"
echo "==================================="
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[SETUP]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# ============================================
# 1. CHECK PREREQUISITES
# ============================================
log "Vérification des prérequis..."

command -v node >/dev/null 2>&1 || { error "Node.js 20+ requis (https://nodejs.org)"; exit 1; }
command -v git >/dev/null 2>&1 || { error "Git requis"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js 20+ requis, vous avez $(node -v)"
    exit 1
fi

success "Prérequis OK (Node $(node -v))"

# ============================================
# 2. INSTALL DEPENDENCIES
# ============================================
log "Installation des dépendances..."

# Root
log "Installing root dependencies..."
npm install

# Client
log "Installing client dependencies..."
cd client
npm install

# Install Playwright
log "Installing Playwright..."
npx playwright install chromium

cd ..

# Server
log "Installing server dependencies..."
cd server
npm install

cd ..

success "Dépendances installées"

# ============================================
# 3. SETUP ENVIRONMENT FILES
# ============================================
log "Configuration des fichiers environnement..."

# Client env
if [ ! -f "client/.env" ]; then
    cat > client/.env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
VITE_API_URL=http://localhost:3000
EOF
    warn "client/.env créé - À CONFIGURER avec tes clés Supabase"
fi

# Server env
if [ ! -f "server/.env" ]; then
    cat > server/.env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=change-this-in-production-$(openssl rand -hex 32)
EOF
    warn "server/.env créé - À CONFIGURER avec tes clés Supabase"
fi

success "Fichiers environnement créés"

# ============================================
# 4. SETUP GIT HOOKS
# ============================================
log "Configuration des git hooks..."

mkdir -p .git/hooks

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook - Run tests before commit

echo "🧪 Running pre-commit checks..."

# Type check client
cd client
npm run tsc -- --noEmit || exit 1

# Type check server
cd ../server
npm run build || exit 1

echo "✅ Pre-commit checks passed"
EOF

chmod +x .git/hooks/pre-commit

success "Git hooks configurés"

# ============================================
# 5. SETUP DATABASE (Supabase)
# ============================================
log "Configuration base de données..."

echo ""
echo "📋 Pour configurer Supabase:"
echo "   1. Crée un projet sur https://supabase.com"
echo "   2. Va dans SQL Editor"
echo "   3. Copie-colle le contenu de supabase_schema.sql"
echo "   4. Exécute le script"
echo ""
echo "   URL Supabase: _____"
echo "   Clé Anon: _____"
echo ""

# ============================================
# 6. BUILD TEST
# ============================================
log "Test de build..."

cd client
npm run build >/dev/null 2>&1 || { error "Build client échoué"; exit 1; }
cd ..

cd server
npm run build >/dev/null 2>&1 || { error "Build server échoué"; exit 1; }
cd ..

success "Build test OK"

# ============================================
# 7. FINAL SUMMARY
# ============================================
echo ""
echo "==================================="
echo "🎉 SETUP TERMINÉ !"
echo "==================================="
echo ""
echo "Prochaines étapes:"
echo ""
echo "1. 🗄️  CONFIGURER SUPABASE"
echo "   - Crée un projet sur https://supabase.com"
echo "   - Exécute supabase_schema.sql dans SQL Editor"
echo "   - Copie l'URL et la clé anon dans client/.env"
echo ""
echo "2. 🚀 LANCER EN DÉVELOPPEMENT"
echo "   npm run dev          # Lance client + server"
echo ""
echo "3. 🧪 LANCER LES TESTS"
echo "   cd client && npx playwright test"
echo ""
echo "4. 📦 DÉPLOYER EN PRODUCTION"
echo "   ./deploy-prod.sh     # Déploiement complet"
echo ""
echo "Documentation:"
echo "   - AUTH_FIX_SUMMARY.md"
echo "   - FACTURATION_SUMMARY.md"
echo "   - FEUILLE_DE_ROUTE.md"
echo ""
success "MyCareCoach est prêt !"
