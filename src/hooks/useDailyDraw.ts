import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk, STALE_DAILY, STALE_ANALYTICS, rlsSafeRetry } from '@/queries/queryConfig';

export interface DailyDraw {
  id: string;
  user_id: string;
  draw_date: string;
  card_id: string;
  orientation: 'upright' | 'reversed';
  interpretation: {
    title: string;
    summary: string;
    advice: string;
    reflection_question: string;
    energy: 'positif' | 'neutre' | 'challenging';
  } | null;
  reflection_question: string | null;
  journal_entry: string | null;
  themes: string[];
  energy_score: number;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnergyHistory {
  date: string;
  score: number;
  card_id: string;
}

export interface TopTheme {
  theme: string;
  count: number;
}

export interface EnergyProfile {
  total_draws: number;
  streak: number;
  avg_energy: number;
  top_themes: TopTheme[];
  energy_history: EnergyHistory[];
}

/** Stable date string — computed once per hook mount, not on every render */
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function useDailyDraw() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);

  // todayStr is stable for the lifetime of the hook — no recompute per render
  const todayStr = useMemo(getTodayStr, []);

  // ── Today's draw ──────────────────────────────────────────────────────────
  const { data: todayDraw, isLoading: drawLoading } = useQuery({
    queryKey: qk.dailyDraw(user?.id, todayStr),
    queryFn: async (): Promise<DailyDraw | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('daily_draws')
        .select(
          'id, user_id, draw_date, card_id, orientation, interpretation, ' +
          'reflection_question, journal_entry, themes, energy_score, mood, created_at, updated_at'
        )
        .eq('user_id', user.id)
        .eq('draw_date', todayStr)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DailyDraw | null;
    },
    enabled: !!user && !!session,
    staleTime: STALE_DAILY,
    retry: rlsSafeRetry,
  });

  // ── Energy profile (RPC) ──────────────────────────────────────────────────
  const { data: energyProfile, isLoading: profileLoading } = useQuery({
    queryKey: qk.energyProfile(user?.id),
    queryFn: async (): Promise<EnergyProfile> => {
      const empty: EnergyProfile = { total_draws: 0, streak: 0, avg_energy: 5, top_themes: [], energy_history: [] };
      if (!user) return empty;
      const { data, error } = await supabase.rpc('get_energy_profile', { uid: user.id });
      if (error) throw error;
      return (data as unknown as EnergyProfile) ?? empty;
    },
    enabled: !!user && !!session,
    staleTime: STALE_ANALYTICS,
    retry: rlsSafeRetry,
  });

  // ── Streak (RPC) ──────────────────────────────────────────────────────────
  const { data: streak = 0 } = useQuery({
    queryKey: qk.streak(user?.id),
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const { data, error } = await supabase.rpc('get_user_streak', { uid: user.id });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!user && !!session,
    staleTime: STALE_DAILY,
    retry: rlsSafeRetry,
  });

  // ── Recent draws — minimal columns for timeline ───────────────────────────
  const { data: recentDraws = [], isLoading: historyLoading } = useQuery({
    queryKey: qk.dailyDrawsHistory(user?.id),
    queryFn: async (): Promise<DailyDraw[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('daily_draws')
        .select(
          'id, user_id, draw_date, card_id, orientation, interpretation, ' +
          'reflection_question, journal_entry, themes, energy_score, mood, created_at, updated_at'
        )
        .eq('user_id', user.id)
        .order('draw_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as DailyDraw[];
    },
    enabled: !!user && !!session,
    staleTime: STALE_DAILY,
    retry: rlsSafeRetry,
  });

  // ── Perform today's draw (Edge Function, idempotent) ─────────────────────
  const performDraw = useCallback(async (): Promise<DailyDraw | null> => {
    if (!session?.access_token) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      return null;
    }
    if (isDrawingRef.current) return null;
    isDrawingRef.current = true;
    setIsDrawing(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-draw`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (resp.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        return null;
      }
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Erreur lors du tirage');
      }

      const json = await resp.json();
      const draw = json.draw as DailyDraw;

      // Invalidate derived queries — use exact key factory
      queryClient.invalidateQueries({ queryKey: qk.dailyDraw(user?.id, todayStr) });
      queryClient.invalidateQueries({ queryKey: qk.energyProfile(user?.id) });
      queryClient.invalidateQueries({ queryKey: qk.streak(user?.id) });
      queryClient.invalidateQueries({ queryKey: qk.dailyDrawsHistory(user?.id) });

      return draw;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de réaliser le tirage.');
      return null;
    } finally {
      setIsDrawing(false);
      isDrawingRef.current = false;
    }
  }, [session, queryClient, user?.id, todayStr]);

  // ── Save journal entry ────────────────────────────────────────────────────
  const saveJournal = useMutation({
    mutationFn: async ({
      drawId,
      journal_entry,
      mood,
      energy_score,
    }: {
      drawId: string;
      journal_entry: string;
      mood: string;
      energy_score: number;
    }) => {
      if (!user) throw new Error('Non connecté');
      const { error } = await supabase
        .from('daily_draws')
        .update({ journal_entry, mood, energy_score })
        .eq('id', drawId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Réflexion enregistrée ✨');
      queryClient.invalidateQueries({ queryKey: qk.dailyDraw(user?.id, todayStr) });
      queryClient.invalidateQueries({ queryKey: qk.energyProfile(user?.id) });
      queryClient.invalidateQueries({ queryKey: qk.dailyDrawsHistory(user?.id) });
    },
    onError: () => toast.error('Impossible de sauvegarder votre réflexion.'),
  });

  return {
    todayDraw,
    drawLoading,
    streak,
    energyProfile,
    profileLoading,
    recentDraws,
    historyLoading,
    isDrawing,
    performDraw,
    saveJournal,
    hasDrawnToday: !!todayDraw,
  };
}
