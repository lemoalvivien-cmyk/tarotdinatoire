
-- ═══════════════════════════════════════════
-- DAILY RITUAL ENGINE — Full schema
-- ═══════════════════════════════════════════

-- 1. daily_draws table
CREATE TABLE IF NOT EXISTS public.daily_draws (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  draw_date       date NOT NULL DEFAULT CURRENT_DATE,
  card_id         text NOT NULL,
  orientation     text NOT NULL DEFAULT 'upright'
                    CHECK (orientation IN ('upright', 'reversed')),
  interpretation  jsonb,
  reflection_question text,
  journal_entry   text,
  themes          text[] DEFAULT '{}',
  energy_score    integer DEFAULT 5 CHECK (energy_score BETWEEN 1 AND 10),
  mood            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, draw_date)
);

ALTER TABLE public.daily_draws ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_draws_user_date
  ON public.daily_draws (user_id, draw_date DESC);

-- RLS policies
CREATE POLICY "Users can view own daily draws"
  ON public.daily_draws FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily draws"
  ON public.daily_draws FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily draws"
  ON public.daily_draws FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily draws"
  ON public.daily_draws FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily draws"
  ON public.daily_draws FOR SELECT
  USING (is_admin(auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_daily_draws_updated_at
  BEFORE UPDATE ON public.daily_draws
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════
-- 2. get_user_streak function
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_user_streak(uid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak    integer := 0;
  chk_date  date    := CURRENT_DATE;
  found_row boolean;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.daily_draws
      WHERE user_id = uid AND draw_date = chk_date
    ) INTO found_row;

    IF found_row THEN
      streak    := streak + 1;
      chk_date  := chk_date - 1;
    ELSIF streak = 0 THEN
      SELECT EXISTS (
        SELECT 1 FROM public.daily_draws
        WHERE user_id = uid AND draw_date = CURRENT_DATE - 1
      ) INTO found_row;
      IF found_row THEN
        streak   := 1;
        chk_date := CURRENT_DATE - 2;
      ELSE
        EXIT;
      END IF;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN streak;
END;
$$;

-- ═══════════════════════════════════════════
-- 3. get_energy_profile function
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_energy_profile(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result       jsonb;
  total_count  integer;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM public.daily_draws WHERE user_id = uid;

  IF total_count = 0 THEN
    RETURN jsonb_build_object(
      'total_draws', 0, 'streak', 0, 'avg_energy', 5,
      'top_themes', '[]'::jsonb, 'energy_history', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'total_draws', total_count,
    'streak', public.get_user_streak(uid),
    'avg_energy', COALESCE(ROUND(AVG(energy_score)), 5),
    'top_themes', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('theme', t, 'count', cnt) ORDER BY cnt DESC)
       FROM (SELECT unnest(themes) AS t, COUNT(*) AS cnt
             FROM public.daily_draws WHERE user_id = uid AND themes IS NOT NULL
             GROUP BY t ORDER BY cnt DESC LIMIT 8) sub),
      '[]'::jsonb
    ),
    'energy_history', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('date', draw_date, 'score', energy_score, 'card_id', card_id) ORDER BY draw_date)
       FROM (SELECT draw_date, energy_score, card_id
             FROM public.daily_draws WHERE user_id = uid
             ORDER BY draw_date DESC LIMIT 30) sub),
      '[]'::jsonb
    )
  ) INTO result
  FROM public.daily_draws WHERE user_id = uid;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;
