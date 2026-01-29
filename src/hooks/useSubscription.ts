import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionStatus {
  subscribed: boolean;
  plan: 'free' | 'premium';
  credits_remaining: number | null;
  subscription_end: string | null;
  cancel_at_period_end: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
          setStatus({
            subscribed: subData.plan === 'premium' && subData.subscription_status === 'active',
            plan: subData.plan as 'free' | 'premium',
            credits_remaining: subData.credits_remaining,
            subscription_end: subData.current_period_end,
            cancel_at_period_end: subData.cancel_at_period_end ?? false
          });
        } else {
          setStatus({
            subscribed: false,
            plan: 'free',
            credits_remaining: 1,
            subscription_end: null,
            cancel_at_period_end: false
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

  // Rafraîchir périodiquement (toutes les 60 secondes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const startCheckout = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour souscrire à un abonnement.'
      });
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
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible de démarrer le paiement'
      });
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
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible d\'ouvrir le portail de gestion'
      });
    }
  };

  const hasCredits = status?.subscribed || (status?.credits_remaining ?? 0) > 0;
  const isPremium = status?.plan === 'premium' && status?.subscribed;

  return {
    status,
    loading,
    checkoutLoading,
    hasCredits,
    isPremium,
    startCheckout,
    openCustomerPortal,
    refresh: checkSubscription
  };
}
