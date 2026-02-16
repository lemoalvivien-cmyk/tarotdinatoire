
-- 1. Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 24,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admin full access using existing is_admin() function
CREATE POLICY "Admins full access promo_codes"
  ON public.promo_codes FOR ALL
  USING (public.is_admin(auth.uid()));

-- 2. Add trial_ends_at to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 3. Create redeem_promo_code function
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_promo RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Connectez-vous d''abord');
  END IF;

  SELECT * INTO v_promo
  FROM promo_codes
  WHERE LOWER(code) = LOWER(p_code)
    AND is_active = true
    AND current_uses < max_uses;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code invalide ou expiré');
  END IF;

  UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = v_promo.id;

  INSERT INTO subscriptions (user_id, plan, subscription_status, trial_ends_at, updated_at)
  VALUES (v_user_id, 'trial', 'active', now() + (v_promo.duration_hours || ' hours')::interval, now())
  ON CONFLICT (user_id) DO UPDATE SET
    plan = 'trial',
    subscription_status = 'active',
    trial_ends_at = now() + (v_promo.duration_hours || ' hours')::interval,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'trial_ends_at', (now() + (v_promo.duration_hours || ' hours')::interval)::text);
END;
$func$;
