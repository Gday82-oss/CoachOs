# 🎯 MyCareCoach - Arborescence Projet

```
/root/mycarecoach/
│
├── 📁 client/                    # Frontend React + Vite
│   ├── 📁 src/
│   │   ├── 📁 pages/            # Pages principales
│   │   │   ├── Dashboard.tsx    # Tableau de bord
│   │   │   ├── Clients.tsx      # Gestion clients
│   │   │   ├── Seances.tsx      # Planification séances
│   │   │   ├── Programmes.tsx   # Programmes d'entraînement
│   │   │   ├── Paiements.tsx    # Suivi paiements
│   │   │   └── Settings.tsx     # Paramètres
│   │   │
│   │   ├── 📁 components/       # Composants réutilisables
│   │   ├── 📁 contexts/         # Contextes React (Theme, Auth)
│   │   ├── 📁 lib/              # Utilitaires
│   │   │   └── supabase.ts      # Connexion Supabase
│   │   ├── 📁 hooks/            # Custom hooks
│   │   ├── 📁 types/            # Types TypeScript
│   │   ├── App.tsx              # App principale
│   │   └── main.tsx             # Point d'entrée
│   │
│   ├── 📄 index.html
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   ├── 📄 tailwind.config.js
│   └── 📄 tsconfig.json
│
├── 📁 server/                    # Backend Node.js + Express
│   ├── 📁 src/
│   │   ├── 📁 routes/           # API routes
│   │   ├── 📁 middleware/       # Middleware (auth, validation)
│   │   ├── 📁 services/         # Logique métier
│   │   └── index.ts             # Serveur Express
│   └── 📄 package.json
│
├── 📁 bot/                       # ObiCodeBot Telegram
│   ├── 📁 src/
│   │   ├── 📁 agents/           # Agents IA
│   │   │   └── obi-code.ts      # Logique ObiCode
│   │   ├── 📁 utils/            # Utilitaires
│   │   └── index.ts             # Bot Telegram
│   └── 📄 package.json
│
├── 📁 shared/                    # Types partagés
│   └── types.ts
│
├── 📁 .github/
│   └── 📁 workflows/
│       └── ci-cd.yml            # Pipeline CI/CD
│
├── 📄 vercel.json               # Config Vercel
├── 📄 MYCARECOACH_SAAS_OBJECTIVE.yml # Objectifs SaaS
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
