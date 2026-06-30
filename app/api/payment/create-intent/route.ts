import { NextResponse } from "next/server";
import { requireVerified } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const createIntentSchema = z.object({
  order_id: z.string().min(1, "Order ID is required"),
});

export async function POST(request: Request) {
  try {
    // 1. requireVerified()
    const profile = await requireVerified(request);
    const body = await request.json();

    const parsed = createIntentSchema.parse(body);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    let totalAmount = 0;
    const orderId = parsed.order_id;
    let orderNumber = "";
    const userEmail = profile.email;
    let order: any = null;

    // 2. Fetch order from DB/Mock (must belong to this user, status='pending', payment_status='pending')
    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: dbOrder, error } = await supabase
        .from("orders")
        .select("id, total_amount, user_id, order_number, payment_status, status")
        .eq("id", orderId)
        .maybeSingle();

      if (error || !dbOrder) {
        return errorResponse("Order not found.", 404, "ORDER_NOT_FOUND");
      }

      order = dbOrder;
    } else {
      const dbOrder = mockDb.getOrder(orderId);
      if (!dbOrder) {
        return errorResponse("Order not found.", 404, "ORDER_NOT_FOUND");
      }
      order = dbOrder;
    }

    // Verify ownership
    if (order.user_id !== profile.id) {
      return errorResponse("Unauthorized access to this order.", 403, "FORBIDDEN");
    }

    // Verify status states
    if (order.status !== "pending" || order.payment_status !== "pending") {
      return errorResponse("This order is not eligible for payment (must be pending status and payment).", 400, "INVALID_STATE");
    }

    totalAmount = Number(order.total_amount);
    orderNumber = order.order_number || `ORD-${order.id}`;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey && !stripeSecretKey.includes("placeholder")) {
      // 3. Create or resolve Stripe Customer
      let stripeCustomerId = "";
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          name: profile.full_name,
          phone: profile.phone,
        });
        stripeCustomerId = customer.id;
      }

      // Create Stripe PaymentIntent
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // INR uses paise (multiply by 100)
        currency: "inr",
        customer: stripeCustomerId,
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
          user_id: profile.id,
        },
        payment_method_types: ["card", "upi", "netbanking"],
        description: `Rasoi House Order ${orderNumber}`,
        receipt_email: userEmail,
        statement_descriptor: "RASOI HOUSE",
      });

      // 4. Save stripe_payment_intent_id to payments table
      if (!isMock) {
        const supabase = createSupabaseServer();
        const { error: insertErr } = await supabase.from("payments").insert({
          order_id: order.id,
          user_id: profile.id,
          stripe_payment_intent_id: intent.id,
          amount_paise: Math.round(totalAmount * 100),
          amount_inr: totalAmount,
          status: "created",
        });
        if (insertErr) throw new Error(insertErr.message);
      }

      // 5. Return { client_secret: intent.client_secret }
      return successResponse({
        client_secret: intent.client_secret,
        paymentIntentId: intent.id,
      });
    } else {
      // Fallback for mock simulator testing when stripe keys are placeholder
      const mockIntentId = `pi_mock_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[STRIPE INTENT MOCK] Created intent for order: ${orderId}`);

      if (!isMock) {
        const supabase = createSupabaseServer();
        await supabase.from("payments").insert({
          order_id: order.id,
          user_id: profile.id,
          stripe_payment_intent_id: mockIntentId,
          amount_paise: Math.round(totalAmount * 100),
          amount_inr: totalAmount,
          status: "created",
        });
      }

      return successResponse({
        client_secret: `mock_secret_intent_${Math.random().toString(36).substr(2, 9)}`,
        paymentIntentId: mockIntentId,
        is_mock: true,
      });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "PAYMENT_INTENT_FAILED");
  }
}
