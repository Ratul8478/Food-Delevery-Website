import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      
      const { data: categories, error: catErr } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (catErr) throw new Error(catErr.message);

      const { data: items, error: itemErr } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true);

      if (itemErr) throw new Error(itemErr.message);

      // Structure response by grouping items under categories
      const menu = categories.map((cat) => ({
        ...cat,
        items: items.filter((item) => item.category_id === cat.id),
      }));

      return successResponse(menu);
    } else {
      const categories = mockDb.getCategories();
      const items = mockDb.getMenuItems().filter((item) => item.is_available);

      const menu = categories.map((cat) => ({
        ...cat,
        items: items.filter((item) => item.category_id === cat.id),
      }));

      return successResponse(menu);
    }
  } catch (error: any) {
    return errorResponse(error.message, 500, "MENU_LOAD_FAILED");
  }
}
