import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const profile = await requireAuth(request);
    const inviteLink = `https://rasoihouse.com/register?ref=${profile.referral_code}`;

    return successResponse({
      invite_link: inviteLink,
      share_text: `Indulge in authentic Indian dining at Rasoi House! Register using my code ${profile.referral_code} to unlock delicious discounts.`,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return errorResponse(error.message, status, error.code || "SHARE_REFERRAL_FAILED");
  }
}
