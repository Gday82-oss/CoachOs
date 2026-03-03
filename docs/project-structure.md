# 🎯 MyCareCoach - Arborescence Projet

```
MyCareCoach/
│
├── 📁 client/                    # Frontend React + Vite
│   ├── 📁 src/
│   │   ├── 📁 pages/            # Pages principales
│   │   │   ├── Auth.tsx         # Authentification
│   │   │   ├── Dashboard.tsx    # Tableau de bord
│   │   │   ├── Clients.tsx      # Gestion clients
│   │   │   ├── Seances.tsx      # Planification séances
│   │   │   ├── Programmes.tsx   # Programmes d'entraînement
│   │   │   ├── Paiements.tsx    # Suivi paiements / factures
│   │   │   ├── Metriques.tsx    # Métriques et statistiques
│   │   │   ├── Attestations.tsx # Génération d'attestations
│   │   │   ├── EmailReminders.tsx # Rappels email
│   │   │   ├── ClientPortal.tsx # Espace client
│   │   │   ├── ForgotPassword.tsx # Mot de passe oublié
│   │   │   ├── ResetPassword.tsx  # Réinitialisation mdp
│   │   │   └── Settings.tsx     # Paramètres
│   │   │
│   │   ├── 📁 components/       # Composants réutilisables
│   │   ├── 📁 contexts/         # Contextes React (Theme)
│   │   │   └── ThemeContext.tsx
│   │   ├── 📁 lib/              # Utilitaires
│   │   │   └── supabase.ts      # Connexion Supabase
│   │   ├── App.tsx              # Routing et auth principale
│   │   ├── CoachApp.tsx         # Layout interface coach
│   │   └── main.tsx             # Point d'entrée
│   │
│   ├── 📁 e2e/                  # Tests E2E Playwright
│   ├── 📄 index.html
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   ├── 📄 playwright.config.ts
│   └── 📄 tsconfig.json
│
├── 📁 server/                    # Backend Node.js + Express
│   ├── 📁 src/
│   │   └── index.ts             # Serveur Express
│   └── 📄 package.json
│
├── 📁 shared/                    # Types partagés
│   └── types.ts
│
├── 📁 docs/                      # Documentation
│   ├── project-structure.md     # Ce fichier
│   ├── roadmap.md               # Feuille de route
│   ├── supabase-setup.md        # Configuration Supabase
│   ├── deployment.md            # Guide de déploiement
│   ├── workflows.md             # Workflows et CI/CD
│   ├── auth-setup.md            # Configuration authentification
│   ├── billing.md               # Système de facturation
│   ├── todo.md                  # Liste des tâches
│   ├── v1-release-notes.md      # Notes de version V1
│   └── saas-objectives.yml      # Objectifs SaaS
│
├── 📁 .github/
│   └── 📁 workflows/
│       └── ci-cd.yml            # Pipeline CI/CD
│
├── 📄 supabase_schema.sql        # Schéma base de données
├── 📄 nginx.conf                 # Configuration Nginx
├── 📄 vercel.json                # Config Vercel
├── 📄 setup.sh                   # Script de setup
├── 📄 deploy-prod.sh             # Script de déploiement
└── 📄 README.md
```

## 🌐 URLs du projet

| Environnement | URL |
|---------------|-----|
| Production | https://coach-os-khaki.vercel.app |
| Repo GitHub | https://github.com/Gday82-oss/MyCareCoach |
| Bot Telegram | @ObiCodeBot |
| Groupe Dev | https://t.me/+WAA4VYnx0w81YTBk |

## 👥 Équipe

| Rôle | Responsable |
|------|-------------|
| Product Owner | Guillaume (Gday) |
| Architecture | Kimi-Claw |
| DevOps/Monitoring | ObiCode-Bot |
