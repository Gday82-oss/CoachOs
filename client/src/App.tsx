import { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Dumbbell, 
  CreditCard, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Seances from './pages/Seances';
import Programmes from './pages/Programmes';
import Paiements from './pages/Paiements';
import SettingsPage from './pages/Settings';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { path: '/', icon: Users, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/seances', icon: Calendar, label: 'Séances' },
    { path: '/programmes', icon: Dumbbell, label: 'Programmes' },
    { path: '/paiements', icon: CreditCard, label: 'Paiements' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          {sidebarOpen && <h1 className="text-xl font-bold text-emerald-400">CoachOS</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                  isActive 
                    ? 'bg-emerald-600 text-white' 
                    : 'hover:bg-slate-800 text-gray-300'
                }`
              }
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {sidebarOpen && (
            <div className="text-sm text-gray-400">
              <p>Coach Pro</p>
              <p className="text-xs">Version 1.0</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/seances" element={<Seances />} />
          <Route path="/programmes" element={<Programmes />} />
          <Route path="/paiements" element={<Paiements />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
