import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, ensureCoachProfile } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail,
  Trash2,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_naissance: string;
  objectifs: string[];
  niveau: 'debutant' | 'intermediaire' | 'avance';
  created_at: string;
  invite_sent?: boolean;
  has_account?: boolean;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [inviteNotif, setInviteNotif] = useState<{ id: string; msg: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // S'assure que le profil coach existe
      await ensureCoachProfile(user);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur fetch clients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(client: Client) {
    if (!client.email) {
      alert('Ce client n\'a pas d\'adresse email. Ajoutez-en une avant d\'envoyer une invitation.');
      return;
    }

    setInviting(client.id);
    setInviteNotif(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Appel au backend Express (clé secrète stockée côté serveur, jamais dans le navigateur)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/invite-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clientId: client.id,
          email: client.email,
          prenom: client.prenom,
          nom: client.nom,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur lors de l\'invitation');
      }

      // Mise à jour locale immédiate (pas besoin d'attendre le fetch)
      setClients(prev =>
        prev.map(c => c.id === client.id ? { ...c, invite_sent: true } : c)
      );

      setInviteNotif({
        id: client.id,
        msg: `Invitation envoyée à ${client.email}`,
      });
      setTimeout(() => setInviteNotif(null), 5000);

    } catch (err: any) {
      alert(`Erreur lors de l'invitation : ${err.message}`);
    } finally {
      setInviting(null);
    }
  }

  async function handleDelete(clientId: string) {
    if (!confirm('Supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      fetchClients();
    } catch (error) {
      console.error('Erreur delete client:', error);
      alert('Erreur lors de la suppression');
    }
  }

  const filteredClients = clients.filter(client =>
    `${client.prenom} ${client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getNiveauColor = (niveau: string) => {
    switch (niveau) {
      case 'debutant': return 'bg-green-100 text-green-700';
      case 'intermediaire': return 'bg-yellow-100 text-yellow-700';
      case 'avance': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 dark:bg-[#243044] text-gray-700 dark:text-[#D4DAE6]';
    }
  };

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-[#E8EDF5]">Clients</h1>
          <p className="text-gray-600 dark:text-[#A8B4C4] mt-1">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
        >
          <Plus size={20} />
          Nouveau client
        </button>
      </div>

      {/* Notification invitation envoyée */}
      {inviteNotif && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-4 p-4 bg-[#00C896]/10 border border-[#00C896]/30 rounded-xl text-[#00A87E] font-medium flex items-center gap-2"
        >
          <span>✅</span>
          <span>{inviteNotif.msg}</span>
        </motion.div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6B7A8D]" size={20} />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1A2535] border border-gray-200 dark:border-[#2E3D55] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-[#243044] rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-gray-400 dark:text-[#6B7A8D]" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-[#E8EDF5] mb-2">Aucun client pour le moment</h3>
          <p className="text-gray-500 dark:text-[#8896A8]">Cliquez sur <span className="font-medium text-emerald-600">+ Nouveau client</span> en haut à droite pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm border border-gray-100 dark:border-[#2E3D55] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {client.prenom[0]}{client.nom[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-[#E8EDF5]">{client.prenom} {client.nom}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getNiveauColor(client.niveau)}`}>
                      {client.niveau}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-gray-400 dark:text-[#6B7A8D] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-[#A8B4C4]">
                    <Mail size={16} />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.telephone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-[#A8B4C4]">
                    <Phone size={16} />
                    <span>{client.telephone}</span>
                  </div>
                )}
              </div>

              {client.objectifs && client.objectifs.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {client.objectifs.slice(0, 3).map((obj, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                      {obj}
                    </span>
                  ))}
                  {client.objectifs.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-[#243044] text-gray-600 dark:text-[#A8B4C4] rounded-full">
                      +{client.objectifs.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2E3D55] flex gap-2">
                <button
                  onClick={() => navigate(`/seances?client=${client.id}`)}
                  className="flex-1 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  Planifier
                </button>
                <button
                  onClick={() => navigate(`/programmes?client=${client.id}`)}
                  className="flex-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Programme
                </button>
                <button
                  onClick={() => handleInvite(client)}
                  disabled={client.invite_sent || client.has_account || inviting === client.id || !client.email}
                  title={
                    !client.email ? 'Ajoutez un email à ce client pour l\'inviter'
                    : client.has_account ? 'Ce client a déjà un compte'
                    : client.invite_sent ? 'Invitation déjà envoyée'
                    : 'Envoyer une invitation par email'
                  }
                  className={`flex-1 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    client.has_account
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : client.invite_sent
                        ? 'text-[#00C896] bg-[#00C896]/10 cursor-default'
                        : !client.email
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-[#00C896] hover:bg-[#00C896]/10'
                  }`}
                >
                  {inviting === client.id ? (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : client.invite_sent || client.has_account ? (
                    '✓ Invité'
                  ) : (
                    '✉ Inviter'
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1A2535] rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-[#E8EDF5] mb-6">Nouveau client</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  alert('Vous devez être connecté pour créer un client');
                  return;
                }

                // S'assure que le profil coach existe
                await ensureCoachProfile(user);

                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const dateNaissanceValue = formData.get('date_naissance') as string;
                const dateNaissance = dateNaissanceValue ? dateNaissanceValue : null;

                const nom = (formData.get('nom') as string)?.trim();
                const prenom = (formData.get('prenom') as string)?.trim();
                const email = (formData.get('email') as string)?.trim() || null;
                const telephone = (formData.get('telephone') as string)?.trim() || null;

                if (!nom || !prenom) {
                  alert('Le nom et le prénom sont obligatoires');
                  return;
                }

                const { error } = await supabase
                  .from('clients')
                  .insert([{
                    coach_id: user.id,
                    nom,
                    prenom,
                    email,
                    telephone,
                    date_naissance: dateNaissance,
                    niveau: formData.get('niveau') || 'debutant',
                    objectifs: []
                  }]);

                if (error) {
                  console.error('Erreur Supabase:', error);
                  throw error;
                }

                setShowAddModal(false);
                form.reset();
                fetchClients();
              } catch (error: any) {
                console.error('Erreur création client:', error);
                alert(`Erreur lors de la création : ${error?.message || error?.error_description || JSON.stringify(error)}`);
              }
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#D4DAE6] mb-1">Prénom *</label>
                    <input name="prenom" required className="w-full px-4 py-2 border border-gray-300 dark:border-[#2E3D55] rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#D4DAE6] mb-1">Nom *</label>
                    <input name="nom" required className="w-full px-4 py-2 border border-gray-300 dark:border-[#2E3D55] rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#D4DAE6] mb-1">Email</label>
                  <input name="email" type="email" className="w-full px-4 py-2 border border-gray-300 dark:border-[#2E3D55] rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#D4DAE6] mb-1">Téléphone</label>
                  <input name="telephone" className="w-full px-4 py-2 border border-gray-300 dark:border-[#2E3D55] rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#D4DAE6] mb-1">Date de naissance</label>
                  <input name="date_naissance" type="date" className="w-full px-4 py-2 border border-gray-300 dark:border-[#2E3D55] rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#D4DAE6] mb-1">Niveau</label>
                  <select name="niveau" className="w-full px-4 py-2 border border-gray-300 dark:border-[#2E3D55] rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="debutant">Débutant</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="avance">Avancé</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-300 dark:border-[#2E3D55] text-gray-700 dark:text-[#D4DAE6] rounded-xl hover:bg-gray-50 dark:bg-[#0F1923] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
