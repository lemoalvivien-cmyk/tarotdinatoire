import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { qk, STALE_ANALYTICS, rlsSafeRetry } from '@/queries/queryConfig';

export interface EnergyDimensions {
  emotionnel: number;
  relations:  number;
  carriere:   number;
  clarte:     number;
  vitalite:   number;
}

export interface DimensionHistoryPoint extends EnergyDimensions {
  date: string;
  energy_score: number;
}

export interface EnergyDimensionsProfile {
  averages:           EnergyDimensions;
  history:            DimensionHistoryPoint[];
  trend:              EnergyDimensions;
  total_scored_draws: number;
}

const DEFAULT_DIMS: EnergyDimensions = {
  emotionnel: 5, relations: 5, carriere: 5, clarte: 5, vitalite: 5,
};

const DEFAULT_PROFILE: EnergyDimensionsProfile = {
  averages: DEFAULT_DIMS,
  history: [],
  trend: { emotionnel: 0, relations: 0, carriere: 0, clarte: 0, vitalite: 0 },
  total_scored_draws: 0,
};

export function useEnergyProfile(limitDays = 30) {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: qk.energyDimensions(user?.id, limitDays),
    queryFn: async (): Promise<EnergyDimensionsProfile> => {
      if (!user) return DEFAULT_PROFILE;
      const { data, error } = await supabase.rpc('get_energy_dimensions_profile', {
        uid: user.id,
        limit_days: limitDays,
      });
      if (error) throw error;
      const r = data as unknown as EnergyDimensionsProfile;
      return {
        averages:           r?.averages           ?? DEFAULT_DIMS,
        history:            r?.history            ?? [],
        trend:              r?.trend              ?? DEFAULT_DIMS,
        total_scored_draws: r?.total_scored_draws ?? 0,
      };
    },
    enabled: !!user && !!session,
    staleTime: STALE_ANALYTICS,
    retry: rlsSafeRetry,
  });
}
