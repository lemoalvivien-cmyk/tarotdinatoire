import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

const PROFILE_QUERY_KEY = 'profile';

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: [PROFILE_QUERY_KEY, user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;

      if (import.meta.env.DEV) {
        console.log('[useProfile] Fetching profile for user:', user.id);
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[useProfile] Fetch error:', fetchError);
        throw fetchError;
      }

      if (import.meta.env.DEV) {
        console.log('[useProfile] Profile loaded:', data?.id, 'onboarding_completed:', data?.onboarding_completed);
      }

      return data;
    },
    enabled: !!user,
    staleTime: 30_000, // 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(300 * 2 ** attemptIndex, 3000),
  });

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    if (import.meta.env.DEV) {
      console.log('[useProfile] Updating profile:', updates);
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!updateError) {
      // Optimistically update the cache
      queryClient.setQueryData([PROFILE_QUERY_KEY, user.id], (old: Profile | null) => 
        old ? { ...old, ...updates } : null
      );
    }

    return { error: updateError };
  };

  const invalidateProfile = () => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY, user.id] });
    }
  };

  return { 
    profile, 
    loading, 
    error: error as Error | null, 
    updateProfile, 
    refetch, 
    invalidateProfile 
  };
}

// Export query key for external invalidation
export { PROFILE_QUERY_KEY };
