import { Shield } from "lucide-react";

interface RankConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: "bronze" | "silver" | "gold" | "diamond";
}

const RANK_MAP: Record<string, RankConfig> = {
  bronze: { label: "Bronze", color: "text-amber-600", bg: "bg-amber-900/30", border: "border-amber-700", icon: "bronze" },
  silver: { label: "Silver", color: "text-gray-300", bg: "bg-gray-700/30", border: "border-gray-600", icon: "silver" },
  gold: { label: "Gold", color: "text-yellow-400", bg: "bg-yellow-900/30", border: "border-yellow-700", icon: "gold" },
  diamond: { label: "Diamond", color: "text-cyan-300", bg: "bg-cyan-900/30", border: "border-cyan-700", icon: "diamond" },
};

export default function RankBadge({ rank }: { rank?: string }) {
  const safeRank = (rank || "").toLowerCase();
  const config = RANK_MAP[safeRank] || RANK_MAP.bronze;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${config.bg} ${config.border} ${config.color}`}>
      <Shield className="h-3 w-3" />
      {config.label}
    </span>
  );
}
