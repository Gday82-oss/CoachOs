import { useState, useEffect } from 'react';
import { useClientData } from '../../hooks/useClientData';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, CheckCircle2, Play, Flame, Timer } from 'lucide-react';

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

const semaineDemo: JourProgramme[] = [
  { jour: 'Lun', nom: 'Pectoraux & Dos', duree: 60, exercices: 6, fait: true, actif: false },
  { jour: 'Mar', nom: 'Repos actif', duree: 30, exercices: 0, fait: true, actif: false },
  { jour: 'Mer', nom: 'Jambes & Core', duree: 75, exercices: 8, fait: false, actif: true },
  { jour: 'Jeu', nom: 'Repos', duree: 0, exercices: 0, fait: false, actif: false },
  { jour: 'Ven', nom: 'Epaules & Bras', duree: 60, exercices: 7, fait: false, actif: false },
  { jour: 'Sam', nom: 'Cardio', duree: 45, exercices: 0, fait: false, actif: false },
  { jour: 'Dim', nom: 'Repos', duree: 0, exercices: 0, fait: false, actif: false },
];

export default function ClientProgrammeMobile({ client }: ClientProgrammeMobileProps) {
  const { programme, loading } = useClientData(client.id);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [activeTab, setActiveTab] = useState<'aujourdhui' | 'semaine'>('aujourdhui');
  const [timerActive, setTimerActive] = useState<string | null>(null);

  useEffect(() => {
    if (programme?.exercices) {
      setExercices(
        programme.exercices.map(e => ({
          id: e.id,
          nom: e.nom,
          series: e.series ?? 3,
          reps: e.repetitions ? `${e.repetitions}` : '—',
          poids: e.poids_kg ? `${e.poids_kg}kg` : undefined,
          fait: false,
          repos: e.repos ?? 60,
        }))
      );
    }
  }, [programme]);

  const toggleExercice = (id: string) => {
    setExercices(prev => prev.map(e =>
      e.id === id ? { ...e, fait: !e.fait } : e
    ));
  };

  const exercicesFaits = exercices.filter(e => e.fait).length;
  const progressExercices = exercices.length > 0
    ? Math.round((exercicesFaits / exercices.length) * 100)
    : 0;

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
      {/* Header orange */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-3xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20">
                <Flame size={14} />
                {programme?.statut || 'En cours'}
              </span>
              <h1 className="text-2xl font-bold mt-3">
                {programme?.nom || 'Mon Programme'}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {programme?.duree_semaines ? `${programme.duree_semaines} semaines` : 'Programme actif'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Dumbbell size={28} />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Progression</span>
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
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-2xl p-1.5 flex"
          style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {(['aujourdhui', 'semaine'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab ? '#FF8C42' : 'transparent',
                color: activeTab === tab ? 'white' : '#6B7A8D'
              }}
            >
              {tab === 'aujourdhui' ? "Aujourd'hui" : 'Ma semaine'}
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {exercices.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell size={40} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
                  <p style={{ color: '#6B7A8D' }}>Aucun exercice dans le programme</p>
                </div>
              ) : (
                exercices.map((exercice, idx) => (
                  <motion.div
                    key={exercice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleExercice(exercice.id)}
                    className="rounded-2xl p-4 cursor-pointer"
                    style={{
                      backgroundColor: 'white',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      borderLeft: exercice.fait ? '4px solid #FF8C42' : '4px solid transparent'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: exercice.fait ? '#FF8C42' : 'white',
                          border: exercice.fait ? 'none' : '2px solid #E0E0E0'
                        }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <AnimatePresence>
                          {exercice.fait && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring' as const, stiffness: 500 }}
                            >
                              <CheckCircle2 size={16} className="text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-bold transition-all ${exercice.fait ? 'line-through' : ''}`}
                          style={{ color: exercice.fait ? '#6B7A8D' : '#1A2B4A' }}
                        >
                          {exercice.nom}
                        </p>
                        <p className="text-sm" style={{ color: '#6B7A8D' }}>
                          {exercice.series} series x {exercice.reps}
                          {exercice.poids && (
                            <span style={{ color: '#FF8C42', fontWeight: 600 }}> • {exercice.poids}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {!exercice.fait && idx < exercices.length - 1 && (
                      <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: '#F0FAF7' }}>
                        <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7A8D' }}>
                          <Timer size={14} style={{ color: '#FF8C42' }} />
                          <span>Repos: {exercice.repos}s</span>
                        </div>
                        {timerActive === exercice.id ? (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => { e.stopPropagation(); setTimerActive(null); }}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: '#1A2B4A' }}
                          >
                            Arreter
                          </motion.button>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => { e.stopPropagation(); setTimerActive(exercice.id); }}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)', color: '#FF8C42' }}
                          >
                            Demarrer timer
                          </motion.button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(90deg, #00C896, #00E5FF)',
                  boxShadow: '0 4px 15px rgba(0, 200, 150, 0.3)'
                }}
              >
                <Play size={20} fill="white" />
                {exercicesFaits === 0 ? 'Demarrer la seance' : 'Continuer'}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="semaine"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {semaineDemo.map((jour, idx) => (
                <motion.div
                  key={jour.jour}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: 'white',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                    borderLeft: jour.actif ? '4px solid #FF8C42' : '4px solid transparent',
                    opacity: jour.fait ? 0.7 : 1
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: jour.actif ? '#FF8C42' : jour.fait ? '#00C896' : '#F0FAF7'
                      }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: jour.actif || jour.fait ? 'white' : '#6B7A8D' }}
                      >
                        {jour.jour}
                      </span>
                      {jour.fait && !jour.actif && <CheckCircle2 size={14} className="text-white" />}
                    </div>

                    <div className="flex-1">
                      <p
                        className="font-bold"
                        style={{ color: jour.actif ? '#FF8C42' : '#1A2B4A' }}
                      >
                        {jour.nom}
                      </p>
                      <p className="text-sm" style={{ color: '#6B7A8D' }}>
                        {jour.exercices > 0 ? `${jour.exercices} exercices • ${jour.duree} min` : 'Jour de repos'}
                      </p>
                    </div>

                    {jour.actif && (
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: '#FF8C42' }}
                      >
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
