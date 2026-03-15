/**
 * Page Tirage Gratuit — /tirage-gratuit
 * Accessible sans compte. Flux : FreeDraw → Interprétation → UpsellModal
 */
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FreeDraw } from '@/components/free-draw/FreeDraw';
import { SEOHead } from '@/components/seo/SEOHead';

export default function FreeDrawPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, hsl(260 38% 5%) 0%, hsl(260 33% 7%) 60%, hsl(260 28% 6%) 100%)' }}
    >
      <SEOHead
        title="Ton tirage gratuit · Tarot Dinatoire"
        description="1 carte tirée pour toi, interprétée par l'IA. Sans compte, sans frais. 1 tirage gratuit par jour."
        canonical="https://tarotdinatoire.lovable.app/tirage-gratuit"
      />

      {/* Header minimal */}
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Accueil
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" style={{ color: 'hsl(var(--mp-brand-gold))' }} aria-hidden="true" />
          <span className="font-serif text-white/80 text-sm">Tarot Dinatoire</span>
        </div>
        <div className="w-20" aria-hidden="true" />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8 sm:py-12">
        {/* Stars BG */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
          {Array.from({ length: 60 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: 'rgba(210,195,255,0.4)',
              }}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto space-y-8">
          {/* Titre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3"
          >
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
              Ton message du jour
            </h1>
            <p className="text-sm" style={{ color: 'hsl(var(--mp-text-muted))' }}>
              1 carte · interprétation IA · gratuit · 1 par jour
            </p>
          </motion.div>

          {/* Free Draw Component */}
          <FreeDraw />
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="text-center py-4 px-5">
        <p className="text-xs" style={{ color: 'hsl(var(--mp-text-muted) / 0.5)' }}>
          1 tirage gratuit par jour · Sans compte requis ·{' '}
          <Link to="/legal/privacy" className="hover:text-white/50 underline-offset-2 hover:underline transition-colors">
            Confidentialité
          </Link>
        </p>
      </footer>
    </div>
  );
}
