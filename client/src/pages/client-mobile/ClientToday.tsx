import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useClientData, calcStreak } from '../../hooks/useClientData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Flame, Trophy, Check, Dumbbell,
  ChevronRight, ArrowRight, MapPin,
} from 'lucide-react';

interface ClientTodayProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
    objectif?: string;
  };
}

interface Seance {
  id: string;
  date: string;
  heure: string;
  duree: number;
  type: string;
  lieu?: string;
  fait: boolean;
  coach?: { prenom: string; nom: string };
}

interface ExerciceLocal {
  id: string;
  nom: string;
  series: number;
  reps: string;
  fait: boolean;
}

const citations = [
  'Chaque effort compte. Continue !',
  'Ta santé est ton premier capital.',
  'Un pas de plus vers ton objectif.',
  'La régularité bat l\'intensité.',
  'Ton futur toi te remercie.',
  'Le corps atteint ce que l\'esprit croit.',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } },
};

function CircleProgress({ percent }: { percent: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(percent, 100) / 100);
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#F0FAF7" strokeWidth="4" />
      <g transform="rotate(-90 22 22)">
        <motion.circle
          cx="22" cy="22" r={r} fill="none" stroke="#FF8C42" strokeWidth="4"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </g>
      <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1A2B4A">{percent}%</text>
    </svg>
  );
}

export default function ClientToday({ client }: ClientTodayProps) {
  const { seances, programme, loading: dataLoading } = useClientData(client.id);
  const [seanceDuJour, setSeanceDuJour] = useState<Seance | null>(null);
  const [exercices, setExercices] = useState<ExerciceLocal[]>([]);
  const [loadingSeance, setLoadingSeance] = useState(true);
  const [citation] = useState(() => citations[Math.floor(Math.random() * citations.length)]);

  const seancesFaites = seances.filter(s => s.fait).length;
  const seancesTotal = seances.length;
  const streak = calcStreak(seances);
  const progressProgramme = seancesTotal > 0 ? Math.round((seancesFaites / seancesTotal) * 100) : 0;
  const exercicesFaits = exercices.filter(e => e.fait).length;

  useEffect(() => {
    if (programme?.exercices) {
      setExercices(programme.exercices.map(e => ({
        id: e.id, nom: e.nom,
        series: e.series ?? 3,
        reps: e.repetitions ? `${e.repetitions} reps` : '—',
        fait: false,
      })));
    }
  }, [programme]);

  useEffect(() => { fetchTodaySeance(); }, [client.id]);

  async function fetchTodaySeance() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('seances')
        .select('*, coach:coachs(prenom, nom)')
        .eq('client_id', client.id)
        .eq('date', today)
        .maybeSingle();
      setSeanceDuJour(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSeance(false);
    }
  }

  const toggleExercice = (id: string) =>
    setExercices(prev => prev.map(e => e.id === id ? { ...e, fait: !e.fait } : e));

  if (loadingSeance || dataLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 rounded-full"
          style={{ borderColor: '#00C896', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // ─── Carte séance ────────────────────────────────────────────
  const seanceCard = (
    <div className="bg-white rounded-3xl p-4 md:p-6" style={{ boxShadow: '0 12px 50px rgba(0,0,0,0.12)' }}>
      {seanceDuJour ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: '#FF8C42' }} />
            <span className="text-sm font-bold" style={{ color: '#FF8C42' }}>Séance aujourd'hui</span>
          </div>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)' }}
            >
              <Dumbbell className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg md:text-xl font-bold" style={{ color: '#1A2B4A' }}>{seanceDuJour.type}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm" style={{ color: '#6B7A8D' }}>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} style={{ color: '#FF8C42' }} />{seanceDuJour.heure?.slice(0, 5)}
                </span>
                {seanceDuJour.duree > 0 && <span>{seanceDuJour.duree} min</span>}
                {seanceDuJour.lieu && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} style={{ color: '#FF8C42' }} />{seanceDuJour.lieu}
                  </span>
                )}
              </div>
              {seanceDuJour.coach && (
                <p className="text-xs mt-1" style={{ color: '#6B7A8D' }}>
                  Avec {seanceDuJour.coach.prenom} {seanceDuJour.coach.nom}
                </p>
              )}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full mt-4 py-3.5 min-h-[44px] rounded-2xl font-bold text-white flex items-center justify-center gap-2 md:hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)', boxShadow: '0 6px 20px rgba(255,140,66,0.35)' }}
          >
            Commencer la séance <ArrowRight size={18} strokeWidth={2.5} />
          </motion.button>
        </>
      ) : (
        <div className="text-center py-2">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl mb-3"
          >🧘</motion.div>
          <h3 className="font-bold text-lg" style={{ color: '#1A2B4A' }}>Jour de repos</h3>
          <p className="text-sm mt-1 mb-4" style={{ color: '#6B7A8D' }}>
            Profite bien ! La récupération fait partie du sport.
          </p>
          <Link to="/client/programme">
            <motion.span
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-2xl font-semibold text-sm cursor-pointer"
              style={{ backgroundColor: '#F0FAF7', color: '#00C896' }}
            >
              Voir mon programme <ChevronRight size={16} />
            </motion.span>
          </Link>
        </div>
      )}
    </div>
  );

  // ─── 3 stats ─────────────────────────────────────────────────
  const statsCards = (
    <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 md:gap-3">
      {[
        {
          icon: <Trophy size={20} style={{ color: '#FF8C42' }} />,
          value: <>{seancesFaites}<span className="text-sm font-normal" style={{ color: '#6B7A8D' }}>/{seancesTotal}</span></>,
          label: 'Séances',
        },
        {
          icon: <Flame size={20} style={{ color: '#FF8C42' }} />,
          value: <>{streak}</>,
          label: 'Jours 🔥',
        },
        {
          icon: <CircleProgress percent={progressProgramme} />,
          value: null,
          label: 'Objectif',
          isCircle: true,
        },
      ].map((stat, i) => (
        <motion.div
          key={i}
          whileTap={{ scale: 0.97 }}
          className={`bg-white rounded-2xl p-3 md:p-4 md:hover:shadow-lg transition-shadow cursor-default ${stat.isCircle ? 'flex flex-col items-center justify-center gap-1' : ''}`}
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        >
          {stat.isCircle ? (
            <>
              {stat.icon}
              <p className="text-xs" style={{ color: '#6B7A8D' }}>{stat.label}</p>
            </>
          ) : (
            <>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-3"
                style={{ backgroundColor: 'rgba(255,140,66,0.1)' }}>
                {stat.icon}
              </div>
              <p className="text-xl md:text-2xl font-bold leading-none" style={{ color: '#1A2B4A' }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: '#6B7A8D' }}>{stat.label}</p>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );

  // ─── Programme ───────────────────────────────────────────────
  const programmeSection = (
    <motion.div variants={itemVariants}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-bold" style={{ color: '#1A2B4A' }}>Mon programme</h2>
        <Link to="/client/programme">
          <span className="flex items-center gap-0.5 text-sm font-semibold" style={{ color: '#FF8C42' }}>
            Voir tout <ChevronRight size={16} />
          </span>
        </Link>
      </div>

      {!programme ? (
        <div
          className="rounded-3xl p-6 md:p-8 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(0,200,150,0.06) 0%, rgba(0,229,255,0.06) 100%)', border: '1.5px dashed rgba(0,200,150,0.25)' }}
        >
          <div className="text-3xl mb-2">🏋️</div>
          <p className="font-semibold" style={{ color: '#1A2B4A' }}>Programme en cours de préparation</p>
          <p className="text-sm mt-1" style={{ color: '#6B7A8D' }}>Ton coach prépare un programme sur mesure</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-4 md:p-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00C896 0%, #00E5FF 100%)' }}>
              <Dumbbell className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: '#1A2B4A' }}>{programme.nom || 'Programme actif'}</h3>
              <p className="text-sm" style={{ color: '#6B7A8D' }}>
                {exercices.length} exercice{exercices.length !== 1 ? 's' : ''}
                {programme.duree_semaines ? ` · ${programme.duree_semaines} sem.` : ''}
              </p>
            </div>
            {exercices.length > 0 && (
              <span className="font-bold" style={{ color: '#FF8C42' }}>{exercicesFaits}/{exercices.length}</span>
            )}
          </div>

          {exercices.length > 0 && (
            <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: '#F0FAF7' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00C896, #00E5FF)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((exercicesFaits / exercices.length) * 100)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          )}

          <div className="space-y-2">
            {exercices.slice(0, 4).map((ex, idx) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleExercice(ex.id)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer md:hover:bg-gray-50 transition-colors"
                style={{ backgroundColor: ex.fait ? 'rgba(0,200,150,0.07)' : '#F8FAFB' }}
              >
                <motion.div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: ex.fait ? '#00C896' : 'white', border: ex.fait ? 'none' : '2px solid #E0E0E0' }}
                  whileTap={{ scale: 0.85 }}
                >
                  <AnimatePresence>
                    {ex.fait && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring' as const, stiffness: 600 }}
                      >
                        <Check size={13} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${ex.fait ? 'line-through' : ''}`}
                    style={{ color: ex.fait ? '#6B7A8D' : '#1A2B4A' }}>{ex.nom}</p>
                  <p className="text-xs" style={{ color: '#6B7A8D' }}>{ex.series} séries × {ex.reps}</p>
                </div>
              </motion.div>
            ))}
            {exercices.length > 4 && (
              <Link to="/client/programme">
                <p className="text-center text-sm font-semibold pt-1" style={{ color: '#00C896' }}>
                  + {exercices.length - 4} exercice{exercices.length - 4 > 1 ? 's' : ''} de plus
                </p>
              </Link>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div style={{ backgroundColor: '#F0FAF7' }}>
      {/* ══════════════════════════════════════
          HEADER IMMERSIF
          Mobile : dégradé courbe, 35% écran
          Desktop : bandeau horizontal 200px
      ══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-b-[44px] md:rounded-none"
        style={{ background: 'linear-gradient(135deg, #00C896 0%, #00E5FF 100%)' }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute right-[-30px] top-[-30px] w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="absolute right-10 bottom-[-20px] w-24 h-24 rounded-full opacity-[0.06] bg-white" />

        {/* Safe area iOS (mobile uniquement) */}
        <div className="md:hidden" style={{ height: 'env(safe-area-inset-top, 0px)' }} />

        {/* Contenu header centré */}
        <div className="max-w-full md:max-w-[700px] lg:max-w-[1100px] mx-auto px-5 md:px-8 lg:px-12 pt-10 md:pt-0 pb-16 md:pb-0 md:min-h-[200px] md:flex md:flex-col md:justify-center relative">
          {/* Logo mobile */}
          <div className="flex items-center gap-1.5 mb-5 md:hidden">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M16 28C16 28 4 20 4 12C4 8 7 5 11 5C13.5 5 15.5 6.5 16 8C16.5 6.5 18.5 5 21 5C25 5 28 8 28 12C28 20 16 28 16 28Z" fill="rgba(255,255,255,0.85)" />
            </svg>
            <span className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>MyCareCoach</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-sm font-medium capitalize" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
              Bonjour {client.prenom} 👋
            </h1>
            <p className="text-sm italic mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              "{citation}"
            </p>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CONTENU — max-width centré
      ══════════════════════════════════════ */}
      <div className="max-w-full md:max-w-[700px] lg:max-w-[1100px] mx-auto px-4 md:px-8 lg:px-12">

        {/* Carte séance
            Mobile : -mt-11 (chevauche le header)
            Desktop : mt-6 (suit normalement) */}
        <motion.div
          className="-mt-11 md:mt-6"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring' as const, stiffness: 300, damping: 25 }}
        >
          {seanceCard}
        </motion.div>

        {/* ── Layout principal ──
            Mobile : colonne unique
            Desktop lg : 2 colonnes (séance+prog à gauche, stats à droite) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-5 lg:grid lg:grid-cols-5 lg:gap-6 space-y-5 lg:space-y-0"
        >
          {/* Colonne gauche (lg : 60%) */}
          <div className="lg:col-span-3 space-y-5">
            {programmeSection}
          </div>

          {/* Colonne droite (lg : 40%) */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            {statsCards}
          </motion.div>
        </motion.div>

        {/* Espace bottom nav */}
        <div className="h-4" />
      </div>
    </div>
  );
}
