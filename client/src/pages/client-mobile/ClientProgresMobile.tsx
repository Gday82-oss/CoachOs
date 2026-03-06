import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Target, ChevronRight,
  Activity, Scale, Flame, Dumbbell, Camera,
  Trophy, Star, Zap, Crown, Medal
} from 'lucide-react';
import { 
  XAxis, YAxis, ResponsiveContainer,
  AreaChart, Area, Tooltip
} from 'recharts';

interface ClientProgresMobileProps {
  client: {
    id: string;
    prenom: string;
    nom: string;
  };
}

// Données pour le graphique
const poidsData = [
  { date: 'S1', poids: 82.5, graisse: 22 },
  { date: 'S2', poids: 81.8, graisse: 21.5 },
  { date: 'S3', poids: 81.2, graisse: 21 },
  { date: 'S4', poids: 80.5, graisse: 20.5 },
  { date: 'S5', poids: 79.8, graisse: 20 },
  { date: 'S6', poids: 79.2, graisse: 19.5 },
  { date: 'S7', poids: 78.5, graisse: 19 },
  { date: 'S8', poids: 78.0, graisse: 18.5 },
];

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

const badges = [
  { id: 1, icon: Flame, nom: '7 jours', desc: 'Streak semaine', couleur: 'bg-orange-100 text-orange-600', obtenu: true },
  { id: 2, icon: Trophy, nom: '30 jours', desc: 'Streak mois', couleur: 'bg-yellow-100 text-yellow-600', obtenu: true },
  { id: 3, icon: Zap, nom: '10 séances', desc: 'Assiduité', couleur: 'bg-blue-100 text-blue-600', obtenu: true },
  { id: 4, icon: Target, nom: '-5kg', desc: 'Objectif poids', couleur: 'bg-green-100 text-green-600', obtenu: true },
  { id: 5, icon: Crown, nom: 'Champion', desc: '100 séances', couleur: 'bg-purple-100 text-purple-600', obtenu: false },
  { id: 6, icon: Medal, nom: 'Force +20%', desc: 'Progression', couleur: 'bg-pink-100 text-pink-600', obtenu: false },
];

const objectifs = [
  { nom: 'Perte de poids', cible: 75, actuel: 78, unite: 'kg', icone: Scale },
  { nom: 'Masse grasse', cible: 15, actuel: 18.5, unite: '%', icone: Activity },
  { nom: 'Streak entraînement', cible: 30, actuel: 12, unite: 'jours', icone: Flame },
];

export default function ClientProgresMobile({ client: _client }: ClientProgresMobileProps) {
  const [activeMetric, setActiveMetric] = useState<'poids' | 'graisse'>('poids');
  const [showPhotos, setShowPhotos] = useState(false);

  const evolution = activeMetric === 'poids' 
    ? (poidsData[0].poids - poidsData[poidsData.length - 1].poids).toFixed(1)
    : (poidsData[0].graisse - poidsData[poidsData.length - 1].graisse).toFixed(1);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pt-2"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-800">Mes progrès</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tu progresses bien, continue ! 🚀
        </p>
      </motion.div>

      {/* Carte résumé */}
      <motion.div variants={itemVariants}>
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-2xl shadow-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80 font-medium">Évolution {activeMetric === 'poids' ? 'poids' : 'masse grasse'}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 200 }}
                  className="text-5xl font-bold"
                >
                  -{evolution}
                </motion.span>
                <span className="text-xl opacity-80">{activeMetric === 'poids' ? 'kg' : '%'}</span>
              </div>
              <p className="text-sm opacity-80 mt-2">
                Depuis le début du programme
              </p>
            </div>
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"
            >
              <TrendingUp size={32} />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Scale className="text-blue-500" size={22} />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              78.0<span className="text-sm font-normal text-gray-400 ml-1">kg</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Poids actuel</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50"
          >
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center mb-3">
              <Activity className="text-green-500" size={22} />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              18.5<span className="text-sm font-normal text-gray-400 ml-1">%</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Masse grasse</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
              <Flame className="text-orange-500" size={22} />
            </div>
            <p className="text-2xl font-bold text-gray-800">12</p>
            <p className="text-xs text-gray-500 mt-0.5">Jours de suite 🔥</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
              <Dumbbell className="text-purple-500" size={22} />
            </div>
            <p className="text-2xl font-bold text-gray-800">24</p>
            <p className="text-xs text-gray-500 mt-0.5">Séances ce mois</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Graphique */}
      <motion.div variants={itemVariants}>
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 text-lg">Évolution</h3>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['poids', 'graisse'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeMetric === metric
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {metric === 'poids' ? 'Poids' : 'Graisse'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={poidsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C896" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00C896" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  hide 
                  domain={activeMetric === 'poids' ? ['dataMin - 1', 'dataMax + 1'] : ['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`${value} ${activeMetric === 'poids' ? 'kg' : '%'}`, activeMetric === 'poids' ? 'Poids' : 'Masse grasse']}
                />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric}
                  stroke="#00C896" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorMetric)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Objectifs */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Mes objectifs</h2>
          <button className="text-[#00C896] text-sm font-bold">
            Modifier
          </button>
        </div>

        <div className="space-y-3">
          {objectifs.map((obj, idx) => {
            const Icon = obj.icone;
            const progress = Math.min(100, ((obj.cible - obj.actuel) / (obj.cible - (obj.cible * 0.9))) * 100);
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl p-4 shadow-lg border border-gray-50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#00C896]/10 flex items-center justify-center">
                    <Icon className="text-[#00C896]" size={22} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{obj.nom}</h4>
                    <p className="text-sm text-gray-500">
                      {obj.actuel} / {obj.cible} {obj.unite}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-[#00C896]">
                    {Math.round(progress)}%
                  </span>
                </div>
                
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-[#00C896] to-[#00E5FF] rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Badges gamification */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Mes badges</h2>
          <span className="text-sm text-gray-500">
            {badges.filter(b => b.obtenu).length}/{badges.length}
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.9 }}
                className={`flex-shrink-0 w-28 h-32 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
                  badge.obtenu 
                    ? `bg-white border-transparent shadow-lg ${badge.couleur}` 
                    : 'bg-gray-50 border-gray-200 border-dashed'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${badge.obtenu ? badge.couleur : 'bg-gray-200 text-gray-400'}`}>
                  <Icon size={24} />
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold ${badge.obtenu ? 'text-gray-800' : 'text-gray-400'}`}>
                    {badge.nom}
                  </p>
                  <p className={`text-[10px] ${badge.obtenu ? 'text-gray-500' : 'text-gray-400'}`}>
                    {badge.desc}
                  </p>
                </div>
                {badge.obtenu && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <Star size={10} className="text-white" fill="white" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Photos avant/après */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Photos évolution</h2>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPhotos(!showPhotos)}
            className="flex items-center gap-1 text-[#00C896] text-sm font-bold"
          >
            <Camera size={16} />
            {showPhotos ? 'Masquer' : 'Voir'}
          </motion.button>
        </div>

        {showPhotos ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-3xl p-5 shadow-lg border border-gray-50"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Janvier 2024</p>
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Camera size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Avant</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#00C896] mb-2">Mars 2024</p>
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Camera size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Après</p>
                  </div>
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full mt-4 py-3 bg-[#00C896]/10 text-[#00C896] rounded-xl font-bold"
            >
              + Ajouter une photo
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPhotos(true)}
            className="bg-white rounded-2xl p-5 shadow-lg border border-gray-50 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                <Camera className="text-purple-500" size={22} />
              </div>
              <div>
                <p className="font-bold text-gray-800">Photos de suivi</p>
                <p className="text-sm text-gray-500">2 photos enregistrées</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={20} />
          </motion.div>
        )}
      </motion.div>

      {/* Espace pour bottom nav */}
      <div className="h-4" />
    </motion.div>
  );
}
