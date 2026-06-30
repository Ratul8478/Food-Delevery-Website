import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserReferralData } from "@/lib/referral-service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const profile = await requireAuth(request);
    const dashboardData = await getUserReferralData(profile.id);
    return successResponse(dashboardData);
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "LOAD_REFERRALS_FAILED");
  }
}
