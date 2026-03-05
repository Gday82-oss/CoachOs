import { useEffect, useState, useMemo } from 'react';
import { Plus, TrendingUp, Users, CheckCircle, Clock, AlertCircle, Search, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, Facture, ensureCoachProfile } from '../lib/supabase';

interface Client {
  id: string;
  nom: string;
  prenom: string;
}

export default function Paiements() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('');
  const [tva, setTva] = useState('20');
  const [dateEcheance, setDateEcheance] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await ensureCoachProfile(user);

      const [{ data: facturesData }, { data: clientsData }] = await Promise.all([
        supabase.from('factures').select('*, client:clients(nom, prenom)').eq('coach_id', user.id).order('created_at', { ascending: false }),
        supabase.from('clients').select('id, nom, prenom').eq('coach_id', user.id)
      ]);

      setFactures(facturesData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const paye = factures.filter(f => f.statut === 'payee').reduce((a, f) => a + f.montant_ttc, 0);
    const attente = factures.filter(f => f.statut === 'envoyee' || f.statut === 'brouillon').reduce((a, f) => a + f.montant_ttc, 0);
    const retard = factures.filter(f => f.statut === 'retard').reduce((a, f) => a + f.montant_ttc, 0);
    return { paye, attente, retard, count: new Set(factures.map(f => f.client_id)).size };
  }, [factures]);

  const filtered = factures.filter(f => {
    const match = f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  f.client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    return match && (filterStatut === 'tous' || f.statut === filterStatut);
  });

  async function createFacture(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Vous devez être connecté');
        return;
      }
      
      // S'assure que le profil coach existe
      await ensureCoachProfile(user);

      const ht = parseFloat(montant);
      const ttc = ht * (1 + parseFloat(tva) / 100);

      const { error } = await supabase.from('factures').insert({
        coach_id: user.id,
        client_id: clientId,
        montant_ht: ht,
        tva_percent: parseFloat(tva),
        montant_ttc: ttc,
        description,
        date_echeance: dateEcheance || null,
        statut: 'brouillon'
      });

      if (error) throw error;
      
      setShowAddModal(false);
      setClientId(''); setDescription(''); setMontant(''); setTva('20'); setDateEcheance('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erreur création facture');
    }
  }

  async function updateStatut(id: string, statut: string, mode?: string) {
    try {
      const updates: any = { statut };
      if (statut === 'payee') {
        updates.mode_paiement = mode;
        updates.date_paiement = new Date().toISOString().split('T')[0];
      }
      await supabase.from('factures').update(updates).eq('id', id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteFacture(id: string) {
    if (!confirm('Supprimer cette facture ?')) return;
    await supabase.from('factures').delete().eq('id', id);
    fetchData();
  }

  const getStatutColor = (s: string) => ({
    payee: 'bg-emerald-100 text-emerald-700',
    envoyee: 'bg-blue-100 text-blue-700',
    brouillon: 'bg-gray-100 text-gray-700',
    retard: 'bg-red-100 text-red-700',
    annulee: 'bg-slate-100 text-slate-500'
  }[s] || 'bg-gray-100');

  const getStatutIcon = (s: string) => {
    if (s === 'payee') return <CheckCircle size={16} className="text-emerald-600" />;
    if (s === 'retard') return <AlertCircle size={16} className="text-red-600" />;
    return <Clock size={16} className="text-blue-600" />;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" /></div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Factures</h1>
          <p className="text-gray-600 mt-1">Gestion des paiements - Chèque, Espèces, Virement</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/25">
          <Plus size={20} /> Nouvelle facture
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Encaissé</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.paye.toFixed(2)}€</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center"><TrendingUp className="text-emerald-600" size={24} /></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-amber-600">{stats.attente.toFixed(2)}€</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center"><Clock className="text-amber-600" size={24} /></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En retard</p>
              <p className="text-2xl font-bold text-red-600">{stats.retard.toFixed(2)}€</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><AlertCircle className="text-red-600" size={24} /></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clients facturés</p>
              <p className="text-2xl font-bold text-blue-600">{stats.count}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="text-blue-600" size={24} /></div>
          </div>
        </motion.div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
          <option value="tous">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="envoyee">Envoyée</option>
          <option value="payee">Payée</option>
          <option value="retard">En retard</option>
        </select>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 text-sm font-medium text-gray-600">
          <div className="col-span-2">N° Facture</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Montant TTC</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-1">Actions</div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune facture trouvée</div>
        ) : (
          filtered.map((f, idx) => (
            <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 items-center">
              <div className="col-span-2 font-medium text-gray-800">{f.numero}</div>
              <div className="col-span-3 text-gray-700">{f.client?.prenom} {f.client?.nom}</div>
              <div className="col-span-2 text-gray-500 text-sm">{new Date(f.date_emission).toLocaleDateString('fr-FR')}</div>
              <div className="col-span-2 font-semibold text-gray-800">{f.montant_ttc.toFixed(2)}€</div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  {getStatutIcon(f.statut)}
                  <select value={f.statut} onChange={(e) => updateStatut(f.id, e.target.value, f.mode_paiement || undefined)} className={`text-xs px-2 py-1 rounded-full border ${getStatutColor(f.statut)}`}>
                    <option value="brouillon">Brouillon</option>
                    <option value="envoyee">Envoyée</option>
                    <option value="payee">Payée</option>
                    <option value="retard">Retard</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </div>
                {f.statut === 'payee' && f.mode_paiement && (
                  <span className="text-xs text-gray-500 ml-6">{f.mode_paiement}</span>
                )}
              </div>
              <div className="col-span-1 flex gap-2">
                <button onClick={() => deleteFacture(f.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal création */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Nouvelle facture</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={createFacture} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Séances de sport-santé..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant HT (€) *</label>
                  <input type="number" step="0.01" required value={montant} onChange={(e) => setMontant(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TVA (%)</label>
                  <select value={tva} onChange={(e) => setTva(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="0">0%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total HT:</span>
                  <span>{montant ? parseFloat(montant).toFixed(2) : '0.00'}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA ({tva}%):</span>
                  <span>{montant ? (parseFloat(montant) * parseFloat(tva) / 100).toFixed(2) : '0.00'}€</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total TTC:</span>
                  <span className="text-emerald-600">{montant ? (parseFloat(montant) * (1 + parseFloat(tva) / 100)).toFixed(2) : '0.00'}€</span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600">Créer la facture</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
