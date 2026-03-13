import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, UserPlus, LogIn } from 'lucide-react';
import ForgotPassword from './ForgotPassword';

interface AuthProps {
  initialMode?: 'login' | 'register';
}

export default function Auth({ initialMode = 'login' }: AuthProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getAuthErrorMessage = (message: string): string => {
    if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
      return 'Email ou mot de passe incorrect.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Veuillez confirmer votre adresse email avant de vous connecter.';
    }
    if (message.includes('User already registered') || message.includes('already been registered')) {
      return 'Un compte existe déjà avec cet email.';
    }
    if (message.includes('Password should be at least')) {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'Trop de tentatives. Veuillez patienter quelques minutes.';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError('Impossible de se connecter avec Google. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin && password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Connexion — redirige selon le rôle (client ou coach)
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        if (!data.user) {
          setError('Erreur lors de la connexion.');
          return;
        }

        const role = data.user?.user_metadata?.role;
        if (role === 'client') {
          await supabase.auth.signOut();
          setError('NOT_COACH');
          return;
        }

        navigate('/app');
      } else {
        // Inscription
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'coach',
              nom,
              prenom,
            },
          },
        });
        if (signUpError) throw signUpError;

        // Créer la ligne du coach dans la table "coachs"
        if (signUpData.user) {
          await supabase.from('coachs').insert({
            id: signUpData.user.id,
            email,
            prenom,
            nom,
          });
        }

        setError('');
        setIsLogin(true);
        // Afficher un message de succès via le champ error (couleur verte gérée ci-dessous)
        setError('SUCCESS');
      }
    } catch (err: any) {
      setError(getAuthErrorMessage(err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">MyCareCoach</h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Connectez-vous à votre espace' : 'Créez votre compte coach'}
          </p>
        </div>

        {error && error === 'SUCCESS' && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">
            Compte créé ! Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.
          </div>
        )}
        {error && error !== 'SUCCESS' && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error === 'NOT_COACH' ? (
              <>
                Vous n'êtes pas un coach. Rendez-vous sur l'interface client :{' '}
                <a
                  href="/client/login"
                  className="underline font-medium hover:text-red-800"
                >
                  https://mycarecoach.app/client/login
                </a>
              </>
            ) : (
              error
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required={!isLogin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              minLength={8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            {isLogin && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 mt-1"
              >
                Mot de passe oublié ?
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Chargement...'
            ) : isLogin ? (
              <>
                <LogIn size={20} />
                Se connecter
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Créer un compte
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-sm text-gray-400">ou</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 px-4 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.2z"/>
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.9 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 42.9 14.8 48 24 48z"/>
              <path fill="#FBBC05" d="M10.8 28.8c-.5-1.4-.8-2.8-.8-4.3s.3-3 .8-4.3v-6.2H2.7C1 17.2 0 20.5 0 24s1 6.8 2.7 9.9l8.1-5.1z"/>
              <path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C35.9 2.4 30.4 0 24 0 14.8 0 6.7 5.1 2.7 14.1l8.1 5.1C12.7 13.6 17.9 9.5 24 9.5z"/>
            </svg>
            Connexion avec Google
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-emerald-600 hover:text-emerald-700 text-sm"
          >
            {isLogin
              ? "Pas encore de compte ? S'inscrire"
              : 'Déjà un compte ? Se connecter'}
          </button>
        </div>

        <p className="mt-2 text-sm font-medium text-center text-emerald-600">
          Votre santé en mouvement
        </p>
        <p className="mt-4 text-xs text-center text-gray-500">
          Sport-santé sur ordonnance • Remboursé par mutuelle
        </p>
      </div>
    </div>
  );
}
