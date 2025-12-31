import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CARD_BACK_URL } from '@/constants/tarotAssets';
import type { TarotCard } from '@/types/tarot';
import { useState } from 'react';

type DeckPhase = 'idle' | 'shuffling' | 'shuffled' | 'cutting' | 'cut' | 'selecting' | 'ready';

interface AnimatedDeckProps {
  cards: TarotCard[];
  phase: DeckPhase;
  selectedCardIds: string[];
  maxCards: number;
  onCardSelect?: (card: TarotCard) => void;
}

/**
 * Premium animated deck with fan layout, shuffle, cut and selection animations
 */
export function AnimatedDeck({
  cards,
  phase,
  selectedCardIds,
  maxCards,
  onCardSelect,
}: AnimatedDeckProps) {
  const isShuffling = phase === 'shuffling';
  const isCutting = phase === 'cutting';
  const isSelectable = phase === 'cut' || phase === 'selecting' || phase === 'ready';
  const isComplete = selectedCardIds.length >= maxCards;

  // Show fan view for selection, stacked view for shuffle/cut
  const showFan = isSelectable;
  
  // Calculate visible cards (limit for performance)
  const visibleCards = showFan ? cards.slice(0, 40) : cards.slice(0, 12);
  
  // For stacked deck view
  const stackedCards = cards.slice(0, 10);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Deck visualization */}
      {!showFan && (
        <StackedDeck 
          cards={stackedCards}
          isShuffling={isShuffling}
          isCutting={isCutting}
        />
      )}
      
      {/* Fan view for selection */}
      {showFan && (
        <FanDeck
          cards={visibleCards}
          selectedCardIds={selectedCardIds}
          isComplete={isComplete}
          onCardSelect={onCardSelect}
        />
      )}
    </div>
  );
}

interface StackedDeckProps {
  cards: TarotCard[];
  isShuffling: boolean;
  isCutting: boolean;
}

function StackedDeck({ cards, isShuffling, isCutting }: StackedDeckProps) {
  return (
    <div className="relative h-[280px] w-[200px] flex items-center justify-center">
      {/* Ambient glow */}
      <div 
        className="absolute inset-0 rounded-3xl blur-3xl opacity-40"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(260 60% 45%), transparent 70%)',
        }}
      />
      
      {/* Card stack */}
      <div className="relative">
        <AnimatePresence mode="sync">
          {isCutting ? (
            // Cutting animation: 3 piles
            <CuttingAnimation cards={cards} />
          ) : (
            // Normal stack or shuffling
            cards.map((card, i) => (
              <motion.div
                key={`stack-${card.id}`}
                className="absolute left-1/2 top-1/2"
                initial={{ 
                  x: '-50%', 
                  y: '-50%',
                  rotate: (i - cards.length / 2) * 1.5,
                }}
                animate={isShuffling ? {
                  x: ['-50%', `${-50 + (i % 3 === 0 ? 40 : i % 3 === 1 ? -40 : 0)}%`],
                  y: ['-50%', `${-50 + (i % 2 === 0 ? -20 : 20)}%`],
                  rotate: [
                    (i - cards.length / 2) * 1.5, 
                    (i - cards.length / 2) * 1.5 + (i % 2 === 0 ? 15 : -15),
                    (i - cards.length / 2) * 1.5
                  ],
                } : {
                  x: '-50%',
                  y: '-50%',
                  rotate: (i - cards.length / 2) * 1.5,
                }}
                transition={{
                  duration: isShuffling ? 0.3 : 0.4,
                  repeat: isShuffling ? Infinity : 0,
                  repeatType: 'mirror',
                  delay: i * 0.03,
                  ease: 'easeInOut',
                }}
                style={{
                  zIndex: i,
                  transformOrigin: 'center center',
                }}
              >
                <CardBack 
                  size="lg" 
                  glow={i === cards.length - 1}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CuttingAnimation({ cards }: { cards: TarotCard[] }) {
  const pile1 = cards.slice(0, 3);
  const pile2 = cards.slice(3, 6);
  const pile3 = cards.slice(6, 10);
  
  return (
    <>
      {/* Left pile */}
      <motion.div
        className="absolute"
        initial={{ x: 0, y: 0 }}
        animate={{ x: -70, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {pile1.map((card, i) => (
          <motion.div
            key={`cut1-${card.id}`}
            className="absolute"
            style={{ 
              rotate: `${(i - 1) * 2}deg`,
              zIndex: i,
            }}
          >
            <CardBack size="md" />
          </motion.div>
        ))}
      </motion.div>
      
      {/* Center pile */}
      <motion.div
        className="absolute"
        initial={{ x: 0, y: 0 }}
        animate={{ x: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      >
        {pile2.map((card, i) => (
          <motion.div
            key={`cut2-${card.id}`}
            className="absolute"
            style={{ 
              rotate: `${(i - 1) * 2}deg`,
              zIndex: i,
            }}
          >
            <CardBack size="md" />
          </motion.div>
        ))}
      </motion.div>
      
      {/* Right pile */}
      <motion.div
        className="absolute"
        initial={{ x: 0, y: 0 }}
        animate={{ x: 70, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
      >
        {pile3.map((card, i) => (
          <motion.div
            key={`cut3-${card.id}`}
            className="absolute"
            style={{ 
              rotate: `${(i - 1.5) * 2}deg`,
              zIndex: i,
            }}
          >
            <CardBack size="md" />
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

interface FanDeckProps {
  cards: TarotCard[];
  selectedCardIds: string[];
  isComplete: boolean;
  onCardSelect?: (card: TarotCard) => void;
}

function FanDeck({ cards, selectedCardIds, isComplete, onCardSelect }: FanDeckProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Fan layout calculations
  const totalCards = cards.length;
  const fanAngle = Math.min(120, totalCards * 3); // Max 120 degrees
  const anglePerCard = fanAngle / totalCards;
  const startAngle = -fanAngle / 2;
  
  // Filter out selected cards from the fan
  const availableCards = cards.filter(c => !selectedCardIds.includes(c.id));

  return (
    <div className="relative w-full min-h-[320px] sm:min-h-[380px] flex items-center justify-center overflow-hidden py-8">
      {/* Ambient glow */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 blur-3xl opacity-30"
        style={{
          background: 'radial-gradient(ellipse, hsl(260 60% 50%), transparent)',
        }}
      />
      
      {/* Fan of cards */}
      <div className="relative" style={{ perspective: '1000px' }}>
        {availableCards.map((card, i) => {
          const originalIndex = cards.findIndex(c => c.id === card.id);
          const angle = startAngle + originalIndex * anglePerCard;
          const isHovered = hoveredId === card.id;
          const canSelect = !isComplete && onCardSelect;
          
          return (
            <motion.button
              key={card.id}
              className={cn(
                'absolute origin-bottom cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
                isComplete && 'cursor-not-allowed opacity-50'
              )}
              disabled={isComplete}
              style={{
                left: '50%',
                bottom: 0,
                transformOrigin: 'center bottom',
              }}
              initial={{ 
                rotate: angle,
                x: '-50%',
                y: 20,
                opacity: 0,
              }}
              animate={{
                rotate: isHovered ? angle * 0.9 : angle,
                x: '-50%',
                y: isHovered ? -30 : 0,
                scale: isHovered ? 1.15 : 1,
                opacity: 1,
                zIndex: isHovered ? 100 : 50 - Math.abs(originalIndex - totalCards / 2),
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 25,
                opacity: { delay: originalIndex * 0.02 }
              }}
              onHoverStart={() => setHoveredId(card.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => canSelect && onCardSelect?.(card)}
              aria-label={`Sélectionner une carte`}
            >
              <CardBack 
                size="md" 
                glow={isHovered} 
                className={isHovered ? 'shadow-2xl shadow-yellow-400/30' : ''}
              />
            </motion.button>
          );
        })}
      </div>
      
      {/* Instruction overlay */}
      {!isComplete && (
        <motion.div
          className="absolute top-0 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white/90 text-sm font-medium tracking-wide drop-shadow-lg">
            Cliquez sur une carte pour la sélectionner
          </p>
        </motion.div>
      )}
    </div>
  );
}

interface CardBackProps {
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  className?: string;
}

export function CardBack({ size = 'md', glow = false, className }: CardBackProps) {
  const sizeClasses = {
    sm: 'w-14 h-[84px] sm:w-16 sm:h-24',
    md: 'w-20 h-[120px] sm:w-24 sm:h-36',
    lg: 'w-28 h-[168px] sm:w-32 sm:h-48',
  };

  return (
    <div 
      className={cn(
        'rounded-xl overflow-hidden border shadow-lg transition-shadow duration-300',
        sizeClasses[size],
        glow ? 'border-yellow-400/50 shadow-yellow-400/20' : 'border-white/20',
        className
      )}
    >
      <img 
        src={CARD_BACK_URL} 
        alt="Dos de carte" 
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export default AnimatedDeck;
