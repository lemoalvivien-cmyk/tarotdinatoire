import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlags {
  id: number;
  maintenance_mode: boolean;
  enable_shop: boolean;
  enable_billing: boolean;
  enable_waitlist: boolean;
  updated_at: string;
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlags> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      return data as FeatureFlags;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
