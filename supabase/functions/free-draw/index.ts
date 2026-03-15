/**
 * free-draw — Edge Function publique (sans auth)
 * Sélectionne 1 carte aléatoire et génère une interprétation IA courte (≤150 mots)
 * Protections : 1 tirage/jour par session_key (IP+UA hash)
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

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')!;

    const body = await req.json();
    const sessionKey: string = body?.session_key ?? '';
    const mood: string = body?.mood ?? '';

    if (!sessionKey || sessionKey.length < 8) {
      return new Response(JSON.stringify({ error: 'session_key requis' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const today = new Date().toISOString().split('T')[0];

    // ── Vérif limite 1/jour ─────────────────────────────────────────────
    const { data: existing } = await adminClient
      .from('daily_free_draws')
      .select('id, card_id, orientation, interpretation')
      .eq('session_key', sessionKey)
      .eq('draw_date', today)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        draw: existing,
        alreadyDrawn: true,
        message: 'Tu as déjà tiré ta carte du jour. Reviens demain.',
      }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    // ── Chargement cartes ────────────────────────────────────────────────
    const { data: cards, error: cardsErr } = await adminClient
      .from('tarot_cards')
      .select('id, nom_fr, type, meaning_upright_fr, meaning_reversed_fr, keywords_fr')
      .limit(78);

    if (cardsErr || !cards?.length) throw new Error('Impossible de charger les cartes');

    // Sélection pseudo-aléatoire (seed = jour + hash session)
    const seed = sessionKey.charCodeAt(0) + sessionKey.charCodeAt(1) + new Date().getDate() + new Date().getMonth();
    const idx = seed % cards.length;
    const card = cards[idx];
    const orientation: 'upright' | 'reversed' = (seed % 7 === 0) ? 'reversed' : 'upright';

    const meaning = orientation === 'upright'
      ? (card.meaning_upright_fr ?? 'Guidance et clarté')
      : (card.meaning_reversed_fr ?? 'Réflexion intérieure');
    const keywords = (card.keywords_fr ?? []).slice(0, 3).join(', ') || 'transformation';
    const themes = THEMES_MAP[card.id] ?? ['guidance', 'réflexion', 'transformation'];

    // ── Génération IA (150 mots max, ton intime) ─────────────────────────
    let interpretation: Record<string, unknown> | null = null;
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableKey}`,
        },
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
      }
    } catch {
      // Fallback local
      interpretation = {
        title: `Message de ${card.nom_fr}`,
        message: `${card.nom_fr} ${orientation === 'upright' ? 'te porte un message de' : 'te invite à regarder en toi'} ${keywords}.\n\n${meaning}`,
        advice: `Prends un moment pour ressentir ce que ${keywords} signifie pour toi aujourd'hui.`,
        energy: 'neutre',
      };
    }

    // ── Sauvegarde en DB ─────────────────────────────────────────────────
    const { data: newDraw, error: insertErr } = await adminClient
      .from('daily_free_draws')
      .insert({
        session_key: sessionKey,
        card_id: card.id,
        orientation,
        interpretation,
        draw_date: today,
      })
      .select('id, card_id, orientation, interpretation')
      .single();

    if (insertErr) throw new Error(`Erreur sauvegarde: ${insertErr.message}`);

    return new Response(JSON.stringify({
      draw: { ...newDraw, card_nom_fr: card.nom_fr, themes },
      alreadyDrawn: false,
    }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erreur interne' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }
});
