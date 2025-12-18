-- Drop existing select policy and recreate as PERMISSIVE for anon + authenticated
DROP POLICY IF EXISTS "Anyone can view feature flags" ON public.feature_flags;

CREATE POLICY "Anyone can view feature flags"
ON public.feature_flags
FOR SELECT
TO anon, authenticated
USING (id = 1);