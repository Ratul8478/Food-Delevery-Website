import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { z } from "zod";

const updateMenuItemSchema = z.object({
  category_id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  image_url: z.string().url().optional(),
  is_available: z.boolean().optional(),
  is_veg: z.boolean().optional(),
  is_jain: z.boolean().optional(),
  spiciness: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(request);
    const { id } = params;
    
    const body = await request.json();
    const parsed = updateMenuItemSchema.parse(body);

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    let item: any;

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      const { data, error } = await supabase
        .from("menu_items")
        .update(parsed)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      item = data;
    } else {
      const current = mockDb.getMenuItem(id);
      if (!current) {
        return errorResponse("Menu item not found.", 404, "NOT_FOUND");
      }

      item = {
        ...current,
        ...parsed,
      } as any;
      
      mockDb.upsertMenuItem(item);
    }

    return successResponse(item);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "UPDATE_MENU_ITEM_FAILED");
  }
}
