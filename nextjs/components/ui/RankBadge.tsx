import { Shield, Award, Crown, Gem } from "lucide-react";

const RANK_MAP: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Shield }> = {
  bronze: { label: "Bronze", color: "text-amber-600", bg: "bg-gradient-to-br from-amber-900/40 to-amber-950/40", border: "border-amber-700/50", icon: Shield },
  silver: { label: "Silver", color: "text-gray-300", bg: "bg-gradient-to-br from-gray-700/40 to-gray-800/40", border: "border-gray-500/50", icon: Award },
  gold: { label: "Gold", color: "text-yellow-400", bg: "bg-gradient-to-br from-yellow-900/40 to-amber-950/40", border: "border-yellow-600/50", icon: Crown },
  diamond: { label: "Diamond", color: "text-cyan-300", bg: "bg-gradient-to-br from-cyan-900/40 to-blue-950/40", border: "border-cyan-500/50", icon: Gem },
};

interface Props {
  rank?: string;
  size?: "sm" | "md" | "lg";
}

export default function RankBadge({ rank, size = "sm" }: Props) {
  const config = RANK_MAP[(rank || "").toLowerCase()] || RANK_MAP.bronze;
  const Icon = config.icon;
  const sizeClass = size === "lg" ? "px-3 py-1.5 text-sm gap-2" : size === "md" ? "px-2.5 py-1 text-xs gap-1.5" : "px-2 py-0.5 text-[10px] gap-1";
  const iconSize = size === "lg" ? "h-4 w-4" : size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";

  return (
    <span className={`inline-flex items-center rounded-full font-heading font-bold border ${sizeClass} ${config.bg} ${config.border} ${config.color}`}>
      <Icon className={iconSize} />
      {config.label}
    </span>
  );
}
