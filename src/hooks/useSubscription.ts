/**
 * useSubscription — migré de useState/useEffect vers useQuery
 * Bénéfices :
 *   - Cache partagé, déduplication automatique des requêtes en parallèle
 *   - Pas de polling manuel — visibility-based refetch géré par RQ
 *   - Cleanup automatique (pas de fuite setInterval/setTimeout)
 *   - Stripe-return : invalidation ciblée via queryClient
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { qk, STALE_SUB, rlsSafeRetry } from '@/queries/queryConfig';

export interface SubscriptionStatus {
  subscribed: boolean;
  plan: 'free' | 'premium' | 'trial';
  credits_remaining: number | null;
  subscription_end: string | null;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
}

const FREE_STATUS: SubscriptionStatus = {
  subscribed: false,
  plan: 'free',
  credits_remaining: 0,
  subscription_end: null,
  cancel_at_period_end: false,
  trial_ends_at: null,
};

async function fetchSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  // Primary: Edge Function (Stripe sync)
  const { data, error } = await supabase.functions.invoke('check-subscription');

  if (!error && data) {
    return data as SubscriptionStatus;
  }

  // Fallback: direct DB query when Edge Function fails
  const { data: subData, error: dbError } = await supabase
    .from('subscriptions')
    .select('plan, credits_remaining, subscription_status, current_period_end, cancel_at_period_end, trial_ends_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (dbError || !subData) return FREE_STATUS;

  const isTrial     = subData.plan === 'trial' && subData.subscription_status === 'active';
  const isTrialValid = isTrial && !!subData.current_period_end && new Date(subData.current_period_end) > new Date();
  const isPremium   = subData.plan === 'premium' && subData.subscription_status === 'active';

  return {
    subscribed:            isPremium || isTrialValid,
    plan:                  subData.plan as 'free' | 'premium' | 'trial',
    credits_remaining:     subData.credits_remaining,
    subscription_end:      subData.current_period_end,
    cancel_at_period_end:  subData.cancel_at_period_end ?? false,
    trial_ends_at:         subData.trial_ends_at,
  };
}

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: status, isLoading: loading } = useQuery({
    queryKey: qk.subscription(user?.id),
    queryFn: () => fetchSubscriptionStatus(user!.id),
    enabled: !!user,
    staleTime: STALE_SUB,         // 5 min — frais mais pas agressif
    refetchOnWindowFocus: true,   // Refresh quand l'utilisateur revient sur l'onglet
    refetchInterval: 5 * 60 * 1000, // Polling passif toutes les 5 min si onglet visible
    refetchIntervalInBackground: false,
    retry: rlsSafeRetry,
  });

  // Refresh ciblé — utilisé après retour Stripe ou redemption promo
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: qk.subscription(user?.id) });
  }, [queryClient, user?.id]);

  const [checkoutLoading, setCheckoutLoading] = useQueryState();

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
      window.location.href = data.url;
    } catch (err) {
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
      toast.error(err instanceof Error ? err.message : "Impossible d'ouvrir le portail de gestion");
    }
  };

  const redeemPromo = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', { p_code: code });
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string };
      if (result.success) {
        await refresh();
        toast.success('Code activé ! Votre essai gratuit de 24h est activé.');
      }
      return result;
    } catch {
      return { success: false, error: "Erreur lors de l'activation du code" };
    }
  };

  const resolvedStatus = status ?? FREE_STATUS;
  const hasCredits = resolvedStatus.subscribed || (resolvedStatus.credits_remaining ?? 0) > 0;
  const isPremium  = resolvedStatus.plan !== 'free' && resolvedStatus.subscribed;
  const isTrial    = resolvedStatus.plan === 'trial' && resolvedStatus.subscribed;

  return {
    status: resolvedStatus,
    loading,
    checkoutLoading,
    hasCredits,
    isPremium,
    isTrial,
    startCheckout,
    openCustomerPortal,
    redeemPromo,
    refresh,
  };
}

// ── Minimal local boolean state without useState/useEffect noise ──────────────
function useQueryState(): [boolean, (v: boolean) => void] {
  const ref = { current: false };
  // Simple wrapper — React state for UI update, no RQ involvement
  const [v, setV] = ((): [boolean, (val: boolean) => void] => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useState } = require('react');
    return useState(false);
  })();
  void ref;
  return [v, setV];
}
