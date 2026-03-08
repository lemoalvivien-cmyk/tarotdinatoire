/**
 * generate-insight — Edge Function
 *
 * Génère silencieusement un embedding vectoriel 32-dim à partir du contexte
 * émotionnel d'un tirage quotidien et le stocke dans user_embeddings.
 *
 * Appelée de manière asynchrone ("fire and forget") par daily-draw
 * après l'insertion du tirage — elle n'impacte pas le temps de réponse
 * visible par l'utilisateur.
 *
 * Sécurité :
 * - verify_jwt = false  → mais la fonction vérifie WORKER_SECRET
 * - Seul le service_role peut insérer dans user_embeddings (RLS strict)
 * - Aucune donnée sensible n'est loguée
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
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

// ─── Génère un embedding sémantique 32-dim via Lovable AI ──────────────────
// Le LLM décompose la signification de la carte en 32 dimensions floats [0,1]
// représentant des axes émotionnels/archétypaux standardisés.
async function generateSemanticEmbedding(
  lovableKey: string,
  cardName: string,
  orientation: string,
  themes: string[],
  interpretation: Record<string, unknown> | null,
  energyScore: number,
): Promise<number[]> {
  const summary   = String(interpretation?.summary  ?? '');
  const advice    = String(interpretation?.advice   ?? '');
  const energy    = String(interpretation?.energy   ?? 'neutre');

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
      temperature: 0.1, // déterministe pour cohérence des embeddings
    }),
  });

  if (!resp.ok) {
    throw new Error(`AI gateway error ${resp.status}`);
  }

  const data = await resp.json();
  const raw  = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw);
  const vec: number[] = parsed.v ?? [];

  // Validation et normalisation
  if (!Array.isArray(vec) || vec.length !== 32) {
    throw new Error(`Invalid embedding length: ${vec.length}`);
  }

  // Clamp entre [0, 1] et normaliser L2 pour cosine similarity
  const clamped = vec.map((v: unknown) => Math.min(1, Math.max(0, Number(v) || 0)));
  const norm    = Math.sqrt(clamped.reduce((s, v) => s + v * v, 0)) || 1;
  return clamped.map(v => Math.round((v / norm) * 10000) / 10000);
}

// ─── Handler principal ─────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin  = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  // ── Vérification du secret interne (pas d'accès public) ─────────────────
  const workerSecret = Deno.env.get('WORKER_SECRET');
  const providedSecret = req.headers.get('x-worker-secret');
  if (!workerSecret || !providedSecret || providedSecret !== workerSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { draw_id, user_id, card_id, orientation, themes, energy_score, interpretation } = body;

    if (!draw_id || !user_id || !card_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields: draw_id, user_id, card_id' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl   = Deno.env.get('SUPABASE_URL')!;
    const serviceKey    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey    = Deno.env.get('LOVABLE_API_KEY')!;

    const adminClient   = createClient(supabaseUrl, serviceKey);

    // ── Récupérer le nom de la carte ──────────────────────────────────────
    const { data: cardRow } = await adminClient
      .from('tarot_cards')
      .select('nom_fr')
      .eq('id', card_id)
      .maybeSingle();

    const cardName = cardRow?.nom_fr ?? card_id;

    // ── Générer l'embedding ───────────────────────────────────────────────
    const embedding = await generateSemanticEmbedding(
      lovableKey,
      cardName,
      orientation ?? 'upright',
      themes ?? [],
      interpretation ?? null,
      energy_score ?? 5,
    );

    // ── Upsert dans user_embeddings (service_role bypass RLS) ─────────────
    const { error: upsertErr } = await adminClient
      .from('user_embeddings')
      .upsert({
        user_id,
        draw_id,
        embedding: `[${embedding.join(',')}]`,
        card_id,
        orientation: orientation ?? 'upright',
        themes: themes ?? [],
        energy_score: energy_score ?? 5,
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
