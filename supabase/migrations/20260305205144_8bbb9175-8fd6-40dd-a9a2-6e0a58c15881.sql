
-- Add psychological reflection column to daily_draws
ALTER TABLE public.daily_draws
  ADD COLUMN IF NOT EXISTS psych_reflection jsonb DEFAULT NULL;

-- Index for quick null checks (to know if reflection was already generated)
CREATE INDEX IF NOT EXISTS idx_daily_draws_psych_reflection_null
  ON public.daily_draws ((psych_reflection IS NULL));
