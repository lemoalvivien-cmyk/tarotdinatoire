import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: location.pathname } });
    }
  }, [user, authLoading, navigate, location]);

  // Check onboarding status
  useEffect(() => {
    if (!user || !requireOnboarding) {
      setCheckingOnboarding(false);
      return;
    }

    const checkOnboarding = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        setOnboardingCompleted(data?.onboarding_completed ?? false);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setOnboardingCompleted(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user, requireOnboarding]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (
      !checkingOnboarding &&
      requireOnboarding &&
      onboardingCompleted === false &&
      location.pathname !== '/app/onboarding'
    ) {
      navigate('/app/onboarding');
    }
  }, [checkingOnboarding, requireOnboarding, onboardingCompleted, navigate, location.pathname]);

  if (authLoading || checkingOnboarding) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  // Allow access to onboarding page even if onboarding not completed
  if (location.pathname === '/app/onboarding') {
    return <>{children}</>;
  }

  // Block access to other /app/* routes if onboarding not completed
  if (requireOnboarding && !onboardingCompleted) {
    return null;
  }

  return <>{children}</>;
}
