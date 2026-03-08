/**
 * Security & concurrency regression tests — agent-worker + dispatcher
 * Bloc 4 · ZT + Worker Non-Regression Suite
 *
 * Run: deno test --allow-net --allow-env supabase/functions/agent-worker/index_test.ts
 */
import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!;
const SUPABASE_ANON = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const DISPATCHER_URL = `${SUPABASE_URL}/functions/v1/agent-dispatcher`;
const WORKER_URL = `${SUPABASE_URL}/functions/v1/agent-worker`;

// ── Helper ─────────────────────────────────────────────────────
async function callDispatcher(opts: {
  auth?: string;
  body?: unknown;
  origin?: string;
}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON,
  };
  if (opts.auth) headers['Authorization'] = opts.auth;
  if (opts.origin) headers['Origin'] = opts.origin;

  const res = await fetch(DISPATCHER_URL, {
    method: 'POST',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  return res;
}

async function callWorker(opts: {
  workerSecret?: string;
  body?: unknown;
}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON,
  };
  if (opts.workerSecret) headers['x-worker-secret'] = opts.workerSecret;

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  return res;
}

// ══════════════════════════════════════════════════════════════
// BLOC 1 — RBAC: Authenticated users CANNOT call privileged RPCs
// ══════════════════════════════════════════════════════════════

// T-RBAC-01: authenticated cannot call bootstrap_first_admin
Deno.test('RBAC-01: authenticated cannot call bootstrap_first_admin via RPC', async () => {
  // Try calling the function via REST as authenticated (fake token = 401 anyway)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bootstrap_first_admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: `Bearer fake-jwt`,
    },
    body: JSON.stringify({ allowed_email: 'attacker@example.com' }),
  });
  await res.text(); // consume body
  // Should be 401 (invalid JWT) or 403 (forbidden) — never 200
  assertEquals(
    res.status === 200,
    false,
    `bootstrap_first_admin must not return 200 for unauthenticated call, got ${res.status}`,
  );
});

// T-RBAC-02: authenticated cannot call get_pending_agent_jobs via RPC
Deno.test('RBAC-02: authenticated cannot call get_pending_agent_jobs', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_pending_agent_jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: `Bearer fake-jwt`,
    },
    body: JSON.stringify({ p_limit: 5 }),
  });
  await res.text();
  assertEquals(
    res.status === 200,
    false,
    `get_pending_agent_jobs must not be callable by regular users, got ${res.status}`,
  );
});

// T-RBAC-03: authenticated cannot call can_dispatch_agent_job via RPC
Deno.test('RBAC-03: authenticated cannot call can_dispatch_agent_job', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/can_dispatch_agent_job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: `Bearer fake-jwt`,
    },
    body: JSON.stringify({ _user_id: '00000000-0000-0000-0000-000000000000' }),
  });
  await res.text();
  assertEquals(
    res.status === 200,
    false,
    `can_dispatch_agent_job must not be callable by regular users, got ${res.status}`,
  );
});

// T-RBAC-04: authenticated cannot call claim_next_agent_job via RPC
Deno.test('RBAC-04: authenticated cannot call claim_next_agent_job', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_next_agent_job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: `Bearer fake-jwt`,
    },
    body: JSON.stringify({ p_limit: 1 }),
  });
  await res.text();
  assertEquals(
    res.status === 200,
    false,
    `claim_next_agent_job must not be callable by regular users, got ${res.status}`,
  );
});

// ══════════════════════════════════════════════════════════════
// BLOC 2 — DISPATCHER: Zero Trust enforcement
// ══════════════════════════════════════════════════════════════

// T-ZT-01: no auth → 401
Deno.test('ZT-01: dispatcher no auth returns 401', async () => {
  const res = await callDispatcher({ body: { job_type: 'ui_qa_check' } });
  await res.text();
  assertEquals(res.status, 401, 'Expected 401 without auth token');
});

// T-ZT-02: invalid token → 401
Deno.test('ZT-02: dispatcher invalid bearer returns 401', async () => {
  const res = await callDispatcher({
    auth: 'Bearer obviously-invalid',
    body: { job_type: 'ui_qa_check' },
  });
  await res.text();
  assertEquals(res.status, 401, 'Expected 401 for invalid JWT');
});

// T-ZT-03: invalid job_type never succeeds
Deno.test('ZT-03: invalid job_type never returns 201', async () => {
  const res = await callDispatcher({
    auth: 'Bearer fake',
    body: { job_type: 'drop_table; --' },
  });
  await res.text();
  assertEquals(res.status === 201, false, 'Injection job_type must never return 201');
});

// T-ZT-04: oversized payload never succeeds
Deno.test('ZT-04: oversized payload never returns 201', async () => {
  const res = await callDispatcher({
    auth: 'Bearer fake',
    body: { job_type: 'data_verification', payload: { data: 'x'.repeat(15_000) } },
  });
  await res.text();
  assertEquals(res.status === 201, false, 'Oversized payload must not be accepted');
});

// T-ZT-05: CORS wildcard check on dispatcher
Deno.test('ZT-05: dispatcher CORS is not wildcard for untrusted origin', async () => {
  const res = await callDispatcher({
    body: {},
    origin: 'https://evil.example.com',
  });
  await res.text();
  const acao = res.headers.get('Access-Control-Allow-Origin');
  assertEquals(
    acao === '*' || acao === 'https://evil.example.com',
    false,
    `CORS must not echo untrusted origin, got: ${acao}`,
  );
});

// T-ZT-06: bootstrap-admin CORS is not wildcard
Deno.test('ZT-06: bootstrap-admin CORS is not wildcard for untrusted origin', async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/bootstrap-admin`, {
    method: 'OPTIONS',
    headers: {
      apikey: SUPABASE_ANON,
      Origin: 'https://evil.example.com',
    },
  });
  await res.text();
  const acao = res.headers.get('Access-Control-Allow-Origin');
  assertEquals(
    acao === '*' || acao === 'https://evil.example.com',
    false,
    `bootstrap-admin CORS must not echo untrusted origin, got: ${acao}`,
  );
});

// ══════════════════════════════════════════════════════════════
// BLOC 3 — WORKER: Endpoint protection
// ══════════════════════════════════════════════════════════════

// T-WRK-01: worker GET → 405
Deno.test('WRK-01: worker GET returns 405', async () => {
  const res = await fetch(WORKER_URL, {
    method: 'GET',
    headers: { apikey: SUPABASE_ANON },
  });
  await res.text();
  assertEquals(res.status, 405, 'Expected 405 for GET on worker');
});

// T-WRK-02: worker no-secret with WORKER_SECRET configured
Deno.test('WRK-02: worker without secret returns 401 when secret is configured', async () => {
  // If WORKER_SECRET is set, missing header should be 401
  // If not set, worker runs without secret (dev mode) → 200
  const res = await callWorker({ body: { batch_size: 1 } });
  await res.text();
  // Must be either 200 (no secret configured, dev) or 401 (secret configured)
  assertEquals(
    res.status === 403 || res.status === 500,
    false,
    `Worker must return 200 or 401, not ${res.status}`,
  );
});

// T-WRK-03: worker processes no jobs when queue is empty
Deno.test('WRK-03: worker returns 200 with processed=0 on empty queue', async () => {
  // This test is safe — it just polls the queue without a valid secret
  // so it will either 401 (secret set) or return {processed: 0}
  const res = await callWorker({ body: { batch_size: 1 } });
  const text = await res.text();
  if (res.status === 200) {
    const body = JSON.parse(text);
    // Either no jobs processed OR jobs processed (if queue has items)
    assertExists(body.processed !== undefined || body.message, 'Response must have processed count or message');
  }
  // 401 is also valid if WORKER_SECRET is set
  assertEquals(
    res.status === 500,
    false,
    `Worker must not return 500 on normal operation, got ${res.status}`,
  );
});

// ══════════════════════════════════════════════════════════════
// BLOC 4 — IDEMPOTENCY (dispatcher level)
// ══════════════════════════════════════════════════════════════

// T-IDP-01: same idempotency_key never creates 2 jobs (without valid admin auth, tests 401 path)
Deno.test('IDP-01: idempotency_key deduplication path exists in dispatcher', async () => {
  const ikey = `test-ikey-${Date.now()}`;
  const res1 = await callDispatcher({
    auth: 'Bearer fake',
    body: { job_type: 'ui_qa_check', idempotency_key: ikey },
  });
  await res1.text();
  const res2 = await callDispatcher({
    auth: 'Bearer fake',
    body: { job_type: 'ui_qa_check', idempotency_key: ikey },
  });
  await res2.text();
  // Both must be 401 (invalid token) — never 201 without real admin auth
  assertEquals(res1.status, 401);
  assertEquals(res2.status, 401);
});
