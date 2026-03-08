-- ══════════════════════════════════════════════════════════
-- MIGRATION: GRANT/REVOKE RPC + fix complete_agent_job ROW_COUNT
-- ══════════════════════════════════════════════════════════

-- 1. REVOKE sur toutes les RPCs sensibles
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin(text)           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_dispatch_agent_job(uuid)          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pending_agent_jobs(integer)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_next_agent_job(integer)         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_agent_job(uuid, agent_job_status, jsonb, text) FROM PUBLIC, anon, authenticated;

-- 2. GRANT EXECUTE explicite a service_role
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(text)            TO service_role;
GRANT EXECUTE ON FUNCTION public.can_dispatch_agent_job(uuid)           TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_agent_jobs(integer)        TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_next_agent_job(integer)          TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_agent_job(uuid, agent_job_status, jsonb, text) TO service_role;

-- 3. CORRECTION complete_agent_job: v_updated boolean -> integer (ROW_COUNT = bigint/integer)
CREATE OR REPLACE FUNCTION public.complete_agent_job(
  p_job_id        uuid,
  p_status        agent_job_status,
  p_result        jsonb    DEFAULT NULL,
  p_error_message text     DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_rows_updated integer := 0;
BEGIN
  IF p_status NOT IN ('completed', 'failed', 'timeout') THEN
    RAISE EXCEPTION 'Invalid terminal status: %. Allowed: completed, failed, timeout', p_status;
  END IF;

  UPDATE public.agent_jobs
  SET
    status        = p_status,
    result        = COALESCE(p_result,        result),
    error_message = COALESCE(p_error_message, error_message),
    completed_at  = now(),
    updated_at    = now()
  WHERE id     = p_job_id
    AND status = 'running';

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated > 0;
END;
$$;

-- Re-appliquer apres remplacement
REVOKE EXECUTE ON FUNCTION public.complete_agent_job(uuid, agent_job_status, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.complete_agent_job(uuid, agent_job_status, jsonb, text) TO service_role;