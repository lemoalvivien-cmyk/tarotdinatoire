import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CARD_BACK_URL } from '@/constants/tarotAssets';
import type { TarotCard } from '@/types/tarot';
import { useState } from 'react';
import { PremiumCardGrid } from './PremiumCardGrid';

type DeckPhase = 'idle' | 'shuffling' | 'shuffled' | 'cutting' | 'cut' | 'selecting' | 'ready';

interface AnimatedDeckProps {
  cards: TarotCard[];
  phase: DeckPhase;
  selectedCardIds: string[];
  maxCards: number;
  currentPositionLabel?: string | null;
  onCardSelect?: (card: TarotCard) => void;
}

/**
 * Premium animated deck with grid layout, shuffle, cut and selection animations
 */
export function AnimatedDeck({
  cards,
  phase,
  selectedCardIds,
  maxCards,
  currentPositionLabel,
  onCardSelect,
}: AnimatedDeckProps) {
  const isShuffling = phase === 'shuffling';
  const isCutting = phase === 'cutting';
  const isSelectable = phase === 'cut' || phase === 'selecting' || phase === 'ready';

  // Show grid view for selection, stacked view for shuffle/cut
  const showGrid = isSelectable;
  
  // For stacked deck view
  const stackedCards = cards.slice(0, 10);

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Deck visualization */}
      {!showGrid && (
        <StackedDeck 
          cards={stackedCards}
          isShuffling={isShuffling}
          isCutting={isCutting}
        />
      )}
      
      {/* Premium grid view for selection */}
      {showGrid && (
        <PremiumCardGrid
          cards={cards}
          selectedCardIds={selectedCardIds}
          maxCards={maxCards}
          currentPositionLabel={currentPositionLabel}
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

// FanDeck removed - using PremiumCardGrid instead

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
