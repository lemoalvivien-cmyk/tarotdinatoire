import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk, STALE_MEDIUM, rlsSafeRetry } from '@/queries/queryConfig';

export interface KarmaProfile {
  xp: number;
  level: number;
  level_name: string;
  progress_pct: number;
  xp_next_level: number;
  xp_this_level: number;
  streak: number;
  longest_streak: number;
  total_readings: number;
  total_daily_draws: number;
  total_journals: number;
  total_shares: number;
  achievements: Achievement[];
}

export interface Achievement {
  key: string;
  earned_at: string;
  xp_reward: number;
}

export interface AwardResult {
  xp_gained: number;
  total_xp: number;
  level: number;
  level_name: string;
  progress_pct: number;
  xp_next_level: number;
  new_achievements: string[];
}

export type KarmaAction =
  | 'daily_draw'
  | 'streak_bonus'
  | 'reading_session'
  | 'celtic_cross'
  | 'life_path'
  | 'journal_entry'
  | 'share'
  | 'favorite';

// Static lookup maps — defined outside the hook (module-level) to avoid recreation
export const LEVEL_META: Record<number, { icon: string; color: string; description: string }> = {
  1: { icon: '🌱', color: 'hsl(142 76% 36%)', description: 'Vous commencez votre chemin' },
  2: { icon: '🔮', color: 'hsl(262 83% 58%)', description: 'La lumière s\'éveille en vous' },
  3: { icon: '✨', color: 'hsl(38 92% 50%)', description: 'Les arcanes vous parlent' },
  4: { icon: '🌟', color: 'hsl(48 96% 53%)', description: 'Vous avez transcendé les voiles' },
};

export const ACHIEVEMENT_META: Record<string, { label: string; description: string; icon: string; xp: number }> = {
  first_draw:     { label: 'Premier Pas',        description: 'Premier tirage du jour',                  icon: '🌅', xp: 20 },
  week_streak:    { label: 'Semaine Mystique',    description: '7 jours de suite',                        icon: '🔥', xp: 50 },
  month_streak:   { label: 'Mois Stellaire',      description: '30 jours de suite',                       icon: '⭐', xp: 150 },
  ten_readings:   { label: 'Voyageur',            description: '10 tirages complets',                     icon: '🗺️',  xp: 50 },
  fifty_readings: { label: 'Grand Lecteur',       description: '50 tirages complets',                     icon: '📖', xp: 200 },
  five_journals:  { label: 'Âme Profonde',        description: '5 entrées de journal',                    icon: '✍️',  xp: 30 },
  first_share:    { label: 'Partage Sacré',       description: 'Premier partage',                         icon: '💫', xp: 25 },
  deep_reader:    { label: 'Lecteur des Abysses', description: 'Tirage Croix Celtique ou Chemin de Vie',  icon: '⚜️', xp: 75 },
};

export function useKarma() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: karma, isLoading } = useQuery<KarmaProfile>({
    queryKey: qk.karma(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_karma_profile', { p_uid: user!.id });
      if (error) throw error;
      return data as unknown as KarmaProfile;
    },
    enabled: !!user,
    staleTime: STALE_MEDIUM,
    retry: rlsSafeRetry,
  });

  const awardMutation = useMutation<AwardResult, Error, KarmaAction>({
    mutationFn: async (action) => {
      const { data, error } = await supabase.rpc('award_karma', {
        p_uid: user!.id,
        p_action: action,
      });
      if (error) throw error;
      return data as unknown as AwardResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.karma(user?.id) });

      if (result.xp_gained > 0) {
        const hasAch = result.new_achievements.length > 0;
        toast(`+${result.xp_gained} XP`, {
          description: hasAch
            ? `🏆 Succès débloqué : ${result.new_achievements.map(k => ACHIEVEMENT_META[k]?.label ?? k).join(', ')}`
            : `Niveau ${result.level_name}`,
          duration: hasAch ? 6000 : 3000,
          icon: hasAch ? '🏆' : '✨',
        });
      }
    },
    onError: () => { /* silent — karma is a nice-to-have */ },
  });

  // Memoised levelMeta to avoid re-deriving on every render
  const levelMeta = useMemo(
    () => (karma ? LEVEL_META[karma.level] ?? LEVEL_META[1] : LEVEL_META[1]),
    [karma]
  );

  return {
    karma,
    isLoading,
    awardXP: (action: KarmaAction) => awardMutation.mutate(action),
    levelMeta,
  };
}
