/**
 * card-insight — Edge Function
 *
 * Génère une guidance spirituelle du jour pour une carte tarot donnée.
 *
 * Sécurité :
 * - verify_jwt = false MAIS JWT Bearer vérifié manuellement (auth obligatoire)
 * - Rate limit : 5 appels/heure par user_id via in-memory counter
 * - Validation stricte du paramètre card_id
 * - Payload size guard (GET param uniquement)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Zero Trust CORS allowlist ──────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://tarotdinatoire.lovable.app",
  "https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// ── In-memory hourly rate limiter (per user_id) ────────────────────────────
const HOURLY_LIMIT = 5;
interface RateBucket { count: number; reset: number }
const rateBuckets = new Map<string, RateBucket>();

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now    = Date.now();
  const window = 60 * 60 * 1000; // 1 heure
  const bucket = rateBuckets.get(key);

  if (!bucket || now > bucket.reset) {
    rateBuckets.set(key, { count: 1, reset: now + window });
    return { allowed: true, remaining: HOURLY_LIMIT - 1, resetIn: window / 1000 };
  }

  if (bucket.count >= HOURLY_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((bucket.reset - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, remaining: HOURLY_LIMIT - bucket.count, resetIn: Math.ceil((bucket.reset - now) / 1000) };
}

// ── card_id validation ─────────────────────────────────────────────────────
const CARD_ID_RE = /^(major_\d{2}|minor_(wands|cups|swords|pentacles)_(ace|[2-9]|10|page|knight|queen|king))$/i;

const logStep = (step: string, details?: unknown) => {
  console.log(`[card-insight] ${step}`, details ?? "");
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors   = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // ── 1. JWT authentication — obligatoire ───────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Bearer token required" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const token      = authHeader.replace("Bearer ", "").trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Vérifier le JWT via le client utilisateur
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);
  if (authError || !claimsData?.claims) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: invalid or expired token" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const userId = claimsData.claims.sub as string;
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: user ID not found in token" }),
      { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  // ── 2. Rate limiting (5 appels/heure par user_id) ─────────────────────────
  const rl = checkRateLimit(userId);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({
        error: `Limite atteinte : maximum ${HOURLY_LIMIT} insights par heure.`,
        retry_after: rl.resetIn,
      }),
      {
        status: 429,
        headers: {
          ...cors,
          "Content-Type": "application/json",
          "Retry-After":           String(rl.resetIn),
          "X-RateLimit-Limit":     String(HOURLY_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset":     String(Math.floor(Date.now() / 1000) + rl.resetIn),
        },
      }
    );
  }

  try {
    // ── 3. Validation du paramètre card_id ────────────────────────────────
    const url    = new URL(req.url);
    const cardId = (url.searchParams.get("card_id") ?? "").trim();

    if (!cardId) {
      return new Response(
        JSON.stringify({ error: "card_id parameter required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (!CARD_ID_RE.test(cardId)) {
      return new Response(
        JSON.stringify({ error: "Invalid card_id format" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Reject any extra query parameters (defense in depth)
    const allowedParams = new Set(["card_id"]);
    for (const key of url.searchParams.keys()) {
      if (!allowedParams.has(key)) {
        return new Response(
          JSON.stringify({ error: `Unknown parameter: ${key}` }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    logStep("Fetching card data", { cardId, userId });

    const adminClient = createClient(supabaseUrl, serviceKey);

    // ── 4. Fetch card from DB ─────────────────────────────────────────────
    const { data: card, error: cardError } = await adminClient
      .from("tarot_cards")
      .select("id, nom_fr, name_en, type, numero, meaning_upright_fr, meaning_reversed_fr, keywords_fr")
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      logStep("Card not found", cardError);
      return new Response(
        JSON.stringify({ error: "Card not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // ── 5. Vérifier la clé AI ─────────────────────────────────────────────
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // ── 6. Construire le prompt ───────────────────────────────────────────
    const today       = new Date().toISOString().slice(0, 10);
    const orientation = Math.random() < 0.5 ? "droit" : "inverse";
    const keywords    = (card.keywords_fr ?? []).slice(0, 5).join(", ");
    const meaning     = orientation === "droit"
      ? card.meaning_upright_fr ?? card.nom_fr
      : card.meaning_reversed_fr ?? card.nom_fr;

    const prompt = `Tu es un tarologue mystique expert. Pour la carte "${card.nom_fr}" (${card.name_en ?? card.nom_fr}), tirée aujourd'hui en position ${orientation}, génère une guidance spirituelle du jour en français.

Mots-clés de la carte : ${keywords}
Sens principal : ${meaning}

Format de réponse JSON strict :
{
  "titre": "titre court et poétique (max 8 mots)",
  "message": "guidance spirituelle du jour (2-3 phrases, inspirante et actionnable)",
  "question": "une question de réflexion personnelle",
  "energie": "mot décrivant l'énergie du jour (1-2 mots)"
}

Réponds UNIQUEMENT en JSON, sans markdown ni explication.`;

    logStep("Calling AI gateway", { cardId, cardName: card.nom_fr });

    // ── 7. Appel AI ───────────────────────────────────────────────────────
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: "Limite de requêtes IA atteinte — réessaie dans un moment." }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (aiResponse.status === 402) {
      return new Response(
        JSON.stringify({ error: "Crédits AI insuffisants." }),
        { status: 402, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (!aiResponse.ok) {
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData     = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "{}";

    let insight: Record<string, string>;
    try {
      insight = JSON.parse(rawContent.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      insight = {
        titre:    "Guidance du jour",
        message:  `Aujourd'hui, la carte ${card.nom_fr} vous invite à l'introspection et à la sérénité.`,
        question: "Quelle leçon cette carte vous apporte-t-elle aujourd'hui ?",
        energie:  orientation === "droit" ? "Expansion" : "Intériorisation",
      };
    }

    logStep("AI insight generated", { cardId });

    return new Response(
      JSON.stringify({ card_id: cardId, card_name: card.nom_fr, date: today, orientation, insight }),
      {
        status: 200,
        headers: {
          ...cors,
          "Content-Type":  "application/json",
          "Cache-Control": "public, max-age=3600",
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );

  } catch (err) {
    logStep("Error", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate insight" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
