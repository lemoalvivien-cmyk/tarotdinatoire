-- ============================================
-- Fix: Replace email_leads_admin_safe view with secure function
-- Views cannot have RLS, so use a function that checks admin status
-- ============================================

-- Drop the existing view
DROP VIEW IF EXISTS public.email_leads_admin_safe;

-- Create a secure function to get email leads for admins only
CREATE OR REPLACE FUNCTION public.get_email_leads_admin_safe()
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  user_id uuid,
  spread_id text,
  session_id uuid,
  consent boolean,
  consent_text text,
  consent_timestamp timestamptz,
  email_verified boolean,
  verification_sent_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access this data
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Return all email leads WITHOUT sensitive tokens
  RETURN QUERY
  SELECT 
    e.id,
    e.email,
    e.first_name,
    e.user_id,
    e.spread_id,
    e.session_id,
    e.consent,
    e.consent_text,
    e.consent_timestamp,
    e.email_verified,
    e.verification_sent_at,
    e.unsubscribed_at,
    e.created_at,
    e.updated_at
  FROM public.email_leads e
  ORDER BY e.created_at DESC;
END;
$$;

-- Revoke execute from public, grant only to authenticated users
REVOKE ALL ON FUNCTION public.get_email_leads_admin_safe() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_leads_admin_safe() TO authenticated;