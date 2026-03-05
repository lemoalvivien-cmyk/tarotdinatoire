/**
 * Paginated readings query used by History and Favorites pages.
 * Centralises caching, explicit column selection, and pagination config.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { qk, STALE_DAILY, rlsSafeRetry } from './queryConfig';

export interface ReadingRow {
  id: string;
  created_at: string;
  question: string | null;
  spread_id: string | null;
  is_favorite: boolean | null;
  cards: unknown;
  ai_interpretation: unknown;
}

const PAGE_SIZE = 20;

interface UseReadingsOptions {
  onlyFavorites?: boolean;
  page?: number;
}

export function useReadingsQuery({ onlyFavorites = false, page = 0 }: UseReadingsOptions = {}) {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: [...qk.readings(user?.id), { onlyFavorites, page }],
    queryFn: async (): Promise<{ rows: ReadingRow[]; hasMore: boolean }> => {
      if (!user) return { rows: [], hasMore: false };

      let q = supabase
        .from('tarot_readings')
        .select('id, created_at, question, spread_id, is_favorite, cards, ai_interpretation')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE); // +1 to detect hasMore

      if (onlyFavorites) q = q.eq('is_favorite', true);

      const { data, error } = await q;
      if (error) throw error;

      const rows = (data ?? []) as ReadingRow[];
      const hasMore = rows.length > PAGE_SIZE;
      return { rows: hasMore ? rows.slice(0, PAGE_SIZE) : rows, hasMore };
    },
    enabled: !!user && !!session,
    staleTime: STALE_DAILY,
    retry: rlsSafeRetry,
    placeholderData: (prev) => prev, // keep previous page visible while loading next
  });
}
