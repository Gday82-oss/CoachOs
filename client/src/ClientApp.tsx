import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Dumbbell, BarChart3 } from 'lucide-react';

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

// Animation variants pour les pages
const pageVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: 'spring' as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    x: -50,
    transition: { duration: 0.2 }
  }
};

// Logo Client avec dégradé orange→vert
function ClientLogo() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        {/* Cœur ECG SVG avec dégradé */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mr-1">
          <defs>
            <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8C42" />
              <stop offset="100%" stopColor="#00C896" />
            </linearGradient>
          </defs>
          <path 
            d="M16 28C16 28 4 20 4 12C4 8 7 5 11 5C13.5 5 15.5 6.5 16 8C16.5 6.5 18.5 5 21 5C25 5 28 8 28 12C28 20 16 28 16 28Z" 
            fill="url(#heartGradient)"
          />
          <path 
            d="M8 16L12 16L14 12L16 20L18 14L20 16L24 16" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span className="text-xl font-bold">
          <span style={{ color: '#FF8C42' }}>Mon</span>
          <span style={{ color: '#00C896' }}>Care</span>
          <span style={{ color: '#1A2B4A' }}>Coach</span>
        </span>
      </div>
      <span className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>Mon espace sportif</span>
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0FAF7' }}>
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
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #FF8C42 0%, #00C896 100%)',
              boxShadow: '0 8px 30px rgba(255, 140, 66, 0.3)'
            }}
          >
            <Dumbbell className="text-white" size={32} />
          </motion.div>
          <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E0E0E0' }}>
            <motion.div 
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #FF8C42, #00C896)' }}
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
    // Déconnexion propre pour éviter une boucle infinie de redirection
    supabase.auth.signOut();
    return <Navigate to="/client/login" replace />;
  }

  const navItems = [
    { path: '/client', icon: Home, label: 'Aujourd\'hui' },
    { path: '/client/seances', icon: Calendar, label: 'Séances' },
    { path: '/client/programme', icon: Dumbbell, label: 'Programme' },
    { path: '/client/progres', icon: BarChart3, label: 'Progrès' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F0FAF7' }}>
      {/* Header avec dégradé vert */}
      <header 
        className="sticky top-0 z-40 px-5 pt-12 pb-6"
        style={{ 
          background: 'linear-gradient(135deg, #00C896 0%, #00E5FF 100%)',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <ClientLogo />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-white/80 text-sm font-medium">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
          <h1 className="text-2xl font-bold text-white mt-1">
            Bonjour {client.prenom} 💪
          </h1>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-5 pb-28 overflow-y-auto -mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Routes location={location}>
              <Route 
                path="/" 
                element={<ClientToday client={client} />} 
              />
              <Route 
                path="/seances" 
                element={<ClientSeancesMobile client={client} />} 
              />
              <Route 
                path="/programme" 
                element={<ClientProgrammeMobile client={client} />} 
              />
              <Route 
                path="/progres" 
                element={<ClientProgresMobile client={client} />} 
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation bar - style iOS avec orange */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div 
          className="mx-4 mb-4 rounded-full shadow-lg"
          style={{ 
            backgroundColor: 'white',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-around py-3">
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
                    whileTap={{ scale: 0.97 }}
                    className="relative"
                  >
                    <item.icon 
                      size={24} 
                      style={{ color: isActive ? '#FF8C42' : '#6B7A8D' }}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </motion.div>
                  
                  <span 
                    className="text-[10px] font-semibold"
                    style={{ color: isActive ? '#FF8C42' : '#6B7A8D' }}
                  >
                    {item.label}
                  </span>
                  
                  {/* Point indicateur orange */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: '#FF8C42' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
