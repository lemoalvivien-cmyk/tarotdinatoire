
CREATE TABLE public.shared_readings (
  id            uuid      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id      text      NOT NULL UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  user_id       uuid      NOT NULL,
  draw_id       uuid      REFERENCES public.daily_draws(id) ON DELETE CASCADE,
  reading_id    uuid      REFERENCES public.tarot_readings(id) ON DELETE CASCADE,
  card_id       text      NOT NULL,
  card_name_fr  text      NOT NULL DEFAULT '',
  orientation   text      NOT NULL DEFAULT 'upright',
  interp_title  text,
  interp_summary text,
  image_url     text,
  visit_count   integer   NOT NULL DEFAULT 0,
  signup_count  integer   NOT NULL DEFAULT 0,
  referral_code text      UNIQUE DEFAULT substr(md5(gen_random_uuid()::text), 1, 8),
  created_at    timestamp with time zone NOT NULL DEFAULT now(),
  expires_at    timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE INDEX idx_shared_readings_share_id ON public.shared_readings(share_id);
CREATE INDEX idx_shared_readings_user_id  ON public.shared_readings(user_id);
CREATE INDEX idx_shared_readings_referral ON public.shared_readings(referral_code);

ALTER TABLE public.shared_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read non-expired shares"
  ON public.shared_readings FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Users can create own shares"
  ON public.shared_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares"
  ON public.shared_readings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can update share counters"
  ON public.shared_readings FOR UPDATE
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by text;
