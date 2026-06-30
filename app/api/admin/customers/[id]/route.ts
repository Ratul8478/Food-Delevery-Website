import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(request);
    const { id } = params;
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !profile) {
        return errorResponse("Customer not found.", 404, "CUSTOMER_NOT_FOUND");
      }

      // Load settings
      const { data: settings } = await supabase
        .from("customer_settings")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();

      // Load history
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      return successResponse({
        customer: profile,
        settings: settings || { cod_enabled: false },
        orders: orders || [],
      });
    } else {
      const profile = mockDb.getProfile(id);
      if (!profile) {
        return errorResponse("Customer not found.", 404, "CUSTOMER_NOT_FOUND");
      }

      const settings = mockDb.getCustomerSettings(id);
      const orders = mockDb.getOrders(id);

      return successResponse({
        customer: profile,
        settings,
        orders,
      });
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_CUSTOMER_DETAIL_FAILED");
  }
}
