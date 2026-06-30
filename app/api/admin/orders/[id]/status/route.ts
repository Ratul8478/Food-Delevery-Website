import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(request);
    const { id } = params;
    
    const body = await request.json();
    const parsed = updateStatusSchema.parse(body);

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    let order: any;

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      
      const { data: updated, error } = await supabase
        .from("orders")
        .update({ status: parsed.status })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      order = updated;

      // 1. Notify user
      const statusTitles = {
        confirmed: "Order Confirmed! 👍",
        preparing: "Preparing Food! 👨‍🍳",
        out_for_delivery: "Out for Delivery! 🛵",
        delivered: "Delivered! 🍽️",
        cancelled: "Order Cancelled! 🚫",
        pending: "Order Pending",
      };

      await supabase.from("notifications").insert({
        user_id: order.user_id,
        title: statusTitles[parsed.status] || "Order Updated",
        message: `Your order #${id} status is now: ${parsed.status.replace(/_/g, " ")}.`,
        is_read: false,
      });

      // 2. If status set to 'delivered', complete referrals check
      if (parsed.status === "delivered") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("referred_by, id")
          .eq("id", order.user_id)
          .single();

        if (profile?.referred_by) {
          // Count customer's successful orders
          const { count } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("user_id", order.user_id)
            .eq("status", "delivered");

          if (count === 1) {
            // Find active registered referral
            const { data: ref } = await supabase
              .from("referrals")
              .select("id")
              .eq("referee_id", order.user_id)
              .eq("status", "registered")
              .maybeSingle();

            if (ref) {
              await supabase
                .from("referrals")
                .update({ status: "ordered", points_earned: 200 })
                .eq("id", ref.id);

              // Update referrer points
              const { data: referrer } = await supabase
                .from("profiles")
                .select("total_points")
                .eq("id", profile.referred_by)
                .single();

              if (referrer) {
                const newPts = referrer.total_points + 200;
                let newTier = "bronze";
                if (newPts >= 2000) newTier = "diamond";
                else if (newPts >= 1500) newTier = "platinum";
                else if (newPts >= 1000) newTier = "gold";
                else if (newPts >= 500) newTier = "silver";

                await supabase
                  .from("profiles")
                  .update({ total_points: newPts, discount_tier: newTier })
                  .eq("id", profile.referred_by);
              }
            }
          }
        }
      }
    } else {
      order = mockDb.updateOrderStatus(id, parsed.status);
      if (!order) {
        return errorResponse("Order not found.", 404, "ORDER_NOT_FOUND");
      }

      const statusTitles = {
        confirmed: "Order Confirmed! 👍",
        preparing: "Preparing Food! 👨‍🍳",
        out_for_delivery: "Out for Delivery! 🛵",
        delivered: "Delivered! 🍽️",
        cancelled: "Order Cancelled! 🚫",
        pending: "Order Pending",
      };

      mockDb.createNotification(
        order.user_id,
        statusTitles[parsed.status] || "Order Updated",
        `Your order #${id} status is now: ${parsed.status.replace(/_/g, " ")}.`
      );

      // Trigger referral logic if status is delivered
      if (parsed.status === "delivered") {
        const profile = mockDb.getProfile(order.user_id);
        if (profile?.referred_by) {
          const userOrders = mockDb.getOrders(order.user_id).filter((o) => o.status === "delivered");
          if (userOrders.length === 1) {
            mockDb.completeReferral(order.user_id, 200);
          }
        }
      }
    }

    return successResponse(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "UPDATE_STATUS_FAILED");
  }
}
