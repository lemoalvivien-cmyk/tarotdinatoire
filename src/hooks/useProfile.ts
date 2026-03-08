/**
 * useProfile — correctifs :
 *  - staleTime augmenté à 2 min (profil change peu souvent, 30s = trop agressif)
 *  - Session expiry guard conservé
 *  - updateProfile avec optimistic update conservé
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { qk, rlsSafeRetry } from '@/queries/queryConfig';

type Profile = Tables<'profiles'>;

// Explicit columns — no select('*') bleed
const PROFILE_COLUMNS =
  'id, display_name, birth_date, zodiac_sign, intention, preferred_domain, onboarding_completed, referred_by, created_at, updated_at';

/** 2 minutes — profil change peu souvent (vs 30s précédemment trop agressif) */
const STALE_PROFILE = 2 * 60_000;

export function useProfile() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: qk.profile(user?.id),
    queryFn: async (): Promise<Profile | null> => {
      if (!user || !session) return null;

      // Guard expired session avant toute requête
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        return null;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        // RLS transient — pas une vraie erreur, session en cours d'initialisation
        if (fetchError.code === '42501' || fetchError.message?.includes('permission denied')) {
          return null;
        }
        throw fetchError;
      }

      return data;
    },
    enabled: !!user && !!session,
    staleTime: STALE_PROFILE,
    retry: rlsSafeRetry,
    retryDelay: (attempt) => Math.min(300 * 2 ** attempt, 3000),
  });

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !session) return { error: new Error('Not authenticated') };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!updateError) {
      // Mise à jour optimiste du cache — pas de refetch réseau
      queryClient.setQueryData(qk.profile(user.id), (old: Profile | null) =>
        old ? { ...old, ...updates } : null
      );
    }

    return { error: updateError };
  };

  const invalidateProfile = () => {
    if (user) queryClient.invalidateQueries({ queryKey: qk.profile(user.id) });
  };

  return {
    profile,
    loading,
    error: error as Error | null,
    updateProfile,
    refetch,
    invalidateProfile,
  };
}

// Re-export stable query key for external invalidation
export const PROFILE_QUERY_KEY = 'profile';
