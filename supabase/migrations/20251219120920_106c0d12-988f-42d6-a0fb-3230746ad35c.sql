-- Add explicit policy to block anonymous access to profiles table
-- This ensures unauthenticated users cannot attempt to read profile data

CREATE POLICY "Block anonymous access" 
ON public.profiles 
FOR SELECT 
TO anon
USING (false);