import { useEffect, useState } from 'react';
import { supabase, ensureCoachProfile } from '../lib/supabase';
import { Plus, ChevronLeft, ChevronRight, LayoutList, CalendarDays, Clock, MapPin, CheckCircle2 } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await ensureCoachProfile(user);

      const debutMois = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const finMois = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: seancesData } = await supabase
        .from('seances')
        .select('*, client:clients(prenom, nom)')
        .eq('coach_id', user.id)
        .gte('date', debutMois)
        .lte('date', finMois)
        .order('date, heure');

      const { data: clientsData } = await supabase
        .from('clients')
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
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-[#E8EDF5]">Agenda</h1>
          <p className="text-gray-600 dark:text-[#A8B4C4] mt-1">Planifiez vos séances</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vue calendrier / liste */}
          <div className="flex bg-gray-100 dark:bg-[#243044] rounded-xl p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${viewMode === 'calendar' ? 'bg-white dark:bg-[#1A2535] shadow-sm text-emerald-600' : 'text-gray-500 dark:text-[#8896A8]'}`}
              title="Vue calendrier"
            >
              <CalendarDays size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${viewMode === 'list' ? 'bg-white dark:bg-[#1A2535] shadow-sm text-emerald-600' : 'text-gray-500 dark:text-[#8896A8]'}`}
              title="Vue liste"
            >
              <LayoutList size={18} />
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-500 text-white px-4 md:px-6 py-3 min-h-[44px] rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 text-sm md:text-base font-medium"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nouvelle séance</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>
      </div>

      {/* ── Navigation mois (commune aux 2 vues) ── */}
      <div className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm border border-gray-100 dark:border-[#2E3D55] p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#243044] rounded-lg"
          >
            <ChevronLeft className="dark:text-white" />
          </button>
          <h2 className="text-base md:text-xl font-semibold dark:text-white capitalize">
            {mois[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#243044] rounded-lg"
          >
            <ChevronRight className="dark:text-white" />
          </button>
        </div>

        {/* ── VUE CALENDRIER ── */}
        {viewMode === 'calendar' && (
          <>
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
              {jours.map(j => (
                <div key={j} className="text-center text-[10px] md:text-sm font-medium text-gray-500 dark:text-[#8896A8] py-1 md:py-2">
                  {j}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {joursCalendrier.map((jour, idx) => {
                if (!jour) return <div key={idx} />;
                const seancesJour = getSeancesJour(jour);
                const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), jour).toDateString();

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className={`min-h-[48px] md:min-h-[90px] p-0.5 md:p-2 rounded-lg border ${
                      isToday
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-100 dark:border-[#2E3D55] hover:border-emerald-200'
                    } cursor-pointer`}
                    onClick={() => setShowAddModal(true)}
                  >
                    <span className={`text-[11px] md:text-sm font-medium block text-center md:text-left ${isToday ? 'text-emerald-600' : 'text-gray-700 dark:text-[#D4DAE6]'}`}>
                      {jour}
                    </span>
                    <div className="mt-0.5 space-y-0.5 hidden md:block">
                      {seancesJour.slice(0, 2).map(s => (
                        <div key={s.id} className={`text-xs p-1 rounded ${s.fait ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} truncate`}>
                          {s.heure.slice(0, 5)} {s.client?.prenom}
                        </div>
                      ))}
                      {seancesJour.length > 2 && (
                        <div className="text-xs text-gray-400 dark:text-[#8896A8]">+{seancesJour.length - 2}</div>
                      )}
                    </div>
                    {/* Mobile: juste un point coloré si séance */}
                    {seancesJour.length > 0 && (
                      <div className="md:hidden flex justify-center mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* ── VUE LISTE ── */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {seances.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 dark:bg-[#0F1923] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-500 dark:text-[#8896A8] font-medium">Aucune séance ce mois</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium"
                >
                  <Plus size={16} /> Planifier une séance
                </button>
              </div>
            ) : (
              seances.map(s => {
                const dateObj = new Date(s.date + 'T00:00:00');
                const isToday = s.date === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={s.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border ${
                      isToday
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700'
                        : 'border-gray-100 dark:border-[#2E3D55] bg-gray-50 dark:bg-[#0F1923]'
                    }`}
                  >
                    {/* Date badge */}
                    <div className={`w-12 flex-shrink-0 rounded-xl flex flex-col items-center justify-center py-2 ${s.fait ? 'bg-green-100 dark:bg-green-900/30' : isToday ? 'bg-emerald-500' : 'bg-white dark:bg-[#243044]'}`}>
                      <span className={`text-[10px] font-semibold uppercase ${s.fait ? 'text-green-700' : isToday ? 'text-white' : 'text-gray-500 dark:text-[#8896A8]'}`}>
                        {dateObj.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                      <span className={`text-lg font-bold leading-none ${s.fait ? 'text-green-700' : isToday ? 'text-white' : 'text-gray-800 dark:text-[#E8EDF5]'}`}>
                        {dateObj.getDate()}
                      </span>
                    </div>
                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-800 dark:text-[#E8EDF5] text-sm leading-tight">
                          {s.client ? `${s.client.prenom} ${s.client.nom}` : 'Client inconnu'}
                        </p>
                        {s.fait
                          ? <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex-shrink-0">À venir</span>
                        }
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-[#8896A8]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-emerald-500" />{s.heure.slice(0, 5)}
                        </span>
                        <span className="capitalize">{s.type}</span>
                        {(s as any).lieu && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-emerald-500" />{(s as any).lieu}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex md:items-center md:justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1A2535] md:rounded-2xl w-full h-full md:h-auto md:max-w-md flex flex-col">
            <div className="p-6 md:p-8 border-b border-gray-100 dark:border-[#2E3D55] flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-[#E8EDF5]">Nouvelle séance</h2>
            </div>
            <form className="flex flex-col flex-1 min-h-0" onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const { data: { user } } = await supabase.auth.getUser();
              
              if (!user) {
                alert('Vous devez être connecté');
                return;
              }
              
              // S'assure que le profil coach existe
              await ensureCoachProfile(user);
              
              await supabase.from('seances').insert([{
                coach_id: user.id,
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
              <div className="overflow-y-auto flex-1 p-6 md:p-8">
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
              </div>

              <div className="border-t border-gray-100 dark:border-[#2E3D55] p-4 md:p-6 flex gap-3 flex-shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-gray-300 dark:border-[#2E3D55] rounded-xl hover:bg-gray-50 dark:bg-[#0F1923] text-gray-700 dark:text-[#D4DAE6]">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600">Créer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
