import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useDailyDraw() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [isDrawing, setIsDrawing] = useState(false);

  // Today's draw (from DB directly)
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayDraw, isLoading: drawLoading } = useQuery({
    queryKey: ['daily-draw', user?.id, todayStr],
    queryFn: async (): Promise<DailyDraw | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('daily_draws')
        .select('*')
        .eq('user_id', user.id)
        .eq('draw_date', todayStr)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DailyDraw | null;
    },
    enabled: !!user && !!session,
    staleTime: 60_000,
  });

  // Energy profile (via RPC)
  const { data: energyProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['energy-profile', user?.id],
    queryFn: async (): Promise<EnergyProfile> => {
      if (!user) return { total_draws: 0, streak: 0, avg_energy: 5, top_themes: [], energy_history: [] };
      const { data, error } = await supabase.rpc('get_energy_profile', { uid: user.id });
      if (error) throw error;
      return (data as unknown as EnergyProfile) ?? { total_draws: 0, streak: 0, avg_energy: 5, top_themes: [], energy_history: [] };
    },
    enabled: !!user && !!session,
    staleTime: 120_000,
  });

  // Streak (via RPC)
  const { data: streak = 0 } = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const { data, error } = await supabase.rpc('get_user_streak', { uid: user.id });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!user && !!session,
    staleTime: 60_000,
  });

  // Recent draws (timeline - last 30)
  const { data: recentDraws = [], isLoading: historyLoading } = useQuery({
    queryKey: ['daily-draws-history', user?.id],
    queryFn: async (): Promise<DailyDraw[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('daily_draws')
        .select('*')
        .eq('user_id', user.id)
        .order('draw_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as DailyDraw[];
    },
    enabled: !!user && !!session,
    staleTime: 60_000,
  });

  // Perform today's draw via Edge Function — idempotent (server enforces one-per-day)
  const isDrawingRef = useRef(false);
  const performDraw = useCallback(async (): Promise<DailyDraw | null> => {
    if (!session?.access_token) {
      toast.error('Session expirée. Veuillez vous reconnecter.');
      return null;
    }
    // Guard double-click / concurrent calls
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
        throw new Error(err.error ?? 'Erreur lors du tirage');
      }

      const json = await resp.json();
      const draw = json.draw as DailyDraw;

      // Invalidate queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['daily-draw'] });
      queryClient.invalidateQueries({ queryKey: ['energy-profile'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['daily-draws-history'] });

      return draw;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de réaliser le tirage.');
      return null;
    } finally {
      setIsDrawing(false);
      isDrawingRef.current = false;
    }
  }, [session, queryClient]);

  // Save journal entry
  const saveJournal = useMutation({
    mutationFn: async ({ drawId, journal_entry, mood, energy_score }: {
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
      queryClient.invalidateQueries({ queryKey: ['daily-draw'] });
      queryClient.invalidateQueries({ queryKey: ['energy-profile'] });
      queryClient.invalidateQueries({ queryKey: ['daily-draws-history'] });
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
