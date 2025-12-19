import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TarotCard as TarotCardType } from '@/types/tarot';
import { Check, X } from 'lucide-react';

interface SelectableCardProps {
  card: TarotCardType;
  isSelected: boolean;
  isDisabled: boolean;
  selectionIndex?: number;
  onClick: () => void;
}

export function SelectableCard({
  card,
  isSelected,
  isDisabled,
  selectionIndex,
  onClick,
}: SelectableCardProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'relative aspect-[2/3] w-full rounded-xl overflow-hidden',
        'transition-all duration-200 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-mp-brand-violet',
        isSelected && 'ring-2 ring-mp-brand-gold shadow-mp-glow-g',
        isDisabled && !isSelected && 'opacity-40 cursor-not-allowed',
      )}
      whileHover={!isDisabled ? { scale: 1.05, y: -4 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card back design */}
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

      {/* Selection overlay */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-mp-brand-gold/20 flex items-center justify-center"
        >
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-mp-brand-gold flex items-center justify-center">
            <Check className="w-4 h-4 text-mp-bg-900" />
          </div>
          {selectionIndex !== undefined && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-mp-brand-gold/90 text-mp-bg-900 text-sm font-semibold">
              #{selectionIndex + 1}
            </div>
          )}
        </motion.div>
      )}
    </motion.button>
  );
}

interface SelectableCardGridProps {
  cards: TarotCardType[];
  selectedCardIds: string[];
  maxSelections: number;
  onSelect: (card: TarotCardType) => void;
  onDeselect: (cardId: string) => void;
  disabled?: boolean;
}

export function SelectableCardGrid({
  cards,
  selectedCardIds,
  maxSelections,
  onSelect,
  onDeselect,
  disabled = false,
}: SelectableCardGridProps) {
  const isMaxReached = selectedCardIds.length >= maxSelections;

  const handleCardClick = (card: TarotCardType) => {
    const isSelected = selectedCardIds.includes(card.id);
    if (isSelected) {
      onDeselect(card.id);
    } else if (!isMaxReached) {
      onSelect(card);
    }
  };

  return (
    <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 gap-2">
      {cards.map((card, index) => {
        const isSelected = selectedCardIds.includes(card.id);
        const selectionIndex = selectedCardIds.indexOf(card.id);
        
        return (
          <SelectableCard
            key={card.id}
            card={card}
            isSelected={isSelected}
            isDisabled={disabled || (isMaxReached && !isSelected)}
            selectionIndex={isSelected ? selectionIndex : undefined}
            onClick={() => handleCardClick(card)}
          />
        );
      })}
    </div>
  );
}

interface CardCounterProps {
  current: number;
  total: number;
  className?: string;
}

export function CardCounter({ current, total, className }: CardCounterProps) {
  const isComplete = current >= total;
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full',
        'transition-all duration-300',
        isComplete 
          ? 'bg-mp-brand-gold/20 text-mp-brand-gold border border-mp-brand-gold/40' 
          : 'bg-mp-surface-glass text-foreground border border-mp-surface-border',
        className
      )}
    >
      <span className="font-serif text-lg font-semibold">
        {current} / {total}
      </span>
      {isComplete && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center"
        >
          <Check className="w-4 h-4" />
        </motion.div>
      )}
    </div>
  );
}
