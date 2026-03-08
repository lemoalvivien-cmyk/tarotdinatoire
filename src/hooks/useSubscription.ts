/**
 * useSubscription — migré de useState/useEffect vers useQuery
 *
 * Correctifs appliqués :
 *  - Plus de polling manuel (setInterval/visibilitychange dans useEffect)
 *  - Cache partagé React Query : déduplication si plusieurs composants s'abonnent
 *  - refetchOnWindowFocus + refetchInterval (5 min, arrêté en background)
 *  - Refresh ciblé via queryClient.invalidateQueries après paiement/promo
 *  - Fallback DB propre si Edge Function échoue
 *  - Suppression des console.error (stripped en prod de toute façon, mais propre)
 */
import { useState, useCallback } from 'react';
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

// Isolated fetcher — pur, testable, sans dépendance au contexte React
async function fetchSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  // Primary: Edge Function (synchronisé avec Stripe)
  const { data, error } = await supabase.functions.invoke('check-subscription');

  if (!error && data) {
    return data as SubscriptionStatus;
  }

  // Fallback: requête DB directe si l'Edge Function échoue
  const { data: subData } = await supabase
    .from('subscriptions')
    .select('plan, credits_remaining, subscription_status, current_period_end, cancel_at_period_end, trial_ends_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!subData) return FREE_STATUS;

  const isTrial      = subData.plan === 'trial' && subData.subscription_status === 'active';
  const isTrialValid = isTrial && !!subData.current_period_end && new Date(subData.current_period_end) > new Date();
  const isPremiumRow = subData.plan === 'premium' && subData.subscription_status === 'active';

  return {
    subscribed:           isPremiumRow || isTrialValid,
    plan:                 subData.plan as 'free' | 'premium' | 'trial',
    credits_remaining:    subData.credits_remaining,
    subscription_end:     subData.current_period_end,
    cancel_at_period_end: subData.cancel_at_period_end ?? false,
    trial_ends_at:        subData.trial_ends_at,
  };
}

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // ── React Query — remplace useState + setInterval + visibilitychange ──────
  const { data: status, isLoading: loading } = useQuery({
    queryKey: qk.subscription(user?.id),
    queryFn:  () => fetchSubscriptionStatus(user!.id),
    enabled:  !!user,
    staleTime: STALE_SUB,                   // 5 min
    refetchOnWindowFocus:      true,        // refresh quand l'utilisateur revient
    refetchInterval:           5 * 60_000, // polling 5 min (uniquement si onglet actif)
    refetchIntervalInBackground: false,
    retry: rlsSafeRetry,
  });

  // Invalidation ciblée — utilisée après retour Stripe ou activation promo
  const refresh = useCallback((): Promise<void> => {
    return queryClient
      .invalidateQueries({ queryKey: qk.subscription(user?.id) })
      .then(() => undefined);
  }, [queryClient, user?.id]);

  // ── Stripe checkout ────────────────────────────────────────────────────────
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
      // Utilise location.href (pas window.open) pour éviter le popup blocker iOS Safari
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de démarrer le paiement');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Customer portal ────────────────────────────────────────────────────────
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

  // ── Promo code ─────────────────────────────────────────────────────────────
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

  // ── Derived booleans ───────────────────────────────────────────────────────
  const resolved  = status ?? FREE_STATUS;
  const hasCredits = resolved.subscribed || (resolved.credits_remaining ?? 0) > 0;
  const isPremium  = resolved.plan !== 'free' && resolved.subscribed;
  const isTrial    = resolved.plan === 'trial' && resolved.subscribed;

  return {
    status: resolved,
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
