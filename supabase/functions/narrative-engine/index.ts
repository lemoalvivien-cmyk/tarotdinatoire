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
interface CardFrequency { card_id: string; cnt: number }
interface CardRow { id: string; nom_fr: string; type: string; keywords_fr: string[] | null }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function detectEmotionalDirection(energyHistory: { score: number }[]): string {
  if (energyHistory.length < 3) return 'stable';
  const first = energyHistory.slice(0, Math.ceil(energyHistory.length / 2));
  const last  = energyHistory.slice(Math.floor(energyHistory.length / 2));
  const avgFirst = first.reduce((a, b) => a + b.score, 0) / first.length;
  const avgLast  = last.reduce((a, b) => a + b.score, 0) / last.length;
  const diff = avgLast - avgFirst;
  if (diff > 1.5)  return 'ascending';
  if (diff < -1.5) return 'descending';
  const variance = energyHistory.reduce((acc, h) => acc + Math.abs(h.score - 5), 0) / energyHistory.length;
  return variance > 2 ? 'mixed' : 'stable';
}

function buildNarrativePrompt(params: {
  cardFrequencies: CardFrequency[];
  cardMap: Map<string, CardRow>;
  topThemes: { theme: string; count: number }[];
  totalReadings: number;
  dailyDrawCount: number;
  currentStreak: number;
  emotionalDirection: string;
  avgEnergy: number;
  dateStart: string;
  dateEnd: string;
  recentInterpretations: string[];
  uprightCount: number;
  reversedCount: number;
}): string {
  const cardList = params.cardFrequencies
    .slice(0, 5)
    .map(cf => {
      const c = params.cardMap.get(cf.card_id);
      return c ? `${c.nom_fr} (×${cf.cnt})` : `${cf.card_id} (×${cf.cnt})`;
    })
    .join(', ');

  const themeList = params.topThemes
    .slice(0, 6)
    .map(t => t.theme)
    .join(', ');

  const emotionLabel: Record<string, string> = {
    ascending:  'en progression positive',
    descending: 'en période de défi',
    stable:     'stable et équilibrée',
    mixed:      'en évolution contrastée',
  };

  const recentCtx = params.recentInterpretations.slice(0, 3).join(' | ');

  return `Tu es un oracle sage qui connaît en profondeur le voyage intérieur de cet utilisateur.

DONNÉES DE SON VOYAGE (${params.dateStart} → ${params.dateEnd}) :
- Total tirages : ${params.totalReadings} tirages + ${params.dailyDrawCount} rituels quotidiens
- Série actuelle : ${params.currentStreak} jours consécutifs
- Cartes les plus fréquentes : ${cardList || 'données insuffisantes'}
- Thèmes récurrents : ${themeList || 'aucun encore détecté'}
- Énergie globale : ${params.avgEnergy}/10 (${emotionLabel[params.emotionalDirection] ?? 'stable'})
- Orientation : ${params.uprightCount} cartes à l'endroit, ${params.reversedCount} renversées
- Extraits récents : ${recentCtx || 'premier tirage'}

CONSIGNES :
- Écris en français, voix bienveillante et poétique
- Parle à la 2ème personne (tu/vous interchangeable)
- Mentionne les cartes récurrentes NOMMÉMENT
- Identifie les patterns psychologiques profonds
- Donne un sens narratif à la progression temporelle
- 3-4 paragraphes, 180-280 mots au total
- Commence par : "Dans votre voyage récent..." ou "Ces dernières semaines..."
- Termine par un encouragement ou une invitation à la réflexion

Génère UNIQUEMENT le texte narratif, sans titre ni JSON.`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin  = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Auth
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
    const body = await req.json().catch(() => ({}));
    const limitDays = (body.limit_days as number) ?? 90;
    const forceRefresh = (body.force_refresh as boolean) ?? false;

    // ── Check for recent cached narrative (skip if < 6h old) ─────────────
    if (!forceRefresh) {
      const { data: cached } = await adminClient
        .from('narrative_memories')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return new Response(JSON.stringify({ narrative: cached, fresh: false }), {
          status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Fetch card patterns via DB function ───────────────────────────────
    const [patternsResp, themesResp] = await Promise.all([
      adminClient.rpc('get_card_patterns', { uid: user.id, limit_days: limitDays }),
      adminClient.rpc('get_theme_patterns', { uid: user.id, limit_days: limitDays }),
    ]);

    const patterns = patternsResp.data as {
      card_frequencies: CardFrequency[];
      orientation_split: { upright: number; reversed: number };
      total_readings: number;
      date_range_start: string;
      date_range_end: string;
    } | null;

    const themes = themesResp.data as {
      top_themes: { theme: string; count: number }[];
      energy_trend: { date: string; score: number }[];
    } | null;

    const cardFrequencies: CardFrequency[] = patterns?.card_frequencies ?? [];
    const totalReadings = patterns?.total_readings ?? 0;
    const dateStart = patterns?.date_range_start ?? new Date().toISOString().split('T')[0];
    const dateEnd   = patterns?.date_range_end   ?? new Date().toISOString().split('T')[0];
    const topThemes = themes?.top_themes ?? [];
    const energyHistory = themes?.energy_trend ?? [];
    const uprightCount  = patterns?.orientation_split?.upright ?? 0;
    const reversedCount = patterns?.orientation_split?.reversed ?? 0;

    // ── Fetch card details for named mentions ─────────────────────────────
    const cardIds = cardFrequencies.map(cf => cf.card_id);
    const cardMap = new Map<string, CardRow>();

    if (cardIds.length > 0) {
      const { data: cardRows } = await adminClient
        .from('tarot_cards')
        .select('id, nom_fr, type, keywords_fr')
        .in('id', cardIds);
      (cardRows ?? []).forEach((c: CardRow) => cardMap.set(c.id, c));
    }

    // ── Fetch daily draw stats ────────────────────────────────────────────
    const { count: dailyDrawCount } = await adminClient
      .from('daily_draws')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data: streakData } = await adminClient
      .rpc('get_user_streak', { uid: user.id });
    const currentStreak = (streakData as number) ?? 0;

    // ── Collect recent interpretations for context ────────────────────────
    const { data: recentResults } = await adminClient
      .from('reading_results')
      .select('interpretation, created_at, session_id')
      .order('created_at', { ascending: false })
      .limit(5);

    const recentInterpretations: string[] = [];
    for (const r of (recentResults ?? [])) {
      const interp = r.interpretation as Record<string, unknown> | null;
      const summary = interp?.summary ?? interp?.general;
      if (typeof summary === 'string' && summary.length > 0) {
        recentInterpretations.push(summary.slice(0, 120));
      }
    }

    // ── Detect emotional direction ────────────────────────────────────────
    const emotionalDirection = detectEmotionalDirection(energyHistory);
    const avgEnergy = energyHistory.length
      ? Math.round(energyHistory.reduce((a, b) => a + b.score, 0) / energyHistory.length)
      : 5;

    // ── Generate AI narrative ─────────────────────────────────────────────
    const narrativePrompt = buildNarrativePrompt({
      cardFrequencies,
      cardMap,
      topThemes,
      totalReadings,
      dailyDrawCount: dailyDrawCount ?? 0,
      currentStreak,
      emotionalDirection,
      avgEnergy,
      dateStart,
      dateEnd,
      recentInterpretations,
      uprightCount,
      reversedCount,
    });

    let summaryText = '';

    // Fallback if not enough data
    if (totalReadings === 0 && (dailyDrawCount ?? 0) === 0) {
      summaryText = "Votre voyage intérieur avec le tarot commence aujourd'hui. Chaque carte que vous tirerez deviendra une page de votre histoire. Revenez ici après quelques lectures pour découvrir les patterns qui se dessinent dans votre chemin.";
    } else {
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
              { role: 'system', content: 'Tu es un oracle de tarot bienveillant qui aide les utilisateurs à comprendre leur voyage intérieur. Tes réponses sont poétiques, bienveillantes et perspicaces.' },
              { role: 'user', content: narrativePrompt },
            ],
            max_tokens: 600,
            temperature: 0.85,
          }),
        });

        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: 'RATE_LIMITED', message: 'Limite de requêtes atteinte. Réessayez dans quelques minutes.' }), {
            status: 429, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        if (aiResp.status === 402) {
          return new Response(JSON.stringify({ error: 'PAYMENT_REQUIRED', message: 'Crédits insuffisants.' }), {
            status: 402, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          summaryText = aiData.choices?.[0]?.message?.content?.trim() ?? '';
        }
      } catch (aiErr) {
        console.error('AI narrative generation failed:', aiErr);
      }

      // Fallback narrative if AI failed
      if (!summaryText) {
        const topCard = cardFrequencies[0] ? (cardMap.get(cardFrequencies[0].card_id)?.nom_fr ?? 'une carte') : 'les cartes';
        const topThemeStr = topThemes[0]?.theme ?? 'la transformation';
        summaryText = `Dans vos ${totalReadings} tirage${totalReadings > 1 ? 's' : ''} récents, ${topCard} s'est manifesté${cardFrequencies[0]?.cnt > 1 ? ` ${cardFrequencies[0].cnt} fois` : ''}, portant avec lui le thème de ${topThemeStr}. Votre énergie globale de ${avgEnergy}/10 témoigne d'une période ${emotionalDirection === 'ascending' ? 'en montée' : emotionalDirection === 'descending' ? 'exigeante' : 'équilibrée'}. Continuez votre rituel quotidien — les patterns se révèlent avec la régularité.`;
      }
    }

    // ── Build key cards list ──────────────────────────────────────────────
    const keyCards = cardFrequencies.slice(0, 5).map(cf => ({
      card_id: cf.card_id,
      card_name: cardMap.get(cf.card_id)?.nom_fr ?? cf.card_id,
      count: cf.cnt,
      keywords: (cardMap.get(cf.card_id)?.keywords_fr ?? []).slice(0, 3),
    }));

    const extractedThemes = topThemes.slice(0, 8).map(t => t.theme);

    // ── Save to narrative_memories via service role ───────────────────────
    const { data: saved, error: saveErr } = await adminClient
      .from('narrative_memories')
      .insert({
        user_id: user.id,
        summary: summaryText,
        themes: extractedThemes,
        key_cards: keyCards,
        emotional_arc: `Énergie moyenne : ${avgEnergy}/10`,
        emotional_direction: emotionalDirection,
        time_range_start: dateStart,
        time_range_end: dateEnd,
        reading_count: totalReadings + (dailyDrawCount ?? 0),
        pattern_data: {
          card_frequencies: cardFrequencies,
          orientation_split: patterns?.orientation_split,
          top_themes: topThemes,
          energy_history: energyHistory.slice(-30),
          streak: currentStreak,
          avg_energy: avgEnergy,
        },
      })
      .select('*')
      .single();

    if (saveErr) {
      console.error('Failed to save narrative:', saveErr.message);
    }

    const result = saved ?? {
      id: crypto.randomUUID(),
      user_id: user.id,
      summary: summaryText,
      themes: extractedThemes,
      key_cards: keyCards,
      emotional_arc: `Énergie moyenne : ${avgEnergy}/10`,
      emotional_direction: emotionalDirection,
      time_range_start: dateStart,
      time_range_end: dateEnd,
      reading_count: totalReadings + (dailyDrawCount ?? 0),
      pattern_data: { card_frequencies: cardFrequencies, top_themes: topThemes, streak: currentStreak, avg_energy: avgEnergy },
      created_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ narrative: result, fresh: true }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('narrative-engine error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
});
