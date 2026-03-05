import { memo, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TarotCard as TarotCardUI } from '@/components/tarot-ui/TarotCard';
import { OracleLoader } from '@/components/tarot-ui/OracleLoader';
import { InterpretationDisplay } from '@/components/tarot/InterpretationDisplay';
import { staggerContainer, staggerItem, fadeInUp, motionVariants } from '@/lib/animations';
import type { DrawnCard, TarotCard } from '@/types/tarot';

interface ReadingResultProps {
  cards: DrawnCard[];
  interpretation: unknown;
  allCards: TarotCard[] | undefined;
  isLoading?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ReadingResult = memo(function ReadingResult({ 
  cards, interpretation, allCards,
  isLoading = false, onRetry, isRetrying = false,
}: ReadingResultProps) {
  const shouldReduceMotion = useReducedMotion();

  const getCardDetails = useCallback((cardId: string) => allCards?.find(c => c.id === cardId), [allCards]);

  const enrichedCards = useMemo(() => cards.map(drawnCard => ({
    ...drawnCard, details: getCardDetails(drawnCard.card_id),
  })), [cards, getCardDetails]);

  const leftCard = enrichedCards[0];
  const rightCards = useMemo(() => enrichedCards.slice(1), [enrichedCards]);

  const container = motionVariants(staggerContainer(0.15, 0.05), shouldReduceMotion);
  const item      = motionVariants(staggerItem, shouldReduceMotion);
  const headerV   = motionVariants(fadeInUp, shouldReduceMotion);

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={headerV} className="text-center space-y-4">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
          Voici le résultat de votre tirage
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {enrichedCards.map((card, index) => (
            <span key={card.card_id} className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
              {card.details?.nom_fr || `Carte ${index + 1}`}
              {card.orientation === 'reversed' && ' (Renversée)'}
            </span>
          ))}
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-6">
        {leftCard && (
          <motion.div variants={item} className="hidden lg:flex lg:flex-col lg:items-center lg:w-1/4 space-y-3">
            <TarotCardUI id={leftCard.card_id} name={leftCard.details?.nom_fr || ''} imageUrl={leftCard.details?.image_url || undefined} isRevealed isSelected={false} isDisabled={false} />
            <div className="text-center">
              <p className="font-medium text-foreground">{leftCard.details?.nom_fr}</p>
              <p className="text-sm text-muted-foreground">{leftCard.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}</p>
            </div>
          </motion.div>
        )}

        <motion.div variants={item} className="flex-1 lg:w-1/2 order-first lg:order-none">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <OracleLoader size="md" message="Nos tarologues interprètent vos cartes…" />
              <p className="text-muted-foreground text-center">Synthèse spirituelle en cours...</p>
            </div>
          ) : (
            <InterpretationDisplay interpretation={interpretation} onRetry={onRetry} isRetrying={isRetrying} />
          )}
        </motion.div>

        {rightCards.length > 0 && (
          <motion.div variants={item} className="hidden lg:flex lg:flex-col lg:items-center lg:w-1/4 space-y-6">
            {rightCards.map((card) => (
              <div key={card.card_id} className="flex flex-col items-center space-y-3">
                <TarotCardUI id={card.card_id} name={card.details?.nom_fr || ''} imageUrl={card.details?.image_url || undefined} isRevealed isSelected={false} isDisabled={false} />
                <div className="text-center">
                  <p className="font-medium text-foreground">{card.details?.nom_fr}</p>
                  <p className="text-sm text-muted-foreground">{card.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <motion.div variants={item} className="lg:hidden">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
          {enrichedCards.map((card) => (
            <div key={card.card_id} className="flex-shrink-0 snap-center flex flex-col items-center space-y-3">
              <TarotCardUI id={card.card_id} name={card.details?.nom_fr || ''} imageUrl={card.details?.image_url || undefined} isRevealed isSelected={false} isDisabled={false} />
              <div className="text-center">
                <p className="font-medium text-foreground text-sm">{card.details?.nom_fr}</p>
                <p className="text-xs text-muted-foreground">{card.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
});
