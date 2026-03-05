import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  FileText,
  Activity,
  Mail,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  Search,
  LogOut
} from 'lucide-react';
import Logo from './components/Logo';
import { useTheme } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Seances from './pages/Seances';
import Programmes from './pages/Programmes';
import Metriques from './pages/Metriques';
import Attestations from './pages/Attestations';
import EmailReminders from './pages/EmailReminders';
import SettingsPage from './pages/Settings';

const navItems = [
  { path: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/app/clients', icon: Users, label: 'Clients' },
  { path: '/app/seances', icon: Calendar, label: 'Séances' },
  { path: '/app/programmes', icon: Dumbbell, label: 'Programmes' },
  { path: '/app/metriques', icon: Activity, label: 'Métriques' },
  { path: '/app/attestations', icon: FileText, label: 'Attestations' },
  { path: '/app/emails', icon: Mail, label: 'Emails' },
  { path: '/app/settings', icon: Settings, label: 'Paramètres' },
];

export default function CoachApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div id="coach-app" className={`flex h-screen bg-gray-50 dark:bg-[#0F1923] transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex flex-col shadow-xl flex-shrink-0"
        style={{ background: '#1A2B4A' }}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-0.5"
              >
                <Logo height={32} textVariant="white" />
                <span className="text-xs italic text-white/50 pl-10">
                  L'app qui prend soin de votre activité
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} className="text-white/70" /> : <Menu size={20} className="text-white/70" />}
          </motion.button>
        </div>

        <nav className="flex-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl mb-1 transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-lg shadow-[#00C896]/30'
                    : 'text-white/70 hover:bg-[#00C896]/20 hover:text-white'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: '#00C896' } : {}}
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

        <div className="p-4 border-t border-white/10 space-y-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors w-full text-white/70 hover:text-white"
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

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors w-full"
          >
            <LogOut size={20} />
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Déconnexion
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-[#1A2535] border-b border-[#E5E7EB] dark:border-[#2E3D55] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#8896A8]" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#243044] rounded-xl border border-gray-200 dark:border-[#2E3D55] dark:text-[#E8EDF5] dark:placeholder-[#8896A8] focus:outline-none focus:ring-2 focus:ring-[#00C896]/30 focus:border-[#00C896] transition-all"
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
                className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-slate-800"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ background: '#00C896' }}
                >
                  {user?.user_metadata?.prenom?.[0] || 'C'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {user?.user_metadata?.prenom || 'Coach'}
                  </p>
                  <p className="text-xs text-gray-500">Coach</p>
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="seances" element={<Seances />} />
            <Route path="programmes" element={<Programmes />} />
            <Route path="metriques" element={<Metriques />} />
            <Route path="attestations" element={<Attestations />} />
            <Route path="emails" element={<EmailReminders />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
