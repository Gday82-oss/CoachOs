import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Check, X, MapPin, Video, User,
  ChevronRight, AlertCircle
} from 'lucide-react';

interface ClientSeancesMobileProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
  };
}

interface Seance {
  id: string;
  date: string;
  heure: string;
  duree: number;
  type: string;
  notes?: string;
  statut: 'a_venir' | 'faite' | 'annulee' | 'reportee';
  mode: 'presentiel' | 'visio';
  lieu?: string;
  coach?: {
    prenom: string;
    nom: string;
  };
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

const cardVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
};

// Données démo
const seancesDemo: Seance[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    heure: '14:00',
    duree: 60,
    type: 'Renforcement musculaire',
    statut: 'a_venir',
    mode: 'presentiel',
    lieu: 'Salle de sport',
    coach: { prenom: 'Marie', nom: 'Dubois' }
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    heure: '10:00',
    duree: 45,
    type: 'Cardio HIIT',
    statut: 'faite',
    mode: 'visio',
    coach: { prenom: 'Marie', nom: 'Dubois' }
  },
  {
    id: '3',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    heure: '16:30',
    duree: 60,
    type: 'Pilates',
    statut: 'faite',
    mode: 'presentiel',
    lieu: 'Studio',
    coach: { prenom: 'Marie', nom: 'Dubois' }
  },
  {
    id: '4',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    heure: '09:00',
    duree: 60,
    type: 'Cross Training',
    statut: 'a_venir',
    mode: 'presentiel',
    lieu: 'Parc',
    coach: { prenom: 'Marie', nom: 'Dubois' }
  },
  {
    id: '5',
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    heure: '18:00',
    duree: 45,
    type: 'Yoga',
    statut: 'annulee',
    mode: 'visio',
    coach: { prenom: 'Marie', nom: 'Dubois' }
  },
];

const getStatutConfig = (statut: string, isToday: boolean) => {
  if (isToday && statut === 'a_venir') {
    return {
      couleur: 'bg-[#00C896] text-white',
      bg: 'bg-gradient-to-br from-[#00C896] to-[#00E5FF]',
      badge: 'Aujourd\'hui',
      badgeBg: 'bg-white/20',
      icon: Calendar
    };
  }
  
  switch (statut) {
    case 'faite':
      return {
        couleur: 'bg-green-100 text-green-700',
        bg: 'bg-green-50 border-green-100',
        badge: 'Réalisée',
        badgeBg: 'bg-green-100 text-green-700',
        icon: Check
      };
    case 'annulee':
      return {
        couleur: 'bg-red-100 text-red-700',
        bg: 'bg-red-50 border-red-100',
        badge: 'Annulée',
        badgeBg: 'bg-red-100 text-red-700',
        icon: X
      };
    case 'reportee':
      return {
        couleur: 'bg-amber-100 text-amber-700',
        bg: 'bg-amber-50 border-amber-100',
        badge: 'Reportée',
        badgeBg: 'bg-amber-100 text-amber-700',
        icon: AlertCircle
      };
    default:
      return {
        couleur: 'bg-gray-100 text-gray-600',
        bg: 'bg-white border-gray-100',
        badge: 'À venir',
        badgeBg: 'bg-blue-100 text-blue-700',
        icon: Clock
      };
  }
};

export default function ClientSeancesMobile({ client: _client }: ClientSeancesMobileProps) {
  const [seances] = useState<Seance[]>(seancesDemo);
  const [filter, setFilter] = useState<'toutes' | 'avenir' | 'passees'>('toutes');
  const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const filteredSeances = seances.filter(s => {
    if (filter === 'avenir') return s.date >= today && s.statut !== 'annulee';
    if (filter === 'passees') return s.date < today || s.statut === 'faite' || s.statut === 'annulee';
    return true;
  });

  const groupByMonth = (seances: Seance[]) => {
    const grouped: { [key: string]: Seance[] } = {};
    seances.forEach(s => {
      const month = new Date(s.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(s);
    });
    return grouped;
  };

  const groupedSeances = groupByMonth(filteredSeances);


  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pt-2"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-800">Mes séances</h1>
        <p className="text-gray-500 text-sm mt-1">
          {seances.filter(s => s.date >= today && s.statut === 'a_venir').length} séances à venir
        </p>
      </motion.div>

      {/* Filtres */}
      <motion.div variants={itemVariants} className="flex gap-2">
        {(['toutes', 'avenir', 'passees'] as const).map((f) => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-[#00C896] text-white shadow-lg shadow-[#00C896]/25'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f === 'toutes' ? 'Toutes' : f === 'avenir' ? 'À venir' : 'Passées'}
          </motion.button>
        ))}
      </motion.div>

      {/* Liste des séances */}
      <motion.div variants={itemVariants} className="space-y-6">
        {Object.keys(groupedSeances).length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-gray-400" size={40} />
            </div>
            <p className="text-gray-500 font-medium">Aucune séance trouvée</p>
          </motion.div>
        ) : (
          Object.entries(groupedSeances).map(([month, monthSeances]) => (
            <div key={month}>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 capitalize">
                {month}
              </h3>
              <div className="space-y-3">
                {monthSeances.map((seance) => {
                  const isToday = seance.date === today;
                  const config = getStatutConfig(seance.statut, isToday);
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={seance.id}
                      variants={cardVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => setSelectedSeance(seance)}
                      className={`rounded-3xl p-4 border-2 cursor-pointer transition-all ${
                        isToday 
                          ? 'bg-gradient-to-br from-[#00C896] to-[#00E5FF] text-white border-transparent shadow-xl shadow-[#00C896]/20' 
                          : `${config.bg} border-transparent`
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Date badge */}
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                          isToday ? 'bg-white/20' : config.couleur
                        }`}>
                          <span className={`text-xs font-bold ${isToday ? 'text-white/80' : ''}`}>
                            {new Date(seance.date).toLocaleDateString('fr-FR', { month: 'short' })}
                          </span>
                          <span className={`text-xl font-bold ${isToday ? 'text-white' : ''}`}>
                            {new Date(seance.date).getDate()}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold mb-2 ${
                                isToday ? 'bg-white/20 text-white' : config.badgeBg
                              }`}>
                                <Icon size={12} />
                                {config.badge}
                              </span>
                              <h4 className={`font-bold text-base truncate ${isToday ? 'text-white' : 'text-gray-800'}`}>
                                {seance.type}
                              </h4>
                            </div>
                          </div>
                          
                          <div className={`flex items-center gap-4 mt-2 text-sm ${isToday ? 'text-white/90' : 'text-gray-500'}`}>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {seance.heure?.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              {seance.mode === 'visio' ? (
                                <Video size={14} />
                              ) : (
                                <MapPin size={14} />
                              )}
                              {seance.mode === 'visio' ? 'Visio' : seance.lieu || 'Salle'}
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className={`flex-shrink-0 ${isToday ? 'text-white/60' : 'text-gray-300'}`} size={20} />
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

      {/* Modal détail séance */}
      <AnimatePresence>
        {selectedSeance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedSeance(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring' as const, damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  selectedSeance.statut === 'faite' ? 'bg-green-100' : 
                  selectedSeance.statut === 'annulee' ? 'bg-red-100' :
                  'bg-[#00C896]/10'
                }`}>
                  {selectedSeance.statut === 'faite' ? (
                    <Check size={32} className="text-green-600" />
                  ) : selectedSeance.statut === 'annulee' ? (
                    <X size={32} className="text-red-600" />
                  ) : (
                    <Calendar size={32} className="text-[#00C896]" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedSeance.type}</h3>
                  <p className="text-gray-500">
                    {new Date(selectedSeance.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long', day: 'numeric', month: 'long' 
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <Clock className="text-gray-400" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">{selectedSeance.heure?.slice(0, 5)}</p>
                    <p className="text-sm text-gray-500">{selectedSeance.duree} minutes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  {selectedSeance.mode === 'visio' ? (
                    <Video size={20} className="text-purple-500" />
                  ) : (
                    <MapPin size={20} className="text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">
                      {selectedSeance.mode === 'visio' ? 'Visioconférence' : selectedSeance.lieu || 'Salle de sport'}
                    </p>
                    <p className="text-sm text-gray-500">Mode {selectedSeance.mode}</p>
                  </div>
                </div>

                {selectedSeance.coach && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <User className="text-gray-400" size={20} />
                    <div>
                      <p className="font-semibold text-gray-800">{selectedSeance.coach.prenom} {selectedSeance.coach.nom}</p>
                      <p className="text-sm text-gray-500">Coach</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedSeance(null)}
                className="w-full py-4 bg-[#00C896] text-white rounded-2xl font-bold shadow-lg shadow-[#00C896]/20"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
