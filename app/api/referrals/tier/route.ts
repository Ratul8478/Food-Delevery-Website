import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { mockDb } from "@/utils/mockDb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { calculateDiscount, getNextTier, getProgressToNextTier } from "@/lib/referral-engine";

export async function GET(request: Request) {
  try {
    const profile = await requireAuth(request);
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
    let successfulReferralsCount = 0;

    if (!isMock) {
      const supabase = createSupabaseAdmin();
      const { count } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", profile.id)
        .in("status", ["ordered", "rewarded"]);

      successfulReferralsCount = count || 0;
    } else {
      const refs = mockDb.getReferrals(profile.id);
      successfulReferralsCount = refs.filter((r) => r.status === "ordered").length;
    }

    const discountInfo = calculateDiscount(successfulReferralsCount);
    const nextTierInfo = getNextTier(successfulReferralsCount);
    const progressInfo = getProgressToNextTier(successfulReferralsCount);

    return successResponse({
      current_tier: discountInfo.tier,
      next_tier: nextTierInfo.name,
      progress_percent: progressInfo.percent,
      discount_percent: discountInfo.percent,
      referrals_count: successfulReferralsCount,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_TIER_FAILED");
  }
}
