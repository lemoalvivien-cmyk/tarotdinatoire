/**
 * daily-draw — Edge Function (v2 — enrichie avec vector similarity)
 *
 * Flux :
 * 1. Auth + vérif tirage existant (idempotent)
 * 2. Sélection déterministe de la carte du jour
 * 3. Génération d'un embedding préliminaire depuis les dimensions fixes
 * 4. Recherche des 3 tirages passés les plus similaires (pgvector cosine)
 * 5. Injection du contexte historique dans le prompt AI → interprétation
 *    hyper-personnalisée et évolutive
 * 6. Insertion en DB + lancement asynchrone de generate-insight (fire & forget)
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
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

// ─── Données thématiques par carte ─────────────────────────────────────────
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

// ─── Scoring énergie multi-dimensionnel ────────────────────────────────────
const CARD_DIMENSION_WEIGHTS: Record<string, [number, number, number, number, number]> = {
  major_00: [6, 5, 4, 7, 8], major_01: [6, 5, 8, 8, 7], major_02: [7, 5, 4, 9, 5],
  major_03: [8, 8, 6, 6, 8], major_04: [5, 5, 9, 7, 7], major_05: [5, 6, 6, 8, 5],
  major_06: [7, 9, 5, 6, 7], major_07: [6, 5, 8, 7, 8], major_08: [7, 6, 7, 6, 8],
  major_09: [6, 3, 4, 9, 4], major_10: [6, 6, 7, 5, 7], major_11: [5, 7, 7, 8, 5],
  major_12: [6, 4, 3, 7, 4], major_13: [5, 4, 5, 6, 6], major_14: [7, 7, 6, 8, 7],
  major_15: [4, 3, 4, 3, 5], major_16: [3, 3, 3, 4, 5], major_17: [8, 7, 6, 8, 8],
  major_18: [5, 5, 3, 4, 5], major_19: [9, 8, 8, 9, 9], major_20: [8, 7, 7, 9, 7],
  major_21: [8, 8, 8, 8, 9],
};

const SUIT_DIMENSION_WEIGHTS: Record<string, [number, number, number, number, number]> = {
  wands: [6, 5, 7, 6, 8], cups: [8, 8, 4, 5, 6],
  swords: [5, 4, 6, 8, 5], pentacles: [5, 5, 8, 6, 7],
};

interface EnergyDimensions {
  emotionnel: number; relations: number; carriere: number;
  clarte: number; vitalite: number;
}

function scoreDimensions(
  cardId: string,
  orientation: 'upright' | 'reversed',
  interpretation: Record<string, unknown> | null,
): EnergyDimensions {
  let base: [number, number, number, number, number];
  if (cardId.startsWith('major_')) {
    base = CARD_DIMENSION_WEIGHTS[cardId] ?? [5, 5, 5, 5, 5];
  } else {
    const suit = cardId.split('_')[1] ?? 'wands';
    base = SUIT_DIMENSION_WEIGHTS[suit] ?? [5, 5, 5, 5, 5];
  }

  let [emotionnel, relations, carriere, clarte, vitalite] = base;

  if (orientation === 'reversed') {
    const invert = (v: number) => Math.round(5 + (5 - v) * 0.6);
    emotionnel = invert(emotionnel); relations = invert(relations);
    carriere   = invert(carriere);   clarte    = invert(clarte);
    vitalite   = invert(vitalite);
  }

  const text = [
    String(interpretation?.summary ?? ''),
    String(interpretation?.advice  ?? ''),
  ].join(' ').toLowerCase();

  const adjustments: Array<[string[], keyof EnergyDimensions, number]> = [
    [['joie', 'bonheur', 'plénitude', 'amour'],            'emotionnel', +1],
    [['tristesse', 'peur', 'angoisse', 'douleur'],         'emotionnel', -1],
    [['amour', 'relation', 'partenaire', 'harmonie'],      'relations',  +1],
    [['conflit', 'séparation', 'rupture', 'isolement'],    'relations',  -1],
    [['succès', 'projet', 'travail', 'carrière'],          'carriere',   +1],
    [['blocage', 'obstacle', 'stagnation', 'échec'],       'carriere',   -1],
    [['clarté', 'intuition', 'conscience', 'révélation'],  'clarte',     +1],
    [['confusion', 'illusion', 'doute', 'brouillard'],     'clarte',     -1],
    [['énergie', 'vitalité', 'force', 'lumière', 'espoir'],'vitalite',   +1],
    [['épuisement', 'fatigue', 'faiblesse', 'lourd'],      'vitalite',   -1],
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
  return orientation === 'reversed' ? base.map(t => `${t} (intérieur)`) : base;
}

function extractEnergyScore(interpretation: Record<string, unknown>): number {
  const summary  = String(interpretation?.summary ?? '');
  const positive = ['joie', 'succès', 'lumière', 'amour', 'force', 'victoire', 'espoir', 'abondance'];
  const negative = ['obstacle', 'défi', 'difficulté', 'peur', 'blocage', 'tension', 'conflit'];
  let score = 5;
  positive.forEach(w => { if (summary.toLowerCase().includes(w)) score = Math.min(score + 1, 10); });
  negative.forEach(w => { if (summary.toLowerCase().includes(w)) score = Math.max(score - 1, 1); });
  return score;
}

// ─── Embedding préliminaire basé sur les dimensions fixes (pour cold-start) ─
// Permet de chercher des voisins même au premier tirage d'une nouvelle carte
function buildPreliminaryEmbedding(
  cardId: string,
  orientation: 'upright' | 'reversed',
  energyScore: number,
  themes: string[],
): string {
  const dims = scoreDimensions(cardId, orientation, null);
  // Normaliser les 5 dimensions sur [0,1] et les répéter sur 32 dims
  const d = [
    dims.emotionnel / 10, dims.relations / 10, dims.carriere / 10,
    dims.clarte / 10,     dims.vitalite / 10,  energyScore / 10,
  ];
  // Padding déterministe à 32 dims (thèmes hashés, orientation, type de carte)
  const themeHash = themes.reduce((acc, t) => acc + t.charCodeAt(0) % 100, 0) / 100;
  const isMajor   = cardId.startsWith('major_') ? 1.0 : 0.0;
  const isRev     = orientation === 'reversed'   ? 1.0 : 0.0;
  const vec32 = [
    ...d,
    themeHash, isMajor, isRev, energyScore / 10,
    // Remplissage cyclique avec variations
    ...Array.from({ length: 22 }, (_, i) => d[i % d.length] * (0.8 + (i * 0.01))),
  ].slice(0, 32);

  // Normalisation L2
  const norm = Math.sqrt(vec32.reduce((s, v) => s + v * v, 0)) || 1;
  const normalized = vec32.map(v => Math.round((v / norm) * 10000) / 10000);
  return `[${normalized.join(',')}]`;
}

// ─── Type pour les tirages similaires ──────────────────────────────────────
interface SimilarDraw {
  draw_id:      string;
  card_id:      string;
  orientation:  string;
  themes:       string[];
  energy_score: number;
  draw_date:    string;
  similarity:   number;
  card_name?:   string;
  interpretation_summary?: string;
}

// ─── Recherche pgvector des tirages similaires ─────────────────────────────
async function findSimilarDraws(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  prelimEmbedding: string,
  limit = 3,
): Promise<SimilarDraw[]> {
  try {
    // Appel SQL direct via rpc find_similar_draws (service_role)
    const { data, error } = await adminClient.rpc('find_similar_draws', {
      p_user_id:    userId,
      p_embedding:  prelimEmbedding,
      p_limit:      limit,
      p_exclude_id: null,
    });

    if (error || !data?.length) return [];

    // Enrichir avec les noms de cartes et les résumés d'interprétation
    const drawIds  = data.map((r: SimilarDraw) => r.draw_id);
    const cardIds  = [...new Set(data.map((r: SimilarDraw) => r.card_id))];

    const [cardsResult, drawsResult] = await Promise.all([
      adminClient.from('tarot_cards').select('id, nom_fr').in('id', cardIds),
      adminClient.from('daily_draws')
        .select('id, interpretation')
        .in('id', drawIds),
    ]);

    const cardMap = new Map((cardsResult.data ?? []).map(
      (c: { id: string; nom_fr: string }) => [c.id, c.nom_fr]
    ));
    const drawMap = new Map((drawsResult.data ?? []).map(
      (d: { id: string; interpretation: Record<string, unknown> | null }) => [
        d.id,
        String((d.interpretation as Record<string, unknown>)?.summary ?? ''),
      ]
    ));

    return data.map((r: SimilarDraw) => ({
      ...r,
      card_name: cardMap.get(r.card_id) ?? r.card_id,
      interpretation_summary: drawMap.get(r.draw_id) ?? '',
    }));
  } catch {
    return [];
  }
}

// ─── Construction du contexte historique pour le prompt ────────────────────
function buildHistoryContext(similarDraws: SimilarDraw[]): string {
  if (!similarDraws.length) return '';

  const lines = similarDraws.map((d, i) => {
    const simPct = Math.round(d.similarity * 100);
    const themes = (d.themes ?? []).slice(0, 2).join(', ');
    const summary = d.interpretation_summary
      ? `"${d.interpretation_summary.slice(0, 120)}…"`
      : '(aucun résumé)';
    return [
      `  ${i + 1}. Carte : ${d.card_name} (${d.orientation === 'upright' ? 'endroit' : 'renversée'})`,
      `     Date : ${d.draw_date} | Similarité : ${simPct}% | Énergie : ${d.energy_score}/10`,
      `     Thèmes : ${themes || 'N/A'}`,
      `     Essence : ${summary}`,
    ].join('\n');
  });

  return `\n\n🔮 RÉSONANCES DE TON VOYAGE (${similarDraws.length} tirages similaires détectés) :
Ces moments de ton passé vibrent en harmonie avec ce tirage d'aujourd'hui :
${lines.join('\n\n')}

Intègre ces résonances dans ton interprétation : montre comment le chemin parcouru
éclaire le message d'aujourd'hui. Crée une continuité narrative poétique et évolutive.`;
}

// ─── Handler principal ─────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin  = req.headers.get('Origin');
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
    const workerSecret = Deno.env.get('WORKER_SECRET') ?? '';

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

    // ── Idempotence : tirage existant ? ─────────────────────────────────
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

    // ── Lecture optionnelle du body ──────────────────────────────────────
    let journalEntry: string | null = null;
    let mood: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        journalEntry = body?.journal_entry ?? null;
        mood         = body?.mood ?? null;
      } catch { /* no body */ }
    }

    // ── Chargement des cartes ────────────────────────────────────────────
    const { data: cards, error: cardsErr } = await adminClient
      .from('tarot_cards')
      .select('id, nom_fr, type, meaning_upright_fr, meaning_reversed_fr, keywords_fr')
      .limit(78);

    if (cardsErr || !cards?.length) throw new Error('Could not load tarot cards');

    const seed        = user.id.charCodeAt(0) + new Date().getDate() + new Date().getMonth();
    const idx         = seed % cards.length;
    const card        = cards[idx];
    const orientation = (seed % 5 === 0 ? 'reversed' : 'upright') as 'upright' | 'reversed';

    const meaning  = orientation === 'upright'
      ? card.meaning_upright_fr  ?? 'Guidance et clarté'
      : card.meaning_reversed_fr ?? 'Réflexion intérieure';
    const keywords = (card.keywords_fr ?? []).slice(0, 3).join(', ') || 'transformation';
    const themes   = getThemesForCard(card.id, orientation);

    // ── Embedding préliminaire pour la recherche de similarité ───────────
    const prelimEmbedding = buildPreliminaryEmbedding(
      card.id, orientation,
      5, // energy score neutre avant l'interprétation
      themes,
    );

    // ── Recherche pgvector des tirages similaires (silencieux si vide) ───
    const similarDraws = await findSimilarDraws(
      adminClient, user.id, prelimEmbedding, 3,
    );

    // ── Contexte historique à injecter dans le prompt ────────────────────
    const historyContext = buildHistoryContext(similarDraws);
    const hasHistory     = similarDraws.length > 0;

    // ── Génération de l'interprétation par Lovable AI ────────────────────
    let interpretation: Record<string, unknown> | null = null;
    let reflectionQuestion = "Quelle émotion cette carte éveille-t-elle en vous aujourd'hui ?";

    try {
      const personalizedNote = hasHistory
        ? `\n\nIMPORTANT : Cette personne a un historique de tirages. Tu dois créer une interprétation
évolutive et continue, comme si tu suivais son voyage spirituel dans le temps.
Fais référence à sa progression, ses thèmes récurrents, son arc émotionnel.${historyContext}`
        : '';

      const prompt = `Tu es un oracle de tarot bienveillant, poétique et profondément intuitif.
Tu accompagnes cette personne dans son voyage intérieur depuis le début.
Génère une interprétation QUOTIDIENNE pour la carte "${card.nom_fr}" (${orientation === 'upright' ? "à l'endroit" : 'renversée'}).

Signification : ${meaning}
Mots-clés : ${keywords}${personalizedNote}

Réponds UNIQUEMENT en JSON valide avec exactement ces champs :
{
  "title": "Message du jour (max 8 mots, poétique et personnalisé)",
  "summary": "Interprétation ${hasHistory ? 'évolutive et narrative' : 'courte et poétique'} (2-3 phrases${hasHistory ? ', inclut une référence subtile au chemin parcouru' : ''})",
  "advice": "Un conseil concret pour aujourd'hui (1 phrase, actionnable)",
  "reflection_question": "Une question introspective profonde liée à ${hasHistory ? 'cette continuité' : 'cette carte'} (finit par ?)",
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
          max_tokens: 450,
        }),
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json();
        const raw    = aiData.choices?.[0]?.message?.content ?? '';
        const parsed = JSON.parse(raw);
        interpretation    = parsed;
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

    const energyScore      = interpretation ? extractEnergyScore(interpretation) : 5;
    const energyDimensions = scoreDimensions(card.id, orientation, interpretation);

    // ── Insertion du tirage ──────────────────────────────────────────────
    const { data: newDraw, error: insertErr } = await adminClient
      .from('daily_draws')
      .insert({
        user_id:            user.id,
        draw_date:          today,
        card_id:            card.id,
        orientation,
        interpretation,
        reflection_question: reflectionQuestion,
        journal_entry:      journalEntry,
        themes,
        energy_score:       energyScore,
        energy_dimensions:  energyDimensions,
        mood,
      })
      .select('*')
      .single();

    if (insertErr) throw new Error(`Failed to save draw: ${insertErr.message}`);

    // ── Fire & forget : génération de l'embedding précis (async) ────────
    // On ne bloque pas la réponse utilisateur — l'embedding s'améliore en
    // arrière-plan avec le contenu réel de l'interprétation.
    const insightPayload = {
      draw_id:      newDraw.id,
      user_id:      user.id,
      card_id:      card.id,
      orientation,
      themes,
      energy_score: energyScore,
      interpretation,
    };

    // Appel non-bloquant via EdgeRuntime.waitUntil si disponible, sinon fetch
    const insightUrl = `${supabaseUrl}/functions/v1/generate-insight`;
    const insightFetch = fetch(insightUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': workerSecret,
      },
      body: JSON.stringify(insightPayload),
    }).catch(() => { /* silent fail — non critique */ });

    // Utiliser waitUntil si disponible (Deno Deploy), sinon ignorer
    try {
      // @ts-ignore — EdgeRuntime est disponible en Deno Deploy
      if (typeof EdgeRuntime !== 'undefined') {
        // @ts-ignore
        EdgeRuntime.waitUntil(insightFetch);
      }
    } catch { /* environnement sans EdgeRuntime */ }

    return new Response(
      JSON.stringify({
        draw:            newDraw,
        alreadyDrawn:    false,
        hasPersonalized: hasHistory,
        resonances:      similarDraws.length,
      }),
      { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }
});
