import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Heart, LogIn } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/client');
    } catch (err: any) {
      setError(getErrorMessage(err.message || ''));
    } finally {
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

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
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
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Premiere connexion ?{' '}
          <span className="text-[#00C896] font-medium">Contactez votre coach</span>
        </p>
      </motion.div>
    </div>
  );
}
