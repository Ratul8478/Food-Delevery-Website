import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const profile = await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", profile.id);

      if (error) throw new Error(error.message);
    } else {
      const updated = mockDb.markNotificationAsRead(id);
      if (!updated) {
        return errorResponse("Notification not found.", 404, "NOT_FOUND");
      }
    }

    return successResponse({ marked_as_read: true, id });
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "MARK_NOTIFICATION_FAILED");
  }
}
