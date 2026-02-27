-- MyCareCoach Database Schema
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
alter table if exists public.clients enable row level security;
alter table if exists public.seances enable row level security;
alter table if exists public.programmes enable row level security;
alter table if exists public.exercices enable row level security;
alter table if exists public.paiements enable row level security;

-- Table: clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    date_naissance DATE,
    objectifs TEXT[],
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: programmes
CREATE TABLE IF NOT EXISTS public.programmes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    duree_semaines INTEGER,
    seances_par_semaine INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: exercices
CREATE TABLE IF NOT EXISTS public.exercices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    programme_id UUID REFERENCES public.programmes(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    categorie TEXT,
    duree_minutes INTEGER,
    repetitions INTEGER,
    series INTEGER,
    poids_kg DECIMAL(5,2),
    ordre INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: seances
CREATE TABLE IF NOT EXISTS public.seances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    programme_id UUID REFERENCES public.programmes(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    heure TIME NOT NULL,
    duree_minutes INTEGER DEFAULT 60,
    type TEXT,
    statut TEXT DEFAULT 'planifiee' CHECK (statut IN ('planifiee', 'terminee', 'annulee')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: paiements
CREATE TABLE IF NOT EXISTS public.paiements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    montant DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    type TEXT CHECK (type IN ('abonnement', 'seance', 'programme')),
    statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('paye', 'en_attente', 'retard')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies

-- Clients: users can only see their own clients
CREATE POLICY "Users can only access their own clients" ON public.clients
    FOR ALL USING (auth.uid() = user_id);

-- Programmes: users can only see their own programmes
CREATE POLICY "Users can only access their own programmes" ON public.programmes
    FOR ALL USING (auth.uid() = user_id);

-- Exercices: users can access exercices of their programmes
CREATE POLICY "Users can access exercices of their programmes" ON public.exercices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.programmes p 
            WHERE p.id = exercices.programme_id 
            AND p.user_id = auth.uid()
        )
    );

-- Seances: users can only see their own seances
CREATE POLICY "Users can only access their own seances" ON public.seances
    FOR ALL USING (auth.uid() = user_id);

-- Paiements: users can only see their own paiements
CREATE POLICY "Users can only access their own paiements" ON public.paiements
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programmes_updated_at BEFORE UPDATE ON public.programmes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seances_updated_at BEFORE UPDATE ON public.seances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();