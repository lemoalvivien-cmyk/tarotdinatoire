import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk, STALE_NARRATIVE, rlsSafeRetry } from '@/queries/queryConfig';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface NarrativeMemory {
  id: string;
  user_id: string;
  summary: string;
  themes: string[];
  key_cards: NarrativeKeyCard[];
  emotional_arc: string | null;
  emotional_direction: 'ascending' | 'descending' | 'stable' | 'mixed' | null;
  time_range_start: string | null;
  time_range_end: string | null;
  reading_count: number;
  pattern_data: NarrativePatternData;
  created_at: string;
}

export interface NarrativeKeyCard {
  card_id: string;
  card_name: string;
  count: number;
  keywords: string[];
}

export interface NarrativePatternData {
  card_frequencies: { card_id: string; cnt: number }[];
  top_themes: { theme: string; count: number }[];
  energy_history: { date: string; score: number }[];
  streak: number;
  avg_energy: number;
  orientation_split?: { upright: number; reversed: number };
}

const NARRATIVE_COLUMNS =
  'id, user_id, summary, themes, key_cards, emotional_arc, emotional_direction, ' +
  'time_range_start, time_range_end, reading_count, pattern_data, created_at';

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNarrativeEngine() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: narrative, isLoading } = useQuery({
    queryKey: qk.narrative(user?.id),
    queryFn: async (): Promise<NarrativeMemory | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('narrative_memories')
        .select(NARRATIVE_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as NarrativeMemory | null;
    },
    enabled: !!user && !!session,
    staleTime: STALE_NARRATIVE,
    retry: rlsSafeRetry,
  });

  const { data: narrativeHistory = [] } = useQuery({
    queryKey: qk.narrativeHistory(user?.id),
    queryFn: async (): Promise<NarrativeMemory[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('narrative_memories')
        .select(NARRATIVE_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as NarrativeMemory[];
    },
    enabled: !!user && !!session,
    staleTime: STALE_NARRATIVE,
    retry: rlsSafeRetry,
  });

  const generateNarrative = useCallback(async (forceRefresh = false): Promise<NarrativeMemory | null> => {
    if (!session?.access_token) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      return null;
    }
    setIsGenerating(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/narrative-engine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ force_refresh: forceRefresh, limit_days: 90 }),
        }
      );

      if (resp.status === 429) { toast.error('Limite atteinte. Réessayez dans quelques minutes.'); return null; }
      if (resp.status === 402) { toast.error('Crédits insuffisants pour l\'oracle narratif.'); return null; }
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Erreur de génération');
      }

      const json = await resp.json();
      if (json.fresh) toast.success('Votre récit a été mis à jour ✨');

      // Invalidate both keys at once
      queryClient.invalidateQueries({ queryKey: qk.narrative(user?.id) });
      queryClient.invalidateQueries({ queryKey: qk.narrativeHistory(user?.id) });

      return json.narrative as NarrativeMemory;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de générer le récit.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [session, queryClient, user?.id]);

  return { narrative, narrativeHistory, isLoading, isGenerating, generateNarrative };
}
