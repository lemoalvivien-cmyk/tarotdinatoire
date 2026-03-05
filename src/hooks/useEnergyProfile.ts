import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  trend:              EnergyDimensions; // delta vs prior 7 days (+/-)
  total_scored_draws: number;
}

const DEFAULT_DIMENSIONS: EnergyDimensions = {
  emotionnel: 5, relations: 5, carriere: 5, clarte: 5, vitalite: 5,
};

const DEFAULT_PROFILE: EnergyDimensionsProfile = {
  averages:           DEFAULT_DIMENSIONS,
  history:            [],
  trend:              { emotionnel: 0, relations: 0, carriere: 0, clarte: 0, vitalite: 0 },
  total_scored_draws: 0,
};

export function useEnergyProfile(limitDays = 30) {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: ['energy-dimensions-profile', user?.id, limitDays],
    queryFn: async (): Promise<EnergyDimensionsProfile> => {
      if (!user) return DEFAULT_PROFILE;
      const { data, error } = await supabase.rpc('get_energy_dimensions_profile', {
        uid: user.id,
        limit_days: limitDays,
      });
      if (error) throw error;
      const result = data as unknown as EnergyDimensionsProfile;
      return {
        averages:           result?.averages           ?? DEFAULT_DIMENSIONS,
        history:            result?.history            ?? [],
        trend:              result?.trend              ?? DEFAULT_DIMENSIONS,
        total_scored_draws: result?.total_scored_draws ?? 0,
      };
    },
    enabled: !!user && !!session,
    staleTime: 120_000,
  });
}
