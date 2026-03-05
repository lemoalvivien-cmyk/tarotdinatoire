
-- Fix overly permissive RLS on synchronicity_insights
-- Edge functions use service_role which bypasses RLS entirely, so these policies only need to cover authenticated users
DROP POLICY IF EXISTS "Service can insert synchronicity" ON public.synchronicity_insights;
DROP POLICY IF EXISTS "Service can update synchronicity" ON public.synchronicity_insights;

-- Edge functions with service_role bypass RLS — no extra policies needed
-- Regular authenticated users can insert their own rows (in case of direct insert)
CREATE POLICY "Auth users can insert own synchronicity"
  ON public.synchronicity_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only own rows can be updated by the authenticated user
CREATE POLICY "Auth users can update own synchronicity"
  ON public.synchronicity_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
