import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { applyReferralAtCheckout } from "@/lib/referral-service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const profile = await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    let subtotal = 0;

    if (!isMock) {
      const supabase = createSupabaseServer();

      // Get user's cart
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (cart) {
        // Fetch cart items with menu details
        const { data: items } = await supabase
          .from("cart_items")
          .select(`
            quantity,
            menu_items (
              price
            )
          `)
          .eq("cart_id", cart.id);

        items?.forEach((item: any) => {
          if (item.menu_items) {
            subtotal += item.menu_items.price * item.quantity;
          }
        });
      }
    } else {
      const cartId = mockDb.getCartId(profile.id);
      const items = mockDb.getCartItems(cartId);
      items.forEach((item) => {
        const menuItem = mockDb.getMenuItem(item.menu_item_id);
        if (menuItem) {
          subtotal += menuItem.price * item.quantity;
        }
      });
    }

    // Call service to apply discount based on referrals count
    const discountData = await applyReferralAtCheckout(profile.id, subtotal);

    return successResponse({
      subtotal,
      discount_amount: discountData.discount_amount,
      discount_percent: discountData.discount_percent,
      tier_name: discountData.tier_name,
      total: Math.max(0, subtotal - discountData.discount_amount),
    });
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "APPLY_DISCOUNT_ERROR");
  }
}
