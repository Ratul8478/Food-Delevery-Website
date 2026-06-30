import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      let query = supabase
        .from("orders")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data: orders, error } = await query;
      if (error) throw new Error(error.message);

      return successResponse(orders || []);
    } else {
      let orders = mockDb.getOrders();
      if (status) {
        orders = orders.filter((o) => o.status === status);
      }

      const resolved = orders.map((o) => {
        const p = mockDb.getProfile(o.user_id);
        return {
          ...o,
          profiles: p ? { full_name: p.full_name, email: p.email } : null,
        };
      });

      return successResponse(resolved);
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_ADMIN_ORDERS_FAILED");
  }
}
