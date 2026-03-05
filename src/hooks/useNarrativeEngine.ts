import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNarrativeEngine() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Latest narrative from DB
  const { data: narrative, isLoading } = useQuery({
    queryKey: ['narrative-memory', user?.id],
    queryFn: async (): Promise<NarrativeMemory | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('narrative_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as NarrativeMemory | null;
    },
    enabled: !!user && !!session,
    staleTime: 300_000, // 5min
  });

  // All narrative history (last 10)
  const { data: narrativeHistory = [] } = useQuery({
    queryKey: ['narrative-history', user?.id],
    queryFn: async (): Promise<NarrativeMemory[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('narrative_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as NarrativeMemory[];
    },
    enabled: !!user && !!session,
    staleTime: 300_000,
  });

  // Generate/refresh narrative
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

      if (resp.status === 429) {
        toast.error('Limite atteinte. Réessayez dans quelques minutes.');
        return null;
      }
      if (resp.status === 402) {
        toast.error('Crédits insuffisants pour l\'oracle narratif.');
        return null;
      }
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erreur de génération');
      }

      const json = await resp.json();
      const result = json.narrative as NarrativeMemory;

      if (json.fresh) {
        toast.success('Votre récit a été mis à jour ✨');
      }

      queryClient.invalidateQueries({ queryKey: ['narrative-memory'] });
      queryClient.invalidateQueries({ queryKey: ['narrative-history'] });

      return result;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de générer le récit.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [session, queryClient]);

  return {
    narrative,
    narrativeHistory,
    isLoading,
    isGenerating,
    generateNarrative,
  };
}
