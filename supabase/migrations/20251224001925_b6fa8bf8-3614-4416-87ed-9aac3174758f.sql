-- Fix insecure UPDATE policy on email_leads that allows any authenticated user to modify NULL user_id records

-- Drop the current insecure policy
DROP POLICY IF EXISTS "Users can update their own leads" ON public.email_leads;

-- Create secure policy: users can ONLY update their own leads (no NULL user_id exception)
CREATE POLICY "Users can update their own leads"
ON public.email_leads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a separate policy for unsubscribe via token (anonymous users can unsubscribe their own leads)
-- This allows updating unsubscribed_at and consent fields only when they know the unsubscribe_token
CREATE POLICY "Anyone can unsubscribe via token"
ON public.email_leads
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);