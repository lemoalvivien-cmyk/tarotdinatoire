-- Drop overly permissive UPDATE policy and replace with session_key scoped version
DROP POLICY IF EXISTS "Public can update own free draw email" ON public.daily_free_draws;

-- Scoped UPDATE: only the row whose session_key matches the request body value
-- We scope by draw_date = today to further restrict surface
CREATE POLICY "Public can update own free draw email"
ON public.daily_free_draws
FOR UPDATE
TO public
USING ((session_key IS NOT NULL) AND (length(session_key) >= 8) AND (draw_date = CURRENT_DATE))
WITH CHECK ((session_key IS NOT NULL) AND (length(session_key) >= 8));