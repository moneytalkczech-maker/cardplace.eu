import { Link } from "react-router-dom";
import { Clock, Heart, Zap, ShieldCheck, Gavel } from "lucide-react";
import type { Auction } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import RankBadge from "./RankBadge";

export default function AuctionCard({ auction }: { auction: Auction }) {
  const { t } = useTranslation();
  const endTime = new Date(auction.endTime);
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  const hoursLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  const secondsLeft = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));
  const isEndingSoon = diff > 0 && diff < 24 * 60 * 60 * 1000;
  const isEndingToday = diff > 0 && diff < 6 * 60 * 60 * 1000;

  const countdownColor = isEndingToday ? "text-[#F87171]" : isEndingSoon ? "text-[#FBBF24]" : "text-[#00C8FF]";
  const isPremium = auction.featured;

  return (
    <Link
      to={`/auctions/${auction.id}`}
      className={`group rounded-xl p-0 overflow-hidden transition-all duration-300 ${isPremium ? "card-premium" : "card hover:border-[rgba(0,200,255,0.3)] hover:shadow-[0_0_20px_rgba(0,200,255,0.08)]"}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#050A12]">
        {auction.imageUrl ? (
          <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gavel className="h-12 w-12 text-[rgba(0,200,255,0.2)]" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isPremium && (
            <span className="badge-green flex items-center gap-1 shadow-lg">
              <Zap className="h-3 w-3" /> {t("card.featured")}
            </span>
          )}
          {auction.card?.rarity && (
            <span className="badge-blue">{auction.card.rarity}</span>
          )}
        </div>

        {/* Countdown overlay */}
        {diff > 0 && (
          <div className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold font-heading ${countdownColor} bg-[rgba(5,10,18,0.8)] border border-current`}>
            <Clock className="h-3 w-3" />
            {hoursLeft.toString().padStart(2, "0")}:{minutesLeft.toString().padStart(2, "0")}:{secondsLeft.toString().padStart(2, "0")}
          </div>
        )}

        {diff <= 0 && (
          <div className="absolute top-3 right-3 badge-red">{t("detail.ended")}</div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category + set */}
        {auction.card && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[rgba(0,200,255,0.6)] font-heading font-semibold uppercase tracking-wider">{auction.card.setName}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="font-heading font-bold text-lg leading-tight group-hover:text-[#00C8FF] transition-colors">
          {auction.title}
        </h3>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">{t("card.currentBid")}</p>
            <p className="text-2xl font-bold font-heading text-[#A7FF00] drop-shadow-[0_0_12px_rgba(167,255,0,0.3)]">
              {auction.currentPrice.toLocaleString("cs-CZ")} Kč
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">{t("card.startingAt")}</p>
            <p className="text-sm text-gray-400">{auction.startingPrice.toLocaleString("cs-CZ")} Kč</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[rgba(0,200,255,0.08)] text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Gavel className="h-3 w-3" />
              {auction.bidCount || 0}
            </span>
            <RankBadge rank={auction.user?.rank} />
          </div>
          <span className="font-heading font-semibold">@{auction.user?.username || "?"}</span>
        </div>

        {/* Bid button */}
        {diff > 0 && (
          <div className="pt-1">
            <span className="btn-primary w-full text-sm py-2 block text-center font-heading">
              {t("detail.placeBid")}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
