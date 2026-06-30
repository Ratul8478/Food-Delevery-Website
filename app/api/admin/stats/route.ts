import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import dayjs from "dayjs";

export async function GET(request: Request) {
  try {
    // 1. Authenticate admin
    await requireAdmin(request);

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    const todayStr = dayjs().format("YYYY-MM-DD");

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      
      const startOfDay = dayjs().startOf("day").toISOString();
      const endOfDay = dayjs().endOf("day").toISOString();

      // Orders today count
      const { count: ordersToday } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      // Revenue today
      const { data: revData } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "delivered")
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);
      const revenueToday = revData?.reduce((sum, item) => sum + item.total_amount, 0) || 0;

      // New customers count
      const { count: customersToday } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      // Pending/Preparing orders
      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "confirmed", "preparing", "out_for_delivery"]);

      // Referral signups today
      const { count: referralsToday } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      return successResponse({
        orders_today: ordersToday || 0,
        revenue_today: revenueToday,
        new_customers_today: customersToday || 0,
        pending_orders: pendingOrders || 0,
        total_referrals_today: referralsToday || 0,
      });
    } else {
      const orders = mockDb.getOrders();
      const profiles = mockDb.getProfiles();
      const referrals = mockDb.getReferrals("usr_mock_123"); // Mock referrals count

      // Orders today
      const ordersTodayList = orders.filter((o) => dayjs(o.created_at).format("YYYY-MM-DD") === todayStr);
      const ordersToday = ordersTodayList.length;

      // Revenue today
      const revenueToday = ordersTodayList
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + o.total_amount, 0);

      // Customers today
      const customersToday = profiles.filter((p) => dayjs(p.created_at).format("YYYY-MM-DD") === todayStr).length;

      // Pending
      const pendingOrders = orders.filter((o) => ["pending", "confirmed", "preparing", "out_for_delivery"].includes(o.status)).length;

      // Referrals today
      const referralsToday = referrals.filter((r) => dayjs(r.created_at).format("YYYY-MM-DD") === todayStr).length;

      return successResponse({
        orders_today: ordersToday,
        revenue_today: revenueToday,
        new_customers_today: customersToday,
        pending_orders: pendingOrders,
        total_referrals_today: referralsToday,
      });
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_STATS_FAILED");
  }
}
