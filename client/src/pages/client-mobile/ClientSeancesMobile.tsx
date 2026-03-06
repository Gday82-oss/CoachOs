import { useState } from 'react';
import { useClientData, getStatutSeance } from '../../hooks/useClientData';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';

interface ClientSeancesMobileProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
  };
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

const getStatutConfig = (statut: string, isToday: boolean) => {
  if (isToday && statut === 'a_venir') {
    return {
      borderColor: '#FF8C42',
      badgeBg: 'rgba(255, 140, 66, 0.1)',
      badgeColor: '#FF8C42',
      badge: "Aujourd'hui"
    };
  }
  switch (statut) {
    case 'faite':
      return { borderColor: '#00C896', badgeBg: 'rgba(0, 200, 150, 0.1)', badgeColor: '#00C896', badge: 'Réalisée' };
    case 'passee':
      return { borderColor: '#E0E0E0', badgeBg: '#F5F5F5', badgeColor: '#9CA3AF', badge: 'Passée' };
    default:
      return { borderColor: '#FF8C42', badgeBg: 'rgba(255, 140, 66, 0.1)', badgeColor: '#FF8C42', badge: 'À venir' };
  }
};

export default function ClientSeancesMobile({ client }: ClientSeancesMobileProps) {
  const { seances: rawSeances, loading } = useClientData(client.id);
  const [filter, setFilter] = useState<'toutes' | 'avenir' | 'passees'>('toutes');

  const today = new Date().toISOString().split('T')[0];

  // Mappe les séances Supabase vers le format d'affichage
  const seances: SeanceDisplay[] = rawSeances.map(s => ({
    id: s.id,
    date: s.date,
    heure: s.heure,
    duree: s.duree ?? 0,
    type: s.type,
    statut: getStatutSeance(s),
    lieu: s.lieu,
    coach: s.coach,
  }));

  const filteredSeances = seances.filter(s => {
    if (filter === 'avenir') return s.statut === 'a_venir';
    if (filter === 'passees') return s.statut === 'faite' || s.statut === 'passee';
    return true;
  });

  const groupByMonth = (list: SeanceDisplay[]) => {
    const grouped: { [key: string]: SeanceDisplay[] } = {};
    list.forEach(s => {
      const month = new Date(s.date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(s);
    });
    return grouped;
  };

  const groupedSeances = groupByMonth(filteredSeances);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 rounded-full"
          style={{ borderColor: '#00C896', borderTopColor: 'transparent' }}
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
      {/* Header vert */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-3xl p-6 text-white"
          style={{ backgroundColor: '#00C896' }}
        >
          <h1 className="text-2xl font-bold mb-1">Mes séances</h1>
          <p className="text-white/80 text-sm">
            {seances.filter(s => s.statut === 'a_venir').length} séances à venir
          </p>
        </div>
      </motion.div>

      {/* Filtres */}
      <motion.div variants={itemVariants} className="flex gap-2">
        {(['toutes', 'avenir', 'passees'] as const).map((f) => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFilter(f)}
            className="px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: filter === f ? '#FF8C42' : 'white',
              color: filter === f ? 'white' : '#6B7A8D',
              boxShadow: filter === f ? '0 4px 15px rgba(255, 140, 66, 0.3)' : '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            {f === 'toutes' ? 'Toutes' : f === 'avenir' ? 'À venir' : 'Passées'}
          </motion.button>
        ))}
      </motion.div>

      {/* Liste des séances */}
      <motion.div variants={itemVariants} className="space-y-4">
        {Object.keys(groupedSeances).length === 0 ? (
          <div className="text-center py-12">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#F0FAF7' }}
            >
              <Calendar size={40} style={{ color: '#6B7A8D' }} />
            </div>
            <p style={{ color: '#6B7A8D' }}>Aucune séance trouvée</p>
          </div>
        ) : (
          Object.entries(groupedSeances).map(([month, monthSeances]) => (
            <div key={month}>
              <h3 
                className="text-sm font-bold uppercase tracking-wide mb-3 capitalize"
                style={{ color: '#6B7A8D' }}
              >
                {month}
              </h3>
              <div className="space-y-3">
                {monthSeances.map((seance: SeanceDisplay) => {
                  const isToday = seance.date === today;
                  const config = getStatutConfig(seance.statut, isToday);
                  
                  return (
                    <motion.div
                      key={seance.id}
                      variants={itemVariants}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-2xl p-4 cursor-pointer"
                      style={{
                        backgroundColor: 'white',
                        borderLeft: `4px solid ${config.borderColor}`,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Date badge */}
                        <div 
                          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#F0FAF7' }}
                        >
                          <span className="text-xs font-medium" style={{ color: '#6B7A8D' }}>
                            {new Date(seance.date).toLocaleDateString('fr-FR', { month: 'short' })}
                          </span>
                          <span className="text-xl font-bold" style={{ color: '#1A2B4A' }}>
                            {new Date(seance.date).getDate()}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <span 
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold mb-2"
                                style={{ 
                                  backgroundColor: config.badgeBg,
                                  color: config.badgeColor
                                }}
                              >
                                {config.badge}
                              </span>
                              <h4 className="font-bold text-base" style={{ color: '#1A2B4A' }}>
                                {seance.type}
                              </h4>
                            </div>
                          </div>
                          
                          <div 
                            className="flex items-center gap-4 mt-2 text-sm"
                            style={{ color: '#6B7A8D' }}
                          >
                            <span className="flex items-center gap-1">
                              <Clock size={14} style={{ color: '#FF8C42' }} />
                              {seance.heure?.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={14} style={{ color: '#FF8C42' }} />
                              {seance.lieu || 'Salle'}
                            </span>
                          </div>
                        </div>

                        <ChevronRight style={{ color: '#6B7A8D' }} size={20} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </motion.div>

      {/* Espace pour bottom nav */}
      <div className="h-4" />
    </motion.div>
  );
}
