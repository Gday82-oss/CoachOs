import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, FileText, Activity, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClientDashboardProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
  };
}

interface Stats {
  totalSeances: number;
  seancesFaites: number;
  programmesActifs: number;
  derniereMetrique: string;
}

export default function ClientDashboard({ client }: ClientDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalSeances: 0,
    seancesFaites: 0,
    programmesActifs: 0,
    derniereMetrique: '-'
  });
  const [prochaineSeance, setProchaineSeance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [client.id]);

  async function fetchDashboardData() {
    try {
      // Stats séances
      const { data: seances } = await supabase
        .from('seances')
        .select('fait')
        .eq('client_id', client.id);

      const totalSeances = seances?.length || 0;
      const seancesFaites = seances?.filter(s => s.fait).length || 0;

      // Programmes actifs
      const { data: programmes } = await supabase
        .from('programmes')
        .select('id')
        .eq('client_id', client.id)
        .eq('statut', 'actif');

      // Dernière métrique
      const { data: metriques } = await supabase
        .from('metriques')
        .select('date')
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(1);

      // Prochaine séance
      const today = new Date().toISOString().split('T')[0];
      const { data: prochaine } = await supabase
        .from('seances')
        .select('*, coach:coachs(prenom, nom)')
        .eq('client_id', client.id)
        .gte('date', today)
        .order('date, heure')
        .limit(1)
        .single();

      setStats({
        totalSeances,
        seancesFaites,
        programmesActifs: programmes?.length || 0,
        derniereMetrique: metriques?.[0]?.date 
          ? new Date(metriques[0].date).toLocaleDateString('fr-FR')
          : '-'
      });

      setProchaineSeance(prochaine);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Bonjour {client.prenom} ! 👋</h1>
        <p className="text-gray-600 mt-2">Voici votre suivi sport-santé</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Séances réalisées</p>
              <p className="text-3xl font-bold text-gray-800">{stats.seancesFaites}/{stats.totalSeances}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Calendar className="text-emerald-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Programmes actifs</p>
              <p className="text-3xl font-bold text-gray-800">{stats.programmesActifs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Dernière métrique</p>
              <p className="text-3xl font-bold text-gray-800">{stats.derniereMetrique}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Activity className="text-purple-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Progression</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalSeances > 0 ? Math.round((stats.seancesFaites / stats.totalSeances) * 100) : 0}%</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <TrendingUp className="text-amber-600" size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Prochaine séance */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-8 text-white">
        <h2 className="text-xl font-semibold mb-4">Prochaine séance</h2>
        
        {prochaineSeance ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Clock size={32} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Date(prochaineSeance.date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
              <p className="text-emerald-100">
                {prochaineSeance.heure?.slice(0, 5)} - {prochaineSeance.type}
              </p>
              {prochaineSeance.coach && (
                <p className="text-sm text-emerald-100 mt-1">
                  Avec: {prochaineSeance.coach.prenom} {prochaineSeance.coach.nom}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-emerald-100">Aucune séance planifiée. Contactez votre coach pour planifier votre prochaine séance.</p>
        )}
      </div>
    </div>
  );
}
