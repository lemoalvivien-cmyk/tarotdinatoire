-- =============================================
-- RESTRICT feature_flags TO ADMIN ONLY
-- =============================================

-- 1. Force RLS
ALTER TABLE public.feature_flags FORCE ROW LEVEL SECURITY;

-- 2. Drop existing SELECT policy that allows all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view feature flags" ON public.feature_flags;

-- 3. Create admin-only SELECT policy
CREATE POLICY "Admins can view feature flags"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- NOTE: 
-- - No policy for 'anon' = anon users get ZERO access
-- - No policy for regular 'authenticated' = only admins can read
-- - Public access is via the public-config edge function (uses service role)