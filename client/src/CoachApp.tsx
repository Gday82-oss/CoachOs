import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  LogOut,
  Bot,
  Receipt,
} from 'lucide-react';
import Logo from './components/Logo';
import { useTheme } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import ChatbotIA from './components/coach/ChatbotIA';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Seances from './pages/Seances';
import Programmes from './pages/Programmes';
import Metriques from './pages/Metriques';
import Attestations from './pages/Attestations';
import Facturation from './pages/Facturation';
import EmailReminders from './pages/EmailReminders';
import SettingsPage from './pages/Settings';

const navItems = [
  { path: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/app/clients', icon: Users, label: 'Clients' },
  { path: '/app/seances', icon: Calendar, label: 'Séances' },
  { path: '/app/programmes', icon: Dumbbell, label: 'Programmes' },
  { path: '/app/metriques', icon: Activity, label: 'Métriques' },
  { path: '/app/attestations', icon: FileText, label: 'Attestations' },
  { path: '/app/facturation', icon: Receipt, label: 'Facturation' },
  { path: '/app/emails', icon: Mail, label: 'Emails' },
  { path: '/app/settings', icon: Settings, label: 'Paramètres' },
];

interface CoachInfo {
  prenom: string;
  nom: string;
  email: string;
  photo_url?: string | null;
}

export default function CoachApp() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [coach, setCoach] = useState<CoachInfo | null>(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data } = await supabase
        .from('coachs')
        .select('prenom, nom, photo_url')
        .eq('id', user.id)
        .maybeSingle();

      let prenom = (data?.prenom && data.prenom !== 'Nouveau') ? data.prenom : '';
      let nom    = (data?.nom    && data.nom    !== 'Coach')   ? data.nom    : '';

      if (!prenom) prenom = user.user_metadata?.prenom || '';
      if (!nom)    nom    = user.user_metadata?.nom    || '';

      if (!prenom && !nom && user.email) {
        prenom = user.email.split('@')[0];
      }

      setCoach({
        prenom,
        nom,
        email: user.email || '',
        photo_url: data?.photo_url ?? null,
      });
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Titre de la page courante pour la barre mobile
  const currentPage = navItems.find(item =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );
  const pageTitle = currentPage?.label ?? 'Dashboard';

  // Avatar réutilisable
  const avatarEl = coach?.photo_url ? (
    <img
      src={coach.photo_url}
      alt="Avatar"
      className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400 flex-shrink-0"
    />
  ) : (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
      style={{ background: '#00C896' }}
    >
      {(coach?.prenom?.[0] || coach?.nom?.[0] || coach?.email?.[0] || '?').toUpperCase()}
    </div>
  );

  // Rendu des liens de navigation
  const renderNavItems = (onItemClick?: () => void, compact = false) =>
    navItems.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end}
        onClick={onItemClick}
        className={({ isActive }) =>
          `group relative flex items-center ${compact ? 'justify-center' : 'gap-3'} p-3 rounded-xl mb-1 transition-all duration-200 ${
            isActive
              ? 'text-white shadow-lg shadow-[#00C896]/30'
              : 'text-white/70 hover:bg-[#00C896]/20 hover:text-white'
          }`
        }
        style={({ isActive }) => isActive ? { backgroundColor: '#00C896' } : {}}
      >
        <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.2 }}>
          <item.icon size={20} className="flex-shrink-0" />
        </motion.div>
        {compact ? (
          // Tablette : tooltip au hover
          <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-lg z-50">
            {item.label}
          </span>
        ) : (
          <span className="font-medium">{item.label}</span>
        )}
      </NavLink>
    ));

  // Boutons bas de sidebar (thème + déconnexion)
  const renderBottomActions = (compact = false) => (
    <div className="p-4 border-t border-white/10 space-y-2">
      <button
        onClick={toggleTheme}
        className={`group relative flex items-center ${compact ? 'justify-center' : 'gap-3'} p-3 rounded-xl hover:bg-white/10 transition-colors w-full text-white/70 hover:text-white`}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-amber-400" />}
        {compact ? (
          <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-lg z-50">
            {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          </span>
        ) : (
          <span>{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>
        )}
      </button>

      <button
        onClick={handleLogout}
        className={`group relative flex items-center ${compact ? 'justify-center' : 'gap-3'} p-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors w-full`}
      >
        <LogOut size={20} />
        {compact ? (
          <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-lg z-50">
            Déconnexion
          </span>
        ) : (
          <span>Déconnexion</span>
        )}
      </button>
    </div>
  );

  return (
    <div id="coach-app" className={`flex h-screen bg-gray-50 dark:bg-[#0F1923] transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>

      {/* ── MOBILE : Overlay + Drawer (< 768px) ──────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay semi-transparent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer slide-in depuis la gauche */}
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring' as const, damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 flex flex-col shadow-xl md:hidden"
              style={{ background: '#1A2B4A' }}
            >
              <div className="p-4 flex items-center justify-between border-b border-white/10 h-16">
                <Logo height={32} textVariant="white" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/70" />
                </button>
              </div>
              <nav className="flex-1 p-3 overflow-y-auto">
                {renderNavItems(() => setMobileMenuOpen(false))}
              </nav>
              {renderBottomActions()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── TABLETTE : Sidebar 64px icônes (768-1023px) ───── */}
      <aside
        className="hidden md:flex lg:hidden flex-col flex-shrink-0 shadow-xl w-16"
        style={{ background: '#1A2B4A' }}
      >
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#00C896' }}
          >
            <span className="text-white font-bold text-xs">MC</span>
          </div>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {renderNavItems(undefined, true)}
        </nav>
        {renderBottomActions(true)}
      </aside>

      {/* ── DESKTOP : Sidebar 256px complète (≥ 1024px) ───── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 shadow-xl w-64"
        style={{ background: '#1A2B4A' }}
      >
        <div className="p-4 flex flex-col gap-0.5 border-b border-white/10 h-16 justify-center">
          <Logo height={32} textVariant="white" />
          <span className="text-xs italic text-white/50 pl-10">
            L'app qui prend soin de votre activité
          </span>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {renderNavItems()}
        </nav>
        {renderBottomActions()}
      </aside>

      {/* ── CONTENU PRINCIPAL ─────────────────────────────── */}
      <main className="flex-1 overflow-auto min-w-0">

        {/* Barre mobile fixe (< 768px) */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4 bg-white dark:bg-[#1A2535] border-b border-gray-200 dark:border-[#2E3D55] shadow-sm">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#243044] rounded-xl transition-colors"
          >
            <Menu size={22} className="text-gray-700 dark:text-[#D4DAE6]" />
          </button>
          <span className="font-semibold text-gray-800 dark:text-[#E8EDF5]">{pageTitle}</span>
          <div className="cursor-pointer" onClick={() => navigate('/app/settings')}>
            {avatarEl}
          </div>
        </div>

        {/* Header desktop/tablette (≥ 768px) */}
        <header className="hidden md:block sticky top-0 z-10 bg-white dark:bg-[#1A2535] border-b border-[#E5E7EB] dark:border-[#2E3D55] px-8 py-4">
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
                title="Notifications bientôt disponibles"
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-[#243044] rounded-xl transition-colors"
              >
                <Bell size={20} className="text-gray-400 dark:text-[#8896A8]" />
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-[#2E3D55] cursor-pointer"
                onClick={() => navigate('/app/settings')}
                title="Mes paramètres"
              >
                {avatarEl}
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800 dark:text-[#E8EDF5]">
                    {coach?.prenom || coach?.nom || coach?.email?.split('@')[0] || 'Mon profil'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#8896A8]">Coach</p>
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Contenu des pages — pt-14 compense la barre mobile fixe */}
        <div className="pt-14 md:pt-0">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="seances" element={<Seances />} />
            <Route path="programmes" element={<Programmes />} />
            <Route path="metriques" element={<Metriques />} />
            <Route path="attestations" element={<Attestations />} />
            <Route path="facturation" element={<Facturation />} />
            <Route path="emails" element={<EmailReminders />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>

      {/* ── CHATBOT IA — bouton flottant + panneau ───────── */}
      <AnimatePresence>
        {chatbotOpen && <ChatbotIA onClose={() => setChatbotOpen(false)} />}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setChatbotOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl text-white font-semibold text-sm shadow-xl"
        style={{ background: '#1A2B4A', boxShadow: '0 8px 30px rgba(26,43,74,0.35)' }}
      >
        <Bot size={20} />
        Assistant IA
      </motion.button>
    </div>
  );
}
