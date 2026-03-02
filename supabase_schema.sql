-- ============================================
-- MyCareCoach - SQL Complet (CORRIGÉ pour auth client)
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- ============================================
-- TABLE COACHS (profils des coachs)
-- ============================================
CREATE TABLE IF NOT EXISTS coachs (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  siret TEXT,
  adresse TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE CLIENTS (corrigé - utilisé partout dans le code)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
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

-- Vue pour compatibilité (certains codes utilisent clients_coach)
CREATE OR REPLACE VIEW clients_coach AS
SELECT * FROM clients;

-- ============================================
-- TABLE SEANCES
-- ============================================
CREATE TABLE IF NOT EXISTS seances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure TIME NOT NULL,
  duree INTEGER DEFAULT 60,
  type TEXT CHECK (type IN ('renforcement', 'cardio', 'mobilite', 'recuperation', 'mixte')) DEFAULT 'mixte',
  notes TEXT,
  ressenti_client INTEGER CHECK (ressenti_client BETWEEN 1 AND 10),
  fait BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE PROGRAMMES
-- ============================================
CREATE TABLE IF NOT EXISTS programmes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  duree_semaines INTEGER DEFAULT 4,
  date_debut DATE,
  date_fin DATE,
  statut TEXT CHECK (statut IN ('brouillon', 'actif', 'termine', 'archive')) DEFAULT 'brouillon',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE METRIQUES (suivi progression)
-- ============================================
CREATE TABLE IF NOT EXISTS metriques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
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

-- ============================================
-- TABLE ATTESTATIONS (pour remboursements)
-- ============================================
CREATE TABLE IF NOT EXISTS attestations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  nombre_seances INTEGER NOT NULL,
  montant_total NUMERIC(10,2),
  date_emission DATE DEFAULT CURRENT_DATE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE CONFIG COACH (pour emails)
-- ============================================
CREATE TABLE IF NOT EXISTS coach_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  rappel_24h BOOLEAN DEFAULT TRUE,
  rappel_1h BOOLEAN DEFAULT FALSE,
  confirmation_seance BOOLEAN DEFAULT TRUE,
  nouvelle_seance BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE LOGS EMAILS
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  seance_id UUID REFERENCES seances(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  statut TEXT DEFAULT 'en_attente',
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SECURITE : ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE coachs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE seances ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Coachs voient leur profil" ON coachs;
DROP POLICY IF EXISTS "Coachs gerent leur profil" ON coachs;
DROP POLICY IF EXISTS "Clients voient leur profil" ON clients;
DROP POLICY IF EXISTS "Coachs voient leurs clients" ON clients;
DROP POLICY IF EXISTS "Coachs gerent leurs clients" ON clients;
DROP POLICY IF EXISTS "Coachs voient leurs seances" ON seances;
DROP POLICY IF EXISTS "Coachs gerent leurs seances" ON seances;
DROP POLICY IF EXISTS "Clients voient leurs seances" ON seances;
DROP POLICY IF EXISTS "Coachs voient leurs programmes" ON programmes;
DROP POLICY IF EXISTS "Coachs gerent leurs programmes" ON programmes;
DROP POLICY IF EXISTS "Clients voient leurs programmes" ON programmes;
DROP POLICY IF EXISTS "Coachs voient leurs metriques" ON metriques;
DROP POLICY IF EXISTS "Coachs gerent leurs metriques" ON metriques;
DROP POLICY IF EXISTS "Clients voient leurs metriques" ON metriques;
DROP POLICY IF EXISTS "Coachs voient leurs attestations" ON attestations;
DROP POLICY IF EXISTS "Coachs gerent leurs attestations" ON attestations;
DROP POLICY IF EXISTS "Coachs voient leur config" ON coach_config;
DROP POLICY IF EXISTS "Coachs gerent leur config" ON coach_config;
DROP POLICY IF EXISTS "Coachs voient leurs logs" ON email_logs;

-- ============================================
-- POLITIQUES COACHS
-- ============================================

-- Coachs : gestion complète de leur profil
CREATE POLICY "Coachs gerent leur profil" ON coachs
  FOR ALL USING (auth.uid() = id);

-- Coachs : voir leurs clients
CREATE POLICY "Coachs gerent leurs clients" ON clients
  FOR ALL USING (auth.uid() = coach_id);

-- Coachs : gérer leurs séances
CREATE POLICY "Coachs gerent leurs seances" ON seances
  FOR ALL USING (auth.uid() = coach_id);

-- Coachs : gérer leurs programmes
CREATE POLICY "Coachs gerent leurs programmes" ON programmes
  FOR ALL USING (auth.uid() = coach_id);

-- Coachs : gérer leurs métriques
CREATE POLICY "Coachs gerent leurs metriques" ON metriques
  FOR ALL USING (auth.uid() = coach_id);

-- Coachs : gérer leurs attestations
CREATE POLICY "Coachs gerent leurs attestations" ON attestations
  FOR ALL USING (auth.uid() = coach_id);

-- Coachs : config
CREATE POLICY "Coachs gerent leur config" ON coach_config
  FOR ALL USING (auth.uid() = coach_id);

-- Coachs : logs
CREATE POLICY "Coachs voient leurs logs" ON email_logs
  FOR ALL USING (auth.uid() = coach_id);

-- ============================================
-- POLITIQUES CLIENTS (pour l'espace client)
-- ============================================

-- Clients : voir leur propre profil (par email)
CREATE POLICY "Clients voient leur profil" ON clients
  FOR SELECT USING (email = auth.jwt() ->> 'email');

-- Clients : voir leurs séances
CREATE POLICY "Clients voient leurs seances" ON seances
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Clients : voir leurs programmes
CREATE POLICY "Clients voient leurs programmes" ON programmes
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Clients : voir leurs métriques
CREATE POLICY "Clients voient leurs metriques" ON metriques
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE email = auth.jwt() ->> 'email'
    )
  );

-- ============================================
-- TABLE FACTURES (pour suivi paiements coach)
-- ============================================
CREATE TABLE IF NOT EXISTS factures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES coachs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  numero TEXT UNIQUE NOT NULL,
  date_emission DATE DEFAULT CURRENT_DATE,
  date_echeance DATE,
  montant_ht NUMERIC(10,2) NOT NULL,
  tva_percent NUMERIC(5,2) DEFAULT 20,
  montant_ttc NUMERIC(10,2) NOT NULL,
  description TEXT,
  statut TEXT CHECK (statut IN ('brouillon', 'envoyee', 'payee', 'retard', 'annulee')) DEFAULT 'brouillon',
  mode_paiement TEXT CHECK (mode_paiement IN ('cheque', 'especes', 'virement', 'non_paye')),
  date_paiement DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Politiques RLS pour factures
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coachs gerent leurs factures" ON factures;
CREATE POLICY "Coachs gerent leurs factures" ON factures
  FOR ALL USING (auth.uid() = coach_id);

-- Index pour factures
CREATE INDEX IF NOT EXISTS idx_factures_coach_id ON factures(coach_id);
CREATE INDEX IF NOT EXISTS idx_factures_client_id ON factures(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);

-- Table lignes de facture (détail)
CREATE TABLE IF NOT EXISTS facture_lignes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID REFERENCES factures(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantite INTEGER DEFAULT 1,
  prix_unitaire_ht NUMERIC(10,2) NOT NULL,
  total_ht NUMERIC(10,2) NOT NULL
);

ALTER TABLE facture_lignes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coachs gerent leurs lignes factures" ON facture_lignes;
CREATE POLICY "Coachs gerent leurs lignes factures" ON facture_lignes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM factures 
      WHERE factures.id = facture_lignes.facture_id 
      AND factures.coach_id = auth.uid()
    )
  );

-- ============================================
-- FONCTIONS TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger sur clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger sur factures
DROP TRIGGER IF EXISTS update_factures_updated_at ON factures;
CREATE TRIGGER update_factures_updated_at
  BEFORE UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer numéro de facture auto
CREATE OR REPLACE FUNCTION generate_facture_numero()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  count INT;
  new_numero TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Compter les factures de l'année pour ce coach
  SELECT COUNT(*) INTO count 
  FROM factures 
  WHERE coach_id = NEW.coach_id 
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Format: FACT-2026-0001
  new_numero := 'FACT-' || year || '-' || LPAD((count + 1)::TEXT, 4, '0');
  
  NEW.numero := new_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour numéro auto
DROP TRIGGER IF EXISTS trigger_generate_facture_numero ON factures;
CREATE TRIGGER trigger_generate_facture_numero
  BEFORE INSERT ON factures
  FOR EACH ROW
  EXECUTE FUNCTION generate_facture_numero();

-- ============================================
-- FONCTION : Créer automatiquement un profil coach
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'email n'existe pas déjà dans clients, créer un profil coach
  IF NOT EXISTS (SELECT 1 FROM clients WHERE email = NEW.email) THEN
    INSERT INTO public.coachs (id, email, nom, prenom)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'nom', 'Coach'),
      COALESCE(NEW.raw_user_meta_data->>'prenom', 'Nouveau')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEX pour performances
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_seances_coach_id ON seances(coach_id);
CREATE INDEX IF NOT EXISTS idx_seances_client_id ON seances(client_id);
CREATE INDEX IF NOT EXISTS idx_programmes_coach_id ON programmes(coach_id);
CREATE INDEX IF NOT EXISTS idx_programmes_client_id ON programmes(client_id);
CREATE INDEX IF NOT EXISTS idx_metriques_client_id ON metriques(client_id);_client_id ON programmes(client_id);
CREATE INDEX IF NOT EXISTS idx_metriques_client_id ON metriques(client_id);
