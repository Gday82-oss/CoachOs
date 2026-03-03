# 🏆 MyCareCoach

> **Le système d'exploitation des coachs sportifs**

[![CI/CD](https://github.com/Gday82-oss/MyCareCoach/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Gday82-oss/MyCareCoach/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Vision

MyCareCoach est une application SaaS complète pour les coachs sportifs qui souhaitent professionnaliser leur activité. Gérez vos clients, planifiez vos séances, créez des programmes personnalisés et suivez vos paiements - tout en un seul endroit.

## ✨ Fonctionnalités

### Pour les Coachs
- 📊 **Dashboard** - Vue d'ensemble de votre activité
- 👥 **Gestion Clients** - Fiches clients complètes avec historique
- 📅 **Planification** - Calendrier des séances avec rappels
- 💪 **Programmes** - Création et suivi des programmes d'entraînement
- 📈 **Métriques** - Suivi des progrès de vos clients
- 💰 **Facturation** - Gestion des paiements (chèque, espèces, virement)
- 🧾 **Attestations** - Génération de documents pour mutuelles

### Pour les Clients
- 📱 **Espace Client** - Accès à leurs données personnelles
- 📋 **Programmes** - Consultation de leurs programmes
- 📊 **Suivi** - Visualisation de leur progression
- 📅 **Séances** - Historique et prochaines séances

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+
- npm ou pnpm
- Compte Supabase (gratuit)

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/Gday82-oss/MyCareCoach.git
cd MyCareCoach

# 2. Lancer le setup automatique
./setup.sh

# 3. Configurer Supabase
# - Créer un projet sur https://supabase.com
# - Exécuter le script SQL : supabase_schema.sql
# - Copier les clés dans client/.env et server/.env

# 4. Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🏗️ Architecture

```
MyCareCoach/
├── 📁 client/          # Frontend React + Vite + Tailwind
├── 📁 server/          # Backend Node.js + Express
├── 📁 shared/          # Types TypeScript partagés
├── 📁 docs/            # Documentation complète
├── 📁 .github/         # Workflows CI/CD
├── 📄 supabase_schema.sql  # Schéma base de données
└── 📄 deploy-prod.sh   # Script déploiement production
```

### Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript |
| Base de données | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT) |
| Tests | Playwright (E2E), Vitest (Unit) |
| Déploiement | GitHub Actions, VPS Hostinger |

## 🧪 Tests

```bash
# Tests unitaires
cd client && npm run test:unit
cd server && npm test

# Tests E2E
cd client && npx playwright test

# Tests avec UI
cd client && npx playwright test --ui
```

## 📦 Déploiement

### Production (Hostinger VPS)

```bash
# Déploiement complet
./deploy-prod.sh

# Déploiement frontend uniquement
./deploy-prod.sh frontend

# Déploiement backend uniquement
./deploy-prod.sh backend
```

### Configuration VPS

1. **Installer les dépendances système**
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

2. **Configurer Nginx**
```bash
sudo cp nginx.conf /etc/nginx/sites-available/mycarecoach
sudo ln -s /etc/nginx/sites-available/mycarecoach /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. **SSL (Let's Encrypt)**
```bash
sudo certbot --nginx -d mycarecoach.app -d www.mycarecoach.app -d api.mycarecoach.app
```

4. **PM2 (process manager)**
```bash
npm install -g pm2
pm2 startup
```

## 🔒 Sécurité

- ✅ Authentification JWT sécurisée
- ✅ Row Level Security (RLS) sur toutes les tables
- ✅ HTTPS forcé en production
- ✅ Headers de sécurité configurés
- ✅ Validation des entrées (Zod)
- ✅ Protection CSRF

## 📊 Monitoring

- **Health Check** : `GET /health`
- **Logs** : PM2 logs
- **Métriques** : À configurer selon besoins

## 🛣️ Roadmap

### V1.0 (Actuel)
- [x] Authentification complète
- [x] CRUD Clients
- [x] Gestion Séances
- [x] Programmes d'entraînement
- [x] Suivi métriques
- [x] Facturation
- [x] Tests automatisés

### V2.0 (Prochainement)
- [ ] Application mobile (React Native)
- [ ] Notifications push
- [ ] Export PDF avancé
- [ ] Dashboard analytics
- [ ] API publique

### V3.0 (Futur)
- [ ] IA génération programmes
- [ ] Paiement en ligne (Stripe)
- [ ] Chat intégré coach-client
- [ ] Programme d'affiliation

## 📚 Documentation

La documentation complète est dans le dossier [`docs/`](docs/):

| Document | Description |
|----------|-------------|
| [Architecture](docs/project-structure.md) | Structure et arborescence du projet |
| [Roadmap](docs/roadmap.md) | Feuille de route et phases du projet |
| [Supabase Setup](docs/supabase-setup.md) | Configuration de la base de données |
| [Déploiement](docs/deployment.md) | Guide de déploiement VPS |
| [Workflows](docs/workflows.md) | CI/CD et scripts d'automatisation |
| [Authentification](docs/auth-setup.md) | Configuration et sécurité de l'auth |
| [Facturation](docs/billing.md) | Système de facturation |
| [Todo](docs/todo.md) | Checklist et tâches à réaliser |

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md)

## 📝 License

[MIT](LICENSE)

## 👥 Équipe

- **Product Owner** : Guillaume (Gday)
- **Architecture & Dev** : Kimi-Claw
- **DevOps** : ObiCode-Bot

---

<p align="center">
  <strong>MyCareCoach</strong> - Votre santé en mouvement 🐢
</p>
