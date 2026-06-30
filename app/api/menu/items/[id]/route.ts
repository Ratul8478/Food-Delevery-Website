import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    // Standard mock reviews array for item detail richness
    const mockReviews = [
      { id: "rev-1", author: "Aarav Sharma", rating: 5, comment: "Absolutely incredible! The spices are perfectly balanced.", created_at: new Date().toISOString() },
      { id: "rev-2", author: "Anjali Gupta", rating: 4, comment: "Tastes like authentic heritage cooking. Highly recommended.", created_at: new Date().toISOString() },
    ];

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: item, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !item) {
        return errorResponse("Menu item not found.", 404, "ITEM_NOT_FOUND");
      }

      // Query reviews from database if reviews table exists
      const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("menu_item_id", id)
        .order("created_at", { ascending: false });

      return successResponse({
        item,
        reviews: reviews || mockReviews,
      });
    } else {
      const item = mockDb.getMenuItem(id);
      if (!item) {
        return errorResponse("Menu item not found.", 404, "ITEM_NOT_FOUND");
      }

      return successResponse({
        item,
        reviews: mockReviews,
      });
    }
  } catch (error: any) {
    return errorResponse(error.message, 500, "ITEM_DETAILS_FAILED");
  }
}
