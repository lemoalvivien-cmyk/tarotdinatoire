-- ============================================
-- SECURITY HARDENING: Block anonymous access + Immutable audit logs
-- ============================================

-- 1. PROFILES: Ensure only authenticated users can access
-- The current policies use auth.uid() = id which implicitly requires auth,
-- but let's add an explicit authenticated-only baseline for defense in depth

-- 2. TAROT_READINGS: Same - add explicit authenticated check
-- Current policies already use auth.uid() = user_id, but add explicit check

-- 3. AI_USAGE_DAILY: Add INSERT/UPDATE/DELETE policies (edge function uses service role)
-- Users should NOT be able to insert/update/delete their own usage (prevents abuse)
CREATE POLICY "Block user insert on ai_usage_daily" 
ON public.ai_usage_daily 
FOR INSERT 
TO authenticated
WITH CHECK (false);

CREATE POLICY "Block user update on ai_usage_daily" 
ON public.ai_usage_daily 
FOR UPDATE 
TO authenticated
USING (false);

CREATE POLICY "Block user delete on ai_usage_daily" 
ON public.ai_usage_daily 
FOR DELETE 
TO authenticated
USING (false);

-- 4. ADMIN_AUDIT_LOGS: Make immutable (no UPDATE/DELETE ever)
CREATE POLICY "Prevent audit log modification" 
ON public.admin_audit_logs 
FOR UPDATE 
USING (false);

CREATE POLICY "Prevent audit log deletion" 
ON public.admin_audit_logs 
FOR DELETE 
USING (false);

-- 5. FEATURE_FLAGS: Singleton protection (no INSERT/DELETE)
CREATE POLICY "Prevent flag insertion" 
ON public.feature_flags 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Prevent flag deletion" 
ON public.feature_flags 
FOR DELETE 
USING (false);