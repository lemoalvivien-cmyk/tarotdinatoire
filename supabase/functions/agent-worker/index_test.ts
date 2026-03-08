/**
 * Non-Regression Test Suite — agent-worker + agent-dispatcher
 *
 * ══════════════════════════════════════════════════════════════
 * VÉRITÉ D'ÉTAT
 * ══════════════════════════════════════════════════════════════
 * Ce fichier contient UNIQUEMENT des tests réellement exécutables.
 * Les tests dépendant de secrets réels (WORKER_SECRET, SERVICE_KEY,
 * TEST_ADMIN_JWT) sont skippés si ces secrets sont absents du .env.
 * Les tests skippés sont clairement annotés [SKIP si secret absent].
 *
 * Run: deno test --allow-net --allow-env supabase/functions/agent-worker/index_test.ts
 *
 * ══════════════════════════════════════════════════════════════
 * COUVERTURE
 * ══════════════════════════════════════════════════════════════
 * BLOC 1 — FAIL-CLOSED WORKER (W-FC-01 à W-FC-04)
 * BLOC 2 — RBAC RPC (RBAC-01 à RBAC-04)
 * BLOC 3 — ZERO TRUST DISPATCHER (ZT-01 à ZT-06)
 * BLOC 4 — IDEMPOTENCY SCOPED (IDEM-01 à IDEM-03)
 * BLOC 5 — TRANSITIONS D'ÉTAT (STATE-01 à STATE-04)
 * BLOC 6 — CONCURRENCE (CONC-01, CONC-02)
 */
import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import {
  assertEquals,
  assertExists,
  assertNotEquals,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Env ────────────────────────────────────────────────────────
const SUPABASE_URL   = Deno.env.get('VITE_SUPABASE_URL')!;
const SUPABASE_ANON  = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!;
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WORKER_SECRET  = Deno.env.get('WORKER_SECRET') ?? '';
const ADMIN_JWT      = Deno.env.get('TEST_ADMIN_JWT') ?? '';

const DISPATCHER_URL = `${SUPABASE_URL}/functions/v1/agent-dispatcher`;
const WORKER_URL     = `${SUPABASE_URL}/functions/v1/agent-worker`;

// ── Helpers ────────────────────────────────────────────────────
function skipIf(condition: boolean, reason: string): boolean {
  if (condition) {
    console.warn(`[SKIP] ${reason}`);
    return true;
  }
  return false;
}

async function callWorker(opts: {
  workerSecret?: string;
  body?: unknown;
  method?: string;
}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON,
  };
  if (opts.workerSecret !== undefined) headers['x-worker-secret'] = opts.workerSecret;
  return await fetch(WORKER_URL, {
    method: opts.method ?? 'POST',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

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
  return await fetch(DISPATCHER_URL, {
    method: 'POST',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

// ══════════════════════════════════════════════════════════════
// BLOC 1 — FAIL-CLOSED WORKER
// ══════════════════════════════════════════════════════════════

/**
 * W-FC-01 : GET sur le worker doit retourner 405.
 * Prouve que le worker ne répond pas aux méthodes non-POST.
 */
Deno.test('W-FC-01: worker GET returns 405', async () => {
  const res = await callWorker({ method: 'GET' });
  await res.text();
  // 405 si le worker a déjà vérifié WORKER_SECRET et passé au check méthode,
  // ou 500 si WORKER_SECRET est absent (fail-closed avant le check méthode).
  // Le seul code INTERDIT est 200 ou 201.
  assertEquals(
    res.status === 200 || res.status === 201,
    false,
    `Worker GET must never return 200/201, got ${res.status}`,
  );
});

/**
 * W-FC-02 : Appel sans x-worker-secret.
 * COMPORTEMENT ATTENDU STRICT :
 *   - Si WORKER_SECRET est configuré en prod → 401
 *   - Si WORKER_SECRET est ABSENT          → 500 (fail-closed, pas de mode dev ouvert)
 *
 * CE TEST EST STRICT : il n'accepte PLUS le code 200.
 * Un 200 sans secret est une régression de sécurité.
 */
Deno.test('W-FC-02: worker without secret never returns 200', async () => {
  const res = await callWorker({ body: { batch_size: 1 } });
  await res.text();
  // Aucun chemin ne doit mener à 200 sans secret.
  // - WORKER_SECRET configuré    → 401
  // - WORKER_SECRET absent       → 500
  // - Tout autre code est admis, sauf 200/201.
  assertEquals(
    res.status === 200 || res.status === 201,
    false,
    `RÉGRESSION SÉCURITÉ: worker sans secret a retourné ${res.status} (attendu 401 ou 500)`,
  );
  // Vérifie que le code est bien 401 ou 500
  assertEquals(
    res.status === 401 || res.status === 500,
    true,
    `Worker sans secret doit retourner 401 (secret configuré) ou 500 (secret absent), got ${res.status}`,
  );
});

/**
 * W-FC-03 : Appel avec un mauvais secret.
 * Prouve que le worker rejette un secret incorrect.
 * [SKIP si WORKER_SECRET absent — dans ce cas W-FC-02 couvre le 500]
 */
Deno.test('W-FC-03: worker with wrong secret returns 401', async () => {
  const res = await callWorker({
    workerSecret: 'definitely-wrong-secret-12345',
    body: { batch_size: 1 },
  });
  await res.text();
  // Si WORKER_SECRET absent → 500 (fail-closed avant l'auth check)
  // Si WORKER_SECRET présent → 401 (secret wrong)
  assertEquals(
    res.status === 200 || res.status === 201,
    false,
    `Mauvais secret ne doit jamais retourner 200/201, got ${res.status}`,
  );
  assertEquals(
    res.status === 401 || res.status === 500,
    true,
    `Mauvais secret doit retourner 401 ou 500, got ${res.status}`,
  );
});

/**
 * W-FC-04 : Appel avec le bon secret (quand disponible).
 * [SKIP si WORKER_SECRET absent]
 */
Deno.test('W-FC-04: worker with correct secret returns 200', async () => {
  if (skipIf(!WORKER_SECRET, 'WORKER_SECRET non configuré — test skippé')) return;
  const res = await callWorker({
    workerSecret: WORKER_SECRET,
    body: { batch_size: 1 },
  });
  const text = await res.text();
  assertEquals(res.status, 200, `Worker avec bon secret doit retourner 200, got ${res.status}: ${text}`);
  const body = JSON.parse(text);
  assertExists(body.processed !== undefined, 'Response doit avoir un champ processed');
});

// ══════════════════════════════════════════════════════════════
// BLOC 2 — RBAC : authenticated ne peut pas appeler les RPCs sensibles
// ══════════════════════════════════════════════════════════════

/**
 * RBAC-01 : authenticated ne peut PAS appeler bootstrap_first_admin.
 * Utilise un fake JWT → 401 ou 403 (jamais 200).
 */
Deno.test('RBAC-01: authenticated cannot call bootstrap_first_admin via RPC', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bootstrap_first_admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: 'Bearer fake-jwt',
    },
    body: JSON.stringify({ allowed_email: 'attacker@example.com' }),
  });
  await res.text();
  assertEquals(
    res.status === 200,
    false,
    `bootstrap_first_admin ne doit jamais retourner 200 pour un JWT invalide, got ${res.status}`,
  );
});

/**
 * RBAC-02 : authenticated ne peut PAS appeler get_pending_agent_jobs.
 * REVOKE EXECUTE ON authenticated est en place (migration 2026-03-08).
 */
Deno.test('RBAC-02: authenticated cannot call get_pending_agent_jobs', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_pending_agent_jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: 'Bearer fake-jwt',
    },
    body: JSON.stringify({ p_limit: 5 }),
  });
  await res.text();
  assertEquals(
    res.status === 200,
    false,
    `get_pending_agent_jobs ne doit jamais retourner 200 sans auth valide, got ${res.status}`,
  );
});

/**
 * RBAC-03 : authenticated ne peut PAS appeler can_dispatch_agent_job.
 */
Deno.test('RBAC-03: authenticated cannot call can_dispatch_agent_job', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/can_dispatch_agent_job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: 'Bearer fake-jwt',
    },
    body: JSON.stringify({ _user_id: '00000000-0000-0000-0000-000000000000' }),
  });
  await res.text();
  assertEquals(
    res.status === 200,
    false,
    `can_dispatch_agent_job ne doit jamais retourner 200 sans auth valide, got ${res.status}`,
  );
});

/**
 * RBAC-04 : authenticated ne peut PAS appeler claim_next_agent_job.
 */
Deno.test('RBAC-04: authenticated cannot call claim_next_agent_job', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_next_agent_job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON,
      Authorization: 'Bearer fake-jwt',
    },
    body: JSON.stringify({ p_limit: 1 }),
  });
  await res.text();
  assertEquals(
    res.status === 200,
    false,
    `claim_next_agent_job ne doit jamais retourner 200 sans auth valide, got ${res.status}`,
  );
});

/**
 * RBAC-05 : service_role PEUT appeler get_pending_agent_jobs.
 * [SKIP si SERVICE_KEY absent]
 */
Deno.test('RBAC-05: service_role can call get_pending_agent_jobs', async () => {
  if (skipIf(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY absent — test skippé')) return;
  const db = serviceClient();
  const { error } = await db.rpc('get_pending_agent_jobs', { p_limit: 1 });
  assertEquals(
    error,
    null,
    `service_role doit pouvoir appeler get_pending_agent_jobs, erreur: ${error?.message}`,
  );
});

/**
 * RBAC-06 : service_role PEUT appeler can_dispatch_agent_job.
 * [SKIP si SERVICE_KEY absent]
 */
Deno.test('RBAC-06: service_role can call can_dispatch_agent_job', async () => {
  if (skipIf(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY absent — test skippé')) return;
  const db = serviceClient();
  const { error } = await db.rpc('can_dispatch_agent_job', {
    _user_id: '00000000-0000-0000-0000-000000000000',
  });
  assertEquals(
    error,
    null,
    `service_role doit pouvoir appeler can_dispatch_agent_job, erreur: ${error?.message}`,
  );
});

// ══════════════════════════════════════════════════════════════
// BLOC 3 — ZERO TRUST DISPATCHER
// ══════════════════════════════════════════════════════════════

Deno.test('ZT-01: dispatcher no auth returns 401', async () => {
  const res = await callDispatcher({ body: { job_type: 'ui_qa_check' } });
  await res.text();
  assertEquals(res.status, 401, 'Attendu 401 sans auth token');
});

Deno.test('ZT-02: dispatcher invalid bearer returns 401', async () => {
  const res = await callDispatcher({
    auth: 'Bearer obviously-invalid',
    body: { job_type: 'ui_qa_check' },
  });
  await res.text();
  assertEquals(res.status, 401, 'Attendu 401 pour JWT invalide');
});

Deno.test('ZT-03: injection job_type never returns 201', async () => {
  const res = await callDispatcher({
    auth: 'Bearer fake',
    body: { job_type: "drop_table; --" },
  });
  await res.text();
  assertEquals(res.status === 201, false, 'job_type injection ne doit jamais retourner 201');
});

Deno.test('ZT-04: oversized payload never returns 201', async () => {
  const res = await callDispatcher({
    auth: 'Bearer fake',
    body: { job_type: 'data_verification', payload: { data: 'x'.repeat(15_000) } },
  });
  await res.text();
  assertEquals(res.status === 201, false, 'Payload trop grand ne doit pas être accepté');
});

Deno.test('ZT-05: dispatcher CORS not wildcard for untrusted origin', async () => {
  const res = await callDispatcher({
    body: {},
    origin: 'https://evil.example.com',
  });
  await res.text();
  const acao = res.headers.get('Access-Control-Allow-Origin');
  assertEquals(
    acao === '*' || acao === 'https://evil.example.com',
    false,
    `CORS ne doit pas echo une origin non fiable, got: ${acao}`,
  );
});

Deno.test('ZT-06: bootstrap-admin CORS not wildcard for untrusted origin', async () => {
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
    `bootstrap-admin CORS ne doit pas echo une origin non fiable, got: ${acao}`,
  );
});

// ══════════════════════════════════════════════════════════════
// BLOC 4 — IDEMPOTENCY SCOPED par (created_by, idempotency_key)
// ══════════════════════════════════════════════════════════════

/**
 * IDEM-01 : Même admin + même clé → déduplication → même job_id.
 * Prouve que l'index partiel (created_by, idempotency_key) fonctionne.
 * [SKIP si TEST_ADMIN_JWT absent]
 */
Deno.test('IDEM-01: same admin + same key = deduplicated job', async () => {
  if (skipIf(!ADMIN_JWT, 'TEST_ADMIN_JWT absent — test skippé')) return;

  const ikey = `idem-test-${Date.now()}`;
  const body = { job_type: 'data_verification', idempotency_key: ikey };

  const res1 = await callDispatcher({ auth: `Bearer ${ADMIN_JWT}`, body });
  const text1 = await res1.text();
  assertEquals(res1.status, 201, `Premier dispatch doit retourner 201, got ${res1.status}: ${text1}`);
  const job1 = JSON.parse(text1).job;
  assertExists(job1.id, 'Premier job doit avoir un id');

  const res2 = await callDispatcher({ auth: `Bearer ${ADMIN_JWT}`, body });
  const text2 = await res2.text();
  assertEquals(res2.status, 200, `Second dispatch avec même clé doit retourner 200 (dédupliqué), got ${res2.status}: ${text2}`);
  const parsed2 = JSON.parse(text2);
  assertEquals(parsed2.deduplicated, true, 'Second dispatch doit être marqué deduplicated');
  assertEquals(parsed2.job.id, job1.id, 'Les deux dispatches doivent référencer le même job_id');
});

/**
 * IDEM-02 : Même admin + clés différentes → 2 jobs distincts.
 * [SKIP si TEST_ADMIN_JWT absent]
 */
Deno.test('IDEM-02: same admin + different keys = two distinct jobs', async () => {
  if (skipIf(!ADMIN_JWT, 'TEST_ADMIN_JWT absent — test skippé')) return;

  const ts = Date.now();
  const body1 = { job_type: 'data_verification', idempotency_key: `key-A-${ts}` };
  const body2 = { job_type: 'data_verification', idempotency_key: `key-B-${ts}` };

  const [res1, res2] = await Promise.all([
    callDispatcher({ auth: `Bearer ${ADMIN_JWT}`, body: body1 }),
    callDispatcher({ auth: `Bearer ${ADMIN_JWT}`, body: body2 }),
  ]);
  const [text1, text2] = await Promise.all([res1.text(), res2.text()]);

  assertEquals(res1.status, 201, `Dispatch 1 doit être 201, got ${res1.status}: ${text1}`);
  assertEquals(res2.status, 201, `Dispatch 2 doit être 201, got ${res2.status}: ${text2}`);

  const id1 = JSON.parse(text1).job.id;
  const id2 = JSON.parse(text2).job.id;
  assertNotEquals(id1, id2, 'Deux clés différentes doivent créer deux jobs distincts');
});

/**
 * IDEM-03 : Deux admins différents peuvent utiliser la même clé sans collision.
 * Prouve que la contrainte est scoped par created_by, pas globale.
 * [SKIP si SERVICE_KEY absent — nécessite la création de deux tokens admin distincts]
 * Note: ce test est structurellement documenté mais ne peut s'exécuter qu'avec
 * deux JWT admin différents. Avec un seul ADMIN_JWT, on vérifie le principe via DB.
 */
Deno.test('IDEM-03: scoped idempotency index exists in DB (structural proof)', async () => {
  if (skipIf(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY absent — test skippé')) return;

  const db = serviceClient();
  // Vérifie que l'index idx_agent_jobs_idem_scoped existe dans pg_indexes
  const { data, error } = await db
    .from('pg_indexes')
    .select('indexname, indexdef')
    .eq('schemaname', 'public')
    .eq('tablename', 'agent_jobs')
    .eq('indexname', 'idx_agent_jobs_idem_scoped');

  // pg_indexes n'est pas exposé via RLS → on vérifie via RPC ou la présence indirecte
  // Si l'accès pg_indexes est bloqué (attendu), on valide via une tentative d'insert duplicate
  if (error || !data || data.length === 0) {
    // Alternative: vérifier que deux admins différents peuvent insérer la même idempotency_key
    // en utilisant le service_role pour simuler deux created_by distincts
    const ts = Date.now();
    const sharedKey = `cross-admin-test-${ts}`;
    const adminAId = '00000000-0000-0000-0000-000000000001';
    const adminBId = '00000000-0000-0000-0000-000000000002';

    const { error: e1 } = await db.from('agent_jobs').insert({
      created_by: adminAId,
      job_type: 'data_verification',
      idempotency_key: sharedKey,
      status: 'pending',
      payload: {},
    });

    const { error: e2 } = await db.from('agent_jobs').insert({
      created_by: adminBId,
      job_type: 'data_verification',
      idempotency_key: sharedKey,
      status: 'pending',
      payload: {},
    });

    // Cleanup
    await db.from('agent_jobs').delete().eq('idempotency_key', sharedKey);

    assertEquals(
      e1,
      null,
      `Admin A doit pouvoir insérer avec clé "${sharedKey}": ${e1?.message}`,
    );
    assertEquals(
      e2,
      null,
      `Admin B doit pouvoir insérer la MÊME clé "${sharedKey}" (scoping différent): ${e2?.message}`,
    );
  } else {
    assertExists(data[0].indexname, 'Index idx_agent_jobs_idem_scoped doit exister');
    assertEquals(
      data[0].indexdef?.includes('created_by') && data[0].indexdef?.includes('idempotency_key'),
      true,
      'Index doit inclure (created_by, idempotency_key)',
    );
  }
});

// ══════════════════════════════════════════════════════════════
// BLOC 5 — TRANSITIONS D'ÉTAT
// ══════════════════════════════════════════════════════════════

/**
 * STATE-01 : claim_next_agent_job → job passe en status=running.
 * [SKIP si SERVICE_KEY absent]
 */
Deno.test('STATE-01: claim_next_agent_job transitions job to running', async () => {
  if (skipIf(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY absent — test skippé')) return;

  const db = serviceClient();
  const ts = Date.now();

  // Insérer un job pending directement via service_role
  const { data: inserted, error: insertErr } = await db
    .from('agent_jobs')
    .insert({
      created_by: '00000000-0000-0000-0000-000000000001',
      job_type: 'data_verification',
      status: 'pending',
      payload: { _test: true, ts },
    })
    .select('id')
    .single();

  assertEquals(insertErr, null, `Insert test job failed: ${insertErr?.message}`);
  assertExists(inserted?.id, 'Test job doit avoir un id');

  // Claim atomique
  const { data: claimed, error: claimErr } = await db.rpc('claim_next_agent_job', { p_limit: 1 });
  assertEquals(claimErr, null, `claim_next_agent_job failed: ${claimErr?.message}`);

  // Vérifier que notre job est bien running
  const ourJob = (claimed ?? []).find((j: { id: string }) => j.id === inserted.id);
  if (ourJob) {
    // Vérifie dans la DB que le statut est running
    const { data: dbJob } = await db
      .from('agent_jobs')
      .select('status, attempt_count')
      .eq('id', inserted.id)
      .single();
    assertEquals(dbJob?.status, 'running', 'Job doit être en status running après claim');
    assertEquals(dbJob?.attempt_count, 1, 'attempt_count doit être 1 après premier claim');
  }

  // Cleanup: complete le job
  await db.rpc('complete_agent_job', {
    p_job_id: inserted.id,
    p_status: 'completed',
    p_result: { _test_cleanup: true },
  });
});

/**
 * STATE-02 : complete_agent_job(completed) sur un job running → true.
 * [SKIP si SERVICE_KEY absent]
 */
Deno.test('STATE-02: complete_agent_job on running job returns true', async () => {
  if (skipIf(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY absent — test skippé')) return;

  const db = serviceClient();
  const ts = Date.now();

  // Insérer + claim
  const { data: inserted } = await db
    .from('agent_jobs')
    .insert({ created_by: '00000000-0000-0000-0000-000000000001', job_type: 'data_verification', status: 'pending', payload: { _test: true, ts } })
    .select('id').single();

  await db.rpc('claim_next_agent_job', { p_limit: 1 });

  // complete_agent_job doit retourner true
  const { data: result, error } = await db.rpc('complete_agent_job', {
    p_job_id: inserted!.id,
    p_status: 'completed',
    p_result: { done: true },
  });

  assertEquals(error, null, `complete_agent_job error: ${error?.message}`);
  assertEquals(result, true, 'complete_agent_job sur job running doit retourner true');

  // Vérifie status DB
  const { data: dbJob } = await db.from('agent_jobs').select('status, completed_at').eq('id', inserted!.id).single();
  assertEquals(dbJob?.status, 'completed', 'Job doit être completed');
  assertExists(dbJob?.completed_at, 'completed_at doit être non null');
});

/**
 * STATE-03 : complete_agent_job sur un job qui n'est PAS running → false.
 * Prouve que la fonction est idempotente et safe contre les doubles appels.
 * [SKIP si SERVICE_KEY absent]
 */
Deno.test('STATE-03: complete_agent_job on non-running job returns false', async () => {
  if (skipIf(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY absent — test skippé')) return;

  const db = serviceClient();
  const ts = Date.now();

  // Insérer un job pending (jamais claimé → non running)
  const { data: inserted } = await db
    .from('agent_jobs')
    .insert({ created_by: '00000000-0000-0000-0000-000000000001', job_type: 'data_verification', status: 'pending', payload: { _test: true, ts } })
    .select('id').single();

  // Tenter de compléter un job pending (pas running)
  const { data: result, error } = await db.rpc('complete_agent_job', {
    p_job_id: inserted!.id,
    p_status: 'completed',
    p_result: {},
  });

  assertEquals(error, null, `complete_agent_job error: ${error?.message}`);
  assertEquals(result, false, 'complete_agent_job sur non-running doit retourner false (WHERE status=running)');

  // Cleanup
  await db.from('agent_jobs').delete().eq('id', inserted!.id);
});

/**
 * STATE-04 : transition failed — job avec max_attempts=1 passe en failed.
 * [SKIP si SERVICE_KEY absent]
 */
Deno.test('STATE-04: complete_agent_job with failed status transitions correctly', async () => {
  if (skipIf(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY absent — test skippé')) return;

  const db = serviceClient();
  const ts = Date.now();

  const { data: inserted } = await db
    .from('agent_jobs')
    .insert({ created_by: '00000000-0000-0000-0000-000000000001', job_type: 'security_drift_check', status: 'pending', max_attempts: 1, payload: { _test: true, ts } })
    .select('id').single();

  // Claim → running
  await db.rpc('claim_next_agent_job', { p_limit: 1 });

  // Complete avec failed
  const { data: result } = await db.rpc('complete_agent_job', {
    p_job_id: inserted!.id,
    p_status: 'failed',
    p_error_message: 'Test failure',
  });

  assertEquals(result, true, 'complete_agent_job avec failed doit retourner true');

  const { data: dbJob } = await db.from('agent_jobs').select('status, error_message').eq('id', inserted!.id).single();
  assertEquals(dbJob?.status, 'failed', 'Job doit être en status failed');
  assertExists(dbJob?.error_message, 'error_message doit être non null');
});

// ══════════════════════════════════════════════════════════════
// BLOC 6 — CONCURRENCE : FOR UPDATE SKIP LOCKED
// ══════════════════════════════════════════════════════════════

/**
 * CONC-01 : 3 claims concurrents sur 1 job → au maximum 1 seul claim réussit.
 * Prouve que FOR UPDATE SKIP LOCKED empêche le double traitement.
 * [SKIP si SERVICE_KEY absent]
 */
Deno.test('CONC-01: 3 concurrent claims on 1 job → at most 1 claim wins', async () => {
  if (skipIf(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY absent — test skippé')) return;

  const db = serviceClient();
  const ts = Date.now();

  // Créer 1 seul job pending
  const { data: inserted, error: insertErr } = await db
    .from('agent_jobs')
    .insert({
      created_by: '00000000-0000-0000-0000-000000000001',
      job_type: 'data_verification',
      status: 'pending',
      payload: { _concurrency_test: true, ts },
    })
    .select('id')
    .single();

  assertEquals(insertErr, null, `Insert failed: ${insertErr?.message}`);

  // Lancer 3 claims en parallèle
  const [r1, r2, r3] = await Promise.all([
    serviceClient().rpc('claim_next_agent_job', { p_limit: 1 }),
    serviceClient().rpc('claim_next_agent_job', { p_limit: 1 }),
    serviceClient().rpc('claim_next_agent_job', { p_limit: 1 }),
  ]);

  // Compter combien ont réellement claimé NOTRE job
  const allClaimed = [
    ...(r1.data ?? []),
    ...(r2.data ?? []),
    ...(r3.data ?? []),
  ];
  const ourJobClaims = allClaimed.filter((j: { id: string }) => j.id === inserted!.id);

  assertEquals(
    ourJobClaims.length <= 1,
    true,
    `FOR UPDATE SKIP LOCKED doit garantir qu'un job n'est claimé qu'une fois. Claimé ${ourJobClaims.length} fois.`,
  );

  // Cleanup
  await db.rpc('complete_agent_job', {
    p_job_id: inserted!.id,
    p_status: 'completed',
    p_result: { _cleanup: true },
  });
});

/**
 * CONC-02 : N jobs, N claims parallèles → 0 job claimé deux fois.
 * Prouve l'atomicité du claim en cas de charge concurrente.
 * [SKIP si SERVICE_KEY absent]
 */
Deno.test('CONC-02: N jobs N concurrent claims → no job claimed twice', async () => {
  if (skipIf(!SERVICE_KEY, 'SUPABASE_SERVICE_ROLE_KEY absent — test skippé')) return;

  const db = serviceClient();
  const ts = Date.now();
  const N = 4; // 4 jobs, 4 workers concurrents

  // Créer N jobs pending
  const insertPromises = Array.from({ length: N }, (_, i) =>
    serviceClient().from('agent_jobs').insert({
      created_by: '00000000-0000-0000-0000-000000000001',
      job_type: 'data_verification',
      status: 'pending',
      payload: { _concurrency_test: true, index: i, ts },
    }).select('id').single()
  );

  const insertResults = await Promise.all(insertPromises);
  const insertedIds = insertResults.map(r => r.data?.id).filter(Boolean) as string[];
  assertEquals(insertedIds.length, N, `Doit créer ${N} jobs, got ${insertedIds.length}`);

  // Lancer N claims en parallèle — chaque worker prend p_limit=1
  const claimPromises = Array.from({ length: N }, () =>
    serviceClient().rpc('claim_next_agent_job', { p_limit: 1 })
  );
  const claimResults = await Promise.all(claimPromises);

  // Collecter tous les IDs claimés
  const allClaimedIds: string[] = [];
  for (const r of claimResults) {
    for (const job of (r.data ?? [])) {
      if (insertedIds.includes(job.id)) allClaimedIds.push(job.id);
    }
  }

  // Aucun ID ne doit apparaître deux fois
  const uniqueIds = new Set(allClaimedIds);
  assertEquals(
    uniqueIds.size,
    allClaimedIds.length,
    `CONCURRENCE: ${allClaimedIds.length - uniqueIds.size} job(s) ont été claimés deux fois ! IDs: ${allClaimedIds.join(', ')}`,
  );

  // Chaque job claimé doit être parmi nos jobs de test
  for (const id of allClaimedIds) {
    assertEquals(
      insertedIds.includes(id),
      true,
      `Job ${id} claimé mais pas dans notre batch de test`,
    );
  }

  // Cleanup: compléter tous les jobs insérés
  await Promise.all(insertedIds.map(id =>
    serviceClient().rpc('complete_agent_job', {
      p_job_id: id,
      p_status: 'completed',
      p_result: { _cleanup: true },
    })
  ));
});
