import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Plus,
  Activity,
  Clock,
  Heart
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  totalClients: number;
  seancesAujourdhui: number;
  seancesCetteSemaine: number;
  nouveauxClientsMois: number;
}

interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  created_at: string;
}

interface Seance {
  id: string;
  date: string;
  heure: string;
  client_id: string;
  type: string;
  fait: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    seancesAujourdhui: 0,
    seancesCetteSemaine: 0,
    nouveauxClientsMois: 0
  });
  const [clientsRecents, setClientsRecents] = useState<Client[]>([]);
  const [seancesAujourdhui, setSeancesAujourdhui] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Stats clients
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id);

      // Clients récents
      const { data: recentClients } = await supabase
        .from('clients')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Séances du jour
      const aujourdhui = new Date().toISOString().split('T')[0];
      const { data: seances } = await supabase
        .from('seances')
        .select('*')
        .eq('coach_id', user.id)
        .eq('date', aujourdhui)
        .order('heure', { ascending: true });

      // Séances cette semaine
      const debutSemaine = new Date();
      debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay());
      const finSemaine = new Date(debutSemaine);
      finSemaine.setDate(finSemaine.getDate() + 6);

      const { count: seancesSemaine } = await supabase
        .from('seances')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .gte('date', debutSemaine.toISOString().split('T')[0])
        .lte('date', finSemaine.toISOString().split('T')[0]);

      // Nouveaux clients ce mois
      const debutMois = new Date();
      debutMois.setDate(1);
      const { count: nouveauxClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .gte('created_at', debutMois.toISOString());

      setStats({
        totalClients: totalClients || 0,
        seancesAujourdhui: seances?.length || 0,
        seancesCetteSemaine: seancesSemaine || 0,
        nouveauxClientsMois: nouveauxClients || 0
      });

      setClientsRecents(recentClients || []);
      setSeancesAujourdhui(seances || []);
    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Votre santé en mouvement</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total clients</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalClients}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="text-emerald-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Séances aujourd'hui</p>
              <p className="text-3xl font-bold text-gray-800">{stats.seancesAujourdhui}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cette semaine</p>
              <p className="text-3xl font-bold text-gray-800">{stats.seancesCetteSemaine}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="text-purple-600" size={24} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Nouveaux ce mois</p>
              <p className="text-3xl font-bold text-gray-800">{stats.nouveauxClientsMois}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Séances du jour */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={20} className="text-emerald-500" />
              Séances d'aujourd'hui
            </h2>
            <button 
              onClick={() => navigate('/seances')}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              Voir tout
            </button>
          </div>
          <div className="p-6">
            {seancesAujourdhui.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune séance aujourd'hui</p>
            ) : (
              <div className="space-y-3">
                {seancesAujourdhui.map((seance) => (
                  <div key={seance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${seance.fait ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="font-medium text-gray-800">{seance.heure.slice(0, 5)}</p>
                        <p className="text-sm text-gray-500 capitalize">{seance.type}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${seance.fait ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {seance.fait ? 'Fait' : 'À venir'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Clients récents */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Heart size={20} className="text-emerald-500" />
              Clients récents
            </h2>
            <button 
              onClick={() => navigate('/clients')}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              Voir tout
            </button>
          </div>
          <div className="p-6">
            {clientsRecents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Aucun client encore</p>
                <button 
                  onClick={() => navigate('/clients')}
                  className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Plus size={18} />
                  Ajouter un client
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clientsRecents.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate('/clients')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {client.prenom[0]}{client.nom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{client.prenom} {client.nom}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bouton ajout rapide */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex gap-4"
      >
        <button 
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
        >
          <Plus size={20} />
          Nouveau client
        </button>
        <button 
          onClick={() => navigate('/seances')}
          className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
        >
          <Calendar size={20} />
          Planifier séance
        </button>
      </motion.div>
    </div>
  );
}
