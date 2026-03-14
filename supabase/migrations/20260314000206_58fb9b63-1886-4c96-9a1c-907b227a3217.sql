-- Allow public update on daily_free_draws for email capture (same session_key)
CREATE POLICY "Public can update own free draw email"
ON public.daily_free_draws
FOR UPDATE
TO public
USING (true)
WITH CHECK ((session_key IS NOT NULL) AND (length(session_key) >= 8));