
-- ═══════════════════════════════════════════════════════
-- NARRATIVE ENGINE — Schema without pgvector dependency
-- Embeddings stored as jsonb float arrays; patterns via SQL
-- ═══════════════════════════════════════════════════════

-- 1. narrative_memories table
CREATE TABLE IF NOT EXISTS public.narrative_memories (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid    NOT NULL,
  summary             text    NOT NULL,
  themes              text[]  DEFAULT '{}',
  key_cards           jsonb   DEFAULT '[]'::jsonb,
  emotional_arc       text,
  emotional_direction text,   -- 'ascending' | 'descending' | 'stable' | 'mixed'
  time_range_start    date,
  time_range_end      date,
  reading_count       integer DEFAULT 0,
  pattern_data        jsonb   DEFAULT '{}'::jsonb,
  -- Embedding stored as float array for future vector search
  embedding_json      jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.narrative_memories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_narrative_memories_user_date
  ON public.narrative_memories (user_id, created_at DESC);

CREATE POLICY "Users can view own narratives"
  ON public.narrative_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own narratives"
  ON public.narrative_memories FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all narratives"
  ON public.narrative_memories FOR SELECT
  USING (is_admin(auth.uid()));

-- 2. Embedding cache on reading_results (jsonb, portable)
ALTER TABLE public.reading_results
  ADD COLUMN IF NOT EXISTS embedding_json jsonb;

ALTER TABLE public.daily_draws
  ADD COLUMN IF NOT EXISTS embedding_json jsonb;

-- 3. get_card_patterns — card frequency across all readings
CREATE OR REPLACE FUNCTION public.get_card_patterns(uid uuid, limit_days int DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'card_frequencies', COALESCE(
      (SELECT jsonb_agg(
         jsonb_build_object('card_id', card_id, 'cnt', cnt)
         ORDER BY cnt DESC
       )
       FROM (
         SELECT sc->>'card_id' AS card_id, COUNT(*) AS cnt
         FROM public.reading_sessions rs,
              jsonb_array_elements(rs.selected_cards) AS sc
         WHERE rs.user_id = uid
           AND rs.created_at >= now() - (limit_days || ' days')::interval
         GROUP BY card_id
         ORDER BY cnt DESC
         LIMIT 10
       ) t),
      '[]'::jsonb
    ),
    'orientation_split', (
      SELECT jsonb_build_object(
        'upright', SUM(CASE WHEN sc->>'orientation' = 'upright' THEN 1 ELSE 0 END),
        'reversed', SUM(CASE WHEN sc->>'orientation' = 'reversed' THEN 1 ELSE 0 END)
      )
      FROM public.reading_sessions rs,
           jsonb_array_elements(rs.selected_cards) AS sc
      WHERE rs.user_id = uid
        AND rs.created_at >= now() - (limit_days || ' days')::interval
    ),
    'total_readings', (
      SELECT COUNT(*) FROM public.reading_sessions
      WHERE user_id = uid
        AND created_at >= now() - (limit_days || ' days')::interval
    ),
    'date_range_start', (
      SELECT MIN(created_at)::date FROM public.reading_sessions
      WHERE user_id = uid
        AND created_at >= now() - (limit_days || ' days')::interval
    ),
    'date_range_end', (
      SELECT MAX(created_at)::date FROM public.reading_sessions
      WHERE user_id = uid
    )
  ) INTO result;

  RETURN COALESCE(result, '{"card_frequencies":[],"total_readings":0}'::jsonb);
END;
$$;

-- 4. get_theme_patterns — theme clustering from interpretations
CREATE OR REPLACE FUNCTION public.get_theme_patterns(uid uuid, limit_days int DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Collect themes from reading_results + daily_draws
  SELECT jsonb_build_object(
    'top_themes', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('theme', theme, 'count', cnt) ORDER BY cnt DESC)
       FROM (
         SELECT theme, COUNT(*) AS cnt
         FROM (
           -- Themes from reading_results interpretation
           SELECT jsonb_array_elements_text(
             CASE
               WHEN rr.interpretation ? 'themes' THEN rr.interpretation->'themes'
               ELSE '[]'::jsonb
             END
           ) AS theme
           FROM public.reading_results rr
           JOIN public.reading_sessions rs ON rs.id = rr.session_id
           WHERE rs.user_id = uid
             AND rr.created_at >= now() - (limit_days || ' days')::interval

           UNION ALL

           -- Themes from daily_draws
           SELECT unnest(dd.themes) AS theme
           FROM public.daily_draws dd
           WHERE dd.user_id = uid
             AND dd.created_at >= now() - (limit_days || ' days')::interval
             AND dd.themes IS NOT NULL
         ) all_themes
         WHERE theme IS NOT NULL AND theme != ''
         GROUP BY theme
         ORDER BY cnt DESC
         LIMIT 12
       ) t),
      '[]'::jsonb
    ),
    'energy_trend', (
      SELECT jsonb_agg(
        jsonb_build_object('date', draw_date, 'score', energy_score)
        ORDER BY draw_date
      )
      FROM (
        SELECT draw_date, energy_score
        FROM public.daily_draws
        WHERE user_id = uid
        ORDER BY draw_date DESC
        LIMIT 30
      ) e
    )
  ) INTO result;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;
