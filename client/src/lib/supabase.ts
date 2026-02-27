import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uztndpibiwgzcovrfrtk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6dG5kcGliaXdnemNvdnJmcnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzkyNTgsImV4cCI6MjA4NzYxNTI1OH0.n8MNkVsJ3CwvTvJJCpuobWtivxKKv8WbbvmkAsoX3-4';

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
