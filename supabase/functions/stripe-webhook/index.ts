import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ═══════════════════════════════════════════════════════════════
// CORS HEADERS
// ═══════════════════════════════════════════════════════════════
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ═══════════════════════════════════════════════════════════════
// LOGGING FUNCTION
// ═══════════════════════════════════════════════════════════════
const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    logStep("Webhook received");

    // ─────────────────────────────────────────────────────────────
    // 1. VERIFY STRIPE SECRET KEY
    // ─────────────────────────────────────────────────────────────
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }
    logStep("Secrets verified");

    // ─────────────────────────────────────────────────────────────
    // 2. VERIFY SIGNATURE (DEFENSE LEVEL 1)
    // ─────────────────────────────────────────────────────────────
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("SECURITY: Missing stripe-signature header");
      return new Response("Missing signature", { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const body = await req.text();
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("SECURITY: Invalid signature", { error: errorMessage });
      return new Response(`Webhook signature verification failed: ${errorMessage}`, {
        status: 400,
        headers: corsHeaders,
      });
    }

    logStep("Signature verified", { eventType: event.type, eventId: event.id });

    // ─────────────────────────────────────────────────────────────
    // 3. INITIALIZE SUPABASE ADMIN CLIENT
    // ─────────────────────────────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // ─────────────────────────────────────────────────────────────
    // 4. PROCESS EVENT BY TYPE
    // ─────────────────────────────────────────────────────────────
    switch (event.type) {
      // ───────────────────────────────────────────────────────
      // CHECKOUT SESSION COMPLETED (New subscription)
      // ───────────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { 
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription 
        });

        // Get subscription details
        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
          logStep("No subscription in session, might be one-time payment");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = session.customer as string;

        // Find user by stripe_customer_id
        const { data: existingSub, error: findError } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (findError || !existingSub) {
          logStep("Customer not found in DB, checking by subscription metadata");
          // Fallback: check metadata if set during checkout
          break;
        }

        // Update subscription status
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription.status,
            plan: "premium",
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            credits_remaining: null, // Premium = unlimited
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (updateError) {
          logStep("ERROR updating subscription", { error: updateError.message });
          throw new Error(`Failed to update subscription: ${updateError.message}`);
        }

        logStep("Subscription activated successfully", { 
          customerId, 
          subscriptionId 
        });
        break;
      }

      // ───────────────────────────────────────────────────────
      // SUBSCRIPTION UPDATED (Plan change, renewal, etc.)
      // ───────────────────────────────────────────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription update", { 
          subscriptionId: subscription.id,
          status: subscription.status 
        });

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("ERROR updating subscription", { error: error.message });
          throw new Error(`Failed to update subscription: ${error.message}`);
        }

        logStep("Subscription updated successfully");
        break;
      }

      // ───────────────────────────────────────────────────────
      // SUBSCRIPTION DELETED (Cancellation)
      // ───────────────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription deletion", { 
          subscriptionId: subscription.id 
        });

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            subscription_status: "canceled",
            plan: "free",
            credits_remaining: 0, // No more free credits after cancellation
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("ERROR canceling subscription", { error: error.message });
          throw new Error(`Failed to cancel subscription: ${error.message}`);
        }

        logStep("Subscription canceled successfully");
        break;
      }

      // ───────────────────────────────────────────────────────
      // PAYMENT FAILED
      // ───────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing payment failure", { 
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription 
        });

        if (!invoice.subscription) break;

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", invoice.subscription as string);

        if (error) {
          logStep("ERROR updating payment status", { error: error.message });
        }

        logStep("Marked subscription as past_due");
        break;
      }

      // ───────────────────────────────────────────────────────
      // PAYMENT SUCCEEDED (Renewal)
      // ───────────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Only process subscription renewals (not first payment)
        if (invoice.billing_reason !== "subscription_cycle") break;
        
        logStep("Processing successful renewal payment", { 
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription 
        });

        if (!invoice.subscription) break;

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", invoice.subscription as string);

        if (error) {
          logStep("ERROR updating after renewal", { error: error.message });
        }

        logStep("Subscription renewed successfully");
        break;
      }

      // ───────────────────────────────────────────────────────
      // UNHANDLED EVENTS (Logging only)
      // ───────────────────────────────────────────────────────
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. RETURN SUCCESS
    // ─────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ received: true, eventType: event.type }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("CRITICAL ERROR", { error: errorMessage });
    
    // Return 200 to prevent Stripe retries on application errors
    // Log for manual investigation
    return new Response(
      JSON.stringify({ 
        received: true, 
        error: errorMessage,
        requires_review: true 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );
  }
});
