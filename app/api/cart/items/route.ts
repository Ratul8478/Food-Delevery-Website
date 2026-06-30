import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { z } from "zod";

const addCartItemSchema = z.object({
  menu_item_id: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  special_note: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const profile = await requireAuth(request);
    const body = await request.json();
    
    // Validate inputs
    const parsed = addCartItemSchema.parse(body);

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();

      // Get or create cart
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

      // Check if item is already in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart.id)
        .eq("menu_item_id", parsed.menu_item_id)
        .maybeSingle();

      let result;
      if (existingItem) {
        // Update quantity
        const newQty = existingItem.quantity + parsed.quantity;
        const { data: updatedItem, error } = await supabase
          .from("cart_items")
          .update({ quantity: newQty, special_note: parsed.special_note })
          .eq("id", existingItem.id)
          .select("*")
          .single();
        
        if (error) throw new Error(error.message);
        result = updatedItem;
      } else {
        // Insert new item
        const { data: newItem, error } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cart.id,
            menu_item_id: parsed.menu_item_id,
            quantity: parsed.quantity,
            special_note: parsed.special_note,
          })
          .select("*")
          .single();

        if (error) throw new Error(error.message);
        result = newItem;
      }

      return successResponse(result);
    } else {
      const cartId = mockDb.getCartId(profile.id);
      const result = mockDb.addCartItem(cartId, {
        menu_item_id: parsed.menu_item_id,
        quantity: parsed.quantity,
        special_note: parsed.special_note || null,
      });

      return successResponse(result);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "ADD_CART_ITEM_ERROR");
  }
}
