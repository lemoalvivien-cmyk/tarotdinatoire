import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { CARD_BACK_URL } from '@/constants/tarotAssets';
import type { TarotCard } from '@/types/tarot';

interface PremiumCardGridProps {
  cards: TarotCard[];
  selectedCardIds: string[];
  maxCards: number;
  currentPositionLabel?: string | null;
  onCardSelect?: (card: TarotCard) => void;
}

/**
 * Premium card selection grid with:
 * - Responsive grid layout (no fan)
 * - Golden glow hover effect
 * - Selection animation (lift + scale)
 * - Dynamic counter
 * - 44px+ touch targets
 */
export function PremiumCardGrid({
  cards,
  selectedCardIds,
  maxCards,
  currentPositionLabel,
  onCardSelect,
}: PremiumCardGridProps) {
  const [flyingCard, setFlyingCard] = useState<string | null>(null);
  const isComplete = selectedCardIds.length >= maxCards;
  const remaining = maxCards - selectedCardIds.length;

  // Filter out already selected cards - memoized for performance
  const availableCards = useMemo(
    () => cards.filter(c => !selectedCardIds.includes(c.id)),
    [cards, selectedCardIds]
  );

  const handleCardClick = useCallback((card: TarotCard) => {
    if (isComplete || !onCardSelect) return;
    
    // Trigger flying animation
    setFlyingCard(card.id);
    
    // Wait for animation, then select
    setTimeout(() => {
      onCardSelect(card);
      setFlyingCard(null);
    }, 400);
  }, [isComplete, onCardSelect]);

  return (
    <div className="space-y-6">
      {/* Dynamic counter */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key="counter"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="inline-flex flex-col items-center gap-2"
            >
              {/* Position indicator */}
              {currentPositionLabel && (
                <motion.span
                  key={currentPositionLabel}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-4 py-1.5 rounded-full bg-mp-brand-gold/20 border border-mp-brand-gold/30 text-mp-brand-gold text-sm font-medium"
                >
                  {currentPositionLabel}
                </motion.span>
              )}
              
              {/* Counter message */}
              <motion.p 
                className="text-white/90 text-lg font-serif"
                key={remaining}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                Sélectionnez encore{' '}
                <span className="text-mp-brand-gold font-semibold">
                  {remaining} carte{remaining > 1 ? 's' : ''}
                </span>
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/20 border border-green-500/40"
            >
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-medium">Sélection complète</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Grid */}
      <div className="relative">
        {/* Ambient glow behind grid */}
        <div 
          className="absolute inset-0 -m-8 rounded-3xl blur-3xl opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--mp-brand-violet)), transparent 70%)',
          }}
        />
        
        {/* Grid - responsive with good touch targets */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
          <AnimatePresence mode="popLayout">
            {availableCards.map((card, index) => (
              <SelectableGridCard
                key={card.id}
                card={card}
                index={index}
                isFlying={flyingCard === card.id}
                isDisabled={isComplete}
                onClick={() => handleCardClick(card)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="max-w-sm mx-auto">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-white/60">Progression</span>
          <span className="text-white font-medium">
            {selectedCardIds.length} / {maxCards}
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--mp-brand-violet)), hsl(var(--mp-brand-gold)))',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(selectedCardIds.length / maxCards) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

interface SelectableGridCardProps {
  card: TarotCard;
  index: number;
  isFlying: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const SelectableGridCard = memo(function SelectableGridCard({
  card,
  index,
  isFlying,
  isDisabled,
  onClick,
}: SelectableGridCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Memoized hover handlers for performance
  const handleHoverStart = useCallback(() => setIsHovered(true), []);
  const handleHoverEnd = useCallback(() => setIsHovered(false), []);

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled || isFlying}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onFocus={handleHoverStart}
      onBlur={handleHoverEnd}
      className={cn(
        // Base: minimum 44px touch target (aspect-ratio maintains height)
        'relative w-full min-w-[44px] aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden',
        'cursor-pointer transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mp-bg-900',
        isDisabled && 'opacity-40 cursor-not-allowed',
        isFlying && 'pointer-events-none',
      )}
      // Entry animation
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={isFlying ? {
        // Flying to center animation
        opacity: [1, 1, 0],
        scale: [1, 1.3, 0.8],
        y: [0, -100, -200],
        x: [0, 0, 0],
        rotate: [0, 5, 180],
        zIndex: 100,
      } : {
        opacity: 1,
        scale: isHovered ? 1.08 : 1,
        y: isHovered ? -8 : 0,
        x: 0,
        rotate: 0,
        zIndex: isHovered ? 50 : 1,
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.6, 
        y: -50,
        transition: { duration: 0.3 }
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        // 16.67ms = 1 frame at 60fps for smooth staggering
        opacity: { delay: index * 0.0167, duration: 0.3 },
        scale: { delay: index * 0.0167 },
      }}
      whileTap={!isDisabled && !isFlying ? { scale: 0.95 } : undefined}
      aria-label={`Sélectionner une carte`}
    >
      {/* Card back image */}
      <img 
        src={CARD_BACK_URL} 
        alt="Dos de carte" 
        className="w-full h-full object-cover"
        loading="lazy"
        draggable={false}
      />

      {/* Golden glow overlay on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{
          background: 'radial-gradient(ellipse at center, hsl(45 80% 55% / 0.25), transparent 70%)',
          boxShadow: isHovered ? '0 0 30px 10px hsl(45 80% 55% / 0.2)' : 'none',
        }}
      />

      {/* Border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-lg sm:rounded-xl pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          boxShadow: isHovered 
            ? '0 0 0 2px hsl(45 80% 55% / 0.6), 0 8px 32px -8px hsl(45 80% 55% / 0.4)' 
            : 'none',
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Flying sparkle effect */}
      {isFlying && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-2xl">✦</span>
        </motion.div>
      )}
    </motion.button>
  );
});

export default memo(PremiumCardGrid);
