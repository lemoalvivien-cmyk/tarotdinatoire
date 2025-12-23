import { useState, useCallback, useMemo } from 'react';
import type { TarotCard, DrawnCard } from '@/types/tarot';
import { shuffleArray, cutDeck, generateSeed, createSeededRandom } from '@/utils/deckUtils';

/**
 * Ritual State Machine
 * idle → shuffling → shuffled → cutting → cut → selecting → ready → interpreting → done
 */
export type RitualPhase = 
  | 'idle'        // Initial state, waiting to start
  | 'shuffling'   // Cards are being shuffled (animation)
  | 'shuffled'    // Shuffle complete, waiting for cut
  | 'cutting'     // User is cutting the deck (animation)
  | 'cut'         // Cut complete, ready to select
  | 'selecting'   // User is selecting cards
  | 'ready'       // All cards selected, can validate
  | 'interpreting'// AI is generating interpretation
  | 'done';       // Reading complete

export interface SelectedCard {
  card: TarotCard;
  drawnCard: DrawnCard;
  positionIndex: number;
}

interface RitualState {
  phase: RitualPhase;
  selectedCards: SelectedCard[];
  revealedCardIds: Set<string>;
  seed: number;
  shuffledDeck: TarotCard[];
  shuffleCount: number;
  cutCount: number;
}

interface UseRitualMachineOptions {
  cardsRequired: number;
  positions: { key: string; label: string }[];
  shuffleDuration?: number;
  cutDuration?: number;
  initialCards?: TarotCard[];
}

interface UseRitualMachineReturn {
  state: RitualState;
  cardsRequired: number;
  selectedCount: number;
  isComplete: boolean;
  canValidate: boolean;
  progress: number;
  currentPositionKey: string | null;
  currentPositionLabel: string | null;
  shuffledDeck: TarotCard[];
  seed: number;
  startShuffle: () => Promise<void>;
  completeShuffle: () => void;
  startCut: () => Promise<void>;
  completeCut: () => void;
  selectCard: (card: TarotCard, positionKey: string) => void;
  deselectCard: (cardId: string) => void;
  revealCard: (cardId: string) => void;
  validateSelection: () => boolean;
  startInterpretation: () => void;
  complete: () => void;
  reset: () => void;
  canProceed: () => boolean;
  setInitialDeck: (cards: TarotCard[]) => void;
}

const SHUFFLE_DURATION = 2000;
const CUT_DURATION = 800;

export function useRitualMachine({
  cardsRequired,
  positions,
  shuffleDuration = SHUFFLE_DURATION,
  cutDuration = CUT_DURATION,
  initialCards = [],
}: UseRitualMachineOptions): UseRitualMachineReturn {
  const [state, setState] = useState<RitualState>(() => ({
    phase: 'idle',
    selectedCards: [],
    revealedCardIds: new Set(),
    seed: generateSeed(),
    shuffledDeck: [...initialCards],
    shuffleCount: 0,
    cutCount: 0,
  }));

  const selectedCount = state.selectedCards.length;
  const isComplete = selectedCount >= cardsRequired;
  const canValidate = state.phase === 'ready' && isComplete;
  const progress = cardsRequired > 0 ? (selectedCount / cardsRequired) * 100 : 0;

  // Current position being filled
  const currentPositionKey = useMemo(() => {
    if (selectedCount >= positions.length) return null;
    return positions[selectedCount]?.key ?? null;
  }, [selectedCount, positions]);

  const currentPositionLabel = useMemo(() => {
    if (selectedCount >= positions.length) return null;
    return positions[selectedCount]?.label ?? null;
  }, [selectedCount, positions]);

  // Set initial deck (called when cards are loaded)
  const setInitialDeck = useCallback((cards: TarotCard[]) => {
    setState(prev => ({
      ...prev,
      shuffledDeck: [...cards],
    }));
  }, []);

  const startShuffle = useCallback(async () => {
    setState(prev => {
      // Generate a new seed for each shuffle that incorporates the shuffle count
      const newSeed = prev.seed + prev.shuffleCount + Date.now();
      const shuffled = shuffleArray(prev.shuffledDeck, newSeed);
      
      return {
        ...prev,
        phase: 'shuffling',
        shuffledDeck: shuffled,
        shuffleCount: prev.shuffleCount + 1,
        seed: newSeed,
      };
    });
    
    await new Promise(resolve => setTimeout(resolve, shuffleDuration));
    
    setState(prev => ({ ...prev, phase: 'shuffled' }));
  }, [shuffleDuration]);

  const completeShuffle = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'shuffled' }));
  }, []);

  const startCut = useCallback(async () => {
    setState(prev => {
      // Use seed + cutCount for reproducible cut position
      const cutSeed = prev.seed + prev.cutCount + 1000;
      const cutDeckResult = cutDeck(prev.shuffledDeck, cutSeed);
      
      return {
        ...prev,
        phase: 'cutting',
        shuffledDeck: cutDeckResult,
        cutCount: prev.cutCount + 1,
      };
    });
    
    await new Promise(resolve => setTimeout(resolve, cutDuration));
    
    setState(prev => ({ ...prev, phase: 'cut' }));
  }, [cutDuration]);

  const completeCut = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'cut' }));
  }, []);

  const selectCard = useCallback((card: TarotCard, positionKey: string) => {
    setState(prev => {
      // Can only select in cut or selecting phase
      const allowedPhases: RitualPhase[] = ['cut', 'selecting'];
      if (!allowedPhases.includes(prev.phase)) {
        return prev;
      }
      
      // Can't select more than required
      if (prev.selectedCards.length >= cardsRequired) return prev;
      
      // Can't select same card twice
      if (prev.selectedCards.some(sc => sc.card.id === card.id)) return prev;

      // Use seeded random for orientation (based on card position in selection + seed)
      const orientationSeed = prev.seed + prev.selectedCards.length * 100;
      const random = createSeededRandom(orientationSeed);
      const orientation: 'upright' | 'reversed' = random() < 0.65 ? 'upright' : 'reversed';
      
      const newSelected: SelectedCard = {
        card,
        drawnCard: {
          card_id: card.id,
          orientation,
          position_key: positionKey,
        },
        positionIndex: prev.selectedCards.length,
      };

      const newSelectedCards = [...prev.selectedCards, newSelected];
      const isNowComplete = newSelectedCards.length >= cardsRequired;
      
      return {
        ...prev,
        phase: isNowComplete ? 'ready' : 'selecting',
        selectedCards: newSelectedCards,
      };
    });
  }, [cardsRequired]);

  const deselectCard = useCallback((cardId: string) => {
    setState(prev => {
      // Can only deselect in selecting or ready phase
      if (prev.phase !== 'selecting' && prev.phase !== 'ready') return prev;

      const newSelectedCards = prev.selectedCards.filter(sc => sc.card.id !== cardId);
      const newRevealedCardIds = new Set(prev.revealedCardIds);
      newRevealedCardIds.delete(cardId);

      // Reindex remaining cards
      const reindexedCards = newSelectedCards.map((sc, index) => ({
        ...sc,
        positionIndex: index,
        drawnCard: {
          ...sc.drawnCard,
          position_key: positions[index]?.key || sc.drawnCard.position_key,
        },
      }));

      return {
        ...prev,
        phase: 'selecting',
        selectedCards: reindexedCards,
        revealedCardIds: newRevealedCardIds,
      };
    });
  }, [positions]);

  const revealCard = useCallback((cardId: string) => {
    setState(prev => {
      const newRevealedCardIds = new Set(prev.revealedCardIds);
      newRevealedCardIds.add(cardId);
      return { ...prev, revealedCardIds: newRevealedCardIds };
    });
  }, []);

  const validateSelection = useCallback((): boolean => {
    if (!canValidate) return false;
    return true;
  }, [canValidate]);

  const startInterpretation = useCallback(() => {
    if (!isComplete) return;
    setState(prev => ({ ...prev, phase: 'interpreting' }));
  }, [isComplete]);

  const complete = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'done' }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      phase: 'idle',
      selectedCards: [],
      revealedCardIds: new Set(),
      seed: generateSeed(),
      shuffledDeck: prev.shuffledDeck.length > 0 ? [...prev.shuffledDeck] : [],
      shuffleCount: 0,
      cutCount: 0,
    }));
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (state.phase) {
      case 'idle':
        return state.shuffledDeck.length > 0; // Can shuffle only if deck is loaded
      case 'shuffled':
        return true; // Can cut
      case 'cut':
        return true; // Can start selecting
      case 'ready':
        return isComplete; // Can validate
      default:
        return false;
    }
  }, [state.phase, state.shuffledDeck.length, isComplete]);

  return {
    state,
    cardsRequired,
    selectedCount,
    isComplete,
    canValidate,
    progress,
    currentPositionKey,
    currentPositionLabel,
    shuffledDeck: state.shuffledDeck,
    seed: state.seed,
    startShuffle,
    completeShuffle,
    startCut,
    completeCut,
    selectCard,
    deselectCard,
    revealCard,
    validateSelection,
    startInterpretation,
    complete,
    reset,
    canProceed,
    setInitialDeck,
  };
}
