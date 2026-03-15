/**
 * Unified readings query — single canonical source: reading_sessions + reading_results.
 * Used by History and Favorites pages.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { qk, STALE_DAILY, rlsSafeRetry } from './queryConfig';
import type { TarotInterpretation } from '@/types/tarot';

export interface UnifiedReadingRow {
  id: string;
  user_id: string;
  spread_id: string;
  question: string | null;
  selected_cards: unknown;
  is_favorite: boolean;
  user_notes: string | null;
  origin_id: string | null;
  created_at: string;
  reading_results: Array<{
    id: string;
    interpretation: TarotInterpretation | null;
  }>;
}

export const PAGE_SIZE = 20;

interface UseReadingsOptions {
  onlyFavorites?: boolean;
  page?: number;
}

export function useReadingsQuery({ onlyFavorites = false, page = 0 }: UseReadingsOptions = {}) {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: [...qk.readings(user?.id), { onlyFavorites, page }],
    queryFn: async (): Promise<{ rows: UnifiedReadingRow[]; total: number; hasMore: boolean }> => {
      if (!user) return { rows: [], total: 0, hasMore: false };

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let q = supabase
        .from('reading_sessions')
        .select(
          'id, user_id, spread_id, question, selected_cards, is_favorite, user_notes, origin_id, created_at, reading_results(id, interpretation)',
          { count: 'exact' },
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (onlyFavorites) q = q.eq('is_favorite', true);

      const { data, error, count } = await q;
      if (error) throw error;

      const rows = (data ?? []) as unknown as UnifiedReadingRow[];
      return { rows, total: count ?? 0, hasMore: (count ?? 0) > to + 1 };
    },
    enabled: !!user && !!session,
    staleTime: STALE_DAILY,
    retry: rlsSafeRetry,
    placeholderData: (prev) => prev,
  });
}
