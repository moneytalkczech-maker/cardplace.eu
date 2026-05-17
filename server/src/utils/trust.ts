export type SellerRank = "bronze" | "silver" | "gold" | "diamond";

export interface RankInfo {
  rank: SellerRank;
  label: string;
  minTrust: number;
  minSales: number;
  color: string;
  icon: string;
}

export const RANKS: RankInfo[] = [
  { rank: "bronze", label: "Bronze", minTrust: 0, minSales: 0, color: "#CD7F32", icon: "🟤" },
  { rank: "silver", label: "Silver", minTrust: 25, minSales: 5, color: "#C0C0C0", icon: "🥈" },
  { rank: "gold", label: "Gold", minTrust: 50, minSales: 20, color: "#FFD700", icon: "🥇" },
  { rank: "diamond", label: "Diamond", minTrust: 75, minSales: 50, color: "#B9F2FF", icon: "💎" },
];

export function calculateRank(trustScore: number, totalSales: number): RankInfo {
  let best = RANKS[0];
  for (const r of RANKS) {
    if (trustScore >= r.minTrust && totalSales >= r.minSales) {
      best = r;
    }
  }
  return best;
}

/**
 * Returns trust delta for a completed transaction (seller side).
 * Higher amounts = higher trust delta.
 * Uses logarithmic scaling to prevent farming with tiny transactions.
 */
export function trustDeltaForTransaction(amount: number): number {
  if (amount >= 10000) return 15;
  if (amount >= 1000) return 10;
  if (amount >= 100) return 5;
  return 2;
}

/**
 * Returns a decay penalty applied when a seller has been inactive for too long.
 * The longer the inactivity, the higher the decay.
 * This prevents old trust scores from being meaningless.
 */
export function calculateTrustDecay(lastTransactionDate: Date | null): number {
  if (!lastTransactionDate) return 0;
  const monthsInactive = (Date.now() - lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsInactive > 12) return -15;   // >1 year inactive → significant decay
  if (monthsInactive > 6) return -8;     // >6 months → moderate decay
  if (monthsInactive > 3) return -3;     // >3 months → small decay
  return 0;
}

/**
 * Returns negative trust delta for dispute/loss scenarios.
 * Used when buyer opens a dispute and seller is found at fault.
 */
export function trustDeltaForDispute(resolvedInFavor: "buyer" | "seller"): number {
  if (resolvedInFavor === "buyer") return -20; // Seller at fault → large penalty
  return -5; // Frivolous dispute → small penalty for buyer
}

/**
 * Applies review rating impact on trust score.
 * Rating is 1-5 stars. Delta is centered around 3 (no change).
 */
export function trustDeltaForReview(rating: number): number {
  if (rating >= 5) return 3;
  if (rating >= 4) return 1;
  if (rating === 3) return 0;
  if (rating === 2) return -2;
  return -5; // rating 1 star
}
