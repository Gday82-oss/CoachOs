import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';

interface DemoModalProps {
  onClose: () => void;
}

const slides = [
  {
    bg: 'linear-gradient(135deg, #00C896, #1A2B4A)',
    icon: null,
    title: 'La plateforme tout-en-un pour coachs sportifs',
    subtitle: null,
    isLogo: true,
  },
  {
    bg: '#1A2B4A',
    icon: '🤖',
    title: 'Assistant IA Coach',
    subtitle: 'Créez des programmes personnalisés en quelques secondes',
    isLogo: false,
  },
  {
    bg: '#1A2B4A',
    icon: '📊',
    title: 'Suivi client complet',
    subtitle: 'Métriques, séances, programmes au même endroit',
    isLogo: false,
  },
  {
    bg: '#1A2B4A',
    icon: '📄',
    title: 'Facturation automatique',
    subtitle: 'Factures et attestations mutuelle en 1 clic',
    isLogo: false,
  },
  {
    bg: '#00C896',
    icon: null,
    title: 'Rejoignez MyCareCoach',
    subtitle: null,
    isLogo: false,
    isCta: true,
  },
] as const;

export default function DemoModal({ onClose }: DemoModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[600px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: (slide as { bg: string }).bg, minHeight: 360, transition: 'background 0.4s' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-white/80"
            style={{
              width: `${((currentSlide + 1) / slides.length) * 100}%`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center justify-center text-center px-10 py-16 gap-6"
          >
            {slide.isLogo && (
              <div className="mb-2">
                <Logo height={48} />
              </div>
            )}
            {'icon' in slide && slide.icon && (
              <span className="text-6xl">{slide.icon}</span>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {slide.title}
            </h2>
            {'subtitle' in slide && slide.subtitle && (
              <p className="text-white/80 text-base max-w-md">{slide.subtitle}</p>
            )}
            {'isCta' in slide && slide.isCta && (
              <Link
                to="/register"
                onClick={onClose}
                className="mt-2 inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-white font-semibold text-[#00C896] text-base hover:scale-105 transition-transform shadow-lg"
              >
                Commencer gratuitement
              </Link>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.4)' }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
