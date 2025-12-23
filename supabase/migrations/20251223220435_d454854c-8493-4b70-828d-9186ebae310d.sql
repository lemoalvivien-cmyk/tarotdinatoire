-- Fix: Remove insecure RLS policy that exposes email_leads to unauthenticated users
-- The condition "auth.uid() IS NULL" allowed anyone to read ALL email leads (PII exposure)

-- Drop the insecure policy
DROP POLICY IF EXISTS "Users can view their own leads" ON public.email_leads;

-- Create a secure policy that only allows authenticated users to see their own records
CREATE POLICY "Users can view their own leads" 
ON public.email_leads 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);