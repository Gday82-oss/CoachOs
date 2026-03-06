import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Clock, CheckCircle2, Play, Flame, TrendingUp,
  Activity, Zap, Timer
} from 'lucide-react';

interface ClientProgrammeMobileProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
  };
}

interface Exercice {
  id: string;
  nom: string;
  series: number;
  reps: string;
  poids?: string;
  fait: boolean;
  categorie: 'pectoraux' | 'dos' | 'jambes' | 'epaules' | 'bras' | 'cardio' | 'core';
  repos: number;
}

interface JourProgramme {
  jour: string;
  nom: string;
  duree: number;
  exercices: number;
  fait: boolean;
  actif: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
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

const exercicesDemo: Exercice[] = [
  { id: '1', nom: 'Développé couché', series: 4, reps: '10-12', poids: '60kg', fait: true, categorie: 'pectoraux', repos: 90 },
  { id: '2', nom: 'Écartés haltères', series: 3, reps: '12-15', poids: '20kg', fait: true, categorie: 'pectoraux', repos: 60 },
  { id: '3', nom: 'Dips prise large', series: 3, reps: '10-12', fait: false, categorie: 'pectoraux', repos: 60 },
  { id: '4', nom: 'Rowing barre', series: 4, reps: '10-12', poids: '50kg', fait: false, categorie: 'dos', repos: 90 },
  { id: '5', nom: 'Tirage horizontal', series: 3, reps: '12-15', poids: '45kg', fait: false, categorie: 'dos', repos: 60 },
  { id: '6', nom: 'Curl biceps', series: 3, reps: '12-15', poids: '12kg', fait: false, categorie: 'bras', repos: 45 },
];

const semaineDemo: JourProgramme[] = [
  { jour: 'Lun', nom: 'Pectoraux & Dos', duree: 60, exercices: 6, fait: true, actif: false },
  { jour: 'Mar', nom: 'Repos actif', duree: 30, exercices: 0, fait: true, actif: false },
  { jour: 'Mer', nom: 'Jambes & Core', duree: 75, exercices: 8, fait: false, actif: true },
  { jour: 'Jeu', nom: 'Repos', duree: 0, exercices: 0, fait: false, actif: false },
  { jour: 'Ven', nom: 'Épaules & Bras', duree: 60, exercices: 7, fait: false, actif: false },
  { jour: 'Sam', nom: 'Cardio', duree: 45, exercices: 0, fait: false, actif: false },
  { jour: 'Dim', nom: 'Repos', duree: 0, exercices: 0, fait: false, actif: false },
];

const getCategorieIcon = (categorie: string) => {
  switch (categorie) {
    case 'pectoraux': return { icon: Dumbbell, color: 'bg-blue-100 text-blue-600', label: 'Pecs' };
    case 'dos': return { icon: Activity, color: 'bg-purple-100 text-purple-600', label: 'Dos' };
    case 'jambes': return { icon: Zap, color: 'bg-orange-100 text-orange-600', label: 'Jambes' };
    case 'epaules': return { icon: Dumbbell, color: 'bg-pink-100 text-pink-600', label: 'Épaules' };
    case 'bras': return { icon: Dumbbell, color: 'bg-green-100 text-green-600', label: 'Bras' };
    case 'cardio': return { icon: Flame, color: 'bg-red-100 text-red-600', label: 'Cardio' };
    case 'core': return { icon: Activity, color: 'bg-teal-100 text-teal-600', label: 'Core' };
    default: return { icon: Dumbbell, color: 'bg-gray-100 text-gray-600', label: 'Autre' };
  }
};

export default function ClientProgrammeMobile({ client: _client }: ClientProgrammeMobileProps) {
  const [exercices, setExercices] = useState<Exercice[]>(exercicesDemo);
  const [activeTab, setActiveTab] = useState<'aujourdhui' | 'semaine'>('aujourdhui');
  const [timerActive, setTimerActive] = useState<string | null>(null);

  const toggleExercice = (id: string) => {
    setExercices(prev => prev.map(e => 
      e.id === id ? { ...e, fait: !e.fait } : e
    ));
  };

  const exercicesFaits = exercices.filter(e => e.fait).length;
  const progressExercices = Math.round((exercicesFaits / exercices.length) * 100);

  const tempsTotal = exercices.reduce((acc, e) => acc + (e.fait ? 0 : e.repos + 45), 0);
  const tempsEcoule = exercices.reduce((acc, e) => acc + (e.fait ? 45 + e.repos : 0), 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pt-2"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-800">Mon programme</h1>
        <p className="text-gray-500 text-sm mt-1">
          Programme prise de masse - Semaine 3
        </p>
      </motion.div>

      {/* Carte programme actif */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-br from-[#00C896] via-[#00D4A8] to-[#00E5FF] rounded-3xl p-6 text-white shadow-2xl shadow-[#00C896]/30">
          <div className="flex items-start justify-between mb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-xs font-semibold">
                <Flame size={14} />
                En cours
              </span>
              <h2 className="text-xl font-bold mt-3">Pectoraux & Dos</h2>
              <p className="text-white/80 text-sm">Séance 3 sur 4 cette semaine</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Dumbbell size={28} />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Progression séance</span>
              <span className="font-bold">{progressExercices}%</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressExercices}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
              <Clock size={16} />
              <span>{Math.floor(tempsTotal / 60)} min restantes</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
              <CheckCircle2 size={16} />
              <span>{exercicesFaits}/{exercices.length} exercices</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats rapides */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-2">
              <Flame className="text-orange-500" size={20} />
            </div>
            <p className="text-xl font-bold text-gray-800">340</p>
            <p className="text-xs text-gray-500">Kcal brûlées</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
              <Timer className="text-blue-500" size={20} />
            </div>
            <p className="text-xl font-bold text-gray-800">{Math.floor(tempsEcoule / 60)}</p>
            <p className="text-xs text-gray-500">Min réalisées</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-2">
              <TrendingUp className="text-purple-500" size={20} />
            </div>
            <p className="text-xl font-bold text-gray-800">+5%</p>
            <p className="text-xs text-gray-500">Volume total</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="bg-white rounded-2xl p-1.5 shadow-lg border border-gray-50 flex">
          {(['aujourdhui', 'semaine'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-[#00C896] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'aujourdhui' ? 'Aujourd\'hui' : 'Ma semaine'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Contenu des tabs */}
      <motion.div variants={itemVariants}>
        <AnimatePresence mode="wait">
          {activeTab === 'aujourdhui' ? (
            <motion.div
              key="aujourdhui"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {exercices.map((exercice, idx) => {
                const categorieInfo = getCategorieIcon(exercice.categorie);
                const Icon = categorieInfo.icon;
                
                return (
                  <motion.div
                    key={exercice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleExercice(exercice.id)}
                    className={`bg-white rounded-2xl p-4 shadow-md border-2 cursor-pointer transition-all ${
                      exercice.fait 
                        ? 'border-green-200 bg-green-50/30' 
                        : 'border-transparent hover:border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox animée */}
                      <motion.div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          exercice.fait 
                            ? 'bg-green-500' 
                            : 'bg-gray-100 border-2 border-gray-300'
                        }`}
                        whileTap={{ scale: 0.8 }}
                      >
                        <AnimatePresence>
                          {exercice.fait && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring' as const, stiffness: 500 }}
                            >
                              <CheckCircle2 size={18} className="text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      
                      {/* Info exercice */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold transition-all ${exercice.fait ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {exercice.nom}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{exercice.series} séries</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>{exercice.reps} reps</span>
                          {exercice.poids && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span className="font-medium text-[#00C896]">{exercice.poids}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Icône catégorie */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${categorieInfo.color}`}>
                        <Icon size={18} />
                      </div>
                    </div>

                    {/* Temps de repos */}
                    {!exercice.fait && idx < exercices.length - 1 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Timer size={14} />
                          <span>Repos: {exercice.repos}s</span>
                        </div>
                        {timerActive === exercice.id ? (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); setTimerActive(null); }}
                            className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold"
                          >
                            Arrêter
                          </motion.button>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); setTimerActive(exercice.id); }}
                            className="px-3 py-1.5 bg-[#00C896]/10 text-[#00C896] rounded-lg text-xs font-semibold"
                          >
                            Timer
                          </motion.button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Bouton démarrer */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-[#00C896] to-[#00E5FF] text-white rounded-2xl font-bold shadow-lg shadow-[#00C896]/20 flex items-center justify-center gap-2"
              >
                <Play size={20} fill="white" />
                {exercicesFaits === 0 ? 'Démarrer la séance' : 'Continuer'}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="semaine"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {semaineDemo.map((jour, idx) => (
                <motion.div
                  key={jour.jour}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-2xl p-4 border-2 transition-all ${
                    jour.actif 
                      ? 'bg-[#00C896]/5 border-[#00C896]/30' 
                      : jour.fait 
                        ? 'bg-green-50 border-green-100' 
                        : 'bg-white border-gray-100 shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                      jour.actif 
                        ? 'bg-[#00C896] text-white' 
                        : jour.fait 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className="text-xs font-medium">{jour.jour}</span>
                      {jour.fait && !jour.actif && <CheckCircle2 size={16} />}
                    </div>
                    
                    <div className="flex-1">
                      <p className={`font-bold ${jour.actif ? 'text-[#00C896]' : 'text-gray-800'}`}>
                        {jour.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        {jour.exercices > 0 ? `${jour.exercices} exercices • ${jour.duree} min` : 'Jour de repos'}
                      </p>
                    </div>

                    {jour.actif && (
                      <span className="px-2.5 py-1 bg-[#00C896] text-white text-xs font-bold rounded-lg">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Espace pour bottom nav */}
      <div className="h-4" />
    </motion.div>
  );
}
