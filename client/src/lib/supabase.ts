import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for database tables
export type Client = {
  id: string;
  user_id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  date_naissance?: string;
  objectifs?: string[];
  notes?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
};

export type Programme = {
  id: string;
  user_id: string;
  nom: string;
  description?: string;
  duree_semaines?: number;
  seances_par_semaine?: number;
  created_at: string;
  updated_at: string;
};

export type Seance = {
  id: string;
  user_id: string;
  client_id: string;
  programme_id?: string;
  date: string;
  heure: string;
  duree_minutes: number;
  type?: string;
  statut: 'planifiee' | 'terminee' | 'annulee';
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type Paiement = {
  id: string;
  user_id: string;
  client_id: string;
  montant: number;
  date: string;
  type?: 'abonnement' | 'seance' | 'programme';
  statut: 'paye' | 'en_attente' | 'retard';
  description?: string;
  created_at: string;
};