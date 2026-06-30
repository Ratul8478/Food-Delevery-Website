import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb, MenuItem } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { z } from "zod";

const menuItemSchema = z.object({
  category_id: z.string().min(1, "Category ID is required"),
  name: z.string().min(2, "Name is required"),
  description: z.string().min(5, "Description is required"),
  price: z.number().min(0, "Price cannot be negative"),
  image_url: z.string().url("Invalid image URL"),
  is_available: z.boolean().default(true),
  is_veg: z.boolean().default(true),
  is_jain: z.boolean().default(false),
  spiciness: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
});

// GET /api/admin/menu/items: load all items for management
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      const { data: items, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return successResponse(items || []);
    } else {
      const items = mockDb.getMenuItems();
      return successResponse(items);
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_MENU_ITEMS_FAILED");
  }
}

// POST /api/admin/menu/items: create a new recipe item
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    
    const body = await request.json();
    const parsed = menuItemSchema.parse(body);

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    let item: any;

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          ...parsed,
          rating: 5.0,
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      item = data;
    } else {
      const itemId = "item-" + Math.floor(200 + Math.random() * 800);
      item = {
        id: itemId,
        rating: 5.0,
        ...parsed,
      };
      mockDb.upsertMenuItem(item);
    }

    return successResponse(item);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "CREATE_MENU_ITEM_FAILED");
  }
}
