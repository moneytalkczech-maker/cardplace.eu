import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Clock, Heart, Share2, ShieldCheck, Trophy,
  MessageCircle, AlertCircle, Zap, Gavel, Award, ChevronUp,
  ZoomIn, X as XIcon, Flag, Bolt
} from "lucide-react";
import { auctions } from "../services/api";
import { monetizationApi } from "../services/monetization";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import ReportModal from "../components/ReportModal";
import { toast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { connectSocket, joinAuction, leaveAuction, onNewBid, onProxyBid } from "../services/socket";
import { useTranslation } from "../hooks/useTranslation";
import RankBadge from "../components/RankBadge";
import type { Auction, Bid } from "../types";

export default function AuctionDetail() {
  const { t } = useTranslation();
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bidding, setBidding] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [boostMsg, setBoostMsg] = useState("");
  const [boostPrices, setBoostPrices] = useState<Record<string, number> | null>(null);
  const [paidBoostType, setPaidBoostType] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(false);
  const [paidBoostLoading, setPaidBoostLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [showBuyNowConfirm, setShowBuyNowConfirm] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProxyBid, setShowProxyBid] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const { user, token } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    auctions.getById(id).then((data) => {
      setAuction(data);
      setIsWatched(data.isWatched || false);
      setBidAmount(String(data.currentPrice + 1));
    }).catch(() => {
      setFetchError(true);
    });
  }, [id]);

  // Fetch boost prices
  useEffect(() => {
    monetizationApi.getPrices().then((p) => {
      setBoostPrices({
        top: p.boostTop,
        homepage: p.boostHomepage,
        highlight: p.boostHighlight,
        social: p.boostSocial,
      });
    }).catch(() => toast("error", t("detail.loadPricesError")));
  }, []);

  // Live countdown
  useEffect(() => {
    if (!auction) return;
    const endTime = new Date(auction.endTime).getTime();

    function tick() {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (timerRef.current !== null) clearInterval(timerRef.current);
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current !== null) clearInterval(timerRef.current); };
  }, [auction?.endTime, auction?.status]);

  useEffect(() => {
    if (!id) return;
    connectSocket();
    joinAuction(id);

    const cleanup = onNewBid((data: any) => {
      if (data.auctionId === id) {
        setAuction((prev) => prev ? {
          ...prev,
          currentPrice: data.amount,
          bids: [{ id: data.id, amount: data.amount, userId: data.userId, auctionId: data.auctionId, createdAt: data.createdAt, user: { id: data.userId, username: data.username } }, ...(prev.bids || [])],
        } : prev);
      }
    });

    const cleanupProxy = onProxyBid((data: any) => {
      if (data.auctionId === id) {
        toast("info", `${t("detail.proxyBidNotification") || "Tvůj automatický příhoz aktivován!"} ${data.newBid.toLocaleString("cs-CZ")} Kč`);
        setAuction((prev) => prev ? {
          ...prev,
          currentPrice: data.newBid,
        } : prev);
      }
    });

    return () => {
      cleanup();
      cleanupProxy();
      leaveAuction(id);
    };
  }, [id]);

  const handleBoost = async () => {
    if (!token || !id) return;
    setBoostMsg("");
    try {
      const res = await auctions.boost(id);
      setAuction((prev) => prev ? { ...prev, featured: res.featured } : prev);
      setBoostMsg(res.featured ? t("detail.boostSuccess") : t("detail.boostCancelled"));
      setTimeout(() => setBoostMsg(""), 3000);
    } catch (err: any) {
      setBoostMsg(err.response?.data?.error || t("detail.boostError"));
      setTimeout(() => setBoostMsg(""), 3000);
    }
  };

  const handlePaidBoost = async (type: string) => {
    if (!token || !id) return;
    setPaidBoostType(type);
    setPaidBoostLoading(true);
    try {
      const { url } = await monetizationApi.createBoostCheckout(id, type);
      window.location.href = url;
    } catch {
      toast("error", t("detail.createPaymentError"));
    }
    setPaidBoostLoading(false);
    setPaidBoostType(null);
  };

  const handleBid = async () => {
    if (!token || !id) return;
    setError("");
    setSuccess("");
    setBidding(true);
    try {
      const maxBid = showProxyBid && maxBidAmount ? parseFloat(maxBidAmount) : undefined;
      await auctions.placeBid(id, parseFloat(bidAmount), user?.username, maxBid);
      toast("success", showProxyBid ? t("detail.proxyBidSuccess") || "Proxy příhoz nastaven!" : t("detail.bidSuccess"));
      setBidAmount(String(parseFloat(bidAmount) + 1));
      if (showProxyBid) {
        setShowProxyBid(false);
        setMaxBidAmount("");
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || t("detail.bidError");
      toast("error", msg);
      setError(msg);
    }
    setBidding(false);
    setShowBidConfirm(false);
  };

  const handleBidClick = () => {
    if (!auction) return;
    const bidValue = parseFloat(bidAmount);
    const minBid = auction.currentPrice + auction.minIncrement;
    if (isNaN(bidValue) || bidValue < minBid) {
      toast("error", `${t("detail.minBidError")} ${minBid.toLocaleString("cs-CZ")} Kč`);
      return;
    }
    if (showProxyBid && maxBidAmount) {
      const maxVal = parseFloat(maxBidAmount);
      if (isNaN(maxVal) || maxVal < minBid) {
        toast("error", `${t("detail.proxyMinError") || "Maximální příhoz musí být alespoň"} ${minBid.toLocaleString("cs-CZ")} Kč`);
        return;
      }
      if (maxVal < bidValue) {
        toast("error", t("detail.proxyLessError") || "Maximální příhoz musí být vyšší než aktuální nabídka");
        return;
      }
    }
    setShowBidConfirm(true);
  };

  const handleBuyNow = async () => {
    if (!token || !id || !auction?.buyNowPrice) return;
    setBuyingNow(true);
    try {
      await auctions.buyNow(id);
      toast("success", `Aukce "${auction.title}" koupena za ${auction.buyNowPrice.toLocaleString("cs-CZ")} Kč!`);
      setAuction((prev) => prev ? { ...prev, status: "ENDED", currentPrice: prev.buyNowPrice || prev.currentPrice } : prev);
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při nákupu");
    }
    setBuyingNow(false);
    setShowBuyNowConfirm(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await auctions.delete(id);
      toast("success", t("detail.deleteSuccess"));
      navigate("/auctions");
    } catch {
      toast("error", t("detail.deleteError"));
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleCompleteTransaction = async () => {
    if (!id) return;
    setCompleting(true);
    try {
      await api.post("/users/complete-transaction", { auctionId: id });
      toast("success", t("detail.transactionSuccess"));
      setAuction((prev) => prev ? { ...prev, status: "COMPLETED" } : prev);
    } catch {
      toast("error", t("detail.transactionError"));
    }
    setCompleting(false);
  };

  const handleWatch = async () => {
    if (!token || !id) return;
    try {
      const res = await auctions.toggleWatch(id);
      setIsWatched(res.watched);
    } catch {
      toast("error", t("detail.watchError"));
    }
  };

  if (fetchError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(255,0,68,0.1)] border border-[rgba(255,0,68,0.2)] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-[#FF3366]" />
        </div>
        <p className="text-xl font-heading font-bold text-gray-400">{t("detail.notFound")}</p>
        <p className="text-sm text-gray-600 mt-1">{t("detail.notFoundDesc")}</p>
        <Link to="/auctions" className="btn-primary mt-6 inline-flex font-heading">{t("detail.backToAuctions")}</Link>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#0B1220] rounded w-1/3" />
          <div className="h-64 bg-[#0B1220] rounded rounded-2xl" />
        </div>
      </div>
    );
  }

  const isActive = auction.status === "ACTIVE";
  const { hours, minutes, seconds } = timeLeft;
  const isEndingSoon = isActive && hours < 24;
  const isUrgent = isActive && hours < 6;
  const countdownColor = isUrgent ? "text-[#FF3366]" : isEndingSoon ? "text-[#FBBF24]" : "text-[#00C8FF]";
  const countdownBg = isUrgent ? "border-[rgba(255,0,68,0.3)] bg-[rgba(255,0,68,0.1)]" : isEndingSoon ? "border-amber-400/30 bg-amber-500/10" : "border-[rgba(0,200,255,0.2)] bg-[rgba(0,200,255,0.06)]";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Image + Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Card Image */}
          <div className="relative rounded-2xl overflow-hidden border border-[rgba(0,200,255,0.15)] bg-[#050A12] group shadow-lg shadow-[rgba(0,200,255,0.05)]">
            <div 
              className="aspect-[4/3] flex items-center justify-center cursor-pointer"
              onClick={() => auction.imageUrl && setImageZoom(true)}
            >
              {auction.imageUrl ? (
                <img src={auction.imageUrl} alt={auction.title} loading="lazy" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <Gavel className="h-20 w-20 text-[rgba(0,200,255,0.15)]" />
              )}
            </div>
            {/* Zoom hint */}
            {auction.imageUrl && (
              <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-4 w-4 text-white" />
              </div>
            )}
            {/* Condition badge */}
            {auction.condition && (
              <div className="absolute bottom-3 left-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-heading shadow-lg backdrop-blur-sm ${
                  auction.condition === "NM" ? "bg-green-900/40 text-green-300 border border-green-500/30" :
                  auction.condition === "LP" ? "bg-[rgba(0,200,255,0.15)] text-[#00C8FF] border border-[rgba(0,200,255,0.3)]" :
                  auction.condition === "MP" ? "bg-yellow-900/40 text-yellow-300 border border-yellow-500/30" :
                  auction.condition === "HP" ? "bg-orange-900/40 text-orange-300 border border-orange-500/30" :
                  "bg-red-900/40 text-red-300 border border-red-500/30"
                }`}>
                  {auction.condition}
                </span>
              </div>
            )}
            {/* Featured badge */}
            {auction.featured && (
              <div className="absolute top-4 left-4">
                <span className="badge-green flex items-center gap-1 shadow-lg"><Zap className="h-3 w-3" />{t("card.featured")}</span>
              </div>
            )}
            {/* Urgent badge */}
            {isUrgent && (
              <div className="absolute top-16 left-4">
                <span className="badge-red flex items-center gap-1 shadow-lg animate-countdown-pulse">
                  <Bolt className="h-3 w-3" />{t("detail.endingSoon") || "Končí"}
                </span>
              </div>
            )}
            {/* Watch + Share buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              {token && (
                <button onClick={handleWatch} className={`rounded-xl p-2.5 backdrop-blur-sm border transition-all ${isWatched ? "bg-[rgba(255,0,68,0.2)] border-[#FF3366] text-[#FF3366]" : "bg-black/50 border-[rgba(0,200,255,0.2)] text-gray-400 hover:text-white"}`} title={isWatched ? t("detail.watching") : t("detail.watch")}>
                  <Heart className={`h-5 w-5 ${isWatched ? "fill-current" : ""}`} />
                </button>
              )}
              <button 
                onClick={async () => {
                  try {
                    await navigator.share({ title: auction.title, url: window.location.href });
                  } catch {
                    // Fallback: copy to clipboard
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast("success", t("detail.linkCopied"));
                    } catch {
                      toast("error", t("detail.shareFailed"));
                    }
                  }
                }} 
                className="rounded-xl p-2.5 bg-black/50 border border-[rgba(0,200,255,0.2)] text-gray-400 hover:text-white hover:border-[rgba(0,200,255,0.4)] transition-all" title={t("detail.share")}
              >
                <Share2 className="h-5 w-5" />
              </button>
              {token && user?.id !== auction.user.id && (
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="rounded-xl p-2.5 bg-black/50 border border-[rgba(255,0,68,0.2)] text-gray-400 hover:text-[#FF3366] hover:border-[rgba(255,0,68,0.4)] transition-all" 
                  title={t("detail.report") || "Nahlásit aukci"}
                >
                  <Flag className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Seller Info */}
          <div className="card hover:border-[rgba(0,200,255,0.15)]">
            <div className="flex items-center justify-between">
              <Link to={`/users/${auction.user.id}`} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#009DFF] to-[#00C8FF] text-sm font-bold font-heading shadow-lg shadow-[rgba(0,200,255,0.3)]">
                  {auction.user.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-heading font-bold text-white">{auction.user.username}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RankBadge rank={auction.user?.rank} />
                    {auction.user.verified && (
                      <span className="badge-green flex items-center gap-1"><Trophy className="h-3 w-3" /> {t("detail.verified")}</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Description */}
          {auction.description && (
            <div className="card">
              <p className="text-sm text-gray-400 leading-relaxed">{auction.description}</p>
            </div>
          )}

          {/* Bid History */}
          <div className="card">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#00C8FF]" /> {t("detail.bidHistory")} ({auction.bids?.length || 0})
            </h2>
            {!auction.bids || auction.bids.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">{t("detail.noBids")}</p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {auction.bids.map((bid, idx) => (
                  <div key={bid.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[rgba(0,200,255,0.04)] transition-colors">
                    <div className="flex items-center gap-2">
                      {idx === 0 && <ChevronUp className="h-4 w-4 text-[#A7FF00]" />}
                      <span className="text-sm font-heading font-semibold">{bid.user?.username || t("detail.anonymous")}</span>
                      {bid.maxBid && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,200,255,0.1)] text-[#00C8FF] font-heading">
                          {t("detail.proxy") || "Proxy"}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-heading text-[#A7FF00] drop-shadow-[0_0_4px_rgba(167,255,0,0.3)]">{bid.amount.toLocaleString("cs-CZ")} Kč</span>
                      <span className="text-xs text-gray-500 ml-2">{new Date(bid.createdAt).toLocaleTimeString("cs-CZ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Bid Panel */}
        <div className="lg:col-span-2">
          <div className="card sticky top-20 space-y-6 hover:border-[rgba(0,200,255,0.2)]">
            {/* Current Price */}
            <div className={`text-center p-4 rounded-xl ${isUrgent ? "bg-[rgba(255,0,68,0.05)] border border-[rgba(255,0,68,0.1)]" : ""}`}>
              <p className="text-sm text-gray-500 font-heading uppercase tracking-wider mb-1">{t("detail.currentBid")}</p>
              <p className={`text-5xl font-bold font-heading ${
                isUrgent
                  ? "text-[#FF3366] drop-shadow-[0_0_20px_rgba(255,0,68,0.3)]"
                  : "text-[#A7FF00] drop-shadow-[0_0_20px_rgba(167,255,0,0.3)]"
              }`}>
                {auction.currentPrice.toLocaleString("cs-CZ")} Kč
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {t("detail.startingAt")} {auction.startingPrice.toLocaleString("cs-CZ")} Kč
              </p>
            </div>

            {/* Countdown */}
            <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border ${countdownBg} ${countdownColor}`}>
              {isUrgent && <Bolt className="h-5 w-5 text-[#FF3366]" />}
              <Clock className={`h-5 w-5 ${countdownColor}`} />
              {isActive ? (
                <span className={`text-2xl font-bold font-heading tabular-nums ${countdownColor}`}>
                  {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                </span>
              ) : (
                <span className="text-lg font-bold font-heading text-[#FF3366]">{t("detail.ended")}</span>
              )}
              {isActive && <span className="text-sm text-gray-500">{t("detail.timeLeft")}</span>}
            </div>

            {/* Bid Form */}
            {isActive && token && user?.id !== auction.user.id && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium font-heading mb-2">{t("detail.yourBid")}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min={auction.currentPrice + auction.minIncrement}
                      className="input text-2xl font-bold font-heading text-center pr-16"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold font-heading text-gray-400">Kč</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 text-center">
                    {t("detail.minBid")}: {(auction.currentPrice + auction.minIncrement).toLocaleString("cs-CZ")} Kč
                  </p>
                </div>

                {/* Proxy Bid Toggle */}
                <div className="rounded-xl border border-[rgba(0,200,255,0.15)] bg-[rgba(0,200,255,0.04)] p-3">
                  <button
                    onClick={() => setShowProxyBid(!showProxyBid)}
                    className="flex items-center justify-between w-full text-sm font-heading"
                  >
                    <span className="flex items-center gap-2 text-[#00C8FF]">
                      <Gavel className="h-4 w-4" />
                      {t("detail.proxyBid") || "Automatický příhoz (Proxy)"}
                    </span>
                    <ChevronUp className={`h-4 w-4 text-[#00C8FF] transition-transform ${showProxyBid ? "" : "rotate-180"}`} />
                  </button>
                  {showProxyBid && (
                    <div className="mt-3 space-y-2">
                      <label className="block text-xs text-gray-400">{t("detail.maxBid") || "Maximální částka"}</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min={auction.currentPrice + auction.minIncrement}
                          className="input text-lg font-bold font-heading text-center pr-16"
                          value={maxBidAmount}
                          onChange={(e) => setMaxBidAmount(e.target.value)}
                          placeholder={t("detail.maxBidPlaceholder") || "Např. 5000"}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold font-heading text-gray-400">Kč</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {t("detail.proxyBidDesc") || "Systém automaticky přihodí za tebe až do této částky. Nikdo neuvidí tvé maximum."}
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-[#FF3366] bg-[rgba(255,0,68,0.1)] rounded-xl p-3 border border-[rgba(255,0,68,0.2)]">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-sm text-[#A7FF00] bg-[rgba(167,255,0,0.1)] rounded-xl p-3 border border-[rgba(167,255,0,0.2)]">
                    <Trophy className="h-4 w-4 flex-shrink-0" />
                    {success}
                  </div>
                )}

                <button onClick={handleBidClick} disabled={bidding} className={`btn w-full text-lg py-3.5 font-heading text-white border-0 ${
                  isUrgent
                    ? "bg-gradient-to-r from-[#FF3366] to-[#FF0044] shadow-lg shadow-[rgba(255,0,68,0.3)] hover:shadow-[rgba(255,0,68,0.5)]"
                    : "btn-primary"
                }`}>
                  {bidding ? t("detail.placingBid") : (
                    isUrgent ? (
                      <span className="flex items-center justify-center gap-2">
                        <Bolt className="h-5 w-5" />
                        {t("detail.placeBid")}
                      </span>
                    ) : t("detail.placeBid")
                  )}
                </button>

                {/* Buy Now button */}
                {auction.buyNowPrice && !auction.buyNowUsed && (
                  <div className="pt-2">
                    <button
                      onClick={() => setShowBuyNowConfirm(true)}
                      disabled={buyingNow}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF0044] to-[#FF3366] text-white font-bold font-heading text-lg shadow-lg shadow-[rgba(255,0,68,0.3)] hover:shadow-[rgba(255,0,68,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {buyingNow ? t("detail.buyingNow") : `${t("detail.buyNow") || "Koupit ihned"} — ${auction.buyNowPrice.toLocaleString("cs-CZ")} Kč`}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-1">{t("detail.buyNowDesc") || "Okamžitý nákup — aukce se ukončí"}</p>
                  </div>
                )}
              </div>
            )}

            {isActive && !token && (
              <Link to="/login" className="btn-primary w-full text-center text-base py-3 font-heading">{t("detail.signInToBid")}</Link>
            )}

            {user?.id === auction.user.id && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 text-center py-2">{t("detail.ownAuction")}</p>

                {/* Credit boost button */}
                <button onClick={handleBoost} className={`btn w-full font-heading ${auction.featured ? "btn-ghost text-[#A7FF00] border border-[rgba(167,255,0,0.3)]" : "btn-primary"}`}>
                  <Zap className="h-4 w-4" />
                  {auction.featured ? t("detail.boosted") : t("detail.boost")}
                </button>
                {boostMsg && <p className="text-xs text-center text-[#A7FF00]">{boostMsg}</p>}

                {/* Paid boost options */}
                {boostPrices && !auction.featured && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-2 font-heading font-semibold">{t("detail.paidBoosts")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: "highlight", label: t("detail.boostHighlight"), price: boostPrices.highlight },
                        { type: "top", label: t("detail.boostTop"), price: boostPrices.top },
                        { type: "homepage", label: t("detail.boostHomepage"), price: boostPrices.homepage },
                        { type: "social", label: t("detail.boostSocial"), price: boostPrices.social },
                      ].map((b) => (
                        <button key={b.type} onClick={() => handlePaidBoost(b.type)} disabled={paidBoostLoading}
                          className="text-xs font-heading px-2 py-2 rounded-lg border border-[rgba(0,200,255,0.15)] bg-[rgba(0,200,255,0.04)] hover:bg-[rgba(0,200,255,0.1)] transition-colors disabled:opacity-50">
                          <span className="block text-white font-semibold">{b.label}</span>
                          <span className="block text-[#00C8FF] mt-0.5">{b.price} Kč</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete transaction (when ended) */}
                {!isActive && auction.status !== "COMPLETED" && (
                  <button onClick={handleCompleteTransaction} disabled={completing} className="btn-primary w-full font-heading">
                    {completing ? t("detail.completing") : t("detail.completeTransaction")}
                  </button>
                )}

                {auction.status === "COMPLETED" && (
                  <p className="text-xs text-center text-[#A7FF00]">{t("detail.transactionCompleted")}</p>
                )}

                {/* Delete button */}
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-ghost w-full text-[#FF3366] hover:text-[#FF5588] font-heading text-sm">
                  {t("detail.delete")}
                </button>
              </div>
            )}

            {/* Trust & Safety */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl p-3 bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)] text-center">
                <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-[#00C8FF]" />
                <p className="text-xs font-heading font-semibold text-[#00C8FF]">{t("detail.safeAuction")}</p>
              </div>
              <div className="rounded-xl p-3 bg-[rgba(167,255,0,0.06)] border border-[rgba(167,255,0,0.1)] text-center">
                <Award className="h-5 w-5 mx-auto mb-1 text-[#A7FF00]" />
                <p className="text-xs font-heading font-semibold text-[#A7FF00]">{t("detail.trustScore")}: {auction.user.trustScore}</p>
              </div>
            </div>

            {/* Auction details */}
            <div className="pt-2 border-t border-[rgba(0,200,255,0.08)] space-y-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>{t("detail.created")}</span>
                <span className="text-gray-400">{new Date(auction.createdAt).toLocaleDateString("cs-CZ")}</span>
              </div>
              {auction.condition && (
                <div className="flex justify-between">
                  <span>{t("detail.condition")}</span>
                  <span className={`font-semibold ${
                    auction.condition === "NM" ? "text-green-400" :
                    auction.condition === "LP" ? "text-[#00C8FF]" :
                    auction.condition === "MP" ? "text-yellow-400" :
                    auction.condition === "HP" ? "text-orange-400" :
                    "text-[#FF3366]"
                  }`}>{auction.condition}</span>
                </div>
              )}
              {auction.card && (
                <div className="flex justify-between">
                  <span>{t("detail.card")}</span>
                  <span className="text-gray-400">{auction.card.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t("detail.bidCount")}</span>
                <span className="text-gray-400">{auction.bidCount || 0}</span>
              </div>
            </div>

            {/* Fee info */}
            <div className="pt-2 border-t border-[rgba(0,200,255,0.08)]">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-[#00C8FF]" />
                <span className="text-xs font-heading font-semibold text-gray-400">{t("detail.fees") || "Poplatky"}</span>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>{t("detail.feeBuyer") || "Poplatek kupujícího"}</span>
                  <span className="text-[#A7FF00]">0 Kč</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("detail.feeSeller") || "Poplatek prodejce"}</span>
                  <span className="text-[#A7FF00]">0% (beta)</span>
                </div>
                <Link to="/legal/fees" className="block text-center text-[#00C8FF] hover:underline mt-2">
                  {t("detail.feeDetails") || "Detail poplatků →"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("detail.deleteTitle")}
        message={t("detail.deleteMessage")}
        confirmLabel={deleting ? t("common.deleting") : t("common.delete")}
        cancelLabel={t("common.cancel")}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        open={showBidConfirm}
        title={showProxyBid ? (t("detail.confirmProxyBidTitle") || "Potvrdit proxy příhoz") : t("detail.confirmBidTitle")}
        message={showProxyBid
          ? `${t("detail.confirmProxyBidMessage") || "Nabídneš"} ${parseFloat(bidAmount).toLocaleString("cs-CZ")} Kč ${t("detail.confirmBidFor") || "za"} "${auction.title}". ${t("detail.confirmProxyBidMax") || "Maximum:"} ${parseFloat(maxBidAmount || bidAmount).toLocaleString("cs-CZ")} Kč.`
          : `${t("detail.confirmBidMessage")} ${parseFloat(bidAmount).toLocaleString("cs-CZ")} Kč ${t("detail.confirmBidFor")} "${auction.title}"?`}
        confirmLabel={bidding ? t("detail.placingBid") : t("detail.confirmBidLabel")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleBid}
        onCancel={() => setShowBidConfirm(false)}
      />

      <ConfirmDialog
        open={showBuyNowConfirm}
        title={t("detail.confirmBuyNowTitle") || "Potvrdit nákup"}
        message={`${t("detail.confirmBuyNowMessage") || "Opravdu chceš koupit"} "${auction.title}" ${t("detail.confirmBuyNowFor") || "za"} ${auction.buyNowPrice?.toLocaleString("cs-CZ")} Kč? ${t("detail.confirmBuyNowDesc") || "Aukce bude okamžitě ukončena."}`}
        confirmLabel={buyingNow ? (t("detail.buyingNow") || "Nakupuji...") : (t("detail.confirmBuyNowLabel") || "Koupit ihned")}
        cancelLabel={t("common.cancel")}
        danger
        onConfirm={handleBuyNow}
        onCancel={() => setShowBuyNowConfirm(false)}
      />

      <ReportModal
        open={showReportModal}
        auctionId={id || ""}
        onClose={() => setShowReportModal(false)}
      />

      {/* Image Zoom Modal */}
      {imageZoom && auction.imageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setImageZoom(false)}
        >
          <button 
            onClick={() => setImageZoom(false)}
            className="absolute top-6 right-6 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <XIcon className="h-6 w-6" />
          </button>
          <img 
            src={auction.imageUrl} 
            alt={auction.title} 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
