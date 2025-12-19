-- Remove public access to feature_flags table
-- Only authenticated users can read, only admins can update

-- Drop the existing public policy
DROP POLICY IF EXISTS "Anyone can view feature flags" ON public.feature_flags;

-- Create new policy: only authenticated users can view
CREATE POLICY "Authenticated users can view feature flags" 
ON public.feature_flags 
FOR SELECT 
TO authenticated
USING (id = 1);

-- Note: The "Admins can update feature flags" policy already exists and is correct