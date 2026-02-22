import { useEffect, ReactNode, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { PaywallOverlay } from '@/components/subscription/PaywallOverlay';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  requirePremium?: boolean;
}

/**
 * AuthGate - Robust protected route with clear states:
 * 1. loading - waiting for auth check
 * 2. unauthenticated - redirect to /auth
 * 3. authenticated - check profile, then render children
 */
export function ProtectedRoute({ children, requireOnboarding = true, requirePremium = true }: ProtectedRouteProps) {
  const { user, session, status, signOut } = useAuth();
  const { profile, loading: profileLoading, error: profileError, refetch } = useProfile();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const hasRedirected = useRef(false);

  // Log navigation for debugging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[ProtectedRoute]', {
        path: location.pathname,
        status,
        profileLoading,
        subscriptionLoading,
        isPremium,
        userId: user?.id,
        profileId: profile?.id,
        onboardingCompleted: profile?.onboarding_completed,
        requireOnboarding,
        requirePremium,
        retryCount,
      });
    }
  }, [location.pathname, status, profileLoading, subscriptionLoading, isPremium, user?.id, profile, requireOnboarding, requirePremium, retryCount]);

  // Redirect unauthenticated users ONLY after auth check is complete
  useEffect(() => {
    if (status === 'unauthenticated' && !hasRedirected.current) {
      hasRedirected.current = true;
      if (import.meta.env.DEV) {
        console.log('[ProtectedRoute] Not authenticated, redirecting to /auth');
      }
      navigate('/auth', { state: { from: location.pathname }, replace: true });
    }
  }, [status, navigate, location.pathname]);

  // Reset redirect flag when user changes
  useEffect(() => {
    if (status === 'authenticated') {
      hasRedirected.current = false;
    }
  }, [status]);

  // Redirect to onboarding if not completed (but not if already on onboarding)
  useEffect(() => {
    if (
      status === 'authenticated' &&
      !profileLoading &&
      profile !== undefined &&
      requireOnboarding &&
      profile?.onboarding_completed !== true &&
      location.pathname !== '/app/onboarding'
    ) {
      if (import.meta.env.DEV) {
        console.log('[ProtectedRoute] Onboarding not completed, redirecting to /app/onboarding');
      }
      navigate('/app/onboarding', { replace: true });
    }
  }, [status, profileLoading, profile, requireOnboarding, navigate, location.pathname]);

  // Handle retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  // STATE 1: Auth is loading
  if (status === 'loading') {
    return <LoadingScreen />;
  }

  // STATE 2: Unauthenticated (redirect in progress)
  if (status === 'unauthenticated' || !user || !session) {
    return <LoadingScreen />;
  }

  // STATE 3: Authenticated but profile error (after 3 retries, show error screen)
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

  // STATE 4: Authenticated, loading profile or subscription
  if (profileLoading || subscriptionLoading) {
    return <LoadingScreen />;
  }

  // STATE 5: Allow access to onboarding page regardless of onboarding status
  if (location.pathname === '/app/onboarding') {
    return <>{children}</>;
  }

  // STATE 6: Block access to other /app/* routes if onboarding not completed
  if (requireOnboarding && profile?.onboarding_completed !== true) {
    return <LoadingScreen />;
  }

  // STATE 7: Check premium subscription (PAYWALL STRICT)
  // Users without active premium subscription see mandatory paywall
  if (requirePremium && !isPremium) {
    return <PaywallOverlay variant="modal" />;
  }

  // STATE 8: All checks passed - render children
  return <>{children}</>;
}
