import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tarotdivinatoire.app",
  "https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[card-insight] ${step}`, details ?? "");
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const url = new URL(req.url);
    const cardId = url.searchParams.get("card_id");

    if (!cardId) {
      return new Response(
        JSON.stringify({ error: "card_id parameter required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    logStep("Fetching card data", { cardId });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch card from DB
    const { data: card, error: cardError } = await supabase
      .from("tarot_cards")
      .select("id, nom_fr, name_en, type, numero, meaning_upright_fr, meaning_reversed_fr, keywords_fr")
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      logStep("Card not found", cardError);
      return new Response(
        JSON.stringify({ error: "Card not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Check for a cached insight from today
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `card_insight_${cardId}_${today}`;
    logStep("Calling AI gateway", { cardId, cardName: card.nom_fr });

    const orientation = Math.random() < 0.5 ? "droit" : "inverse";
    const keywords = (card.keywords_fr ?? []).slice(0, 5).join(", ");
    const meaning = orientation === "droit"
      ? card.meaning_upright_fr ?? card.nom_fr
      : card.meaning_reversed_fr ?? card.nom_fr;

    const prompt = `Tu es un tarologue mystique expert. Pour la carte "${card.nom_fr}" (${card.name_en ?? card.nom_fr}), tirée aujourd'hui en position ${orientation}, génère une guidance spirituelle du jour en français.

Mots-clés de la carte : ${keywords}
Sens principal : ${meaning}

Format de réponse JSON strict :
{
  "titre": "titre court et poétique (max 8 mots)",
  "message": "guidance spirituelle du jour (2-3 phrases, inspirante et actionnable)",
  "question": "une question de réflexion personnelle",
  "energie": "mot décrivant l'énergie du jour (1-2 mots)"
}

Réponds UNIQUEMENT en JSON, sans markdown ni explication.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? "{}";

    let insight: Record<string, string>;
    try {
      insight = JSON.parse(rawContent.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      insight = {
        titre: "Guidance du jour",
        message: `Aujourd'hui, la carte ${card.nom_fr} vous invite à l'introspection et à la sérénité.`,
        question: "Quelle leçon cette carte vous apporte-t-elle aujourd'hui ?",
        energie: orientation === "droit" ? "Expansion" : "Intériorisation",
      };
    }

    logStep("AI insight generated", { cardId });

    return new Response(
      JSON.stringify({
        card_id: cardId,
        card_name: card.nom_fr,
        date: today,
        orientation,
        insight,
      }),
      {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600", // Cache 1 hour
        },
      }
    );
  } catch (err) {
    logStep("Error", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate insight" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
