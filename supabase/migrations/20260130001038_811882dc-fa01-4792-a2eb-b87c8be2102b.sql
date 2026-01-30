-- ============================================
-- Security Fix: Column-level access control for sensitive data
-- ============================================

-- ============================================
-- 1. Email Leads: Ensure tokens are protected at column level
-- (Re-applying in case previous revocation was not complete)
-- ============================================

-- Revoke SELECT on sensitive token columns from all non-service roles
REVOKE SELECT (verification_token, unsubscribe_token) 
  ON public.email_leads 
  FROM authenticated;

REVOKE SELECT (verification_token, unsubscribe_token) 
  ON public.email_leads 
  FROM anon;

-- ============================================
-- 2. Subscriptions: Hide Stripe IDs from regular users
-- These IDs should only be accessed via service role (edge functions)
-- ============================================

-- Revoke SELECT on Stripe-specific columns from authenticated users
-- They can still see plan, credits, status via the table or get_subscription_status function
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) 
  ON public.subscriptions 
  FROM authenticated;

-- Also revoke from anon (defense in depth)
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) 
  ON public.subscriptions 
  FROM anon;

-- ============================================
-- 3. Create secure function for users to get their subscription info
-- (without exposing Stripe IDs)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_my_subscription()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  plan text,
  subscription_status text,
  credits_remaining integer,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.plan,
    s.subscription_status,
    s.credits_remaining,
    s.current_period_end,
    s.cancel_at_period_end,
    s.created_at,
    s.updated_at
  FROM public.subscriptions s
  WHERE s.user_id = auth.uid();
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.get_my_subscription() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_subscription() TO authenticated;