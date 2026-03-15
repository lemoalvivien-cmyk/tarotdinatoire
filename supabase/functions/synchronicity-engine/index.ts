import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Zero Trust CORS allowlist — no wildcard ────────────────────────────────
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

interface RecurringCard {
  card_id: string;
  count: number;
  last_seen: string;
}

interface NumberPattern {
  numero: number;
  count: number;
  card_ids: string[];
}

interface Combination {
  card_a: string;
  card_b: string;
  count: number;
}

interface MonthCard {
  card_id: string;
  count: number;
}

interface SyncPatterns {
  recurring_cards: RecurringCard[];
  this_month: MonthCard[];
  number_patterns: NumberPattern[];
  combinations: Combination[];
  total_sessions: number;
  total_daily_draws: number;
}

interface CardRow {
  id: string;
  nom_fr: string;
  type: string;
  numero: number | null;
  keywords_fr: string[] | null;
}

interface SynchronicityInsight {
  type: 'recurring_card' | 'monthly_return' | 'number_pattern' | 'combination' | 'general';
  icon: string;
  title: string;
  body: string;
  intensity: 'low' | 'medium' | 'high';
  card_ids: string[];
}

function buildInsightPrompt(patterns: SyncPatterns, cardMap: Map<string, CardRow>): string {
  const lines: string[] = [];

  lines.push(`Tu es un oracle de tarot expert. Génère des insights de synchronicité en JSON.`);
  lines.push(`Données de l'utilisateur sur les 90 derniers jours :`);
  lines.push(`- Sessions de tirage : ${patterns.total_sessions}`);
  lines.push(`- Tirages quotidiens : ${patterns.total_daily_draws}`);

  if (patterns.recurring_cards?.length > 0) {
    lines.push(`\nCartes récurrentes :`);
    for (const rc of patterns.recurring_cards.slice(0, 5)) {
      const card = cardMap.get(rc.card_id);
      if (card) {
        lines.push(`  - "${card.nom_fr}" apparaît ${rc.count} fois (dernière fois : ${rc.last_seen})`);
      }
    }
  }

  if (patterns.this_month?.length > 0) {
    lines.push(`\nCe mois-ci :`);
    for (const mc of patterns.this_month.slice(0, 3)) {
      const card = cardMap.get(mc.card_id);
      if (card) lines.push(`  - "${card.nom_fr}" : ${mc.count} fois`);
    }
  }

  if (patterns.number_patterns?.length > 0) {
    lines.push(`\nChiffres qui se répètent (Arcanes Majeurs) :`);
    for (const np of patterns.number_patterns.slice(0, 3)) {
      lines.push(`  - Numéro ${np.numero} : ${np.count} fois`);
    }
  }

  if (patterns.combinations?.length > 0) {
    lines.push(`\nCombinaisons récurrentes :`);
    for (const combo of patterns.combinations.slice(0, 3)) {
      const ca = cardMap.get(combo.card_a);
      const cb = cardMap.get(combo.card_b);
      if (ca && cb) {
        lines.push(`  - "${ca.nom_fr}" + "${cb.nom_fr}" : ${combo.count} sessions ensemble`);
      }
    }
  }

  lines.push(`\nGénère exactement 3 à 5 insights de synchronicité en français.
Chaque insight est concret, poétique, et parle à l'utilisateur ("vous" / "tu").
Exemples de formulations :
- "C'est la 3e fois ce mois que L'Étoile vous visite. Une renaissance intérieure s'annonce."
- "Le chiffre 7 résonne dans 4 tirages. Le cycle de la réflexion est en marche."
- "La Tour et La Lune se retrouvent ensemble pour la 2e fois. Une transformation profonde s'opère."

Réponds UNIQUEMENT avec ce JSON (sans markdown) :
{
  "insights": [
    {
      "type": "recurring_card"|"monthly_return"|"number_pattern"|"combination"|"general",
      "icon": "⭐"|"🌙"|"🔢"|"🃏"|"✨",
      "title": "titre court (5 mots max)",
      "body": "phrase narrative (20-40 mots)",
      "intensity": "low"|"medium"|"high",
      "card_ids": ["card_id_1"]
    }
  ]
}`);

  return lines.join('\n');
}

function generateFallbackInsights(patterns: SyncPatterns, cardMap: Map<string, CardRow>): SynchronicityInsight[] {
  const insights: SynchronicityInsight[] = [];

  // Monthly returns
  for (const mc of (patterns.this_month ?? []).slice(0, 2)) {
    const card = cardMap.get(mc.card_id);
    if (!card) continue;
    const ordinal = mc.count === 2 ? '2e' : mc.count === 3 ? '3e' : `${mc.count}e`;
    insights.push({
      type: 'monthly_return',
      icon: '🔄',
      title: `${card.nom_fr} revient`,
      body: `C'est la ${ordinal} fois ce mois que ${card.nom_fr} se manifeste dans vos tirages. Ce thème mérite votre attention.`,
      intensity: mc.count >= 3 ? 'high' : 'medium',
      card_ids: [mc.card_id],
    });
  }

  // Recurring over 90 days
  for (const rc of (patterns.recurring_cards ?? []).slice(0, 2)) {
    const card = cardMap.get(rc.card_id);
    if (!card) continue;
    if (insights.some(i => i.card_ids.includes(rc.card_id))) continue;
    insights.push({
      type: 'recurring_card',
      icon: '🃏',
      title: `Carte récurrente`,
      body: `${card.nom_fr} est apparu ${rc.count} fois en 90 jours. Son énergie accompagne durablement votre parcours.`,
      intensity: rc.count >= 4 ? 'high' : 'medium',
      card_ids: [rc.card_id],
    });
  }

  // Number patterns
  for (const np of (patterns.number_patterns ?? []).slice(0, 1)) {
    insights.push({
      type: 'number_pattern',
      icon: '🔢',
      title: `Numéro ${np.numero} récurrent`,
      body: `Le chiffre ${np.numero} résonne dans ${np.count} de vos tirages d'Arcanes Majeurs. Ce vibration numérique porte un message.`,
      intensity: np.count >= 3 ? 'high' : 'low',
      card_ids: np.card_ids ?? [],
    });
  }

  // Combinations
  for (const combo of (patterns.combinations ?? []).slice(0, 1)) {
    const ca = cardMap.get(combo.card_a);
    const cb = cardMap.get(combo.card_b);
    if (ca && cb) {
      insights.push({
        type: 'combination',
        icon: '🌀',
        title: `Alliance répétée`,
        body: `${ca.nom_fr} et ${cb.nom_fr} se retrouvent ensemble ${combo.count} fois. Cette alliance de cartes révèle une dynamique profonde.`,
        intensity: combo.count >= 3 ? 'high' : 'medium',
        card_ids: [combo.card_a, combo.card_b],
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: 'general',
      icon: '✨',
      title: 'Voyage en cours',
      body: `Continuez vos tirages — les synchronicités émergent avec le temps et la régularité de votre pratique.`,
      intensity: 'low',
      card_ids: [],
    });
  }

  return insights;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')!;

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Parse optional force flag
    const body = await req.json().catch(() => ({}));
    const forceRefresh = body?.force === true;

    // Check cache (6h)
    if (!forceRefresh) {
      const { data: cached } = await adminClient
        .from('synchronicity_insights')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return new Response(JSON.stringify({
          insights: cached.insights,
          patterns: cached.patterns,
          total_readings: cached.total_readings,
          cached: true,
        }), { headers });
      }
    }

    // Get synchronicity patterns from DB
    const { data: patternsData, error: patternsErr } = await adminClient
      .rpc('get_synchronicity_patterns', { uid: user.id });

    if (patternsErr) throw patternsErr;

    const patterns = patternsData as SyncPatterns;

    // Collect all card IDs we need
    const allCardIds = new Set<string>();
    (patterns.recurring_cards ?? []).forEach(r => allCardIds.add(r.card_id));
    (patterns.this_month ?? []).forEach(m => allCardIds.add(m.card_id));
    (patterns.number_patterns ?? []).forEach(np => np.card_ids?.forEach(id => allCardIds.add(id)));
    (patterns.combinations ?? []).forEach(c => { allCardIds.add(c.card_a); allCardIds.add(c.card_b); });

    // Fetch card metadata
    const cardMap = new Map<string, CardRow>();
    if (allCardIds.size > 0) {
      const { data: cards } = await adminClient
        .from('tarot_cards')
        .select('id, nom_fr, type, numero, keywords_fr')
        .in('id', Array.from(allCardIds));
      (cards ?? []).forEach((c: CardRow) => cardMap.set(c.id, c));
    }

    // Total readings
    const totalReadings = (patterns.total_sessions ?? 0) + (patterns.total_daily_draws ?? 0);

    // Generate AI insights
    let insights: SynchronicityInsight[] = [];
    const hasEnoughData = totalReadings >= 3;

    if (hasEnoughData && lovableKey) {
      try {
        const prompt = buildInsightPrompt(patterns, cardMap);
        const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1200,
            temperature: 0.75,
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          let raw = aiJson.choices?.[0]?.message?.content ?? '';
          raw = raw.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.insights) && parsed.insights.length > 0) {
            insights = parsed.insights;
          } else {
            insights = generateFallbackInsights(patterns, cardMap);
          }
        } else {
          insights = generateFallbackInsights(patterns, cardMap);
        }
      } catch {
        insights = generateFallbackInsights(patterns, cardMap);
      }
    } else {
      insights = generateFallbackInsights(patterns, cardMap);
    }

    // Cache result
    await adminClient.from('synchronicity_insights').upsert({
      user_id: user.id,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      insights,
      patterns,
      total_readings: totalReadings,
    }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      insights,
      patterns,
      total_readings: totalReadings,
      cached: false,
    }), { headers });

  } catch (err) {
    console.error('[synchronicity-engine] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
  }
});
