-- Fix profiles SELECT policies: change from RESTRICTIVE to PERMISSIVE
-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate as PERMISSIVE policies (default) with proper role targeting
-- Note: PERMISSIVE is the default, and policies are OR'd together

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Deny anonymous access (grant/revoke already applied, this ensures explicit denial)
CREATE POLICY "Deny anonymous select"
ON public.profiles
FOR SELECT
TO anon
USING (false);