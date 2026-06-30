import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

// Webhook handler route
export async function POST(request: Request) {
  try {
    // 1. Fetch raw body text for Stripe signature verification
    const rawBody = await request.text();
    const sig = headers().get("stripe-signature");

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Check if Stripe is configured, otherwise trigger mock webhook simulation
    if (!stripeSecretKey || !webhookSecret || !sig || stripeSecretKey.includes("placeholder")) {
      console.log("[PAYMENT WEBHOOK] Received simulation event (Stripe keys not configured).");
      return NextResponse.json({ received: true });
    }

    let event: Stripe.Event;

    // 2. Security check: verify webhook signatures using constructEvent
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.log(`[STRIPE WEBHOOK SIGNATURE ERROR] Verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    const supabase = !isMock ? createSupabaseAdmin() : null;

    console.log(`[STRIPE WEBHOOK] Verified event received: ${event.type}`);

    // Handle events
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const { order_id, user_id } = intent.metadata;

        if (order_id) {
          if (!isMock && supabase) {
            // Update payments table status to succeeded using admin client (bypasses RLS)
            const { error: payErr } = await supabase
              .from("payments")
              .update({
                status: "succeeded",
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_payment_intent_id", intent.id);

            if (payErr) console.error("[WEBHOOK DB ERROR] payments update failed:", payErr.message);

            // Update orders table status to paid and confirmed
            const { error: ordErr } = await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                status: "confirmed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", order_id);

            if (ordErr) console.error("[WEBHOOK DB ERROR] orders update failed:", ordErr.message);

            // Create notification: "✅ Payment received! Your order is confirmed."
            await supabase.from("notifications").insert({
              user_id: user_id,
              title: "Payment Confirmed! 💳",
              message: "✅ Payment received! Your order is confirmed.",
              is_read: false,
            });

            // Trigger order confirmation email via Resend
            try {
              const { data: profile } = await supabase.from("profiles").select("*").eq("id", user_id).single();
              const { data: order } = await supabase.from("orders").select("*").eq("id", order_id).single();
              if (profile && order) {
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/edge-notification-trigger`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ order, customer: profile }),
                });
              }
            } catch (e) {
              console.error("[WEBHOOK EMAIL TRIGGER ERROR]", e);
            }

            // Referral check: Reward referrer if this is the customer's first successful order
            try {
              const { data: profile } = await supabase.from("profiles").select("referred_by").eq("id", user_id).single();
              if (profile?.referred_by) {
                const { count } = await supabase
                  .from("orders")
                  .select("id", { count: "exact", head: true })
                  .eq("user_id", user_id)
                  .eq("payment_status", "paid");

                // If this is the first successful order
                if (count === 1) {
                  const { data: ref } = await supabase
                    .from("referrals")
                    .select("id")
                    .eq("referee_id", user_id)
                    .eq("status", "registered")
                    .maybeSingle();

                  if (ref) {
                    await supabase
                      .from("referrals")
                      .update({ status: "ordered", points_earned: 100 })
                      .eq("id", ref.id);

                    const { data: referrer } = await supabase
                      .from("profiles")
                      .select("total_points")
                      .eq("id", profile.referred_by)
                      .single();

                    if (referrer) {
                      await supabase
                        .from("profiles")
                        .update({ total_points: referrer.total_points + 100 })
                        .eq("id", profile.referred_by);
                    }
                  }
                }
              }
            } catch (err) {
              console.error("[WEBHOOK REFERRAL ERROR]", err);
            }
          } else {
            // Mock DB Update Fallback
            mockDb.updateOrderStatus(order_id, "confirmed");
            mockDb.updateOrderPayment(order_id, "paid");
            mockDb.createNotification(
              user_id,
              "Payment Confirmed! 💳",
              "✅ Payment received! Your order is confirmed."
            );

            // Mock Referral Reward
            const profile = mockDb.getProfile(user_id);
            if (profile?.referred_by) {
              const userOrders = mockDb.getOrders(user_id).filter((o) => o.payment_status === "paid");
              if (userOrders.length === 1) {
                mockDb.completeReferral(user_id, 100);
              }
            }
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const { order_id, user_id } = intent.metadata;
        const failureReason = intent.last_payment_error?.message || "Card was declined";

        if (order_id) {
          if (!isMock && supabase) {
            // Update payments table with failed state and reason
            await supabase
              .from("payments")
              .update({
                status: "failed",
                failure_reason: failureReason,
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_payment_intent_id", intent.id);

            // Update orders payment status to failed
            await supabase
              .from("orders")
              .update({
                payment_status: "failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", order_id);

            // Create notification: "❌ Payment failed. Please try again."
            await supabase.from("notifications").insert({
              user_id: user_id,
              title: "Payment Failed ❌",
              message: "❌ Payment failed. Please try again.",
              is_read: false,
            });
          } else {
            mockDb.updateOrderPayment(order_id, "failed");
            mockDb.createNotification(
              user_id,
              "Payment Failed ❌",
              "❌ Payment failed. Please try again."
            );
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const orderId = charge.metadata?.order_id;
        const userId = charge.metadata?.user_id;
        const refundedAmount = charge.amount_refunded / 100; // convert paise to INR

        if (orderId && userId) {
          if (!isMock && supabase) {
            // Update payments status to refunded
            await supabase
              .from("payments")
              .update({
                status: "refunded",
                refunded_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("order_id", orderId);

            // Update orders payment_status to refunded
            await supabase
              .from("orders")
              .update({
                payment_status: "refunded",
                updated_at: new Date().toISOString(),
              })
              .eq("id", orderId);

            // Create notification: "💸 Refund processed. ₹[amount] in 3-5 days."
            await supabase.from("notifications").insert({
              user_id: userId,
              title: "Refund Processed 💸",
              message: `💸 Refund processed. ₹${refundedAmount} in 3-5 days.`,
              is_read: false,
            });
          } else {
            mockDb.updateOrderPayment(orderId, "failed");
            mockDb.createNotification(
              userId,
              "Refund Processed 💸",
              `💸 Refund processed. ₹${refundedAmount} in 3-5 days.`
            );
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[STRIPE WEBHOOK RUNTIME ERROR] ${error.message}`);
    // Always return 200 to Stripe to prevent retry storms on server processing hiccups
    return NextResponse.json({ error: error.message, received: true });
  }
}
