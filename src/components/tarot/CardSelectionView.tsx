import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import type { TarotCard as TarotCardType } from '@/types/tarot';
import type { SelectedCard } from '@/hooks/useRitualMachine';

interface CardSelectionViewProps {
  cards: TarotCardType[];
  selectedCards: SelectedCard[];
  maxSelections: number;
  currentPositionLabel: string | null;
  onSelect: (card: TarotCardType) => void;
  onDeselect: (cardId: string) => void;
}

/**
 * Card selection grid with progress bar and selected cards zone
 */
export function CardSelectionView({
  cards,
  selectedCards,
  maxSelections,
  currentPositionLabel,
  onSelect,
  onDeselect,
}: CardSelectionViewProps) {
  const selectedIds = selectedCards.map(sc => sc.card.id);
  const isComplete = selectedCards.length >= maxSelections;
  const remaining = maxSelections - selectedCards.length;
  const progress = (selectedCards.length / maxSelections) * 100;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="text-center space-y-4">
        <h3 className="font-serif text-2xl text-white drop-shadow-lg">
          Choisissez vos cartes dans le paquet
        </h3>
        
        {/* Progress bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/80">Cartes choisies</span>
            <span className="text-white font-semibold">{selectedCards.length} / {maxSelections}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, hsl(260 60% 55%), hsl(45 80% 55%))',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Current position indicator */}
        {currentPositionLabel && !isComplete && (
          <motion.div
            key={currentPositionLabel}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20"
          >
            <span className="text-white/70 text-sm">Position :</span>
            <span className="text-white font-medium">{currentPositionLabel}</span>
          </motion.div>
        )}

        {!isComplete && (
          <p className="text-white/70 text-sm">
            Choisissez encore {remaining} carte{remaining > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Selected cards zone */}
      <AnimatePresence mode="popLayout">
        {selectedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="py-4"
          >
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-3">Cartes sélectionnées</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {selectedCards.map((sc, index) => (
                  <motion.div
                    key={sc.card.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                    className="relative group"
                  >
                    <div 
                      className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, hsl(260 30% 22%), hsl(260 25% 15%))',
                      }}
                    >
                      {/* Card number */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-serif font-bold text-white/30">
                          {index + 1}
                        </span>
                      </div>
                      {/* Card name (small) */}
                      <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 text-center">
                        <span className="text-[10px] text-white/80 line-clamp-1">
                          {sc.card.nom_fr}
                        </span>
                      </div>
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={() => onDeselect(sc.card.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      aria-label="Retirer cette carte"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card grid (deck) */}
      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 gap-1.5 sm:gap-2">
        {cards.map((card) => {
          const isSelected = selectedIds.includes(card.id);
          const isDisabled = isComplete && !isSelected;
          
          return (
            <SelectableCardItem
              key={card.id}
              card={card}
              isSelected={isSelected}
              isDisabled={isDisabled}
              selectionIndex={isSelected ? selectedIds.indexOf(card.id) : undefined}
              onClick={() => {
                if (isSelected) {
                  onDeselect(card.id);
                } else if (!isComplete) {
                  onSelect(card);
                }
              }}
            />
          );
        })}
      </div>

      {/* Complete message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-green-300 font-medium">Sélection complète</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface SelectableCardItemProps {
  card: TarotCardType;
  isSelected: boolean;
  isDisabled: boolean;
  selectionIndex?: number;
  onClick: () => void;
}

function SelectableCardItem({
  card,
  isSelected,
  isDisabled,
  selectionIndex,
  onClick,
}: SelectableCardItemProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'relative aspect-[2/3] w-full rounded-lg overflow-hidden',
        'transition-all duration-200 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        isSelected && 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30',
        isDisabled && !isSelected && 'opacity-30 cursor-not-allowed',
      )}
      whileHover={!isDisabled ? { scale: 1.08, y: -4, zIndex: 10 } : undefined}
      whileTap={!isDisabled ? { scale: 0.95 } : undefined}
      layout
    >
      {/* Card back */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(260 30% 20%), hsl(260 25% 14%))',
        }}
      >
        {/* Pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 100 150" fill="none">
            <circle cx="50" cy="75" r="30" stroke="hsl(45 80% 60%)" strokeWidth="0.4" />
            <circle cx="50" cy="75" r="20" stroke="hsl(260 60% 65%)" strokeWidth="0.3" />
            <path 
              d="M50 35 L53 68 L80 75 L53 82 L50 115 L47 82 L20 75 L47 68 Z" 
              stroke="hsl(45 80% 60%)" 
              strokeWidth="0.3" 
              fill="none"
            />
          </svg>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl opacity-25">✦</span>
        </div>
      </div>

      {/* Selection overlay */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center"
        >
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
            <Check className="w-3 h-3 text-black" />
          </div>
          {selectionIndex !== undefined && (
            <div className="text-lg font-bold text-yellow-300 drop-shadow-lg">
              {selectionIndex + 1}
            </div>
          )}
        </motion.div>
      )}
    </motion.button>
  );
}

export default CardSelectionView;
