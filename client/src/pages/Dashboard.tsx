import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, ensureCoachProfile } from '../lib/supabase';
import {
  Users,
  Calendar,
  TrendingUp,
  Plus,
  Clock,
  Heart,
  Euro,
  ChevronRight,
  UserPlus,
  CalendarCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCard {
  totalClients: number;
  seancesMois: number;
  caMois: number;
  prochainRdv: { date: string; heure: string; clientNom: string } | null;
}

interface ClientRecent {
  id: string;
  nom: string;
  prenom: string;
  niveau: 'debutant' | 'intermediaire' | 'avance';
  created_at: string;
}

interface SeanceJour {
  id: string;
  date: string;
  heure: string;
  type: string;
  fait: boolean;
  client: { prenom: string; nom: string } | null;
}

interface Activite {
  id: string;
  type: 'client_ajoute' | 'seance_planifiee';
  label: string;
  detail: string;
  date: string;
}

const niveauLabel: Record<string, { text: string; color: string }> = {
  debutant:      { text: 'Débutant',      color: 'bg-green-100 text-green-700' },
  intermediaire: { text: 'Intermédiaire', color: 'bg-blue-100 text-blue-700' },
  avance:        { text: 'Avancé',        color: 'bg-purple-100 text-purple-700' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatCard>({
    totalClients: 0,
    seancesMois: 0,
    caMois: 0,
    prochainRdv: null,
  });
  const [clientsRecents, setClientsRecents] = useState<ClientRecent[]>([]);
  const [seancesJour, setSeancesJour] = useState<SeanceJour[]>([]);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [prenom, setPrenom] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await ensureCoachProfile(user);

      // Récupérer le prénom du coach pour la salutation
      const { data: coachData } = await supabase
        .from('coachs')
        .select('prenom')
        .eq('id', user.id)
        .maybeSingle();
      if (coachData?.prenom) setPrenom(coachData.prenom);

      const aujourdhui = new Date().toISOString().split('T')[0];
      const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const finMois = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      // Toutes les requêtes en parallèle
      const [
        { count: totalClients },
        { count: seancesMois },
        { data: recentClients },
        { data: seancesData },
        { data: facturesMois },
        { data: prochainData },
        { data: recentSeances },
      ] = await Promise.all([
        // Total clients
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', user.id),

        // Séances ce mois
        supabase
          .from('seances')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', user.id)
          .gte('date', debutMois)
          .lte('date', finMois),

        // Clients récents (5 derniers)
        supabase
          .from('clients')
          .select('id, nom, prenom, niveau, created_at')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),

        // Séances du jour avec nom du client
        supabase
          .from('seances')
          .select('id, date, heure, type, fait, client:clients(prenom, nom)')
          .eq('coach_id', user.id)
          .eq('date', aujourdhui)
          .order('heure', { ascending: true }),

        // CA du mois (factures payées)
        supabase
          .from('factures')
          .select('montant_ttc')
          .eq('coach_id', user.id)
          .eq('statut', 'payee')
          .gte('date_paiement', debutMois)
          .lte('date_paiement', finMois),

        // Prochain rendez-vous (séances futures)
        supabase
          .from('seances')
          .select('id, date, heure, client:clients(prenom, nom)')
          .eq('coach_id', user.id)
          .eq('fait', false)
          .gt('date', aujourdhui)
          .order('date', { ascending: true })
          .order('heure', { ascending: true })
          .limit(1),

        // Activité récente : séances créées récemment
        supabase
          .from('seances')
          .select('id, created_at, date, heure, client:clients(prenom, nom)')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Calcul CA
      const caMois = (facturesMois || []).reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

      // Prochain RDV
      let prochainRdv = null;
      if (prochainData && prochainData.length > 0) {
        const p = prochainData[0] as any;
        const clientNom = p.client ? `${p.client.prenom} ${p.client.nom}` : 'Client inconnu';
        prochainRdv = { date: p.date, heure: p.heure, clientNom };
      }

      setStats({
        totalClients: totalClients || 0,
        seancesMois: seancesMois || 0,
        caMois,
        prochainRdv,
      });

      setClientsRecents((recentClients || []) as ClientRecent[]);
      setSeancesJour((seancesData || []) as unknown as SeanceJour[]);

      // Construire activité récente à partir des séances + clients récents
      const activiteSeances: Activite[] = (recentSeances || []).map((s: any) => ({
        id: `s-${s.id}`,
        type: 'seance_planifiee',
        label: 'Séance planifiée',
        detail: s.client ? `${s.client.prenom} ${s.client.nom} — ${new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${s.heure?.slice(0, 5)}` : `${new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${s.heure?.slice(0, 5)}`,
        date: s.created_at,
      }));

      const activiteClients: Activite[] = (recentClients || []).map((c: any) => ({
        id: `c-${c.id}`,
        type: 'client_ajoute',
        label: 'Client ajouté',
        detail: `${c.prenom} ${c.nom}`,
        date: c.created_at,
      }));

      // Fusionner et trier par date décroissante, garder les 6 plus récentes
      const toutes = [...activiteSeances, ...activiteClients]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6);

      setActivites(toutes);
    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const heureActuelle = new Date().getHours();
  const salutation = heureActuelle < 12 ? 'Bonjour' : heureActuelle < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {salutation}{prenom ? `, ${prenom}` : ''} 👋
        </h1>
        <p className="text-gray-500 mt-1">Voici un résumé de votre activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Clients actifs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="text-emerald-600" size={22} />
            </div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Clients</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalClients}</p>
          <p className="text-sm text-gray-500 mt-1">clients actifs</p>
        </motion.div>

        {/* Séances ce mois */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-600" size={22} />
            </div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ce mois</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.seancesMois}</p>
          <p className="text-sm text-gray-500 mt-1">séances planifiées</p>
        </motion.div>

        {/* CA du mois */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
              <Euro className="text-orange-600" size={22} />
            </div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Revenus</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatMontant(stats.caMois)}</p>
          <p className="text-sm text-gray-500 mt-1">encaissés ce mois</p>
        </motion.div>

        {/* Prochain RDV */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={22} />
            </div>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Prochain RDV</span>
          </div>
          {stats.prochainRdv ? (
            <>
              <p className="text-lg font-bold text-gray-800 leading-tight">{stats.prochainRdv.clientNom}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(stats.prochainRdv.date)} à {stats.prochainRdv.heure.slice(0, 5)}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-400">—</p>
              <p className="text-sm text-gray-400 mt-1">Aucun RDV à venir</p>
            </>
          )}
        </motion.div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Séances du jour */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={20} className="text-emerald-500" />
              Séances d'aujourd'hui
            </h2>
            <button
              onClick={() => navigate('/app/seances')}
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          <div className="p-6">
            {seancesJour.length === 0 ? (
              <div className="text-center py-10">
                <CalendarCheck size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Pas de séance aujourd'hui</p>
                <p className="text-sm text-gray-400 mt-1">Profitez de votre journée !</p>
                <button
                  onClick={() => navigate('/app/seances')}
                  className="mt-4 inline-flex items-center gap-2 text-sm bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Plus size={16} /> Planifier une séance
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {seancesJour.map((seance) => (
                  <div
                    key={seance.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-10 rounded-full ${seance.fait ? 'bg-green-400' : 'bg-emerald-500'}`} />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {seance.client ? `${seance.client.prenom} ${seance.client.nom}` : 'Client inconnu'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {seance.heure.slice(0, 5)} · <span className="capitalize">{seance.type}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${seance.fait ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {seance.fait ? 'Terminée' : 'À venir'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Activité récente */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Activité récente</h2>
          </div>
          <div className="p-6">
            {activites.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Aucune activité récente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activites.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.type === 'client_ajoute' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                      {a.type === 'client_ajoute'
                        ? <UserPlus size={14} className="text-emerald-600" />
                        : <CalendarCheck size={14} className="text-blue-600" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700">{a.label}</p>
                      <p className="text-xs text-gray-500 truncate">{a.detail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Clients récents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Heart size={20} className="text-emerald-500" />
            Clients récents
          </h2>
          <button
            onClick={() => navigate('/app/clients')}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Voir tous <ChevronRight size={14} />
          </button>
        </div>
        <div className="p-6">
          {clientsRecents.length === 0 ? (
            <div className="text-center py-10">
              <Users size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun client encore</p>
              <p className="text-sm text-gray-400 mt-1">Commencez par ajouter votre premier client</p>
              <button
                onClick={() => navigate('/app/clients')}
                className="mt-4 inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors text-sm"
              >
                <Plus size={16} /> Ajouter un client
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {clientsRecents.map((client) => (
                <div
                  key={client.id}
                  className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/app/clients')}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg mb-3">
                    {client.prenom?.[0]?.toUpperCase()}{client.nom?.[0]?.toUpperCase()}
                  </div>
                  <p className="font-medium text-gray-800 text-sm leading-tight">{client.prenom} {client.nom}</p>
                  {client.niveau && (
                    <span className={`mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${niveauLabel[client.niveau]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {niveauLabel[client.niveau]?.text || client.niveau}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Ajouté le {formatDate(client.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-4"
      >
        <button
          onClick={() => navigate('/app/clients')}
          className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25 font-medium"
        >
          <Plus size={20} />
          Nouveau client
        </button>
        <button
          onClick={() => navigate('/app/seances')}
          className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 font-medium"
        >
          <Calendar size={20} />
          Planifier une séance
        </button>
      </motion.div>
    </div>
  );
}
