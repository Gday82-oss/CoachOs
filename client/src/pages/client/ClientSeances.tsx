import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClientSeancesProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
  };
}

interface Seance {
  id: string;
  date: string;
  heure: string;
  duree: number;
  type: string;
  notes: string;
  fait: boolean;
  coach?: {
    prenom: string;
    nom: string;
  };
}

export default function ClientSeances({ client }: ClientSeancesProps) {
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeances();
  }, [client.id]);

  async function fetchSeances() {
    try {
      const { data } = await supabase
        .from('seances')
        .select('*, coach:coachs(prenom, nom)')
        .eq('client_id', client.id)
        .order('date', { ascending: false });

      setSeances(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  const seancesAFaire = seances.filter(s => !s.fait && new Date(s.date) >= new Date());
  const seancesPassees = seances.filter(s => s.fait || new Date(s.date) < new Date());

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mes séances</h1>
        <p className="text-gray-600 mt-2">Historique de vos séances sport-santé</p>
      </div>

      {/* À venir */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">À venir</h2>
        
        {seancesAFaire.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
            Aucune séance planifiée
          </div>
        ) : (
          <div className="space-y-4">
            {seancesAFaire.map((seance, idx) => (
              <motion.div
                key={seance.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-xs text-emerald-600 font-medium">
                      {new Date(seance.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-emerald-600">
                      {new Date(seance.date).getDate()}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{seance.type}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {seance.heure?.slice(0, 5)} ({seance.duree}min)
                      </span>
                      {seance.coach && (
                        <span>Avec: {seance.coach.prenom} {seance.coach.nom}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Historique */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Historique</h2>
        
        {seancesPassees.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
            Aucune séance passée
          </div>
        ) : (
          <div className="space-y-4">
            {seancesPassees.map((seance, idx) => (
              <motion.div
                key={seance.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-xl shadow-sm border p-6 ${
                  seance.fait 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                    seance.fait ? 'bg-green-200' : 'bg-gray-200'
                  }`}>
                    <span className={`text-xs font-medium ${seance.fait ? 'text-green-700' : 'text-gray-600'}`}>
                      {new Date(seance.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                    <span className={`text-xl font-bold ${seance.fait ? 'text-green-700' : 'text-gray-600'}`}>
                      {new Date(seance.date).getDate()}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{seance.type}</p>
                      {seance.fait && <Check size={16} className="text-green-600" />}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {seance.heure?.slice(0, 5)}
                      </span>
                      <span className={seance.fait ? 'text-green-600' : 'text-gray-500'}>
                        {seance.fait ? 'Réalisée' : 'Non réalisée'}
                      </span>
                    </div>
                    
                    {seance.notes && (
                      <p className="text-sm text-gray-600 mt-2">{seance.notes}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
