import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return successResponse(categories);
    } else {
      const categories = mockDb.getCategories();
      return successResponse(categories);
    }
  } catch (error: any) {
    return errorResponse(error.message, 500, "CATEGORIES_LOAD_FAILED");
  }
}
