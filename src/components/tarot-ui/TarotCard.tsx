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
}

/**
 * Carte de Tarot avec flip 3D, hover lift, et états visuels
 * Inclut skeleton loading et fallback gracieux
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
}: TarotCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  // Preload image when URL changes
  useEffect(() => {
    if (!imageUrl) {
      setImageLoading(false);
      return;
    }

    // Check if already loaded
    if (isImageLoaded(imageUrl)) {
      setImageLoading(false);
      setImageError(false);
      return;
    }

    setImageLoading(true);
    setImageError(false);

    preloadImage(imageUrl)
      .then(() => {
        setImageLoading(false);
        setImageError(false);
      })
      .catch(() => {
        setImageLoading(false);
        setImageError(true);
      });
  }, [imageUrl]);

  // Générer un gradient fallback unique basé sur l'id
  const fallbackGradient = useMemo(() => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue1 = (hash * 37) % 360;
    const hue2 = (hue1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 40%, 25%), hsl(${hue2}, 50%, 15%))`;
  }, [id]);

  const showFallback = !imageUrl || imageError;
  const showSkeleton = imageUrl && imageLoading && !imageError;

  // Animation variants
  const cardVariants = {
    initial: { 
      rotateY: 0,
      y: 0,
      scale: 1,
    },
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
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'relative aspect-[2/3] w-full cursor-pointer',
        'perspective-1000',
        'focus:outline-none focus-visible:ring-2',
        'focus-visible:ring-mp-brand-violet focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      variants={cardVariants}
      initial="initial"
      animate={isRevealed ? 'revealed' : 'initial'}
      whileHover={!isDisabled ? 'hover' : undefined}
      whileTap={!isDisabled ? 'tap' : undefined}
      style={{ transformStyle: 'preserve-3d' }}
      aria-label={`Carte ${name}${isRevealed ? ' (révélée)' : ''}`}
    >
      {/* Glow effect */}
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
      />

      {/* Card face - Back */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl overflow-hidden',
          'backface-hidden transform-style-3d',
          'border-2 transition-colors duration-300',
          isSelected 
            ? 'border-mp-brand-gold shadow-mp-glow-g' 
            : 'border-mp-surface-border shadow-mp-card'
        )}
        style={{ 
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Back design */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--mp-bg-700)), hsl(var(--mp-bg-900)))',
          }}
        >
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 150" fill="none">
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
          {/* Center symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-30">✦</span>
          </div>
        </div>
      </div>

      {/* Card face - Front (revealed) */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl overflow-hidden',
          'backface-hidden transform-style-3d',
          'border-2 transition-colors duration-300',
          isSelected 
            ? 'border-mp-brand-gold shadow-mp-glow-g' 
            : 'border-mp-surface-border shadow-mp-card'
        )}
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        {/* Skeleton loading state */}
        {showSkeleton && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: fallbackGradient }}
          >
            {/* Shimmer animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                }}
              />
            </div>
            {/* Loading indicator */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              <span className="text-white/60 text-xs">Chargement...</span>
            </div>
          </div>
        )}

        {/* Fallback state (no image or error) */}
        {showFallback && !showSkeleton && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-4"
            style={{ background: fallbackGradient }}
          >
            {/* Decorative symbol */}
            <div className="flex-1 flex items-center justify-center">
              <span className="text-5xl text-white/40">✦</span>
            </div>
            {/* Card name */}
            <span className="text-center font-serif text-sm text-white/80 mb-4">
              {name}
            </span>
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

        {/* Name overlay (only when image is loaded) */}
        {!showFallback && !showSkeleton && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-white font-serif text-sm truncate block text-center">
              {name}
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

export default memo(TarotCard);
