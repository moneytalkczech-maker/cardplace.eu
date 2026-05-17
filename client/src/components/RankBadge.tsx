import { Shield, Award, Crown, Gem } from "lucide-react";

interface RankConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  shadow: string;
  icon: typeof Shield;
  description: string;
}

const RANK_MAP: Record<string, RankConfig> = {
  bronze: { 
    label: "Bronze", 
    color: "text-amber-600", 
    bg: "bg-gradient-to-br from-amber-900/40 to-amber-950/40", 
    border: "border-amber-700/50",
    shadow: "shadow-amber-900/20",
    icon: Shield,
    description: "Nový sběratel"
  },
  silver: { 
    label: "Silver", 
    color: "text-gray-300", 
    bg: "bg-gradient-to-br from-gray-700/40 to-gray-800/40", 
    border: "border-gray-500/50",
    shadow: "shadow-gray-700/20",
    icon: Award,
    description: "Zkušený sběratel"
  },
  gold: { 
    label: "Gold", 
    color: "text-yellow-400", 
    bg: "bg-gradient-to-br from-yellow-900/40 to-amber-950/40", 
    border: "border-yellow-600/50",
    shadow: "shadow-yellow-900/20",
    icon: Crown,
    description: "Profesionální sběratel"
  },
  diamond: { 
    label: "Diamond", 
    color: "text-cyan-300", 
    bg: "bg-gradient-to-br from-cyan-900/40 to-blue-950/40", 
    border: "border-cyan-500/50",
    shadow: "shadow-cyan-900/20",
    icon: Gem,
    description: "Elitní sběratel"
  },
};

interface RankBadgeProps {
  rank?: string;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export default function RankBadge({ rank, size = "sm", showTooltip = false }: RankBadgeProps) {
  const safeRank = (rank || "").toLowerCase();
  const config = RANK_MAP[safeRank] || RANK_MAP.bronze;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-heading font-bold 
        border backdrop-blur-sm
        ${sizeClasses[size]}
        ${config.bg} 
        ${config.border} 
        ${config.color}
        ${config.shadow}
        hover:scale-105 transition-transform duration-200
      `}
      title={showTooltip ? config.description : undefined}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}
