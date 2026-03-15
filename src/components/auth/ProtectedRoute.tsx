import { useEffect, ReactNode, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { qk } from '@/queries/queryConfig';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  /**
   * requirePremium is intentionally ignored while ENABLE_MONETIZATION = false.
   * The prop is kept for API compatibility so no call-site changes are needed.
   */
  requirePremium?: boolean;
}

/**
 * ProtectedRoute — ENABLE_MONETIZATION = false edition.
 *
 * Changes vs previous version:
 * - requirePremium = false by default (free beta mode)
 * - PaywallOverlay is NEVER rendered — monetization is off
 * - Stripe return polling removed (no subscription to check)
 * - Cleaner loading: only profile loading matters now
 */
export function ProtectedRoute({
  children,
  requireOnboarding = true,
  requirePremium: _requirePremium = false, // ignored in free mode
}: ProtectedRouteProps) {
  const { user, session, status, signOut } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refetch } = useProfile();
  const queryClient = useQueryClient();

  const navigate   = useNavigate();
  const location   = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const hasRedirected = useRef(false);

  // Stripe return: clean URL silently (no-op in free mode, kept for compat)
  const stripeReturnHandled = useRef(false);
  useEffect(() => {
    if (stripeReturnHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') !== 'success') return;
    stripeReturnHandled.current = true;
    window.history.replaceState({}, document.title, window.location.pathname);
    queryClient.invalidateQueries({ queryKey: qk.subscription(user?.id) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated' && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/auth', { state: { from: location.pathname }, replace: true });
    }
  }, [status, navigate, location.pathname]);

  // Reset redirect flag on re-login
  useEffect(() => {
    if (status === 'authenticated') hasRedirected.current = false;
  }, [status]);

  // Onboarding redirect
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

  const handleRetry = () => { setRetryCount(prev => prev + 1); refetch(); };
  const handleLogout = async () => { await signOut(); navigate('/auth', { replace: true }); };

  // ── Loading states ──────────────────────────────────────────────────────────
  if (status === 'loading') return <LoadingScreen />;
  if (status === 'unauthenticated' || !user || !session) return <LoadingScreen />;

  // Persistent profile error
  if (profileError && retryCount >= 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-lg text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold text-foreground">Erreur de chargement</h1>
            <p className="text-muted-foreground">Impossible de charger votre profil. Veuillez réessayer ou vous reconnecter.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Réessayer</Button>
            <Button onClick={handleLogout} variant="destructive"><LogOut className="h-4 w-4 mr-2" />Se déconnecter</Button>
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) return <LoadingScreen />;

  // Onboarding gate
  if (location.pathname === '/app/onboarding') return <>{children}</>;
  if (requireOnboarding && profile?.onboarding_completed !== true) return <LoadingScreen />;

  // ── ENABLE_MONETIZATION = false → never block with paywall ─────────────────
  return <>{children}</>;
}
