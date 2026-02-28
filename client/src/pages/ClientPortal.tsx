import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Calendar, FileText, Activity, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientDashboard from './client/ClientDashboard';
import ClientSeances from './client/ClientSeances';
import ClientProgrammes from './client/ClientProgrammes';
import ClientMetriques from './client/ClientMetriques';

interface ClientProfile {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  coach_id: string;
}

export default function ClientPortal() {
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkClientAccess();
  }, []);

  async function checkClientAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Vérifier si l'utilisateur est un client (a un email dans clients_coach)
      const { data: clientData } = await supabase
        .from('clients_coach')
        .select('*')
        .eq('email', user.email)
        .single();

      if (clientData) {
        setClient(clientData);
      }
    } catch (error) {
      console.error('Erreur:', error);
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!client) {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    { path: '/client', icon: User, label: 'Mon espace' },
    { path: '/client/seances', icon: Calendar, label: 'Mes séances' },
    { path: '/client/programmes', icon: FileText, label: 'Mes programmes' },
    { path: '/client/metriques', icon: Activity, label: 'Mes métriques' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {client.prenom[0]}{client.nom[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{client.prenom} {client.nom}</p>
                  <p className="text-xs text-gray-500">Espace Client</p>
                </div>
              </div>

              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-gray-600 hover:bg-gray-100"
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full mt-8"
              >
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 lg:ml-0">
          <Routes>
            <Route path="/" element={<ClientDashboard client={client} />} />
            <Route path="/seances" element={<ClientSeances client={client} />} />
            <Route path="/programmes" element={<ClientProgrammes client={client} />} />
            <Route path="/metriques" element={<ClientMetriques client={client} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
