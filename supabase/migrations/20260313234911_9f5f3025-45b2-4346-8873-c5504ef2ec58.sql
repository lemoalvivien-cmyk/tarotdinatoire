
-- Tighten INSERT policy: require non-empty session_key and valid card_id format
DROP POLICY IF EXISTS "Public can insert free draws" ON public.daily_free_draws;

CREATE POLICY "Public can insert free draws" ON public.daily_free_draws
  FOR INSERT WITH CHECK (
    session_key IS NOT NULL 
    AND length(session_key) >= 8
    AND card_id IS NOT NULL
    AND length(card_id) > 0
  );
