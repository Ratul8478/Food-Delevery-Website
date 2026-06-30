import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const profile = await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: payments, error } = await supabase
        .from("payment_records")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return successResponse(payments || []);
    } else {
      // Return payments calculated from orders paid online
      const paidOrders = mockDb.getOrders(profile.id).filter((o) => o.payment_status === "paid");
      const payments = paidOrders.map((o) => ({
        id: "pay_" + Math.random().toString(36).substr(2, 9),
        order_id: o.id,
        user_id: profile.id,
        amount: o.total_amount,
        status: "succeeded",
        payment_method: o.payment_method,
        created_at: o.created_at,
      }));
      return successResponse(payments);
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "PAYMENT_HISTORY_FAILED");
  }
}
