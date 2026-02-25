import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  plan: 'free' | 'premium' | 'trial';
  credits_remaining: number | null;
  subscription_end: string | null;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const hasHandledSuccess = useRef(false);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('[useSubscription] Error checking subscription:', error);
        // Fallback to DB query
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('plan, credits_remaining, subscription_status, current_period_end, cancel_at_period_end')
          .eq('user_id', user.id)
          .single();

        if (subData) {
          const isTrial = subData.plan === 'trial' && subData.subscription_status === 'active';
          const isTrialValid = isTrial && subData.current_period_end && new Date(subData.current_period_end) > new Date();
          setStatus({
            subscribed: (subData.plan === 'premium' && subData.subscription_status === 'active') || !!isTrialValid,
            plan: subData.plan as 'free' | 'premium' | 'trial',
            credits_remaining: subData.credits_remaining,
            subscription_end: subData.current_period_end,
            cancel_at_period_end: subData.cancel_at_period_end ?? false,
            trial_ends_at: null
          });
        } else {
          setStatus({
            subscribed: false,
            plan: 'free',
            credits_remaining: 0,
            subscription_end: null,
            cancel_at_period_end: false,
            trial_ends_at: null
          });
        }
        return;
      }

      setStatus(data as SubscriptionStatus);
    } catch (err) {
      console.error('[useSubscription] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Détection du retour Stripe (subscription=success) → force refresh
  useEffect(() => {
    if (!user || hasHandledSuccess.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      hasHandledSuccess.current = true;
      // Nettoyer l'URL immédiatement
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      // Forcer plusieurs refreshs avec délais pour attendre la synchro webhook
      setLoading(true);
      checkSubscription();
      const t1 = setTimeout(() => checkSubscription(), 2000);
      const t2 = setTimeout(() => checkSubscription(), 5000);
      const t3 = setTimeout(() => checkSubscription(), 10000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [user, checkSubscription]);

  // Rafraîchir intelligemment (toutes les 5 minutes, uniquement si visible)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSubscription();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkSubscription();
      }
    }, 300000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, checkSubscription]);

  const startCheckout = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour souscrire à un abonnement.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');

      if (error) throw error;
      if (!data?.url) throw new Error('URL de paiement non reçue');

      // Ouvrir Stripe Checkout dans un nouvel onglet
      window.open(data.url, '_blank');
    } catch (err) {
      console.error('[useSubscription] Checkout error:', err);
      toast.error(err instanceof Error ? err.message : 'Impossible de démarrer le paiement');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (!data?.url) throw new Error('URL du portail non reçue');

      window.open(data.url, '_blank');
    } catch (err) {
      console.error('[useSubscription] Portal error:', err);
      toast.error(err instanceof Error ? err.message : 'Impossible d\'ouvrir le portail de gestion');
    }
  };

  const hasCredits = status?.subscribed || (status?.credits_remaining ?? 0) > 0;
  const isPremium = (status?.plan === 'premium' && status?.subscribed) || (status?.plan === 'trial' && status?.subscribed);
  const isTrial = status?.plan === 'trial' && status?.subscribed;

  const redeemPromo = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', { p_code: code });
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string };
      if (result.success) {
        await checkSubscription();
        toast.success('Code activé ! Votre essai gratuit de 24h est activé.');
      }
      return result;
    } catch (err) {
      console.error('[useSubscription] Redeem error:', err);
      return { success: false, error: 'Erreur lors de l\'activation du code' };
    }
  };

  return {
    status,
    loading,
    checkoutLoading,
    hasCredits,
    isPremium,
    isTrial,
    startCheckout,
    openCustomerPortal,
    redeemPromo,
    refresh: checkSubscription
  };
}
