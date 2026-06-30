import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function PATCH(request: Request) {
  try {
    const profile = await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", profile.id);

      if (error) throw new Error(error.message);
    } else {
      mockDb.markAllNotificationsRead(profile.id);
    }

    return successResponse({ marked_all_read: true });
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "MARK_ALL_NOTIFICATIONS_FAILED");
  }
}
