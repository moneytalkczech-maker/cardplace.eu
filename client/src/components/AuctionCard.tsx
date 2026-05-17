import { Link } from "react-router-dom";
import { Clock, Zap, Gavel, Sparkles, Shield, Bolt } from "lucide-react";
import type { Auction } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { useCountdown } from "../hooks/useCountdown";
import RankBadge from "./RankBadge";
import { useState } from "react";

interface AuctionCardProps {
  auction: Auction;
  variant?: "default" | "compact" | "featured";
  index?: number;
}

export default function AuctionCard({ auction, variant = "default", index }: AuctionCardProps) {
  const { t } = useTranslation();
  const cd = useCountdown(auction.endTime);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isPremium = auction.featured;
  const bidCount = auction.bidCount || 0;
  
  // Neon red for urgent ending (today), amber for ending soon, blue for normal
  const countdownColor = cd.isEndingToday
    ? "text-[#FF3366] border-[rgba(255,0,68,0.3)] bg-[rgba(255,0,68,0.1)] shadow-[0_0_10px_rgba(255,0,68,0.15)]"
    : cd.isEndingSoon
      ? "text-amber-400 border-amber-400/30 bg-amber-500/10"
      : "text-[#00C8FF] border-[#00C8FF]/30 bg-[#00C8FF]/10";

  // ── Compact variant ──
  if (variant === "compact") {
    return (
      <Link to={`/auctions/${auction.id}`}
        className="group flex items-center gap-4 p-4 rounded-xl bg-[#0B1220] border border-[rgba(0,200,255,0.08)] hover:border-[rgba(0,200,255,0.2)] transition-all duration-300">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#050A12] flex-shrink-0">
          {auction.imageUrl ? (
            <img src={auction.imageUrl} alt={auction.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Gavel className="h-8 w-8 text-[rgba(0,200,255,0.2)]" /></div>
          )}
          {isPremium && <div className="absolute top-1 left-1"><Zap className="h-3 w-3 text-[#A7FF00]" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-sm truncate group-hover:text-[#00C8FF] transition-colors">{auction.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{auction.card?.setName}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="font-heading font-bold text-[#A7FF00] drop-shadow-[0_0_6px_rgba(124,255,0,0.3)]">{auction.currentPrice.toLocaleString("cs-CZ")} Kč</span>
            {!cd.isEnded && <span className={`text-xs px-2 py-0.5 rounded-full border ${countdownColor}`}>{cd.hours}h {cd.minutes}m</span>}
          </div>
        </div>
      </Link>
    );
  }

  // ── Default / Featured variant ──
  return (
    <Link to={`/auctions/${auction.id}`}
      className={`group block rounded-2xl overflow-hidden transition-all duration-500 ${
        isPremium 
          ? "card-premium" 
          : "card"
      } ${index !== undefined ? "animate-fade-in-up" : ""}`}
      style={index !== undefined ? { animationDelay: `${index * 100}ms` } : undefined}>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#0B1220] to-[#050A12]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,200,255,0.1),transparent_70%)]" />
        </div>
        {auction.imageUrl ? (
          <>
            <img src={auction.imageUrl} alt={auction.title} loading="lazy"
              className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"} group-hover:scale-110`}
              onLoad={() => setImageLoaded(true)} />
            {!imageLoaded && <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 rounded-full border-2 border-[rgba(0,200,255,0.2)] border-t-[#00C8FF] animate-spin" /></div>}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Gavel className="h-16 w-16 text-[rgba(0,200,255,0.15)]" /></div>
        )}
        {isPremium && <div className="absolute inset-0 bg-gradient-to-t from-[rgba(124,255,0,0.15)] via-transparent to-transparent" />}
        
        {/* Top badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isPremium && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-heading bg-[rgba(124,255,0,0.95)] text-[#050A12] shadow-lg shadow-[rgba(124,255,0,0.4)]">
              <Sparkles className="h-3.5 w-3.5" />
              {t("card.featured")}
            </span>
          )}
          {auction.card?.rarity && <span className="badge-blue backdrop-blur-sm">{auction.card.rarity}</span>}
        </div>
        
        {/* Countdown / Ended badge */}
        {!cd.isEnded ? (
          <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold font-heading backdrop-blur-sm border ${countdownColor} ${cd.isEndingToday ? "animate-countdown-pulse" : ""}`}>
            <Clock className="h-3.5 w-3.5" />
            <span>{cd.hours.toString().padStart(2, "0")}:{cd.minutes.toString().padStart(2, "0")}:{cd.seconds.toString().padStart(2, "0")}</span>
          </div>
        ) : (
          <div className="absolute top-4 right-4">
            <span className="badge-red backdrop-blur-sm">{t("detail.ended")}</span>
          </div>
        )}
        
        {/* Bottom gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050A12] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Hover bid button */}
        {!cd.isEnded && (
          <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <span className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#A7FF00] to-[#5CFF00] text-[#050A12] font-bold font-heading text-sm shadow-lg shadow-[rgba(124,255,0,0.4)]">
              <Gavel className="h-4 w-4" />{t("detail.placeBid")}
            </span>
          </div>
        )}
        
        {/* Lightning accent for ending today */}
        {cd.isEndingToday && (
          <div className="absolute -bottom-2 -right-2 opacity-40">
            <Bolt className="h-8 w-8 text-[#FF3366]" style={{ filter: "drop-shadow(0 0 6px rgba(255,0,68,0.5))" }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {auction.card && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#00C8FF]/70">{auction.card.setName}</span>
            {auction.card.rarity && <><span className="text-gray-600">•</span><span className="text-xs text-gray-500">{auction.card.rarity}</span></>}
          </div>
        )}
        <h3 className="font-heading font-bold text-lg leading-tight group-hover:text-[#00C8FF] transition-colors line-clamp-2">{auction.title}</h3>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mb-1">{t("card.currentBid")}</p>
            <p className={`text-2xl font-bold font-heading ${
              cd.isEndingToday
                ? "text-[#FF3366] drop-shadow-[0_0_12px_rgba(255,0,68,0.3)]"
                : "text-[#A7FF00] drop-shadow-[0_0_12px_rgba(167,255,0,0.3)]"
            }`}>
              {auction.currentPrice.toLocaleString("cs-CZ")} Kč
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mb-1">{t("card.startingAt")}</p>
            <p className="text-sm text-gray-400">{auction.startingPrice.toLocaleString("cs-CZ")} Kč</p>
          </div>
        </div>
        
        {/* Lightning divider for urgent auctions */}
        <div className={`h-px ${
          cd.isEndingToday
            ? "bg-gradient-to-r from-transparent via-[#FF3366] to-transparent"
            : "bg-gradient-to-r from-transparent via-[rgba(0,200,255,0.15)] to-transparent"
        }`} />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-6 h-6 rounded-lg bg-[rgba(0,200,255,0.1)] flex items-center justify-center"><Gavel className="h-3 w-3 text-[#00C8FF]" /></div>
              <span className="font-medium">{bidCount}</span>
            </div>
            <RankBadge rank={auction.user?.rank} />
            {auction.user?.verified && <div className="w-5 h-5 rounded-full bg-[rgba(0,200,255,0.1)] flex items-center justify-center" title={t("detail.verified")}><Shield className="h-3 w-3 text-[#00C8FF]" /></div>}
          </div>
          <span className="text-xs font-heading font-semibold text-gray-400 hover:text-white transition-colors">@{auction.user?.username || "?"}</span>
        </div>
        
        {!cd.isEnded && (
          <div className="pt-1">
            <span className={`w-full text-sm py-2 block text-center font-heading font-bold rounded-xl transition-all ${
              cd.isEndingToday
                ? "bg-gradient-to-r from-[#FF3366] to-[#FF0044] text-white shadow-lg shadow-[rgba(255,0,68,0.3)] hover:shadow-[rgba(255,0,68,0.5)]"
                : "btn-primary"
            }`}>
              {cd.isEndingToday ? (
                <span className="flex items-center justify-center gap-2">
                  <Bolt className="h-4 w-4" />
                  {t("detail.placeBid")}
                </span>
              ) : (
                t("detail.placeBid")
              )}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
