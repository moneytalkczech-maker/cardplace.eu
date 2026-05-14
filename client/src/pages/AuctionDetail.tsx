import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Clock, Heart, Share2, ShieldCheck, Trophy,
  MessageCircle, AlertCircle, Zap, Gavel, Award, ChevronUp
} from "lucide-react";
import { auctions } from "../services/api";
import { monetizationApi } from "../services/monetization";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import { toast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { connectSocket, joinAuction, leaveAuction, onNewBid } from "../services/socket";
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
  const [paidBoostLoading, setPaidBoostLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
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
    }).catch(() => {});
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

    return () => {
      cleanup();
      leaveAuction(id);
    };
  }, [id]);

  const handleBoost = async () => {
    if (!token || !id) return;
    setBoostMsg("");
    try {
      const res = await auctions.boost(id);
      setAuction((prev) => prev ? { ...prev, featured: res.featured } : prev);
      setBoostMsg(res.featured ? "Aukce boostnuta! 🚀" : "Boost zrušen");
      setTimeout(() => setBoostMsg(""), 3000);
    } catch (err: any) {
      setBoostMsg(err.response?.data?.error || "Chyba");
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
      toast("error", "Nepodařilo se vytvořit platbu");
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
      await auctions.placeBid(id, parseFloat(bidAmount), user?.username);
      toast("success", t("detail.bidSuccess"));
      setBidAmount(String(parseFloat(bidAmount) + 1));
    } catch (err: any) {
      const msg = err.response?.data?.error || t("detail.bidError");
      toast("error", msg);
      setError(msg);
    }
    setBidding(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await auctions.delete(id);
      toast("success", "Aukce byla zrušena");
      navigate("/auctions");
    } catch {
      toast("error", "Nepodařilo se zrušit aukci");
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleCompleteTransaction = async () => {
    if (!id) return;
    setCompleting(true);
    try {
      await api.post("/users/complete-transaction", { auctionId: id });
      toast("success", "Transakce dokončena! Trust score zvýšen.");
      setAuction((prev) => prev ? { ...prev, status: "COMPLETED" } : prev);
    } catch {
      toast("error", "Nepodařilo se dokončit transakci");
    }
    setCompleting(false);
  };

  const handleWatch = async () => {
    if (!token || !id) return;
    try {
      const res = await auctions.toggleWatch(id);
      setIsWatched(res.watched);
    } catch (err) {
      console.error("Watch toggle failed:", err);
    }
  };

  if (fetchError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-600" />
        <p className="text-xl font-heading font-bold text-gray-400">Aukce nenalezena</p>
        <p className="text-sm text-gray-600 mt-1">Tato aukce neexistuje nebo byla smazána</p>
        <Link to="/auctions" className="btn-primary mt-6 inline-flex font-heading">Zpět na aukce</Link>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#111B2E] rounded w-1/3" />
          <div className="h-64 bg-[#111B2E] rounded" />
        </div>
      </div>
    );
  }

  const isActive = auction.status === "ACTIVE";
  const { hours, minutes, seconds } = timeLeft;
  const isEndingSoon = isActive && hours < 24;
  const countdownColor = isActive && hours < 6 ? "text-[#F87171]" : isActive && hours < 24 ? "text-[#FBBF24]" : "text-[#00C8FF]";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Image + Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Card Image */}
          <div className="relative rounded-2xl overflow-hidden border border-[rgba(0,200,255,0.15)] bg-[#050A12]">
            <div className="aspect-[4/3] flex items-center justify-center">
              {auction.imageUrl ? (
                <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-contain" />
              ) : (
                <Gavel className="h-20 w-20 text-[rgba(0,200,255,0.15)]" />
              )}
            </div>
            {/* Featured badge */}
            {auction.featured && (
              <div className="absolute top-4 left-4">
                <span className="badge-green flex items-center gap-1 shadow-lg"><Zap className="h-3 w-3" />{t("card.featured")}</span>
              </div>
            )}
            {/* Watch button */}
            <div className="absolute top-4 right-4 flex gap-2">
              {token && (
                <button onClick={handleWatch} className={`rounded-xl p-2.5 backdrop-blur-sm border transition-all ${isWatched ? "bg-[rgba(239,68,68,0.2)] border-red-500 text-red-400" : "bg-[rgba(0,0,0,0.5)] border-[rgba(0,200,255,0.2)] text-gray-400 hover:text-white"}`} title={isWatched ? t("detail.watching") : t("detail.watch")}>
                  <Heart className={`h-5 w-5 ${isWatched ? "fill-current" : ""}`} />
                </button>
              )}
              <button className="rounded-xl p-2.5 bg-[rgba(0,0,0,0.5)] border border-[rgba(0,200,255,0.2)] text-gray-400 hover:text-white" title={t("detail.share")}>
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Seller Info */}
          <div className="card">
            <div className="flex items-center justify-between">
              <Link to={`/users/${auction.user.id}`} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#009DFF] text-sm font-bold font-heading">
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
                      <span className="text-sm font-heading font-semibold">{bid.user?.username || "Anonymous"}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-heading text-[#A7FF00]">{bid.amount.toLocaleString("cs-CZ")} Kč</span>
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
          <div className="card sticky top-20 space-y-6">
            {/* Current Price */}
            <div className="text-center">
              <p className="text-sm text-gray-500 font-heading uppercase tracking-wider mb-1">{t("detail.currentBid")}</p>
              <p className="text-5xl font-bold font-heading text-[#A7FF00] drop-shadow-[0_0_20px_rgba(167,255,0,0.3)]">
                {auction.currentPrice.toLocaleString("cs-CZ")} Kč
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {t("detail.startingAt")} {auction.startingPrice.toLocaleString("cs-CZ")} Kč
              </p>
            </div>

            {/* Countdown */}
            <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border ${countdownColor} bg-[rgba(0,0,0,0.3)]`}>
              <Clock className="h-5 w-5" />
              {isActive ? (
                <span className={`text-2xl font-bold font-heading tabular-nums ${countdownColor}`}>
                  {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                </span>
              ) : (
                <span className="text-lg font-bold font-heading text-[#F87171]">{t("detail.ended")}</span>
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

                {error && (
                  <div className="flex items-center gap-2 text-sm text-[#F87171] bg-[rgba(239,68,68,0.1)] rounded-xl p-3 border border-[rgba(239,68,68,0.2)]">
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

                <button onClick={handleBid} disabled={bidding} className="btn-primary w-full text-lg py-3.5 font-heading">
                  {bidding ? t("detail.placingBid") : t("detail.placeBid")}
                </button>
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
                  {auction.featured ? "Boostnutá ⚡ (Zrušit)" : "Boostnout aukci ⚡"}
                </button>
                {boostMsg && <p className="text-xs text-center text-[#A7FF00]">{boostMsg}</p>}

                {/* Paid boost options */}
                {boostPrices && !auction.featured && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-2 font-heading font-semibold">Placené boosty:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: "highlight", label: "Zvýraznění", price: boostPrices.highlight },
                        { type: "top", label: "Top pozice", price: boostPrices.top },
                        { type: "homepage", label: "Homepage", price: boostPrices.homepage },
                        { type: "social", label: "Sociální sítě", price: boostPrices.social },
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
                    {completing ? "Dokončuji..." : "Dokončit transakci"}
                  </button>
                )}

                {auction.status === "COMPLETED" && (
                  <p className="text-xs text-center text-[#A7FF00]">✅ Transakce dokončena</p>
                )}

                {/* Delete button */}
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-ghost w-full text-red-400 hover:text-red-300 font-heading text-sm">
                  Smazat aukci
                </button>
              </div>
            )}

            {/* Trust & Safety */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl p-3 bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)] text-center">
                <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-[#00C8FF]" />
                <p className="text-xs font-heading font-semibold text-[#00C8FF]">Bezpečná aukce</p>
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
              {auction.card && (
                <div className="flex justify-between">
                  <span>{t("detail.card")}</span>
                  <span className="text-gray-400">{auction.card.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Příhozů</span>
                <span className="text-gray-400">{auction.bidCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Smazat aukci"
        message="Opravdu chceš tuto aukci smazat? Tuto akci nelze vrátit."
        confirmLabel={deleting ? "Mažu..." : "Smazat"}
        cancelLabel="Zrušit"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
