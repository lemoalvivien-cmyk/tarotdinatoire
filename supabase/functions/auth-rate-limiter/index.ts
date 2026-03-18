/**
 * auth-rate-limiter — Edge Function
 * Sliding window rate limit for login / signup / reset-password.
 * Called by Auth.tsx BEFORE the actual Supabase auth call.
 *
 * POST body: { action: "login"|"signup"|"reset", email: string }
 * Returns:   { allowed: boolean, locked_until?: string, retry_after_seconds?: number }
 *
 * Security:
 *  - IP extracted from CF-Connecting-IP / X-Forwarded-For (only first hop)
 *  - Both IP and email are SHA-256 hashed before storage (no PII in DB)
 *  - verify_jwt = false (public endpoint — auth hasn't happened yet)
 *  - CORS restricted to allowlist
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tarotdinatoire.fr",
  "https://www.tarotdinatoire.fr",
  "https://tarotdinatoire.lovable.app",
  "https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getClientIp(req: Request): string {
  // Cloudflare provides this header
  const cf = req.headers.get("CF-Connecting-IP");
  if (cf) return cf.trim();
  const forwarded = req.headers.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json() as { action?: string; email?: string };
    const { action, email } = body;

    if (!action || !email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required fields: action, email" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["login", "signup", "reset"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const clientIp = getClientIp(req);
    const [ipHash, emailHash] = await Promise.all([
      sha256(`${clientIp}:${action}`),
      sha256(email.toLowerCase().trim()),
    ]);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.rpc("check_auth_rate_limit", {
      p_ip_hash: ipHash,
      p_email_hash: emailHash,
    });

    if (error) {
      // Fail open — if rate limit check itself fails, allow the request
      // but log the error. This prevents DoS via rate-limit endpoint.
      console.error("[auth-rate-limiter] RPC error:", error.message);
      return new Response(
        JSON.stringify({ allowed: true, error: "rate_limit_check_failed" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = data as {
      allowed: boolean;
      locked_until: string | null;
      attempts: number;
    };

    if (!result.allowed && result.locked_until) {
      const lockedUntil = new Date(result.locked_until);
      const retryAfterSeconds = Math.max(
        0,
        Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)
      );

      return new Response(
        JSON.stringify({
          allowed: false,
          locked_until: result.locked_until,
          retry_after_seconds: retryAfterSeconds,
          attempts: result.attempts,
          message: `Trop de tentatives. Réessayez dans ${
            retryAfterSeconds > 3600
              ? `${Math.ceil(retryAfterSeconds / 3600)}h`
              : retryAfterSeconds > 60
              ? `${Math.ceil(retryAfterSeconds / 60)} minutes`
              : `${retryAfterSeconds} secondes`
          }.`,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.locked_until,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        attempts: result.attempts,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[auth-rate-limiter] Unexpected error:", err);
    return new Response(
      JSON.stringify({ allowed: true, error: "internal_error" }),
      {
        status: 200, // Fail open — never block auth on infra error
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
