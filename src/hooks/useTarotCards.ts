import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TarotCard } from '@/types/tarot';
import { qk, STALE_FOREVER, GC_CARDS } from '@/queries/queryConfig';

export function useTarotCards() {
  return useQuery({
    queryKey: qk.tarotCards(),
    queryFn: async (): Promise<TarotCard[]> => {
      const { data, error } = await supabase
        .from('tarot_cards')
        .select('id, nom_fr, type, numero, meaning_upright_fr, meaning_reversed_fr, keywords_fr, image_url')
        .order('type')
        .order('numero');

      if (error) throw error;

      return (data ?? []).map(card => ({
        ...card,
        type: card.type as 'major' | 'minor',
      }));
    },
    staleTime: STALE_FOREVER,
    gcTime: GC_CARDS,
  });
}

/**
 * Returns a stable Map<id, TarotCard> derived from the cards array.
 * O(1) lookup — use instead of cards.find() in hot paths.
 */
export function useCardMap(cards: TarotCard[] | undefined): Map<string, TarotCard> {
  return useMemo(() => {
    if (!cards) return new Map();
    return new Map(cards.map(c => [c.id, c]));
  }, [cards]);
}

export function useRandomCard(cards: TarotCard[] | undefined) {
  const drawCard = () => {
    if (!cards?.length) return null;
    const card = cards[Math.floor(Math.random() * cards.length)];
    const orientation: 'upright' | 'reversed' = Math.random() < 0.5 ? 'upright' : 'reversed';
    return {
      card,
      drawnCard: { card_id: card.id, orientation, position_key: 'single' },
    };
  };

  return { drawCard };
}
