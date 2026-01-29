-- ============================================
-- Table des abonnements utilisateurs
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  credits_remaining int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- Activer RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription credits"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- Fonction pour vérifier les crédits
-- ============================================
CREATE OR REPLACE FUNCTION public.has_reading_credits(uid uuid)
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN plan = 'premium' AND subscription_status = 'active' THEN true
        WHEN credits_remaining > 0 THEN true
        ELSE false
      END
    FROM public.subscriptions 
    WHERE user_id = uid),
    true -- Si pas d'entrée, autoriser (sera créée après)
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ============================================
-- Fonction pour décrémenter les crédits
-- ============================================
CREATE OR REPLACE FUNCTION public.decrement_reading_credit(uid uuid)
RETURNS void AS $$
  UPDATE public.subscriptions 
  SET credits_remaining = GREATEST(credits_remaining - 1, 0),
      updated_at = now()
  WHERE user_id = uid AND plan = 'free';
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ============================================
-- Trigger pour créer un abonnement gratuit à l'inscription
-- ============================================
CREATE OR REPLACE FUNCTION public.create_free_subscription_on_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, credits_remaining)
  VALUES (NEW.id, 'free', 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger sur la table profiles (qui est créée à l'inscription)
DROP TRIGGER IF EXISTS on_profile_created_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_free_subscription_on_user();

-- ============================================
-- Fonction pour obtenir le statut d'abonnement
-- ============================================
CREATE OR REPLACE FUNCTION public.get_subscription_status(uid uuid)
RETURNS jsonb AS $$
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
    jsonb_build_object('plan', 'free', 'credits_remaining', 1)
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;