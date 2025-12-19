import { useState, useCallback, useMemo } from 'react';
import type { TarotCard, DrawnCard } from '@/types/tarot';

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
}

interface RitualActions {
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
}

interface UseRitualMachineOptions {
  cardsRequired: number;
  positions: { key: string; label: string }[];
  shuffleDuration?: number;
  cutDuration?: number;
}

interface UseRitualMachineReturn extends RitualActions {
  state: RitualState;
  cardsRequired: number;
  selectedCount: number;
  isComplete: boolean;
  canValidate: boolean;
  progress: number;
  currentPositionKey: string | null;
  currentPositionLabel: string | null;
}

const SHUFFLE_DURATION = 2000;
const CUT_DURATION = 800;

export function useRitualMachine({
  cardsRequired,
  positions,
  shuffleDuration = SHUFFLE_DURATION,
  cutDuration = CUT_DURATION,
}: UseRitualMachineOptions): UseRitualMachineReturn {
  const [state, setState] = useState<RitualState>({
    phase: 'idle',
    selectedCards: [],
    revealedCardIds: new Set(),
  });

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

  const startShuffle = useCallback(async () => {
    setState(prev => ({ ...prev, phase: 'shuffling' }));
    await new Promise(resolve => setTimeout(resolve, shuffleDuration));
    setState(prev => ({ ...prev, phase: 'shuffled' }));
  }, [shuffleDuration]);

  const completeShuffle = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'shuffled' }));
  }, []);

  const startCut = useCallback(async () => {
    setState(prev => ({ ...prev, phase: 'cutting' }));
    await new Promise(resolve => setTimeout(resolve, cutDuration));
    setState(prev => ({ ...prev, phase: 'cut' }));
  }, [cutDuration]);

  const completeCut = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'cut' }));
  }, []);

  const selectCard = useCallback((card: TarotCard, positionKey: string) => {
    setState(prev => {
      // Can't select if not in selecting or cut phase
      if (prev.phase !== 'selecting' && prev.phase !== 'cut') return prev;
      
      // Can't select more than required
      if (prev.selectedCards.length >= cardsRequired) return prev;
      
      // Can't select same card twice
      if (prev.selectedCards.some(sc => sc.card.id === card.id)) return prev;

      const orientation: 'upright' | 'reversed' = Math.random() < 0.5 ? 'upright' : 'reversed';
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

      return {
        ...prev,
        phase: 'selecting',
        selectedCards: newSelectedCards,
        revealedCardIds: newRevealedCardIds,
      };
    });
  }, []);

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
    setState({
      phase: 'idle',
      selectedCards: [],
      revealedCardIds: new Set(),
    });
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (state.phase) {
      case 'idle':
        return true; // Can start shuffle
      case 'shuffled':
        return true; // Can cut
      case 'cut':
        return true; // Can start selecting
      case 'ready':
        return isComplete; // Can validate
      default:
        return false;
    }
  }, [state.phase, isComplete]);

  return {
    state,
    cardsRequired,
    selectedCount,
    isComplete,
    canValidate,
    progress,
    currentPositionKey,
    currentPositionLabel,
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
  };
}
