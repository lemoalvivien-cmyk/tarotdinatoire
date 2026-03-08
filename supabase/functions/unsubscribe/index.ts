import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Zero Trust CORS allowlist — no wildcard ────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://tarotdinatoire.lovable.app",
  "https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/**
 * Secure unsubscribe endpoint that validates token server-side
 * and only allows modifying unsubscribed_at and consent fields.
 */
serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsH = buildCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsH });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsH, "Content-Type": "application/json" } }
      );
    }

    const { token } = await req.json();

    // Validate token format (UUID)
    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Token manquant ou invalide", status: "error" }),
        { status: 400, headers: { ...corsH, "Content-Type": "application/json" } }
      );
    }

    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return new Response(
        JSON.stringify({ error: "Format de token invalide", status: "error" }),
        { status: 400, headers: { ...corsH, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS and perform secure update
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find lead by unsubscribe token
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("email_leads")
      .select("id, unsubscribed_at")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (fetchError) {
      console.error("Database fetch error:", fetchError.message);
      return new Response(
        JSON.stringify({ error: "Erreur serveur", status: "error" }),
        { status: 500, headers: { ...corsH, "Content-Type": "application/json" } }
      );
    }

    if (!lead) {
      return new Response(
        JSON.stringify({ error: "Lien invalide ou expiré", status: "error" }),
        { status: 404, headers: { ...corsH, "Content-Type": "application/json" } }
      );
    }

    // Already unsubscribed
    if (lead.unsubscribed_at) {
      return new Response(
        JSON.stringify({ message: "Déjà désinscrit", status: "already" }),
        { status: 200, headers: { ...corsH, "Content-Type": "application/json" } }
      );
    }

    // Perform secure update - ONLY modify allowed fields
    const { error: updateError } = await supabaseAdmin
      .from("email_leads")
      .update({
        unsubscribed_at: new Date().toISOString(),
        consent: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    if (updateError) {
      console.error("Database update error:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la désinscription", status: "error" }),
        { status: 500, headers: { ...corsH, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Désinscription confirmée", status: "success" }),
      { status: 200, headers: { ...corsH, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unsubscribe error:", error instanceof Error ? error.message : 'unknown');
    return new Response(
      JSON.stringify({ error: "Erreur serveur", status: "error" }),
      { status: 500, headers: { ...buildCorsHeaders(req.headers.get("Origin")), "Content-Type": "application/json" } }
    );
  }
});
