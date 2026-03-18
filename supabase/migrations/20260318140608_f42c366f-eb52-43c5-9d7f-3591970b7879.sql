
-- ══════════════════════════════════════════════════════════════════════════════
-- RISK #1: Auth Rate Limiting Table + RPC
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash       text        NOT NULL,
  email_hash    text        NOT NULL,
  attempts      integer     NOT NULL DEFAULT 1,
  first_attempt timestamptz NOT NULL DEFAULT now(),
  last_attempt  timestamptz NOT NULL DEFAULT now(),
  locked_until  timestamptz          DEFAULT NULL,
  UNIQUE (ip_hash, email_hash)
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_lookup
  ON public.auth_rate_limits (ip_hash, email_hash, last_attempt);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only — rate limits"
  ON public.auth_rate_limits
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.check_auth_rate_limit(
  p_ip_hash    text,
  p_email_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec   public.auth_rate_limits%ROWTYPE;
  v_now   timestamptz := now();
  v_window_start timestamptz := v_now - interval '5 minutes';
BEGIN
  SELECT * INTO v_rec
  FROM public.auth_rate_limits
  WHERE ip_hash = p_ip_hash AND email_hash = p_email_hash;

  IF NOT FOUND THEN
    INSERT INTO public.auth_rate_limits (ip_hash, email_hash, attempts)
    VALUES (p_ip_hash, p_email_hash, 1)
    ON CONFLICT (ip_hash, email_hash) DO UPDATE
      SET attempts = 1, first_attempt = v_now, last_attempt = v_now, locked_until = NULL;
    RETURN jsonb_build_object('allowed', true, 'locked_until', null, 'attempts', 1);
  END IF;

  IF v_rec.locked_until IS NOT NULL AND v_rec.locked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'locked_until', v_rec.locked_until,
      'attempts', v_rec.attempts
    );
  END IF;

  IF v_rec.first_attempt < v_window_start THEN
    UPDATE public.auth_rate_limits
    SET attempts = 1, first_attempt = v_now, last_attempt = v_now, locked_until = NULL
    WHERE ip_hash = p_ip_hash AND email_hash = p_email_hash;
    RETURN jsonb_build_object('allowed', true, 'locked_until', null, 'attempts', 1);
  END IF;

  UPDATE public.auth_rate_limits
  SET
    attempts     = v_rec.attempts + 1,
    last_attempt = v_now,
    locked_until = CASE
      WHEN v_rec.attempts + 1 >= 15 THEN v_now + interval '2 hours'
      WHEN v_rec.attempts + 1 >= 10 THEN v_now + interval '30 minutes'
      WHEN v_rec.attempts + 1 >= 5  THEN v_now + interval '5 minutes'
      ELSE NULL
    END
  WHERE ip_hash = p_ip_hash AND email_hash = p_email_hash
  RETURNING * INTO v_rec;

  RETURN jsonb_build_object(
    'allowed',       v_rec.locked_until IS NULL OR v_rec.locked_until <= v_now,
    'locked_until',  v_rec.locked_until,
    'attempts',      v_rec.attempts
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_auth_rate_limit(text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_auth_rate_limit(text, text) TO service_role;

-- ══════════════════════════════════════════════════════════════════════════════
-- RISK #3: daily_free_draws — Column-level SELECT revocation + safe view
-- ══════════════════════════════════════════════════════════════════════════════
REVOKE SELECT ON public.daily_free_draws FROM anon, authenticated;
GRANT  SELECT (id, draw_date, created_at, session_key, card_id, orientation, interpretation)
  ON public.daily_free_draws TO anon, authenticated;

CREATE OR REPLACE VIEW public.daily_free_draws_safe AS
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

CREATE OR REPLACE FUNCTION public.cleanup_auth_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.auth_rate_limits
  WHERE last_attempt < now() - interval '24 hours';
$$;
