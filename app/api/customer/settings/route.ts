import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const profile = await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    let codEnabled = false;
    let maxCodAmount = 1000; // default ₹1000 max amount for COD if enabled

    if (!isMock) {
      const supabase = createSupabaseServer();
      const { data: settings, error } = await supabase
        .from("customer_settings")
        .select("cod_enabled, max_cod_amount")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (settings) {
        codEnabled = settings.cod_enabled;
        maxCodAmount = settings.max_cod_amount || 1000;
      }
    } else {
      const settings = mockDb.getCustomerSettings(profile.id);
      codEnabled = settings.cod_enabled;
      maxCodAmount = settings.max_cod_amount || 1000;
    }

    return successResponse({
      cod_enabled: codEnabled,
      max_cod_amount: maxCodAmount,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "CUSTOMER_SETTINGS_FAILED");
  }
}
