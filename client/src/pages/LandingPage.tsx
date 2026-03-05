import { useState, useEffect, useRef, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Dumbbell,
  Activity, FileText, Star, Check, ArrowRight,
  Menu, X, ChevronRight,
} from 'lucide-react';
import Logo from '../components/Logo';

// ─────────────────────────────────────────────────────────
// Hooks utilitaires
// ─────────────────────────────────────────────────────────

/** Détecte si l'utilisateur a scrollé au-delà de `threshold` pixels. */
function useScrolled(threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);
  return scrolled;
}

/** Retourne [ref, isVisible] — isVisible passe à true dès que l'élément entre dans le viewport. */
function useScrollReveal<T extends Element>(options?: IntersectionObserverInit): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─────────────────────────────────────────────────────────
// Données
// ─────────────────────────────────────────────────────────

const features = [
  { icon: LayoutDashboard, title: 'Dashboard',         description: "Vue d'ensemble temps réel : revenus, séances à venir, alertes et activité récente.",          color: '#6366F1', bg: '#EEF2FF' },
  { icon: Users,           title: 'Gestion Clients',   description: 'Fiches complètes, historique, objectifs, notes et suivi personnalisé de chaque client.',        color: '#00C896', bg: '#E6FAF5' },
  { icon: Calendar,        title: 'Planification',     description: 'Calendrier intégré pour planifier, reprogrammer et confirmer vos séances sans friction.',        color: '#0EA5E9', bg: '#E0F2FE' },
  { icon: Dumbbell,        title: 'Programmes',        description: "Créez des programmes d'entraînement personnalisés, exportez en PDF, partagez en un clic.",       color: '#F97316', bg: '#FFF7ED' },
  { icon: Activity,        title: 'Métriques',         description: "Suivez les progrès de chaque client : poids, VO₂max, performances et courbes d'évolution.",      color: '#EF4444', bg: '#FEF2F2' },
  { icon: FileText,        title: 'Facturation',       description: 'Factures professionnelles, attestations mutuelle et suivi des paiements en quelques secondes.', color: '#8B5CF6', bg: '#F5F3FF' },
];

const testimonials = [
  {
    name: 'Sophie Marchand', role: 'Coach fitness & nutrition, Lyon',
    avatar: 'SM', avatarColor: 'from-[#00C896] to-[#00E5FF]',
    text: "MyCareCoach a transformé ma façon de travailler. Je gagne 4h par semaine sur l'administratif — mes clients reçoivent leurs programmes directement sur la plateforme.",
  },
  {
    name: 'Julien Bertrand', role: 'Préparateur physique, Paris',
    avatar: 'JB', avatarColor: 'from-[#6366F1] to-[#0EA5E9]',
    text: "La gestion des attestations sportives était un cauchemar. Maintenant, c'est automatique. Je recommande à tous mes collègues qui veulent professionnaliser leur activité.",
  },
  {
    name: 'Camille Leroux', role: 'Coach running & trail, Bordeaux',
    avatar: 'CL', avatarColor: 'from-[#F97316] to-[#EF4444]',
    text: "Le suivi des métriques est bluffant. Mes clients voient leurs progrès en temps réel — ça booste leur motivation et c'est devenu un vrai argument de vente pour moi.",
  },
];

const plans = [
  {
    name: 'Gratuit', price: '0', period: 'pour toujours',
    description: 'Pour démarrer sans risque.',
    features: ['3 clients maximum', 'Dashboard & calendrier', 'Programmes de base', 'Support par email'],
    cta: 'Commencer gratuitement', highlighted: false,
  },
  {
    name: 'Pro', price: '19', period: 'par mois',
    description: 'Pour les coachs qui veulent scaler.',
    features: ['Clients illimités', 'Facturation & attestations', 'Métriques avancées', 'Rappels automatiques', 'Export PDF', 'Support prioritaire'],
    cta: 'Choisir Pro', highlighted: true,
  },
  {
    name: 'Business', price: '49', period: 'par mois',
    description: 'Pour les structures multi-coachs.',
    features: ['Tout de Pro inclus', 'Multi-coachs', 'Dashboard direction', 'Intégrations avancées', 'Gestion des permissions', 'Support dédié 24/7'],
    cta: 'Choisir Business', highlighted: false,
  },
];

// ─────────────────────────────────────────────────────────
// Composants de section
// ─────────────────────────────────────────────────────────

function scrollToId(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
}

// ── Header ──────────────────────────────────────────────

function Header() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" aria-label="Accueil">
          <Logo height={36} />
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1A2B4A]">
          <a href="#fonctionnalites" onClick={scrollToId('fonctionnalites')}
            className="hover:text-[#00C896] transition-colors">Fonctionnalités</a>
          <a href="#tarifs" onClick={scrollToId('tarifs')}
            className="hover:text-[#00C896] transition-colors">Tarifs</a>
          <a href="#temoignages" onClick={scrollToId('temoignages')}
            className="hover:text-[#00C896] transition-colors">À propos</a>
        </nav>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login"
            className="text-sm font-medium text-[#1A2B4A] hover:text-[#00C896] transition-colors px-3 py-2">
            Connexion
          </Link>
          <Link to="/register"
            className="text-sm font-semibold px-5 py-2.5 rounded-full text-white transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[#00C896]/25"
            style={{ background: 'linear-gradient(135deg, #00C896, #00E5FF)' }}>
            S'inscrire
          </Link>
        </div>

        {/* Hamburger mobile */}
        <button
          className="md:hidden p-2 rounded-lg text-[#1A2B4A] hover:bg-gray-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
          {(['fonctionnalites', 'tarifs', 'temoignages'] as const).map((id) => (
            <a key={id}
              href={`#${id}`}
              onClick={(e) => { scrollToId(id)(e); setOpen(false); }}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#1A2B4A] hover:bg-[#F0FAF7] hover:text-[#00C896] capitalize transition-colors"
            >
              {id === 'temoignages' ? 'À propos' : id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link to="/login" onClick={() => setOpen(false)}
              className="block text-center py-2.5 text-sm font-medium text-[#1A2B4A] border border-gray-200 rounded-lg hover:border-[#00C896] transition-colors">
              Connexion
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              className="block text-center py-2.5 text-sm font-semibold text-white rounded-lg"
              style={{ background: 'linear-gradient(135deg, #00C896, #00E5FF)' }}>
              S'inscrire gratuitement
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────

function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 420" fill="none" aria-hidden className="w-full max-w-lg animate-float">
      <defs>
        <linearGradient id="hero-g1" x1="0" y1="0" x2="480" y2="420" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00C896" stopOpacity="0.15" />
          <stop offset="1" stopColor="#00E5FF" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="hero-g2" x1="240" y1="0" x2="240" y2="420" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00C896" />
          <stop offset="1" stopColor="#00E5FF" />
        </linearGradient>
        <filter id="hero-blur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Cercles de fond */}
      <circle cx="360" cy="200" r="200" fill="url(#hero-g1)" />
      <circle cx="300" cy="260" r="120" fill="#00E5FF" fillOpacity="0.06" />
      <circle cx="160" cy="100" r="80"  fill="#00C896"  fillOpacity="0.08" />

      {/* Tracé ECG principal */}
      <path
        d="M 40,210 H 120 L 135,160 L 148,262 L 162,118 L 176,302 L 190,210 H 440"
        stroke="url(#hero-g2)" strokeWidth="2.5" strokeLinecap="round"
        className="animate-draw-line"
      />

      {/* Cœur central semi-transparent */}
      <path
        d="M 300,150 C 300,150 268,118 252,133 C 240,145 268,167 300,190 C 332,167 360,145 348,133 C 332,118 300,150 300,150Z"
        fill="url(#hero-g2)" opacity="0.18"
      />
      <path
        d="M 300,150 C 300,150 268,118 252,133 C 240,145 268,167 300,190 C 332,167 360,145 348,133 C 332,118 300,150 300,150Z"
        stroke="#00C896" strokeWidth="1.5" fill="none" opacity="0.4"
      />

      {/* Carte "Dashboard" flottante */}
      <rect x="320" y="230" width="130" height="76" rx="12" fill="white" opacity="0.9" filter="url(#hero-blur)" />
      <rect x="320" y="230" width="130" height="76" rx="12" fill="white" stroke="#00C896" strokeOpacity="0.2" strokeWidth="1" />
      <rect x="332" y="243" width="40" height="6" rx="3" fill="#00C896" opacity="0.7" />
      <rect x="332" y="254" width="60" height="4" rx="2" fill="#1A2B4A" opacity="0.2" />
      <rect x="332" y="263" width="50" height="4" rx="2" fill="#1A2B4A" opacity="0.15" />
      {/* Mini graphique dans la carte */}
      <polyline points="332,290 342,282 352,286 362,275 372,278 382,270 392,274 402,266 412,269 420,262"
        stroke="#00C896" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Points décoratifs */}
      <circle cx="80"  cy="80"  r="6"  fill="#00C896" opacity="0.4" />
      <circle cx="430" cy="70"  r="10" fill="#00E5FF" opacity="0.3" />
      <circle cx="60"  cy="330" r="8"  fill="#1A2B4A" opacity="0.12" />
      <circle cx="440" cy="350" r="5"  fill="#00C896" opacity="0.5" />
      <circle cx="200" cy="350" r="4"  fill="#00E5FF" opacity="0.4" />

      {/* Croix médicale */}
      <line x1="450" y1="150" x2="450" y2="172" stroke="#00C896" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <line x1="439" y1="161" x2="461" y2="161" stroke="#00C896" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />

      <line x1="90" y1="250" x2="90" y2="266" stroke="#1A2B4A" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      <line x1="82" y1="258" x2="98" y2="258" stroke="#1A2B4A" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
    </svg>
  );
}

function Hero() {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();

  return (
    <section
      className="min-h-screen flex items-center pt-16"
      style={{
        background: 'radial-gradient(ellipse at 15% 55%, rgba(0,200,150,.10) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(0,229,255,.08) 0%, transparent 50%), #F0FAF7',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Texte */}
          <div
            ref={ref}
            className={`flex-1 text-center lg:text-left transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {/* Badge animé */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
              style={{ background: 'rgba(0,200,150,.12)', color: '#00A87E' }}>
              <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse-dot" />
              Sport-santé sur ordonnance · Remboursé mutuelle
            </span>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
              <span className="text-[#1A2B4A]">L'app qui prend soin</span>
              <br />
              <span style={{ background: 'linear-gradient(135deg, #00C896 0%, #00E5FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                de votre activité
              </span>
            </h1>

            <p className="text-lg text-gray-500 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Consacrez-vous à ce qui compte vraiment — vos clients.
              MyCareCoach gère le reste.
            </p>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-12">
              <Link to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-semibold text-base transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-[#00C896]/30"
                style={{ background: 'linear-gradient(135deg, #00C896, #00E5FF)' }}>
                Commencer gratuitement
                <ArrowRight size={18} />
              </Link>
              <a href="#fonctionnalites" onClick={scrollToId('fonctionnalites')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-base text-[#1A2B4A] bg-white border-2 border-[#1A2B4A]/10 hover:border-[#00C896] hover:text-[#00C896] transition-all duration-200">
                Voir la démo
                <ChevronRight size={18} />
              </a>
            </div>

            {/* Stats bar avec séparateurs verticaux */}
            <div className="flex flex-wrap justify-center lg:justify-start pt-4 border-t border-[#1A2B4A]/8">
              {[
                { value: '500+', label: 'Coachs actifs' },
                { value: '98%',  label: 'Satisfaction' },
                { value: '4.9/5', label: 'Note moyenne' },
              ].map(({ value, label }, i) => (
                <div key={label} className="flex items-center">
                  {i > 0 && <div className="w-px h-8 mx-6 bg-[#1A2B4A]/15" />}
                  <div className="text-center lg:text-left">
                    <div className="font-display text-2xl font-extrabold text-[#00C896]">{value}</div>
                    <div className="text-xs text-gray-500 font-medium">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="flex-1 hidden lg:flex justify-center">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────

function Features() {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();

  return (
    <section id="fonctionnalites" className="bg-white">
      {/* Vague de transition depuis le hero vert */}
      <div className="overflow-hidden" style={{ marginTop: '-2px' }}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full block" style={{ height: 60 }}>
          <path d="M0,0 L1440,0 L1440,30 C1080,80 360,80 0,30 Z" fill="#F0FAF7" />
        </svg>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ background: 'rgba(0,200,150,.10)', color: '#00A87E' }}>
            Fonctionnalités
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#1A2B4A] mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Des outils pensés par des coachs, pour des coachs. Efficaces, simples, puissants.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, color, bg }, i) => (
            <FeatureCard key={title} icon={Icon} title={title} description={description} color={color} bg={bg} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );

}

function FeatureCard({ icon: Icon, title, description, color, bg, delay }: {
  icon: React.ElementType; title: string; description: string;
  color: string; bg: string; delay: number;
}) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms`, backgroundColor: '#F8FFFE' }}
    >
      {/* Bordure colorée en haut de la carte au hover */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: color }}
      />
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110"
        style={{ background: bg }}>
        <Icon size={24} style={{ color }} />
      </div>
      <h3 className="font-display text-lg font-bold text-[#1A2B4A] mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      <div className="mt-4 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
}

// ── Testimonials ─────────────────────────────────────────

function Testimonials() {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();

  return (
    <section id="temoignages" className="py-24" style={{ background: '#0D1B2A' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ background: 'rgba(0,200,150,.15)', color: '#00C896' }}>
            Témoignages
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-gray-400 text-lg">Des coachs partout en France qui ont franchi le pas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, avatar, avatarColor, text }, i) => (
            <TestimonialCard key={name} name={name} role={role} avatar={avatar} avatarColor={avatarColor} text={text} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ name, role, avatar, avatarColor, text, delay }: {
  name: string; role: string; avatar: string; avatarColor: string;
  text: string; delay: number;
}) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{
        transitionDelay: `${delay}ms`,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Étoiles */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mb-6">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{name}</p>
          <p className="text-gray-500 text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ── Pricing ──────────────────────────────────────────────

function Pricing() {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();

  return (
    <section id="tarifs" className="py-24" style={{ background: '#F0FAF7' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ background: 'rgba(0,200,150,.12)', color: '#00A87E' }}>
            Tarifs
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#1A2B4A] mb-4">
            Tarifs simples et transparents
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Sans engagement. Changez de formule quand vous voulez.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map(({ name, price, period, description, features: pf, cta, highlighted }, i) => (
            <PricingCard key={name} name={name} price={price} period={period} description={description}
              features={pf} cta={cta} highlighted={highlighted} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ name, price, period, description, features: pf, cta, highlighted, delay }: {
  name: string; price: string; period: string; description: string;
  features: string[]; cta: string; highlighted: boolean; delay: number;
}) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`rounded-2xl p-8 relative transition-all duration-300 hover:-translate-y-1
        ${highlighted ? 'shadow-2xl scale-105' : 'hover:shadow-lg'}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{
        transitionDelay: `${delay}ms`,
        background: highlighted ? '#1A2B4A' : 'white',
        border: highlighted ? '2px solid #00C896' : '1px solid #E5E7EB',
      }}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #00C896, #00E5FF)' }}>
            ✦ Populaire
          </span>
        </div>
      )}

      <h3 className={`font-display text-xl font-extrabold mb-1 ${highlighted ? 'text-white' : 'text-[#1A2B4A]'}`}>
        {name}
      </h3>
      <p className={`text-sm mb-5 ${highlighted ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>

      <div className="flex items-end gap-1 mb-6">
        <span className={`font-display text-5xl font-extrabold ${highlighted ? 'text-white' : 'text-[#1A2B4A]'}`}>
          {price}€
        </span>
        <span className={`text-sm pb-2 ${highlighted ? 'text-gray-400' : 'text-gray-400'}`}>/{period}</span>
      </div>

      <ul className="space-y-3 mb-8">
        {pf.map((feat) => (
          <li key={feat} className={`flex items-start gap-3 text-sm ${highlighted ? 'text-gray-300' : 'text-gray-600'}`}>
            <Check size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#00C896' }} />
            {feat}
          </li>
        ))}
      </ul>

      <Link to="/register"
        className={`block w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 ${
          highlighted
            ? 'text-[#1A2B4A] hover:shadow-lg hover:shadow-[#00C896]/30'
            : 'bg-white border-2 border-[#1A2B4A] text-[#1A2B4A] font-bold hover:bg-[#1A2B4A] hover:text-white'
        }`}
        style={highlighted ? { background: 'linear-gradient(135deg, #00C896, #00E5FF)' } : {}}
      >
        {cta}
      </Link>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────

function Footer() {
  const footerLinks = {
    Produit: ['Fonctionnalités', 'Tarifs', 'Nouveautés', 'Documentation'],
    Légal:   ['CGU', 'Confidentialité', 'Mentions légales', 'Cookies'],
    Contact: ['Support', 'contact@mycarecoach.app', 'Blog', 'Partenaires'],
  };

  return (
    <footer style={{ background: '#0D1B2A' }} className="text-gray-400 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/8">
          {/* Brand */}
          <div>
            <Logo height={34} textVariant="white" />
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              La plateforme tout-en-un pour coachs sportifs.
              Sport-santé sur ordonnance · Remboursé mutuelle.
            </p>
          </div>

          {/* Colonnes de liens */}
          {Object.entries(footerLinks).map(([col, links]) => (
            <div key={col}>
              <h4 className="font-display font-bold text-white text-sm mb-4">{col}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-500 hover:text-[#00C896] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p>© 2025 MyCareCoach. Tous droits réservés.</p>
          <p>Fait avec ♥ pour les coachs sportifs de France</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Header />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
