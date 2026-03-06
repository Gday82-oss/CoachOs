import { useState } from 'react';
import { useClientData, calcStreak } from '../../hooks/useClientData';
import { motion } from 'framer-motion';
import {
  TrendingUp, Target, Flame, Trophy,
  Star, Zap, Crown, Medal, Camera
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
  { id: 1, icon: Flame, nom: '7 jours', desc: 'Streak semaine', obtenu: true },
  { id: 2, icon: Trophy, nom: '30 jours', desc: 'Streak mois', obtenu: true },
  { id: 3, icon: Zap, nom: '10 seances', desc: 'Assiduite', obtenu: true },
  { id: 4, icon: Target, nom: '-5kg', desc: 'Objectif poids', obtenu: true },
  { id: 5, icon: Crown, nom: 'Champion', desc: '100 seances', obtenu: false },
  { id: 6, icon: Medal, nom: 'Force +20%', desc: 'Progression', obtenu: false },
];

const objectifs = [
  { nom: 'Perte de poids', cible: 75, actuel: 78, unite: 'kg' },
  { nom: 'Masse grasse', cible: 15, actuel: 18.5, unite: '%' },
  { nom: 'Streak', cible: 30, actuel: 12, unite: 'jours' },
];

export default function ClientProgresMobile({ client }: ClientProgresMobileProps) {
  const { seances, metriques, loading } = useClientData(client.id);
  const [showPhotos, setShowPhotos] = useState(false);

  const poidsData = metriques
    .filter(m => m.poids != null)
    .map((m, idx) => ({ date: `S${idx + 1}`, poids: m.poids as number }));

  const evolution = poidsData.length >= 2
    ? (poidsData[0].poids - poidsData[poidsData.length - 1].poids).toFixed(1)
    : null;

  const streak = calcStreak(seances);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const seancesCeMois = seances.filter(s => s.fait && s.date.startsWith(thisMonth)).length;

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
      {/* Carte resume avec degrade */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-3xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80 font-medium">Evolution poids</p>
              <div className="flex items-baseline gap-2 mt-1">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 200 }}
                  className="text-5xl font-bold"
                >
                  {evolution != null ? `-${evolution}` : '--'}
                </motion.span>
                {evolution != null && <span className="text-xl text-white/80">kg</span>}
              </div>
              <p className="text-sm text-white/80 mt-2">
                {evolution != null ? 'Depuis le debut du programme' : 'Pas encore de donnees poids'}
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
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)' }}
            >
              <Flame size={20} style={{ color: '#FF8C42' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>{streak}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>Jours de suite</p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)' }}
            >
              <Trophy size={20} style={{ color: '#FF8C42' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>{seancesCeMois}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>Seances ce mois</p>
          </div>
        </div>
      </motion.div>

      {/* Graphique */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-3xl p-5"
          style={{ backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}
        >
          <h3 className="font-bold text-lg mb-4" style={{ color: '#1A2B4A' }}>Evolution du poids</h3>

          {poidsData.length < 2 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: '#6B7A8D' }}>
              Pas encore assez de donnees pour afficher le graphique
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={poidsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPoids" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8C42" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF8C42" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7A8D', fontSize: 12 }}
                  />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [`${value ?? '-'} kg`, 'Poids']}
                  />
                  <Area
                    type="monotone"
                    dataKey="poids"
                    stroke="#FF8C42"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPoids)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </motion.div>

      {/* Objectifs */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold mb-3" style={{ color: '#1A2B4A' }}>Mes objectifs</h2>
        <div className="space-y-3">
          {objectifs.map((obj, idx) => {
            const progress = Math.min(100, ((obj.cible - obj.actuel) / (obj.cible - (obj.cible * 0.9))) * 100);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl p-4"
                style={{ backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)' }}
                    >
                      <Target size={20} style={{ color: '#FF8C42' }} />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: '#1A2B4A' }}>{obj.nom}</p>
                      <p className="text-sm" style={{ color: '#6B7A8D' }}>
                        {obj.actuel} / {obj.cible} {obj.unite}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold" style={{ color: '#FF8C42' }}>
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0FAF7' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #00C896, #FF8C42)' }}
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
          <h2 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>Mes badges</h2>
          <span className="text-sm" style={{ color: '#6B7A8D' }}>
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
                className="flex-shrink-0 w-28 h-32 rounded-2xl flex flex-col items-center justify-center gap-2 relative"
                style={{
                  backgroundColor: badge.obtenu ? '#FF8C42' : '#F0FAF7',
                  boxShadow: badge.obtenu ? '0 4px 15px rgba(255, 140, 66, 0.3)' : 'none'
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: badge.obtenu ? 'rgba(255, 255, 255, 0.2)' : 'white' }}
                >
                  <Icon size={24} style={{ color: badge.obtenu ? 'white' : '#6B7A8D' }} />
                </div>
                <div className="text-center">
                  <p
                    className="text-xs font-bold"
                    style={{ color: badge.obtenu ? 'white' : '#1A2B4A' }}
                  >
                    {badge.nom}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: badge.obtenu ? 'rgba(255,255,255,0.8)' : '#6B7A8D' }}
                  >
                    {badge.desc}
                  </p>
                </div>
                {badge.obtenu && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  >
                    <Star size={10} style={{ color: '#FF8C42' }} fill="#FF8C42" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Photos evolution */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>Photos evolution</h2>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowPhotos(!showPhotos)}
            className="flex items-center gap-1 text-sm font-semibold"
            style={{ color: '#FF8C42' }}
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
            className="rounded-3xl p-5"
            style={{ backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: '#6B7A8D' }}>Avant</p>
                <div
                  className="aspect-[3/4] rounded-2xl flex items-center justify-center border-2 border-dashed"
                  style={{ borderColor: '#E0E0E0', backgroundColor: '#F8FAFB' }}
                >
                  <div className="text-center">
                    <Camera size={32} style={{ color: '#6B7A8D' }} className="mx-auto mb-2" />
                    <p className="text-xs" style={{ color: '#6B7A8D' }}>Avant</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: '#FF8C42' }}>Maintenant</p>
                <div
                  className="aspect-[3/4] rounded-2xl flex items-center justify-center border-2 border-dashed"
                  style={{ borderColor: '#E0E0E0', backgroundColor: '#F8FAFB' }}
                >
                  <div className="text-center">
                    <Camera size={32} style={{ color: '#6B7A8D' }} className="mx-auto mb-2" />
                    <p className="text-xs" style={{ color: '#6B7A8D' }}>Apres</p>
                  </div>
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full mt-4 py-3 rounded-full font-bold"
              style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)', color: '#FF8C42' }}
            >
              + Ajouter une photo
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowPhotos(true)}
            className="rounded-2xl p-5 flex items-center justify-between cursor-pointer"
            style={{ backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 140, 66, 0.1)' }}
              >
                <Camera size={22} style={{ color: '#FF8C42' }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: '#1A2B4A' }}>Photos de suivi</p>
                <p className="text-sm" style={{ color: '#6B7A8D' }}>Ajouter des photos</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Espace pour bottom nav */}
      <div className="h-4" />
    </motion.div>
  );
}
