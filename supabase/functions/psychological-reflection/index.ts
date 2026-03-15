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
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PsychReflection {
  emotional_insight: string;
  shadow_aspect: string;
  light_aspect: string;
  reflection_question: string;
  growth_suggestion: string;
  affirmation: string;
  archetype: string;
  safety_note: string | null;
}

// ─── Fallback templates by card archetype ────────────────────────────────────
const FALLBACK_ARCHETYPES: Record<string, string> = {
  major_00: 'Le Fol Innocent',  major_01: 'Le Magicien Créateur',
  major_02: 'La Grande Prêtresse', major_03: 'La Mère Nourricière',
  major_04: 'Le Père Protecteur', major_05: 'Le Sage Traditionnel',
  major_06: 'L\'Amant', major_07: 'Le Guerrier Victorieux',
  major_08: 'La Force Intérieure', major_09: 'Le Sage Solitaire',
  major_10: 'La Roue du Destin', major_11: 'La Justice Équilibrée',
  major_12: 'Le Pendu Contemplatif', major_13: 'La Transformation',
  major_14: 'L\'Alchimiste Tempéré', major_15: 'L\'Ombre Enchaînée',
  major_16: 'La Tour Libératrice', major_17: 'L\'Étoile Guidante',
  major_18: 'La Lune Mystérieuse', major_19: 'Le Soleil Rayonnant',
  major_20: 'Le Jugement Éveillé', major_21: 'Le Monde Intégré',
};

function buildFallbackReflection(
  cardName: string, cardId: string, orientation: string,
  meaning: string, keywords: string,
): PsychReflection {
  const archetype = FALLBACK_ARCHETYPES[cardId] ?? 'L\'Archétype Universel';
  const isReversed = orientation === 'reversed';

  return {
    emotional_insight: isReversed
      ? `${cardName} renversée invite à regarder ce qui se passe à l'intérieur plutôt qu'à l'extérieur. ${meaning} Cette énergie cherche à être reconnue et intégrée.`
      : `${cardName} apporte une lumière sur votre paysage émotionnel du moment. ${meaning} Quelque chose en vous est prêt à se déployer.`,
    shadow_aspect: isReversed
      ? `Une partie de vous résiste peut-être à l'élan de cette carte. Qu'est-ce que tu évites de voir en toi en ce moment ?`
      : `${cardName} peut aussi révéler ce qui demande attention dans l'ombre — les patterns qui se répètent sans être nommés.`,
    light_aspect: `Les mots-clés ${keywords} sont des ressources déjà présentes en toi. Tu n'as pas à les conquérir — simplement à les reconnaître.`,
    reflection_question: `Qu'est-ce que l'énergie de ${cardName} cherche à te dire sur ta relation avec toi-même en ce moment ?`,
    growth_suggestion: `Prends 5 minutes aujourd'hui pour noter dans ton journal ce que le mot "${keywords.split(',')[0]?.trim()}" signifie pour toi en ce moment. Laisse venir ce qui vient, sans censure.`,
    affirmation: `Je suis en chemin, et ce chemin m'appartient pleinement.`,
    archetype,
    safety_note: null,
  };
}

// ─── Sensitive keyword detection ─────────────────────────────────────────────
function containsSensitiveTopic(text: string): boolean {
  const keywords = ['mort', 'deuil', 'perte', 'suicide', 'dépression', 'rupture', 'abandon', 'crise', 'détresse', 'souffrance'];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableKey   = Deno.env.get('LOVABLE_API_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // ── Parse body ──────────────────────────────────────────────────────────
    const body = await req.json();
    const { draw_id, force_regenerate = false } = body;

    if (!draw_id) {
      return new Response(JSON.stringify({ error: 'draw_id required' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch draw (must belong to user) ─────────────────────────────────────
    const { data: draw, error: drawErr } = await adminClient
      .from('daily_draws')
      .select('id, user_id, card_id, orientation, interpretation, psych_reflection')
      .eq('id', draw_id)
      .eq('user_id', user.id)
      .single();

    if (drawErr || !draw) {
      return new Response(JSON.stringify({ error: 'Draw not found' }), {
        status: 404, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // ── Return cached if already generated ───────────────────────────────────
    if (draw.psych_reflection && !force_regenerate) {
      return new Response(
        JSON.stringify({ reflection: draw.psych_reflection, cached: true }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // ── Fetch card data ───────────────────────────────────────────────────────
    const { data: card } = await adminClient
      .from('tarot_cards')
      .select('nom_fr, meaning_upright_fr, meaning_reversed_fr, keywords_fr')
      .eq('id', draw.card_id)
      .single();

    const cardName  = card?.nom_fr ?? draw.card_id;
    const meaning   = draw.orientation === 'upright'
      ? (card?.meaning_upright_fr ?? 'Guidance et clarté')
      : (card?.meaning_reversed_fr ?? 'Réflexion intérieure');
    const keywords  = (card?.keywords_fr ?? []).slice(0, 4).join(', ') || 'transformation';
    const interpSummary = (draw.interpretation as Record<string, string> | null)?.summary ?? '';

    // ── Fetch prompt templates ────────────────────────────────────────────────
    const { data: templates } = await adminClient
      .from('ai_prompt_templates')
      .select('key, content')
      .in('key', ['psych_reflection_system', 'psych_reflection_schema']);

    const tplMap = Object.fromEntries((templates ?? []).map(t => [t.key, t.content]));
    const systemPrompt = tplMap['psych_reflection_system'] ?? '';
    const schemaPrompt = tplMap['psych_reflection_schema'] ?? '';

    const isSensitive = containsSensitiveTopic(meaning + keywords + interpSummary);

    const userPrompt = `Carte : ${cardName} (${draw.orientation === 'upright' ? 'à l\'endroit' : 'renversée'})
Signification : ${meaning}
Mots-clés : ${keywords}
${interpSummary ? `Interprétation du tirage : ${interpSummary}` : ''}
${isSensitive ? '\nATTENTION : Le contenu touche à des thèmes sensibles. Inclure une safety_note bienveillante.' : ''}

${schemaPrompt}`;

    // ── Call AI ──────────────────────────────────────────────────────────────
    let reflection: PsychReflection;

    try {
      const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 700,
          temperature: 0.75,
        }),
      });

      if (!aiResp.ok) {
        const errBody = await aiResp.text();
        console.error('AI error:', aiResp.status, errBody);
        // Surface rate limit / credit errors
        if (aiResp.status === 429) throw new Error('RATE_LIMITED');
        if (aiResp.status === 402) throw new Error('INSUFFICIENT_CREDITS');
        throw new Error('AI_ERROR');
      }

      const aiData = await aiResp.json();
      const raw    = aiData.choices?.[0]?.message?.content ?? '';

      // Strip potential markdown fences
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/,'').trim();
      reflection = JSON.parse(cleaned) as PsychReflection;

      // Ensure safety_note is set when sensitive
      if (isSensitive && !reflection.safety_note) {
        reflection.safety_note = "Si tu traverses une période difficile, n'hésite pas à en parler avec un professionnel bienveillant.";
      }

    } catch (aiErr) {
      const errMsg = aiErr instanceof Error ? aiErr.message : 'AI_ERROR';
      if (errMsg === 'RATE_LIMITED' || errMsg === 'INSUFFICIENT_CREDITS') {
        return new Response(
          JSON.stringify({ error: errMsg, reflection: buildFallbackReflection(cardName, draw.card_id, draw.orientation, meaning, keywords) }),
          { status: errMsg === 'RATE_LIMITED' ? 429 : 402, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }
      // Fallback gracefully
      reflection = buildFallbackReflection(cardName, draw.card_id, draw.orientation, meaning, keywords);
    }

    // ── Persist to daily_draws ────────────────────────────────────────────────
    await adminClient
      .from('daily_draws')
      .update({ psych_reflection: reflection })
      .eq('id', draw_id);

    return new Response(
      JSON.stringify({ reflection, cached: false }),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
