-- ═══════════════════════════════════════════════════════════════
-- MISSION : Passer de 1 crédit gratuit → 0 crédit (paywall immédiat)
-- ═══════════════════════════════════════════════════════════════

-- 1. MODIFIER LA FONCTION DE CRÉATION D'ABONNEMENT (0 crédit au lieu de 1)
CREATE OR REPLACE FUNCTION public.create_free_subscription_on_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Créer abonnement avec 0 crédit (paywall immédiat)
  INSERT INTO public.subscriptions (user_id, plan, credits_remaining)
  VALUES (NEW.id, 'free', 0)  -- ← Changé de 1 à 0
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. METTRE À JOUR LA FONCTION get_subscription_status pour retourner 0 par défaut
CREATE OR REPLACE FUNCTION public.get_subscription_status(uid uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT jsonb_build_object(
      'plan', plan,
      'status', subscription_status,
      'credits_remaining', credits_remaining,
      'current_period_end', current_period_end,
      'cancel_at_period_end', cancel_at_period_end
    )
    FROM public.subscriptions 
    WHERE user_id = uid),
    jsonb_build_object('plan', 'free', 'credits_remaining', 0)  -- ← Changé de 1 à 0
  );
$$;

-- 3. METTRE À JOUR LES USERS EXISTANTS (ceux qui ont encore des crédits gratuits non utilisés)
UPDATE public.subscriptions 
SET credits_remaining = 0, updated_at = now()
WHERE plan = 'free' AND credits_remaining > 0;