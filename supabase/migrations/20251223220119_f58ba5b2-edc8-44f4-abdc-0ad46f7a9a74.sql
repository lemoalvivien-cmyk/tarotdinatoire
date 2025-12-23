-- Fix: Remove insecure RLS policy that exposes consent_logs to unauthenticated users
-- The condition "auth.uid() IS NULL" allowed anyone to read ALL consent logs

-- Drop the insecure policy
DROP POLICY IF EXISTS "Users can view own consent" ON public.consent_logs;

-- Create a secure policy that only allows authenticated users to see their own records
CREATE POLICY "Users can view own consent" 
ON public.consent_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);