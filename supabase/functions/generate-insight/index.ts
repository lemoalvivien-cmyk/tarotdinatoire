/**
 * generate-insight — Edge Function (Internal, server-to-server only)
 *
 * Génère silencieusement un embedding vectoriel 32-dim depuis le contexte
 * émotionnel d'un tirage quotidien et le stocke dans user_embeddings.
 *
 * Sécurité :
 * - verify_jwt = false  (appelé server-to-server depuis daily-draw)
 * - WORKER_SECRET obligatoire dans l'en-tête x-worker-secret
 * - Validation stricte du payload (taille + types)
 * - Rate limit : 5 appels/heure par user_id via in-memory counter
 * - Aucune donnée sensible loguée
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── CORS — Zero Trust origin allowlist ─────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://tarotdinatoire.fr',
  'https://www.tarotdinatoire.fr',
  'https://tarotdinatoire.lovable.app',
  'https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-worker-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ── In-memory hourly rate limiter (per user_id) ────────────────────────────
const HOURLY_LIMIT = 5;
interface RateBucket { count: number; reset: number }
const rateBuckets = new Map<string, RateBucket>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now    = Date.now();
  const window = 60 * 60 * 1000; // 1 heure
  const bucket = rateBuckets.get(userId);

  if (!bucket || now > bucket.reset) {
    rateBuckets.set(userId, { count: 1, reset: now + window });
    return { allowed: true, remaining: HOURLY_LIMIT - 1, resetIn: window / 1000 };
  }

  if (bucket.count >= HOURLY_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((bucket.reset - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, remaining: HOURLY_LIMIT - bucket.count, resetIn: Math.ceil((bucket.reset - now) / 1000) };
}

// ── Payload validation ─────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CARD_ID_RE = /^(major_\d{2}|minor_(wands|cups|swords|pentacles)_(ace|[2-9]|10|page|knight|queen|king))$/i;
const MAX_THEMES  = 10;
const MAX_THEME_LEN = 60;
const MAX_SUMMARY_LEN = 2000;
const MAX_ADVICE_LEN  = 1000;
const MAX_ENERGY_STR  = 100;

interface ValidatedPayload {
  draw_id: string;
  user_id: string;
  card_id: string;
  orientation: 'upright' | 'reversed';
  themes: string[];
  energy_score: number;
  interpretation: Record<string, unknown> | null;
}

function validatePayload(body: unknown): { ok: true; data: ValidatedPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Payload must be a JSON object' };
  }

  const b = body as Record<string, unknown>;

  // Required UUID fields
  for (const field of ['draw_id', 'user_id']) {
    if (typeof b[field] !== 'string' || !UUID_RE.test(b[field] as string)) {
      return { ok: false, error: `Invalid or missing field: ${field} (must be a UUID)` };
    }
  }

  // card_id format
  if (typeof b.card_id !== 'string' || !CARD_ID_RE.test(b.card_id as string)) {
    return { ok: false, error: 'Invalid or missing field: card_id' };
  }

  // orientation
  if (b.orientation !== undefined && b.orientation !== 'upright' && b.orientation !== 'reversed') {
    return { ok: false, error: 'Invalid field: orientation must be "upright" or "reversed"' };
  }

  // themes: array of short strings
  if (b.themes !== undefined) {
    if (!Array.isArray(b.themes)) return { ok: false, error: 'themes must be an array' };
    if (b.themes.length > MAX_THEMES) return { ok: false, error: `themes exceeds max count (${MAX_THEMES})` };
    for (const t of b.themes) {
      if (typeof t !== 'string') return { ok: false, error: 'Each theme must be a string' };
      if (t.length > MAX_THEME_LEN) return { ok: false, error: `Theme too long (max ${MAX_THEME_LEN} chars)` };
    }
  }

  // energy_score: 1-10
  const score = Number(b.energy_score ?? 5);
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return { ok: false, error: 'energy_score must be an integer between 1 and 10' };
  }

  // interpretation: optional object, validate sub-fields length
  if (b.interpretation !== null && b.interpretation !== undefined) {
    if (typeof b.interpretation !== 'object' || Array.isArray(b.interpretation)) {
      return { ok: false, error: 'interpretation must be an object or null' };
    }
    const interp = b.interpretation as Record<string, unknown>;
    const summary = String(interp.summary ?? '');
    const advice  = String(interp.advice  ?? '');
    const energy  = String(interp.energy  ?? '');
    if (summary.length > MAX_SUMMARY_LEN) return { ok: false, error: `interpretation.summary too long (max ${MAX_SUMMARY_LEN})` };
    if (advice.length  > MAX_ADVICE_LEN)  return { ok: false, error: `interpretation.advice too long (max ${MAX_ADVICE_LEN})` };
    if (energy.length  > MAX_ENERGY_STR)  return { ok: false, error: `interpretation.energy too long (max ${MAX_ENERGY_STR})` };
  }

  return {
    ok: true,
    data: {
      draw_id:        b.draw_id as string,
      user_id:        b.user_id as string,
      card_id:        b.card_id as string,
      orientation:    (b.orientation as 'upright' | 'reversed') ?? 'upright',
      themes:         (b.themes as string[]) ?? [],
      energy_score:   score,
      interpretation: (b.interpretation as Record<string, unknown>) ?? null,
    },
  };
}

// ── Semantic embedding generator (32-dim) ─────────────────────────────────
async function generateSemanticEmbedding(
  lovableKey: string,
  cardName: string,
  orientation: string,
  themes: string[],
  interpretation: Record<string, unknown> | null,
  energyScore: number,
): Promise<number[]> {
  const summary = String(interpretation?.summary ?? '').slice(0, MAX_SUMMARY_LEN);
  const advice  = String(interpretation?.advice  ?? '').slice(0, MAX_ADVICE_LEN);
  const energy  = String(interpretation?.energy  ?? 'neutre').slice(0, MAX_ENERGY_STR);

  const prompt = `Tu es un encodeur sémantique pour le tarot.
Analyse ce tirage et génère un vecteur de 32 valeurs float entre 0.0 et 1.0
représentant ses dimensions psycho-énergétiques.

Carte : ${cardName} (${orientation === 'upright' ? "à l'endroit" : 'renversée'})
Thèmes : ${themes.join(', ')}
Score énergie : ${energyScore}/10
Résumé : ${summary}
Conseil : ${advice}
Énergie : ${energy}

Les 32 dimensions dans l'ordre :
0: joie_pure, 1: melancholic, 2: strength_force, 3: vulnerability,
4: love_romantic, 5: spiritual_growth, 6: material_focus, 7: transformation,
8: clarity_mind, 9: confusion_doubt, 10: action_drive, 11: passive_reflection,
12: social_connection, 13: solitude, 14: past_anchoring, 15: future_hope,
16: masculine_energy, 17: feminine_energy, 18: shadow_work, 19: light_integration,
20: cycle_beginning, 21: cycle_ending, 22: harmony_balance, 23: conflict_tension,
24: intuition_depth, 25: rational_structure, 26: abundance, 27: scarcity,
28: liberation, 29: attachment, 30: creativity_spark, 31: overall_intensity

Réponds UNIQUEMENT avec un JSON valide : {"v": [v0, v1, ..., v31]}
Chaque valeur entre 0.0 et 1.0 avec 2 décimales.`;

  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lovableKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 256,
      temperature: 0.1,
    }),
  });

  if (!resp.ok) {
    throw new Error(`AI gateway error ${resp.status}`);
  }

  const data   = await resp.json();
  const raw    = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw);
  const vec: number[] = parsed.v ?? [];

  if (!Array.isArray(vec) || vec.length !== 32) {
    throw new Error(`Invalid embedding length: ${vec.length}`);
  }

  const clamped = vec.map((v: unknown) => Math.min(1, Math.max(0, Number(v) || 0)));
  const norm    = Math.sqrt(clamped.reduce((s, v) => s + v * v, 0)) || 1;
  return clamped.map(v => Math.round((v / norm) * 10000) / 10000);
}

// ── Handler principal ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin  = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  // ── 1. WORKER_SECRET — accès interne uniquement ─────────────────────────
  const workerSecret   = Deno.env.get('WORKER_SECRET');
  const providedSecret = req.headers.get('x-worker-secret');
  if (!workerSecret || !providedSecret || providedSecret !== workerSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  // ── 2. Payload size guard (avant parsing JSON) ──────────────────────────
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 8_000) {
    return new Response(JSON.stringify({ error: 'Payload too large (max 8 KB)' }), {
      status: 413, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ── 3. Parse + validate payload ────────────────────────────────────────
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const validation = validatePayload(rawBody);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const { draw_id, user_id, card_id, orientation, themes, energy_score, interpretation } = validation.data;

    // ── 4. Rate limiting (5 appels/heure par user_id) ──────────────────────
    const rl = checkRateLimit(user_id);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({
          error: `Limite atteinte : maximum ${HOURLY_LIMIT} embeddings par heure.`,
          retry_after: rl.resetIn,
        }),
        {
          status: 429,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Retry-After': String(rl.resetIn),
            'X-RateLimit-Limit':     String(HOURLY_LIMIT),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset':     String(Math.floor(Date.now() / 1000) + rl.resetIn),
          },
        }
      );
    }

    // ── 5. Supabase + Lovable clients ──────────────────────────────────────
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey  = Deno.env.get('LOVABLE_API_KEY')!;

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: 'AI gateway not configured' }), {
        status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // ── 6. Récupérer le nom de la carte ────────────────────────────────────
    const { data: cardRow } = await adminClient
      .from('tarot_cards')
      .select('nom_fr')
      .eq('id', card_id)
      .maybeSingle();

    const cardName = cardRow?.nom_fr ?? card_id;

    // ── 7. Générer l'embedding ─────────────────────────────────────────────
    const embedding = await generateSemanticEmbedding(
      lovableKey, cardName, orientation, themes, interpretation, energy_score,
    );

    // ── 8. Upsert dans user_embeddings (service_role bypass RLS) ──────────
    const { error: upsertErr } = await adminClient
      .from('user_embeddings')
      .upsert({
        user_id,
        draw_id,
        embedding: `[${embedding.join(',')}]`,
        card_id,
        orientation,
        themes,
        energy_score,
        draw_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'draw_id' });

    if (upsertErr) throw new Error(`upsert error: ${upsertErr.message}`);

    return new Response(JSON.stringify({ ok: true, embedding_dim: embedding.length }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
