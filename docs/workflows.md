# MyCareCoach Workflows

## 🚀 Workflows automatisés

### 1. CI/CD GitHub Actions

Déclenchement automatique sur push vers `main`:
- ✅ Tests
- ✅ Build frontend & backend
- ✅ Déploiement Vercel (frontend)
- ✅ Déploiement VPS (backend)

### 2. Scripts de déploiement

```bash
# Déploiement complet
./deploy.sh production

# Déploiement frontend uniquement
./deploy.sh production frontend

# Déploiement backend uniquement
./deploy.sh production backend

# Tests
./deploy.sh production test

# Setup environnement
./deploy.sh production setup
```

### 3. Commandes pnpm

```bash
# Démarrer le développement (client + server)
pnpm dev

# Build
pnpm build

# Tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

## 🔧 Configuration requise

### Secrets GitHub (Settings > Secrets)

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Token Vercel CLI |
| `VERCEL_ORG_ID` | ID Organisation Vercel |
| `VERCEL_PROJECT_ID` | ID Projet Vercel |
| `VPS_HOST` | IP du VPS (76.13.61.89) |
| `VPS_USER` | root |
| `VPS_SSH_KEY` | Clé SSH privée |

### Variables d'environnement locales

**client/.env:**
```
VITE_API_URL=http://76.13.61.89:3000
```

**server/.env:**
```
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
SUPABASE_URL=...
SUPABASE_KEY=...
```

## 📋 Checklist déploiement

- [ ] Tests passent en local
- [ ] Variables d'environnement configurées
- [ ] Secrets GitHub ajoutés
- [ ] VPS accessible en SSH
- [ ] PM2 installé sur VPS
- [ ] Base de données créée

## 🔄 Workflow de développement

1. **Feature branch**: `git checkout -b feature/ma-feature`
2. **Développement**: `pnpm dev`
3. **Tests**: `pnpm test`
4. **Commit**: `git commit -m "feat: ma feature"`
5. **Push**: `git push origin feature/ma-feature`
6. **PR**: Créer pull request vers `main`
7. **Merge**: Après review, merge sur `main`
8. **Déploiement auto**: GitHub Actions déploie automatiquement