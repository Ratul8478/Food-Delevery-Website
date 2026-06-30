import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const profile = await requireAuth(request);

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (orderErr || !order) {
        return errorResponse("Order not found.", 404, "ORDER_NOT_FOUND");
      }

      // Check authorization (must be user who placed it or an admin)
      if (order.user_id !== profile.id && profile.role !== "admin") {
        return errorResponse("Unauthorized access to this order details.", 403, "FORBIDDEN");
      }

      const { data: items, error: itemsErr } = await supabase
        .from("order_items")
        .select(`
          id,
          name,
          price,
          quantity,
          special_note,
          menu_items (
            image_url,
            is_veg
          )
        `)
        .eq("order_id", id);

      return successResponse({
        order,
        items: items || [],
      });
    } else {
      const order = mockDb.getOrder(id);
      if (!order) {
        return errorResponse("Order not found.", 404, "ORDER_NOT_FOUND");
      }

      if (order.user_id !== profile.id && profile.role !== "admin") {
        return errorResponse("Unauthorized access to this order details.", 403, "FORBIDDEN");
      }

      const items = mockDb.getOrderItems(id);
      const resolvedItems = items.map((item) => {
        const m = mockDb.getMenuItem(item.menu_item_id);
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          special_note: item.special_note,
          menu_items: m ? { image_url: m.image_url, is_veg: m.is_veg } : null,
        };
      });

      return successResponse({
        order,
        items: resolvedItems,
      });
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_ORDER_DETAIL_FAILED");
  }
}
