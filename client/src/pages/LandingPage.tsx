import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  Activity,
  FileText,
  Star,
  Heart,
  Check,
  ChevronRight,
} from 'lucide-react';

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-indigo-50 min-h-screen flex items-center">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200 rounded-full opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200 rounded-full opacity-30 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Nouvelle plateforme pour coachs sportifs
        </span>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Le système d'exploitation
          <br />
          <span className="bg-gradient-to-r from-emerald-500 to-indigo-500 bg-clip-text text-transparent">
            des coachs sportifs
          </span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Gérez vos clients, programmes, séances et paiements —&nbsp;
          tout en un seul endroit.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105"
          >
            Commencer gratuitement
            <ChevronRight size={18} />
          </Link>

          <a
            href="#fonctionnalites"
            onClick={scrollToFeatures}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 shadow-sm transition-all duration-200 hover:scale-105"
          >
            Voir la démo
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-12 text-sm text-gray-500">
          Rejoignez plus de <span className="font-semibold text-gray-700">500+ coachs</span> qui font confiance à MyCareCoach
        </p>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Une vue d'ensemble de votre activité : chiffre d'affaires, séances à venir et alertes en temps réel.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
  {
    icon: Users,
    title: 'Gestion Clients',
    description: 'Fiches clients complètes, historique, objectifs et notes de suivi centralisés en un clic.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Calendar,
    title: 'Planification des séances',
    description: 'Calendrier intégré pour planifier, reprogrammer et confirmer vos séances sans friction.',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
  },
  {
    icon: Dumbbell,
    title: "Programmes d'entraînement",
    description: 'Créez des programmes personnalisés, exportez-les en PDF et partagez-les avec vos clients.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: Activity,
    title: 'Suivi des métriques',
    description: 'Suivez les progrès de chaque client : poids, VO2max, performances et courbes d'évolution.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: FileText,
    title: 'Facturation & Attestations',
    description: 'Générez factures et attestations sportives en quelques secondes, prêtes à envoyer.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
  },
];

function Features() {
  return (
    <section id="fonctionnalites" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Des outils pensés par des coachs, pour des coachs. Efficaces, simples, puissants.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description, color, bg }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white"
            >
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon size={24} className={color} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const testimonials = [
  {
    name: 'Sophie Marchand',
    role: 'Coach fitness & nutrition',
    avatar: 'SM',
    avatarColor: 'from-emerald-400 to-teal-500',
    text: 'MyCareCoach a transformé ma façon de travailler. Je gagne 3h par semaine sur l'administratif et mes clients sont ravis de recevoir leurs programmes directement sur la plateforme.',
  },
  {
    name: 'Julien Bertrand',
    role: 'Préparateur physique',
    avatar: 'JB',
    avatarColor: 'from-indigo-400 to-blue-500',
    text: 'La gestion des attestations sportives était un cauchemar. Maintenant, c'est automatique. Je recommande à tous mes collègues qui veulent professionnaliser leur activité.',
  },
  {
    name: 'Camille Leroux',
    role: 'Coach running & trail',
    avatar: 'CL',
    avatarColor: 'from-orange-400 to-rose-500',
    text: 'Le suivi des métriques est bluffant. Mes clients voient leurs progrès en temps réel et ça booste leur motivation. C'est devenu un argument de vente pour moi.',
  },
];

function Testimonials() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-gray-500">Des coachs comme vous qui ont franchi le pas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(({ name, role, avatar, avatarColor, text }) => (
            <div key={name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-6">"{text}"</p>

              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                >
                  {avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{name}</p>
                  <p className="text-gray-500 text-xs">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const plans = [
  {
    name: 'Gratuit',
    price: '0',
    period: 'pour toujours',
    description: 'Parfait pour démarrer votre activité.',
    features: [
      '3 clients maximum',
      'Dashboard & agenda',
      'Programmes de base',
      'Support par email',
    ],
    cta: 'Commencer gratuitement',
    to: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '19',
    period: 'par mois',
    description: 'Pour les coachs qui veulent scaler.',
    features: [
      'Clients illimités',
      'Facturation & attestations',
      'Suivi métriques avancé',
      'Rappels emails automatiques',
      'Export PDF',
      'Support prioritaire',
    ],
    cta: 'Choisir Pro',
    to: '/register',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '49',
    period: 'par mois',
    description: 'Pour les structures multi-coachs.',
    features: [
      'Tout de Pro',
      'Plusieurs coachs',
      'Tableau de bord directeur',
      'Gestion des permissions',
      'Intégrations avancées',
      'Support dédié 24/7',
    ],
    cta: 'Choisir Business',
    to: '/register',
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section id="tarifs" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Tarifs transparents
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Sans engagement. Changez de formule quand vous voulez.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map(({ name, price, period, description, features, cta, to, highlighted }) => (
            <div
              key={name}
              className={`rounded-2xl p-8 border transition-all duration-200 ${
                highlighted
                  ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 bg-gradient-to-b from-emerald-50 to-white relative'
                  : 'border-gray-200 bg-white hover:shadow-md'
              }`}
            >
              {highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
                    Le plus populaire
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
              <p className="text-gray-500 text-sm mb-4">{description}</p>

              <div className="flex items-end gap-1 mb-6">
                <span className="text-5xl font-extrabold text-gray-900">{price}€</span>
                <span className="text-gray-400 text-sm pb-2">/{period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                to={to}
                className={`block w-full text-center py-3 rounded-xl font-semibold transition-all duration-200 ${
                  highlighted
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 hover:scale-105'
                    : 'border border-gray-300 text-gray-700 hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center">
              <Heart size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">MyCareCoach</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </nav>

          {/* Copyright */}
          <p className="text-sm">© 2025 MyCareCoach. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center">
            <Heart size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">MyCareCoach</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#fonctionnalites" onClick={scrollToFeatures} className="hover:text-emerald-600 transition-colors">
            Fonctionnalités
          </a>
          <a href="#tarifs" onClick={(e) => { e.preventDefault(); document.getElementById('tarifs')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-emerald-600 transition-colors">
            Tarifs
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors hidden sm:block"
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            Essai gratuit
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans">
      <Navbar />
      {/* pt-16 to offset fixed navbar */}
      <div className="pt-16">
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
        <Footer />
      </div>
    </div>
  );
}
