import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Flame, Target, Trophy,
  Check, Dumbbell, Sparkles, Play
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

interface Exercice {
  id: string;
  nom: string;
  series: number;
  reps: string;
  fait: boolean;
  categorie: 'echauffement' | 'force' | 'cardio' | 'etirement';
}

interface Stats {
  seancesTotal: number;
  seancesFaites: number;
  streak: number;
  objectif: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: 'spring' as const, 
      stiffness: 350, 
      damping: 25 
    }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -2,
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.98 }
};

// Exercices démo
const exercicesDemo: Exercice[] = [
  { id: '1', nom: 'Course légère', series: 1, reps: '10 min', fait: true, categorie: 'echauffement' },
  { id: '2', nom: 'Squats', series: 4, reps: '12 reps', fait: false, categorie: 'force' },
  { id: '3', nom: 'Fentes', series: 3, reps: '10/jambe', fait: false, categorie: 'force' },
  { id: '4', nom: 'Burpees', series: 3, reps: '15 reps', fait: false, categorie: 'cardio' },
  { id: '5', nom: 'Étirements', series: 1, reps: '5 min', fait: false, categorie: 'etirement' },
];

const citations = [
  "Chaque effort compte. Continue comme ça ! 💪",
  "La persévérance bat le talent. 🎯",
  "Tu es plus fort que tu ne le penses. 🔥",
  "Le succès est la somme des petits efforts. ⭐",
];

export default function ClientToday({ client }: ClientTodayProps) {
  const [seanceDuJour, setSeanceDuJour] = useState<Seance | null>(null);
  const [exercices, setExercices] = useState<Exercice[]>(exercicesDemo);
  const [stats, setStats] = useState<Stats>({
    seancesTotal: 0,
    seancesFaites: 0,
    streak: 12,
    objectif: client.objectif || 'Perte de poids'
  });
  const [loading, setLoading] = useState(true);
  const [citation] = useState(() => citations[Math.floor(Math.random() * citations.length)]);

  useEffect(() => {
    fetchTodayData();
  }, [client.id]);

  async function fetchTodayData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Séance du jour
      const { data: seanceData } = await supabase
        .from('seances')
        .select('*, coach:coachs(prenom, nom)')
        .eq('client_id', client.id)
        .eq('date', today)
        .maybeSingle();
      
      setSeanceDuJour(seanceData);

      // Stats séances
      const { data: seances } = await supabase
        .from('seances')
        .select('fait, date')
        .eq('client_id', client.id)
        .order('date', { ascending: false });

      const total = seances?.length || 0;
      const faites = seances?.filter(s => s.fait).length || 0;

      setStats(prev => ({
        ...prev,
        seancesTotal: total,
        seancesFaites: faites,
      }));

    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleExercice = (id: string) => {
    setExercices(prev => prev.map(e => 
      e.id === id ? { ...e, fait: !e.fait } : e
    ));
  };

  const exercicesFaits = exercices.filter(e => e.fait).length;
  const progressProgramme = Math.round((exercicesFaits / exercices.length) * 100);

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-[#00C896] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pt-2"
    >
      {/* Date du jour */}
      <motion.div variants={itemVariants}>
        <p className="text-gray-500 text-sm font-medium capitalize">{todayFormatted}</p>
        <h1 className="text-3xl font-bold text-gray-800 mt-1">
          Aujourd'hui <span className="text-[#00C896]">💪</span>
        </h1>
      </motion.div>

      {/* Carte Séance du jour */}
      <motion.div variants={itemVariants}>
        {seanceDuJour ? (
          <motion.div 
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00C896] via-[#00D4A8] to-[#00E5FF] p-6 text-white shadow-2xl shadow-[#00C896]/30"
          >
            {/* Pattern décoratif */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/30 blur-2xl" />
              <div className="absolute -left-4 -bottom-4 w-32 h-32 rounded-full bg-white/20 blur-xl" />
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2.5 h-2.5 rounded-full bg-white"
                />
                <span className="text-sm font-semibold text-white/95">
                  Séance prévue aujourd'hui
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-1">{seanceDuJour.type}</h2>
              <p className="text-white/80 text-sm mb-5">Avec {seanceDuJour.coach?.prenom} {seanceDuJour.coach?.nom}</p>

              <div className="flex items-center gap-6 text-sm text-white/90 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <span>{seanceDuJour.heure?.slice(0, 5)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <span>{seanceDuJour.duree} min</span>
                </div>
                {seanceDuJour.lieu && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <MapPin size={16} />
                    </div>
                    <span>{seanceDuJour.lieu}</span>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-white text-[#00C896] py-3.5 rounded-xl font-bold shadow-lg"
              >
                <Check size={20} strokeWidth={3} />
                Je confirme ma présence
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            className="rounded-3xl bg-white p-8 text-center shadow-lg border border-gray-100"
          >
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-[#F0FAF7] flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles className="text-[#00C896]" size={32} />
            </motion.div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">Pas de séance aujourd'hui</h3>
            <p className="text-sm text-gray-500">Profite de ton repos ! 🌿</p>
          </motion.div>
        )}
      </motion.div>

      {/* 3 mini stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-3">
          {/* Séances */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Trophy className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.seancesFaites}
              <span className="text-sm font-normal text-gray-400">/{stats.seancesTotal}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Séances</p>
          </motion.div>

          {/* Streak */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
              <Flame className="text-orange-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.streak}</p>
            <p className="text-xs text-gray-500 mt-0.5">Jours 🔥</p>
          </motion.div>

          {/* Objectif */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 flex items-center justify-center mb-3">
              <Target className="text-[#00C896]" size={20} />
            </div>
            <p className="text-lg font-bold text-gray-800 truncate">
              68%
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{stats.objectif}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Programme du jour */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Programme du jour</h2>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#00C896] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressProgramme}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <span className="text-xs font-semibold text-[#00C896]">{progressProgramme}%</span>
          </div>
        </div>

        <motion.div 
          className="bg-white rounded-3xl p-5 shadow-lg border border-gray-50"
          variants={cardHoverVariants}
          initial="rest"
          whileHover="hover"
        >
          <div className="space-y-3">
            {exercices.map((exercice, idx) => (
              <motion.div
                key={exercice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleExercice(exercice.id)}
                className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all duration-300 ${
                  exercice.fait 
                    ? 'bg-green-50 border border-green-100' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <motion.div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    exercice.fait 
                      ? 'bg-green-500 scale-110' 
                      : 'bg-white border-2 border-gray-300'
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  <AnimatePresence>
                    {exercice.fait && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: 'spring' as const, stiffness: 500, damping: 25 }}
                      >
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm transition-all duration-300 ${
                    exercice.fait ? 'text-gray-400 line-through' : 'text-gray-800'
                  }`}>
                    {exercice.nom}
                  </p>
                  <p className="text-xs text-gray-400">
                    {exercice.series} séries × {exercice.reps}
                  </p>
                </div>

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  exercice.categorie === 'echauffement' ? 'bg-yellow-100 text-yellow-600' :
                  exercice.categorie === 'force' ? 'bg-purple-100 text-purple-600' :
                  exercice.categorie === 'cardio' ? 'bg-red-100 text-red-600' :
                  'bg-teal-100 text-teal-600'
                }`}>
                  <Dumbbell size={14} />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-[#00C896] to-[#00E5FF] text-white rounded-xl font-semibold shadow-lg shadow-[#00C896]/20 flex items-center justify-center gap-2"
          >
            <Play size={18} fill="white" />
            Démarrer la séance
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Carte motivation */}
      <motion.div variants={itemVariants}>
        <motion.div 
          className="rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 text-white relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
        >
          {/* Décorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-5 -mb-5" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-yellow-300" />
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Motivation</span>
            </div>
            <p className="font-medium text-lg leading-relaxed">
              "{citation}"
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Espace supplémentaire pour le bottom nav */}
      <div className="h-4" />
    </motion.div>
  );
}
