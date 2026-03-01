import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, FileText, Calendar, Clock, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Programme {
  id: string;
  titre: string;
  contenu: string;
  duree_semaines: number;
  date_debut: string;
  date_fin: string;
  statut: string;
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

export default function Programmes() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [selectedClient] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('programmes')
        .select('*, client:clients(prenom, nom)')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (selectedClient) {
        query = query.eq('client_id', selectedClient);
      }

      const { data: programmesData } = await query;
      const { data: clientsData } = await supabase.from('clients_coach').select('id, prenom, nom').eq('coach_id', user.id);

      setProgrammes(programmesData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-700';
      case 'brouillon': return 'bg-gray-100 text-gray-700';
      case 'termine': return 'bg-blue-100 text-blue-700';
      case 'archive': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Programmes</h1>
          <p className="text-gray-600 mt-1">{programmes.length} programme{programmes.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/25">
          <Plus size={20} />
          Nouveau programme
        </button>
      </div>

      {programmes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun programme</h3>
          <p className="text-gray-500 mb-6">Créez votre premier programme d'entraînement</p>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600">
            <Plus size={20} />
            Créer un programme
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programmes.map((prog, idx) => (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedProgramme(prog); setShowViewModal(true); }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{prog.titre}</h3>
                  {prog.client && (
                    <p className="text-sm text-gray-500">Pour: {prog.client.prenom} {prog.client.nom}</p>
                  )}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${getStatutColor(prog.statut)}`}>
                  {prog.statut}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{prog.duree_semaines} semaines</span>
                </div>
                {prog.date_debut && (
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>Début: {new Date(prog.date_debut).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 line-clamp-3 mb-4">{prog.contenu}</p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-emerald-600 font-medium">Voir le détail</span>
                <ChevronRight size={20} className="text-emerald-600" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Nouveau programme</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const { data: { user } } = await supabase.auth.getUser();
              
              const dateDebut = formData.get('date_debut') as string;
              const duree = parseInt(formData.get('duree_semaines') as string);
              const dateFin = dateDebut ? new Date(new Date(dateDebut).getTime() + duree * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;
              
              await supabase.from('programmes').insert([{
                coach_id: user?.id,
                client_id: formData.get('client_id'),
                titre: formData.get('titre'),
                contenu: formData.get('contenu'),
                duree_semaines: duree,
                date_debut: dateDebut,
                date_fin: dateFin,
                statut: 'brouillon'
              }]);
              
              setShowAddModal(false);
              fetchData();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre *</label>
                  <input name="titre" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Programme de renforcement..." />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Client *</label>
                  <select name="client_id" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="">Choisir un client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Durée (semaines)</label>
                    <input name="duree_semaines" type="number" defaultValue={4} min={1} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date de début</label>
                    <input name="date_debut" type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Contenu du programme *</label>
                  <textarea name="contenu" required rows={10} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Semaine 1:..." />
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

      {/* View Modal */}
      {showViewModal && selectedProgramme && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedProgramme.titre}</h2>
                {selectedProgramme.client && (
                  <p className="text-gray-500">Pour: {selectedProgramme.client.prenom} {selectedProgramme.client.nom}</p>
                )}
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X /></button>
            </div>

            <div className="flex gap-4 mb-6">
              <span className={`px-3 py-1 rounded-full ${getStatutColor(selectedProgramme.statut)}`}>{selectedProgramme.statut}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">{selectedProgramme.duree_semaines} semaines</span>
            </div>

            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700">{selectedProgramme.contenu}</pre>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t">
              <button onClick={() => setShowViewModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">Fermer</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
