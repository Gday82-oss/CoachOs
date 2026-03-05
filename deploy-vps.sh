#!/bin/bash
# MyCareCoach - VPS Deployment Script
# À exécuter sur le VPS Hostinger

set -e

APP_NAME="mycarecoach"
DOMAIN="mycarecoach.app"

echo "🚀 Déploiement MyCareCoach sur VPS"
echo "=================================="

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }

# 1. Créer les répertoires
log "Création des répertoires..."
mkdir -p /var/www/$APP_NAME
mkdir -p /opt/$APP_NAME
mkdir -p /var/log/$APP_NAME

# 2. Déployer le frontend
log "Déploiement frontend..."
tar -xzf /tmp/frontend-deploy.tar.gz -C /var/www/$APP_NAME
chown -R www-data:www-data /var/www/$APP_NAME
cp /var/www/$APP_NAME/dist/index.html /var/www/$APP_NAME/dist/404.html 2>/dev/null || true
success "Frontend déployé dans /var/www/$APP_NAME"

# 3. Déployer le backend
log "Déploiement backend..."
tar -xzf /tmp/backend-deploy.tar.gz -C /opt/$APP_NAME
cd /opt/$APP_NAME
npm ci --production
success "Backend déployé dans /opt/$APP_NAME"

# 4. Créer le fichier .env pour le backend
log "Configuration backend..."
cat > /opt/$APP_NAME/.env << 'EOF'
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://uztndpibiwgzcovrfrtk.supabase.co
SUPABASE_SERVICE_KEY=votre-service-key-ici
JWT_SECRET=$(openssl rand -base64 32)
ALLOWED_ORIGINS=https://mycarecoach.app,https://www.mycarecoach.app
EOF

success "Backend configuré"

# 5. Démarrer avec PM2
log "Démarrage du service..."
if pm2 list | grep -q "$APP_NAME-api"; then
    pm2 reload $APP_NAME-api
else
    pm2 start /opt/$APP_NAME/dist/index.js --name "$APP_NAME-api" --env production
    pm2 save
fi

success "Service démarré avec PM2"

# 6. Redémarrer Nginx
log "Redémarrage Nginx..."
systemctl reload nginx || systemctl restart nginx
success "Nginx rechargé"

# 7. Health check
log "Vérification..."
sleep 2
curl -s http://localhost:3000/health && echo "" || echo "⚠️ API health check failed"

echo ""
success "🎉 Déploiement terminé !"
echo ""
echo "URLs:"
echo "  Frontend: https://$DOMAIN"
echo "  API:      https://$DOMAIN/api"
echo "  Health:   http://localhost:3000/health"
