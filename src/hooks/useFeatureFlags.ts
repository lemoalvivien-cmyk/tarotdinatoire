import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlags {
  id: number;
  maintenance_mode: boolean;
  enable_shop: boolean;
  enable_billing: boolean;
  enable_waitlist: boolean;
  admin_bootstrap_used: boolean;
  updated_at: string;
  // Premium monetization feature flags
  enable_unlimited_readings: boolean;
  enable_advanced_spreads: boolean;
  enable_ai_deep_analysis: boolean;
  enable_audio_readings: boolean;
  enable_relationship_analysis: boolean;
}

/**
 * Hook to fetch all feature flags - REQUIRES ADMIN ROLE
 * This should only be used in admin contexts where the user has admin role
 * For public config (maintenance_mode, app_version), use usePublicConfig instead
 * Regular authenticated users will get RLS errors - this is by design
 */
export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlags> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('id, maintenance_mode, enable_billing, enable_waitlist, enable_shop, admin_bootstrap_used, updated_at, enable_unlimited_readings, enable_advanced_spreads, enable_ai_deep_analysis, enable_audio_readings, enable_relationship_analysis')
        .eq('id', 1)
        .single();

      if (error) {
        // Non-admin users will get RLS 42501 — this is expected, not an error
        if (error.code === '42501' || error.code === 'PGRST116') {
          throw error; // silently rethrow to trigger retry: false
        }
        console.error('[useFeatureFlags] Unexpected error:', error);
        throw error;
      }
      return data as FeatureFlags;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    retry: false, // Prevents RLS-denied spam for non-admin users
  });
}
