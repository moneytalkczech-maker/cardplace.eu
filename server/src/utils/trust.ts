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

export function trustDeltaForTransaction(amount: number): number {
  if (amount >= 1000) return 10;
  if (amount >= 100) return 5;
  return 2;
}
