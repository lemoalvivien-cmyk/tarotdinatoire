
-- =========================================================
-- PASSE A : RLS + Auth + Business Logic Fixes
-- =========================================================

-- FIX #11 (PAY-7): reading_sessions INSERT must verify subscription
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.reading_sessions;
CREATE POLICY "Users can insert their own sessions" ON public.reading_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.has_reading_credits(auth.uid()) = true
  );

-- FIX #11b (PAY-7): tarot_readings INSERT must verify subscription too
DROP POLICY IF EXISTS "Users can insert their own readings" ON public.tarot_readings;
CREATE POLICY "Users can insert their own readings" ON public.tarot_readings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.has_reading_credits(auth.uid()) = true
  );

-- FIX #6: bootstrap_first_admin reads profiles.email which no longer exists
-- Fixed to read directly from auth.users via SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(allowed_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_count integer;
  current_user_email text;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin already exists. Bootstrap not allowed.';
  END IF;
  
  -- Read email from auth.users directly (SECURITY DEFINER bypasses RLS on auth schema)
  SELECT email INTO current_user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'User email not found';
  END IF;
  
  IF LOWER(current_user_email) != LOWER(allowed_email) THEN
    RAISE EXCEPTION 'Email mismatch. Your email does not match the allowed email.';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  INSERT INTO public.admin_audit_logs (action, admin_user_id, target_id, target_type, metadata)
  VALUES (
    'bootstrap_first_admin',
    current_user_id,
    current_user_id::text,
    'user',
    jsonb_build_object('email', current_user_email)
  );
  
  RETURN true;
END;
$$;

-- Performance indexes for frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_created_at ON public.reading_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_user_id ON public.tarot_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_created_at ON public.tarot_readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_favorite ON public.tarot_readings(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily_user_day ON public.ai_usage_daily(user_id, day);
