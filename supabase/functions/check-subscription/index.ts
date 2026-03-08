import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ── Zero Trust CORS allowlist — no wildcard ────────────────────
const ALLOWED_ORIGINS = [
  "https://tarotdinatoire.lovable.app",
  "https://id-preview--9cb757f2-5a64-4423-812d-aa07959053e8.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];
function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsH = buildCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsH });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Chercher le customer Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking trial status");
      
      // Check for active trial
      const { data: subData } = await supabaseAdmin
        .from("subscriptions")
        .select("plan, credits_remaining, subscription_status, trial_ends_at")
        .eq("user_id", user.id)
        .single();

      const isTrial = subData?.plan === 'trial' && subData?.subscription_status === 'active' && subData?.trial_ends_at && new Date(subData.trial_ends_at) > new Date();

      if (isTrial) {
        logStep("Active trial found", { trial_ends_at: subData.trial_ends_at });
        return new Response(
          JSON.stringify({
            subscribed: true,
            plan: "trial",
            credits_remaining: null,
            subscription_end: null,
            cancel_at_period_end: false,
            trial_ends_at: subData.trial_ends_at
          }),
          { headers: { ...corsH, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // S'assurer qu'une entrée subscription existe
      await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan: "free",
          credits_remaining: 0,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({
          subscribed: false,
          plan: "free",
          credits_remaining: subData?.credits_remaining ?? 0,
          subscription_end: null,
          cancel_at_period_end: false,
          trial_ends_at: null
        }),
        { headers: { ...corsH, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Vérifier les abonnements actifs
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd: string | null = null;
    let cancelAtPeriodEnd = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      // current_period_end can be a unix timestamp (number) or a Date string depending on Stripe API version
      const rawEnd = subscription.current_period_end;
      if (rawEnd != null) {
        const endMs = typeof rawEnd === 'number' ? rawEnd * 1000 : new Date(rawEnd as string).getTime();
        if (!isNaN(endMs)) {
          subscriptionEnd = new Date(endMs).toISOString();
        }
      }
      cancelAtPeriodEnd = subscription.cancel_at_period_end ?? false;
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        cancelAtPeriodEnd 
      });

      // Mettre à jour la table subscriptions
      await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          plan: "premium",
          subscription_status: "active",
          current_period_end: subscriptionEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({
          subscribed: true,
          plan: "premium",
          credits_remaining: null, // Illimité
          subscription_end: subscriptionEnd,
          cancel_at_period_end: cancelAtPeriodEnd
        }),
        { headers: { ...corsH, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("No active Stripe subscription found, checking trial");

    // Check for active trial
    const { data: subData } = await supabaseAdmin
      .from("subscriptions")
      .select("credits_remaining, plan, subscription_status, trial_ends_at")
      .eq("user_id", user.id)
      .single();

    const isTrial = subData?.plan === 'trial' && subData?.subscription_status === 'active' && subData?.trial_ends_at && new Date(subData.trial_ends_at) > new Date();

    if (isTrial) {
      logStep("Active trial found", { trial_ends_at: subData.trial_ends_at });
      return new Response(
        JSON.stringify({
          subscribed: true,
          plan: "trial",
          credits_remaining: null,
          subscription_end: null,
          cancel_at_period_end: false,
          trial_ends_at: subData.trial_ends_at
        }),
        { headers: { ...corsH, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Mettre à jour avec le customer ID
    await supabaseAdmin
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: "free",
        subscription_status: null,
        credits_remaining: subData?.credits_remaining ?? 0,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({
        subscribed: false,
        plan: "free",
        credits_remaining: subData?.credits_remaining ?? 0,
        subscription_end: null,
        cancel_at_period_end: false,
        trial_ends_at: null
      }),
      { headers: { ...corsH, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsH, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
