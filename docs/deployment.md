# 🚀 GUIDE DÉPLOIEMENT MYCARECOACH - PAS À PAS

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

### ✅ Étape 1 : Informations nécessaires

Avant de commencer, assure-toi d'avoir :

```
□ IP de ton VPS Hostinger : ________________
□ Mot de passe root VPS : ________________
□ Accès GitHub (token) : ________________
□ Email pour SSL Let's Encrypt : ________________
```

### ✅ Étape 2 : Vérifier le code local

```bash
# Dans le dossier mycarecoach
cd /root/mycarecoach

# Vérifier que tout est commit
git status

# Si des modifications non commitées :
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### ✅ Étape 3 : Vérifier les builds

```bash
# Test build client
cd client && npm run build

# Test build server  
cd ../server && npm run build

# Si erreurs → CORRIGER AVANT DE CONTINUER
```

---

## 🔧 PHASE 2 : CONFIGURATION SUPABASE

### Étape 2.1 : Créer le projet

1. Aller sur https://supabase.com
2. Cliquer "New Project"
3. Remplir :
   - **Name** : MyCareCoach
   - **Database Password** : Générer un mot de passe fort
   - **Region** : Europe (Frankfurt) ou plus proche
4. Cliquer "Create new project"
5. Attendre ~2 minutes

### Étape 2.2 : Exécuter le schéma SQL

1. Dans le dashboard Supabase, aller dans **SQL Editor**
2. Cliquer **New query**
3. Copier-coller tout le contenu de `supabase_schema.sql`
4. Cliquer **Run**
5. Vérifier qu'il n'y a pas d'erreur (message vert)

### Étape 2.3 : Récupérer les clés

1. Aller dans **Project Settings** (icône engrenage)
2. Cliquer **API**
3. Copier ces valeurs :
   - **URL** : `https://xxxx.supabase.co`
   - **anon public** : `eyJhbG...`

### Étape 2.4 : Configurer Auth

1. Aller dans **Authentication** → **Providers**
2. Vérifier que **Email** est enabled
3. Dans **URL Configuration** :
   - Site URL : `https://mycarecoach.app`
   - Redirect URLs : `https://mycarecoach.app/auth/callback`

---

## 🖥️ PHASE 3 : CONFIGURATION VPS HOSTINGER

### Étape 3.1 : Connexion SSH

```bash
# Remplacer par ton IP VPS
ssh root@TON_IP_VPS

# Entrer le mot de passe quand demandé
```

### Étape 3.2 : Mise à jour système

```bash
# Mettre à jour les paquets
apt update && apt upgrade -y

# Installer les dépendances
apt install -y \
  nginx \
  certbot \
  python3-certbot-nginx \
  git \
  curl \
  build-essential

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Vérifier
node -v  # Doit afficher v20.x.x
npm -v
```

### Étape 3.3 : Installer PM2

```bash
npm install -g pm2

# Configurer PM2 pour démarrer au boot
pm2 startup
# Copier la commande affichée et l'exécuter
```

### Étape 3.4 : Cloner le repository

```bash
# Créer le dossier
mkdir -p /var/www
cd /var/www

# Cloner (remplace par ton repo)
git clone https://github.com/Gday82-oss/MyCareCoach.git

# Entrer dans le dossier
cd MyCareCoach
```

### Étape 3.5 : Configurer les variables d'environnement

```bash
# Client
cat > client/.env.production << 'EOF'
VITE_SUPABASE_URL=https://TON_PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=TA_CLE_ANON
VITE_API_URL=https://api.mycarecoach.app
EOF

# Server
cat > server/.env << 'EOF'
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://TON_PROJET.supabase.co
SUPABASE_SERVICE_KEY=TA_CLE_SERVICE
JWT_SECRET=$(openssl rand -base64 32)
EOF

# IMPORTANT : Remplacer les valeurs par les vraies !
```

---

## 🚀 PHASE 4 : DÉPLOIEMENT

### Étape 4.1 : Build et installation

```bash
# Dans /var/www/MyCareCoach

# 1. Installer les dépendances
cd client && npm ci
cd ../server && npm ci
cd ..

# 2. Build client
cd client && npm run build
cd ..

# 3. Build server
cd server && npm run build
cd ..
```

### Étape 4.2 : Configurer Nginx

```bash
# Copier la config Nginx
cp nginx.conf /etc/nginx/sites-available/mycarecoach

# Activer le site
ln -sf /etc/nginx/sites-available/mycarecoach /etc/nginx/sites-enabled/

# Supprimer le site par défaut
rm -f /etc/nginx/sites-enabled/default

# Tester la config
nginx -t

# Recharger Nginx
systemctl reload nginx
```

### Étape 4.3 : SSL (HTTPS)

```bash
# Obtenir les certificats SSL
certbot --nginx -d mycarecoach.app -d www.mycarecoach.app -d api.mycarecoach.app

# Suivre les instructions :
# - Entrer email
# - Accepter les conditions
# - Choisir : Redirect HTTP to HTTPS

# Vérifier le renouvellement automatique
certbot renew --dry-run
```

### Étape 4.4 : Démarrer l'application

```bash
# Copier le frontend
cp -r client/dist /var/www/mycarecoach/
chown -R www-data:www-data /var/www/mycarecoach

# Démarrer le backend avec PM2
cd /var/www/MyCareCoach/server
pm2 start dist/index.js --name "mycarecoach-api"

# Sauvegarder la config PM2
pm2 save

# Vérifier que ça tourne
pm2 status
pm2 logs mycarecoach-api
```

---

## 🧪 PHASE 5 : TESTS & VÉRIFICATION

### Étape 5.1 : Tests manuels

```bash
# Test 1 : Frontend accessible
curl -I https://mycarecoach.app
# Doit retourner HTTP 200

# Test 2 : API accessible
curl https://api.mycarecoach.app/health
# Doit retourner {"status":"ok"}

# Test 3 : SSL valide
curl -vI https://mycarecoach.app 2>&1 | grep "SSL certificate"
```

### Étape 5.2 : Tests fonctionnels

Ouvrir https://mycarecoach.app dans un navigateur et vérifier :

```
□ Page auth s'affiche
□ Création de compte coach fonctionne
□ Connexion fonctionne
□ Dashboard s'affiche
□ Création client fonctionne
□ Création séance fonctionne
□ Création facture fonctionne
```

### Étape 5.3 : Tests E2E (optionnel mais recommandé)

```bash
# Sur ta machine locale (pas le VPS)
cd /root/mycarecoach/client

# Installer Playwright
npx playwright install

# Lancer les tests
npx playwright test

# Voir le rapport
npx playwright show-report
```

---

## 🔧 DÉPANNAGE

### Problème : Nginx ne démarre pas
```bash
nginx -t  # Voir l'erreur
journalctl -xe  # Logs système
```

### Problème : API ne répond pas
```bash
pm2 logs mycarecoach-api  # Voir les logs
pm2 restart mycarecoach-api  # Redémarrer
```

### Problème : Erreur 502 Bad Gateway
```bash
# Vérifier que l'API tourne
pm2 status

# Vérifier le port
curl http://localhost:3000/health

# Vérifier Nginx
nginx -t
systemctl status nginx
```

### Problème : SSL pas valide
```bash
# Renouveler manuellement
certbot renew --force-renewal

# Vérifier la config
certbot certificates
```

---

## 🎉 VÉRIFICATION FINALE

Tout est OK si :

```
✅ https://mycarecoach.app accessible
✅ https://api.mycarecoach.app/health retourne OK
✅ SSL valide (cadenas vert)
✅ Création de compte fonctionne
✅ Connexion fonctionne
✅ Dashboard s'affiche
```

---

## 📞 SUPPORT

Si bloqué :
1. Vérifier les logs : `pm2 logs`, `nginx -t`
2. Vérifier les variables d'environnement
3. Vérifier que Supabase est accessible

---

**GOOD LUCK ! 🚀**
