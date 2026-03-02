import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CoachApp from './CoachApp';
import ClientPortal from './pages/ClientPortal';

function App() {
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<'coach' | 'client' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        checkUserType(session.user.email);
      } else {
        setUserType(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    
    if (session?.user?.email) {
      await checkUserType(session.user.email);
    } else {
      setLoading(false);
    }
  }

  async function checkUserType(email: string) {
    try {
      // Vérifier si c'est un coach
      const { data: coachData } = await supabase
        .from('coachs')
        .select('id')
        .eq('email', email)
        .single();

      if (coachData) {
        setUserType('coach');
        setLoading(false);
        return;
      }

      // Vérifier si c'est un client
      const { data: clientData } = await supabase
        .from('clients_coach')
        .select('id')
        .eq('email', email)
        .single();

      if (clientData) {
        setUserType('client');
        setLoading(false);
        return;
      }

      // Par défaut, considérer comme coach
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

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword onBack={() => window.location.href = '/auth'} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Redirection selon le type d'utilisateur
  if (userType === 'client') {
    return <ClientPortal />;
  }

  return <CoachApp />;
}

export default App;
