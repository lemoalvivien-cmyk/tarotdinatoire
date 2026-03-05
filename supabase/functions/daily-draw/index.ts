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
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

const THEMES_MAP: Record<string, string[]> = {
  major_00: ['voyage', 'liberté', 'commencement'],
  major_01: ['création', 'volonté', 'transformation'],
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
  major_12: ['sacrifice', 'perspective', 'suspension'],
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

// ─── Energy dimension scoring engine ────────────────────────────────────────
// Each dimension: 1 (very low) → 10 (very high), baseline 5

// Card-level dimension weights (major arcana only for strong signals)
// [emotionnel, relations, carriere, clarte, vitalite]
const CARD_DIMENSION_WEIGHTS: Record<string, [number, number, number, number, number]> = {
  major_00: [6, 5, 4, 7, 8],   // Fou: haute vitalité, clarté d'esprit
  major_01: [6, 5, 8, 8, 7],   // Magicien: clarté + carrière
  major_02: [7, 5, 4, 9, 5],   // Papesse: intuition, clarté intérieure
  major_03: [8, 8, 6, 6, 8],   // Impératrice: émotions + relations + vitalité
  major_04: [5, 5, 9, 7, 7],   // Empereur: carrière + stabilité
  major_05: [5, 6, 6, 8, 5],   // Hiérophante: clarté spirituelle
  major_06: [7, 9, 5, 6, 7],   // Amoureux: relations ++
  major_07: [6, 5, 8, 7, 8],   // Chariot: carrière + vitalité
  major_08: [7, 6, 7, 6, 8],   // Force: vitalité + courage
  major_09: [6, 3, 4, 9, 4],   // Ermite: clarté - relations - vitalité
  major_10: [6, 6, 7, 5, 7],   // Roue: cycles, carrière
  major_11: [5, 7, 7, 8, 5],   // Justice: clarté + relations
  major_12: [6, 4, 3, 7, 4],   // Pendu: sacrifice, faible carrière/vitalité
  major_13: [5, 4, 5, 6, 6],   // Mort: transformation neutre
  major_14: [7, 7, 6, 8, 7],   // Tempérance: équilibre +
  major_15: [4, 3, 4, 3, 5],   // Diable: attachement, obscurité
  major_16: [3, 3, 3, 4, 5],   // Tour: rupture, chaos
  major_17: [8, 7, 6, 8, 8],   // Étoile: espoir +++
  major_18: [5, 5, 3, 4, 5],   // Lune: illusion, faible clarté
  major_19: [9, 8, 8, 9, 9],   // Soleil: max toutes dimensions
  major_20: [8, 7, 7, 9, 7],   // Jugement: clarté + émotions
  major_21: [8, 8, 8, 8, 9],   // Monde: accomplissement total
};

// Suit-based scoring for minor arcana
const SUIT_DIMENSION_WEIGHTS: Record<string, [number, number, number, number, number]> = {
  wands:     [6, 5, 7, 6, 8],   // Bâtons: vitalité + carrière
  cups:      [8, 8, 4, 5, 6],   // Coupes: émotions + relations
  swords:    [5, 4, 6, 8, 5],   // Épées: clarté + intellect
  pentacles: [5, 5, 8, 6, 7],   // Pentacles: carrière + matériel
};

interface EnergyDimensions {
  emotionnel: number;
  relations:  number;
  carriere:   number;
  clarte:     number;
  vitalite:   number;
}

function scoreDimensions(
  cardId: string,
  orientation: 'upright' | 'reversed',
  interpretation: Record<string, unknown> | null,
): EnergyDimensions {
  // Get base weights from card or suit
  let base: [number, number, number, number, number];
  if (cardId.startsWith('major_')) {
    base = CARD_DIMENSION_WEIGHTS[cardId] ?? [5, 5, 5, 5, 5];
  } else {
    const suit = cardId.split('_')[1] ?? 'wands';
    base = SUIT_DIMENSION_WEIGHTS[suit] ?? [5, 5, 5, 5, 5];
  }

  let [emotionnel, relations, carriere, clarte, vitalite] = base;

  // Reversed cards invert toward 5: strong dims weaken, weak dims strengthen
  if (orientation === 'reversed') {
    const invert = (v: number) => Math.round(5 + (5 - v) * 0.6);
    emotionnel = invert(emotionnel);
    relations  = invert(relations);
    carriere   = invert(carriere);
    clarte     = invert(clarte);
    vitalite   = invert(vitalite);
  }

  // Boost/reduce from interpretation keywords
  const text = [
    String(interpretation?.summary ?? ''),
    String(interpretation?.advice ?? ''),
  ].join(' ').toLowerCase();

  const adjustments: Array<[string[], keyof EnergyDimensions, number]> = [
    [['joie', 'bonheur', 'plénitude', 'amour'], 'emotionnel', +1],
    [['tristesse', 'peur', 'angoisse', 'douleur'], 'emotionnel', -1],
    [['amour', 'relation', 'partenaire', 'harmonie', 'lien'], 'relations', +1],
    [['conflit', 'séparation', 'rupture', 'isolement'], 'relations', -1],
    [['succès', 'projet', 'travail', 'carrière', 'opportunité'], 'carriere', +1],
    [['blocage', 'obstacle', 'stagnation', 'échec'], 'carriere', -1],
    [['clarté', 'intuition', 'conscience', 'révélation', 'insight'], 'clarte', +1],
    [['confusion', 'illusion', 'doute', 'brouillard'], 'clarte', -1],
    [['énergie', 'vitalité', 'force', 'lumière', 'espoir'], 'vitalite', +1],
    [['épuisement', 'fatigue', 'faiblesse', 'lourd'], 'vitalite', -1],
  ];

  const result: EnergyDimensions = { emotionnel, relations, carriere, clarte, vitalite };

  for (const [keywords, dim, delta] of adjustments) {
    if (keywords.some(kw => text.includes(kw))) {
      result[dim] = Math.min(10, Math.max(1, result[dim] + delta));
    }
  }

  return result;
}

function getThemesForCard(cardId: string, orientation: string): string[] {
  const base = THEMES_MAP[cardId] ?? ['guidance', 'réflexion', 'transformation'];
  if (orientation === 'reversed') return base.map(t => `${t} (intérieur)`);
  return base;
}

function extractEnergyScore(interpretation: Record<string, unknown>): number {
  const summary = String(interpretation?.summary ?? '');
  const positive = ['joie', 'succès', 'lumière', 'amour', 'force', 'victoire', 'espoir', 'abondance'];
  const negative = ['obstacle', 'défi', 'difficulté', 'peur', 'blocage', 'tension', 'conflit'];
  let score = 5;
  positive.forEach(w => { if (summary.toLowerCase().includes(w)) score = Math.min(score + 1, 10); });
  negative.forEach(w => { if (summary.toLowerCase().includes(w)) score = Math.max(score - 1, 1); });
  return score;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableKey  = Deno.env.get('LOVABLE_API_KEY')!;

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
    const today = new Date().toISOString().split('T')[0];

    const { data: existingDraw, error: fetchErr } = await adminClient
      .from('daily_draws')
      .select('*')
      .eq('user_id', user.id)
      .eq('draw_date', today)
      .maybeSingle();

    if (fetchErr) throw new Error(`DB fetch error: ${fetchErr.message}`);

    if (existingDraw) {
      return new Response(JSON.stringify({ draw: existingDraw, alreadyDrawn: true }), {
        status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let journalEntry: string | null = null;
    let mood: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        journalEntry = body?.journal_entry ?? null;
        mood = body?.mood ?? null;
      } catch { /* no body */ }
    }

    const { data: cards, error: cardsErr } = await adminClient
      .from('tarot_cards')
      .select('id, nom_fr, type, meaning_upright_fr, meaning_reversed_fr, keywords_fr')
      .limit(78);

    if (cardsErr || !cards?.length) throw new Error('Could not load tarot cards');

    const seed = user.id.charCodeAt(0) + new Date().getDate() + new Date().getMonth();
    const idx  = seed % cards.length;
    const card = cards[idx];
    const orientation = seed % 5 === 0 ? 'reversed' : 'upright';

    const meaning  = orientation === 'upright'
      ? card.meaning_upright_fr  ?? 'Guidance et clarté'
      : card.meaning_reversed_fr ?? 'Réflexion intérieure';
    const keywords = (card.keywords_fr ?? []).slice(0, 3).join(', ') || 'transformation';

    let interpretation: Record<string, unknown> | null = null;
    let reflectionQuestion = "Quelle émotion cette carte éveille-t-elle en vous aujourd'hui ?";

    try {
      const prompt = `Tu es un oracle de tarot bienveillant et poétique. Génère une interprétation QUOTIDIENNE courte pour la carte "${card.nom_fr}" (${orientation === 'upright' ? "à l'endroit" : 'renversée'}).

Signification : ${meaning}
Mots-clés : ${keywords}

Réponds UNIQUEMENT en JSON valide avec exactement ces champs :
{
  "title": "Message du jour (max 8 mots)",
  "summary": "Interprétation courte et poétique (2-3 phrases max, intimiste et personnelle)",
  "advice": "Un conseil concret pour aujourd'hui (1 phrase)",
  "reflection_question": "Une question introspective profonde (finit par ?)",
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
          max_tokens: 400,
        }),
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json();
        const raw = aiData.choices?.[0]?.message?.content ?? '';
        const parsed = JSON.parse(raw);
        interpretation = parsed;
        reflectionQuestion = parsed.reflection_question ?? reflectionQuestion;
      }
    } catch {
      interpretation = {
        title: `Message de ${card.nom_fr}`,
        summary: `${card.nom_fr} ${orientation === 'upright' ? 'vous invite' : 'vous appelle intérieurement'} à explorer ${keywords}. ${meaning}`,
        advice: `Accordez de l'attention à ce que ${keywords} signifie pour vous aujourd'hui.`,
        reflection_question: reflectionQuestion,
        energy: 'neutre',
      };
    }

    const themes        = getThemesForCard(card.id, orientation);
    const energyScore   = interpretation ? extractEnergyScore(interpretation) : 5;
    // ── NEW: multi-dimensional scoring ──────────────────────────────────────
    const energyDimensions = scoreDimensions(card.id, orientation, interpretation);

    const { data: newDraw, error: insertErr } = await adminClient
      .from('daily_draws')
      .insert({
        user_id: user.id,
        draw_date: today,
        card_id: card.id,
        orientation,
        interpretation,
        reflection_question: reflectionQuestion,
        journal_entry: journalEntry,
        themes,
        energy_score: energyScore,
        energy_dimensions: energyDimensions,
        mood,
      })
      .select('*')
      .single();

    if (insertErr) throw new Error(`Failed to save draw: ${insertErr.message}`);

    return new Response(JSON.stringify({ draw: newDraw, alreadyDrawn: false }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
