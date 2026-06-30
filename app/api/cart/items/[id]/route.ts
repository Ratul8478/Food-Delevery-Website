import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { z } from "zod";

const updateItemSchema = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

// PATCH: update quantity of a specific cart item
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const profile = await requireAuth(request);
    const body = await request.json();

    const parsed = updateItemSchema.parse(body);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: updatedItem, error } = await supabase
        .from("cart_items")
        .update({ quantity: parsed.quantity })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return successResponse(updatedItem);
    } else {
      const updatedItem = mockDb.updateCartItemQuantity(id, parsed.quantity);
      if (!updatedItem) {
        return errorResponse("Cart item not found.", 404, "ITEM_NOT_FOUND");
      }
      return successResponse(updatedItem);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "UPDATE_CART_ITEM_ERROR");
  }
}

// DELETE: remove a specific cart item
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const deleted = mockDb.removeCartItem(id);
      if (!deleted) {
        return errorResponse("Cart item not found.", 404, "ITEM_NOT_FOUND");
      }
    }

    return successResponse({ deleted: true, message: "Cart item removed" });
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "DELETE_CART_ITEM_ERROR");
  }
}
