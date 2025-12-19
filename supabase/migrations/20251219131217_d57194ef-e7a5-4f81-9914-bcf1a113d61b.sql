-- Fix: Remove the problematic "Block anonymous access" policy
-- The existing policies (auth.uid() = id) already protect against anonymous access
-- because auth.uid() returns NULL for unauthenticated users, making the condition always false

DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;