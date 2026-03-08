/**
 * agent-worker — OpenClaw job consumer
 *
 * ══════════════════════════════════════════════════════════
 * SÉCURITÉ — FAIL-CLOSED
 * ══════════════════════════════════════════════════════════
 * 1. Si WORKER_SECRET n'est PAS configuré en env → 500 immédiat.
 *    Il n'existe AUCUN mode "ouvert en dev". Toute invocation sans
 *    secret configuré est rejetée. Configurer WORKER_SECRET est
 *    obligatoire avant toute exécution.
 *
 * 2. Si le header x-worker-secret est absent ou incorrect → 401.
 *
 * ══════════════════════════════════════════════════════════
 * ARCHITECTURE
 * ══════════════════════════════════════════════════════════
 *   Frontend → agent-dispatcher → agent_jobs (DB) → agent-worker
 *                                                        ↓
 *                                              OpenClawJobExecutor
 *                                              (adapts job_type → action)
 *
 * JAMAIS : Frontend → OpenClaw directement.
 * JAMAIS : Worker sans WORKER_SECRET configuré.
 *
 * ══════════════════════════════════════════════════════════
 * ÉTAT DES HANDLERS PAR JOB_TYPE
 * ══════════════════════════════════════════════════════════
 *   ui_qa_check          → ⚠ STUB (OPENCLAW_API_URL requis pour activer)
 *   content_synthesis    → ⚠ STUB (OPENCLAW_API_URL requis pour activer)
 *   data_verification    → ✅ RÉEL (query DB agent_jobs — aucune API externe)
 *   admin_assist_review  → ⚠ STUB (OPENCLAW_API_URL requis pour activer)
 *   security_drift_check → ⚠ STUB (OPENCLAW_API_URL requis, max_attempts=1)
 *
 * Pour activer les stubs : configurer OPENCLAW_API_URL + OPENCLAW_API_KEY.
 * L'OpenClawClient bascule automatiquement en mode réel quand les deux sont présents.
 *
 * ══════════════════════════════════════════════════════════
 * INVOCATION
 * ══════════════════════════════════════════════════════════
 * POST /functions/v1/agent-worker
 * Headers: x-worker-secret: <WORKER_SECRET>
 * Body (optionnel): { "batch_size": 1-10 }
 *
 * Déclenché par: cron scheduler ou panneau admin uniquement.
 * Jamais exposé aux navigateurs (pas de CORS).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ══════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════
type AgentJobType =
  | "ui_qa_check"
  | "content_synthesis"
  | "data_verification"
  | "admin_assist_review"
  | "security_drift_check";

interface ClaimedJob {
  id: string;
  job_type: AgentJobType;
  payload: Record<string, unknown>;
  attempt_count: number;
  max_attempts: number;
  timeout_seconds: number;
  priority: number;
  created_by: string;
  created_at: string;
}

interface JobResult {
  [key: string]: unknown;
}

// ══════════════════════════════════════════════════════════
// OpenClawClient
// ══════════════════════════════════════════════════════════
// Interface vers l'API externe OpenClaw.
//
// MODE RÉEL   : OPENCLAW_API_URL + OPENCLAW_API_KEY configurés → appels HTTP réels.
// MODE STUB   : variables absentes → résultats marqués _stub:true, aucun appel externe.
//
// IMPORTANT : Le mode stub retourne toujours _stub:true dans le result.
//             Vérifier openclaw_connected dans le résultat pour distinguer.
// ══════════════════════════════════════════════════════════
export class OpenClawClient {
  private readonly apiUrl: string | null;
  private readonly apiKey: string | null;
  readonly isConnected: boolean;

  constructor() {
    this.apiUrl = Deno.env.get("OPENCLAW_API_URL") ?? null;
    this.apiKey = Deno.env.get("OPENCLAW_API_KEY") ?? null;
    this.isConnected = !!(this.apiUrl && this.apiKey);
  }

  /**
   * Execute an action against the OpenClaw API.
   *
   * RÉEL  : quand OPENCLAW_API_URL + OPENCLAW_API_KEY sont configurés.
   * STUB  : retourne { _stub: true, action, ... } sans appel externe.
   *
   * Note sécurité : le context est loggué sans payload utilisateur sensible.
   * Seuls les context_keys (noms des clés) sont loggués, jamais les valeurs.
   */
  async execute(
    action: string,
    context: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!this.isConnected) {
      // ⚠ STUB — activer en configurant OPENCLAW_API_URL + OPENCLAW_API_KEY
      return {
        _stub: true,
        action,
        executed_at: new Date().toISOString(),
        context_keys: Object.keys(context), // clés uniquement, jamais valeurs
        note: "OpenClaw non connecté. Configurer OPENCLAW_API_URL + OPENCLAW_API_KEY.",
      };
    }

    // MODE RÉEL
    const response = await fetch(`${this.apiUrl}/v1/actions/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "X-Request-ID": crypto.randomUUID(),
      },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      // Log code uniquement, jamais le body complet (peut contenir des secrets)
      const errStatus = response.status;
      throw new Error(`OpenClaw API error HTTP ${errStatus} on action=${action}`);
    }

    return await response.json() as Record<string, unknown>;
  }
}

// ══════════════════════════════════════════════════════════
// OpenClawJobExecutor
// ══════════════════════════════════════════════════════════
// Adapte job_type → action OpenClaw.
// Chaque handler est isolé. Les stubs sont explicitement marqués.
// ══════════════════════════════════════════════════════════
export class OpenClawJobExecutor {
  private readonly client: OpenClawClient;
  private readonly adminClient: ReturnType<typeof createClient>;

  constructor(client: OpenClawClient, adminClient: ReturnType<typeof createClient>) {
    this.client = client;
    this.adminClient = adminClient;
  }

  async execute(job: ClaimedJob): Promise<JobResult> {
    switch (job.job_type) {
      case "ui_qa_check":
        return this.runUiQaCheck(job.payload);
      case "content_synthesis":
        return this.runContentSynthesis(job.payload);
      case "data_verification":
        return this.runDataVerification(job.payload);
      case "admin_assist_review":
        return this.runAdminAssistReview(job.payload);
      case "security_drift_check":
        return this.runSecurityDriftCheck(job.payload);
      default:
        throw new Error(`Unknown job_type: ${(job as ClaimedJob).job_type}`);
    }
  }

  // ── ui_qa_check ─────────────────────────────────────────
  // STATUS: ⚠ STUB
  // Objectif réel: appeler OpenClaw pour scanner target_url (regressions UI).
  // Activation: configurer OPENCLAW_API_URL + OPENCLAW_API_KEY.
  private async runUiQaCheck(payload: Record<string, unknown>): Promise<JobResult> {
    const result = await this.client.execute("ui_qa_check", {
      target_url: payload.target_url ?? "https://tarotdinatoire.lovable.app",
      viewport: payload.viewport ?? { width: 1280, height: 800 },
      checks: payload.checks ?? ["layout", "broken_links", "console_errors"],
    });
    return {
      job_type: "ui_qa_check",
      openclaw_connected: this.client.isConnected,
      ...result,
    };
  }

  // ── content_synthesis ───────────────────────────────────
  // STATUS: ⚠ STUB
  // Objectif réel: synthétiser du contenu depuis des sources via OpenClaw.
  // Activation: configurer OPENCLAW_API_URL + OPENCLAW_API_KEY.
  private async runContentSynthesis(payload: Record<string, unknown>): Promise<JobResult> {
    const result = await this.client.execute("content_synthesis", {
      sources: payload.sources ?? [],
      output_format: payload.output_format ?? "markdown",
      language: payload.language ?? "fr",
    });
    return {
      job_type: "content_synthesis",
      openclaw_connected: this.client.isConnected,
      ...result,
    };
  }

  // ── data_verification ───────────────────────────────────
  // STATUS: ✅ RÉEL (DB-based, aucune API externe requise)
  // Vérifie l'intégrité des données dans agent_jobs et rapporte les stats.
  private async runDataVerification(payload: Record<string, unknown>): Promise<JobResult> {
    const scope = (payload.scope as string) ?? "agent_jobs";
    const startedAt = new Date().toISOString();

    if (scope === "agent_jobs") {
      const { data: stats, error } = await this.adminClient
        .from("agent_jobs")
        .select("status")
        .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());

      if (error) throw new Error(`data_verification DB error: ${error.message}`);

      const counts = (stats ?? []).reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1;
        return acc;
      }, {});

      return {
        job_type: "data_verification",
        scope,
        verified: true,
        stats_last_24h: counts,
        verified_at: startedAt,
        openclaw_connected: this.client.isConnected,
      };
    }

    // Fallback pour d'autres scopes via OpenClaw (stub si non connecté)
    const result = await this.client.execute("data_verification", { scope });
    return {
      job_type: "data_verification",
      scope,
      openclaw_connected: this.client.isConnected,
      ...result,
    };
  }

  // ── admin_assist_review ─────────────────────────────────
  // STATUS: ⚠ STUB
  // Objectif réel: OpenClaw analyse les actions admin pour détecter des anomalies.
  // Activation: configurer OPENCLAW_API_URL + OPENCLAW_API_KEY.
  private async runAdminAssistReview(payload: Record<string, unknown>): Promise<JobResult> {
    const result = await this.client.execute("admin_assist_review", {
      review_window_hours: payload.review_window_hours ?? 24,
      flag_threshold: payload.flag_threshold ?? 3,
    });
    return {
      job_type: "admin_assist_review",
      openclaw_connected: this.client.isConnected,
      ...result,
    };
  }

  // ── security_drift_check ────────────────────────────────
  // STATUS: ⚠ STUB
  // Objectif réel: OpenClaw détecte les dérives RLS/policy vs baseline.
  // IMPORTANT: max_attempts=1 (fail-closed, pas de retry sur les checks sécurité).
  // Activation: configurer OPENCLAW_API_URL + OPENCLAW_API_KEY.
  private async runSecurityDriftCheck(payload: Record<string, unknown>): Promise<JobResult> {
    const result = await this.client.execute("security_drift_check", {
      policies: payload.policies ?? "all",
      baseline: payload.baseline ?? "production",
      alert_on_drift: true,
    });
    return {
      job_type: "security_drift_check",
      openclaw_connected: this.client.isConnected,
      drift_detected: result.drift_detected ?? false,
      ...result,
    };
  }
}

// ══════════════════════════════════════════════════════════
// Main handler — FAIL-CLOSED
// ══════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  // ── FAIL-CLOSED: WORKER_SECRET OBLIGATOIRE ───────────────
  // Si WORKER_SECRET n'est pas configuré → 500 immédiat.
  // Il n'y a AUCUN mode "ouvert". Configurer le secret est pré-requis.
  const workerSecret = Deno.env.get("WORKER_SECRET");
  if (!workerSecret) {
    return new Response(
      JSON.stringify({
        error: "Worker not configured: WORKER_SECRET missing.",
        hint: "Configure WORKER_SECRET secret before invoking this function.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Méthode ──────────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Auth: x-worker-secret obligatoire ────────────────────
  // WORKER_SECRET est configuré → header doit correspondre exactement.
  const provided = req.headers.get("x-worker-secret");
  if (!provided || provided !== workerSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Init clients ─────────────────────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceKey);
  const openclaw = new OpenClawClient();
  const executor = new OpenClawJobExecutor(openclaw, db);

  try {
    // ── Parse batch size ──────────────────────────────────
    let batchSize = 1;
    try {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.batch_size === "number") {
        batchSize = Math.min(Math.max(1, body.batch_size), 10);
      }
    } catch {
      // ignore — default 1
    }

    // ── Claim atomique (FOR UPDATE SKIP LOCKED) ───────────
    const { data: claimedJobs, error: claimError } = await db
      .rpc("claim_next_agent_job", { p_limit: batchSize });

    if (claimError) {
      // Log code uniquement, jamais le message complet (peut contenir des données)
      return new Response(
        JSON.stringify({ error: "Failed to claim jobs", code: claimError.code }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!claimedJobs || claimedJobs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending jobs" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const results: Array<{ id: string; status: string; duration_ms?: number }> = [];

    for (const job of claimedJobs as ClaimedJob[]) {
      const startMs = Date.now();

      try {
        const timeoutMs = job.timeout_seconds * 1000;

        const jobResult = await Promise.race([
          executor.execute(job),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("JOB_TIMEOUT")), timeoutMs)
          ),
        ]);

        const durationMs = Date.now() - startMs;

        await db.rpc("complete_agent_job", {
          p_job_id: job.id,
          p_status: "completed",
          p_result: jobResult,
          p_error_message: null,
        });

        // Audit: métadonnées techniques uniquement, jamais payload utilisateur
        await db.from("admin_audit_logs").insert({
          action: "agent_job_completed",
          admin_user_id: job.created_by,
          target_id: job.id,
          target_type: "agent_job",
          metadata: {
            job_type: job.job_type,
            attempt: job.attempt_count,
            duration_ms: durationMs,
            openclaw_connected: openclaw.isConnected,
          },
        });

        results.push({ id: job.id, status: "completed", duration_ms: durationMs });
      } catch (err) {
        const isTimeout = err instanceof Error && err.message === "JOB_TIMEOUT";
        const terminalStatus = isTimeout ? "timeout" : "failed";
        // Jamais de stack trace ni de payload dans le message d'erreur loggué
        const errorMsg = isTimeout
          ? `Timeout after ${job.timeout_seconds}s`
          : (err instanceof Error ? err.message.slice(0, 200) : "Unknown error");

        // Retry uniquement pour les échecs non-timeout, si tentatives restantes
        const shouldRetry = !isTimeout && job.attempt_count < job.max_attempts;

        if (shouldRetry) {
          await db
            .from("agent_jobs")
            .update({
              status: "pending",
              error_message: `Attempt ${job.attempt_count} failed: ${errorMsg}`,
              started_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id)
            .eq("status", "running");

          results.push({ id: job.id, status: "retrying" });
        } else {
          await db.rpc("complete_agent_job", {
            p_job_id: job.id,
            p_status: terminalStatus,
            p_result: null,
            p_error_message: errorMsg,
          });

          // Audit failure: job_type + attempt uniquement, jamais payload
          await db.from("admin_audit_logs").insert({
            action: `agent_job_${terminalStatus}`,
            admin_user_id: job.created_by,
            target_id: job.id,
            target_type: "agent_job",
            metadata: {
              job_type: job.job_type,
              attempt: job.attempt_count,
            },
          });

          results.push({ id: job.id, status: terminalStatus });
        }
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    // Log type uniquement, jamais le message (peut contenir des données sensibles)
    const errType = err instanceof Error ? err.constructor.name : typeof err;
    return new Response(
      JSON.stringify({ error: "Internal server error", type: errType }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
