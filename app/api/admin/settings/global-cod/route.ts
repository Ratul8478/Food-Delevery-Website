import { NextResponse } from "next/server";
import { requireAdmin, requireAuth } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { z } from "zod";

const globalCodSchema = z.object({
  cod_enabled: z.boolean(),
  max_cod_amount: z.number().optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = globalCodSchema.parse(body);

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    let adminId = "admin_mock_999";

    if (!isMock) {
      const admin = await requireAdmin(request);
      adminId = admin.id;
    } else {
      try {
        const currentUser = await requireAuth(request);
        adminId = currentUser.id;
      } catch (e) {}
    }

    if (!isMock) {
      const supabase = createSupabaseAdmin();

      // 1. Get all customer profile IDs
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id");

      if (profError) throw new Error(profError.message);

      if (profiles && profiles.length > 0) {
        // 2. Prepare bulk upsert payload
        const upserts = profiles.map((p) => ({
          user_id: p.id,
          cod_enabled: parsed.cod_enabled,
          cod_enabled_by: adminId,
          cod_enabled_at: new Date().toISOString(),
          max_cod_amount: parsed.max_cod_amount || 1000,
        }));

        // 3. Perform bulk upsert
        const { error: upsertError } = await supabase
          .from("customer_settings")
          .upsert(upserts);

        if (upsertError) throw new Error(upsertError.message);
      }
    } else {
      // Update global store in mockDb
      mockDb.updateGlobalCodSettings(parsed.cod_enabled, parsed.max_cod_amount || 1000);
    }

    return successResponse({
      success: true,
      cod_enabled: parsed.cod_enabled,
      max_cod_amount: parsed.max_cod_amount || 1000,
      message: `Cash on Delivery has been ${parsed.cod_enabled ? "enabled" : "disabled"} for all customers.`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "GLOBAL_COD_UPDATE_FAILED");
  }
}
