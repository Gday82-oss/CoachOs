import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Heart, LogIn } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.2z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.9 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 42.9 14.8 48 24 48z"/>
    <path fill="#FBBC05" d="M10.8 28.8c-.5-1.4-.8-2.8-.8-4.3s.3-3 .8-4.3v-6.2H2.7C1 17.2 0 20.5 0 24s1 6.8 2.7 9.9l8.1-5.1z"/>
    <path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C35.9 2.4 30.4 0 24 0 14.8 0 6.7 5.1 2.7 14.1l8.1 5.1C12.7 13.6 17.9 9.5 24 9.5z"/>
  </svg>
);

export default function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getErrorMessage = (message: string): string => {
    if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
      return 'Email ou mot de passe incorrect.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Veuillez confirmer votre adresse email avant de vous connecter.';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'Trop de tentatives. Veuillez patienter quelques minutes.';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  };

  const doLogin = async () => {
    console.log('[ClientLogin] doLogin déclenché, email:', email);
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      console.log('[ClientLogin] Appel signInWithPassword...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[ClientLogin] Réponse Supabase:', { user: data?.user?.id, error: signInError?.message });

      if (signInError) throw signInError;

      if (!data.user) {
        setError('Erreur lors de la connexion.');
        return;
      }

      const userRole = data.user.user_metadata?.role;
      console.log('[ClientLogin] Rôle utilisateur:', userRole);

      if (userRole !== 'client') {
        await supabase.auth.signOut();
        setError('Vous n\'êtes pas un client. Rendez-vous sur /login pour un coach.');
        return;
      }

      console.log('[ClientLogin] → redirection vers /client');
      navigate('/client');
    } catch (err: any) {
      setError(getErrorMessage(err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin();
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://mycarecoach.app/client',
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError('Impossible de se connecter avec Google. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FAF7] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
        className="flex flex-col items-center mb-10"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00C896] to-[#00E5FF] flex items-center justify-center shadow-xl shadow-[#00C896]/30 mb-4">
          <Heart className="text-white" size={40} fill="white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">MyCareCoach</h1>
        <p className="text-[#00C896] font-medium text-sm mt-1">Votre santé en mouvement</p>
      </motion.div>

      {/* Carte de connexion */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 25, delay: 0.1 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-black/5 p-8"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-1">Mon espace personnel</h2>
        <p className="text-gray-500 text-sm mb-6">Connectez-vous pour accéder à votre suivi</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-2xl mb-4 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#00C896] focus:border-transparent outline-none text-gray-800 bg-gray-50 transition-all"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#00C896] focus:border-transparent outline-none text-gray-800 bg-gray-50 transition-all"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={doLogin}
            className="w-full bg-[#00C896] text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#00C896]/30 disabled:opacity-60 disabled:cursor-not-allowed mt-2 transition-opacity hover:opacity-90"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Séparateur */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">— ou —</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Bouton Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl py-3.5 px-4 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          <GoogleIcon />
          Continuer avec Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
          Premiere connexion ?{' '}
          <span className="text-[#00C896] font-medium">Contactez votre coach</span>
        </p>
      </motion.div>
    </div>
  );
}
