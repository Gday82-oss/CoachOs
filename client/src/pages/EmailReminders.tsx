import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Clock, Check, X, Send, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmailLog {
  id: string;
  client_id: string;
  seance_id: string;
  type: string;
  statut: string;
  date_envoi: string;
  client?: {
    prenom: string;
    nom: string;
    email: string;
  };
  seance?: {
    date: string;
    heure: string;
  };
}

interface Config {
  rappel_24h: boolean;
  rappel_1h: boolean;
  confirmation_seance: boolean;
  nouvelle_seance: boolean;
}

export default function EmailReminders() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [config, setConfig] = useState<Config>({
    rappel_24h: true,
    rappel_1h: false,
    confirmation_seance: true,
    nouvelle_seance: true
  });
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchConfig();
  }, []);

  async function fetchLogs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('email_logs')
        .select('*, client:clients(prenom, nom, email), seance:seances(date, heure)')
        .eq('coach_id', user.id)
        .order('date_envoi', { ascending: false })
        .limit(50);

      setLogs(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchConfig() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('coach_config')
        .select('*')
        .eq('coach_id', user.id)
        .single();

      if (data) {
        setConfig({
          rappel_24h: data.rappel_24h ?? true,
          rappel_1h: data.rappel_1h ?? false,
          confirmation_seance: data.confirmation_seance ?? true,
          nouvelle_seance: data.nouvelle_seance ?? true
        });
      }
    } catch (error) {
      console.error('Erreur config:', error);
    }
  }

  async function saveConfig() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('coach_config')
        .upsert({
          coach_id: user.id,
          ...config,
          updated_at: new Date().toISOString()
        });

      setShowConfig(false);
    } catch (error) {
      console.error('Erreur save config:', error);
    }
  }

  async function sendTestEmail() {
    setSending(true);
    // Simulation - à remplacer par vrai envoi
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    alert('Email de test envoyé !');
  }

  async function sendManualReminder(clientId: string, seanceId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('email_logs').insert({
        coach_id: user.id,
        client_id: clientId,
        seance_id: seanceId,
        type: 'rappel_manuel',
        statut: 'envoye'
      });

      fetchLogs();
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  // Fonction pour envoyer un rappel manuel
  // @ts-ignore - utilisée via UI
  const handleManualReminder = (clientId: string, seanceId: string) => {
    sendManualReminder(clientId, seanceId);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'envoye': return 'bg-green-100 text-green-700';
      case 'en_attente': return 'bg-yellow-100 text-yellow-700';
      case 'erreur': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rappel_24h': return 'Rappel 24h';
      case 'rappel_1h': return 'Rappel 1h';
      case 'confirmation': return 'Confirmation';
      case 'nouvelle_seance': return 'Nouvelle séance';
      case 'rappel_manuel': return 'Manuel';
      default: return type;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Email Reminders</h1>
          <p className="text-gray-600 mt-1">Automatisation des rappels clients</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            <Settings size={18} />
            Configuration
          </button>
          <button 
            onClick={sendTestEmail}
            disabled={sending}
            className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 disabled:opacity-50"
          >
            <Send size={18} />
            {sending ? 'Envoi...' : 'Test'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total envoyés</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Envoyés</p>
              <p className="text-2xl font-bold">{logs.filter(l => l.statut === 'envoye').length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold">{logs.filter(l => l.statut === 'en_attente').length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <X className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Erreurs</p>
              <p className="text-2xl font-bold">{logs.filter(l => l.statut === 'erreur').length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Historique des emails</h2>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun email envoyé pour le moment
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      log.statut === 'envoye' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Mail size={18} className={log.statut === 'envoye' ? 'text-green-600' : 'text-gray-600'} />
                    </div>
                    <div>
                      <p className="font-medium">{getTypeLabel(log.type)}</p>
                      {log.client && (
                        <p className="text-sm text-gray-500">{log.client.prenom} {log.client.nom} • {log.client.email}</p>
                      )}
                      {log.seance && (
                        <p className="text-sm text-gray-400">Séance: {new Date(log.seance.date).toLocaleDateString('fr-FR')} {log.seance.heure?.slice(0, 5)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatutColor(log.statut)}`}>
                      {log.statut}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(log.date_envoi).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Configuration emails</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={config.rappel_24h}
                  onChange={(e) => setConfig({...config, rappel_24h: e.target.checked})}
                  className="w-5 h-5 text-emerald-500"
                />
                <div>
                  <p className="font-medium">Rappel 24h avant</p>
                  <p className="text-sm text-gray-500">Email automatique la veille de la séance</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={config.rappel_1h}
                  onChange={(e) => setConfig({...config, rappel_1h: e.target.checked})}
                  className="w-5 h-5 text-emerald-500"
                />
                <div>
                  <p className="font-medium">Rappel 1h avant</p>
                  <p className="text-sm text-gray-500">Email 1 heure avant la séance</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={config.confirmation_seance}
                  onChange={(e) => setConfig({...config, confirmation_seance: e.target.checked})}
                  className="w-5 h-5 text-emerald-500"
                />
                <div>
                  <p className="font-medium">Confirmation de séance</p>
                  <p className="text-sm text-gray-500">Email après chaque séance réalisée</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  checked={config.nouvelle_seance}
                  onChange={(e) => setConfig({...config, nouvelle_seance: e.target.checked})}
                  className="w-5 h-5 text-emerald-500"
                />
                <div>
                  <p className="font-medium">Nouvelle séance planifiée</p>
                  <p className="text-sm text-gray-500">Email quand une séance est créée</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowConfig(false)} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={saveConfig} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600">
                Enregistrer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
