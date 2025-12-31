import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getCardFaceUrl } from '@/utils/tarotImageHelpers';
import { CARD_BACK_URL } from '@/constants/tarotAssets';
import type { TarotCard } from '@/types/tarot';
import type { SelectedCard } from '@/hooks/useRitualMachine';
import { useState, useEffect } from 'react';

interface SelectedCardSlot {
  position: {
    key: string;
    label: string;
    description?: string;
  };
  card: SelectedCard | null;
  index: number;
}

interface SelectedCardsDisplayProps {
  slots: SelectedCardSlot[];
  layoutKey?: string;
  onCardClick?: (card: SelectedCard) => void;
}

/**
 * Displays selected cards with flip animation in their spread positions
 */
export function SelectedCardsDisplay({
  slots,
  layoutKey = 'single',
  onCardClick,
}: SelectedCardsDisplayProps) {
  return (
    <div className="w-full py-6">
      {/* Single card layout */}
      {slots.length === 1 && (
        <SingleLayout slots={slots} onCardClick={onCardClick} />
      )}
      
      {/* Three card layout */}
      {slots.length === 3 && (
        <ThreeLayout slots={slots} onCardClick={onCardClick} />
      )}
      
      {/* Celtic cross or multi-card layout */}
      {slots.length > 3 && layoutKey === 'celtic' && (
        <CelticCrossLayout slots={slots} onCardClick={onCardClick} />
      )}
      
      {/* Generic multi-card layout */}
      {slots.length > 3 && layoutKey !== 'celtic' && (
        <GridLayout slots={slots} onCardClick={onCardClick} />
      )}
    </div>
  );
}

function SingleLayout({ slots, onCardClick }: { slots: SelectedCardSlot[]; onCardClick?: (card: SelectedCard) => void }) {
  const slot = slots[0];
  return (
    <div className="flex justify-center">
      <CardSlot slot={slot} size="xl" onCardClick={onCardClick} />
    </div>
  );
}

function ThreeLayout({ slots, onCardClick }: { slots: SelectedCardSlot[]; onCardClick?: (card: SelectedCard) => void }) {
  return (
    <div className="flex justify-center items-end gap-4 sm:gap-8">
      {slots.map((slot, i) => (
        <CardSlot key={slot.position.key} slot={slot} size="lg" onCardClick={onCardClick} />
      ))}
    </div>
  );
}

function CelticCrossLayout({ slots, onCardClick }: { slots: SelectedCardSlot[]; onCardClick?: (card: SelectedCard) => void }) {
  // Celtic cross: 
  // Positions: present(0), challenge(1), foundation(2), past(3), crown(4), future(5), self(6), environment(7), hopes(8), outcome(9)
  // Layout:
  //        [4]
  //   [3] [0+1] [5]
  //        [2]
  //   |  [6][7][8][9]  |
  
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
      {/* Cross section */}
      <div className="relative w-[260px] h-[300px] sm:w-[320px] sm:h-[360px]">
        {/* Crown (top) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <CardSlot slot={slots[4]} size="sm" onCardClick={onCardClick} />
        </div>
        
        {/* Past (left) */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2">
          <CardSlot slot={slots[3]} size="sm" onCardClick={onCardClick} />
        </div>
        
        {/* Center - Present + Challenge crossed */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <CardSlot slot={slots[0]} size="sm" onCardClick={onCardClick} />
            {/* Challenge card - rotated 90 degrees */}
            <div className="absolute top-0 left-0 rotate-90 origin-center">
              <CardSlot slot={slots[1]} size="sm" onCardClick={onCardClick} hideName />
            </div>
          </div>
        </div>
        
        {/* Future (right) */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2">
          <CardSlot slot={slots[5]} size="sm" onCardClick={onCardClick} />
        </div>
        
        {/* Foundation (bottom) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <CardSlot slot={slots[2]} size="sm" onCardClick={onCardClick} />
        </div>
      </div>
      
      {/* Staff column (right side) */}
      <div className="flex flex-row lg:flex-col gap-3">
        {slots.slice(6).map((slot) => (
          <CardSlot key={slot.position.key} slot={slot} size="sm" onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}

function GridLayout({ slots, onCardClick }: { slots: SelectedCardSlot[]; onCardClick?: (card: SelectedCard) => void }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
      {slots.map((slot) => (
        <CardSlot key={slot.position.key} slot={slot} size="sm" onCardClick={onCardClick} />
      ))}
    </div>
  );
}

interface CardSlotProps {
  slot: SelectedCardSlot;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideName?: boolean;
  onCardClick?: (card: SelectedCard) => void;
}

function CardSlot({ slot, size = 'md', hideName = false, onCardClick }: CardSlotProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCard, setShowCard] = useState(false);
  
  const sizeClasses = {
    sm: 'w-16 h-24 sm:w-18 sm:h-27',
    md: 'w-20 h-30 sm:w-24 sm:h-36',
    lg: 'w-24 h-36 sm:w-28 sm:h-42',
    xl: 'w-32 h-48 sm:w-40 sm:h-60',
  };
  
  // Trigger flip animation when card arrives
  useEffect(() => {
    if (slot.card && !showCard) {
      // Card just arrived
      setShowCard(true);
      // Flip after a short delay
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [slot.card, showCard]);

  const cardImageUrl = slot.card ? getCardFaceUrl(slot.card.card) : null;
  const isReversed = slot.card?.drawnCard.orientation === 'reversed';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Position label */}
      {!hideName && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: slot.index * 0.1 }}
          className="text-center"
        >
          <span className="text-white/90 text-xs sm:text-sm font-medium drop-shadow-md tracking-wide">
            {slot.position.label}
          </span>
          {slot.position.description && (
            <p className="text-white/60 text-[10px] sm:text-xs mt-0.5 max-w-[120px] line-clamp-2">
              {slot.position.description}
            </p>
          )}
        </motion.div>
      )}
      
      {/* Card container */}
      <div 
        className={cn(
          'relative rounded-xl cursor-pointer',
          sizeClasses[size],
        )}
        style={{ perspective: '1000px' }}
        onClick={() => slot.card && onCardClick?.(slot.card)}
      >
        <AnimatePresence mode="wait">
          {slot.card ? (
            <FlipCard
              key={slot.card.card.id}
              cardImageUrl={cardImageUrl}
              isFlipped={isFlipped}
              isReversed={isReversed}
              cardName={slot.card.card.nom_fr}
              index={slot.index}
            />
          ) : (
            <EmptySlot key="empty" index={slot.index} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface FlipCardProps {
  cardImageUrl: string | null;
  isFlipped: boolean;
  isReversed: boolean;
  cardName: string;
  index: number;
}

function FlipCard({ cardImageUrl, isFlipped, isReversed, cardName, index }: FlipCardProps) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ 
        y: -100, 
        opacity: 0, 
        rotateY: 0,
        scale: 0.8 
      }}
      animate={{ 
        y: 0, 
        opacity: 1,
        rotateY: isFlipped ? 180 : 0,
        scale: 1,
      }}
      transition={{
        y: { duration: 0.5, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.3, delay: index * 0.15 },
        scale: { duration: 0.4, delay: index * 0.15 },
        rotateY: { duration: 0.6, ease: [0.68, -0.55, 0.265, 1.55] },
      }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Back face */}
      <div 
        className="absolute inset-0 rounded-xl overflow-hidden border border-white/20 shadow-lg"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <img 
          src={CARD_BACK_URL} 
          alt="Dos de carte" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Front face */}
      <div 
        className={cn(
          'absolute inset-0 rounded-xl overflow-hidden border-2 shadow-xl',
          'border-yellow-400/40 shadow-yellow-400/20',
          isReversed && 'rotate-180'
        )}
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        {cardImageUrl ? (
          <img 
            src={cardImageUrl} 
            alt={cardName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center p-2"
            style={{
              background: 'linear-gradient(135deg, hsl(260 30% 25%), hsl(260 25% 18%))',
            }}
          >
            <span className="text-white/80 text-xs text-center font-serif">
              {cardName}
            </span>
          </div>
        )}
        
        {/* Glow effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(45 80% 60% / 0.15), transparent 70%)',
          }}
        />
        
        {/* Orientation badge */}
        <div className={cn(
          'absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
          isReversed 
            ? 'bg-red-500/80 text-white' 
            : 'bg-emerald-500/80 text-white',
          isReversed && 'rotate-180'
        )}>
          {isReversed ? '↓ Renversée' : '↑'}
        </div>
      </div>
    </motion.div>
  );
}

function EmptySlot({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="absolute inset-0 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, hsl(260 20% 12% / 0.5), hsl(260 15% 8% / 0.5))',
      }}
    >
      <span className="text-white/30 text-2xl">?</span>
    </motion.div>
  );
}

export default SelectedCardsDisplay;
