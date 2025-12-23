import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TarotCard as TarotCardType } from '@/types/tarot';
import type { SelectedCard } from '@/hooks/useRitualMachine';

interface SpreadPosition {
  key: string;
  label: string;
  label_fr?: string;
}

interface SpreadTableViewProps {
  selectedCards: SelectedCard[];
  positions: SpreadPosition[];
  allCards: TarotCardType[] | undefined;
  spreadName?: string;
}

/**
 * Displays cards in their spread positions after selection
 * Layout adapts based on number of cards (1, 3, 5, 7, 10)
 */
export function SpreadTableView({
  selectedCards,
  positions,
  allCards,
  spreadName,
}: SpreadTableViewProps) {
  const cardCount = selectedCards.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="font-serif text-2xl text-white drop-shadow-lg">
          Votre tirage est prêt
        </h3>
        {spreadName && (
          <p className="text-white/70 text-sm">{spreadName}</p>
        )}
      </div>

      {/* Cards layout */}
      <div className="flex justify-center">
        {cardCount === 1 && (
          <SingleCardLayout 
            card={selectedCards[0]} 
            position={positions[0]} 
            allCards={allCards}
          />
        )}
        {cardCount === 3 && (
          <ThreeCardLayout 
            cards={selectedCards} 
            positions={positions} 
            allCards={allCards}
          />
        )}
        {cardCount === 5 && (
          <FiveCardLayout 
            cards={selectedCards} 
            positions={positions} 
            allCards={allCards}
          />
        )}
        {(cardCount === 7 || cardCount === 10 || (cardCount > 5 && cardCount !== 7 && cardCount !== 10)) && (
          <MultiCardLayout 
            cards={selectedCards} 
            positions={positions} 
            allCards={allCards}
          />
        )}
      </div>
    </motion.div>
  );
}

interface CardDisplayProps {
  card: SelectedCard;
  position: SpreadPosition;
  allCards: TarotCardType[] | undefined;
  index: number;
  size?: 'sm' | 'md' | 'lg';
}

function CardDisplay({ card, position, allCards, index, size = 'md' }: CardDisplayProps) {
  const cardDetails = allCards?.find(c => c.id === card.card.id);
  
  const sizeClasses = {
    sm: 'w-20 h-30',
    md: 'w-28 h-42',
    lg: 'w-36 h-54',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateY: 180 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.15,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      className="flex flex-col items-center gap-2"
    >
      {/* Position label */}
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.15 + 0.3 }}
        className="text-white/60 text-xs uppercase tracking-wider text-center"
      >
        {position.label_fr || position.label}
      </motion.span>

      {/* Card */}
      <div 
        className={cn(
          'relative rounded-xl overflow-hidden border-2 border-white/20 shadow-xl',
          sizeClasses[size],
          card.drawnCard.orientation === 'reversed' && 'rotate-180'
        )}
        style={{
          aspectRatio: '2/3',
          background: cardDetails?.image_url 
            ? `url(${cardDetails.image_url}) center/cover`
            : 'linear-gradient(135deg, hsl(260 30% 25%), hsl(260 25% 18%))',
        }}
      >
        {/* Fallback if no image */}
        {!cardDetails?.image_url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            <span className="text-3xl text-white/30 mb-2">✦</span>
            <span className="text-white/80 text-xs text-center font-serif">
              {cardDetails?.nom_fr || card.card.nom_fr}
            </span>
          </div>
        )}

        {/* Name overlay */}
        {cardDetails?.image_url && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-white text-xs font-serif block text-center truncate">
              {cardDetails?.nom_fr || card.card.nom_fr}
            </span>
          </div>
        )}

        {/* Orientation indicator */}
        <div className={cn(
          'absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] bg-black/50',
          card.drawnCard.orientation === 'reversed' ? 'text-red-300 rotate-180' : 'text-green-300'
        )}>
          {card.drawnCard.orientation === 'upright' ? '↑' : '↓'}
        </div>
      </div>
    </motion.div>
  );
}

function SingleCardLayout({ card, position, allCards }: { 
  card: SelectedCard; 
  position: SpreadPosition; 
  allCards: TarotCardType[] | undefined;
}) {
  return (
    <div className="flex justify-center">
      <CardDisplay card={card} position={position} allCards={allCards} index={0} size="lg" />
    </div>
  );
}

function ThreeCardLayout({ cards, positions, allCards }: {
  cards: SelectedCard[];
  positions: SpreadPosition[];
  allCards: TarotCardType[] | undefined;
}) {
  return (
    <div className="flex gap-4 sm:gap-6 justify-center items-end">
      {cards.map((card, i) => (
        <CardDisplay 
          key={card.card.id} 
          card={card} 
          position={positions[i] || { key: `pos-${i}`, label: `Position ${i + 1}` }}
          allCards={allCards}
          index={i}
          size="md"
        />
      ))}
    </div>
  );
}

function FiveCardLayout({ cards, positions, allCards }: {
  cards: SelectedCard[];
  positions: SpreadPosition[];
  allCards: TarotCardType[] | undefined;
}) {
  // Cross layout: center, left, right, top, bottom
  return (
    <div className="relative w-80 h-80 sm:w-96 sm:h-96">
      {/* Center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <CardDisplay 
          card={cards[0]} 
          position={positions[0] || { key: 'center', label: 'Centre' }}
          allCards={allCards}
          index={0}
          size="sm"
        />
      </div>
      {/* Left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2">
        <CardDisplay 
          card={cards[1]} 
          position={positions[1] || { key: 'left', label: 'Gauche' }}
          allCards={allCards}
          index={1}
          size="sm"
        />
      </div>
      {/* Right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        <CardDisplay 
          card={cards[2]} 
          position={positions[2] || { key: 'right', label: 'Droite' }}
          allCards={allCards}
          index={2}
          size="sm"
        />
      </div>
      {/* Top */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <CardDisplay 
          card={cards[3]} 
          position={positions[3] || { key: 'top', label: 'Haut' }}
          allCards={allCards}
          index={3}
          size="sm"
        />
      </div>
      {/* Bottom */}
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
        <CardDisplay 
          card={cards[4]} 
          position={positions[4] || { key: 'bottom', label: 'Bas' }}
          allCards={allCards}
          index={4}
          size="sm"
        />
      </div>
    </div>
  );
}

function MultiCardLayout({ cards, positions, allCards }: {
  cards: SelectedCard[];
  positions: SpreadPosition[];
  allCards: TarotCardType[] | undefined;
}) {
  // Flexible row layout for 7, 10, or other counts
  return (
    <div className="flex flex-wrap gap-3 sm:gap-4 justify-center max-w-4xl">
      {cards.map((card, i) => (
        <CardDisplay 
          key={card.card.id} 
          card={card} 
          position={positions[i] || { key: `pos-${i}`, label: `Position ${i + 1}` }}
          allCards={allCards}
          index={i}
          size="sm"
        />
      ))}
    </div>
  );
}

export default SpreadTableView;
