import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// FIX #9: Full CORS headers matching supabase-js client headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CardInput {
  card_id: string;
  orientation: "upright" | "reversed";
  position_key: string;
}

interface RequestPayload {
  spread_id: string;
  question: string | null;
  cards: CardInput[];
}

// New structured interpretation format as requested
interface PositionInterpretation {
  position: string;
  carte: string;
  sens: "upright" | "reversed";
  message: string;
}

interface TarotInterpretation {
  resume_court: string;
  interpretation_par_position: PositionInterpretation[];
  message_global: string;
  actions_concretes: string[];
  limites_ethiques: string;
  // Legacy fields for backward compatibility
  title?: string;
  summary?: string;
  interpretation?: {
    general: string;
    love: string;
    work: string;
    money: string;
  };
  advice?: string[];
  reflection_questions?: string[];
  safety?: {
    medical: string;
    legal: string;
    financial: string;
  };
}

const JSON_SCHEMA = `{
  "resume_court": "Résumé du tirage en 2-3 phrases évocatrices (max 300 caractères)",
  "interpretation_par_position": [
    {
      "position": "Nom de la position (ex: Passé, Présent, Futur, Conseil...)",
      "carte": "Nom de la carte tirée",
      "sens": "upright ou reversed",
      "message": "Interprétation de cette carte à cette position (3-5 phrases)"
    }
  ],
  "message_global": "Synthèse globale du tirage avec conseils bienveillants (5-7 phrases)",
  "actions_concretes": [
    "Action concrète 1 à mettre en pratique",
    "Action concrète 2 à mettre en pratique",
    "Action concrète 3 à mettre en pratique",
    "Action concrète 4 à mettre en pratique",
    "Action concrète 5 à mettre en pratique"
  ],
  "limites_ethiques": "Rappel bienveillant que le tarot est un outil d'introspection et ne remplace pas l'avis de professionnels (médecins, avocats, conseillers financiers) pour les décisions importantes."
}`;

// Rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
  return `ip:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (Math.random() < 0.1) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }
  
  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetIn: record.resetAt - now };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // IP-based rate limiting
    const rateLimitKey = getRateLimitKey(req);
    const rateLimit = checkRateLimit(rateLimitKey);
    
    if (!rateLimit.allowed) {
      console.warn(`[RateLimit] Blocked IP: ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ 
          error: "Trop de requêtes",
          message: "Veuillez patienter avant de réessayer.",
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }

    // ENV CHECK mode for admin diagnostic
    const url = new URL(req.url);
    if (url.searchParams.get("action") === "env-check") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Non autorisé" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseEnvCheck = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user: envCheckUser }, error: envCheckUserError } = await supabaseEnvCheck.auth.getUser();
      if (envCheckUserError || !envCheckUser) {
        return new Response(
          JSON.stringify({ error: "Session invalide" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdminEnvCheck = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: isAdminData } = await supabaseAdminEnvCheck.rpc("is_admin", { _user_id: envCheckUser.id });
      
      if (!isAdminData) {
        return new Response(
          JSON.stringify({ error: "Accès admin requis" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const hasLovableKey = !!Deno.env.get("LOVABLE_API_KEY");
      
      return new Response(
        JSON.stringify({ hasLovableKey, provider: hasLovableKey ? "lovable-ai" : "none" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Session invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Daily rate limit check
    const today = new Date().toISOString().split("T")[0];
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: usageData } = await supabaseAdmin
      .from("ai_usage_daily")
      .select("count")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle();

    const currentCount = usageData?.count || 0;
    const DAILY_LIMIT = 20;

    if (currentCount >= DAILY_LIMIT) {
      console.log("Daily limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({ 
          error: "Limite quotidienne atteinte",
          message: `Vous avez atteint la limite de ${DAILY_LIMIT} interprétations par jour.`,
          remaining: 0
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const payload: RequestPayload = await req.json();
    console.log("Request payload:", JSON.stringify(payload));

    // Server-side input validation
    if (!payload.cards || payload.cards.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucune carte fournie" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate question length (server-side enforcement)
    const MAX_QUESTION_LENGTH = 240;
    if (payload.question && payload.question.length > MAX_QUESTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Question trop longue (max ${MAX_QUESTION_LENGTH} caractères)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate spread_id format (prevent injection)
    if (payload.spread_id && !/^[a-z0-9_-]+$/i.test(payload.spread_id)) {
      return new Response(
        JSON.stringify({ error: "Format de tirage invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate cards array
    if (payload.cards.length > 22) {
      return new Response(
        JSON.stringify({ error: "Trop de cartes sélectionnées" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, intention, preferred_domain")
      .eq("id", user.id)
      .single();

    // Get spread for position labels
    const { data: spreadData } = await supabase
      .from("tarot_spreads")
      .select("name_fr, positions")
      .eq("id", payload.spread_id)
      .single();

    const spreadPositions = spreadData?.positions as { key: string; label: string; label_fr?: string }[] || [];

    // Get card details
    const cardIds = payload.cards.map(c => c.card_id);
    const { data: cardsData, error: cardsError } = await supabase
      .from("tarot_cards")
      .select("id, nom_fr, type, numero, meaning_upright_fr, meaning_reversed_fr, keywords_fr")
      .in("id", cardIds);

    if (cardsError || !cardsData || cardsData.length === 0) {
      console.error("Cards fetch error:", cardsError);
      return new Response(
        JSON.stringify({ error: "Cartes non trouvées" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build card context with position labels
    const cardContexts = payload.cards.map((c, index) => {
      const cardData = cardsData.find(cd => cd.id === c.card_id);
      const positionData = spreadPositions.find(p => p.key === c.position_key) || spreadPositions[index];
      
      if (!cardData) return null;
      
      return {
        card_id: c.card_id,
        name_fr: cardData.nom_fr as string,
        type: cardData.type as string,
        numero: cardData.numero as number | null,
        orientation: c.orientation,
        position_key: c.position_key,
        position_label: positionData?.label_fr || positionData?.label || `Position ${index + 1}`,
        meaning: (c.orientation === "upright" ? cardData.meaning_upright_fr : cardData.meaning_reversed_fr) as string | null,
        keywords: (cardData.keywords_fr || []) as string[]
      };
    }).filter(c => c !== null);

    // Detect sensitive topics
    const questionLower = (payload.question || "").toLowerCase();
    const hasMedicalTopic = /\b(maladie|cancer|médecin|santé|diagnostic|guérir|mourir|mort|symptôme|traitement|médicament|opération|chirurgie|dépression|anxiété|suicide)\b/i.test(questionLower);
    const hasLegalTopic = /\b(procès|avocat|tribunal|jugement|condamn|prison|divorce|garde|juridique|légal|plainte|litige)\b/i.test(questionLower);
    const hasFinancialTopic = /\b(investir|bourse|actions|bitcoin|crypto|prêt|crédit|dette|faillite|héritage|placement|trader)\b/i.test(questionLower);

    // ── Spread-specific archetypal context ──────────────────────────────────
    const SPREAD_ARCHETYPES: Record<string, string> = {
      three_cards: `Ce tirage en 3 cartes révèle la ligne du temps de l'âme: Passé (racine karmique), Présent (carrefour d'action), Futur (potentiel émergent). Chaque carte dialogue avec les autres pour créer une narrative cohérente.`,
      celtic_cross: `La Croix Celtique est le tirage le plus complet du tarot. Les 10 positions forment un système d'analyse holistique: la croix centrale révèle le cœur du sujet, le bâton vertical montre la trajectoire. Tisse les fils entre les positions pour une lecture intégrée.`,
      relationship: `Ce tirage relationnel explore la constellation énergétique entre deux personnes. Analyse les miroirs entre Vous (pos.1) et L'Autre (pos.2), le Lien qui les unit (pos.3), l'Obstacle (pos.4), les Fondations (pos.5), le Potentiel (pos.6) et la Guidance (pos.7). La relation est un chemin de croissance mutuelle.`,
      life_path: `Ce tirage du Chemin de Vie touche aux archétypes profonds de l'âme. L'Âme (pos.1) dialogue avec les Dons (pos.2) et les Ombres (pos.3) pour révéler la totalité de l'être. Le Passé (pos.4), Présent (pos.5) et la Leçon (pos.6) tissent le fil karmique. La Vocation (pos.7), le Défi (pos.8) et la Destinée (pos.9) révèlent la mission de vie. Utilise un langage archétypal profond.`,
      amour: `Ce tirage de l'amour explore la dynamique affective en profondeur. Analyse les résonances entre Vous et l'Autre, ce qui unit et ce qui défie, le passé, présent et futur du lien. Sois bienveillant — les questions du cœur sont délicates.`,
      marseille: `Ce grand tirage Marseille offre une vision panoramique de la vie. Tisse ensemble les 10 positions comme un tapissier qui révèle le motif caché derrière les fils apparents. La synthèse doit être aussi puissante que les positions individuelles.`,
    };

    const spreadArchetype = SPREAD_ARCHETYPES[payload.spread_id] || `Ce tirage de ${cardContexts.length} cartes offre une guidance sur votre chemin de vie actuel.`;

    // Build prompt
    const systemPrompt = `Tu es un tarologue expert du Tarot de Marseille avec 30 ans d'expérience. Tu pratiques une approche jungienne, bienveillante et profondément introspective.

STYLE ET TON:
- Ton mystique et premium, jamais fataliste ni alarmiste
- Langage archétypal et poétique avec métaphores lumineuses
- Français soutenu mais accessible et intime
- Toujours bienveillant, encourageant et non-directif
- Chaque position est une invitation à la conscience, jamais une prédiction figée

ARCHÉTYPE DU TIRAGE:
${spreadArchetype}

RÈGLES DE SÉCURITÉ:
- JAMAIS d'avis médical, juridique ou financier
- Si question sensible: rediriger vers professionnel qualifié
- Rappeler le libre arbitre de l'utilisateur
${hasMedicalTopic ? "⚠️ La question touche la santé: recommander un médecin." : ""}
${hasLegalTopic ? "⚠️ La question touche le juridique: recommander un avocat." : ""}
${hasFinancialTopic ? "⚠️ La question touche les finances: recommander un conseiller." : ""}

STRUCTURE DE RÉPONSE (JSON STRICT):
${JSON_SCHEMA}

IMPORTANT: Répondre UNIQUEMENT en JSON valide, sans texte avant/après, sans bloc markdown.
Pour les tirages complexes (>5 cartes), le message dans interpretation_par_position doit être de 4-6 phrases par carte.
Le message_global doit tisser ensemble les fils de toutes les cartes en une narrative cohérente (6-10 phrases).`;

    const userContext = profile ? 
      `Contexte: ${profile.display_name ? `Pseudo: ${profile.display_name}. ` : ""}${profile.intention ? `Intention de vie: ${profile.intention}. ` : ""}${profile.preferred_domain ? `Domaine de prédilection: ${profile.preferred_domain}. ` : ""}` : "";

    const userPrompt = `${userContext}

Question: ${payload.question || "Guidance générale sur mon chemin actuel."}

Tirage: ${spreadData?.name_fr || payload.spread_id} (${cardContexts.length} carte${cardContexts.length > 1 ? 's' : ''})

Cartes tirées dans l'ordre:
${cardContexts.map((c, i) => `${i + 1}. Position "${c!.position_label}": ${c!.name_fr} (${c!.type === "major" ? "Arcane Majeur #" + c!.numero : "Arcane Mineur"})
   Sens: ${c!.orientation === "upright" ? "À l'endroit — énergie exprimée" : "Renversée — énergie intériorisée"}
   Signification: ${c!.meaning || "Guidance et introspection"}
   Mots-clés: ${c!.keywords?.join(", ") || "transformation, clarté"}`).join("\n\n")}

Génère une interprétation structurée selon le JSON_SCHEMA. Pour chaque position, le message doit:
- Relier spécifiquement la carte à sa position dans ce tirage
- Utiliser les mots-clés de la carte de façon évocatrice
- Donner une guidance concrète adaptée à cette position
- Pour les tirages > 5 cartes: faire des ponts entre les cartes (ex: "Cette carte répond à celle du Passé...")`;

    console.log("Calling Lovable AI...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("Missing LOVABLE_API_KEY");
      return new Response(
        JSON.stringify({ error: "Configuration IA manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service IA temporairement indisponible" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("No AI response content");
    }

    console.log("AI response length:", rawContent.length);

    // Parse JSON
    let interpretation: TarotInterpretation;
    try {
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
      else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();

      interpretation = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      
      // Fallback interpretation
      const cardName = cardContexts[0]?.name_fr || "La carte tirée";
      interpretation = {
        resume_court: `${cardName} vous invite à une profonde réflexion sur votre chemin actuel.`,
        interpretation_par_position: cardContexts.map(c => ({
          position: c!.position_label,
          carte: c!.name_fr,
          sens: c!.orientation,
          message: c!.meaning || "Cette carte vous encourage à faire confiance à votre intuition et à accueillir les changements qui se présentent."
        })),
        message_global: "Ce tirage vous encourage à écouter votre voix intérieure. Les cartes révèlent un moment propice à l'introspection et à la prise de conscience. Faites confiance au chemin qui s'ouvre devant vous.",
        actions_concretes: [
          "Prenez un moment de calme pour méditer sur le message de ce tirage",
          "Notez vos impressions et ressentis dans votre journal",
          "Faites confiance à votre intuition pour les décisions à venir",
          "Observez les synchronicités dans votre quotidien",
          "Accordez-vous du temps pour la réflexion personnelle"
        ],
        limites_ethiques: "Le tarot est un outil d'introspection et de guidance personnelle. Il ne remplace pas l'avis de professionnels qualifiés (médecins, avocats, conseillers financiers) pour les décisions importantes de votre vie."
      };
    }

    // Ensure all required fields are present
    if (!interpretation.limites_ethiques) {
      interpretation.limites_ethiques = "Le tarot est un outil d'introspection et ne remplace pas l'avis de professionnels qualifiés.";
    }
    if (!interpretation.actions_concretes || interpretation.actions_concretes.length < 5) {
      interpretation.actions_concretes = [
        "Méditez sur le message de ce tirage",
        "Notez vos ressentis dans un journal",
        "Faites confiance à votre intuition",
        "Observez les synchronicités autour de vous",
        "Accordez-vous du temps de réflexion"
      ];
    }

    // Update rate limit counter
    await supabaseAdmin
      .from("ai_usage_daily")
      .upsert({
        user_id: user.id,
        day: today,
        count: currentCount + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,day" });

    // Log to audit
    await supabaseAdmin
      .from("admin_audit_logs")
      .insert({
        action: "tarot_interpretation_generated",
        target_id: user.id,
        target_type: "user",
        metadata: { 
          day: today, 
          count: currentCount + 1,
          spread_id: payload.spread_id,
          card_ids: cardIds
        }
      });

    console.log("Interpretation generated, count:", currentCount + 1);

    return new Response(
      JSON.stringify(interpretation),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
