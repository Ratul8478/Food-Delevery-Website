import { createSupabaseAdmin } from "./supabase-server";
import { mockDb, Profile, Referral } from "@/utils/mockDb";
import { calculateDiscount, getNextTier, getProgressToNextTier, calculatePoints } from "./referral-engine";

export interface ReferralDashboard {
  referral_code: string;
  total_referrals: number;
  current_tier: string;
  next_tier: string;
  progress_percent: number;
  referrals_to_next: number;
  total_points: number;
  current_discount: number;
  referral_list: any[];
  points_history: any[];
}

const isMockEnv = () => !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

// 1. Get referral details and stats for the user dashboard
export async function getUserReferralData(userId: string): Promise<ReferralDashboard> {
  const isMock = isMockEnv();

  let referralCode = "";
  let totalPoints = 0;
  let referralsList: any[] = [];
  let pointsHistory: any[] = [];

  if (!isMock) {
    const supabase = createSupabaseAdmin();
    
    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code, total_points")
      .eq("id", userId)
      .single();

    if (profile) {
      referralCode = profile.referral_code;
      totalPoints = profile.total_points;
    }

    // Fetch referred friends list
    const { data: refs } = await supabase
      .from("referrals")
      .select(`
        id,
        status,
        points_earned,
        created_at,
        referee:profiles!referee_id (
          full_name,
          email
        )
      `)
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    referralsList = refs || [];

    // Fetch points transactions history
    const { data: txns } = await supabase
      .from("points_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    pointsHistory = txns || [];
  } else {
    const profile = mockDb.getProfile(userId);
    if (profile) {
      referralCode = profile.referral_code;
      totalPoints = profile.total_points;
    }

    const refs = mockDb.getReferrals(userId);
    referralsList = refs.map((r) => {
      const referee = mockDb.getProfile(r.referee_id);
      return {
        id: r.id,
        status: r.status,
        points_earned: r.points_earned,
        created_at: r.created_at,
        referee: referee ? { full_name: referee.full_name, email: referee.email } : null,
      };
    });

    // Mock point transaction logs based on points value
    pointsHistory = [
      { id: "tx-1", user_id: userId, points: 100, type: "referral", description: "Referred Rajesh Kumar", created_at: new Date().toISOString() },
      { id: "tx-2", user_id: userId, points: 50, type: "order", description: "Order placement bonus", created_at: new Date().toISOString() },
    ];
  }

  // Count successful referrals (friends who ordered)
  const successfulReferrals = referralsList.filter((r) => r.status === "ordered" || r.status === "rewarded").length;

  const discountInfo = calculateDiscount(successfulReferrals);
  const nextTierInfo = getNextTier(successfulReferrals);
  const progressInfo = getProgressToNextTier(successfulReferrals);

  return {
    referral_code: referralCode,
    total_referrals: referralsList.length,
    current_tier: discountInfo.tier,
    next_tier: nextTierInfo.name,
    progress_percent: progressInfo.percent,
    referrals_to_next: progressInfo.remaining,
    total_points: totalPoints,
    current_discount: discountInfo.percent,
    referral_list: referralsList,
    points_history: pointsHistory,
  };
}

// 2. Apply referral tier discounts to order checkouts (capped at ₹500)
export async function applyReferralAtCheckout(
  userId: string,
  orderSubtotal: number
): Promise<{ discount_amount: number; discount_percent: number; tier_name: string }> {
  const isMock = isMockEnv();
  let successfulReferralsCount = 0;
  let tierName = "Guest";

  if (!isMock) {
    const supabase = createSupabaseAdmin();
    
    // Count successful referrals
    const { count } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .in("status", ["ordered", "rewarded"]);

    successfulReferralsCount = count || 0;
  } else {
    const refs = mockDb.getReferrals(userId);
    successfulReferralsCount = refs.filter((r) => r.status === "ordered").length;
  }

  const tierDetails = calculateDiscount(successfulReferralsCount);
  tierName = tierDetails.tier;

  // Calculate discount percentage amount
  const rawDiscount = Math.round(orderSubtotal * (tierDetails.percent / 100));
  
  // Cap at max ₹500 per order
  const discountAmount = Math.min(500, rawDiscount);

  return {
    discount_amount: discountAmount,
    discount_percent: tierDetails.percent,
    tier_name: tierName,
  };
}

// 3. Generate sharing invite URLs containing UTM tags
export async function generateShareableLink(userId: string, referralCode: string): Promise<string> {
  const base = "https://rasoihouse.com/join";
  const utm = `ref=${referralCode}&utm_source=referral_program&utm_medium=user_invite&utm_campaign=rasoi_referrals`;
  return `${base}?${utm}`;
}

// 4. Process points distribution on order delivery
export async function processReferralOnFirstOrder(orderId: string, refereeId: string): Promise<void> {
  const isMock = isMockEnv();

  if (!isMock) {
    const supabase = createSupabaseAdmin();

    // Verify if referee was invited and referral is in pending registration stage
    const { data: referral, error } = await supabase
      .from("referrals")
      .select("id, referrer_id, status")
      .eq("referee_id", refereeId)
      .eq("status", "registered")
      .maybeSingle();

    if (error || !referral) return; // No referral to reward

    // 1. Award 100 points
    const rewardPoints = calculatePoints("referral");

    // 2. Insert transaction
    await supabase.from("points_transactions").insert({
      user_id: referral.referrer_id,
      points: rewardPoints,
      type: "referral",
      description: `Successful referral points reward for order delivery.`,
    });

    // 3. Mark referral status as completed/ordered
    await supabase
      .from("referrals")
      .update({ status: "ordered", points_earned: rewardPoints })
      .eq("id", referral.id);

    // 4. Update referrer profiles points balance and tier
    const { data: referrer } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", referral.referrer_id)
      .single();

    if (referrer) {
      const updatedPoints = referrer.total_points + rewardPoints;
      
      // Calculate new discount tier based on successful referrals
      const { count: successfulRefs } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", referral.referrer_id)
        .eq("status", "ordered");

      const newTierInfo = calculateDiscount(successfulRefs || 0);

      await supabase
        .from("profiles")
        .update({
          total_points: updatedPoints,
          discount_tier: newTierInfo.tier.toLowerCase() as any,
        })
        .eq("id", referral.referrer_id);

      // 5. Send notification to referrer
      await supabase.from("notifications").insert({
        user_id: referral.referrer_id,
        title: "Referral Reward Earned! 🎁",
        message: `Your friend has ordered! You earned ${rewardPoints} points and tier settings upgraded.`,
        is_read: false,
      });
    }
  } else {
    // Emulator trigger execution
    const refs = mockDb.getReferrals("usr_mock_123"); // Hardcoded simulation for simplicity
    const referral = refs.find((r) => r.referee_id === refereeId && r.status === "registered");
    
    if (referral) {
      mockDb.completeReferral(refereeId, 100);
      mockDb.createNotification(
        referral.referrer_id,
        "Referral Reward Earned! 🎁",
        "Your friend has ordered! You earned 100 points and tier settings upgraded."
      );
    }
  }
}
