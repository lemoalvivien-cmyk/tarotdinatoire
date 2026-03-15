import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://tarotdinatoire.fr',
  'https://www.tarotdinatoire.fr',
  'https://tarotdinatoire.lovable.app',
  'https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

const APP_URL = 'https://tarotdinatoire.fr';

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const url = new URL(req.url);

  try {
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient  = createClient(supabaseUrl, serviceKey);

    // ─── Route: POST /og-share (create share) ──────────────────────────────
    if (req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
      const anonKey   = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      const {
        draw_id, reading_id, card_id, card_name_fr, orientation,
        interp_title, interp_summary, image_url,
      } = body;

      if (!card_id) {
        return new Response(JSON.stringify({ error: 'card_id required' }), {
          status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      const { data: existing } = await adminClient
        .from('shared_readings')
        .select('share_id, referral_code')
        .eq('user_id', user.id)
        .eq('card_id', card_id)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({
            share_id: existing.share_id,
            referral_code: existing.referral_code,
            share_url: `${APP_URL}/partage/${existing.share_id}`,
          }),
          { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
        );
      }

      const { data: created, error: insertErr } = await adminClient
        .from('shared_readings')
        .insert({
          user_id: user.id,
          draw_id: draw_id ?? null,
          reading_id: reading_id ?? null,
          card_id,
          card_name_fr: card_name_fr ?? card_id,
          orientation: orientation ?? 'upright',
          interp_title: interp_title ?? null,
          interp_summary: interp_summary ?? null,
          image_url: image_url ?? null,
        })
        .select('share_id, referral_code')
        .single();

      if (insertErr) throw new Error(insertErr.message);

      return new Response(
        JSON.stringify({
          share_id: created.share_id,
          referral_code: created.referral_code,
          share_url: `${APP_URL}/partage/${created.share_id}`,
        }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    // ─── Route: GET /og-share?id=xxx (track visit + return OG HTML) ────────
    if (req.method === 'GET') {
      const shareId = url.searchParams.get('id');
      const format  = url.searchParams.get('format') ?? 'html'; // 'html' | 'json'
      const ref     = url.searchParams.get('ref');              // referral tracking

      if (!shareId) {
        return new Response(JSON.stringify({ error: 'id required' }), {
          status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      const { data: share, error: fetchErr } = await adminClient
        .from('shared_readings')
        .select('*')
        .eq('share_id', shareId)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      if (fetchErr || !share) {
        return new Response(JSON.stringify({ error: 'Share not found or expired' }), {
          status: 404, headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      // Increment visit counter (fire-and-forget)
      adminClient
        .from('shared_readings')
        .update({ visit_count: (share.visit_count ?? 0) + 1 })
        .eq('share_id', shareId)
        .then(() => {});

      // Track referral signup attribution if ?ref= matches a referral_code
      if (ref) {
        adminClient
          .from('shared_readings')
          .select('signup_count')
          .eq('referral_code', ref)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              adminClient
                .from('shared_readings')
                .update({ signup_count: (data.signup_count ?? 0) + 1 })
                .eq('referral_code', ref)
                .then(() => {});
            }
          });
      }

      if (format === 'json') {
        return new Response(JSON.stringify({ share }), {
          status: 200, headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      // ── Return OG HTML page ──────────────────────────────────────────────
      const title  = share.interp_title ?? share.card_name_fr ?? 'Tirage du Tarot';
      const desc   = share.interp_summary
        ? share.interp_summary.slice(0, 155)
        : `Découvrez la carte ${share.card_name_fr} et recevez votre propre tirage quotidien.`;
      const cardImg = share.image_url ?? `${APP_URL}/public/og-image.png`;
      const shareUrl = `${APP_URL}/partage/${shareId}`;

      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Tarot Dinatoire</title>
  <meta name="description" content="${desc}" />
  <!-- Open Graph -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:image" content="${cardImg}" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="600" />
  <meta property="og:site_name" content="Tarot Dinatoire" />
  <meta property="og:locale" content="fr_FR" />
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${cardImg}" />
  <!-- Redirect to SPA share page -->
  <script>window.location.replace("${shareUrl}?from=og");</script>
</head>
<body>
  <noscript>
    <p><a href="${shareUrl}">Voir le tirage</a></p>
  </noscript>
</body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
