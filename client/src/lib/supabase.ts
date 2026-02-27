import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour MyCareCoach
export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  objectifs: string[];
  niveau: 'debutant' | 'intermediaire' | 'avance';
  contraintes?: string;
  date_naissance?: string;
  created_at: string;
  coach_id: string;
}

export interface Seance {
  id: string;
  client_id: string;
  date: string;
  heure: string;
  duree: number;
  type: 'renforcement' | 'cardio' | 'mobilite' | 'recuperation';
  notes?: string;
  fait: boolean;
  created_at: string;
}

export interface Programme {
  id: string;
  client_id: string;
  titre: string;
  contenu: string;
  date_creation: string;
  statut: 'brouillon' | 'actif' | 'termine';
}

export interface Coach {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  siret?: string;
  created_at: string;
}
