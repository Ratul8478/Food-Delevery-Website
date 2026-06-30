import { NextResponse } from "next/server";
import { requireAdmin, requireAuth } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { z } from "zod";

const toggleCodSchema = z.object({
  cod_enabled: z.boolean(),
  max_cod_amount: z.number().optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const body = await request.json();
    const parsed = toggleCodSchema.parse(body);

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    let settings: any;
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
      
      const updatePayload: any = {
        user_id: id,
        cod_enabled: parsed.cod_enabled,
        cod_enabled_by: adminId,
        cod_enabled_at: new Date().toISOString(),
      };
      
      if (parsed.max_cod_amount !== undefined && parsed.max_cod_amount !== null) {
        updatePayload.max_cod_amount = parsed.max_cod_amount;
      }
      
      const { data, error } = await supabase
        .from("customer_settings")
        .upsert(updatePayload)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      settings = data;

      // Create notification for customer if enabled
      if (parsed.cod_enabled) {
        await supabase.from("notifications").insert({
          user_id: id,
          title: "COD Authorized! 🎉",
          message: `Cash on Delivery is now available for your account transactions up to ₹${parsed.max_cod_amount || 500}.`,
          is_read: false,
        });
      }
    } else {
      const updatePayload: any = {
        cod_enabled: parsed.cod_enabled,
        cod_enabled_by: adminId,
        cod_enabled_at: new Date().toISOString(),
      };
      
      if (parsed.max_cod_amount !== undefined && parsed.max_cod_amount !== null) {
        updatePayload.max_cod_amount = parsed.max_cod_amount;
      }

      settings = mockDb.updateCustomerSettings(id, updatePayload);

      if (parsed.cod_enabled) {
        mockDb.createNotification(
          id,
          "COD Authorized! 🎉",
          `Cash on Delivery is now available for your account transactions up to ₹${parsed.max_cod_amount || settings.max_cod_amount || 500}.`
        );
      }
    }

    return successResponse(settings);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0].message, 400, "VALIDATION_ERROR");
    }
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "UPDATE_SETTINGS_FAILED");
  }
}
