/**
 * export-user-data — RGPD Article 20 compliant data portability
 *
 * Security:
 *  - JWT validated via supabase.auth.getUser()
 *  - Service role fetches all tables (bypasses RLS)
 *  - Returns comprehensive JSON dump of all user-owned data
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

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ── Authenticate user ────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch all user data with service role (bypasses RLS) ─────────────────
    const admin = createClient(supabaseUrl, serviceKey);
    const uid = user.id;

    const [
      profileRes,
      sessionsRes,
      resultsRes,
      dailyDrawsRes,
      consentLogsRes,
      karmaRes,
      achievementsRes,
      analyticsRes,
      narrativeRes,
      syncRes,
      leadsRes,
    ] = await Promise.all([
      admin.from('profiles').select('*').eq('id', uid).maybeSingle(),
      admin.from('reading_sessions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1000),
      admin.from('reading_results').select('rr.*').from('reading_results as rr').innerJoin('reading_sessions as rs', 'rr.session_id', 'rs.id').eq('rs.user_id', uid).limit(1000),
      admin.from('daily_draws').select('*').eq('user_id', uid).order('draw_date', { ascending: false }).limit(365),
      admin.from('consent_logs').select('id, anon_id, choices, created_at, updated_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(100),
      admin.from('user_karma').select('*').eq('user_id', uid).maybeSingle(),
      admin.from('user_achievements').select('*').eq('user_id', uid),
      admin.from('analytics_events').select('event_name, props, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(500),
      admin.from('narrative_memories').select('*').eq('user_id', uid),
      admin.from('synchronicity_insights').select('insights, patterns, generated_at').eq('user_id', uid),
      admin.from('email_leads').select('email, first_name, consent, consent_timestamp, consent_text, email_verified, unsubscribed_at, created_at').eq('user_id', uid),
    ]);

    // Fetch reading results via session IDs
    const sessionIds = (sessionsRes.data ?? []).map((s: { id: string }) => s.id);
    const readingResultsData = sessionIds.length > 0
      ? (await admin.from('reading_results').select('*').in('session_id', sessionIds)).data ?? []
      : [];

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '2.0',
      gdprBasis: 'Article 20 RGPD — Droit à la portabilité des données',
      controller: 'VLM Consulting — contact@tarotdivinatoire.app',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile: profileRes.data ?? null,
      readings: {
        sessions: sessionsRes.data ?? [],
        results: readingResultsData,
      },
      daily_draws: dailyDrawsRes.data ?? [],
      karma: karmaRes.data ?? null,
      achievements: achievementsRes.data ?? [],
      narrative_memories: narrativeRes.data ?? [],
      synchronicity_insights: syncRes.data ?? [],
      email_subscriptions: leadsRes.data ?? [],
      consent_history: consentLogsRes.data ?? [],
      analytics_events_sample: analyticsRes.data ?? [],
    };

    // Log RGPD export event
    await admin.from('admin_audit_logs').insert({
      action: 'rgpd_data_export',
      admin_user_id: uid,
      target_id: uid,
      target_type: 'user',
      metadata: {
        export_date: exportData.exportDate,
        tables_included: Object.keys(exportData).filter(k => !['exportDate', 'exportVersion', 'gdprBasis', 'controller', 'user'].includes(k)),
      },
    });

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tarot-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erreur interne' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }
});
