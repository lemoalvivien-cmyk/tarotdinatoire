import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CARD_BACK_URL } from '@/constants/tarotAssets';
import type { TarotCard } from '@/types/tarot';

interface ImmersiveCardSelectionProps {
  cards: TarotCard[];
  selectedCardIds: string[];
  maxCards: number;
  currentPositionLabel?: string | null;
  onCardSelect?: (card: TarotCard) => void;
}

/**
 * Immersive zero-scroll card selection grid
 * All 78 cards visible simultaneously on mobile viewport
 */
export function ImmersiveCardSelection({
  cards,
  selectedCardIds,
  maxCards,
  currentPositionLabel,
  onCardSelect,
}: ImmersiveCardSelectionProps) {
  const [flyingCardId, setFlyingCardId] = useState<string | null>(null);
  const [animatingCounter, setAnimatingCounter] = useState(false);
  
  const isComplete = selectedCardIds.length >= maxCards;
  const remaining = maxCards - selectedCardIds.length;

  // Filter out selected cards
  const availableCards = useMemo(
    () => cards.filter(c => !selectedCardIds.includes(c.id)),
    [cards, selectedCardIds]
  );

  // Handle card selection with animation
  const handleCardClick = useCallback((card: TarotCard) => {
    if (isComplete || !onCardSelect || flyingCardId) return;
    
    // Trigger flying animation
    setFlyingCardId(card.id);
    setAnimatingCounter(true);
    
    // Wait for animation, then trigger selection
    setTimeout(() => {
      onCardSelect(card);
      setFlyingCardId(null);
      setTimeout(() => setAnimatingCounter(false), 200);
    }, 500);
  }, [isComplete, onCardSelect, flyingCardId]);

  return (
    <div className="immersive-selection-container">
      {/* Ambient stars background */}
      <div className="immersive-stars" aria-hidden="true" />
      
      {/* Fixed Header */}
      <header className="immersive-header">
        <h1 className="immersive-title">Choisissez vos cartes</h1>
        <motion.div 
          className="immersive-counter"
          animate={animatingCounter ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <span className="counter-current">{selectedCardIds.length}</span>
          <span className="counter-separator">/</span>
          <span className="counter-max">{maxCards}</span>
          <span className="counter-label">cartes</span>
        </motion.div>
        {currentPositionLabel && (
          <motion.p 
            key={currentPositionLabel}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="immersive-position-label"
          >
            {currentPositionLabel}
          </motion.p>
        )}
      </header>

      {/* Card Grid - fills remaining viewport */}
      <div className="immersive-grid-wrapper">
        <div className="immersive-grid">
          <AnimatePresence mode="sync">
            {availableCards.map((card, index) => (
              <ImmersiveCard
                key={card.id}
                card={card}
                index={index}
                isFlying={flyingCardId === card.id}
                isDisabled={isComplete}
                onClick={() => handleCardClick(card)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Bottom - Selected Cards Slots */}
      <div className="immersive-slots-bar">
        {Array.from({ length: maxCards }).map((_, i) => {
          const isFilled = i < selectedCardIds.length;
          return (
            <motion.div
              key={i}
              className={cn(
                'immersive-slot',
                isFilled && 'immersive-slot--filled'
              )}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: isFilled ? [1, 1.05, 1] : 1, 
                opacity: 1 
              }}
              transition={{ 
                delay: i * 0.05,
                scale: { duration: 0.3 }
              }}
            >
              {isFilled && (
                <motion.div 
                  className="slot-card-preview"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <img 
                    src={CARD_BACK_URL} 
                    alt="" 
                    className="w-full h-full object-cover rounded"
                  />
                </motion.div>
              )}
              {!isFilled && <span className="slot-index">{i + 1}</span>}
            </motion.div>
          );
        })}
      </div>

      {/* Completion overlay */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="immersive-complete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="complete-badge"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <span className="complete-icon">✦</span>
              <span className="complete-text">Sélection complète</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ImmersiveCardProps {
  card: TarotCard;
  index: number;
  isFlying: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

const ImmersiveCard = memo(function ImmersiveCard({
  card,
  index,
  isFlying,
  isDisabled,
  onClick,
}: ImmersiveCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled || isFlying}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        'immersive-card',
        isPressed && 'immersive-card--pressed',
        isFlying && 'immersive-card--flying',
        isDisabled && 'immersive-card--disabled'
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isFlying ? {
        opacity: [1, 1, 0],
        scale: [1, 1.2, 0.5],
        y: [0, -20, 100],
        rotate: [0, 8, 180],
        zIndex: 100,
      } : {
        opacity: isDisabled ? 0.3 : 1,
        scale: isPressed ? 0.95 : 1,
        y: isPressed ? 2 : 0,
        rotate: 0,
        zIndex: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.6,
        y: -20,
        transition: { duration: 0.25 }
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        opacity: { delay: index * 0.008, duration: 0.15 },
      }}
      aria-label={`Sélectionner une carte`}
    >
      {/* Card back design */}
      <div className="card-back-design">
        {/* Background gradient */}
        <div className="card-bg-gradient" />
        
        {/* Diamond pattern */}
        <div className="card-diamond">
          <svg viewBox="0 0 24 36" fill="none" className="diamond-svg">
            <path 
              d="M12 2L22 18L12 34L2 18L12 2Z" 
              stroke="currentColor" 
              strokeWidth="1"
              fill="none"
            />
            <path 
              d="M12 6L18 18L12 30L6 18L12 6Z" 
              stroke="currentColor" 
              strokeWidth="0.5"
              fill="none"
            />
          </svg>
        </div>

        {/* Corner stars */}
        <div className="card-star card-star--tl">✦</div>
        <div className="card-star card-star--br">✦</div>
        
        {/* Border glow */}
        <div className="card-border-glow" />
      </div>

      {/* Selection pulse effect */}
      {isFlying && (
        <motion.div
          className="card-pulse-effect"
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.button>
  );
});

export default memo(ImmersiveCardSelection);
