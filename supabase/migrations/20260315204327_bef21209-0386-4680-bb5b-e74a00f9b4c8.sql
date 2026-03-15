-- ============================================================
-- MIGRATION: Unify reading models (20260316_unify_readings)
-- 1. Extend reading_sessions (is_favorite, user_notes, origin_id)
-- 2. Migrate tarot_readings data → reading_sessions + reading_results
-- 3. Performance indexes
-- 4. Fix RLS: UPDATE/DELETE for reading_sessions and reading_results
-- ============================================================

-- ─── 1. Extend reading_sessions ────────────────────────────────────────────
ALTER TABLE public.reading_sessions
  ADD COLUMN IF NOT EXISTS is_favorite  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_notes   TEXT,
  ADD COLUMN IF NOT EXISTS origin_id    UUID;

-- ─── 2. RLS: allow users to UPDATE their own sessions (needed for fav/notes)
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.reading_sessions;
CREATE POLICY "Users can update their own sessions"
  ON public.reading_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 3. Migrate tarot_readings → reading_sessions + reading_results ─────────
-- Idempotent: skip already-migrated rows via origin_id
DO $$
DECLARE
  r RECORD;
  new_session_id UUID;
BEGIN
  FOR r IN
    SELECT * FROM public.tarot_readings
    WHERE id NOT IN (
      SELECT origin_id FROM public.reading_sessions WHERE origin_id IS NOT NULL
    )
  LOOP
    INSERT INTO public.reading_sessions (
      id, user_id, spread_id, question, selected_cards,
      created_at, is_favorite, user_notes, origin_id
    ) VALUES (
      gen_random_uuid(),
      r.user_id,
      COALESCE(r.spread_id, 'one_card'),
      r.question,
      COALESCE(r.cards, '[]'::jsonb),
      r.created_at,
      COALESCE(r.is_favorite, false),
      r.user_notes,
      r.id
    )
    RETURNING id INTO new_session_id;

    IF r.ai_interpretation IS NOT NULL THEN
      INSERT INTO public.reading_results (session_id, interpretation, created_at)
      VALUES (new_session_id, r.ai_interpretation, r.created_at)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ─── 4. Performance indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_created
  ON public.reading_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_favorite
  ON public.reading_sessions (user_id, is_favorite)
  WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_reading_sessions_origin
  ON public.reading_sessions (origin_id)
  WHERE origin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reading_results_session
  ON public.reading_results (session_id);

-- ─── 5. RLS: UPDATE + DELETE for reading_results ─────────────────────────
DROP POLICY IF EXISTS "Users can update their own results" ON public.reading_results;
CREATE POLICY "Users can update their own results"
  ON public.reading_results
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.reading_sessions rs
    WHERE rs.id = reading_results.session_id AND rs.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.reading_sessions rs
    WHERE rs.id = reading_results.session_id AND rs.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete their own results" ON public.reading_results;
CREATE POLICY "Users can delete their own results"
  ON public.reading_results
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.reading_sessions rs
    WHERE rs.id = reading_results.session_id AND rs.user_id = auth.uid()
  ));