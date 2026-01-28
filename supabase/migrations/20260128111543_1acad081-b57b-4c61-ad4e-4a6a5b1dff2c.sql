-- Fix SECURITY DEFINER view issue by recreating with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.email_leads_admin_safe;

CREATE VIEW public.email_leads_admin_safe 
WITH (security_invoker = true) AS
SELECT 
  id, 
  email, 
  first_name, 
  user_id, 
  spread_id, 
  session_id,
  consent, 
  consent_text, 
  consent_timestamp, 
  email_verified,
  verification_sent_at, 
  unsubscribed_at, 
  created_at, 
  updated_at
FROM public.email_leads;

COMMENT ON VIEW public.email_leads_admin_safe IS 'Safe view for admin dashboard - excludes verification_token and unsubscribe_token to prevent token exposure. Uses SECURITY INVOKER for proper RLS enforcement.';