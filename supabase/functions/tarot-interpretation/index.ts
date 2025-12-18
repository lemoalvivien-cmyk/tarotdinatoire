import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

interface TarotInterpretation {
  title: string;
  summary: string;
  card_focus: {
    card_id: string;
    name_fr: string;
    orientation: string;
    meaning: string;
    keywords: string[];
  }[];
  guidance: {
    message: string;
    actions: string[];
    questions_to_reflect: string[];
    warning: string;
  };
  affirmation: string;
  disclaimer: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Session invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Check rate limit
    const today = new Date().toISOString().split("T")[0];
    
    // Use service role for rate limit operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create usage record
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from("ai_usage_daily")
      .select("count")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle();

    if (usageError) {
      console.error("Usage check error:", usageError);
    }

    const currentCount = usageData?.count || 0;
    const DAILY_LIMIT = 20;

    if (currentCount >= DAILY_LIMIT) {
      console.log("Rate limit exceeded for user:", user.id, "count:", currentCount);
      
      // Log rate limit hit to admin_audit_logs
      await supabaseAdmin
        .from("admin_audit_logs")
        .insert({
          action: "rate_limit_hit",
          target_id: user.id,
          target_type: "user",
          metadata: { 
            day: today, 
            count: currentCount, 
            limit: DAILY_LIMIT,
            endpoint: "tarot-interpretation"
          }
        });

      return new Response(
        JSON.stringify({ 
          error: "Limite quotidienne atteinte",
          message: `Vous avez atteint la limite de ${DAILY_LIMIT} interprétations par jour. Revenez demain !`,
          remaining: 0
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const payload: RequestPayload = await req.json();
    console.log("Request payload:", JSON.stringify(payload));

    if (!payload.cards || payload.cards.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucune carte fournie" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, intention, preferred_domain")
      .eq("id", user.id)
      .single();

    // Get card details from database
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

    // Get prompt templates
    const { data: templates } = await supabaseAdmin
      .from("ai_prompt_templates")
      .select("key, content")
      .in("key", ["tarot_system", "tarot_style", "safety_rules", "json_schema"]);

    const templateMap: Record<string, string> = {};
    templates?.forEach(t => { templateMap[t.key] = t.content; });

    // Build card context
    interface CardContext {
      card_id: string;
      name_fr: string;
      type: string;
      numero: number | null;
      orientation: "upright" | "reversed";
      position_key: string;
      meaning: string | null;
      keywords: string[];
    }
    
    const cardContextsRaw = payload.cards.map(c => {
      const cardData = cardsData.find(cd => cd.id === c.card_id);
      if (!cardData) return null;
      
      const meaning = c.orientation === "upright" 
        ? cardData.meaning_upright_fr 
        : cardData.meaning_reversed_fr;
      
      return {
        card_id: c.card_id,
        name_fr: cardData.nom_fr as string,
        type: cardData.type as string,
        numero: cardData.numero as number | null,
        orientation: c.orientation,
        position_key: c.position_key,
        meaning: meaning as string | null,
        keywords: (cardData.keywords_fr || []) as string[]
      };
    });
    
    const cardContexts = cardContextsRaw.filter((c): c is CardContext => c !== null);

    // Build the prompt
    const systemPrompt = `${templateMap.tarot_system || "Tu es un tarologue expert."}

${templateMap.tarot_style || ""}

${templateMap.safety_rules || ""}

Tu dois OBLIGATOIREMENT répondre en JSON valide selon ce schéma exact:
${templateMap.json_schema || "{}"}

IMPORTANT: Ta réponse doit être UNIQUEMENT le JSON, sans aucun texte avant ou après.`;

    const userContext = profile ? 
      `Contexte utilisateur: ${profile.display_name ? `Pseudo: ${profile.display_name}. ` : ""}${profile.intention ? `Intention: ${profile.intention}. ` : ""}${profile.preferred_domain ? `Domaine de prédilection: ${profile.preferred_domain}.` : ""}` : "";

    const userPrompt = `${userContext}

Question posée: ${payload.question || "Pas de question spécifique, guidance générale demandée."}

Type de tirage: ${payload.spread_id}

Carte(s) tirée(s):
${cardContexts.map(c => `- ${c.name_fr} (${c.type === "major" ? "Arcane Majeur" : "Arcane Mineur"}${c.numero ? ` #${c.numero}` : ""})
  Orientation: ${c.orientation === "upright" ? "À l'endroit" : "Renversée"}
  Position: ${c.position_key}
  Signification de base: ${c.meaning}
  Mots-clés: ${c.keywords?.join(", ") || "N/A"}`).join("\n\n")}

Génère une interprétation mystique, bienveillante et personnalisée. Réponds UNIQUEMENT en JSON valide.`;

    console.log("Calling Lovable AI...");

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
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
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service IA temporairement indisponible, réessayez dans quelques instants" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("No content from AI");
      throw new Error("No AI response content");
    }

    console.log("AI raw response length:", rawContent.length);

    // Parse JSON response (handle markdown code blocks)
    let interpretation: TarotInterpretation;
    try {
      // Remove markdown code block if present
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      interpretation = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw:", rawContent.substring(0, 500));
      
      // Fallback interpretation
      interpretation = {
        title: "Guidance mystique",
        summary: "Les cartes ont révélé des énergies profondes pour votre introspection.",
        card_focus: cardContexts.map(c => ({
          card_id: c.card_id,
          name_fr: c.name_fr,
          orientation: c.orientation,
          meaning: c.meaning || "Signification en cours de révélation...",
          keywords: c.keywords || []
        })),
        guidance: {
          message: "Prenez un moment pour méditer sur la signification de cette carte dans votre vie actuelle.",
          actions: ["Méditez sur le message de la carte", "Notez vos impressions dans votre journal"],
          questions_to_reflect: ["Que résonne en vous avec cette carte ?"],
          warning: ""
        },
        affirmation: "Je suis ouvert(e) aux messages de l'univers.",
        disclaimer: "Guidance introspective uniquement. Ne constitue pas un avis médical, juridique ou financier."
      };
    }

    // Ensure disclaimer is always present
    if (!interpretation.disclaimer) {
      interpretation.disclaimer = "Guidance introspective uniquement. Ne constitue pas un avis médical, juridique ou financier.";
    }

    // Update rate limit counter
    const { error: upsertError } = await supabaseAdmin
      .from("ai_usage_daily")
      .upsert({
        user_id: user.id,
        day: today,
        count: currentCount + 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id,day"
      });

    if (upsertError) {
      console.error("Usage upsert error:", upsertError);
    }

    console.log("Interpretation generated successfully, new count:", currentCount + 1);

    return new Response(
      JSON.stringify({
        interpretation,
        remaining: DAILY_LIMIT - (currentCount + 1)
      }),
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
