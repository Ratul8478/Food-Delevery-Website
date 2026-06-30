import { cookies } from "next/headers";
import { createSupabaseServer } from "./supabase-server";
import { mockDb, Profile } from "@/utils/mockDb";
import { ApiError } from "./api-response";

// Guard requiring active authenticated user session
export async function requireAuth(request: Request): Promise<Profile> {
  const sessionCookie = cookies().get("session");
  if (!sessionCookie) {
    throw new ApiError("Authentication session expired. Please log in.", 401, "UNAUTHORIZED");
  }

  let sessionUser;
  try {
    sessionUser = JSON.parse(sessionCookie.value);
  } catch (e) {
    throw new ApiError("Invalid authentication session details.", 401, "UNAUTHORIZED");
  }

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (!isMock) {
    const supabase = createSupabaseServer();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sessionUser.userId)
      .maybeSingle();

    if (error || !profile) {
      throw new ApiError("Customer profile not found in directory.", 404, "NOT_FOUND");
    }
    return {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      email_verified: profile.email_verified,
      phone_verified: profile.phone_verified,
      role: profile.role,
      referral_code: profile.referral_code,
      referred_by: profile.referred_by,
      total_points: profile.total_points,
      discount_tier: profile.discount_tier,
      created_at: profile.created_at,
    };
  } else {
    let profile = mockDb.getProfile(sessionUser.userId);
    if (!profile) {
      profile = {
        id: sessionUser.userId,
        full_name: sessionUser.fullName || "Guest User",
        email: sessionUser.email || "guest@example.com",
        phone: sessionUser.phone || "9876543210",
        email_verified: true,
        phone_verified: true,
        role: sessionUser.role || "customer",
        referral_code: sessionUser.referralCode || "SPICEMOCK",
        referred_by: null,
        total_points: 100,
        discount_tier: "bronze",
        created_at: new Date().toISOString(),
      };
      mockDb.upsertProfile(profile);
    }
    return profile;
  }
}

// Guard requiring verified email AND phone status before order placement
export async function requireVerified(request: Request): Promise<Profile> {
  const profile = await requireAuth(request);
  if (!profile.email_verified || !profile.phone_verified) {
    throw new ApiError(
      "Both email and phone verifications are required to access this feature.",
      403,
      "VERIFICATION_REQUIRED"
    );
  }
  return profile;
}

// Guard requiring administrative access
export async function requireAdmin(request: Request): Promise<Profile> {
  const profile = await requireAuth(request);
  if (profile.role !== "admin") {
    throw new ApiError("Access forbidden: Administrator privileges required.", 403, "ADMIN_REQUIRED");
  }
  return profile;
}
