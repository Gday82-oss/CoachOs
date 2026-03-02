import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, Plus, Calendar, Euro } from 'lucide-react';
import { motion } from 'framer-motion';

interface Attestation {
  id: string;
  mois: number;
  annee: number;
  nombre_seances: number;
  montant_total: number;
  date_emission: string;
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

export default function Attestations() {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: attestationsData } = await supabase
        .from('attestations')
        .select('*, client:clients(prenom, nom)')
        .eq('coach_id', user.id)
        .order('date_emission', { ascending: false });

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, prenom, nom')
        .eq('coach_id', user.id);

      setAttestations(attestationsData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  function generatePDF(attestation: Attestation) {
    const content = `
ATTESTATION DE SÉANCES DE SPORT-SANTÉ

Coach: ${attestation.client?.prenom} ${attestation.client?.nom}
Période: ${attestation.mois}/${attestation.annee}
Nombre de séances: ${attestation.nombre_seances}
Montant total: ${attestation.montant_total}€

Cette attestation est destinée à être transmise à votre mutuelle
pour le remboursement des séances de sport-santé.

Date d'émission: ${new Date(attestation.date_emission).toLocaleDateString('fr-FR')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attestation_${attestation.client?.nom}_${attestation.mois}_${attestation.annee}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Attestations</h1>
          <p className="text-gray-600 mt-1">Documents pour remboursement mutuelle</p>
        </div>
        <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/25">
          <Plus size={20} />
          Générer attestation
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <FileText className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-blue-900">Remboursement sport-santé</h3>
            <p className="text-sm text-blue-700 mt-1">
              Ces attestations permettent à vos clients de faire rembourser leurs séances par leur mutuelle. 
              Le sport-santé sur ordonnance est éligible au remboursement et donne droit à un crédit d'impôt de 50%.
            </p>
          </div>
        </div>
      </div>

      {/* Liste attestations */}
      {attestations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune attestation</h3>
          <p className="text-gray-500 mb-6">Générez votre première attestation pour remboursement</p>
          <button onClick={() => setShowGenerateModal(true)} className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600">
            <Plus size={20} />
            Générer attestation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attestations.map((att, idx) => (
            <motion.div
              key={att.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{moisNoms[att.mois - 1]} {att.annee}</h3>
                    {att.client && <p className="text-sm text-gray-500">{att.client.prenom} {att.client.nom}</p>}
                  </div>
                </div>
                <span className="text-emerald-600 font-semibold">{att.montant_total}€</span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{att.nombre_seances} séances</span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro size={16} />
                  <span>{att.montant_total}€ total</span>
                </div>
              </div>

              <button 
                onClick={() => generatePDF(att)}
                className="w-full flex items-center justify-center gap-2 py-2 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <Download size={18} />
                Télécharger
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Générer attestation</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const { data: { user } } = await supabase.auth.getUser();
              
              const mois = parseInt(formData.get('mois') as string);
              const annee = parseInt(formData.get('annee') as string);
              
              // Calculer nombre de séances dans le mois
              const debutMois = `${annee}-${String(mois).padStart(2, '0')}-01`;
              const finMois = `${annee}-${String(mois).padStart(2, '0')}-31`;
              
              const { count } = await supabase
                .from('seances')
                .select('*', { count: 'exact', head: true })
                .eq('coach_id', user?.id)
                .eq('client_id', formData.get('client_id'))
                .eq('fait', true)
                .gte('date', debutMois)
                .lte('date', finMois);

              const montant = (count || 0) * 50; // 50€ par séance exemple
              
              await supabase.from('attestations').insert([{
                coach_id: user?.id,
                client_id: formData.get('client_id'),
                mois,
                annee,
                nombre_seances: count || 0,
                montant_total: montant
              }]);
              
              setShowGenerateModal(false);
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mois *</label>
                    <select name="mois" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                      {moisNoms.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Année *</label>
                    <select name="annee" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowGenerateModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600">Générer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
