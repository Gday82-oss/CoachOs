import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Dumbbell, BarChart3, LogOut } from 'lucide-react';

// Pages
import ClientToday from './pages/client-mobile/ClientToday';
import ClientSeancesMobile from './pages/client-mobile/ClientSeancesMobile';
import ClientProgrammeMobile from './pages/client-mobile/ClientProgrammeMobile';
import ClientProgresMobile from './pages/client-mobile/ClientProgresMobile';

interface ClientProfile {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  coach_id: string;
  objectif?: string;
}

// Animation variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.08
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 }
  }
};

export default function ClientApp() {
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchClientData();
  }, []);

  async function fetchClientData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setLoading(false);
        return;
      }

      const { data: clientData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (error) {
        console.error('Erreur Supabase:', error);
      }

      if (clientData) {
        setClient(clientData);
      }
    } catch (error) {
      console.error('Erreur fetchClientData:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0FAF7]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00C896] to-[#00E5FF] flex items-center justify-center shadow-xl shadow-[#00C896]/30"
          >
            <Dumbbell className="text-white" size={40} />
          </motion.div>
          <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#00C896] to-[#00E5FF]"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!client) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/client', icon: Home, label: 'Aujourd\'hui' },
    { path: '/client/seances', icon: Calendar, label: 'Séances' },
    { path: '/client/programme', icon: Dumbbell, label: 'Programme' },
    { path: '/client/progres', icon: BarChart3, label: 'Progrès' },
  ];

  return (
    <div className="min-h-screen bg-[#F0FAF7] flex flex-col">
      {/* Header mobile avec glassmorphism */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-[#F0FAF7]/80 backdrop-blur-xl px-5 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00C896] to-[#00E5FF] flex items-center justify-center text-white font-bold shadow-lg shadow-[#00C896]/25"
            >
              {client.prenom[0]}{client.nom[0]}
            </motion.div>
            <div>
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-gray-500 font-medium"
              >
                Bonjour 👋
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="font-bold text-gray-800 text-lg"
              >
                {client.prenom}
              </motion.p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white shadow-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </motion.button>
        </div>
      </motion.header>

      {/* Main content avec animations de page */}
      <main className="flex-1 px-5 pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route 
              path="/" 
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ClientToday client={client} />
                </motion.div>
              } 
            />
            <Route 
              path="/seances" 
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ClientSeancesMobile client={client} />
                </motion.div>
              } 
            />
            <Route 
              path="/programme" 
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ClientProgrammeMobile client={client} />
                </motion.div>
              } 
            />
            <Route 
              path="/progres" 
              element={
                <motion.div
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <ClientProgresMobile client={client} />
                </motion.div>
              } 
            />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Bottom navigation bar - iOS style avec animations */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 30, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Safe area pour iOS */}
        <div className="bg-white/95 backdrop-blur-2xl border-t border-gray-100/50 px-2 pt-2 pb-safe">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/client' && location.pathname.startsWith(item.path));
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center gap-1 px-4 py-2"
                >
                  <motion.div
                    className="relative"
                    whileTap={{ scale: 0.85 }}
                  >
                    {/* Cercle actif animé */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBg"
                        className="absolute inset-0 bg-[#00C896]/10 rounded-xl -m-2"
                        initial={false}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 500, 
                          damping: 35 
                        }}
                      />
                    )}
                    
                    <item.icon 
                      size={24} 
                      className={`relative z-10 transition-all duration-300 ${
                        isActive ? 'text-[#00C896]' : 'text-gray-400'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </motion.div>
                  
                  <span className={`text-[10px] font-semibold transition-colors duration-300 ${
                    isActive ? 'text-[#00C896]' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Petit point indicateur */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#00C896]"
                      initial={false}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 500, 
                        damping: 35 
                      }}
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
