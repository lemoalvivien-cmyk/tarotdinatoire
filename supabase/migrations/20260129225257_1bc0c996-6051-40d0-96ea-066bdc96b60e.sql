-- ═══════════════════════════════════════════════════════════════
-- FIX RLS POLICIES FOR analytics_events AND consent_logs
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- ANALYTICS_EVENTS: Remove permissive INSERT policy
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can log events" ON public.analytics_events;

-- Add strict INSERT policy: only authenticated users can insert their own events
CREATE POLICY "Authenticated users can insert own events"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    event_name IN (
      'page_view', 'reading_start', 'shuffle', 'cut', 'select_card',
      'validate', 'result_view', 'email_submit', 'email_unsub',
      'auth_signup', 'auth_login', 'consent_accept', 'consent_reject'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- CONSENT_LOGS: Remove permissive INSERT policy
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can log consent" ON public.consent_logs;

-- Add strict INSERT policy: only authenticated users can log their own consent
CREATE POLICY "Authenticated users can log own consent"
  ON public.consent_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Also allow anon users to log consent (required for cookie banner)
-- but validate that user_id is NULL for anon users
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "Anonymous users can log consent with null user_id"
  ON public.consent_logs FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- ─────────────────────────────────────────────────────────────
-- Also allow anon users to insert analytics (for page_view before login)
-- but validate specific events only
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "Anonymous users can log limited events"
  ON public.analytics_events FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL AND
    event_name IN ('page_view', 'consent_accept', 'consent_reject')
  );