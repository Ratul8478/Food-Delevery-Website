import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import dayjs from "dayjs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date") || dayjs().subtract(7, "day").format("YYYY-MM-DD");
    const endDate = searchParams.get("end_date") || dayjs().format("YYYY-MM-DD");

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    const revenueMap: Record<string, number> = {};

    // Initialize all dates in the range to 0
    let current = dayjs(startDate);
    const end = dayjs(endDate);
    while (current.isBefore(end) || current.isSame(end, "day")) {
      revenueMap[current.format("YYYY-MM-DD")] = 0;
      current = current.add(1, "day");
    }

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .eq("status", "delivered")
        .gte("created_at", dayjs(startDate).startOf("day").toISOString())
        .lte("created_at", dayjs(endDate).endOf("day").toISOString());

      if (error) throw new Error(error.message);

      orders?.forEach((o) => {
        const dateStr = dayjs(o.created_at).format("YYYY-MM-DD");
        if (revenueMap[dateStr] !== undefined) {
          revenueMap[dateStr] += o.total_amount;
        }
      });
    } else {
      const orders = mockDb.getOrders();
      const filtered = orders.filter(
        (o) =>
          o.status === "delivered" &&
          dayjs(o.created_at).isAfter(dayjs(startDate).subtract(1, "day")) &&
          dayjs(o.created_at).isBefore(dayjs(endDate).add(1, "day"))
      );

      filtered.forEach((o) => {
        const dateStr = dayjs(o.created_at).format("YYYY-MM-DD");
        if (revenueMap[dateStr] !== undefined) {
          revenueMap[dateStr] += o.total_amount;
        }
      });
    }

    // Format for charts response
    const data = Object.keys(revenueMap).map((date) => ({
      date,
      revenue: revenueMap[date],
    }));

    return successResponse(data);
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_REVENUE_FAILED");
  }
}
