// Types partagés
export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  objectifs: string[];
  notes?: string;
  createdAt: string;
}

export interface Seance {
  id: string;
  clientId: string;
  date: string;
  duree: number; // minutes
  type: 'musculation' | 'cardio' | 'yoga' | 'autre';
  exercices: Exercice[];
  notes?: string;
  completed: boolean;
}

export interface Exercice {
  id: string;
  nom: string;
  series?: number;
  repetitions?: number;
  poids?: number;
  duree?: number; // minutes
  notes?: string;
}

export interface Programme {
  id: string;
  nom: string;
  description?: string;
  dureeSemaines: number;
  seancesParSemaine: number;
  exercices: Exercice[];
}