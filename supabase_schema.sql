-- ============================================ -- MyCareCoach - SQL Complet (corrigé)
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Supprimer les anciennes tables si elles existent (attention: perte de données!)
-- DROP TABLE IF EXISTS attestations CASCADE;
-- DROP TABLE IF EXISTS metriques CASCADE;
-- DROP TABLE IF EXISTS programmes CASCADE;
-- DROP TABLE IF EXISTS seances CASCADE;
-- DROP TABLE IF EXISTS clients_coach CASCADE;
-- DROP TABLE IF EXISTS coachs CASCADE;

-- ============================================ -- TABLE COACHS (profils des coachs)
-- ============================================ CREATE TABLE IF NOT EXISTS coachs (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  siret TEXT,
  adresse TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================ -- TABLE CLIENTS
-- ============================================ CREATE TABLE IF NOT EXISTS clients_coach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  date_naissance DATE,
  objectifs TEXT[] DEFAULT '{}',
  niveau TEXT CHECK (niveau IN ('debutant', 'intermediaire', 'avance')) DEFAULT 'debutant',
  contraintes TEXT,
  poids_initial NUMERIC(5,2),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================ -- TABLE SEANCES
-- ============================================ CREATE TABLE IF NOT EXISTS seances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients_coach(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure TIME NOT NULL,
  duree INTEGER DEFAULT 60,
  type TEXT CHECK (type IN ('renforcement', 'cardio', 'mobilite', 'recuperation', 'mixte')) DEFAULT 'mixte',
  notes TEXT,
  ressenti_client INTEGER CHECK (ressenti_client BETWEEN 1 AND 10),
  fait BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================ -- TABLE PROGRAMMES
-- ============================================ CREATE TABLE IF NOT EXISTS programmes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients_coach(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  duree_semaines INTEGER DEFAULT 4,
  date_debut DATE,
  date_fin DATE,
  statut TEXT CHECK (statut IN ('brouillon', 'actif', 'termine', 'archive')) DEFAULT 'brouillon',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================ -- TABLE METRIQUES (suivi progression)
-- ============================================ CREATE TABLE IF NOT EXISTS metriques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients_coach(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  poids NUMERIC(5,2),
  tension_sys INTEGER,
  tension_dia INTEGER,
  frequence_cardiaque INTEGER,
  tour_taille NUMERIC(5,2),
  distance_marche_6min INTEGER,
  temps_planche INTEGER,
  niveau_energie INTEGER CHECK (niveau_energie BETWEEN 1 AND 10),
  qualite_sommeil INTEGER CHECK (qualite_sommeil BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================ -- TABLE ATTESTATIONS (pour remboursements)
-- ============================================ CREATE TABLE IF NOT EXISTS attestations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients_coach(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  nombre_seances INTEGER NOT NULL,
  montant_total NUMERIC(10,2),
  date_emission DATE DEFAULT CURRENT_DATE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================ -- SECURITE : ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE coachs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_coach ENABLE ROW LEVEL SECURITY;
ALTER TABLE seances ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Coachs voient leur profil" ON coachs;
DROP POLICY IF EXISTS "Coachs voient leurs clients" ON clients_coach;
DROP POLICY IF EXISTS "Coachs voient leurs séances" ON seances;
DROP POLICY IF EXISTS "Coachs voient leurs programmes" ON programmes;
DROP POLICY IF EXISTS "Coachs voient leurs métriques" ON metriques;
DROP POLICY IF EXISTS "Coachs voient leurs attestations" ON attestations;

-- Créer les nouvelles politiques
CREATE POLICY "Coachs voient leur profil" ON coachs
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Coachs voient leurs clients" ON clients_coach
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Coachs voient leurs séances" ON seances
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Coachs voient leurs programmes" ON programmes
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Coachs voient leurs métriques" ON metriques
  FOR ALL USING (EXISTS (
    SELECT 1 FROM clients_coach WHERE clients_coach.id = metriques.client_id AND clients_coach.coach_id = auth.uid()
  ));

CREATE POLICY "Coachs voient leurs attestations" ON attestations
  FOR ALL USING (auth.uid() = coach_id);

-- ============================================ -- FONCTIONS TRIGGERS (mise à jour automatique)
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger sur clients_coach
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients_coach;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients_coach
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
