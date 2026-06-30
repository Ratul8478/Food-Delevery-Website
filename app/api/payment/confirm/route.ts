import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { z } from "zod";

const confirmPaymentSchema = z.object({
  order_id: z.string().min(1, "Order ID is required"),
  payment_intent_id: z.string().optional(),
  stripe_payment_intent_id: z.string().optional(),
}).refine(data => data.payment_intent_id || data.stripe_payment_intent_id, {
  message: "Payment intent ID is required",
  path: ["payment_intent_id"]
});


export async function POST(request: Request) {
  try {
    const profile = await requireAuth(request);
    const body = await request.json();

    const parsed = confirmPaymentSchema.parse(body);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    let order: any;

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: orderToCheck } = await supabase
        .from("orders")
        .select("*")
        .eq("id", parsed.order_id)
        .maybeSingle();

      if (!orderToCheck) {
        return errorResponse("Order not found.", 404, "ORDER_NOT_FOUND");
      }

      if (orderToCheck.user_id !== profile.id) {
        return errorResponse("Unauthorized operation.", 403, "FORBIDDEN");
      }

      const { data: updated, error } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
        })
        .eq("id", parsed.order_id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      order = updated;

      // Add points transaction or notification
      await supabase.from("notifications").insert({
        user_id: profile.id,
        title: "Payment Confirmed! 💳",
        message: `Your payment of ₹${order.total_amount} was successfully verified.`,
        is_read: false,
      });

    } else {
      const orderToCheck = mockDb.getOrder(parsed.order_id);
      if (!orderToCheck) {
        return errorResponse("Order not found.", 404, "ORDER_NOT_FOUND");
      }

      if (orderToCheck.user_id !== profile.id) {
        return errorResponse("Unauthorized operation.", 403, "FORBIDDEN");
      }

      mockDb.updateOrderStatus(parsed.order_id, "confirmed");
      order = mockDb.updateOrderPayment(parsed.order_id, "paid");

      mockDb.createNotification(
        profile.id,
        "Payment Confirmed! 💳",
        `Your payment of ₹${orderToCheck.total_amount} was successfully verified.`
      );
    }

    return successResponse(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "PAYMENT_CONFIRMATION_FAILED");
  }
}
