import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ══════════════════════════════════════════════════════════════
// ZERO TRUST CORS ALLOWLIST
// Jamais de wildcard '*' sur une fonction authentifiée.
// ══════════════════════════════════════════════════════════════
const ALLOWED_ORIGINS = [
  'https://tarotdinatoire.fr',
  'https://www.tarotdinatoire.fr',
  'https://tarotdinatoire.lovable.app',
  'https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ══════════════════════════════════════════════════════════════
// JOB TYPE ALLOWLIST
// ══════════════════════════════════════════════════════════════
const ALLOWED_JOB_TYPES = [
  'ui_qa_check',
  'content_synthesis',
  'data_verification',
  'admin_assist_review',
  'security_drift_check',
] as const;
type JobType = (typeof ALLOWED_JOB_TYPES)[number];

const JOB_TIMEOUTS: Record<JobType, number> = {
  ui_qa_check: 30,
  content_synthesis: 90,
  data_verification: 60,
  admin_assist_review: 45,
  security_drift_check: 120,
};

const JOB_MAX_ATTEMPTS: Record<JobType, number> = {
  ui_qa_check: 2,
  content_synthesis: 3,
  data_verification: 3,
  admin_assist_review: 2,
  security_drift_check: 1, // fail-closed, no retry on security checks
};

// ══════════════════════════════════════════════════════════════
// DISPATCHER — main handler
// ══════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }

  try {
    // ── Auth: require Bearer token ───────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Validate caller identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // RBAC: only admins can dispatch jobs (server-side check via service_role)
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await adminClient
      .rpc('can_dispatch_agent_job', { _user_id: user.id });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin role required' }),
        { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // ── Parse + validate body ────────────────────────────────
    let body: {
      job_type?: string;
      payload?: Record<string, unknown>;
      priority?: number;
      idempotency_key?: string;
    };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    const { job_type, payload = {}, priority = 5, idempotency_key } = body;

    if (!job_type || !ALLOWED_JOB_TYPES.includes(job_type as JobType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid job_type', allowed: ALLOWED_JOB_TYPES }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    const validatedType = job_type as JobType;

    if (typeof priority !== 'number' || priority < 1 || priority > 10) {
      return new Response(
        JSON.stringify({ error: 'priority must be integer 1–10' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > 10_000) {
      return new Response(
        JSON.stringify({ error: 'payload too large (max 10 KB)' }),
        { status: 413, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // ── Insert job ───────────────────────────────────────────
    const jobData = {
      created_by:      user.id,
      job_type:        validatedType,
      status:          'pending',
      payload,
      priority,
      timeout_seconds: JOB_TIMEOUTS[validatedType],
      max_attempts:    JOB_MAX_ATTEMPTS[validatedType],
      idempotency_key: idempotency_key ?? null,
    };

    const { data: job, error: insertError } = await adminClient
      .from('agent_jobs')
      .insert(jobData)
      .select('id, status, job_type, created_at, expires_at')
      .single();

    if (insertError) {
      // 23505 = unique_violation → idempotency conflict (scoped per created_by)
      if (insertError.code === '23505') {
        const { data: existing } = await adminClient
          .from('agent_jobs')
          .select('id, status, job_type, created_at')
          .eq('idempotency_key', idempotency_key!)
          .eq('created_by', user.id) // scope: même admin uniquement
          .single();
        return new Response(
          JSON.stringify({ deduplicated: true, job: existing }),
          { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({ error: 'Failed to create job' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // ── Audit log ────────────────────────────────────────────
    await adminClient.from('admin_audit_logs').insert({
      action:        'agent_job_dispatched',
      admin_user_id: user.id,
      target_id:     job.id,
      target_type:   'agent_job',
      metadata: {
        job_type:     validatedType,
        priority,
        payload_size: payloadSize,
      },
    });

    return new Response(
      JSON.stringify({ success: true, job }),
      { status: 201, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    // Log type uniquement, jamais le message (peut contenir des données utilisateur)
    const errType = err instanceof Error ? err.constructor.name : typeof err;
    return new Response(
      JSON.stringify({ error: 'Internal server error', type: errType }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }
});
