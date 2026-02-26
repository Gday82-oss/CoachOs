# Obi-Code - Agent Développeur Senior

## 🤖 Qui est Obi-Code ?

Obi-Code est un agent développeur senior spécialisé en :
- **Analyse de code** (React, TypeScript, Node.js)
- **Déploiement automatique** (Vercel, Supabase, VPS)
- **Qualité du code** (tests, linting, sécurité)

## 🚀 Installation

### 1. Bot Telegram

```bash
cd bot
cp .env.example .env
# Édite .env avec tes tokens
pnpm install
pnpm dev
```

### 2. Commandes OpenClaw

Les commandes sont automatiquement disponibles :
- `/obi review` - Analyser une PR
- `/obi deploy` - Déployer
- `/obi status` - Voir les checks
- `/obi issues` - Lister les issues
- `/obi create [titre]` - Créer une issue

## 🔧 Configuration

### Tokens nécessaires

1. **Telegram Bot Token** : @BotFather → /newbot
2. **GitHub Token** : Settings → Developer settings → Personal access tokens
3. **Vercel Token** (optionnel) : Vercel Dashboard → Settings → Tokens

### Variables d'environnement

```env
TELEGRAM_BOT_TOKEN=xxx
GITHUB_TOKEN=xxx
GITHUB_REPO=Gday82-oss/CoachOs
VERCEL_TOKEN=xxx
```

## 📚 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `/obi review` | Liste les PRs ouvertes |
| `/obi review 42` | Analyse la PR #42 |
| `/obi deploy` | Déploie sur Vercel |
| `/obi status` | Voir les checks CI/CD |
| `/obi issues` | Lister les issues |
| `/obi create Titre` | Créer une issue |
| `/obi help` | Aide |

## 🎭 Personnalité

> "La Force est forte dans ce code"

Obi-Code communique comme un mentor Jedi :
- Pédagogue et patient
- Exigeant mais bienveillant
- Utilise des références Star Wars

## 🛠️ Développement

```bash
# Lancer en dev
pnpm dev

# Build
pnpm build

# Lancer en prod
pnpm start
```

## 📄 Licence

MIT - Créé pour CoachOS