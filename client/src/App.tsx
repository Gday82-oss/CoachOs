import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Dumbbell, 
  CreditCard, 
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  Search,
  Heart
} from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Seances from './pages/Seances';
import Programmes from './pages/Programmes';
import Paiements from './pages/Paiements';
import SettingsPage from './pages/Settings';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écouter changements auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  const navItems = [
    { path: '/', icon: Users, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/seances', icon: Calendar, label: 'Séances' },
    { path: '/programmes', icon: Dumbbell, label: 'Programmes' },
    { path: '/paiements', icon: CreditCard, label: 'Paiements' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shadow-xl"
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-800">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                  <Heart className="text-white" size={18} />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                  MyCareCoach
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} className="text-gray-600 dark:text-gray-400" /> : <Menu size={20} className="text-gray-600 dark:text-gray-400" />}
          </motion.button>
        </div>

        <nav className="flex-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl mb-1 transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                    : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400'
                }`
              }
            >
              <motion.div
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <item.icon size={20} />
              </motion.div>
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-slate-800">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors w-full text-gray-600 dark:text-gray-400"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-slate-800 cursor-pointer"
                onClick={handleLogout}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-medium"
                >
                  {user?.user_metadata?.prenom?.[0] || 'C'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {user?.user_metadata?.prenom || 'Coach'}
                  </p>
                  <p className="text-xs text-gray-500">Déconnexion</p>
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/seances" element={<Seances />} />
          <Route path="/programmes" element={<Programmes />} />
          <Route path="/paiements" element={<Paiements />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;