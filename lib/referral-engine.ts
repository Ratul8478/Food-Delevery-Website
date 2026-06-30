// Referral, Points and Discount Tier calculations - Pure Business Logic (No DB calls)

export interface TierInfo {
  percent: number;
  tier: string;
}

export interface NextTierInfo {
  name: string;
  referralsNeeded: number;
}

export interface ProgressInfo {
  percent: number;
  remaining: number;
}

// Determines discount rate and tier name based on successful referrals
export function calculateDiscount(totalReferrals: number): TierInfo {
  if (totalReferrals >= 50) {
    return { percent: 60, tier: "Diamond" };
  } else if (totalReferrals >= 20) {
    return { percent: 50, tier: "Platinum" };
  } else if (totalReferrals >= 10) {
    return { percent: 40, tier: "Gold" };
  } else if (totalReferrals >= 5) {
    return { percent: 30, tier: "Silver" };
  } else if (totalReferrals >= 1) {
    return { percent: 20, tier: "Bronze" };
  }
  return { percent: 0, tier: "Guest" };
}

// Determines name of the next tier and the referrals threshold needed to reach it
export function getNextTier(currentReferrals: number): NextTierInfo {
  if (currentReferrals >= 50) {
    return { name: "Maxed", referralsNeeded: 50 };
  } else if (currentReferrals >= 20) {
    return { name: "Diamond", referralsNeeded: 50 };
  } else if (currentReferrals >= 10) {
    return { name: "Platinum", referralsNeeded: 20 };
  } else if (currentReferrals >= 5) {
    return { name: "Gold", referralsNeeded: 10 };
  } else if (currentReferrals >= 1) {
    return { name: "Silver", referralsNeeded: 5 };
  }
  return { name: "Bronze", referralsNeeded: 1 };
}

// Computes loyalty points balance increments per action
export function calculatePoints(action: "referral" | "order" | "bonus", bonusAmount?: number): number {
  switch (action) {
    case "referral":
      return 100;
    case "order":
      return 10; // 10 points per order
    case "bonus":
      return bonusAmount !== undefined ? bonusAmount : 200; // variable bonus
    default:
      return 0;
  }
}

// Computes percentage completion to reach the next tier milestones
export function getProgressToNextTier(currentReferrals: number): ProgressInfo {
  if (currentReferrals >= 50) {
    return { percent: 100, remaining: 0 };
  }

  const next = getNextTier(currentReferrals);
  const target = next.referralsNeeded;

  const percent = Math.min(100, Math.round((currentReferrals / target) * 100));
  const remaining = Math.max(0, target - currentReferrals);

  return { percent, remaining };
}
