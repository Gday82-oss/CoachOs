import { useState } from 'react';
import { useClientData, getStatutSeance } from '../../hooks/useClientData';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

interface ClientSeancesMobileProps {
  client: { id: string; prenom: string; nom: string };
}

interface SeanceDisplay {
  id: string;
  date: string;
  heure: string;
  duree: number;
  type: string;
  statut: 'a_venir' | 'faite' | 'passee';
  lieu?: string;
  coach?: { prenom: string; nom: string };
}

type FilterKey = 'toutes' | 'semaine' | 'avenir' | 'passees';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'semaine', label: 'Cette semaine' },
  { key: 'avenir', label: 'À venir' },
  { key: 'passees', label: 'Terminées' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } },
};

function getStatutConfig(statut: string, isToday: boolean) {
  if (isToday && statut === 'a_venir') {
    return { borderColor: '#FF8C42', badgeBg: 'rgba(255,140,66,0.12)', badgeColor: '#FF8C42', badge: "Aujourd'hui", dateBg: '#FF8C42', dateTextColor: 'white' };
  }
  switch (statut) {
    case 'faite':
      return { borderColor: '#00C896', badgeBg: 'rgba(0,200,150,0.12)', badgeColor: '#00C896', badge: 'Réalisée ✓', dateBg: '#00C896', dateTextColor: 'white' };
    case 'passee':
      return { borderColor: '#E5E7EB', badgeBg: '#F3F4F6', badgeColor: '#9CA3AF', badge: 'Manquée', dateBg: '#F0F0F0', dateTextColor: '#6B7A8D' };
    default:
      return { borderColor: '#FF8C42', badgeBg: 'rgba(255,140,66,0.12)', badgeColor: '#FF8C42', badge: 'À venir', dateBg: 'rgba(255,140,66,0.12)', dateTextColor: '#FF8C42' };
  }
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day + (day === 0 ? -6 : 1));
  return copy.toISOString().split('T')[0];
}

export default function ClientSeancesMobile({ client }: ClientSeancesMobileProps) {
  const { seances: rawSeances, loading } = useClientData(client.id);
  const [filter, setFilter] = useState<FilterKey>('toutes');

  const today = new Date().toISOString().split('T')[0];
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const seances: SeanceDisplay[] = rawSeances.map(s => ({
    id: s.id, date: s.date, heure: s.heure, duree: s.duree ?? 0,
    type: s.type, statut: getStatutSeance(s), lieu: s.lieu, coach: s.coach,
  }));

  const aVenir = seances.filter(s => s.statut === 'a_venir').length;
  const faites = seances.filter(s => s.statut === 'faite').length;

  const filtered = seances.filter(s => {
    if (filter === 'avenir') return s.statut === 'a_venir';
    if (filter === 'passees') return s.statut === 'faite' || s.statut === 'passee';
    if (filter === 'semaine') return s.date >= weekStart && s.date <= weekEnd;
    return true;
  });

  const groupByMonth = (list: SeanceDisplay[]) => {
    const grouped: Record<string, SeanceDisplay[]> = {};
    list.forEach(s => {
      const key = new Date(s.date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      grouped[key] = grouped[key] ? [...grouped[key], s] : [s];
    });
    return grouped;
  };

  const grouped = groupByMonth(filtered);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 rounded-full"
          style={{ borderColor: '#00C896', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F0FAF7' }}>
      {/* ══ HEADER ══ */}
      <div
        className="relative overflow-hidden rounded-b-[40px] md:rounded-none"
        style={{ background: 'linear-gradient(135deg, #00C896 0%, #00E5FF 100%)' }}
      >
        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full opacity-10 bg-white" />
        <div className="md:hidden" style={{ height: 'env(safe-area-inset-top, 0px)' }} />

        <div className="max-w-full md:max-w-[700px] lg:max-w-[1100px] mx-auto px-5 md:px-8 lg:px-12 pt-10 md:pt-0 pb-8 md:pb-0 md:min-h-[160px] md:flex md:flex-col md:justify-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">Mes séances</h1>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span className="font-bold text-white">{aVenir}</span> à venir
              </span>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span className="font-bold text-white">{faites}</span> réalisées
              </span>
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span className="font-bold text-white">{seances.length}</span> au total
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══ CONTENU ══ */}
      <div className="max-w-full md:max-w-[700px] lg:max-w-[1100px] mx-auto">

        {/* Filtres — scroll horizontal sur mobile, flex-wrap sur desktop */}
        <div className="overflow-x-auto flex gap-2 px-4 md:px-8 lg:px-12 py-4 scrollbar-hide md:flex-wrap">
          {FILTERS.map(f => (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 px-4 py-2 min-h-[40px] rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: filter === f.key ? '#FF8C42' : 'white',
                color: filter === f.key ? 'white' : '#6B7A8D',
                boxShadow: filter === f.key ? '0 4px 14px rgba(255,140,66,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        {/* Liste séances */}
        <div className="px-4 md:px-8 lg:px-12 pb-6">
          {Object.keys(grouped).length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <Calendar size={36} style={{ color: '#CBD5E1' }} />
              </div>
              <p className="font-semibold" style={{ color: '#1A2B4A' }}>Aucune séance</p>
              <p className="text-sm mt-1" style={{ color: '#6B7A8D' }}>
                {filter === 'avenir' ? "Pas de séance à venir pour l'instant" : 'Aucune séance dans cette catégorie'}
              </p>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
              {Object.entries(grouped).map(([month, monthSeances]) => (
                <div key={month}>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3 capitalize" style={{ color: '#6B7A8D' }}>
                    {month}
                  </h3>
                  <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                    {monthSeances.map((seance: SeanceDisplay) => {
                      const isToday = seance.date === today;
                      const cfg = getStatutConfig(seance.statut, isToday);
                      const dateObj = new Date(seance.date + 'T00:00:00');
                      return (
                        <motion.div
                          key={seance.id}
                          variants={itemVariants}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white rounded-2xl p-4 md:p-5 flex items-start gap-4 cursor-pointer md:hover:shadow-lg transition-shadow"
                          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: `4px solid ${cfg.borderColor}` }}
                        >
                          {/* Badge date */}
                          <div
                            className="w-14 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center py-2"
                            style={{ backgroundColor: cfg.dateBg }}
                          >
                            <span className="text-[11px] font-semibold uppercase" style={{ color: cfg.dateTextColor }}>
                              {dateObj.toLocaleDateString('fr-FR', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold leading-none" style={{ color: cfg.dateTextColor }}>
                              {dateObj.getDate()}
                            </span>
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold mb-1.5"
                                  style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeColor }}
                                >
                                  {cfg.badge}
                                </span>
                                <h4 className="font-bold text-sm md:text-base leading-tight" style={{ color: '#1A2B4A' }}>
                                  {seance.type}
                                </h4>
                              </div>
                              {seance.statut === 'faite' ? (
                                <CheckCircle2 size={20} style={{ color: '#00C896', flexShrink: 0 }} />
                              ) : seance.statut === 'passee' ? (
                                <XCircle size={20} style={{ color: '#E5E7EB', flexShrink: 0 }} />
                              ) : (
                                <ChevronRight size={20} style={{ color: '#CBD5E1', flexShrink: 0 }} />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm" style={{ color: '#6B7A8D' }}>
                              <span className="flex items-center gap-1">
                                <Clock size={13} style={{ color: '#FF8C42' }} />{seance.heure?.slice(0, 5)}
                              </span>
                              {seance.duree > 0 && <span>{seance.duree} min</span>}
                              {seance.lieu && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={13} style={{ color: '#FF8C42' }} />{seance.lieu}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}
