
-- ══════════════════════════════════════════════════════════════════
-- SPRINT 2 : BLINDAGE CYBERSÉCURITÉ — MIGRATION COMPLÈTE
-- ══════════════════════════════════════════════════════════════════

-- ── 1. CONVERT ALL PERMISSIVE-INTENT POLICIES FROM RESTRICTIVE TO PERMISSIVE ──
-- PostgreSQL: RESTRICTIVE policies without any PERMISSIVE policy = 0 rows visible.
-- All "granting" policies must be PERMISSIVE. Only "constraint" policies are RESTRICTIVE.

-- Drop & recreate SELECT/INSERT/UPDATE/DELETE grant policies as PERMISSIVE

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- tarot_cards (public read)
DROP POLICY IF EXISTS "Anyone can view tarot cards" ON public.tarot_cards;
CREATE POLICY "Anyone can view tarot cards" ON public.tarot_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert tarot cards" ON public.tarot_cards;
CREATE POLICY "Admins can insert tarot cards" ON public.tarot_cards FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update tarot cards" ON public.tarot_cards;
CREATE POLICY "Admins can update tarot cards" ON public.tarot_cards FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete tarot cards" ON public.tarot_cards;
CREATE POLICY "Admins can delete tarot cards" ON public.tarot_cards FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- tarot_spreads (public read)
DROP POLICY IF EXISTS "Anyone can view spreads" ON public.tarot_spreads;
CREATE POLICY "Anyone can view spreads" ON public.tarot_spreads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert spreads" ON public.tarot_spreads;
CREATE POLICY "Admins can insert spreads" ON public.tarot_spreads FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update spreads" ON public.tarot_spreads;
CREATE POLICY "Admins can update spreads" ON public.tarot_spreads FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete spreads" ON public.tarot_spreads;
CREATE POLICY "Admins can delete spreads" ON public.tarot_spreads FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- daily_draws
DROP POLICY IF EXISTS "Users can view own daily draws" ON public.daily_draws;
CREATE POLICY "Users can view own daily draws" ON public.daily_draws FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily draws" ON public.daily_draws;
CREATE POLICY "Users can insert own daily draws" ON public.daily_draws FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily draws" ON public.daily_draws;
CREATE POLICY "Users can update own daily draws" ON public.daily_draws FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own daily draws" ON public.daily_draws;
CREATE POLICY "Users can delete own daily draws" ON public.daily_draws FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all daily draws" ON public.daily_draws;
CREATE POLICY "Admins can view all daily draws" ON public.daily_draws FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- tarot_readings
DROP POLICY IF EXISTS "Users can view their own readings" ON public.tarot_readings;
CREATE POLICY "Users can view their own readings" ON public.tarot_readings FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own readings" ON public.tarot_readings;
CREATE POLICY "Users can insert their own readings" ON public.tarot_readings FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (public.has_reading_credits(auth.uid()) = true));

DROP POLICY IF EXISTS "Users can update their own readings" ON public.tarot_readings;
CREATE POLICY "Users can update their own readings" ON public.tarot_readings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own readings" ON public.tarot_readings;
CREATE POLICY "Users can delete their own readings" ON public.tarot_readings FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all readings" ON public.tarot_readings;
CREATE POLICY "Admins can view all readings" ON public.tarot_readings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- reading_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.reading_sessions;
CREATE POLICY "Users can view their own sessions" ON public.reading_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.reading_sessions;
CREATE POLICY "Users can insert their own sessions" ON public.reading_sessions FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (public.has_reading_credits(auth.uid()) = true));

DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.reading_sessions;
CREATE POLICY "Users can delete their own sessions" ON public.reading_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- reading_results
DROP POLICY IF EXISTS "Users can view their own results" ON public.reading_results;
CREATE POLICY "Users can view their own results" ON public.reading_results FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.reading_sessions WHERE id = reading_results.session_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own results" ON public.reading_results;
CREATE POLICY "Users can insert their own results" ON public.reading_results FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.reading_sessions WHERE id = reading_results.session_id AND user_id = auth.uid())
);

-- subscriptions
DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
CREATE POLICY "Users can read own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete own subscription" ON public.subscriptions;
CREATE POLICY "Users can delete own subscription" ON public.subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── 2. FIX CRITICAL: Remove user UPDATE on subscriptions (privilege escalation) ──
-- Users must NOT be able to set plan/status/credits directly.
DROP POLICY IF EXISTS "Users can update own subscription credits" ON public.subscriptions;
-- Only service_role and admins can update subscriptions (via Edge Functions)
-- No user-facing UPDATE policy on subscriptions.

-- ── 3. FIX WARN: Block direct INSERT/UPDATE on user_karma (XP manipulation) ──
DROP POLICY IF EXISTS "Users can insert own karma" ON public.user_karma;
DROP POLICY IF EXISTS "Users can update own karma" ON public.user_karma;
-- Karma is managed exclusively via award_karma() SECURITY DEFINER function
-- Keep: SELECT and DELETE for data portability (GDPR)
DROP POLICY IF EXISTS "Users can view own karma" ON public.user_karma;
CREATE POLICY "Users can view own karma" ON public.user_karma FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own karma" ON public.user_karma;
CREATE POLICY "Users can delete own karma" ON public.user_karma FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all karma" ON public.user_karma;
CREATE POLICY "Admins can view all karma" ON public.user_karma FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ── 4. FIX WARN: Block direct INSERT on user_achievements (self-award XP) ──
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
-- Achievements are granted exclusively via award_karma() SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own achievements" ON public.user_achievements;
CREATE POLICY "Users can delete own achievements" ON public.user_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all achievements" ON public.user_achievements;
CREATE POLICY "Admins can view all achievements" ON public.user_achievements FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ── 5. Remaining tables — convert to PERMISSIVE ──

-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- user_embeddings
DROP POLICY IF EXISTS "Users can view own embeddings" ON public.user_embeddings;
CREATE POLICY "Users can view own embeddings" ON public.user_embeddings FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own embeddings" ON public.user_embeddings;
CREATE POLICY "Users can delete own embeddings" ON public.user_embeddings FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert embeddings" ON public.user_embeddings;
CREATE POLICY "Service role can insert embeddings" ON public.user_embeddings FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update embeddings" ON public.user_embeddings;
CREATE POLICY "Service role can update embeddings" ON public.user_embeddings FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can view all embeddings" ON public.user_embeddings;
CREATE POLICY "Admins can view all embeddings" ON public.user_embeddings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- shared_readings
DROP POLICY IF EXISTS "Anyone can read non-expired shares" ON public.shared_readings;
CREATE POLICY "Anyone can read non-expired shares" ON public.shared_readings FOR SELECT USING (expires_at > now());

DROP POLICY IF EXISTS "Users can create own shares" ON public.shared_readings;
CREATE POLICY "Users can create own shares" ON public.shared_readings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shares" ON public.shared_readings;
CREATE POLICY "Users can delete own shares" ON public.shared_readings FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can update share counters" ON public.shared_readings;
CREATE POLICY "Service role can update share counters" ON public.shared_readings FOR UPDATE USING ((auth.role() = 'service_role') OR (auth.uid() = user_id)) WITH CHECK ((auth.role() = 'service_role') OR (auth.uid() = user_id));

-- narrative_memories
DROP POLICY IF EXISTS "Users can view own narratives" ON public.narrative_memories;
CREATE POLICY "Users can view own narratives" ON public.narrative_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own narratives" ON public.narrative_memories;
CREATE POLICY "Users can delete own narratives" ON public.narrative_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all narratives" ON public.narrative_memories;
CREATE POLICY "Admins can view all narratives" ON public.narrative_memories FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- synchronicity_insights
DROP POLICY IF EXISTS "Users can view own synchronicity" ON public.synchronicity_insights;
CREATE POLICY "Users can view own synchronicity" ON public.synchronicity_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth users can insert own synchronicity" ON public.synchronicity_insights;
CREATE POLICY "Auth users can insert own synchronicity" ON public.synchronicity_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth users can update own synchronicity" ON public.synchronicity_insights;
CREATE POLICY "Auth users can update own synchronicity" ON public.synchronicity_insights FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own synchronicity" ON public.synchronicity_insights;
CREATE POLICY "Users can delete own synchronicity" ON public.synchronicity_insights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ai_usage_daily (read-only for users, managed by service_role)
DROP POLICY IF EXISTS "Users can view their own usage" ON public.ai_usage_daily;
CREATE POLICY "Users can view their own usage" ON public.ai_usage_daily FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ai_usage" ON public.ai_usage_daily;
CREATE POLICY "Users can delete their own ai_usage" ON public.ai_usage_daily FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all usage" ON public.ai_usage_daily;
CREATE POLICY "Admins can view all usage" ON public.ai_usage_daily FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- email_leads
DROP POLICY IF EXISTS "Anyone can insert leads with consent" ON public.email_leads;
CREATE POLICY "Anyone can insert leads with consent" ON public.email_leads FOR INSERT WITH CHECK (consent = true);

DROP POLICY IF EXISTS "Users can view their own leads" ON public.email_leads;
CREATE POLICY "Users can view their own leads" ON public.email_leads FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own leads" ON public.email_leads;
CREATE POLICY "Users can update their own leads" ON public.email_leads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own leads" ON public.email_leads;
CREATE POLICY "Users can delete their own leads" ON public.email_leads FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all leads" ON public.email_leads;
CREATE POLICY "Admins can view all leads" ON public.email_leads FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all leads" ON public.email_leads;
CREATE POLICY "Admins can update all leads" ON public.email_leads FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- analytics_events
DROP POLICY IF EXISTS "Authenticated users can insert own events" ON public.analytics_events;
CREATE POLICY "Authenticated users can insert own events" ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (
  (auth.uid() = user_id) AND (event_name = ANY (ARRAY['page_view','reading_start','shuffle','cut','select_card','validate','result_view','email_submit','email_unsub','auth_signup','auth_login','consent_accept','consent_reject']))
);

DROP POLICY IF EXISTS "Anonymous users can log limited events" ON public.analytics_events;
CREATE POLICY "Anonymous users can log limited events" ON public.analytics_events FOR INSERT WITH CHECK (
  (user_id IS NULL) AND (event_name = ANY (ARRAY['page_view','consent_accept','consent_reject']))
);

DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics_events;
CREATE POLICY "Users can view their own analytics" ON public.analytics_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own analytics" ON public.analytics_events;
CREATE POLICY "Users can delete their own analytics" ON public.analytics_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all events" ON public.analytics_events;
CREATE POLICY "Admins can view all events" ON public.analytics_events FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- consent_logs
DROP POLICY IF EXISTS "Authenticated users can log own consent" ON public.consent_logs;
CREATE POLICY "Authenticated users can log own consent" ON public.consent_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anonymous users can log consent with null user_id" ON public.consent_logs;
CREATE POLICY "Anonymous users can log consent with null user_id" ON public.consent_logs FOR INSERT WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own consent" ON public.consent_logs;
CREATE POLICY "Users can view own consent" ON public.consent_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own consent" ON public.consent_logs;
CREATE POLICY "Users can delete their own consent" ON public.consent_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all consent" ON public.consent_logs;
CREATE POLICY "Admins can view all consent" ON public.consent_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- admin_audit_logs
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- agent_jobs
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.agent_jobs;
CREATE POLICY "Admins can view all jobs" ON public.agent_jobs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert jobs" ON public.agent_jobs;
CREATE POLICY "Admins can insert jobs" ON public.agent_jobs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update jobs" ON public.agent_jobs;
CREATE POLICY "Admins can update jobs" ON public.agent_jobs FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ai_prompt_templates
DROP POLICY IF EXISTS "Admins can view prompts" ON public.ai_prompt_templates;
CREATE POLICY "Admins can view prompts" ON public.ai_prompt_templates FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert prompts" ON public.ai_prompt_templates;
CREATE POLICY "Admins can insert prompts" ON public.ai_prompt_templates FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update prompts" ON public.ai_prompt_templates;
CREATE POLICY "Admins can update prompts" ON public.ai_prompt_templates FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete prompts" ON public.ai_prompt_templates;
CREATE POLICY "Admins can delete prompts" ON public.ai_prompt_templates FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- feature_flags
DROP POLICY IF EXISTS "Admins can view feature flags" ON public.feature_flags;
CREATE POLICY "Admins can view feature flags" ON public.feature_flags FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update feature flags" ON public.feature_flags;
CREATE POLICY "Admins can update feature flags" ON public.feature_flags FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- promo_codes
DROP POLICY IF EXISTS "Admins full access promo_codes" ON public.promo_codes;
CREATE POLICY "Admins full access promo_codes" ON public.promo_codes FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ── 6. Ensure award_karma and user_karma service-role insert allowed ──
-- award_karma() is SECURITY DEFINER — it runs as owner (postgres/service).
-- user_karma needs a service_role insert path for the UPSERT in award_karma.
CREATE POLICY "Service role full access karma" ON public.user_karma FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access achievements" ON public.user_achievements FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
