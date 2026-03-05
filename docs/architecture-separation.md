# Architecture Séparée Coach / Client

## 🎯 Objectif
- **Coach** : Interface desktop riche, productivité, gestion complète
- **Client** : PWA mobile-first, engagement, simplicité

## 📁 Structure des fichiers

```
client/
├── src/
│   ├── main.tsx                    # Point d'entrée unique
│   ├── App.tsx                     # Router principal
│   │
│   ├── 📁 coach/                   # APP COACH (Desktop)
│   │   ├── CoachApp.tsx            # Layout principal coach
│   │   ├── routes.tsx              # Routes /app/*
│   │   ├── 📁 pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Clients/
│   │   │   ├── Seances/
│   │   │   ├── Programmes/
│   │   │   ├── IAProgramGenerator.tsx  # ⭐ NOUVEAU
│   │   │   └── Settings.tsx
│   │   └── 📁 components/
│   │       ├── Sidebar.tsx
│   │       ├── DataTable.tsx
│   │       ├── Calendar/
│   │       └── Charts/
│   │
│   ├── 📁 client/                  # APP CLIENT (Mobile PWA)
│   │   ├── ClientApp.tsx           # Layout mobile-first
│   │   ├── routes.tsx              # Routes /client/*
│   │   ├── 📁 pages/
│   │   │   ├── Dashboard.tsx       # Vue client simplifiée
│   │   │   ├── Seances.tsx         # Calendrier mobile
│   │   │   ├── ProgrammeActif.tsx  # Programme du jour
│   │   │   ├── ExerciceDetail.tsx  # Exercice avec timer
│   │   │   ├── Metriques.tsx       # Graphiques perso
│   │   │   └── Chat.tsx            # Messages avec coach
│   │   └── 📁 components/
│   │       ├── BottomNav.tsx       # Navigation mobile
│   │       ├── StreakCounter.tsx   # 🔥 Compteur jours consécutifs
│   │       ├── ProgressRing.tsx    # Cercle progression
│   │       ├── ExerciseCard.tsx    # Carte exercice swipeable
│   │       └── NotificationPrompt.tsx # Prompt PWA
│   │
│   ├── 📁 shared/                  # COMPOSANTS PARTAGÉS
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loading.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSupabase.ts
│   │   │   └── useNotifications.ts
│   │   └── utils/
│   │       ├── dates.ts
│   │       └── validation.ts
│   │
│   ├── 📁 lib/
│   │   ├── supabase.ts
│   │   ├── anthropic.ts            # ⭐ Client IA
│   │   └── pwa.ts                  # ⭐ Service worker registration
│   │
│   └── 📁 types/
│       ├── database.ts             # Types Supabase
│       ├── programme.ts            # Types programmes
│       └── ia.ts                   # Types réponses IA
│
├── index.html                      # Meta PWA
├── manifest.json                   # ⭐ Manifest PWA
├── sw.ts                           # ⭐ Service Worker
└── vite.config.ts                  # Config PWA plugin
```

## 🔀 Routing

```typescript
// App.tsx - Router principal
function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Register />} />
      
      {/* Coach - Desktop Optimized */}
      <Route path="/app/*" element={
        <RequireAuth role="coach">
          <CoachApp />
        </RequireAuth>
      } />
      
      {/* Client - Mobile-First PWA */}
      <Route path="/client/*" element={
        <RequireAuth role="client">
          <ClientApp />
        </RequireAuth>
      } />
    </Routes>
  );
}
```

## 📱 Spécificités PWA Client

### Manifest.json
```json
{
  "name": "MyCareCoach - Mon Suivi Sport",
  "short_name": "MyCoach",
  "start_url": "/client",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#00C896",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192" },
    { "src": "/icon-512.png", "sizes": "512x512" }
  ]
}
```

### Features PWA à implémenter

| Feature | Priorité | Description |
|---------|----------|-------------|
| **Offline Mode** | ⭐⭐⭐ | Consulter programme/séances sans connexion |
| **Push Notifications** | ⭐⭐⭐ | Rappels séances, nouveaux messages |
| **Background Sync** | ⭐⭐ | Synchroniser métriques/exercices faits |
| **Add to Home Screen** | ⭐⭐ | Installation comme vraie app |
| **Periodic Sync** | ⭐ | Mise à jour programme en arrière-plan |

## 🎨 Design System Différencié

### Coach (Desktop - "Pro Dashboard")
```
- Sidebar navigation fixe
- Tables de données denses
- Calendrier semaine/mois
- Graphiques analytics
- Modales édition complexes
- Multi-sélection / batch actions
```

### Client (Mobile - "Companion App")
```
- Bottom navigation (3-4 items max)
- Cards scrollables pleine largeur
- Swipe gestures
- Timer intégré exercices
- Camera pour photos progression
- Haptic feedback (vibrations)
- Pull-to-refresh
```
