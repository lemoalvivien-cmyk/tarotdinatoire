
-- Synchronicity Engine: detection patterns + insights cache
CREATE TABLE IF NOT EXISTS public.synchronicity_insights (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  generated_at  timestamp with time zone NOT NULL DEFAULT now(),
  expires_at    timestamp with time zone NOT NULL DEFAULT (now() + interval '6 hours'),
  insights      jsonb NOT NULL DEFAULT '[]',
  patterns      jsonb NOT NULL DEFAULT '{}',
  total_readings integer NOT NULL DEFAULT 0
);

ALTER TABLE public.synchronicity_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own synchronicity"
  ON public.synchronicity_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own synchronicity"
  ON public.synchronicity_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (edge function) can insert/update
CREATE POLICY "Service can insert synchronicity"
  ON public.synchronicity_insights FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update synchronicity"
  ON public.synchronicity_insights FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_synchronicity_user_id ON public.synchronicity_insights (user_id, generated_at DESC);

-- ────────────────────────────────────────────────
-- Core detection function: recurring cards, number patterns, combinations
-- ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_synchronicity_patterns(uid uuid, limit_days integer DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(

    -- All recurring cards (>=2 appearances) across sessions + daily draws
    'recurring_cards', COALESCE(
      (SELECT jsonb_agg(
         jsonb_build_object('card_id', card_id, 'count', cnt, 'last_seen', last_seen)
         ORDER BY cnt DESC
       )
       FROM (
         SELECT card_id, COUNT(*) AS cnt, MAX(seen_at)::text AS last_seen
         FROM (
           SELECT sc->>'card_id' AS card_id, rs.created_at::date AS seen_at
           FROM public.reading_sessions rs,
                jsonb_array_elements(rs.selected_cards) AS sc
           WHERE rs.user_id = uid
             AND rs.created_at >= now() - (limit_days || ' days')::interval
           UNION ALL
           SELECT dd.card_id, dd.draw_date AS seen_at
           FROM public.daily_draws dd
           WHERE dd.user_id = uid
             AND dd.draw_date >= CURRENT_DATE - limit_days
         ) all_cards
         GROUP BY card_id
         HAVING COUNT(*) >= 2
         ORDER BY cnt DESC
         LIMIT 10
       ) t),
      '[]'::jsonb
    ),

    -- Cards seen this month specifically
    'this_month', COALESCE(
      (SELECT jsonb_agg(
         jsonb_build_object('card_id', card_id, 'count', cnt)
         ORDER BY cnt DESC
       )
       FROM (
         SELECT card_id, COUNT(*) AS cnt
         FROM (
           SELECT sc->>'card_id' AS card_id
           FROM public.reading_sessions rs,
                jsonb_array_elements(rs.selected_cards) AS sc
           WHERE rs.user_id = uid
             AND rs.created_at >= date_trunc('month', now())
           UNION ALL
           SELECT dd.card_id
           FROM public.daily_draws dd
           WHERE dd.user_id = uid
             AND dd.draw_date >= date_trunc('month', CURRENT_DATE)::date
         ) month_cards
         GROUP BY card_id
         HAVING COUNT(*) >= 2
         ORDER BY cnt DESC
         LIMIT 5
       ) t),
      '[]'::jsonb
    ),

    -- Major arcana number patterns (recurring numbers 0-21)
    'number_patterns', COALESCE(
      (SELECT jsonb_agg(
         jsonb_build_object('numero', numero, 'count', cnt, 'card_ids', card_ids)
         ORDER BY cnt DESC
       )
       FROM (
         SELECT tc.numero, COUNT(*) AS cnt,
                jsonb_agg(DISTINCT sc->>'card_id') AS card_ids
         FROM public.reading_sessions rs,
              jsonb_array_elements(rs.selected_cards) AS sc
         JOIN public.tarot_cards tc ON tc.id = sc->>'card_id'
         WHERE rs.user_id = uid
           AND rs.created_at >= now() - (limit_days || ' days')::interval
           AND tc.type = 'major'
           AND tc.numero IS NOT NULL
         GROUP BY tc.numero
         HAVING COUNT(*) >= 2
         ORDER BY cnt DESC
         LIMIT 8
       ) t),
      '[]'::jsonb
    ),

    -- Card pairs that appear together (same session, >=2 times)
    'combinations', COALESCE(
      (SELECT jsonb_agg(
         jsonb_build_object('card_a', card_a, 'card_b', card_b, 'count', cnt)
         ORDER BY cnt DESC
       )
       FROM (
         SELECT
           LEAST(a.card_id, b.card_id) AS card_a,
           GREATEST(a.card_id, b.card_id) AS card_b,
           COUNT(DISTINCT a.session_id) AS cnt
         FROM (
           SELECT rs.id AS session_id, sc->>'card_id' AS card_id
           FROM public.reading_sessions rs,
                jsonb_array_elements(rs.selected_cards) AS sc
           WHERE rs.user_id = uid
             AND rs.created_at >= now() - (limit_days || ' days')::interval
         ) a
         JOIN (
           SELECT rs.id AS session_id, sc->>'card_id' AS card_id
           FROM public.reading_sessions rs,
                jsonb_array_elements(rs.selected_cards) AS sc
           WHERE rs.user_id = uid
             AND rs.created_at >= now() - (limit_days || ' days')::interval
         ) b ON a.session_id = b.session_id AND a.card_id < b.card_id
         GROUP BY card_a, card_b
         HAVING COUNT(DISTINCT a.session_id) >= 2
         ORDER BY cnt DESC
         LIMIT 5
       ) t),
      '[]'::jsonb
    ),

    -- Total readings context
    'total_sessions', (
      SELECT COUNT(*) FROM public.reading_sessions
      WHERE user_id = uid
        AND created_at >= now() - (limit_days || ' days')::interval
    ),
    'total_daily_draws', (
      SELECT COUNT(*) FROM public.daily_draws
      WHERE user_id = uid
        AND draw_date >= CURRENT_DATE - limit_days
    )

  ) INTO result;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;
