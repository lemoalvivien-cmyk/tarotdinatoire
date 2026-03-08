import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// public-config is intentionally public (no auth) — but CORS still restricted
const ALLOWED_ORIGINS = [
  'https://tarotdinatoire.lovable.app',
  'https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=30',
  };
}

// App version - update this with each release
const APP_VERSION = '0.1.0-beta';

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsH = buildCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsH });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsH, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Use service role to bypass RLS (feature_flags is now admin-only)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('feature_flags')
      .select('maintenance_mode, admin_bootstrap_used')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('[public-config] Database error:', error.message);
      throw error;
    }

    // Return ONLY the minimal public fields (no sensitive flags)
    const publicConfig = {
      maintenance_mode: data?.maintenance_mode ?? false,
      admin_bootstrap_used: data?.admin_bootstrap_used ?? true,
      app_version: APP_VERSION,
    };

    return new Response(
      JSON.stringify(publicConfig),
      { status: 200, headers: { ...corsH, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[public-config] Error:', error instanceof Error ? error.message : 'unknown');

    // Return safe defaults on error (fail open for maintenance check)
    return new Response(
      JSON.stringify({
        maintenance_mode: false,
        app_version: APP_VERSION,
        error: 'Failed to fetch configuration'
      }),
      { status: 500, headers: { ...buildCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' } }
    );
  }
});
