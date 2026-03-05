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

function getThemesForCard(cardId: string, orientation: string): string[] {
  const base = THEMES_MAP[cardId] ?? ['guidance', 'réflexion', 'transformation'];
  if (orientation === 'reversed') {
    return base.map(t => `${t} (intérieur)`);
  }
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

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
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

    // Verify user identity
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
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC

    // ── Check if already drawn today ──────────────────────────────────────
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

    // ── Parse body for optional journal/mood (POST with body) ─────────────
    let journalEntry: string | null = null;
    let mood: string | null = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        journalEntry = body?.journal_entry ?? null;
        mood = body?.mood ?? null;
      } catch { /* no body */ }
    }

    // ── Pick a random card ───────────────────────────────────────────────
    const { data: cards, error: cardsErr } = await adminClient
      .from('tarot_cards')
      .select('id, nom_fr, type, meaning_upright_fr, meaning_reversed_fr, keywords_fr')
      .limit(78);

    if (cardsErr || !cards?.length) throw new Error('Could not load tarot cards');

    const seed = user.id.charCodeAt(0) + new Date().getDate() + new Date().getMonth();
    const idx  = seed % cards.length;
    const card = cards[idx];
    const orientation = seed % 5 === 0 ? 'reversed' : 'upright';

    const meaning = orientation === 'upright'
      ? card.meaning_upright_fr ?? 'Guidance et clarté'
      : card.meaning_reversed_fr ?? 'Réflexion intérieure';

    const keywords = (card.keywords_fr ?? []).slice(0, 3).join(', ') || 'transformation';

    // ── Generate AI interpretation ────────────────────────────────────────
    let interpretation: Record<string, unknown> | null = null;
    let reflectionQuestion = 'Quelle émotion cette carte éveille-t-elle en vous aujourd\'hui ?';

    try {
      const prompt = `Tu es un oracle de tarot bienveillant et poétique. Génère une interprétation QUOTIDIENNE courte pour la carte "${card.nom_fr}" (${orientation === 'upright' ? 'à l\'endroit' : 'renversée'}).

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

      const aiResp = await fetch('https://api.lovable.ai/v1/chat/completions', {
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
      // Fallback to template interpretation
      interpretation = {
        title: `Message de ${card.nom_fr}`,
        summary: `${card.nom_fr} ${orientation === 'upright' ? 'vous invite' : 'vous appelle intérieurement'} à explorer ${keywords}. ${meaning}`,
        advice: `Accordez de l'attention à ce que ${keywords} signifie pour vous aujourd'hui.`,
        reflection_question: reflectionQuestion,
        energy: 'neutre',
      };
    }

    const themes = getThemesForCard(card.id, orientation);
    const energyScore = interpretation ? extractEnergyScore(interpretation) : 5;

    // ── Save draw ─────────────────────────────────────────────────────────
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
