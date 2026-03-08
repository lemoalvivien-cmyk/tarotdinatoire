import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { qk } from '@/queries/queryConfig';

export interface PublicConfig {
  maintenance_mode: boolean;
  admin_bootstrap_used: boolean;
  app_version: string;
}

const SAFE_DEFAULTS: PublicConfig = {
  maintenance_mode: false,
  admin_bootstrap_used: true, // hide bootstrap section by default
  app_version: 'unknown',
};

/**
 * Hook to fetch public configuration (maintenance_mode, app_version).
 * Uses an Edge Function to avoid exposing the full feature_flags table.
 * Safe for unauthenticated users.
 *
 * Corrections appliquées :
 *  - staleTime augmenté à 5 min (config quasi-statique, pas besoin d'être frais)
 *  - refetchOnWindowFocus désactivé (inutile sur config statique, économise des requêtes)
 *  - retry réduit à 1 (pas besoin de 2 tentatives pour une config)
 *  - qk.publicConfig() utilisé pour la cohérence du cache centralisé
 */
export function usePublicConfig() {
  return useQuery({
    queryKey: qk.publicConfig(),
    queryFn: async (): Promise<PublicConfig> => {
      const { data, error } = await supabase.functions.invoke('public-config', {
        method: 'GET',
      });

      if (error) return SAFE_DEFAULTS;

      return {
        maintenance_mode:     data?.maintenance_mode     ?? false,
        admin_bootstrap_used: data?.admin_bootstrap_used ?? true,
        app_version:          data?.app_version          ?? 'unknown',
      };
    },
    staleTime:          5 * 60_000, // 5 min — config ne change pas souvent
    refetchOnWindowFocus: false,    // inutile sur config statique
    retry:              1,
  });
}
