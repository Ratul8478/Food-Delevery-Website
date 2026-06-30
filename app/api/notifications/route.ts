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
      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return successResponse(notifications || []);
    } else {
      const notifications = mockDb.getNotifications(profile.id).filter((n) => !n.is_read);
      return successResponse(notifications);
    }
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_NOTIFICATIONS_FAILED");
  }
}
