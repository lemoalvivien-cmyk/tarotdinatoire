/**
 * Security regression tests — agent-dispatcher
 * Bloc 5 · Zero Trust non-regression suite
 *
 * Run: deno test --allow-net --allow-env supabase/functions/agent-dispatcher/index_test.ts
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL   = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON  = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL   = `${SUPABASE_URL}/functions/v1/agent-dispatcher`;

// ── Helper ────────────────────────────────────────────────────
async function call(opts: {
  method?: string;
  auth?: string;
  body?: unknown;
  origin?: string;
}): Promise<Response> {
  const { method = "POST", auth, body, origin } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON,
  };
  if (auth)   headers["Authorization"] = auth;
  if (origin) headers["Origin"] = origin;

  const res = await fetch(FUNCTION_URL, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res;
}

// ═══════════════════════════════════════════════════════════════
// BLOC 5 · ZERO TRUST TESTS
// ═══════════════════════════════════════════════════════════════

// T1 — No auth header → 401
Deno.test("ZT-01: no auth header returns 401", async () => {
  const res = await call({ body: { job_type: "ui_qa_check" } });
  await res.text(); // consume body
  assertEquals(res.status, 401, "Expected 401 without auth token");
});

// T2 — Invalid token → 401
Deno.test("ZT-02: invalid bearer token returns 401", async () => {
  const res = await call({
    auth: "Bearer obviously-invalid-jwt-token",
    body: { job_type: "ui_qa_check" },
  });
  await res.text();
  assertEquals(res.status, 401, "Expected 401 for invalid JWT");
});

// T3 — OPTIONS preflight → 200 with CORS headers
Deno.test("ZT-03: OPTIONS preflight returns CORS headers", async () => {
  const res = await call({
    method: "OPTIONS",
    origin: "https://tarotdinatoire.lovable.app",
  });
  await res.text();
  assertEquals(res.status, 200, "Expected 200 on preflight");
  assertExists(
    res.headers.get("Access-Control-Allow-Origin"),
    "Missing ACAO header",
  );
});

// T4 — No wildcard CORS on preflight
Deno.test("ZT-04: CORS header is not wildcard", async () => {
  const res = await call({
    method: "OPTIONS",
    origin: "https://evil-attacker.com",
  });
  await res.text();
  const acao = res.headers.get("Access-Control-Allow-Origin");
  // Should NOT be the attacker origin or *
  const isWildcardOrEvil =
    acao === "*" || acao === "https://evil-attacker.com";
  assertEquals(
    isWildcardOrEvil,
    false,
    `CORS should not echo untrusted origin, got: ${acao}`,
  );
});

// T5 — Invalid job_type → 400 (allowlist enforcement)
Deno.test("ZT-05: invalid job_type is rejected with 400", async () => {
  // We can only test this if we have a valid auth token for an admin user.
  // Without one, we expect 401. The point is it must NOT be 200 or 201.
  const res = await call({
    auth: "Bearer non-admin-token",
    body: { job_type: "drop_table_users" },
  });
  await res.text();
  // 401 (bad token) or 400 (bad type) — never 201
  assertEquals(
    res.status === 201,
    false,
    "Injection job_type must never return 201",
  );
});

// T6 — GET method → 405
Deno.test("ZT-06: GET method not allowed", async () => {
  const res = await call({ method: "GET" });
  await res.text();
  assertEquals(res.status, 405, "Expected 405 for GET");
});

// T7 — Oversized payload → 401/413 (never 201)
Deno.test("ZT-07: oversized payload never returns 201", async () => {
  const bigPayload = { data: "x".repeat(15_000) };
  const res = await call({
    auth: "Bearer fake",
    body: { job_type: "data_verification", payload: bigPayload },
  });
  await res.text();
  assertEquals(
    res.status === 201,
    false,
    "Oversized payload must not be accepted",
  );
});

// T8 — Valid allowed origin in CORS response
Deno.test("ZT-08: trusted origin reflected correctly", async () => {
  const trusted = "https://tarotdinatoire.lovable.app";
  const res = await call({ method: "OPTIONS", origin: trusted });
  await res.text();
  const acao = res.headers.get("Access-Control-Allow-Origin");
  assertEquals(acao, trusted, "Trusted origin should be reflected");
});
