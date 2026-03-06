# MyCareCoach - Guide Agent

## Architecture

### Stack Technique
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + Framer Motion
- **Backend**: Supabase (auth, DB, real-time subscriptions)
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: Workbox pour Service Worker
- **Deployment**: VPS 76.13.61.89

### Structure des Routes
```
/app/*         → Coach (interface desktop complète)
/client/*      → Client (PWA mobile)
/auth          → Authentification commune
```

### Organisation des fichiers
```
client/src/
├── pages/
│   ├── client-mobile/     # PWA Client (4 pages)
│   │   ├── ClientApp.tsx           # Layout + navigation bottom
│   │   ├── ClientToday.tsx         # Dashboard "Aujourd'hui"
│   │   ├── ClientSeancesMobile.tsx # Liste des séances
│   │   ├── ClientProgrammeMobile.tsx # Programme avec exercices
│   │   └── ClientProgresMobile.tsx   # Graphiques + badges
│   └── (Coach pages...)
├── hooks/
│   └── useClientData.ts   # Hook pour données client
├── lib/
│   └── supabase.ts        # Client Supabase
└── types/
    └── index.ts           # Types TypeScript
```

## Design System

### Dual Branding

| Élément | Coach | Client |
|---------|-------|--------|
| **Identité** | Professionnel, sérieux | Énergique, motivant |
| **Couleur primaire** | `#5B7CF5` (bleu) | `#FF8C42` (orange) |
| **Couleur secondaire** | `#22D3B2` (vert menthe) | `#00C896` (vert émeraude) |
| **Accent** | `#1A2B4A` (navy) | `#FFB347` (orange clair) |
| **Fond** | `#F5F7FA` (gris bleu) | `#F0FAF7` (vert très clair) |
| **Cards** | `border-radius: 24px`, blanc | `border-radius: 24px`, blanc |
| **Boutons** | Pill shape, dégradés | Pill shape, pleins ou contours |

### Palettes détaillées

#### Client (Orange/Vert)
```
Primary Orange:  #FF8C42  → Boutons CTAs, badges actifs, checkboxes
Secondary Green: #00C896  → Succès, progrès, stats positives
Light Orange:    #FFB347  → Headers dégradés, accents
Dark Navy:       #1A2B4A  → Texte principal
Gray Text:       #6B7A8D  → Texte secondaire
Background:      #F0FAF7  → Fond global (vert très pâle)
Card Background: #FFFFFF  → Cards avec ombre douce
```

### Patterns UI Communs

#### Animation
```tsx
// Stagger container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Item animations
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 25 }
  }
};

// Tap feedback
<motion.div whileTap={{ scale: 0.97 }} />
```

#### Cards
```tsx
// Card standard
<div 
  className="rounded-3xl p-5"
  style={{
    backgroundColor: 'white',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
  }}
>
```

#### Boutons
```tsx
// Bouton primaire (orange)
<button 
  className="px-6 py-3 rounded-full font-semibold text-white"
  style={{ backgroundColor: '#FF8C42' }}
>

// Bouton secondaire (contour)
<button 
  className="px-6 py-3 rounded-full font-semibold"
  style={{ 
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    color: '#FF8C42'
  }}
>

// Bouton avec dégradé
<button 
  className="px-6 py-3 rounded-full font-semibold text-white"
  style={{ 
    background: 'linear-gradient(90deg, #00C896, #00E5FF)',
    boxShadow: '0 4px 15px rgba(0, 200, 150, 0.3)'
  }}
>
```

#### Headers dégradés
```tsx
// Header vert (Aujourd'hui, Séances)
<div style={{ 
  background: 'linear-gradient(135deg, #00C896 0%, #00E5FF 100%)' 
}}>

// Header orange (Programme)
<div style={{ 
  background: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)' 
}}>
```

## Hooks & Data

### useClientData
Hook pour récupérer les données du client connecté :
- `client` : infos profil
- `programme` : programme en cours
- `seances` : historique des séances
- `stats` : stats calculées
- `loading` : état de chargement

## Build & Deploy

### Développement
```bash
cd client && npm run dev      # Client only
cd server && npm run dev      # Server only
```

### Production
```bash
./deploy-prod.sh              # Déploiement complet
# Ou manuellement:
npm run build
rsync -avz client/dist/ root@76.13.61.89:/var/www/client/
```

## Bonnes pratiques

1. **Toujours utiliser les couleurs du design system** via les variables du fichier, pas de hardcoding aléatoire
2. **Animations cohérentes** : spring physics avec stiffness 350, damping 25
3. **Responsive mobile-first** pour la partie client
4. **Types TypeScript stricts** - pas de `any`
5. **Accessibilité** : contrastes suffisants, états focus visibles

## Fichiers clés à ne pas modifier sans raison

- `client/src/lib/supabase.ts` - Configuration Supabase
- `client/src/types/index.ts` - Types globaux
- `client/public/manifest.json` - Configuration PWA
- `client/vite.config.ts` - Configuration build
