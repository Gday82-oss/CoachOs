import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Dumbbell, BarChart3, User } from 'lucide-react';

import ClientToday from './pages/client-mobile/ClientToday';
import ClientSeancesMobile from './pages/client-mobile/ClientSeancesMobile';
import ClientProgrammeMobile from './pages/client-mobile/ClientProgrammeMobile';
import ClientProgresMobile from './pages/client-mobile/ClientProgresMobile';
import ClientProfile from './pages/client-mobile/ClientProfile';

interface ClientProfile {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  coach_id: string;
  objectif?: string;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

const navItems = [
  { path: '/client', icon: Home, label: "Aujourd'hui" },
  { path: '/client/seances', icon: Calendar, label: 'Séances' },
  { path: '/client/programme', icon: Dumbbell, label: 'Programme' },
  { path: '/client/progres', icon: BarChart3, label: 'Progrès' },
  { path: '/client/profil', icon: User, label: 'Profil' },
];

export default function ClientApp() {
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => { fetchClientData(); }, []);

  async function fetchClientData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { setLoading(false); return; }
      const { data } = await supabase
        .from('clients').select('*').eq('email', user.email).maybeSingle();
      if (data) setClient(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0FAF7' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00C896 0%, #00E5FF 100%)', boxShadow: '0 8px 30px rgba(0,200,150,0.3)' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 28C16 28 4 20 4 12C4 8 7 5 11 5C13.5 5 15.5 6.5 16 8C16.5 6.5 18.5 5 21 5C25 5 28 8 28 12C28 20 16 28 16 28Z" fill="white" />
            </svg>
          </motion.div>
          <div className="w-32 h-1.5 rounded-full overflow-hidden bg-gray-200">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00C896, #00E5FF)' }}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#F0FAF7' }}>
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <p className="text-gray-700 font-semibold mb-2">Profil introuvable</p>
          <p className="text-gray-500 text-sm mb-6">
            Votre compte n'est pas encore configuré. Contactez votre coach.
          </p>
          <button
            onClick={() => { supabase.auth.signOut(); window.location.href = '/client/login'; }}
            className="bg-[#00C896] text-white px-6 py-2.5 rounded-2xl font-semibold text-sm"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0FAF7' }}>

      {/* ══════════════════════════════════════
          TOP NAV — desktop uniquement (md+)
          Sticky, fond blanc, liens en ligne
      ══════════════════════════════════════ */}
      <nav
        className="hidden md:flex sticky top-0 z-50 bg-white h-16"
        style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)', borderBottom: '1px solid #F0FAF7' }}
      >
      <div className="flex items-center w-full max-w-[1100px] mx-auto px-8 lg:px-12 gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="topNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C896" />
                <stop offset="100%" stopColor="#00E5FF" />
              </linearGradient>
            </defs>
            <path d="M16 28C16 28 4 20 4 12C4 8 7 5 11 5C13.5 5 15.5 6.5 16 8C16.5 6.5 18.5 5 21 5C25 5 28 8 28 12C28 20 16 28 16 28Z" fill="url(#topNavGrad)" />
          </svg>
          <span className="font-bold text-base" style={{ color: '#1A2B4A' }}>MyCareCoach</span>
        </div>

        {/* Liens de navigation */}
        {navItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/client' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-2 py-1 text-sm font-semibold transition-colors relative"
              style={{ color: isActive ? '#FF8C42' : '#6B7A8D' }}
            >
              <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="topNavUnderline"
                  className="absolute -bottom-[22px] left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: '#FF8C42' }}
                  transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}

        {/* Avatar utilisateur */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: '#6B7A8D' }}>
            {client.prenom} {client.nom}
          </span>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00C896, #00E5FF)' }}
          >
            {client.prenom[0]?.toUpperCase()}
          </div>
        </div>
      </div>
      </nav>

      {/* ══════════════════════════════════════
          CONTENU PRINCIPAL
      ══════════════════════════════════════ */}
      <main className="pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Routes location={location}>
              <Route path="/" element={<ClientToday client={client} />} />
              <Route path="/seances" element={<ClientSeancesMobile client={client} />} />
              <Route path="/programme" element={<ClientProgrammeMobile client={client} />} />
              <Route path="/progres" element={<ClientProgresMobile client={client} />} />
              <Route path="/profil" element={<ClientProfile client={client} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ══════════════════════════════════════
          BOTTOM NAV — mobile uniquement
      ══════════════════════════════════════ */}
      <motion.div
        className="md:hidden"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            boxShadow: '0 -4px 30px rgba(0,0,0,0.08)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          }}
        >
          <div className="flex items-center justify-around pt-3 pb-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/client' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center gap-1 px-5 py-1"
                >
                  <motion.div whileTap={{ scale: 0.82 }} className="relative flex items-center justify-center">
                    {isActive && (
                      <motion.div
                        layoutId="navBgMobile"
                        className="absolute rounded-xl"
                        style={{ inset: '-8px -10px', backgroundColor: 'rgba(255,140,66,0.1)' }}
                        transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
                      />
                    )}
                    <item.icon
                      size={22}
                      style={{ color: isActive ? '#FF8C42' : '#6B7A8D' }}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </motion.div>
                  <span className="text-[10px] font-semibold" style={{ color: isActive ? '#FF8C42' : '#6B7A8D' }}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
