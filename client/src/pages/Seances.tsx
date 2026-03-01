import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Seance {
  id: string;
  date: string;
  heure: string;
  duree: number;
  type: string;
  notes: string;
  fait: boolean;
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

export default function Seances() {
  const [seances, setSeances] = useState<Seance[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const debutMois = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const finMois = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: seancesData } = await supabase
        .from('seances')
        .select('*, client:clients_coach(prenom, nom)')
        .eq('coach_id', user.id)
        .gte('date', debutMois)
        .lte('date', finMois)
        .order('date, heure');

      const { data: clientsData } = await supabase
        .from('clients_coach')
        .select('id, prenom, nom')
        .eq('coach_id', user.id);

      setSeances(seancesData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const premierJour = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const dernierJour = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const jourDebut = premierJour.getDay();

  const joursCalendrier = [];
  for (let i = 0; i < jourDebut; i++) joursCalendrier.push(null);
  for (let i = 1; i <= dernierJour.getDate(); i++) joursCalendrier.push(i);

  const getSeancesJour = (jour: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
    return seances.filter(s => s.date === dateStr);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agenda</h1>
          <p className="text-gray-600 mt-1">Planifiez vos séances</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/25">
          <Plus size={20} />
          Nouvelle séance
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft />
          </button>
          <h2 className="text-xl font-semibold">{mois[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {jours.map(j => <div key={j} className="text-center text-sm font-medium text-gray-500 py-2">{j}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {joursCalendrier.map((jour, idx) => {
            if (!jour) return <div key={idx} />;
            const seancesJour = getSeancesJour(jour);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), jour).toDateString();
            
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className={`min-h-[100px] p-2 rounded-lg border ${isToday ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'} cursor-pointer`}
                onClick={() => setShowAddModal(true)}
              >
                <span className={`text-sm font-medium ${isToday ? 'text-emerald-600' : 'text-gray-700'}`}>{jour}</span>
                <div className="mt-1 space-y-1">
                  {seancesJour.slice(0, 2).map(s => (
                    <div key={s.id} className={`text-xs p-1 rounded ${s.fait ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} truncate`}>
                      {s.heure.slice(0, 5)} - {s.client?.prenom}
                    </div>
                  ))}
                  {seancesJour.length > 2 && <div className="text-xs text-gray-500">+{seancesJour.length - 2}</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Nouvelle séance</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const { data: { user } } = await supabase.auth.getUser();
              
              await supabase.from('seances').insert([{
                coach_id: user?.id,
                client_id: formData.get('client_id'),
                date: formData.get('date'),
                heure: formData.get('heure'),
                duree: 60,
                type: formData.get('type'),
                notes: formData.get('notes')
              }]);
              
              setShowAddModal(false);
              fetchData();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Client</label>
                  <select name="client_id" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="">Choisir...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input name="date" type="date" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Heure</label>
                    <input name="heure" type="time" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select name="type" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="mixte">Mixte</option>
                    <option value="renforcement">Renforcement</option>
                    <option value="cardio">Cardio</option>
                    <option value="mobilite">Mobilité</option>
                    <option value="recuperation">Récupération</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea name="notes" rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"></textarea>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600">Créer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
