# Configuration MyCareCoach

## Variables d'environnement

Créer un fichier `.env` dans le dossier `client/` :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Setup Supabase

1. Créer un projet sur https://supabase.com
2. Récupérer l'URL et la clé anon
3. Créer les tables (voir SQL ci-dessous)

## Tables SQL

```sql
-- Table coaches
CREATE TABLE coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  siret TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table clients
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  objectifs TEXT[] DEFAULT '{}',
  niveau TEXT CHECK (niveau IN ('debutant', 'intermediaire', 'avance')),
  contraintes TEXT,
  date_naissance DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table seances
CREATE TABLE seances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure TIME NOT NULL,
  duree INTEGER DEFAULT 60,
  type TEXT CHECK (type IN ('renforcement', 'cardio', 'mobilite', 'recuperation')),
  notes TEXT,
  fait BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table programmes
CREATE TABLE programmes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  date_creation DATE DEFAULT CURRENT_DATE,
  statut TEXT CHECK (statut IN ('brouillon', 'actif', 'termine')) DEFAULT 'brouillon'
);

-- Enable RLS
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE seances ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
```
