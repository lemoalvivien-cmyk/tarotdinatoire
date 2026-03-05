/**
 * Dashboard statistics — separated from the component so Dashboard
 * stays a pure presentation layer and stats are React Query–cached.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { qk, STALE_DAILY, rlsSafeRetry } from './queryConfig';

export interface DashboardStats {
  totalReadings: number;
  favorites: number;
}

export function useDashboardStats(): {
  stats: DashboardStats;
  isLoading: boolean;
} {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: qk.readingStats(user?.id),
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) return { totalReadings: 0, favorites: 0 };

      // Two lightweight HEAD requests — no payload transferred
      const [totalRes, favRes] = await Promise.all([
        supabase
          .from('tarot_readings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('tarot_readings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_favorite', true),
      ]);

      return {
        totalReadings: totalRes.count ?? 0,
        favorites: favRes.count ?? 0,
      };
    },
    enabled: !!user,
    staleTime: STALE_DAILY,
    retry: rlsSafeRetry,
  });

  return {
    stats: data ?? { totalReadings: 0, favorites: 0 },
    isLoading,
  };
}
