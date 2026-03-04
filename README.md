# MyCareCoach

> **Le système d'exploitation des coachs sportifs**

[![CI/CD](https://github.com/Gday82-oss/MyCareCoach/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Gday82-oss/MyCareCoach/actions)
[![Live](https://img.shields.io/badge/live-mycarecoach.app-brightgreen)](https://mycarecoach.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Application en production : [https://mycarecoach.app](https://mycarecoach.app)**

---

## Vision

MyCareCoach est une application SaaS complète pour les coachs sportifs qui souhaitent professionnaliser leur activité. Gérez vos clients, planifiez vos séances, créez des programmes personnalisés et suivez vos paiements — tout en un seul endroit.

---

## Fonctionnalités

### Pour les Coachs
- **Dashboard** — Vue d'ensemble de votre activité
- **Gestion Clients** — Fiches clients complètes avec historique
- **Planification** — Calendrier des séances avec rappels
- **Programmes** — Création et suivi des programmes d'entraînement
- **Métriques** — Suivi des progrès de vos clients
- **Facturation** — Gestion des paiements (chèque, espèces, virement)
- **Attestations** — Génération de documents pour mutuelles

### Pour les Clients
- **Espace Client** — Accès à leurs données personnelles
- **Programmes** — Consultation de leurs programmes
- **Suivi** — Visualisation de leur progression
- **Séances** — Historique et prochaines séances

---

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript |
| Base de données | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT) |
| Tests | Playwright (E2E) |
| CI/CD | GitHub Actions |
| Hébergement | VPS Hostinger (Ubuntu 24.04) |
| Reverse proxy | Nginx + Let's Encrypt (SSL auto-renew) |
| Process manager | PM2 |

---

## Architecture

```
MyCareCoach/
├── client/              # Frontend React + Vite + Tailwind
├── server/              # Backend Node.js + Express
├── shared/              # Types TypeScript partagés
├── docs/                # Documentation complète
├── .github/workflows/   # Pipeline CI/CD GitHub Actions
├── nginx.conf           # Config Nginx de référence
└── supabase_schema.sql  # Schéma base de données
```

---

## Démarrage en développement

### Prérequis
- Node.js 20+
- npm
- Compte Supabase (gratuit)

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/Gday82-oss/MyCareCoach.git
cd MyCareCoach

# 2. Installer les dépendances
cd client && npm install
cd ../server && npm install

# 3. Configurer les variables d'environnement
cp client/.env.example client/.env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Initialiser la base de données Supabase
# Exécuter supabase_schema.sql dans l'éditeur SQL Supabase

# 5. Lancer en développement (depuis la racine)
npm run dev
```

Frontend : `http://localhost:5173`
API : `http://localhost:3000`

---

## Déploiement

### CI/CD automatique

Chaque push sur `main` déclenche automatiquement le pipeline GitHub Actions :

1. **Build** — TypeScript check + build frontend et backend
2. **Deploy** — Upload sur VPS via SSH + rechargement PM2
3. **Health check** — Vérification que `https://mycarecoach.app` répond 200

Les tests E2E Playwright s'exécutent sur chaque Pull Request.

### Secrets GitHub Actions requis

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | IP du serveur |
| `VPS_SSH_KEY` | Clé SSH privée (sans passphrase) |
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase |

### Infrastructure VPS

- **Frontend** servi par Nginx depuis `/var/www/mycarecoach/dist`
- **Backend** tournant via PM2 sur le port `3000`
- **Nginx** proxifie `/api/` → `localhost:3000`
- **SSL** Let's Encrypt avec renouvellement automatique

---

## Tests

```bash
# Type check
cd client && npx tsc --noEmit

# Tests E2E Playwright
cd client && npx playwright test

# Tests avec interface graphique
cd client && npx playwright test --ui
```

---

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/` | Statut de l'API |
| `GET /api/health` | Health check |

---

## Sécurité

- Authentification JWT via Supabase Auth
- Row Level Security (RLS) sur toutes les tables Supabase
- HTTPS forcé, redirection automatique HTTP → HTTPS
- Headers de sécurité Nginx (X-Frame-Options, X-Content-Type-Options…)
- Rate limiting sur l'API (100 req/15min global, 10 req/15min sur `/auth`)
- Validation des entrées avec Zod

---

## Roadmap

### V1.0 — Production (actuel)
- [x] Authentification complète
- [x] CRUD Clients
- [x] Gestion Séances
- [x] Programmes d'entraînement
- [x] Suivi métriques
- [x] Facturation
- [x] Tests E2E Playwright
- [x] CI/CD GitHub Actions → VPS
- [x] HTTPS Let's Encrypt

### V2.0 — Prochainement
- [ ] Notifications push et rappels email
- [ ] Export PDF (attestations, factures)
- [ ] Dashboard analytics avancé
- [ ] Application mobile (React Native)

### V3.0 — Futur
- [ ] Paiement en ligne (Stripe)
- [ ] IA génération de programmes
- [ ] Chat intégré coach-client
- [ ] API publique

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/project-structure.md) | Structure du projet |
| [Roadmap](docs/roadmap.md) | Feuille de route |
| [Supabase Setup](docs/supabase-setup.md) | Configuration base de données |
| [Déploiement](docs/deployment.md) | Guide déploiement VPS |
| [Authentification](docs/auth-setup.md) | Sécurité et auth |
| [Facturation](docs/billing.md) | Système de facturation |

---

## Licence

[MIT](LICENSE)

---

<p align="center">
  <strong>MyCareCoach</strong> — Votre santé en mouvement
</p>
