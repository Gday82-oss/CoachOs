import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, ensureCoachProfile } from '../lib/supabase';
import {
  Users, Calendar, Plus, Clock, Heart, Euro,
  ChevronRight, UserPlus, CalendarCheck, RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
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

interface ChartPoint {
  semaine: string;
  seances: number;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────
const niveauLabel: Record<string, { text: string; color: string }> = {
  debutant:      { text: 'Débutant',      color: 'bg-green-100 text-green-700' },
  intermediaire: { text: 'Intermédiaire', color: 'bg-blue-100 text-blue-700' },
  avance:        { text: 'Avancé',        color: 'bg-purple-100 text-purple-700' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  });
}

/** Regroupe des dates de séances par semaine sur les 30 derniers jours */
function buildChartData(dates: string[]): ChartPoint[] {
  const now = new Date();
  // 4 semaines glissantes, du plus ancien au plus récent
  const semaines: ChartPoint[] = Array.from({ length: 5 }, (_, i) => {
    const debut = new Date(now);
    debut.setDate(now.getDate() - (4 - i) * 7 - 6);
    const fin = new Date(now);
    fin.setDate(now.getDate() - (4 - i) * 7);
    const label = debut.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const count = dates.filter(d => {
      const dt = new Date(d);
      return dt >= debut && dt <= fin;
    }).length;
    return { semaine: label, seances: count };
  });
  return semaines;
}

// ─────────────────────────────────────────────
// Skeleton components
// ─────────────────────────────────────────────
function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-100 dark:bg-[#243044] rounded-xl ${className ?? ''}`} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-[#2E3D55]">
      <div className="flex items-center justify-between mb-3">
        <SkeletonBox className="w-11 h-11 rounded-xl" />
        <SkeletonBox className="w-16 h-3" />
      </div>
      <SkeletonBox className="w-20 h-8 mb-2" />
      <SkeletonBox className="w-28 h-3" />
    </div>
  );
}

function SeanceRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#0F1923] rounded-xl">
      <SkeletonBox className="w-1.5 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="w-32 h-4" />
        <SkeletonBox className="w-20 h-3" />
      </div>
      <SkeletonBox className="w-16 h-6 rounded-full" />
    </div>
  );
}

function ClientCardSkeleton() {
  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-[#0F1923] rounded-xl">
      <SkeletonBox className="w-14 h-14 rounded-full mb-3" />
      <SkeletonBox className="w-20 h-4 mb-2" />
      <SkeletonBox className="w-16 h-5 rounded-full mb-2" />
      <SkeletonBox className="w-24 h-3" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Tooltip personnalisé pour le graphique
// ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1A2535] border border-gray-100 dark:border-[#2E3D55] shadow-lg rounded-lg px-3 py-2 text-sm">
      <p className="text-gray-500 dark:text-[#8896A8] mb-1">{label}</p>
      <p className="font-semibold text-emerald-600">
        {payload[0].value} séance{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState<StatCard>({
    totalClients: 0, seancesMois: 0, caMois: 0, prochainRdv: null,
  });
  const [clientsRecents, setClientsRecents] = useState<ClientRecent[]>([]);
  const [seancesJour, setSeancesJour] = useState<SeanceJour[]>([]);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prenom, setPrenom] = useState('');
  const navigate = useNavigate();

  // ── Fetch principal ──────────────────────────
  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await ensureCoachProfile(user);

      // Prénom du coach
      const { data: coachData } = await supabase
        .from('coachs')
        .select('prenom')
        .eq('id', user.id)
        .maybeSingle();
      if (coachData?.prenom) setPrenom(coachData.prenom);

      const aujourdhui = new Date().toISOString().split('T')[0];
      const debutMois  = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      const finMois    = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString().split('T')[0];
      const il_y_a_30j = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      // ── Toutes les requêtes en parallèle ──────
      const [
        { count: totalClients },
        { count: seancesMois },
        { data: recentClients },
        { data: seancesData },
        { data: facturesMois },
        { data: prochainData },
        { data: recentSeances },
        { data: seances30j },
      ] = await Promise.all([
        // 1. COUNT clients
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', user.id),

        // 2. COUNT séances ce mois
        supabase
          .from('seances')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', user.id)
          .gte('date', debutMois)
          .lte('date', finMois),

        // 3. 5 derniers clients
        supabase
          .from('clients')
          .select('id, nom, prenom, niveau, created_at')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),

        // 4. Séances du jour
        supabase
          .from('seances')
          .select('id, date, heure, type, fait, client:clients(prenom, nom)')
          .eq('coach_id', user.id)
          .eq('date', aujourdhui)
          .order('heure', { ascending: true }),

        // 5. CA du mois (factures payées)
        supabase
          .from('factures')
          .select('montant_ttc')
          .eq('coach_id', user.id)
          .eq('statut', 'payee')
          .gte('date_paiement', debutMois)
          .lte('date_paiement', finMois),

        // 6. Prochain RDV (séances futures non faites)
        supabase
          .from('seances')
          .select('id, date, heure, client:clients(prenom, nom)')
          .eq('coach_id', user.id)
          .eq('fait', false)
          .gte('date', aujourdhui)
          .order('date', { ascending: true })
          .order('heure', { ascending: true })
          .limit(1),

        // 7. Activité récente (séances créées)
        supabase
          .from('seances')
          .select('id, created_at, date, heure, client:clients(prenom, nom)')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),

        // 8. Séances des 30 derniers jours (pour le graphique)
        supabase
          .from('seances')
          .select('date')
          .eq('coach_id', user.id)
          .gte('date', il_y_a_30j)
          .lte('date', aujourdhui),
      ]);

      // ── Calculs ─────────────────────────────
      const caMois = (facturesMois ?? []).reduce(
        (sum, f) => sum + (f.montant_ttc ?? 0), 0,
      );

      let prochainRdv = null;
      if (prochainData && prochainData.length > 0) {
        const p = prochainData[0] as any;
        prochainRdv = {
          date: p.date,
          heure: p.heure,
          clientNom: p.client
            ? `${p.client.prenom} ${p.client.nom}`
            : 'Client inconnu',
        };
      }

      // Graphique : séances par semaine
      const dates30j = (seances30j ?? []).map((s: any) => s.date as string);
      setChartData(buildChartData(dates30j));

      // Activité récente : fusion séances + clients
      const activiteSeances: Activite[] = (recentSeances ?? []).map((s: any) => ({
        id: `s-${s.id}`,
        type: 'seance_planifiee' as const,
        label: 'Séance planifiée',
        detail: s.client
          ? `${s.client.prenom} ${s.client.nom} — ${new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${s.heure?.slice(0, 5)}`
          : `${new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${s.heure?.slice(0, 5)}`,
        date: s.created_at,
      }));
      const activiteClients: Activite[] = (recentClients ?? []).map((c: any) => ({
        id: `c-${c.id}`,
        type: 'client_ajoute' as const,
        label: 'Client ajouté',
        detail: `${c.prenom} ${c.nom}`,
        date: c.created_at,
      }));
      const toutes = [...activiteSeances, ...activiteClients]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6);

      // ── Mise à jour de l'état ─────────────────
      setStats({
        totalClients: totalClients ?? 0,
        seancesMois:  seancesMois  ?? 0,
        caMois,
        prochainRdv,
      });
      setClientsRecents((recentClients ?? []) as ClientRecent[]);
      setSeancesJour((seancesData ?? []) as unknown as SeanceJour[]);
      setActivites(toutes);

    } catch (err) {
      console.error('Erreur dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Montage + abonnements temps réel ─────────
  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' },
        () => fetchDashboardData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seances' },
        () => fetchDashboardData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'factures' },
        () => fetchDashboardData(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDashboardData]);

  const heureActuelle = new Date().getHours();
  const salutation = heureActuelle < 12 ? 'Bonjour' : heureActuelle < 18 ? 'Bon après-midi' : 'Bonsoir';

  // ─────────────────────────────────────────────
  // RENDU SKELETON (premier chargement)
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <SkeletonBox className="w-56 h-8" />
            <SkeletonBox className="w-40 h-4" />
          </div>
          <SkeletonBox className="w-28 h-9 rounded-lg" />
        </div>

        {/* 4 stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55] p-6 space-y-3">
            <SkeletonBox className="w-40 h-5 mb-4" />
            {[0, 1, 2].map(i => <SeanceRowSkeleton key={i} />)}
          </div>
          <div className="bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55] p-6 space-y-4">
            <SkeletonBox className="w-32 h-5 mb-4" />
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <SkeletonBox className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonBox className="w-24 h-3.5" />
                  <SkeletonBox className="w-36 h-3" />
                  <SkeletonBox className="w-16 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clients récents */}
        <div className="bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55] p-6">
          <SkeletonBox className="w-36 h-5 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[0, 1, 2, 3, 4].map(i => <ClientCardSkeleton key={i} />)}
          </div>
        </div>

        {/* Graphique */}
        <div className="bg-white dark:bg-[#1A2535] rounded-xl border border-gray-100 dark:border-[#2E3D55] p-6">
          <SkeletonBox className="w-48 h-5 mb-6" />
          <SkeletonBox className="w-full h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDU PRINCIPAL
  // ─────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

      {/* ── Header ───────────────────────────── */}
      <div className="mb-6 md:mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-[#E8EDF5]">
            {salutation}{prenom ? `, ${prenom}` : ''} 👋
          </h1>
          <p className="text-gray-500 dark:text-[#8896A8] mt-1">Voici un résumé de votre activité</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#8896A8] hover:text-emerald-600 bg-white dark:bg-[#1A2535] border border-gray-200 dark:border-[#2E3D55] px-3 py-2 rounded-lg hover:border-emerald-300 transition-colors disabled:opacity-50"
          title="Rafraîchir les données"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* ── 4 Cartes stats ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* Clients actifs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-[#2E3D55] hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="text-emerald-600" size={22} />
            </div>
            <span className="text-xs text-gray-400 dark:text-[#6B7A8D] font-medium uppercase tracking-wide">Clients</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-[#E8EDF5]">{stats.totalClients}</p>
          <p className="text-sm text-gray-500 dark:text-[#8896A8] mt-1">clients actifs</p>
        </motion.div>

        {/* Séances ce mois */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-[#2E3D55] hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-600" size={22} />
            </div>
            <span className="text-xs text-gray-400 dark:text-[#6B7A8D] font-medium uppercase tracking-wide">Ce mois</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-[#E8EDF5]">{stats.seancesMois}</p>
          <p className="text-sm text-gray-500 dark:text-[#8896A8] mt-1">séances planifiées</p>
        </motion.div>

        {/* CA du mois */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-[#2E3D55] hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
              <Euro className="text-orange-600" size={22} />
            </div>
            <span className="text-xs text-gray-400 dark:text-[#6B7A8D] font-medium uppercase tracking-wide">Revenus</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-[#E8EDF5]">{formatMontant(stats.caMois)}</p>
          <p className="text-sm text-gray-500 dark:text-[#8896A8] mt-1">encaissés ce mois</p>
        </motion.div>

        {/* Prochain RDV */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-[#2E3D55] hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
              <CalendarCheck className="text-purple-600" size={22} />
            </div>
            <span className="text-xs text-gray-400 dark:text-[#6B7A8D] font-medium uppercase tracking-wide">Prochain RDV</span>
          </div>
          {stats.prochainRdv ? (
            <>
              <p className="text-lg font-bold text-gray-800 dark:text-[#E8EDF5] leading-tight">
                {stats.prochainRdv.clientNom}
              </p>
              <p className="text-sm text-gray-500 dark:text-[#8896A8] mt-1">
                {formatDate(stats.prochainRdv.date)} à {stats.prochainRdv.heure.slice(0, 5)}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-400 dark:text-[#6B7A8D]">—</p>
              <p className="text-sm text-gray-400 dark:text-[#6B7A8D] mt-1">Aucun RDV à venir</p>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Grille : séances du jour + activité ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* Séances du jour */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-[#1A2535] rounded-xl shadow-sm border border-gray-100 dark:border-[#2E3D55]"
        >
          <div className="p-6 border-b border-gray-100 dark:border-[#2E3D55] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-[#E8EDF5] flex items-center gap-2">
              <Clock size={20} className="text-emerald-500" />
              Séances d'aujourd'hui
              {seancesJour.length > 0 && (
                <span className="ml-1 text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {seancesJour.length}
                </span>
              )}
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
                <div className="w-16 h-16 bg-gray-50 dark:bg-[#0F1923] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarCheck size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-600 dark:text-[#A8B4C4] font-medium">Journée libre aujourd'hui 🎉</p>
                <p className="text-sm text-gray-400 dark:text-[#6B7A8D] mt-1">Aucune séance planifiée</p>
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
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0F1923] rounded-xl hover:bg-gray-100 dark:bg-[#243044] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-10 rounded-full ${seance.fait ? 'bg-green-400' : 'bg-emerald-500'}`} />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-[#E8EDF5]">
                          {seance.client
                            ? `${seance.client.prenom} ${seance.client.nom}`
                            : 'Client inconnu'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-[#8896A8]">
                          {seance.heure.slice(0, 5)} · <span className="capitalize">{seance.type}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      seance.fait
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
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
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm border border-gray-100 dark:border-[#2E3D55]"
        >
          <div className="p-6 border-b border-gray-100 dark:border-[#2E3D55]">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-[#E8EDF5]">Activité récente</h2>
          </div>
          <div className="p-6">
            {activites.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-50 dark:bg-[#0F1923] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={20} className="text-gray-300" />
                </div>
                <p className="text-gray-400 dark:text-[#6B7A8D] text-sm">Aucune activité récente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activites.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      a.type === 'client_ajoute' ? 'bg-emerald-100' : 'bg-blue-100'
                    }`}>
                      {a.type === 'client_ajoute'
                        ? <UserPlus size={14} className="text-emerald-600" />
                        : <CalendarCheck size={14} className="text-blue-600" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-[#D4DAE6]">{a.label}</p>
                      <p className="text-xs text-gray-500 dark:text-[#8896A8] truncate">{a.detail}</p>
                      <p className="text-xs text-gray-400 dark:text-[#6B7A8D] mt-0.5">{formatDate(a.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Clients récents ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm border border-gray-100 dark:border-[#2E3D55] mb-8"
      >
        <div className="p-6 border-b border-gray-100 dark:border-[#2E3D55] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-[#E8EDF5] flex items-center gap-2">
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
              <div className="w-16 h-16 bg-gray-50 dark:bg-[#0F1923] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-600 dark:text-[#A8B4C4] font-medium">Aucun client encore</p>
              <p className="text-sm text-gray-400 dark:text-[#6B7A8D] mt-1">Commencez par ajouter votre premier client</p>
              <button
                onClick={() => navigate('/app/clients')}
                className="mt-4 inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors text-sm"
              >
                <Plus size={16} /> Ajouter un client
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {clientsRecents.map((client) => (
                <div
                  key={client.id}
                  className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-[#0F1923] rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all cursor-pointer"
                  onClick={() => navigate('/app/clients')}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg mb-3 shadow-sm">
                    {client.prenom?.[0]?.toUpperCase()}
                    {client.nom?.[0]?.toUpperCase()}
                  </div>
                  <p className="font-medium text-gray-800 dark:text-[#E8EDF5] text-sm leading-tight">
                    {client.prenom} {client.nom}
                  </p>
                  {client.niveau && (
                    <span className={`mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                      niveauLabel[client.niveau]?.color ?? 'bg-gray-100 dark:bg-[#243044] text-gray-600 dark:text-[#A8B4C4]'
                    }`}>
                      {niveauLabel[client.niveau]?.text ?? client.niveau}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 dark:text-[#6B7A8D] mt-2">
                    Ajouté le {formatDate(client.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Graphique activité 30 jours ────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-[#1A2535] rounded-xl shadow-sm border border-gray-100 dark:border-[#2E3D55] mb-8"
      >
        <div className="p-6 border-b border-gray-100 dark:border-[#2E3D55]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-[#E8EDF5] flex items-center gap-2">
            <Calendar size={20} className="text-blue-500" />
            Activité — 30 derniers jours
          </h2>
          <p className="text-sm text-gray-400 dark:text-[#6B7A8D] mt-0.5">Nombre de séances par semaine</p>
        </div>
        <div className="p-6">
          {chartData.every(p => p.seances === 0) ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-50 dark:bg-[#0F1923] rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 dark:text-[#8896A8] font-medium">Pas encore de séances ce mois-ci</p>
              <p className="text-sm text-gray-400 dark:text-[#6B7A8D] mt-1">Le graphique s'affichera dès votre première séance</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                barCategoryGap="35%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="semaine"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0faf7' }} />
                <Bar
                  dataKey="seances"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* ── Actions rapides ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
          className="flex items-center gap-2 bg-white dark:bg-[#1A2535] text-gray-700 dark:text-[#D4DAE6] px-6 py-3 rounded-xl hover:bg-gray-50 dark:bg-[#0F1923] transition-colors border border-gray-200 dark:border-[#2E3D55] font-medium"
        >
          <Calendar size={20} />
          Planifier une séance
        </button>
      </motion.div>
    </div>
  );
}
