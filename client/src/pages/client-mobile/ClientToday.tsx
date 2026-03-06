import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useClientData, calcStreak } from '../../hooks/useClientData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, MapPin, Flame, Target, Trophy,
  Check, Dumbbell, Sparkles, Play, ChevronRight
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
  coach?: {
    prenom: string;
    nom: string;
  };
}

interface ExerciceLocal {
  id: string;
  nom: string;
  series: number;
  reps: string;
  fait: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 350, damping: 25 }
  }
};

const citations = [
  "Chaque effort compte. Continue comme ca !",
  "La perseverance bat le talent.",
  "Tu es plus fort que tu ne le penses.",
  "Le succes est la somme des petits efforts.",
];

export default function ClientToday({ client }: ClientTodayProps) {
  const { seances, programme, loading: dataLoading } = useClientData(client.id);
  const [seanceDuJour, setSeanceDuJour] = useState<Seance | null>(null);
  const [exercices, setExercices] = useState<ExerciceLocal[]>([]);
  const [loadingSeance, setLoadingSeance] = useState(true);
  const [citation] = useState(() => citations[Math.floor(Math.random() * citations.length)]);

  // Dérive les stats depuis les vraies données
  const seancesFaites = seances.filter(s => s.fait).length;
  const seancesTotal = seances.length;
  const streak = calcStreak(seances);
  const objectif = client.objectif || 'Renforcement musculaire';

  // Synchronise les exercices du programme actif
  useEffect(() => {
    if (programme?.exercices) {
      setExercices(
        programme.exercices.map(e => ({
          id: e.id,
          nom: e.nom,
          series: e.series ?? 3,
          reps: e.repetitions ? `${e.repetitions} reps` : '—',
          fait: false,
        }))
      );
    }
  }, [programme]);

  useEffect(() => {
    fetchTodaySeance();
  }, [client.id]);

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
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoadingSeance(false);
    }
  }

  const toggleExercice = (id: string) => {
    setExercices(prev => prev.map(e =>
      e.id === id ? { ...e, fait: !e.fait } : e
    ));
  };

  const exercicesFaits = exercices.filter(e => e.fait).length;
  const progressProgramme = exercices.length > 0
    ? Math.round((exercicesFaits / exercices.length) * 100)
    : 0;

  const loading = loadingSeance || dataLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 rounded-full"
          style={{ borderColor: '#FF8C42', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 pt-6"
    >
      {/* Carte Séance du jour */}
      <motion.div variants={itemVariants}>
        {seanceDuJour ? (
          <div 
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{ 
              backgroundColor: 'white',
              borderLeft: '4px solid #FF8C42',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: '#FF8C42' }}
              />
              <span className="text-sm font-semibold" style={{ color: '#FF8C42' }}>
                Séance aujourd'hui
              </span>
            </div>

            <h2 className="text-xl font-bold mb-1" style={{ color: '#1A2B4A' }}>
              {seanceDuJour.type}
            </h2>
            <p className="text-sm mb-4" style={{ color: '#6B7A8D' }}>
              Avec {seanceDuJour.coach?.prenom} {seanceDuJour.coach?.nom}
            </p>

            <div className="flex items-center gap-4 text-sm mb-5" style={{ color: '#6B7A8D' }}>
              <div className="flex items-center gap-1.5">
                <Clock size={16} style={{ color: '#FF8C42' }} />
                <span>{seanceDuJour.heure?.slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={16} style={{ color: '#FF8C42' }} />
                <span>{seanceDuJour.lieu || 'Salle de sport'}</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: '#FF8C42',
                boxShadow: '0 4px 15px rgba(255, 140, 66, 0.3)'
              }}
            >
              <Check size={20} strokeWidth={3} />
              Je confirme ma présence
            </motion.button>
          </div>
        ) : (
          <div 
            className="rounded-3xl p-6 text-center"
            style={{ 
              backgroundColor: 'white',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}
          >
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#F0FAF7' }}
            >
              <Sparkles size={28} style={{ color: '#00C896' }} />
            </motion.div>
            <h3 className="font-bold text-lg mb-1" style={{ color: '#1A2B4A' }}>
              Pas de séance aujourd'hui
            </h3>
            <p style={{ color: '#6B7A8D' }}>Profite de ton repos ! 🌿</p>
          </div>
        )}
      </motion.div>

      {/* 3 Stats cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-3">
          {/* Séances */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="rounded-2xl p-4"
            style={{ 
              backgroundColor: 'white',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)' }}
            >
              <Trophy size={20} style={{ color: '#FF8C42' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
              {seancesFaites}
              <span className="text-sm font-normal" style={{ color: '#6B7A8D' }}>/{seancesTotal}</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>Séances</p>
          </motion.div>

          {/* Streak */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="rounded-2xl p-4"
            style={{ 
              backgroundColor: 'white',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)' }}
            >
              <Flame size={20} style={{ color: '#FF8C42' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>{streak}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>Jours 🔥</p>
          </motion.div>

          {/* Objectif */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="rounded-2xl p-4"
            style={{ 
              backgroundColor: 'white',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)' }}
            >
              <Target size={20} style={{ color: '#FF8C42' }} />
            </div>
            <p className="text-lg font-bold truncate" style={{ color: '#1A2B4A' }}>68%</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7A8D' }}>{objectif}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Programme du jour */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>Programme du jour</h2>
          <ChevronRight size={16} style={{ color: '#FF8C42' }} />
        </div>

        {!programme ? (
          <div
            className="rounded-3xl p-6 text-center"
            style={{ backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}
          >
            <Dumbbell size={28} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
            <p style={{ color: '#6B7A8D' }}>Aucun programme actif</p>
          </div>
        ) : (
        <div
          className="rounded-3xl p-5"
          style={{
            backgroundColor: 'white',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00C896 0%, #00E5FF 100%)'
              }}
            >
              <Dumbbell className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: '#1A2B4A' }}>
                {programme?.nom || 'Programme actif'}
              </h3>
              <p className="text-sm" style={{ color: '#6B7A8D' }}>
                {programme?.duree_semaines ? `${programme.duree_semaines} sem. • ` : ''}{exercices.length} exercice{exercices.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div 
              className="text-lg font-bold"
              style={{ color: '#FF8C42' }}
            >
              {progressProgramme}%
            </div>
          </div>

          {/* Barre de progression */}
          <div className="h-2 rounded-full overflow-hidden mb-4" style={{ backgroundColor: '#F0FAF7' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ 
                background: 'linear-gradient(90deg, #00C896, #FF8C42)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressProgramme}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>

          <div className="space-y-2">
            {exercices.map((exercice, idx) => (
              <motion.div
                key={exercice.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleExercice(exercice.id)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                style={{ 
                  backgroundColor: exercice.fait ? 'rgba(0, 200, 150, 0.08)' : '#F8FAFB'
                }}
              >
                <motion.div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: exercice.fait ? '#FF8C42' : 'white',
                    border: exercice.fait ? 'none' : '2px solid #E0E0E0'
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <AnimatePresence>
                    {exercice.fait && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    className={`font-semibold text-sm ${exercice.fait ? 'line-through' : ''}`}
                    style={{ color: exercice.fait ? '#6B7A8D' : '#1A2B4A' }}
                  >
                    {exercice.nom}
                  </p>
                  <p className="text-xs" style={{ color: '#6B7A8D' }}>
                    {exercice.series} séries × {exercice.reps}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full mt-4 py-3.5 rounded-full font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(90deg, #00C896, #00E5FF)',
              boxShadow: '0 4px 15px rgba(0, 200, 150, 0.3)'
            }}
          >
            <Play size={18} fill="white" />
            Démarrer la séance
          </motion.button>
        </div>
        )}
      </motion.div>

      {/* Carte motivation */}
      <motion.div variants={itemVariants}>
        <div 
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)'
          }}
        >
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-white" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                Motivation
              </span>
            </div>
            <p className="font-semibold text-lg text-white leading-relaxed">
              "{citation}"
            </p>
          </div>
        </div>
      </motion.div>

      {/* Espace pour bottom nav */}
      <div className="h-4" />
    </motion.div>
  );
}
