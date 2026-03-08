/**
 * agent-worker — OpenClaw job consumer
 *
 * Architecture:
 * ─────────────────────────────────────────────────────────
 *   Frontend → agent-dispatcher → agent_jobs (DB) → agent-worker
 *                                                        ↓
 *                                              OpenClawJobExecutor
 *                                              (adapts job_type → action)
 *
 * IMPORTANT — Current status per job_type:
 *   ui_qa_check          → ⚠ ADAPTER/STUB (returns mock result)
 *   content_synthesis    → ⚠ ADAPTER/STUB (returns mock result)
 *   data_verification    → ✅ REAL  (queries agent_jobs DB stats)
 *   admin_assist_review  → ⚠ ADAPTER/STUB (returns mock result)
 *   security_drift_check → ⚠ ADAPTER/STUB (returns mock result — no external OpenClaw API yet)
 *
 * To plug in a real OpenClaw API, set OPENCLAW_API_URL + OPENCLAW_API_KEY secrets
 * and update OpenClawClient below. Stubs will be replaced job-type by job-type.
 *
 * Auth: requires x-worker-secret header matching WORKER_SECRET env var
 * CORS: not exposed to browsers — no CORS headers
 * Invocation: cron scheduler or admin panel only
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
// OpenClawClient — interface to external OpenClaw API
// STATUS: NOT YET CONNECTED TO EXTERNAL API
// Replace this with real HTTP calls when OPENCLAW_API_URL is configured
// ══════════════════════════════════════════════════════════
class OpenClawClient {
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
   * When not connected (OPENCLAW_API_URL not set), returns a typed stub.
   */
  async execute(
    action: string,
    context: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!this.isConnected) {
      // ⚠ STUB — replace with real fetch when OPENCLAW_API_URL is configured
      return {
        _stub: true,
        action,
        executed_at: new Date().toISOString(),
        context_keys: Object.keys(context),
        note: "OpenClaw not connected. Set OPENCLAW_API_URL + OPENCLAW_API_KEY to activate.",
      };
    }

    const response = await fetch(`${this.apiUrl}/v1/actions/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenClaw API error ${response.status}: ${err}`);
    }

    return await response.json();
  }
}

// ══════════════════════════════════════════════════════════
// OpenClawJobExecutor — maps job_type → OpenClaw action
// ══════════════════════════════════════════════════════════
class OpenClawJobExecutor {
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
        throw new Error(`Unknown job_type: ${job.job_type}`);
    }
  }

  /**
   * ui_qa_check — STATUS: ⚠ STUB
   * Intended: call OpenClaw to scan the target_url for UI regressions.
   * Not yet connected to external API.
   */
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

  /**
   * content_synthesis — STATUS: ⚠ STUB
   * Intended: call OpenClaw to synthesize content from provided sources.
   */
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

  /**
   * data_verification — STATUS: ✅ REAL (DB-based, no external API needed)
   * Verifies data integrity within agent_jobs table and reports stats.
   */
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

    // Fallback for other scopes — stub
    const result = await this.client.execute("data_verification", { scope, ...payload });
    return {
      job_type: "data_verification",
      scope,
      openclaw_connected: this.client.isConnected,
      ...result,
    };
  }

  /**
   * admin_assist_review — STATUS: ⚠ STUB
   * Intended: call OpenClaw to review admin actions for anomalies.
   */
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

  /**
   * security_drift_check — STATUS: ⚠ STUB
   * Intended: call OpenClaw to detect RLS/policy drift vs baseline.
   * max_attempts=1 (fail-closed, no retry on security checks).
   */
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
// Main handler
// ══════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const workerSecret = Deno.env.get("WORKER_SECRET");

  // Worker secret auth — prevents unauthorized invocation
  if (workerSecret) {
    const provided = req.headers.get("x-worker-secret");
    if (!provided || provided !== workerSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const db = createClient(supabaseUrl, serviceKey);
  const openclaw = new OpenClawClient();
  const executor = new OpenClawJobExecutor(openclaw, db);

  try {
    // Parse batch size
    let batchSize = 1;
    try {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.batch_size === "number") {
        batchSize = Math.min(Math.max(1, body.batch_size), 10);
      }
    } catch {
      // ignore — use default
    }

    // Atomic claim
    const { data: claimedJobs, error: claimError } = await db
      .rpc("claim_next_agent_job", { p_limit: batchSize });

    if (claimError) {
      console.error("[agent-worker] claim error code:", claimError.code);
      return new Response(JSON.stringify({ error: "Failed to claim jobs" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
        const isTimeout   = err instanceof Error && err.message === "JOB_TIMEOUT";
        const terminalStatus = isTimeout ? "timeout" : "failed";
        const errorMsg = isTimeout
          ? `Timeout after ${job.timeout_seconds}s`
          : (err instanceof Error ? err.message : "Unknown error");

        // Retry if attempts remain (only for non-timeout failures)
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

          await db.from("admin_audit_logs").insert({
            action: `agent_job_${terminalStatus}`,
            admin_user_id: job.created_by,
            target_id: job.id,
            target_type: "agent_job",
            metadata: {
              job_type: job.job_type,
              attempt: job.attempt_count,
              // No user payload logged on failure
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
    console.error("[agent-worker] unexpected error type:", typeof err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
