import { useEffect, ReactNode, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { PaywallOverlay } from '@/components/subscription/PaywallOverlay';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { qk } from '@/queries/queryConfig';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  requirePremium?: boolean;
}

/**
 * ProtectedRoute — correctifs :
 *  - Retour Stripe : invalide le cache subscription via queryClient (pas de setTimeout)
 *  - sessionStorage payment_return nettoyé une seule fois, pas à chaque render
 *  - Déduplication des effets de navigation
 */
export function ProtectedRoute({ children, requireOnboarding = true, requirePremium = true }: ProtectedRouteProps) {
  const { user, session, status, signOut } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refetch } = useProfile();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const queryClient = useQueryClient();

  // Retour Stripe — invalidation propre via React Query (remplace les 3 setTimeout)
  const stripeReturnHandled = useRef(false);
  useEffect(() => {
    if (stripeReturnHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') !== 'success') return;

    stripeReturnHandled.current = true;
    sessionStorage.setItem('payment_return', '1');

    // Nettoyer l'URL immédiatement
    window.history.replaceState({}, document.title, window.location.pathname);

    // Invalider le cache subscription — React Query re-fetchera automatiquement
    // avec le backoff exponentiel si besoin (webhook Stripe peut avoir un délai)
    queryClient.invalidateQueries({ queryKey: qk.subscription(user?.id) });

    // Refetch différé pour laisser le webhook Stripe se synchroniser
    const t1 = setTimeout(() => queryClient.invalidateQueries({ queryKey: qk.subscription(user?.id) }), 3000);
    const t2 = setTimeout(() => queryClient.invalidateQueries({ queryKey: qk.subscription(user?.id) }), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Détecter le payment_return en sessionStorage (survit aux re-renders)
  const isPaymentReturn = useMemo(() => {
    return sessionStorage.getItem('payment_return') === '1';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nettoyer le flag une fois que la subscription est confirmée premium
  useEffect(() => {
    if (isPremium && !subscriptionLoading) {
      sessionStorage.removeItem('payment_return');
    }
  }, [isPremium, subscriptionLoading]);

  const navigate   = useNavigate();
  const location   = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const hasRedirected = useRef(false);

  // Redirection unauthenticated — après que le check auth est terminé
  useEffect(() => {
    if (status === 'unauthenticated' && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/auth', { state: { from: location.pathname }, replace: true });
    }
  }, [status, navigate, location.pathname]);

  // Reset flag quand l'utilisateur se reconnecte
  useEffect(() => {
    if (status === 'authenticated') {
      hasRedirected.current = false;
    }
  }, [status]);

  // Redirection onboarding si profil non complété
  useEffect(() => {
    if (
      status === 'authenticated' &&
      !profileLoading &&
      profile !== undefined &&
      requireOnboarding &&
      profile?.onboarding_completed !== true &&
      location.pathname !== '/app/onboarding'
    ) {
      navigate('/app/onboarding', { replace: true });
    }
  }, [status, profileLoading, profile, requireOnboarding, navigate, location.pathname]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  // ── États de chargement ────────────────────────────────────────────────────
  if (status === 'loading') return <LoadingScreen />;
  if (status === 'unauthenticated' || !user || !session) return <LoadingScreen />;

  // Erreur profil persistante
  if (profileError && retryCount >= 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-lg text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Erreur de chargement
            </h1>
            <p className="text-muted-foreground">
              Impossible de charger votre profil. Veuillez réessayer ou vous reconnecter.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Chargement profil / subscription / retour paiement
  if (profileLoading || subscriptionLoading || isPaymentReturn) {
    return <LoadingScreen message="Vérification de votre abonnement..." />;
  }

  // Onboarding
  if (location.pathname === '/app/onboarding') return <>{children}</>;
  if (requireOnboarding && profile?.onboarding_completed !== true) return <LoadingScreen />;

  // Paywall strict
  if (requirePremium && !isPremium) {
    return <PaywallOverlay variant="modal" />;
  }

  return <>{children}</>;
}
