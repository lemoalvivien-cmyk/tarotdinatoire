
-- ═══════════════════════════════════════════════════════════════
-- Zero-Trust Daily Free Draw: daily_anonymous_draws
-- Server-side session_hash (sha256 of ip+ua+date), atomic increment
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.daily_anonymous_draws (
  session_hash   TEXT        NOT NULL,
  draw_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  draw_count     INTEGER     NOT NULL DEFAULT 0,
  last_draw      TIMESTAMPTZ NOT NULL DEFAULT now(),
  card_id        TEXT,
  orientation    TEXT        NOT NULL DEFAULT 'upright',
  interpretation JSONB,
  email          TEXT,
  PRIMARY KEY (session_hash, draw_date)
);

ALTER TABLE public.daily_anonymous_draws ENABLE ROW LEVEL SECURITY;

-- Service role only (Edge Function uses service key)
CREATE POLICY "Service role only insert" ON public.daily_anonymous_draws FOR INSERT TO PUBLIC WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role only select" ON public.daily_anonymous_draws FOR SELECT TO PUBLIC USING (auth.role() = 'service_role');
CREATE POLICY "Service role only update" ON public.daily_anonymous_draws FOR UPDATE TO PUBLIC USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role only delete" ON public.daily_anonymous_draws FOR DELETE TO PUBLIC USING (auth.role() = 'service_role');

-- Admin visibility
CREATE POLICY "Admins can view anonymous draws" ON public.daily_anonymous_draws FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_anon_draws_date ON public.daily_anonymous_draws (draw_date);
CREATE INDEX IF NOT EXISTS idx_anon_draws_hash ON public.daily_anonymous_draws (session_hash);
