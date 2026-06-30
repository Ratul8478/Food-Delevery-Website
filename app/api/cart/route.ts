import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

// GET /api/cart: retrieve user's cart items resolved with item details
export async function GET(request: Request) {
  try {
    const profile = await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();

      // Find or create cart
      let { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!cart) {
        const { data: newCart, error: createErr } = await supabase
          .from("carts")
          .insert({ user_id: profile.id })
          .select("id")
          .single();

        if (createErr || !newCart) throw new Error(createErr?.message || "Failed to create cart session");
        cart = newCart;
      }

      // Fetch cart items with menu details
      const { data: items, error: itemsErr } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          special_note,
          menu_items (
            id,
            name,
            description,
            price,
            image_url,
            is_veg,
            is_jain
          )
        `)
        .eq("cart_id", cart.id);

      if (itemsErr) throw new Error(itemsErr.message);

      return successResponse({
        cart_id: cart.id,
        items: items || [],
      });
    } else {
      const cartId = mockDb.getCartId(profile.id);
      const items = mockDb.getCartItems(cartId);

      const resolvedItems = items.map((item) => {
        const menuItem = mockDb.getMenuItem(item.menu_item_id);
        return {
          id: item.id,
          quantity: item.quantity,
          special_note: item.special_note,
          menu_items: menuItem,
        };
      });

      return successResponse({
        cart_id: cartId,
        items: resolvedItems,
      });
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "CART_LOAD_ERROR");
  }
}

// DELETE /api/cart: clear all items from the user's cart
export async function DELETE(request: Request) {
  try {
    const profile = await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", profile.id)
        .single();

      if (cart) {
        await supabase.from("cart_items").delete().eq("cart_id", cart.id);
      }
    } else {
      const cartId = mockDb.getCartId(profile.id);
      mockDb.clearCart(cartId);
    }

    return successResponse({ cleared: true, message: "Cart cleared successfully" });
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "CART_CLEAR_ERROR");
  }
}
