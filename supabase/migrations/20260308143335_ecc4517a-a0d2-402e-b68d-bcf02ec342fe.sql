
-- ══════════════════════════════════════════════════════════════
-- BLOC 1: REVOKE/GRANT — Restrict SECURITY DEFINER functions
-- ══════════════════════════════════════════════════════════════

-- bootstrap_first_admin: should NOT be callable by authenticated users directly
-- Only service_role should invoke it (via edge function)
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin(text) FROM public;

-- get_pending_agent_jobs: only service_role (worker) should call this
REVOKE EXECUTE ON FUNCTION public.get_pending_agent_jobs(integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pending_agent_jobs(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_pending_agent_jobs(integer) FROM public;

-- can_dispatch_agent_job: only service_role (dispatcher edge fn) should call this
REVOKE EXECUTE ON FUNCTION public.can_dispatch_agent_job(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_dispatch_agent_job(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_dispatch_agent_job(uuid) FROM public;

-- ══════════════════════════════════════════════════════════════
-- BLOC 3: ATOMIC CLAIM FUNCTION — FOR UPDATE SKIP LOCKED
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.claim_next_agent_job(p_limit integer DEFAULT 1)
RETURNS TABLE(
  id uuid,
  job_type agent_job_type,
  payload jsonb,
  attempt_count integer,
  max_attempts integer,
  timeout_seconds integer,
  priority integer,
  created_by uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH candidate AS (
    SELECT j.id
    FROM public.agent_jobs j
    WHERE j.status = 'pending'
      AND j.attempt_count < j.max_attempts
      AND j.expires_at > now()
    ORDER BY j.priority ASC, j.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.agent_jobs aj
  SET
    status = 'running',
    started_at = now(),
    attempt_count = aj.attempt_count + 1,
    updated_at = now()
  FROM candidate c
  WHERE aj.id = c.id
  RETURNING
    aj.id, aj.job_type, aj.payload, aj.attempt_count,
    aj.max_attempts, aj.timeout_seconds, aj.priority,
    aj.created_by, aj.created_at;
END;
$$;

-- Only service_role can call claim_next_agent_job
REVOKE EXECUTE ON FUNCTION public.claim_next_agent_job(integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_next_agent_job(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_next_agent_job(integer) FROM public;

-- ══════════════════════════════════════════════════════════════
-- BLOC 3b: COMPLETE JOB FUNCTION — atomically finalize a job
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.complete_agent_job(
  p_job_id uuid,
  p_status agent_job_status,
  p_result jsonb DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated boolean;
BEGIN
  -- Only allow terminal transitions from 'running'
  IF p_status NOT IN ('completed', 'failed', 'timeout') THEN
    RAISE EXCEPTION 'Invalid terminal status: %', p_status;
  END IF;

  UPDATE public.agent_jobs
  SET
    status = p_status,
    result = COALESCE(p_result, result),
    error_message = COALESCE(p_error_message, error_message),
    completed_at = now(),
    updated_at = now()
  WHERE id = p_job_id
    AND status = 'running';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Only service_role can call complete_agent_job
REVOKE EXECUTE ON FUNCTION public.complete_agent_job(uuid, agent_job_status, jsonb, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_agent_job(uuid, agent_job_status, jsonb, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_agent_job(uuid, agent_job_status, jsonb, text) FROM public;
