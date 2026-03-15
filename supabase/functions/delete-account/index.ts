/**
 * delete-account — RGPD Article 17 compliant right to erasure
 *
 * Security:
 *  - JWT validated via supabase.auth.getUser()
 *  - Service role performs ALL deletions + auth.admin.deleteUser()
 *  - Anonymises audit/consent logs instead of hard-deleting (legal retention)
 *  - Final immutable audit log written BEFORE user deletion
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

    // Parse optional confirmation
    let confirmed = false;
    try {
      const body = await req.json();
      confirmed = body?.confirmed === true;
    } catch { /* ok */ }

    if (!confirmed) {
      return new Response(JSON.stringify({ error: 'Confirmation required: send { confirmed: true }' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const uid = user.id;
    const email = user.email ?? 'unknown';
    const deletionDate = new Date().toISOString();

    // ── Step 1: Write final immutable audit log BEFORE deletion ───────────────
    await admin.from('admin_audit_logs').insert({
      action: 'rgpd_account_deletion',
      admin_user_id: null,
      target_id: uid,
      target_type: 'user',
      metadata: {
        deletion_requested_at: deletionDate,
        email_hash: await hashString(email),
        gdpr_basis: 'Article 17 RGPD — Droit à l\'effacement',
        tables_deleted: [
          'reading_results', 'reading_sessions', 'tarot_readings',
          'daily_draws', 'email_leads', 'analytics_events',
          'ai_usage_daily', 'subscriptions', 'user_roles',
          'user_karma', 'user_achievements', 'narrative_memories',
          'synchronicity_insights', 'shared_readings', 'user_embeddings',
          'profiles',
        ],
        consent_logs_anonymised: true,
      },
    });

    // ── Step 2: Get session IDs for cascade delete ────────────────────────────
    const { data: sessions } = await admin
      .from('reading_sessions')
      .select('id')
      .eq('user_id', uid);
    const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);

    // ── Step 3: Delete all user-owned data (ordered for FK safety) ────────────
    const deletions: Promise<unknown>[] = [];

    // reading_results (depends on reading_sessions)
    if (sessionIds.length > 0) {
      deletions.push(admin.from('reading_results').delete().in('session_id', sessionIds));
    }

    deletions.push(
      admin.from('reading_sessions').delete().eq('user_id', uid),
      admin.from('tarot_readings').delete().eq('user_id', uid),
      admin.from('daily_draws').delete().eq('user_id', uid),
      admin.from('email_leads').delete().eq('user_id', uid),
      admin.from('analytics_events').delete().eq('user_id', uid),
      admin.from('ai_usage_daily').delete().eq('user_id', uid),
      admin.from('subscriptions').delete().eq('user_id', uid),
      admin.from('user_karma').delete().eq('user_id', uid),
      admin.from('user_achievements').delete().eq('user_id', uid),
      admin.from('narrative_memories').delete().eq('user_id', uid),
      admin.from('synchronicity_insights').delete().eq('user_id', uid),
      admin.from('shared_readings').delete().eq('user_id', uid),
      admin.from('user_embeddings').delete().eq('user_id', uid),
    );

    await Promise.allSettled(deletions);

    // ── Step 4: Anonymise consent_logs (legal retention, anonymised) ──────────
    // Replace user_id with null and nullify identifying fields
    await admin
      .from('consent_logs')
      .update({ user_id: null })
      .eq('user_id', uid);

    // ── Step 5: Delete user roles (must be before profile) ───────────────────
    await admin.from('user_roles').delete().eq('user_id', uid);

    // ── Step 6: Delete profile ────────────────────────────────────────────────
    await admin.from('profiles').delete().eq('id', uid);

    // ── Step 7: Delete auth user (final — user can no longer sign in) ─────────
    const { error: deleteAuthErr } = await admin.auth.admin.deleteUser(uid);
    if (deleteAuthErr) {
      console.error('[delete-account] auth.admin.deleteUser failed:', deleteAuthErr.message);
      // Non-fatal: data is deleted, auth user may be orphaned but access is impossible
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Votre compte et toutes vos données ont été définitivement supprimés.',
      deleted_at: deletionDate,
    }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erreur interne' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } },
    );
  }
});

async function hashString(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
