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
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;
    const offset = (page - 1) * limit;

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    // Month ranges for aggregation
    const currentMonthStart = dayjs().startOf("month");
    const currentMonthEnd = dayjs().endOf("month");
    const lastMonthStart = dayjs().subtract(1, "month").startOf("month");
    const lastMonthEnd = dayjs().subtract(1, "month").endOf("month");

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      
      // 1. Fetch profiles
      const { data: profiles, error: profilesErr, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (profilesErr) throw new Error(profilesErr.message);

      // 2. Fetch orders and settings for these profiles to aggregate in memory
      const profileIds = profiles?.map((p) => p.id) || [];
      
      let allOrders: any[] = [];
      let allSettings: any[] = [];

      if (profileIds.length > 0) {
        const { data: ordersData } = await supabase
          .from("orders")
          .select("user_id, total_amount, status, created_at")
          .in("user_id", profileIds);
        
        allOrders = ordersData || [];

        const { data: settingsData } = await supabase
          .from("customer_settings")
          .select("user_id, cod_enabled, max_cod_amount")
          .in("user_id", profileIds);
        
        allSettings = settingsData || [];
      }

      const customers = (profiles || []).map((p) => {
        const userOrders = allOrders.filter((o) => o.user_id === p.id);
        const userSettings = allSettings.find((s) => s.user_id === p.id);

        const totalOrders = userOrders.length;
        
        const monthlyOrderBill = userOrders
          .filter((o) => {
            const date = dayjs(o.created_at);
            return o.status !== "cancelled" && date.isAfter(currentMonthStart) && date.isBefore(currentMonthEnd);
          })
          .reduce((sum, o) => sum + Number(o.total_amount), 0);

        const lastMonthOrders = userOrders.filter((o) => {
          const date = dayjs(o.created_at);
          return date.isAfter(lastMonthStart) && date.isBefore(lastMonthEnd);
        }).length;

        return {
          id: p.id,
          name: p.full_name,
          email: p.email,
          phone: p.phone,
          emailVerified: p.email_verified,
          phoneVerified: p.phone_verified,
          totalPoints: p.total_points,
          codEnabled: userSettings ? userSettings.cod_enabled : false,
          maxCodAmount: userSettings ? Number(userSettings.max_cod_amount) : 500,
          totalOrders,
          monthlyOrderBill: Math.round(monthlyOrderBill),
          lastMonthOrders,
        };
      });

      return successResponse({
        customers,
        total: count || 0,
        page,
        limit,
      });
    } else {
      const profiles = mockDb.getProfiles();
      const allOrders = mockDb.getOrders();
      
      const customers = profiles.map((p) => {
        const userOrders = allOrders.filter((o) => o.user_id === p.id);
        const userSettings = mockDb.getCustomerSettings(p.id);

        const totalOrders = userOrders.length;

        const monthlyOrderBill = userOrders
          .filter((o) => {
            const date = dayjs(o.created_at);
            return o.status !== "cancelled" && date.isAfter(currentMonthStart) && date.isBefore(currentMonthEnd);
          })
          .reduce((sum, o) => sum + Number(o.total_amount), 0);

        const lastMonthOrders = userOrders.filter((o) => {
          const date = dayjs(o.created_at);
          return date.isAfter(lastMonthStart) && date.isBefore(lastMonthEnd);
        }).length;

        return {
          id: p.id,
          name: p.full_name,
          email: p.email,
          phone: p.phone,
          emailVerified: p.email_verified,
          phoneVerified: p.phone_verified,
          totalPoints: p.total_points,
          codEnabled: userSettings.cod_enabled,
          maxCodAmount: userSettings.max_cod_amount || 500,
          totalOrders,
          monthlyOrderBill: Math.round(monthlyOrderBill),
          lastMonthOrders,
        };
      });

      const paginated = customers.slice(offset, offset + limit);

      return successResponse({
        customers: paginated,
        total: customers.length,
        page,
        limit,
      });
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_CUSTOMERS_FAILED");
  }
}
