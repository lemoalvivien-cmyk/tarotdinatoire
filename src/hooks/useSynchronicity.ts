import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SynchronicityInsight {
  type: 'recurring_card' | 'monthly_return' | 'number_pattern' | 'combination' | 'general';
  icon: string;
  title: string;
  body: string;
  intensity: 'low' | 'medium' | 'high';
  card_ids: string[];
}

export interface SyncPatterns {
  recurring_cards: Array<{ card_id: string; count: number; last_seen: string }>;
  this_month: Array<{ card_id: string; count: number }>;
  number_patterns: Array<{ numero: number; count: number; card_ids: string[] }>;
  combinations: Array<{ card_a: string; card_b: string; count: number }>;
  total_sessions: number;
  total_daily_draws: number;
}

export interface SynchronicityResult {
  insights: SynchronicityInsight[];
  patterns: SyncPatterns;
  total_readings: number;
  cached: boolean;
}

export function useSynchronicity() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Load cached result from DB (for quick re-render)
  const { data: cached, isLoading } = useQuery({
    queryKey: ['synchronicity', user?.id],
    queryFn: async (): Promise<SynchronicityResult | null> => {
      if (!user) return null;
      const { data } = await supabase
        .from('synchronicity_insights')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return null;
      return {
        insights: (data.insights as unknown as SynchronicityInsight[]) ?? [],
        patterns: (data.patterns as unknown as SyncPatterns) ?? {} as SyncPatterns,
        total_readings: data.total_readings ?? 0,
        cached: true,
      };
    },
    enabled: !!user && !!session,
    staleTime: 60_000,
  });

  const generateInsights = useCallback(async (force = false): Promise<SynchronicityResult | null> => {
    if (!session?.access_token) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      return null;
    }
    setIsGenerating(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/synchronicity-engine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ force }),
        }
      );

      if (resp.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        return null;
      }
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Erreur lors de la génération');
      }

      const result = await resp.json() as SynchronicityResult;
      queryClient.invalidateQueries({ queryKey: ['synchronicity', user?.id] });
      return result;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de générer les synchronicités.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [session, user?.id, queryClient]);

  return {
    result: cached,
    isLoading,
    isGenerating,
    generateInsights,
    hasInsights: (cached?.insights?.length ?? 0) > 0,
  };
}
