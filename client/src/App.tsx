import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CoachApp from './CoachApp';
import ClientPortal from './pages/ClientPortal';
import ClientApp from './ClientApp';
import ClientLogin from './pages/client-mobile/ClientLogin';

function ForgotPasswordWrapper() {
  const navigate = useNavigate();
  return <ForgotPassword onBack={() => navigate('/login')} />;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'coach' | 'client' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fire immédiatement avec INITIAL_SESSION en Supabase v2
    // On évite ainsi le double appel checkUserType
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.email) {
        checkUserType(currentUser.email);
      } else {
        setUserType(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUserType(email: string) {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients_coach')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (clientData && !clientError) {
        setUserType('client');
        setLoading(false);
        return;
      }

      const { data: coachData, error: coachError } = await supabase
        .from('coachs')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (coachData && !coachError) {
        setUserType('coach');
        setLoading(false);
        return;
      }

      setUserType('coach');
    } catch (error) {
      console.error('Erreur checkUserType:', error);
      setUserType('coach');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth initialMode="register" />} />
      <Route path="/forgot-password" element={<ForgotPasswordWrapper />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Application protégée — guard inline pour éviter le remontage */}
      <Route
        path="/app/*"
        element={
          !user
            ? <Navigate to="/login" replace />
            : userType === 'client'
              ? <ClientPortal />
              : <CoachApp />
        }
      />

      {/* Page de connexion client (publique) */}
      <Route path="/client/login" element={<ClientLogin />} />

      {/* Interface client mobile-first PWA */}
      <Route
        path="/client/*"
        element={
          !user
            ? <Navigate to="/client/login" replace />
            : userType === 'client'
              ? <ClientApp />
              : <Navigate to="/app" replace />
        }
      />

      {/* Redirections legacy */}
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
