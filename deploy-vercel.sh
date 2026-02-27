#!/bin/bash

# Deploy MyCareCoach to Vercel
# Usage: ./deploy-vercel.sh

echo "🚀 Déploiement MyCareCoach sur Vercel..."

# Vérifier que vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI non installé. Installation..."
    npm install -g vercel
fi

# Aller dans le dossier client
cd client

# Build
echo "📦 Build en cours..."
pnpm install
pnpm build

# Deploy
echo "🚀 Déploiement..."
vercel --prod --yes

echo "✅ Déploiement terminé!"
echo "🌐 URL: https://coach-os-khaki.vercel.app"
