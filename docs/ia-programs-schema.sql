-- ============================================
-- MyCareCoach - Extension IA Génération Programmes
-- ============================================

-- Table: Templates de programmes générés par IA
CREATE TABLE IF NOT EXISTS programme_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  objectif TEXT CHECK (objectif IN (
    'perte_poids', 'prise_masse', 'tonification', 
    'endurance', 'force', 'reathletisation', 'sante'
  )),
  niveau TEXT CHECK (niveau IN ('debutant', 'intermediaire', 'avance', 'expert')),
  duree_semaines INTEGER DEFAULT 4,
  frequence_semaine INTEGER DEFAULT 3,
  contenu JSONB NOT NULL, -- Structure complète du programme
  equipement TEXT[] DEFAULT '{}',
  contraintes TEXT[] DEFAULT '{}',
  est_genere_ia BOOLEAN DEFAULT TRUE,
  prompt_utilise TEXT, -- Pour debugging/amélioration
  model_ia TEXT DEFAULT 'claude-3-sonnet-20240229',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Exercices (bibliothèque normalisée)
CREATE TABLE IF NOT EXISTS exercices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  categorie TEXT CHECK (categorie IN (
    'cardio', 'renforcement', 'mobilite', 'plyometrie', 
    'core', 'etirement', 'echauffement'
  )),
  muscle_cible TEXT[] DEFAULT '{}',
  equipement TEXT[] DEFAULT '{}',
  difficulte TEXT CHECK (difficulte IN ('debutant', 'intermediaire', 'avance')),
  description TEXT,
  instructions TEXT[],
  video_url TEXT,
  image_url TEXT,
  duree_estimee INTEGER, -- en secondes
  created_by UUID REFERENCES coachs(id) ON DELETE SET NULL,
  est_public BOOLEAN DEFAULT FALSE, -- Partage entre coachs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Séances types (pour réutilisation)
CREATE TABLE IF NOT EXISTS seance_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type TEXT CHECK (type IN ('renforcement', 'cardio', 'mobilite', 'mixte')),
  duree_minutes INTEGER DEFAULT 60,
  exercices JSONB NOT NULL, -- [{exercice_id, series, reps, repos, notes}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Politiques RLS
ALTER TABLE programme_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercices ENABLE ROW LEVEL SECURITY;
ALTER TABLE seance_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coachs gerent leurs templates" ON programme_templates
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Tous voient exercices publics" ON exercices
  FOR SELECT USING (est_public = TRUE OR created_by = auth.uid());

CREATE POLICY "Coachs gerent leurs exercices" ON exercices
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Coachs gerent leurs seance_types" ON seance_types
  FOR ALL USING (auth.uid() = coach_id);

-- Index pour performances
CREATE INDEX idx_programme_templates_coach ON programme_templates(coach_id);
CREATE INDEX idx_programme_templates_objectif ON programme_templates(objectif);
CREATE INDEX idx_exercices_categorie ON exercices(categorie);
CREATE INDEX idx_exercices_muscle ON exercices USING GIN(muscle_cible);
