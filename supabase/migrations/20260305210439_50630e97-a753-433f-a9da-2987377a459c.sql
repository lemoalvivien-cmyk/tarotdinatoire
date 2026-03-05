
-- Energy Profile System: multi-dimensional scoring
-- Add energy_dimensions to daily_draws
ALTER TABLE public.daily_draws
  ADD COLUMN IF NOT EXISTS energy_dimensions jsonb DEFAULT '{}';

-- ────────────────────────────────────────────────────────────────────────────
-- get_energy_dimensions_profile: returns avg + history per dimension
-- Dimensions: emotionnel, relations, carriere, clarte, vitalite
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_energy_dimensions_profile(uid uuid, limit_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(

    -- Average per dimension
    'averages', jsonb_build_object(
      'emotionnel', COALESCE(ROUND(AVG(NULLIF((energy_dimensions->>'emotionnel')::numeric, 0))), 5),
      'relations',  COALESCE(ROUND(AVG(NULLIF((energy_dimensions->>'relations')::numeric, 0))),  5),
      'carriere',   COALESCE(ROUND(AVG(NULLIF((energy_dimensions->>'carriere')::numeric, 0))),   5),
      'clarte',     COALESCE(ROUND(AVG(NULLIF((energy_dimensions->>'clarte')::numeric, 0))),     5),
      'vitalite',   COALESCE(ROUND(AVG(NULLIF((energy_dimensions->>'vitalite')::numeric, 0))),   5)
    ),

    -- History for trend lines (last N days with dimensions)
    'history', COALESCE(
      (SELECT jsonb_agg(
         jsonb_build_object(
           'date',        draw_date,
           'emotionnel',  COALESCE((energy_dimensions->>'emotionnel')::numeric, 5),
           'relations',   COALESCE((energy_dimensions->>'relations')::numeric, 5),
           'carriere',    COALESCE((energy_dimensions->>'carriere')::numeric, 5),
           'clarte',      COALESCE((energy_dimensions->>'clarte')::numeric, 5),
           'vitalite',    COALESCE((energy_dimensions->>'vitalite')::numeric, 5),
           'energy_score',COALESCE(energy_score, 5)
         ) ORDER BY draw_date
       )
       FROM (
         SELECT draw_date, energy_dimensions, energy_score
         FROM public.daily_draws
         WHERE user_id = uid
           AND draw_date >= CURRENT_DATE - limit_days
           AND energy_dimensions IS NOT NULL
           AND energy_dimensions != '{}'::jsonb
         ORDER BY draw_date DESC
         LIMIT limit_days
       ) sub),
      '[]'::jsonb
    ),

    -- Trend: compare last 7 days vs prior 7 days
    'trend', (
      SELECT jsonb_build_object(
        'emotionnel', COALESCE(ROUND(
          AVG(CASE WHEN draw_date >= CURRENT_DATE - 7  THEN (energy_dimensions->>'emotionnel')::numeric END) -
          AVG(CASE WHEN draw_date < CURRENT_DATE - 7 AND draw_date >= CURRENT_DATE - 14 THEN (energy_dimensions->>'emotionnel')::numeric END)
        ), 0),
        'relations', COALESCE(ROUND(
          AVG(CASE WHEN draw_date >= CURRENT_DATE - 7  THEN (energy_dimensions->>'relations')::numeric END) -
          AVG(CASE WHEN draw_date < CURRENT_DATE - 7 AND draw_date >= CURRENT_DATE - 14 THEN (energy_dimensions->>'relations')::numeric END)
        ), 0),
        'carriere', COALESCE(ROUND(
          AVG(CASE WHEN draw_date >= CURRENT_DATE - 7  THEN (energy_dimensions->>'carriere')::numeric END) -
          AVG(CASE WHEN draw_date < CURRENT_DATE - 7 AND draw_date >= CURRENT_DATE - 14 THEN (energy_dimensions->>'carriere')::numeric END)
        ), 0),
        'clarte', COALESCE(ROUND(
          AVG(CASE WHEN draw_date >= CURRENT_DATE - 7  THEN (energy_dimensions->>'clarte')::numeric END) -
          AVG(CASE WHEN draw_date < CURRENT_DATE - 7 AND draw_date >= CURRENT_DATE - 14 THEN (energy_dimensions->>'clarte')::numeric END)
        ), 0),
        'vitalite', COALESCE(ROUND(
          AVG(CASE WHEN draw_date >= CURRENT_DATE - 7  THEN (energy_dimensions->>'vitalite')::numeric END) -
          AVG(CASE WHEN draw_date < CURRENT_DATE - 7 AND draw_date >= CURRENT_DATE - 14 THEN (energy_dimensions->>'vitalite')::numeric END)
        ), 0)
      )
      FROM public.daily_draws
      WHERE user_id = uid
        AND draw_date >= CURRENT_DATE - 14
        AND energy_dimensions IS NOT NULL
        AND energy_dimensions != '{}'::jsonb
    ),

    'total_scored_draws', (
      SELECT COUNT(*) FROM public.daily_draws
      WHERE user_id = uid
        AND energy_dimensions IS NOT NULL
        AND energy_dimensions != '{}'::jsonb
    )

  ) INTO result
  FROM public.daily_draws
  WHERE user_id = uid
    AND draw_date >= CURRENT_DATE - limit_days;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;
