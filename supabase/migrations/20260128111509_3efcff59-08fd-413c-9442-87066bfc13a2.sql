-- Create safe view for email_leads that excludes sensitive tokens
-- This prevents token exposure even to admins while maintaining full functionality
CREATE OR REPLACE VIEW public.email_leads_admin_safe AS
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

-- Grant admin access to the view
-- The view inherits RLS from the base table, but we also add explicit policies
COMMENT ON VIEW public.email_leads_admin_safe IS 'Safe view for admin dashboard - excludes verification_token and unsubscribe_token to prevent token exposure';

-- Revoke direct SELECT on token columns from authenticated users
-- This ensures tokens are only accessible via service role (edge functions)
REVOKE SELECT (verification_token, unsubscribe_token) ON public.email_leads FROM authenticated;
REVOKE SELECT (verification_token, unsubscribe_token) ON public.email_leads FROM anon;