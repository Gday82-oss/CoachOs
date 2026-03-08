import { useState, useEffect } from 'react';
import { useClientData } from '../../hooks/useClientData';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, CheckCircle2, Play, Flame, Timer, ChevronDown, ChevronUp } from 'lucide-react';

interface ClientProgrammeMobileProps {
  client: { id: string; prenom: string; nom: string };
}

interface Exercice {
  id: string;
  nom: string;
  series: number;
  reps: string;
  poids?: string;
  fait: boolean;
  repos: number;
  expanded: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } },
};

const semaineDemo = [
  { jour: 'Lun', nom: 'Pectoraux & Dos', duree: 60, exercices: 6, fait: true, actif: false },
  { jour: 'Mar', nom: 'Repos actif', duree: 30, exercices: 0, fait: true, actif: false },
  { jour: 'Mer', nom: 'Jambes & Core', duree: 75, exercices: 8, fait: false, actif: true },
  { jour: 'Jeu', nom: 'Repos', duree: 0, exercices: 0, fait: false, actif: false },
  { jour: 'Ven', nom: 'Épaules & Bras', duree: 60, exercices: 7, fait: false, actif: false },
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
      setExercices(programme.exercices.map(e => ({
        id: e.id, nom: e.nom, series: e.series ?? 3,
        reps: e.repetitions ? `${e.repetitions}` : '—',
        poids: e.poids_kg ? `${e.poids_kg} kg` : undefined,
        fait: false, repos: e.repos ?? 60, expanded: false,
      })));
    }
  }, [programme]);

  const toggleExercice = (id: string) =>
    setExercices(prev => prev.map(e => e.id === id ? { ...e, fait: !e.fait } : e));

  const toggleExpand = (id: string) =>
    setExercices(prev => prev.map(e => e.id === id ? { ...e, expanded: !e.expanded } : e));

  const exercicesFaits = exercices.filter(e => e.fait).length;
  const progressPct = exercices.length > 0 ? Math.round((exercicesFaits / exercices.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 rounded-full"
          style={{ borderColor: '#FF8C42', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F0FAF7' }}>
      {/* ══ HEADER ══ */}
      <div
        className="relative overflow-hidden rounded-b-[40px] md:rounded-none"
        style={{ background: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)' }}
      >
        <div className="absolute right-[-20px] top-[-20px] w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="md:hidden" style={{ height: 'env(safe-area-inset-top, 0px)' }} />

        <div className="max-w-full md:max-w-[700px] lg:max-w-[1100px] mx-auto px-5 md:px-8 lg:px-12 pt-10 md:pt-0 pb-8 md:pb-0 md:min-h-[200px] md:flex md:flex-col md:justify-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  <Flame size={12} /> {programme?.statut || 'En cours'}
                </span>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
                  {programme?.nom || 'Mon Programme'}
                </h1>
                <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {programme?.duree_semaines ? `Programme de ${programme.duree_semaines} semaines` : 'Programme personnalisé'}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Dumbbell className="text-white" size={28} />
              </div>
            </div>

            {exercices.length > 0 && (
              <div className="mt-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-white/80">Progression séance</span>
                  <span className="font-bold text-white">{progressPct}%</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full bg-white"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ══ CONTENU ══ */}
      <div className="max-w-full md:max-w-[700px] lg:max-w-[1100px] mx-auto px-4 md:px-8 lg:px-12">

        {/* Tabs */}
        <div className="mt-4 mb-4">
          <div className="flex rounded-2xl p-1.5" style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {(['aujourdhui', 'semaine'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 min-h-[44px] rounded-xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: activeTab === tab ? '#FF8C42' : 'transparent',
                  color: activeTab === tab ? 'white' : '#6B7A8D',
                  boxShadow: activeTab === tab ? '0 4px 12px rgba(255,140,66,0.3)' : 'none',
                }}
              >
                {tab === 'aujourdhui' ? "Aujourd'hui" : 'Ma semaine'}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu tab */}
        <div className="pb-6">
          <AnimatePresence mode="wait">
            {activeTab === 'aujourdhui' ? (
              <motion.div
                key="aujourdhui"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {!programme ? (
                  <div
                    className="rounded-3xl p-10 text-center"
                    style={{ background: 'linear-gradient(135deg, rgba(255,140,66,0.06) 0%, rgba(255,179,71,0.06) 100%)', border: '1.5px dashed rgba(255,140,66,0.3)' }}
                  >
                    <div className="text-4xl mb-3">🏋️</div>
                    <p className="font-bold text-lg" style={{ color: '#1A2B4A' }}>Ton programme arrive bientôt !</p>
                    <p className="text-sm mt-2" style={{ color: '#6B7A8D' }}>Ton coach travaille sur un programme personnalisé</p>
                  </div>
                ) : exercices.length === 0 ? (
                  <div className="text-center py-12">
                    <Dumbbell size={40} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
                    <p style={{ color: '#6B7A8D' }}>Aucun exercice configuré</p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                    {exercices.map((ex, idx) => (
                      <motion.div
                        key={ex.id}
                        variants={itemVariants}
                        className="bg-white rounded-2xl overflow-hidden md:hover:shadow-lg transition-shadow"
                        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: ex.fait ? '4px solid #00C896' : '4px solid transparent' }}
                      >
                        <div className="p-4 md:p-5">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileTap={{ scale: 0.85 }}
                              onClick={() => toggleExercice(ex.id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer"
                              style={{ backgroundColor: ex.fait ? '#00C896' : '#F0FAF7', border: ex.fait ? 'none' : '2px solid #E0E0E0' }}
                            >
                              {ex.fait ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' as const, stiffness: 600 }}>
                                  <CheckCircle2 size={18} className="text-white" />
                                </motion.div>
                              ) : (
                                <span className="text-xs font-bold" style={{ color: '#6B7A8D' }}>{idx + 1}</span>
                              )}
                            </motion.div>

                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExercice(ex.id)}>
                              <p className={`font-bold ${ex.fait ? 'line-through' : ''}`}
                                style={{ color: ex.fait ? '#6B7A8D' : '#1A2B4A' }}>{ex.nom}</p>
                              <p className="text-sm" style={{ color: '#6B7A8D' }}>
                                {ex.series} séries × {ex.reps}
                                {ex.poids && <span className="font-semibold" style={{ color: '#FF8C42' }}> · {ex.poids}</span>}
                              </p>
                            </div>

                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleExpand(ex.id)}
                              className="w-8 h-8 min-h-[44px] min-w-[44px] -m-1 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: '#F0FAF7' }}
                            >
                              {ex.expanded
                                ? <ChevronUp size={16} style={{ color: '#6B7A8D' }} />
                                : <ChevronDown size={16} style={{ color: '#6B7A8D' }} />}
                            </motion.button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {ex.expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <div className="px-4 md:px-5 pb-4 pt-2 border-t" style={{ borderColor: '#F0FAF7' }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm" style={{ color: '#6B7A8D' }}>
                                    <Timer size={15} style={{ color: '#FF8C42' }} />
                                    <span>Repos : <strong style={{ color: '#1A2B4A' }}>{ex.repos}s</strong></span>
                                  </div>
                                  {timerActive === ex.id ? (
                                    <motion.button whileTap={{ scale: 0.97 }}
                                      onClick={() => setTimerActive(null)}
                                      className="px-3 py-1.5 min-h-[36px] rounded-full text-xs font-bold text-white"
                                      style={{ backgroundColor: '#1A2B4A' }}>
                                      Arrêter
                                    </motion.button>
                                  ) : (
                                    <motion.button whileTap={{ scale: 0.97 }}
                                      onClick={() => setTimerActive(ex.id)}
                                      className="px-3 py-1.5 min-h-[36px] rounded-full text-xs font-bold"
                                      style={{ backgroundColor: 'rgba(255,140,66,0.1)', color: '#FF8C42' }}>
                                      Démarrer timer
                                    </motion.button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      className="w-full mt-2 py-4 min-h-[52px] rounded-2xl font-bold text-white flex items-center justify-center gap-2 md:hover:opacity-90 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)', boxShadow: '0 6px 20px rgba(255,140,66,0.35)' }}
                    >
                      <Play size={20} fill="white" />
                      {exercicesFaits === 0 ? 'Démarrer la séance' : `Continuer (${exercicesFaits}/${exercices.length})`}
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="semaine"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {semaineDemo.map(jour => (
                    <motion.div
                      key={jour.jour}
                      variants={itemVariants}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white rounded-2xl p-4 md:p-5 md:hover:shadow-lg transition-shadow"
                      style={{
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        borderLeft: jour.actif ? '4px solid #FF8C42' : jour.fait ? '4px solid #00C896' : '4px solid transparent',
                        opacity: jour.nom === 'Repos' && !jour.actif ? 0.65 : 1,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: jour.actif ? '#FF8C42' : jour.fait ? '#00C896' : '#F0FAF7' }}
                        >
                          <span className="text-xs font-bold" style={{ color: jour.actif || jour.fait ? 'white' : '#6B7A8D' }}>
                            {jour.jour}
                          </span>
                          {jour.fait && !jour.actif && <CheckCircle2 size={12} className="text-white mt-0.5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold" style={{ color: jour.actif ? '#FF8C42' : '#1A2B4A' }}>{jour.nom}</p>
                          <p className="text-sm mt-0.5" style={{ color: '#6B7A8D' }}>
                            {jour.exercices > 0 ? `${jour.exercices} exercices · ${jour.duree} min` : 'Jour de repos'}
                          </p>
                        </div>
                        {jour.actif && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: '#FF8C42' }}>
                            Aujourd'hui
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}
