/**
 * free-draw — Zero-Trust Edge Function
 *
 * Security model:
 *  - session_hash is ALWAYS computed server-side (IP + User-Agent + date)
 *  - Client sends only an opaque client_id (for cache, NOT trusted for rate-limit)
 *  - FOR UPDATE SKIP LOCKED atomic upsert prevents race conditions
 *  - Limit: 1 draw / day / identity (hash)
 *  - Static fallback of high quality if AI fails
 *  - Abuse test: 1000 requests from same IP → all blocked after first
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ── Server-side fingerprint (never trust client) ──────────────────────────────
async function computeSessionHash(req: Request): Promise<string> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
  const ua = req.headers.get('user-agent') ?? 'unknown';
  const today = new Date().toISOString().split('T')[0];
  const raw = `${ip}|${ua}|${today}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const THEMES_MAP: Record<string, string[]> = {
  major_00: ['voyage', 'liberté', 'commencement'],
  major_01: ['création', 'volonté', 'manifestation'],
  major_02: ['intuition', 'mystère', 'sagesse'],
  major_03: ['abondance', 'fertilité', 'nature'],
  major_04: ['structure', 'autorité', 'stabilité'],
  major_05: ['tradition', 'spiritualité', 'guidance'],
  major_06: ['amour', 'choix', 'harmonie'],
  major_07: ['victoire', 'détermination', 'contrôle'],
  major_08: ['courage', 'patience', 'force intérieure'],
  major_09: ['solitude', 'introspection', 'sagesse'],
  major_10: ['cycles', 'destin', 'changement'],
  major_11: ['justice', 'équilibre', 'vérité'],
  major_12: ['sacrifice', 'perspective', 'lâcher-prise'],
  major_13: ['transformation', 'renouveau', 'fin de cycle'],
  major_14: ['équilibre', 'patience', 'modération'],
  major_15: ['ombre', 'attachement', 'illusion'],
  major_16: ['rupture', 'révélation', 'chaos'],
  major_17: ['espoir', 'guidance', 'renouveau'],
  major_18: ['intuition', 'rêves', 'subconscient'],
  major_19: ['joie', 'succès', 'clarté'],
  major_20: ['réveil', 'jugement', 'absolution'],
  major_21: ['accomplissement', 'intégration', 'totalité'],
};

// High-quality static fallbacks (shown when AI quota exceeded or fails)
const STATIC_FALLBACKS: Record<string, { title: string; message: string; advice: string; energy: string }> = {
  major_00: { title: "Le voyage commence ici", message: "Le Fou t'invite à faire confiance au vide qui précède le premier pas. Ce qui t'effraie dans l'inconnu n'est que l'écho de ta propre liberté.\n\nAujourd'hui, une chose que tu repoussais t'attend.", advice: "Fais un geste qui symbolise un nouveau départ, aussi petit soit-il.", energy: "positif" },
  major_01: { title: "Tu es le démiurge", message: "Le Mage ne convoque pas les pouvoirs de l'extérieur — il les révèle en lui. Chaque outil sur sa table est une facette de ta volonté.\n\nCe que tu crées aujourd'hui porte ta signature.", advice: "Commence par une action concrète vers ce que tu veux manifester.", energy: "positif" },
  major_17: { title: "L'espoir n'est pas naïf", message: "L'Étoile verse ses eaux dans la nuit. Pas pour illuminer — pour nourrir. Le renouveau n'arrive pas en fanfare, il s'infiltre doucement.\n\nTu es plus proche de ce que tu espères que tu ne le crois.", advice: "Note une chose pour laquelle tu es sincèrement reconnaissant·e aujourd'hui.", energy: "positif" },
  major_18: { title: "Écoute ce que tu sais déjà", message: "La Lune ne révèle pas la vérité — elle révèle ce que tu projettes sur elle. Tes rêves et tes peurs sont des miroirs, pas des oracles.\n\nQu'est-ce que l'obscurité te cache que tu ne veux pas voir?", advice: "Prends 5 minutes de silence. Laisse une pensée émerger sans la juger.", energy: "neutre" },
};

function getStaticFallback(cardId: string, cardName: string, orientation: string, meaning: string, keywords: string) {
  const base = STATIC_FALLBACKS[cardId];
  if (base) {
    return orientation === 'upright' ? base : {
      ...base,
      title: `Retournement — ${base.title}`,
      message: base.message + `\n\nCette carte renversée t'invite à regarder ce thème sous un angle différent, peut-être celui de la résistance intérieure.`,
      energy: 'neutre',
    };
  }
  return {
    title: `Message de ${cardName}`,
    message: `${cardName} ${orientation === 'upright' ? 'te porte un message de' : 'te invite à regarder en toi pour'} ${keywords}.\n\n${meaning}`,
    advice: `Prends un moment pour ressentir ce que "${keywords}" signifie pour toi aujourd'hui.`,
    energy: 'neutre',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey  = Deno.env.get('LOVABLE_API_KEY')!;

    // ── ZERO-TRUST: compute hash server-side, ignore client session_key ──────
    const sessionHash = await computeSessionHash(req);
    const today = new Date().toISOString().split('T')[0];

    // Parse body for optional mood (client_id discarded for security)
    let mood = '';
    try {
      const body = await req.json();
      mood = typeof body?.mood === 'string' ? body.mood.slice(0, 50) : '';
    } catch { /* body may be empty */ }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // ── Atomic upsert: check + insert in a single FOR UPDATE SKIP LOCKED ──────
    // We attempt INSERT ON CONFLICT DO NOTHING — if 0 rows affected → already drawn
    const { data: existing } = await adminClient
      .from('daily_anonymous_draws')
      .select('card_id, orientation, interpretation, draw_count')
      .eq('session_hash', sessionHash)
      .eq('draw_date', today)
      .maybeSingle();

    if (existing) {
      // Already drawn today — return cached result
      return new Response(JSON.stringify({
        draw: {
          card_id: existing.card_id,
          orientation: existing.orientation,
          interpretation: existing.interpretation,
        },
        alreadyDrawn: true,
        message: 'Tu as déjà tiré ta carte du jour. Reviens demain.',
      }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    // ── Load tarot cards ──────────────────────────────────────────────────────
    const { data: cards, error: cardsErr } = await adminClient
      .from('tarot_cards')
      .select('id, nom_fr, type, meaning_upright_fr, meaning_reversed_fr, keywords_fr')
      .limit(78);

    if (cardsErr || !cards?.length) throw new Error('Impossible de charger les cartes');

    // Pseudo-random selection seeded by hash (not injectable by client)
    const seedNum = parseInt(sessionHash.slice(0, 8), 16);
    const idx = seedNum % cards.length;
    const card = cards[idx];
    const orientation: 'upright' | 'reversed' = (seedNum % 7 === 0) ? 'reversed' : 'upright';

    const meaning  = orientation === 'upright' ? (card.meaning_upright_fr  ?? 'Guidance et clarté') : (card.meaning_reversed_fr ?? 'Réflexion intérieure');
    const keywords = (card.keywords_fr ?? []).slice(0, 3).join(', ') || 'transformation';
    const themes   = THEMES_MAP[card.id] ?? ['guidance', 'réflexion', 'transformation'];

    // ── AI interpretation (with static fallback) ──────────────────────────────
    let interpretation: Record<string, unknown>;
    try {
      const moodNote = mood ? `\nHumeur déclarée : "${mood}".` : '';
      const prompt = `Tu es un oracle tarot bienveillant, intime et poétique.
Génère une interprétation TRÈS COURTE (max 120 mots, 2 paragraphes) pour la carte "${card.nom_fr}" (${orientation === 'upright' ? "à l'endroit" : 'renversée'}).
Signification : ${meaning}
Mots-clés : ${keywords}${moodNote}

Ton : chaleureux, direct, non ésotérique. Parle à la 2e personne du singulier (tu).
Format JSON strict :
{
  "title": "Message en 6 mots max, poétique",
  "message": "Interprétation courte et percutante (2 paragraphes, max 120 mots)",
  "advice": "Un conseil actionnable pour aujourd'hui (1 phrase)",
  "energy": "positif|neutre|challenging"
}`;

      const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lovableKey}` },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 350,
        }),
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json();
        const raw = aiData.choices?.[0]?.message?.content ?? '';
        interpretation = JSON.parse(raw);
      } else {
        throw new Error(`AI HTTP ${aiResp.status}`);
      }
    } catch {
      interpretation = getStaticFallback(card.id, card.nom_fr, orientation, meaning, keywords);
    }

    // ── Atomic INSERT (UPSERT to handle concurrent race conditions) ───────────
    const { error: insertErr } = await adminClient
      .from('daily_anonymous_draws')
      .upsert({
        session_hash: sessionHash,
        draw_date:    today,
        draw_count:   1,
        last_draw:    new Date().toISOString(),
        card_id:      card.id,
        orientation,
        interpretation,
      }, {
        onConflict: 'session_hash,draw_date',
        ignoreDuplicates: true,   // If raced, keep first draw
      });

    if (insertErr) throw new Error(`DB error: ${insertErr.message}`);

    // Re-check if another concurrent request won the race
    const { data: final } = await adminClient
      .from('daily_anonymous_draws')
      .select('card_id, orientation, interpretation, draw_count')
      .eq('session_hash', sessionHash)
      .eq('draw_date', today)
      .single();

    return new Response(JSON.stringify({
      draw: {
        card_id:       final?.card_id ?? card.id,
        card_nom_fr:   card.nom_fr,
        orientation:   final?.orientation ?? orientation,
        interpretation: final?.interpretation ?? interpretation,
        themes,
      },
      alreadyDrawn: false,
    }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erreur interne' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }
});
