import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ══════════════════════════════════════════════════════════════
// ZERO TRUST CORS — no wildcard, explicit allowlist only
// ══════════════════════════════════════════════════════════════
const ALLOWED_ORIGINS = [
  'https://tarotdinatoire.lovable.app',
  'https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-admin-bootstrap-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const cors = buildCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  // POST only
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const expectedToken = Deno.env.get('ADMIN_BOOTSTRAP_TOKEN');
    const expectedEmail = Deno.env.get('ADMIN_BOOTSTRAP_EMAIL');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }

    if (!expectedToken || !expectedEmail) {
      return new Response(
        JSON.stringify({ error: 'Bootstrap not configured' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }

    // Validate bootstrap token from header
    const providedToken = req.headers.get('x-admin-bootstrap-token');
    if (!providedToken || providedToken !== expectedToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid bootstrap token' }),
        { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }

    // Validate email matches expected admin email
    if (user.email?.toLowerCase() !== expectedEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Email not authorized for bootstrap' }),
        { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check one-shot latch
    const { data: flagsData, error: flagsError } = await supabaseAdmin
      .from('feature_flags')
      .select('admin_bootstrap_used')
      .eq('id', 1)
      .single();

    if (flagsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check bootstrap status' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }

    if (flagsData?.admin_bootstrap_used === true) {
      return new Response(
        JSON.stringify({ error: 'Bootstrap has already been used. One-time operation.' }),
        { status: 410, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }

    // Upsert admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: user.id, role: 'admin' },
        { onConflict: 'user_id,role' },
      );

    if (roleError) {
      return new Response(
        JSON.stringify({ error: 'Failed to assign admin role' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
      );
    }

    // Mark bootstrap as used (one-shot latch)
    await supabaseAdmin
      .from('feature_flags')
      .update({ admin_bootstrap_used: true })
      .eq('id', 1);

    // Audit log
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        action: 'bootstrap_admin',
        admin_user_id: user.id,
        target_id: user.id,
        target_type: 'user',
        metadata: {
          // No email in metadata — avoid PII in logs
          timestamp: new Date().toISOString(),
          method: 'edge_function',
        },
      });

    return new Response(
      JSON.stringify({ success: true, message: 'Admin role assigned', user_id: user.id }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    // No sensitive payload in error log
    console.error('[bootstrap-admin] unexpected error type:', typeof error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }
});
