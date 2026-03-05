import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utilitaire : s'assure que le profil coach existe (fix pour trigger qui peut échouer)
export async function ensureCoachProfile(user: any) {
  if (!user) return;
  
  const { data: existingCoach } = await supabase
    .from('coachs')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  
  if (!existingCoach) {
    const { error } = await supabase
      .from('coachs')
      .insert({
        id: user.id,
        email: user.email,
        nom: user.user_metadata?.nom || 'Coach',
        prenom: user.user_metadata?.prenom || 'Nouveau'
      });
    
    if (error) {
      console.error('Erreur création profil coach:', error);
    }
  }
}

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

export interface Facture {
  id: string;
  coach_id: string;
  client_id: string;
  numero: string;
  date_emission: string;
  date_echeance?: string;
  montant_ht: number;
  tva_percent: number;
  montant_ttc: number;
  description?: string;
  statut: 'brouillon' | 'envoyee' | 'payee' | 'retard' | 'annulee';
  mode_paiement?: 'cheque' | 'especes' | 'virement' | 'non_paye';
  date_paiement?: string;
  notes?: string;
  created_at: string;
  client?: {
    nom: string;
    prenom: string;
  };
}
