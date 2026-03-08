import { useState } from 'react';
import { useClientData, calcStreak } from '../../hooks/useClientData';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Trophy, Target, Star, Zap, Crown, Medal, Camera, Lock } from 'lucide-react';
import { XAxis, YAxis, ResponsiveContainer, AreaChart, Area, Tooltip, CartesianGrid } from 'recharts';

interface ClientProgresMobileProps {
  client: { id: string; prenom: string; nom: string };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 350, damping: 25 } },
};

const badgesConfig = [
  { id: 1, icon: Trophy, nom: '1ère séance', desc: 'Première séance', obtenu: true, color: '#FF8C42' },
  { id: 2, icon: Flame, nom: '7 jours', desc: 'Streak semaine', obtenu: true, color: '#FF8C42' },
  { id: 3, icon: Zap, nom: '10 séances', desc: 'Assiduité', obtenu: true, color: '#00C896' },
  { id: 4, icon: Target, nom: 'Objectif ✓', desc: 'Premier objectif', obtenu: true, color: '#00C896' },
  { id: 5, icon: Crown, nom: '100 séances', desc: 'Champion', obtenu: false, color: '#6B7A8D' },
  { id: 6, icon: Medal, nom: 'Force +20%', desc: 'Progression', obtenu: false, color: '#6B7A8D' },
];

export default function ClientProgresMobile({ client }: ClientProgresMobileProps) {
  const { seances, metriques, loading } = useClientData(client.id);
  const [showPhotos, setShowPhotos] = useState(false);

  const streak = calcStreak(seances);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const seancesCeMois = seances.filter(s => s.fait && s.date.startsWith(thisMonth)).length;
  const seancesTotal = seances.filter(s => s.fait).length;

  const seancesPassees = seances.filter(s => s.date <= new Date().toISOString().split('T')[0]).length;
  const regularite = seancesPassees > 0 ? Math.round((seancesTotal / seancesPassees) * 100) : 0;

  const poidsData = metriques
    .filter(m => m.poids != null)
    .map((m, idx) => ({ date: `S${idx + 1}`, poids: m.poids as number }));

  const seancesParSemaine = (() => {
    const map: Record<string, number> = {};
    seances.filter(s => s.fait).forEach(s => {
      const d = new Date(s.date + 'T00:00:00');
      const week = `S${Math.ceil(d.getDate() / 7)}`;
      map[week] = (map[week] || 0) + 1;
    });
    return Object.entries(map).slice(-8).map(([semaine, count]) => ({ semaine, count }));
  })();

  const evolution = poidsData.length >= 2
    ? (poidsData[0].poids - poidsData[poidsData.length - 1].poids).toFixed(1)
    : null;

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
        <div className="absolute right-[-30px] top-[-30px] w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="md:hidden" style={{ height: 'env(safe-area-inset-top, 0px)' }} />

        <div className="max-w-full md:max-w-[700px] lg:max-w-[1100px] mx-auto px-5 md:px-8 lg:px-12 pt-10 md:pt-0 pb-8 md:pb-0 md:min-h-[200px] md:flex md:flex-col md:justify-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">Mes progrès</h1>
            <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
            {evolution != null && (
              <div className="mt-3 flex items-baseline gap-2">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 200, delay: 0.2 }}
                  className="text-4xl md:text-5xl font-bold text-white"
                >
                  -{evolution}
                </motion.span>
                <span className="text-xl text-white/70">kg</span>
                <span className="text-sm text-white/60 hidden md:inline">depuis le début</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ══ CONTENU ══ */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-full md:max-w-[700px] lg:max-w-[1100px] mx-auto px-4 md:px-8 lg:px-12 mt-5 space-y-5"
      >
        {/* Stats highlights — 2 colonnes toujours */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: <Flame size={20} style={{ color: '#FF8C42' }} />, iconBg: 'rgba(255,140,66,0.1)', value: streak, label: 'Jours consécutifs 🔥' },
            { icon: <Trophy size={20} style={{ color: '#00C896' }} />, iconBg: 'rgba(0,200,150,0.1)', value: seancesCeMois, label: 'Séances ce mois' },
            { icon: <Target size={20} style={{ color: '#FF8C42' }} />, iconBg: 'rgba(255,140,66,0.1)', value: seancesTotal, label: 'Séances totales' },
            { icon: <Star size={20} style={{ color: '#00C896' }} />, iconBg: 'rgba(0,200,150,0.1)', value: `${regularite}%`, label: 'Régularité' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 md:p-5 md:hover:shadow-lg transition-shadow"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: stat.iconBg }}>
                {stat.icon}
              </div>
              <p className="text-3xl font-bold leading-none" style={{ color: '#1A2B4A' }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: '#6B7A8D' }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── LAYOUT 2 colonnes sur lg : graphique pleine largeur, puis badges/stats côte à côte ── */}

        {/* Graphique — pleine largeur */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-4 md:p-6"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base md:text-lg" style={{ color: '#1A2B4A' }}>
              {poidsData.length >= 2 ? 'Évolution du poids' : 'Séances par semaine'}
            </h3>
            <TrendingUp size={18} style={{ color: '#00C896' }} />
          </div>

          {poidsData.length >= 2 ? (
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={poidsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPoids" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C896" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0FAF7" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7A8D', fontSize: 11 }} />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                    formatter={(v) => [`${v} kg`, 'Poids']}
                  />
                  <Area type="monotone" dataKey="poids" stroke="#00C896" strokeWidth={3}
                    fillOpacity={1} fill="url(#gradPoids)"
                    dot={{ fill: '#00C896', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#00C896' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : seancesParSemaine.length >= 2 ? (
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seancesParSemaine} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSeances" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8C42" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF8C42" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0FAF7" vertical={false} />
                  <XAxis dataKey="semaine" axisLine={false} tickLine={false} tick={{ fill: '#6B7A8D', fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                    formatter={(v) => [`${v} séance(s)`, '']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#FF8C42" strokeWidth={3}
                    fillOpacity={1} fill="url(#gradSeances)"
                    dot={{ fill: '#FF8C42', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#FF8C42' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2" style={{ color: '#6B7A8D' }}>
              <TrendingUp size={36} style={{ color: '#CBD5E1' }} />
              <p className="text-sm text-center">Les données apparaîtront après quelques séances</p>
            </div>
          )}
        </motion.div>

        {/* Régularité + Badges — 2 colonnes sur lg */}
        <motion.div variants={itemVariants} className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-5 lg:space-y-0">

          {/* Régularité */}
          <div className="bg-white rounded-2xl p-4 md:p-5 md:hover:shadow-lg transition-shadow"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold" style={{ color: '#1A2B4A' }}>Régularité</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>
                  {seancesTotal} séances sur {seancesPassees} planifiées
                </p>
              </div>
              <span className="text-2xl font-bold" style={{ color: '#FF8C42' }}>{regularite}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0FAF7' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${regularite}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00C896, #00E5FF)' }}
              />
            </div>
          </div>

          {/* Badges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>Mes badges</h2>
              <span className="text-sm font-semibold" style={{ color: '#6B7A8D' }}>
                {badgesConfig.filter(b => b.obtenu).length}/{badgesConfig.length}
              </span>
            </div>
            {/* Scroll horizontal (mobile), grille 3 col (lg) */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-8 md:px-8 scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible lg:mx-0 lg:px-0">
              {badgesConfig.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0 w-24 lg:w-auto h-28 rounded-2xl flex flex-col items-center justify-center gap-2 relative"
                    style={{
                      backgroundColor: badge.obtenu ? badge.color : '#F0FAF7',
                      boxShadow: badge.obtenu ? `0 6px 20px ${badge.color}40` : 'none',
                      opacity: badge.obtenu ? 1 : 0.6,
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: badge.obtenu ? 'rgba(255,255,255,0.2)' : 'white' }}>
                      {badge.obtenu
                        ? <Icon size={22} className="text-white" />
                        : <Lock size={20} style={{ color: '#9CA3AF' }} />}
                    </div>
                    <div className="text-center px-1">
                      <p className="text-xs font-bold leading-tight"
                        style={{ color: badge.obtenu ? 'white' : '#1A2B4A' }}>{badge.nom}</p>
                      <p className="text-[10px] mt-0.5"
                        style={{ color: badge.obtenu ? 'rgba(255,255,255,0.75)' : '#6B7A8D' }}>{badge.desc}</p>
                    </div>
                    {badge.obtenu && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.05 + 0.3 }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                      >
                        <Star size={10} style={{ color: badge.color }} fill={badge.color} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Photos de suivi */}
        <motion.div variants={itemVariants}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPhotos(!showPhotos)}
            className="bg-white rounded-2xl p-4 md:p-5 flex items-center justify-between cursor-pointer md:hover:shadow-lg transition-shadow"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,140,66,0.1)' }}>
                <Camera size={22} style={{ color: '#FF8C42' }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: '#1A2B4A' }}>Photos de suivi</p>
                <p className="text-sm" style={{ color: '#6B7A8D' }}>Avant / Après</p>
              </div>
            </div>
            <span className="text-sm font-semibold" style={{ color: '#FF8C42' }}>
              {showPhotos ? 'Masquer' : 'Voir'}
            </span>
          </motion.div>

          {showPhotos && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white rounded-2xl p-4 md:p-5 mt-3"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <div className="grid grid-cols-2 gap-4">
                {['Avant', 'Maintenant'].map(label => (
                  <div key={label}>
                    <p className="text-sm font-semibold mb-2"
                      style={{ color: label === 'Maintenant' ? '#FF8C42' : '#6B7A8D' }}>{label}</p>
                    <div className="aspect-[3/4] rounded-2xl flex items-center justify-center border-2 border-dashed"
                      style={{ borderColor: '#E0E0E0', backgroundColor: '#F8FAFB' }}>
                      <div className="text-center">
                        <Camera size={28} style={{ color: '#CBD5E1', margin: '0 auto 6px' }} />
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }}
                className="w-full mt-4 py-3 min-h-[44px] rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: 'rgba(255,140,66,0.1)', color: '#FF8C42' }}>
                + Ajouter une photo
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        <div className="h-4" />
      </motion.div>
    </div>
  );
}
