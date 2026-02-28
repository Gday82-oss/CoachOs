import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Scale, Heart, Moon, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ClientMetriquesProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
  };
}

interface Metrique {
  id: string;
  date: string;
  poids: number;
  tension_sys: number;
  tension_dia: number;
  frequence_cardiaque: number;
  niveau_energie: number;
  qualite_sommeil: number;
  notes: string;
}

export default function ClientMetriques({ client }: ClientMetriquesProps) {
  const [metriques, setMetriques] = useState<Metrique[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetriques();
  }, [client.id]);

  async function fetchMetriques() {
    try {
      const { data } = await supabase
        .from('metriques')
        .select('*')
        .eq('client_id', client.id)
        .order('date', { ascending: true });

      setMetriques(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  const chartData = metriques.map(m => ({
    date: new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    poids: m.poids,
    energie: m.niveau_energie,
    sommeil: m.qualite_sommeil,
    fc: m.frequence_cardiaque
  }));

  const lastMetrique = metriques[metriques.length - 1];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mes métriques</h1>
        <p className="text-gray-600 mt-2">Suivi de votre progression santé</p>
      </div>

      {/* Dernières valeurs */}
      {lastMetrique && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Scale size={18} className="text-emerald-500" />
              <span className="text-sm text-gray-500">Poids</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{lastMetrique.poids || '-'} <span className="text-sm font-normal">kg</span></p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-red-500" />
              <span className="text-sm text-gray-500">FC</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{lastMetrique.frequence_cardiaque || '-'} <span className="text-sm font-normal">bpm</span></p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-amber-500" />
              <span className="text-sm text-gray-500">Énergie</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{lastMetrique.niveau_energie || '-'} <span className="text-sm font-normal">/10</span></p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Moon size={18} className="text-purple-500" />
              <span className="text-sm text-gray-500">Sommeil</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{lastMetrique.qualite_sommeil || '-'} <span className="text-sm font-normal">/10</span></p>
          </motion.div>
        </div>
      )}

      {/* Graphiques */}
      {metriques.length > 1 && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Scale size={20} className="text-emerald-500" />
              Évolution du poids
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="poids" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart size={20} className="text-red-500" />
              Énergie & Sommeil
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="energie" stroke="#f59e0b" strokeWidth={2} name="Énergie" />
                <Line type="monotone" dataKey="sommeil" stroke="#8b5cf6" strokeWidth={2} name="Sommeil" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {metriques.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune métrique</h3>
          <p className="text-gray-500">Votre coach n'a pas encore enregistré de métriques pour vous.</p>
        </div>
      )}
    </div>
  );
}
