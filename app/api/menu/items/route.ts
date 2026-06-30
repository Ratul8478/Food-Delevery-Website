import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");
    const isVeg = searchParams.get("is_veg") === "true";
    const isJain = searchParams.get("is_jain") === "true";
    const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : null;

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      let query = supabase.from("menu_items").select("*").eq("is_available", true);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      if (isVeg) {
        query = query.eq("is_veg", true);
      }
      if (isJain) {
        query = query.eq("is_jain", true);
      }
      if (maxPrice) {
        query = query.lte("price", maxPrice);
      }

      const { data: items, error } = await query;
      if (error) throw new Error(error.message);

      return successResponse(items);
    } else {
      let items = mockDb.getMenuItems().filter((item) => item.is_available);

      if (categoryId) {
        items = items.filter((item) => item.category_id === categoryId);
      }
      if (isVeg) {
        items = items.filter((item) => item.is_veg === true);
      }
      if (isJain) {
        items = items.filter((item) => item.is_jain === true);
      }
      if (maxPrice) {
        items = items.filter((item) => item.price <= maxPrice);
      }

      return successResponse(items);
    }
  } catch (error: any) {
    return errorResponse(error.message, 500, "ITEMS_LOAD_FAILED");
  }
}
