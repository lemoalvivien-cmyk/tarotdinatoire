
-- Table pour les tirages gratuits anonymes (1/jour par session/IP)
CREATE TABLE IF NOT EXISTS public.daily_free_draws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key TEXT NOT NULL,
  card_id TEXT NOT NULL,
  orientation TEXT NOT NULL DEFAULT 'upright',
  interpretation JSONB,
  email TEXT,
  draw_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_free_draws_session_date ON public.daily_free_draws(session_key, draw_date);
CREATE INDEX IF NOT EXISTS idx_daily_free_draws_date ON public.daily_free_draws(draw_date);

ALTER TABLE public.daily_free_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert free draws" ON public.daily_free_draws
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read free draws" ON public.daily_free_draws
  FOR SELECT USING (true);

CREATE POLICY "Admins can delete free draws" ON public.daily_free_draws
  FOR DELETE USING (public.is_admin(auth.uid()));
