import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const profile = await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !order) {
        return errorResponse("Order not found.", 404, "ORDER_NOT_FOUND");
      }

      if (order.user_id !== profile.id && profile.role !== "admin") {
        return errorResponse("Unauthorized operation.", 403, "FORBIDDEN");
      }

      if (order.status !== "pending") {
        return errorResponse("Only pending orders can be cancelled.", 400, "INVALID_STATE");
      }

      const { data: updatedOrder, error: updateErr } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select("*")
        .single();

      if (updateErr) throw new Error(updateErr.message);

      // Log notification
      await supabase.from("notifications").insert({
        user_id: profile.id,
        title: "Order Cancelled 🚫",
        message: `Your order #${id} was cancelled successfully.`,
        is_read: false,
      });

      return successResponse(updatedOrder);
    } else {
      const order = mockDb.getOrder(id);
      if (!order) {
        return errorResponse("Order not found.", 404, "ORDER_NOT_FOUND");
      }

      if (order.user_id !== profile.id && profile.role !== "admin") {
        return errorResponse("Unauthorized operation.", 403, "FORBIDDEN");
      }

      if (order.status !== "pending") {
        return errorResponse("Only pending orders can be cancelled.", 400, "INVALID_STATE");
      }

      const updatedOrder = mockDb.updateOrderStatus(id, "cancelled");
      mockDb.createNotification(profile.id, "Order Cancelled 🚫", `Your order #${id} was cancelled successfully.`);

      return successResponse(updatedOrder);
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "CANCEL_ORDER_FAILED");
  }
}
