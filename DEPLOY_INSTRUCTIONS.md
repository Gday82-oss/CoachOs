# 🚀 Déploiement MyCareCoach sur VPS

## Étape 1 : Transfert des fichiers (depuis ton local)

```bash
cd /home/gday/MyCareCoach
scp frontend-deploy.tar.gz backend-deploy.tar.gz root@76.13.61.89:/tmp/
scp nginx.conf root@76.13.61.89:/etc/nginx/sites-available/mycarecoach
```

## Étape 2 : Déploiement sur le VPS

```bash
# Se connecter
ssh root@76.13.61.89

# Sur le VPS, exécuter :
mkdir -p /var/www/mycarecoach /opt/mycarecoach

# Frontend
tar -xzf /tmp/frontend-deploy.tar.gz -C /var/www/mycarecoach
chown -R www-data:www-data /var/www/mycarecoach

# Backend
tar -xzf /tmp/backend-deploy.tar.gz -C /opt/mycarecoach
cd /opt/mycarecoach && npm ci --production

# Config backend
cat > /opt/mycarecoach/.env << 'ENVFILE'
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://uztndpibiwgzcovrfrtk.supabase.co
JWT_SECRET=change-this-secret-key-$(date +%s)
ALLOWED_ORIGINS=https://mycarecoach.app
ENVFILE

# Démarrer avec PM2
cd /opt/mycarecoach
pm2 start dist/index.js --name "mycarecoach-api" || pm2 reload mycarecoach-api
pm2 save

# Nginx
ln -sf /etc/nginx/sites-available/mycarecoach /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Vérification
curl -s http://localhost:3000/health
echo ""
echo "✅ Déploiement terminé !"
```

## Vérification

- Frontend : https://mycarecoach.app
- API Health : http://76.13.61.89:3000/health
