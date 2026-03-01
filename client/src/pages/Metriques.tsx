import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Scale, Heart, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  client_id: string;
  client?: {
    prenom: string;
    nom: string;
  };
}

interface Client {
  id: string;
  prenom: string;
  nom: string;
}

export default function Metriques() {
  const [metriques, setMetriques] = useState<Metrique[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedClient]);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clientsData } = await supabase
        .from('clients_coach')
        .select('id, prenom, nom')
        .eq('coach_id', user.id);

      setClients(clientsData || []);

      let query = supabase
        .from('metriques')
        .select('*, client:clients(prenom, nom)')
        .eq('coach_id', user.id)
        .order('date', { ascending: true });

      if (selectedClient) {
        query = query.eq('client_id', selectedClient);
      }

      const { data: metriquesData } = await query;
      setMetriques(metriquesData || []);
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
    sommeil: m.qualite_sommeil
  }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Métriques</h1>
          <p className="text-gray-600 mt-1">Suivi de la progression</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/25">
          <Plus size={20} />
          Ajouter des métriques
        </button>
      </div>

      {/* Filtre client */}
      <div className="mb-6">
        <select 
          value={selectedClient} 
          onChange={(e) => setSelectedClient(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Tous les clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
        </select>
      </div>

      {/* Graphiques */}
      {metriques.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Scale size={20} className="text-emerald-500" />
              Évolution du poids
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="poids" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart size={20} className="text-red-500" />
              Énergie & Sommeil
            </h3>
            <ResponsiveContainer width="100%" height={200}>
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

      {/* Liste des métriques */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Historique des mesures</h2>
        </div>
        
        {metriques.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune métrique enregistrée
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {metriques.slice().reverse().map((m) => (
              <div key={m.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Calendar size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium">{new Date(m.date).toLocaleDateString('fr-FR')}</p>
                      {m.client && <p className="text-sm text-gray-500">{m.client.prenom} {m.client.nom}</p>}
                    </div>
                  </div>
                  
                  <div className="flex gap-6 text-sm">
                    {m.poids && <span className="text-gray-600"><strong>{m.poids}kg</strong></span>}
                    {m.niveau_energie && <span className="text-amber-600">Énergie: {m.niveau_energie}/10</span>}
                    {m.qualite_sommeil && <span className="text-purple-600">Sommeil: {m.qualite_sommeil}/10</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Nouvelles métriques</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const { data: { user } } = await supabase.auth.getUser();
              
              await supabase.from('metriques').insert([{
                coach_id: user?.id,
                client_id: formData.get('client_id'),
                date: formData.get('date'),
                poids: parseFloat(formData.get('poids') as string) || null,
                tension_sys: parseInt(formData.get('tension_sys') as string) || null,
                tension_dia: parseInt(formData.get('tension_dia') as string) || null,
                frequence_cardiaque: parseInt(formData.get('fc') as string) || null,
                niveau_energie: parseInt(formData.get('energie') as string) || null,
                qualite_sommeil: parseInt(formData.get('sommeil') as string) || null,
                notes: formData.get('notes')
              }]);
              
              setShowAddModal(false);
              fetchData();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client *</label>
                  <select name="client_id" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="">Choisir...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Poids (kg)</label>
                    <input name="poids" type="number" step="0.1" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">FC (bpm)</label>
                    <input name="fc" type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tension (sys)</label>
                    <input name="tension_sys" type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tension (dia)</label>
                    <input name="tension_dia" type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Énergie (1-10)</label>
                    <input name="energie" type="number" min="1" max="10" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sommeil (1-10)</label>
                    <input name="sommeil" type="number" min="1" max="10" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea name="notes" rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"></textarea>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600">Enregistrer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
