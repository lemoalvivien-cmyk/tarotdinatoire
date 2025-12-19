-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists to avoid conflicts
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;

-- Create explicit policy to block anonymous SELECT access
CREATE POLICY "Block anonymous access"
ON public.profiles
FOR SELECT
TO anon
USING (false);