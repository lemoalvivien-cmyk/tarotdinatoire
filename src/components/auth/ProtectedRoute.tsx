import { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  // Log navigation for debugging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[ProtectedRoute]', {
        path: location.pathname,
        authLoading,
        profileLoading,
        userId: user?.id,
        onboardingCompleted: profile?.onboarding_completed,
        requireOnboarding,
      });
    }
  }, [location.pathname, authLoading, profileLoading, user?.id, profile?.onboarding_completed, requireOnboarding]);

  // Check authentication - redirect only when we're sure there's no user
  useEffect(() => {
    if (!authLoading && !user) {
      if (import.meta.env.DEV) {
        console.log('[ProtectedRoute] No user, redirecting to /auth');
      }
      navigate('/auth', { state: { from: location.pathname }, replace: true });
    }
  }, [user, authLoading, navigate, location.pathname]);

  // Refetch profile when user changes (e.g., after signup)
  useEffect(() => {
    if (user && !authLoading) {
      refetch();
    }
  }, [user?.id, authLoading, refetch]);

  // Redirect to onboarding if not completed (but not if already on onboarding)
  useEffect(() => {
    if (
      !authLoading &&
      !profileLoading &&
      user &&
      profile !== undefined && // profile query has resolved
      requireOnboarding &&
      profile?.onboarding_completed !== true &&
      location.pathname !== '/app/onboarding'
    ) {
      if (import.meta.env.DEV) {
        console.log('[ProtectedRoute] Onboarding not completed, redirecting to /app/onboarding');
      }
      navigate('/app/onboarding', { replace: true });
    }
  }, [authLoading, profileLoading, user, profile, requireOnboarding, navigate, location.pathname]);

  // Show loading while checking auth or profile
  if (authLoading || (user && profileLoading)) {
    return <LoadingScreen />;
  }

  // If no user, we're redirecting - don't render anything
  if (!user) {
    return null;
  }

  // Allow access to onboarding page regardless of onboarding status
  if (location.pathname === '/app/onboarding') {
    return <>{children}</>;
  }

  // Block access to other /app/* routes if onboarding not completed
  if (requireOnboarding && profile?.onboarding_completed !== true) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
