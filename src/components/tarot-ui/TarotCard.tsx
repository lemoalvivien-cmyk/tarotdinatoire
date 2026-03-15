import { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isImageLoaded, preloadImage } from '@/lib/preloadImages';

export interface TarotCardProps {
  id: string;
  name: string;
  imageUrl?: string;
  isRevealed?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  className?: string;
  flipDuration?: number;
  /** Position label for accessibility (ex: "Présent", "Avenir") */
  positionLabel?: string;
}

/**
 * Carte de Tarot avec flip 3D WCAG-AA accessible
 * aria-label dynamique · focus-visible or · skeleton shimmer doré
 */
export function TarotCard({
  id,
  name,
  imageUrl,
  isRevealed = false,
  isSelected = false,
  isDisabled = false,
  onClick,
  className,
  flipDuration = 0.75,
  positionLabel,
}: TarotCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [justRevealed, setJustRevealed] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!imageUrl) { setImageLoading(false); return; }
    if (isImageLoaded(imageUrl)) { setImageLoading(false); setImageError(false); return; }
    setImageLoading(true);
    setImageError(false);
    preloadImage(imageUrl)
      .then(() => { setImageLoading(false); setImageError(false); })
      .catch(() => { setImageLoading(false); setImageError(true); });
  }, [imageUrl]);

  // Gold shimmer on reveal
  useEffect(() => {
    if (isRevealed) {
      setJustRevealed(true);
      const t = setTimeout(() => setJustRevealed(false), 1500);
      return () => clearTimeout(t);
    }
  }, [isRevealed]);

  const fallbackGradient = useMemo(() => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue1 = (hash * 37) % 360;
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 40%, 25%), hsl(${hue2}, 50%, 15%))`;
  }, [id]);

  const showFallback = !imageUrl || imageError;
  const showSkeleton = imageUrl && imageLoading && !imageError;

  // Accessible label
  const ariaLabel = useMemo(() => {
    const parts: string[] = [];
    if (positionLabel) parts.push(`Position ${positionLabel}`);
    parts.push(`Carte ${name}`);
    if (isRevealed) parts.push('révélée');
    if (isSelected) parts.push('sélectionnée');
    if (isDisabled) parts.push('indisponible');
    return parts.join(', ');
  }, [name, isRevealed, isSelected, isDisabled, positionLabel]);

  const cardVariants = {
    initial: { rotateY: 0, y: 0, scale: 1 },
    revealed: {
      rotateY: shouldReduceMotion ? 0 : 180,
      transition: {
        duration: shouldReduceMotion ? 0.1 : flipDuration,
        ease: [0.34, 1.56, 0.64, 1] as const,
      },
    },
    hover: shouldReduceMotion ? {} : {
      y: -8,
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeOut' as const },
    },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'relative aspect-[2/3] w-full cursor-pointer group',
        'perspective-1000',
        // WCAG 2.2 AA: visible gold ring, 3px offset
        'focus:outline-none focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-mp-brand-gold',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      variants={cardVariants}
      initial="initial"
      animate={isRevealed ? 'revealed' : 'initial'}
      whileHover={!isDisabled ? 'hover' : undefined}
      whileTap={!isDisabled ? 'tap' : undefined}
      style={{ transformStyle: 'preserve-3d' }}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
    >
      {/* Glow effect (aria-hidden) */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl transition-all duration-300 -z-10',
          'blur-xl opacity-0',
          isSelected && 'opacity-70',
          !isSelected && !isDisabled && 'group-hover:opacity-40'
        )}
        style={{
          background: isSelected
            ? 'hsl(var(--mp-brand-gold))'
            : 'hsl(var(--mp-brand-violet))',
          transform: 'scale(1.1)',
        }}
        aria-hidden="true"
      />

      {/* Card Back */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl overflow-hidden',
          'backface-hidden transform-style-3d',
          'border-2 transition-colors duration-300',
          isSelected
            ? 'border-mp-brand-gold shadow-mp-glow-g'
            : 'border-mp-surface-border shadow-mp-card'
        )}
        style={{ backfaceVisibility: 'hidden' }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--mp-bg-700)), hsl(var(--mp-bg-900)))',
          }}
        >
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 150" fill="none" aria-hidden="true">
              <circle cx="50" cy="75" r="35" stroke="currentColor" strokeWidth="0.5" className="text-mp-brand-gold" />
              <circle cx="50" cy="75" r="25" stroke="currentColor" strokeWidth="0.3" className="text-mp-brand-violet" />
              <path
                d="M50 30 L55 65 L85 75 L55 85 L50 120 L45 85 L15 75 L45 65 Z"
                stroke="currentColor"
                strokeWidth="0.5"
                fill="none"
                className="text-mp-brand-gold"
              />
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-30" aria-hidden="true">✦</span>
          </div>
        </div>
      </div>

      {/* Card Front (revealed) */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl overflow-hidden',
          'backface-hidden transform-style-3d',
          'border-2 transition-colors duration-300',
          isSelected
            ? 'border-mp-brand-gold shadow-mp-glow-g'
            : 'border-mp-surface-border shadow-mp-card'
        )}
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        {/* Skeleton loading */}
        {showSkeleton && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: fallbackGradient }}
            aria-label={`Chargement de la carte ${name}`}
            role="img"
          >
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-0 -translate-x-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, hsl(var(--mp-brand-gold) / 0.15), transparent)',
                }}
                animate={shouldReduceMotion ? {} : { x: ['-100%', '300%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                aria-hidden="true"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'hsl(var(--mp-brand-gold) / 0.2)', borderTopColor: 'hsl(var(--mp-brand-gold) / 0.7)' }}
                aria-hidden="true"
              />
              <span className="text-white/60 text-xs">Chargement...</span>
            </div>
          </div>
        )}

        {/* Fallback */}
        {showFallback && !showSkeleton && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-4"
            style={{ background: fallbackGradient }}
            role="img"
            aria-label={name}
          >
            <div className="flex-1 flex items-center justify-center">
              <span className="text-5xl text-white/40" aria-hidden="true">✦</span>
            </div>
            <span className="text-center font-serif text-sm text-white/80 mb-4">{name}</span>
          </div>
        )}

        {/* Loaded image */}
        {!showFallback && !showSkeleton && imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Name overlay */}
        {!showFallback && !showSkeleton && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-white font-serif text-sm truncate block text-center">{name}</span>
          </div>
        )}

        {/* Gold shimmer on reveal */}
        {justRevealed && !shouldReduceMotion && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, transparent 20%, hsl(var(--mp-brand-gold) / 0.35) 50%, transparent 80%)',
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            aria-hidden="true"
          />
        )}
      </div>
    </motion.button>
  );
}

export default memo(TarotCard);
