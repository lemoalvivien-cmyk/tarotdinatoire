
-- ═══════════════════════════════════════════════════════════
-- GAMIFICATION: user_karma + user_achievements
-- ═══════════════════════════════════════════════════════════

-- Karma table: one row per user
CREATE TABLE public.user_karma (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE,
  xp                integer NOT NULL DEFAULT 0,
  level             integer NOT NULL DEFAULT 1,
  level_name        text NOT NULL DEFAULT 'Chercheur',
  streak            integer NOT NULL DEFAULT 0,
  longest_streak    integer NOT NULL DEFAULT 0,
  total_readings    integer NOT NULL DEFAULT 0,
  total_daily_draws integer NOT NULL DEFAULT 0,
  total_journals    integer NOT NULL DEFAULT 0,
  total_shares      integer NOT NULL DEFAULT 0,
  last_action_at    timestamp with time zone,
  created_at        timestamp with time zone NOT NULL DEFAULT now(),
  updated_at        timestamp with time zone NOT NULL DEFAULT now()
);

-- Achievements table: one row per achievement earned per user
CREATE TABLE public.user_achievements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  achievement_key text NOT NULL,
  xp_reward       integer NOT NULL DEFAULT 0,
  earned_at       timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);

-- Indexes
CREATE INDEX idx_user_karma_user_id         ON public.user_karma (user_id);
CREATE INDEX idx_user_achievements_user_id  ON public.user_achievements (user_id);

-- RLS
ALTER TABLE public.user_karma        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- user_karma policies
CREATE POLICY "Users can view own karma"
  ON public.user_karma FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own karma"
  ON public.user_karma FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own karma"
  ON public.user_karma FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own karma"
  ON public.user_karma FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all karma"
  ON public.user_karma FOR SELECT USING (public.is_admin(auth.uid()));

-- user_achievements policies
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements"
  ON public.user_achievements FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all achievements"
  ON public.user_achievements FOR SELECT USING (public.is_admin(auth.uid()));

-- Timestamp trigger
CREATE TRIGGER update_user_karma_updated_at
  BEFORE UPDATE ON public.user_karma
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- LEVEL COMPUTATION FUNCTION
-- Chercheur 0-49 | Initié 50-199 | Mystique 200-499 | Oracle 500+
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.compute_karma_level(p_xp integer)
RETURNS TABLE(level integer, level_name text, xp_this_level integer, xp_next_level integer, progress_pct integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_xp < 50 THEN
    RETURN QUERY SELECT 1, 'Chercheur'::text, p_xp, 50, LEAST(ROUND((p_xp::numeric / 50) * 100)::integer, 100);
  ELSIF p_xp < 200 THEN
    RETURN QUERY SELECT 2, 'Initié'::text, (p_xp - 50), 150, LEAST(ROUND(((p_xp - 50)::numeric / 150) * 100)::integer, 100);
  ELSIF p_xp < 500 THEN
    RETURN QUERY SELECT 3, 'Mystique'::text, (p_xp - 200), 300, LEAST(ROUND(((p_xp - 200)::numeric / 300) * 100)::integer, 100);
  ELSE
    RETURN QUERY SELECT 4, 'Oracle'::text, (p_xp - 500), 0, 100;
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- AWARD KARMA — callable via supabase.rpc()
-- Returns JSON with xp_gained, new totals, new achievements
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.award_karma(p_uid uuid, p_action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp_gain     integer;
  v_karma       public.user_karma%ROWTYPE;
  v_new_xp      integer;
  v_level_info  RECORD;
  v_new_achs    text[] := '{}';
  v_ach_bonus   integer := 0;
BEGIN
  -- XP per action
  v_xp_gain := CASE p_action
    WHEN 'daily_draw'        THEN 10
    WHEN 'streak_bonus'      THEN 5
    WHEN 'reading_session'   THEN 15
    WHEN 'celtic_cross'      THEN 25
    WHEN 'life_path'         THEN 25
    WHEN 'journal_entry'     THEN 5
    WHEN 'share'             THEN 10
    WHEN 'favorite'          THEN 3
    ELSE 5
  END;

  -- Upsert karma row
  INSERT INTO public.user_karma (user_id, xp, last_action_at)
  VALUES (p_uid, v_xp_gain, now())
  ON CONFLICT (user_id) DO UPDATE SET
    xp                = user_karma.xp + v_xp_gain,
    total_readings    = CASE WHEN p_action = 'reading_session' THEN user_karma.total_readings + 1 ELSE user_karma.total_readings END,
    total_daily_draws = CASE WHEN p_action = 'daily_draw'      THEN user_karma.total_daily_draws + 1 ELSE user_karma.total_daily_draws END,
    total_journals    = CASE WHEN p_action = 'journal_entry'   THEN user_karma.total_journals + 1 ELSE user_karma.total_journals END,
    total_shares      = CASE WHEN p_action = 'share'           THEN user_karma.total_shares + 1 ELSE user_karma.total_shares END,
    last_action_at    = now(),
    updated_at        = now();

  SELECT * INTO v_karma FROM public.user_karma WHERE user_id = p_uid;
  v_new_xp := v_karma.xp;

  -- Check & award achievements
  -- Premier tirage
  IF v_karma.total_daily_draws = 1 THEN
    INSERT INTO public.user_achievements (user_id, achievement_key, xp_reward)
    VALUES (p_uid, 'first_draw', 20) ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achs := array_append(v_new_achs, 'first_draw'); v_ach_bonus := v_ach_bonus + 20; END IF;
  END IF;

  -- Série de 7 jours
  IF v_karma.streak >= 7 THEN
    INSERT INTO public.user_achievements (user_id, achievement_key, xp_reward)
    VALUES (p_uid, 'week_streak', 50) ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achs := array_append(v_new_achs, 'week_streak'); v_ach_bonus := v_ach_bonus + 50; END IF;
  END IF;

  -- Série de 30 jours
  IF v_karma.streak >= 30 THEN
    INSERT INTO public.user_achievements (user_id, achievement_key, xp_reward)
    VALUES (p_uid, 'month_streak', 150) ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achs := array_append(v_new_achs, 'month_streak'); v_ach_bonus := v_ach_bonus + 150; END IF;
  END IF;

  -- 10 tirages
  IF v_karma.total_readings = 10 THEN
    INSERT INTO public.user_achievements (user_id, achievement_key, xp_reward)
    VALUES (p_uid, 'ten_readings', 50) ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achs := array_append(v_new_achs, 'ten_readings'); v_ach_bonus := v_ach_bonus + 50; END IF;
  END IF;

  -- 50 tirages
  IF v_karma.total_readings = 50 THEN
    INSERT INTO public.user_achievements (user_id, achievement_key, xp_reward)
    VALUES (p_uid, 'fifty_readings', 200) ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achs := array_append(v_new_achs, 'fifty_readings'); v_ach_bonus := v_ach_bonus + 200; END IF;
  END IF;

  -- 5 entrées de journal
  IF v_karma.total_journals = 5 THEN
    INSERT INTO public.user_achievements (user_id, achievement_key, xp_reward)
    VALUES (p_uid, 'five_journals', 30) ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achs := array_append(v_new_achs, 'five_journals'); v_ach_bonus := v_ach_bonus + 30; END IF;
  END IF;

  -- Premier partage
  IF v_karma.total_shares = 1 THEN
    INSERT INTO public.user_achievements (user_id, achievement_key, xp_reward)
    VALUES (p_uid, 'first_share', 25) ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achs := array_append(v_new_achs, 'first_share'); v_ach_bonus := v_ach_bonus + 25; END IF;
  END IF;

  -- Celtic Cross ou Life Path
  IF p_action IN ('celtic_cross', 'life_path') THEN
    INSERT INTO public.user_achievements (user_id, achievement_key, xp_reward)
    VALUES (p_uid, 'deep_reader', 75) ON CONFLICT DO NOTHING;
    IF FOUND THEN v_new_achs := array_append(v_new_achs, 'deep_reader'); v_ach_bonus := v_ach_bonus + 75; END IF;
  END IF;

  -- Apply bonus XP from achievements
  IF v_ach_bonus > 0 THEN
    UPDATE public.user_karma SET xp = xp + v_ach_bonus, updated_at = now() WHERE user_id = p_uid;
    v_new_xp := v_new_xp + v_ach_bonus;
  END IF;

  -- Compute level
  SELECT * INTO v_level_info FROM public.compute_karma_level(v_new_xp);

  -- Update level if changed
  IF v_level_info.level != v_karma.level OR v_level_info.level_name != v_karma.level_name THEN
    UPDATE public.user_karma
    SET level = v_level_info.level, level_name = v_level_info.level_name, updated_at = now()
    WHERE user_id = p_uid;
  END IF;

  RETURN jsonb_build_object(
    'xp_gained',         v_xp_gain + v_ach_bonus,
    'total_xp',          v_new_xp,
    'level',             v_level_info.level,
    'level_name',        v_level_info.level_name,
    'progress_pct',      v_level_info.progress_pct,
    'xp_next_level',     v_level_info.xp_next_level,
    'new_achievements',  to_jsonb(v_new_achs)
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- GET FULL KARMA PROFILE
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_karma_profile(p_uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_karma      public.user_karma%ROWTYPE;
  v_level_info RECORD;
  v_achs       jsonb;
BEGIN
  SELECT * INTO v_karma FROM public.user_karma WHERE user_id = p_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'xp', 0, 'level', 1, 'level_name', 'Chercheur',
      'progress_pct', 0, 'xp_next_level', 50,
      'streak', 0, 'longest_streak', 0,
      'total_readings', 0, 'total_daily_draws', 0,
      'total_journals', 0, 'total_shares', 0,
      'achievements', '[]'::jsonb
    );
  END IF;

  SELECT * INTO v_level_info FROM public.compute_karma_level(v_karma.xp);

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'key', achievement_key,
      'earned_at', earned_at,
      'xp_reward', xp_reward
    ) ORDER BY earned_at
  ), '[]'::jsonb) INTO v_achs
  FROM public.user_achievements WHERE user_id = p_uid;

  RETURN jsonb_build_object(
    'xp',              v_karma.xp,
    'level',           v_level_info.level,
    'level_name',      v_level_info.level_name,
    'progress_pct',    v_level_info.progress_pct,
    'xp_next_level',   v_level_info.xp_next_level,
    'xp_this_level',   v_level_info.xp_this_level,
    'streak',          v_karma.streak,
    'longest_streak',  v_karma.longest_streak,
    'total_readings',  v_karma.total_readings,
    'total_daily_draws', v_karma.total_daily_draws,
    'total_journals',  v_karma.total_journals,
    'total_shares',    v_karma.total_shares,
    'achievements',    v_achs
  );
END;
$$;
