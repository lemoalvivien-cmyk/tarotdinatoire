
-- Fix security definer view — use security_invoker instead
DROP VIEW IF EXISTS public.daily_free_draws_safe;

CREATE VIEW public.daily_free_draws_safe
  WITH (security_invoker = true)
AS
  SELECT
    id,
    session_key,
    card_id,
    orientation,
    interpretation,
    draw_date,
    created_at
  FROM public.daily_free_draws;

GRANT SELECT ON public.daily_free_draws_safe TO anon, authenticated;
