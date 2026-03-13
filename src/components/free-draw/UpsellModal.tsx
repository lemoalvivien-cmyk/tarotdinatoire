/**
 * UpsellModal — Écran de conversion post-tirage gratuit
 * Présente l'oracle complet à 3,90€/mois avec bouton Stripe
 */
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';

const FEATURES = [
  'Rituel quotidien · chaque jour, une carte qui se souvient',
  'Oracle narratif IA · analyse de vos patterns sur 30-90 jours',
  '10 tirages avancés · Croix celtique, Chemin de vie…',
  'Journal mystique · mémoire de votre voyage intérieur',
  'Profil énergétique · 5 dimensions actualisées chaque jour',
  'Synchronicités · détection des cartes récurrentes',
];

interface UpsellModalProps {
  cardName?: string;
  onClose?: () => void;
  inline?: boolean;
}

export function UpsellModal({ cardName, onClose, inline = false }: UpsellModalProps) {
  const navigate = useNavigate();
  const { startCheckout, checkoutLoading } = useSubscription();

  const handleSubscribe = async () => {
    try {
      // Redirect to auth first if not logged in, then checkout
      await startCheckout();
    } catch {
      navigate('/auth?redirect=/app');
    }
  };

  const handleFree = () => {
    if (onClose) onClose();
    else navigate('/');
  };

  const gold = 'hsl(var(--mp-brand-gold))';
  const violet = 'hsl(var(--mp-brand-violet))';
  const violet2 = 'hsl(var(--mp-brand-violet2))';

  const content = (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase border mb-3"
          style={{ borderColor: `${gold.replace(')', ' / 0.3)')}`, color: gold, backgroundColor: `${gold.replace(')', ' / 0.08)')}` }}
        >
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Oracle Complet
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white leading-snug">
          {cardName ? (
            <>
              <span style={{ color: gold }}>{cardName}</span> t'a ouvert une porte.
              <br />
              <span className="text-white/80">Veux-tu voir ce qui est derrière ?</span>
            </>
          ) : (
            <>Ça te parle ?<br /><span className="text-white/80">Veux-tu ça tous les jours ?</span></>
          )}
        </h2>
        <p className="text-white/50 text-sm leading-relaxed max-w-sm mx-auto">
          Un oracle qui apprend <em>ton</em> histoire. Qui se souvient. Qui voit ce que tu ne vois plus.
        </p>
      </div>

      {/* Feature list */}
      <div className="space-y-2.5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35 }}
            className="flex items-start gap-3"
          >
            <div
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
              style={{ backgroundColor: `${gold.replace(')', ' / 0.12)')}` }}
              aria-hidden="true"
            >
              <Check className="h-3 w-3" style={{ color: gold }} />
            </div>
            <p className="text-white/70 text-sm leading-snug">{f}</p>
          </motion.div>
        ))}
      </div>

      {/* Price + CTA */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ borderColor: `${gold.replace(')', ' / 0.2)')}`, backgroundColor: `${gold.replace(')', ' / 0.04)')}` }}
      >
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-serif text-4xl font-bold text-white">3,90€</span>
          <span className="text-white/50 text-sm">/mois · sans engagement</span>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={checkoutLoading}
          className="w-full h-14 rounded-xl text-base font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            background: `linear-gradient(135deg, ${violet}, ${violet2})`,
            boxShadow: `0 8px 30px hsl(var(--mp-brand-violet) / 0.4)`,
          }}
          aria-label="Débloquer l'oracle complet pour 3,90€ par mois"
        >
          <span className="flex items-center justify-center gap-2">
            {checkoutLoading ? (
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                aria-hidden="true"
              />
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                Débloquer l'oracle complet
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </>
            )}
          </span>
        </button>

        <div className="flex items-center justify-center gap-4 text-xs text-white/30">
          <span>Paiement Stripe sécurisé</span>
          <span>·</span>
          <span>Annulation en 1 clic</span>
          <span>·</span>
          <span>RGPD</span>
        </div>
      </div>

      {/* Secondary CTA */}
      <button
        onClick={handleFree}
        className="w-full text-sm text-white/35 hover:text-white/60 transition-colors py-2"
        aria-label="Non merci, je reviendrai demain"
      >
        Non, je reviendrai demain (1 gratuit/jour)
      </button>
    </div>
  );

  if (inline) return <div className="w-full">{content}</div>;

  return (
    <div
      className="rounded-2xl border p-6 sm:p-8 w-full max-w-md mx-auto"
      style={{
        borderColor: 'hsl(var(--mp-surface-border))',
        backgroundColor: 'hsl(var(--mp-bg-800) / 0.95)',
        boxShadow: '0 40px 100px hsl(265 55% 10% / 0.8)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Débloquer l'oracle complet"
    >
      {onClose && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      {content}
    </div>
  );
}
