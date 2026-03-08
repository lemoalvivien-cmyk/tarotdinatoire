
-- ══════════════════════════════════════════════════════════════
-- BLOC 4 · OPENCLAW INTEGRATION — agent_jobs async queue
-- Architecture: Zero Trust, fail-closed, full audit trail
-- ══════════════════════════════════════════════════════════════

-- 1. Enum for job types (strict allowlist)
DO $$ BEGIN
  CREATE TYPE public.agent_job_type AS ENUM (
    'ui_qa_check',
    'content_synthesis',
    'data_verification',
    'admin_assist_review',
    'security_drift_check'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Enum for job status
DO $$ BEGIN
  CREATE TYPE public.agent_job_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'timeout',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Main agent_jobs table
CREATE TABLE IF NOT EXISTS public.agent_jobs (
  id               UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by       UUID    NOT NULL,
  job_type         public.agent_job_type NOT NULL,
  status           public.agent_job_status NOT NULL DEFAULT 'pending',
  payload          JSONB   NOT NULL DEFAULT '{}',
  result           JSONB   NULL,
  error_message    TEXT    NULL,
  attempt_count    INTEGER NOT NULL DEFAULT 0,
  max_attempts     INTEGER NOT NULL DEFAULT 3,
  timeout_seconds  INTEGER NOT NULL DEFAULT 60,
  priority         INTEGER NOT NULL DEFAULT 5,
  idempotency_key  TEXT    NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at       TIMESTAMPTZ NULL,
  completed_at     TIMESTAMPTZ NULL,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  CONSTRAINT priority_range CHECK (priority BETWEEN 1 AND 10),
  CONSTRAINT idempotency_key_unique UNIQUE (idempotency_key)
);

-- 4. Indexes for dispatcher polling performance
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status_priority
  ON public.agent_jobs (status, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_created_by
  ON public.agent_jobs (created_by);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_job_type
  ON public.agent_jobs (job_type);

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_agent_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_jobs_updated_at ON public.agent_jobs;
CREATE TRIGGER trg_agent_jobs_updated_at
  BEFORE UPDATE ON public.agent_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_agent_jobs_updated_at();

-- 6. Row Level Security — fail-closed (deny-by-default)
ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all jobs"
  ON public.agent_jobs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert jobs"
  ON public.agent_jobs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Admins can update jobs"
  ON public.agent_jobs FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Jobs immutable no deletes"
  ON public.agent_jobs FOR DELETE
  USING (false);

-- 7. RBAC helper — can user dispatch a job?
CREATE OR REPLACE FUNCTION public.can_dispatch_agent_job(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id);
$$;

-- 8. Safe polling function for the dispatcher (service-role context)
CREATE OR REPLACE FUNCTION public.get_pending_agent_jobs(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  job_type public.agent_job_type,
  payload JSONB,
  attempt_count INTEGER,
  max_attempts INTEGER,
  timeout_seconds INTEGER,
  priority INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    j.id, j.job_type, j.payload, j.attempt_count,
    j.max_attempts, j.timeout_seconds, j.priority,
    j.created_by, j.created_at
  FROM public.agent_jobs j
  WHERE j.status = 'pending'
    AND j.attempt_count < j.max_attempts
    AND j.expires_at > now()
  ORDER BY j.priority ASC, j.created_at ASC
  LIMIT p_limit;
$$;
