import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface MaintenanceGuardProps {
  children: ReactNode;
}

// Routes toujours accessibles (statut, légal, auth, reset)
const ALWAYS_ALLOWED_ROUTES = [
  '/status',
  '/statut',
  '/legal/privacy',
  '/legal/terms',
  '/legal/imprint',
  '/legal/cookies',
  '/legal/rights',
  '/disclaimer',
  '/auth',
  '/reset-password',
  '/unsubscribe',
];

/**
 * MaintenanceGuard — correctifs :
 *  - Admin check migré de useState/useEffect vers useQuery (cache partagé)
 *  - Plus de fuite useEffect : le check RPC est automatiquement nettoyé par RQ
 *  - Rendu conditionnel simplifié : un seul état de loading
 */
export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { data: publicConfig, isLoading: configLoading } = usePublicConfig();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Admin check via React Query — cache 5 min, pas de doublon de requêtes
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('is_admin', { _user_id: user.id });
      return error ? false : !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60_000, // 5 min — le rôle admin ne change pas souvent
    retry: false,           // Pas de retry sur les checks de rôle
  });

  const isLoading = configLoading || authLoading || (!!user && adminLoading);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // En mode maintenance : vérifier si la route est autorisée
  if (publicConfig?.maintenance_mode) {
    const currentPath = location.pathname;

    const isAlwaysAllowed = ALWAYS_ALLOWED_ROUTES.some(r => currentPath.startsWith(r));
    const isAdminAllowed  = currentPath.startsWith('/admin') && isAdmin;

    if (!isAlwaysAllowed && !isAdminAllowed) {
      // Navigation synchrone dans le render — utiliser navigate dans un effect serait
      // correct mais crée un flash. Redirect immédiat via component est acceptable ici.
      if (location.pathname !== '/status') {
        navigate('/status', { replace: true });
      }
      return null;
    }
  }

  return <>{children}</>;
}
