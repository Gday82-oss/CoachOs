import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SeanceClient {
  id: string;
  date: string;
  heure: string;
  duree?: number;
  type: string;
  notes?: string;
  fait: boolean;
  lieu?: string;
  coach?: { prenom: string; nom: string };
}

export interface ExerciceClient {
  id: string;
  nom: string;
  series?: number;
  repetitions?: number;
  poids_kg?: number;
  repos?: number;
  categorie?: string;
  ordre?: number;
}

export interface ProgrammeClient {
  id: string;
  nom: string;
  description?: string;
  duree_semaines?: number;
  statut?: string;
  exercices: ExerciceClient[];
  created_at: string;
}

export interface MetriqueClient {
  id: string;
  date: string;
  poids?: number;
  tension_sys?: number;
  tension_dia?: number;
  frequence_cardiaque?: number;
  niveau_energie?: number;
  qualite_sommeil?: number;
}

interface UseClientDataReturn {
  seances: SeanceClient[];
  programme: ProgrammeClient | null;
  metriques: MetriqueClient[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useClientData(clientId: string): UseClientDataReturn {
  const [seances, setSeances] = useState<SeanceClient[]>([]);
  const [programme, setProgramme] = useState<ProgrammeClient | null>(null);
  const [metriques, setMetriques] = useState<MetriqueClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchSeances(),
        fetchProgramme(),
        fetchMetriques(),
      ]);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function fetchSeances() {
    const { data, error } = await supabase
      .from('seances')
      .select('*, coach:coachs(prenom, nom)')
      .eq('client_id', clientId)
      .order('date', { ascending: false });
    if (!error) setSeances(data || []);
  }

  async function fetchProgramme() {
    // Récupère le programme actif le plus récent pour ce client
    const { data, error } = await supabase
      .from('programmes')
      .select('*, exercices(*)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setProgramme({
        ...data,
        exercices: (data.exercices || []).sort(
          (a: ExerciceClient, b: ExerciceClient) => (a.ordre ?? 0) - (b.ordre ?? 0)
        ),
      });
    }
  }

  async function fetchMetriques() {
    const { data, error } = await supabase
      .from('metriques')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: true });
    if (!error) setMetriques(data || []);
  }

  return { seances, programme, metriques, loading, error, refetch: fetchAll };
}

// Helpers exportés pour les composants

/** Détermine le statut visuel d'une séance selon la date et fait */
export function getStatutSeance(seance: SeanceClient): 'a_venir' | 'faite' | 'passee' {
  const today = new Date().toISOString().split('T')[0];
  if (seance.fait) return 'faite';
  if (seance.date < today) return 'passee';
  return 'a_venir';
}

/** Calcule le nombre de jours de streak (séances consécutives) */
export function calcStreak(seances: SeanceClient[]): number {
  const faites = seances
    .filter(s => s.fait)
    .map(s => s.date)
    .sort((a, b) => b.localeCompare(a));

  if (faites.length === 0) return 0;

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const dateStr of faites) {
    const d = new Date(dateStr + 'T00:00:00');
    const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
    if (diff <= 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}
