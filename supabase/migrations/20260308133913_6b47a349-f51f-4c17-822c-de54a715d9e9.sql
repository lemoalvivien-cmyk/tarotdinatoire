
-- Fix pre-existing permissive RLS on shared_readings (service role only for counter updates)
DROP POLICY IF EXISTS "Service role can update share counters" ON public.shared_readings;

CREATE POLICY "Service role can update share counters"
  ON public.shared_readings FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.uid() = user_id)
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);
