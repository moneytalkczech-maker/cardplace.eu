"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock, Heart, Share2, ShieldCheck, Trophy,
  MessageCircle, AlertCircle, Zap, Gavel, Award, ChevronUp,
  ZoomIn, X as XIcon, Flag, Bolt, Loader2
} from "lucide-react";
import { auctions } from "@/lib/api";
import { connectSocket, joinAuction, leaveAuction, onNewBid } from "@/lib/socket";
import { useCountdown } from "@/hooks/useCountdown";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import RankBadge from "@/components/ui/RankBadge";
import type { Auction, Bid } from "@/types";
import api from "@/lib/api";

export default function AuctionDetailClient() {
  const { t } = useTranslation();
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [maxBidAmount, setMaxBidAmount] = useState("");
  const [showProxyBid, setShowProxyBid] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [showBuyNowConfirm, setShowBuyNowConfirm] = useState(false);

  const countdown = useCountdown(auction?.endTime || new Date().toISOString());

  useEffect(() => {
    if (!id) return;
    auctions.getById(id).then((data) => {
      setAuction(data);
      setIsWatched(data.isWatched || false);
      setBidAmount(String((data.currentPrice || 0) + (data.minIncrement || 1)));
    }).catch(() => setFetchError(true));
  }, [id]);

  // Socket.io — živé příhozy
  useEffect(() => {
    if (!id) return;
    if (token) connectSocket(token);
    joinAuction(id);
    const cleanup = onNewBid((data) => {
      if (data.auctionId === id) {
        setAuction((prev) => prev ? {
          ...prev,
          currentPrice: data.amount,
          bids: [
            { id: data.id, amount: data.amount, userId: data.userId, auctionId: data.auctionId, createdAt: data.createdAt, user: { id: data.userId, username: data.username } },
            ...(prev.bids || [])
          ],
        } : prev);
        setBidAmount(String(data.amount + (auction?.minIncrement || 1)));
      }
    });
    return () => { cleanup(); leaveAuction(id); };
  }, [id, token]);

  const handleBidClick = () => {
    if (!auction) return;
    const bidVal = parseFloat(bidAmount);
    const minBid = auction.currentPrice + auction.minIncrement;
    if (isNaN(bidVal) || bidVal < minBid) {
      toast("error", `Minimální příhoz: ${minBid.toLocaleString("cs-CZ")} Kč`);
      return;
    }
    if (showProxyBid && maxBidAmount) {
      const maxVal = parseFloat(maxBidAmount);
      if (isNaN(maxVal) || maxVal < minBid) { toast("error", `Max příhoz musí být alespoň ${minBid.toLocaleString("cs-CZ")} Kč`); return; }
      if (maxVal < bidVal) { toast("error", "Max příhoz musí být vyšší než aktuální nabídka"); return; }
    }
    setShowBidConfirm(true);
  };

  const handleBid = async () => {
    if (!token || !id || !auction) return;
    setBidding(true);
    try {
      const maxBid = showProxyBid && maxBidAmount ? parseFloat(maxBidAmount) : undefined;
      await auctions.placeBid(id, parseFloat(bidAmount), user?.username, maxBid);
      toast("success", showProxyBid ? "Proxy příhoz nastaven!" : "Příhoz úspěšný!");
      setBidAmount(String(parseFloat(bidAmount) + auction.minIncrement));
      if (showProxyBid) { setShowProxyBid(false); setMaxBidAmount(""); }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast("error", e.response?.data?.error || "Chyba při příhozu");
    }
    setBidding(false);
    setShowBidConfirm(false);
  };

  const handleBuyNow = async () => {
    if (!token || !id || !auction?.buyNowPrice) return;
    setBuyingNow(true);
    try {
      await auctions.buyNow(id);
      toast("success", `Koupeno za ${auction.buyNowPrice.toLocaleString("cs-CZ")} Kč!`);
      setAuction((prev) => prev ? { ...prev, status: "ENDED" } : prev);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast("error", e.response?.data?.error || "Chyba při nákupu");
    }
    setBuyingNow(false);
    setShowBuyNowConfirm(false);
  };

  const handleWatch = async () => {
    if (!token || !id) return;
    try {
      const res = await auctions.toggleWatch(id);
      setIsWatched(res.watched);
      toast(res.watched ? "success" : "info", res.watched ? "Přidáno do sledovaných" : "Odebráno ze sledovaných");
    } catch { toast("error", "Chyba"); }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: auction?.title, url: window.location.href });
    } catch {
      try { await navigator.clipboard.writeText(window.location.href); toast("success", "Odkaz zkopírován"); } catch { /* ignore */ }
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await auctions.delete(id);
      toast("success", "Aukce smazána");
      router.push("/auctions");
    } catch { toast("error", "Chyba při mazání"); }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleCompleteTransaction = async () => {
    if (!id) return;
    setCompleting(true);
    try {
      await api.post("/users/complete-transaction", { auctionId: id });
      toast("success", "Transakce dokončena");
      setAuction((prev) => prev ? { ...prev, status: "COMPLETED" } : prev);
    } catch { toast("error", "Chyba"); }
    setCompleting(false);
  };

  if (fetchError) {
    return (
      <div className="container-premium py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(255,0,68,0.1)] border border-[rgba(255,0,68,0.2)] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-[#FF3366]" />
        </div>
        <p className="text-xl font-heading font-bold text-gray-400">Aukce nenalezena</p>
        <p className="text-sm text-gray-600 mt-1">Tato aukce neexistuje nebo byla smazána.</p>
        <Link href="/auctions" className="btn-primary mt-6 inline-flex">Zpět na aukce</Link>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container-premium py-8">
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-8 rounded w-1/3" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isActive = auction.status === "ACTIVE";
  const isUrgent = isActive && countdown.isEndingToday;
  const isEndingSoon = isActive && countdown.isEndingSoon;
  const countdownColor = isUrgent ? "text-[#FF3366]" : isEndingSoon ? "text-amber-400" : "text-[#00C8FF]";
  const countdownBg = isUrgent ? "border-[rgba(255,0,68,0.3)] bg-[rgba(255,0,68,0.1)]" : isEndingSoon ? "border-amber-400/30 bg-amber-500/10" : "border-[rgba(0,200,255,0.2)] bg-[rgba(0,200,255,0.06)]";

  return (
    <div className="container-premium py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Levá strana: obrázek + info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Obrázek */}
          <div className="relative rounded-2xl overflow-hidden border border-[rgba(0,200,255,0.15)] bg-[#050A12] group shadow-lg">
            <div className="aspect-[4/3] flex items-center justify-center cursor-pointer" onClick={() => auction.imageUrl && setImageZoom(true)}>
              {auction.imageUrl ? (
                <img src={auction.imageUrl} alt={auction.title} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <Gavel className="h-20 w-20 text-[rgba(0,200,255,0.15)]" />
              )}
            </div>
            {auction.imageUrl && (
              <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="h-4 w-4 text-white" />
              </div>
            )}
            {auction.condition && (
              <div className="absolute bottom-3 left-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-heading backdrop-blur-sm ${
                  auction.condition === "NM" ? "bg-green-900/40 text-green-300 border border-green-500/30" :
                  auction.condition === "LP" ? "bg-[rgba(0,200,255,0.15)] text-[#00C8FF] border border-[rgba(0,200,255,0.3)]" :
                  auction.condition === "MP" ? "bg-yellow-900/40 text-yellow-300 border border-yellow-500/30" :
                  auction.condition === "HP" ? "bg-orange-900/40 text-orange-300 border border-orange-500/30" :
                  "bg-red-900/40 text-red-300 border border-red-500/30"
                }`}>{auction.condition}</span>
              </div>
            )}
            {auction.featured && <div className="absolute top-4 left-4"><span className="badge-green"><Zap className="h-3 w-3" /> Featured</span></div>}
            {isUrgent && <div className="absolute top-12 left-4"><span className="badge-red animate-countdown-pulse"><Bolt className="h-3 w-3" /> Končí!</span></div>}
            <div className="absolute top-4 right-4 flex gap-2">
              {token && (
                <button onClick={handleWatch} className={`rounded-xl p-2.5 backdrop-blur-sm border transition-all ${isWatched ? "bg-[rgba(255,0,68,0.2)] border-[#FF3366] text-[#FF3366]" : "bg-black/50 border-[rgba(0,200,255,0.2)] text-gray-400 hover:text-white"}`}>
                  <Heart className={`h-5 w-5 ${isWatched ? "fill-current" : ""}`} />
                </button>
              )}
              <button onClick={handleShare} className="rounded-xl p-2.5 bg-black/50 border border-[rgba(0,200,255,0.2)] text-gray-400 hover:text-white transition-all">
                <Share2 className="h-5 w-5" />
              </button>
              {token && user?.id !== auction.user.id && (
                <button className="rounded-xl p-2.5 bg-black/50 border border-[rgba(255,0,68,0.2)] text-gray-400 hover:text-[#FF3366] transition-all">
                  <Flag className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Prodejce */}
          <div className="card">
            <Link href={`/users/${auction.user.id}`} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009DFF] to-[#00C8FF] flex items-center justify-center text-sm font-bold font-heading shadow-lg">
                {auction.user.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-heading font-bold text-white">{auction.user.username}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <RankBadge rank={auction.user?.rank} />
                  {auction.user.verified && <span className="badge-green text-[10px]"><Trophy className="h-3 w-3" /> Ověřený</span>}
                </div>
              </div>
            </Link>
          </div>

          {/* Popis */}
          {auction.description && (
            <div className="card">
              <h2 className="font-heading font-semibold mb-2 text-gray-300">Popis</h2>
              <p className="text-sm text-gray-400 leading-relaxed">{auction.description}</p>
            </div>
          )}

          {/* Historie příhozů */}
          <div className="card">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#00C8FF]" />
              Historie příhozů ({auction.bids?.length || 0})
            </h2>
            {!auction.bids || auction.bids.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">Zatím žádné příhozy</p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {auction.bids.map((bid: Bid, idx: number) => (
                  <div key={bid.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[rgba(0,200,255,0.04)] transition-colors">
                    <div className="flex items-center gap-2">
                      {idx === 0 && <ChevronUp className="h-4 w-4 text-[#A7FF00]" />}
                      <span className="text-sm font-heading font-semibold">{bid.user?.username || "Anonym"}</span>
                      {bid.maxBid && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,200,255,0.1)] text-[#00C8FF] font-heading">Proxy</span>}
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

        {/* Pravá strana: formulář příhozu */}
        <div className="lg:col-span-2">
          <div className="card sticky top-20 space-y-5">
            {/* Název */}
            <h1 className="heading-md text-white">{auction.title}</h1>

            {/* Aktuální cena */}
            <div className={`text-center p-4 rounded-xl ${isUrgent ? "bg-[rgba(255,0,68,0.05)] border border-[rgba(255,0,68,0.1)]" : ""}`}>
              <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mb-1">Aktuální příhoz</p>
              <p className={`text-5xl font-bold font-heading ${isUrgent ? "text-[#FF3366]" : "text-[#A7FF00]"}`} style={{ textShadow: isUrgent ? "0 0 20px rgba(255,0,68,0.3)" : "0 0 20px rgba(167,255,0,0.3)" }}>
                {auction.currentPrice.toLocaleString("cs-CZ")} Kč
              </p>
              <p className="text-xs text-gray-500 mt-1">Vyvolávací cena: {auction.startingPrice.toLocaleString("cs-CZ")} Kč</p>
            </div>

            {/* Odpočet */}
            <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border ${countdownBg}`}>
              {isUrgent && <Bolt className="h-5 w-5 text-[#FF3366]" />}
              <Clock className={`h-5 w-5 ${countdownColor}`} />
              {isActive && !countdown.isEnded ? (
                <span className={`text-2xl font-bold font-heading tabular-nums ${countdownColor}`}>
                  {String(countdown.hours).padStart(2, "0")}:{String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
                </span>
              ) : (
                <span className="text-lg font-bold font-heading text-[#FF3366]">Ukončena</span>
              )}
            </div>

            {/* Formulář příhozu */}
            {isActive && !countdown.isEnded && token && user?.id !== auction.user.id && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-heading font-medium mb-2">Váš příhoz</label>
                  <div className="relative">
                    <input
                      type="number" step="1" min={auction.currentPrice + auction.minIncrement}
                      className="input text-2xl font-bold font-heading text-center pr-14"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-gray-400">Kč</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">Min: {(auction.currentPrice + auction.minIncrement).toLocaleString("cs-CZ")} Kč</p>
                </div>

                {/* Proxy příhoz */}
                <div className="rounded-xl border border-[rgba(0,200,255,0.15)] bg-[rgba(0,200,255,0.04)] p-3">
                  <button onClick={() => setShowProxyBid(!showProxyBid)} className="flex items-center justify-between w-full text-sm font-heading">
                    <span className="flex items-center gap-2 text-[#00C8FF]"><Gavel className="h-4 w-4" /> Automatický příhoz (Proxy)</span>
                    <ChevronUp className={`h-4 w-4 text-[#00C8FF] transition-transform ${showProxyBid ? "" : "rotate-180"}`} />
                  </button>
                  {showProxyBid && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-400 mb-1">Maximální částka</label>
                      <div className="relative">
                        <input
                          type="number" step="1" min={auction.currentPrice + auction.minIncrement}
                          className="input text-lg font-bold text-center pr-14"
                          value={maxBidAmount}
                          onChange={(e) => setMaxBidAmount(e.target.value)}
                          placeholder="Např. 5000"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-gray-400">Kč</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Systém přihodí za vás automaticky až do této částky.</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBidClick}
                  disabled={bidding}
                  className={`w-full text-lg py-3.5 font-heading font-bold rounded-xl border-0 flex items-center justify-center gap-2 transition-all ${
                    isUrgent
                      ? "bg-gradient-to-r from-[#FF3366] to-[#FF0044] text-white shadow-lg shadow-[rgba(255,0,68,0.3)] hover:shadow-[rgba(255,0,68,0.5)]"
                      : "btn-primary"
                  }`}
                >
                  {bidding ? <Loader2 className="h-5 w-5 animate-spin" /> : isUrgent ? <Bolt className="h-5 w-5" /> : <Gavel className="h-5 w-5" />}
                  {bidding ? "Odesílám..." : "Přihodit"}
                </button>

                {/* Buy Now */}
                {auction.buyNowPrice && !auction.buyNowUsed && (
                  <button
                    onClick={() => setShowBuyNowConfirm(true)}
                    disabled={buyingNow}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF0044] to-[#FF3366] text-white font-bold font-heading shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {buyingNow ? "Nakupuji..." : `Koupit ihned — ${auction.buyNowPrice.toLocaleString("cs-CZ")} Kč`}
                  </button>
                )}
              </div>
            )}

            {isActive && !countdown.isEnded && !token && (
              <Link href="/login" className="btn-primary w-full text-center text-base py-3 font-heading block">Přihlásit se a přihodit</Link>
            )}

            {/* Vlastník aukce */}
            {user?.id === auction.user.id && (
              <div className="space-y-2 pt-2 border-t border-[rgba(0,200,255,0.08)]">
                <p className="text-xs text-gray-500 text-center">Toto je vaše aukce</p>
                {!isActive && auction.status !== "COMPLETED" && (
                  <button onClick={handleCompleteTransaction} disabled={completing} className="btn-primary w-full font-heading">
                    {completing ? "Zpracovávám..." : "Dokončit transakci"}
                  </button>
                )}
                {auction.status === "COMPLETED" && <p className="text-xs text-center text-[#A7FF00]">Transakce dokončena ✓</p>}
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-ghost w-full text-[#FF3366] text-sm font-heading">Smazat aukci</button>
              </div>
            )}

            {/* Trust & safety */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl p-3 bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)] text-center">
                <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-[#00C8FF]" />
                <p className="text-xs font-heading font-semibold text-[#00C8FF]">Bezpečná aukce</p>
              </div>
              <div className="rounded-xl p-3 bg-[rgba(167,255,0,0.06)] border border-[rgba(167,255,0,0.1)] text-center">
                <Award className="h-5 w-5 mx-auto mb-1 text-[#A7FF00]" />
                <p className="text-xs font-heading font-semibold text-[#A7FF00]">Trust: {auction.user.trustScore}</p>
              </div>
            </div>

            {/* Detaily */}
            <div className="border-t border-[rgba(0,200,255,0.08)] pt-3 space-y-2 text-sm text-gray-500">
              {(
                [
                  ["Vytvořeno", new Date(auction.createdAt).toLocaleDateString("cs-CZ")],
                  auction.condition ? ["Stav", auction.condition] : null,
                  auction.card ? ["Karta", auction.card.name] : null,
                  ["Počet příhozů", String(auction.bidCount || 0)],
                ] as (string[] | null)[]
              ).filter((x): x is string[] => x !== null).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="text-gray-300 font-medium">{v}</span>
                </div>
              ))}
            </div>

            {/* Poplatky */}
            <div className="border-t border-[rgba(0,200,255,0.08)] pt-3 text-xs text-gray-500 space-y-1">
              <div className="flex justify-between"><span>Poplatek kupujícího</span><span className="text-[#A7FF00]">0 Kč</span></div>
              <div className="flex justify-between"><span>Poplatek prodejce</span><span className="text-[#A7FF00]">0% (beta)</span></div>
              <Link href="/legal/fees" className="block text-center text-[#00C8FF] hover:underline mt-1">Detail poplatků →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogy */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Smazat aukci"
        message="Opravdu chcete smazat tuto aukci? Tato akce je nevratná."
        confirmLabel={deleting ? "Mažu..." : "Smazat"}
        cancelLabel="Zrušit"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <ConfirmDialog
        open={showBidConfirm}
        title={showProxyBid ? "Potvrdit proxy příhoz" : "Potvrdit příhoz"}
        message={showProxyBid
          ? `Nabídnete ${parseFloat(bidAmount).toLocaleString("cs-CZ")} Kč za "${auction.title}". Maximum: ${parseFloat(maxBidAmount || bidAmount).toLocaleString("cs-CZ")} Kč.`
          : `Nabídnete ${parseFloat(bidAmount).toLocaleString("cs-CZ")} Kč za "${auction.title}"?`}
        confirmLabel={bidding ? "Odesílám..." : "Přihodit"}
        cancelLabel="Zrušit"
        onConfirm={handleBid}
        onCancel={() => setShowBidConfirm(false)}
      />
      <ConfirmDialog
        open={showBuyNowConfirm}
        title="Potvrdit nákup"
        message={`Opravdu koupit "${auction.title}" za ${auction.buyNowPrice?.toLocaleString("cs-CZ")} Kč? Aukce bude ihned ukončena.`}
        confirmLabel={buyingNow ? "Nakupuji..." : "Koupit ihned"}
        cancelLabel="Zrušit"
        danger
        onConfirm={handleBuyNow}
        onCancel={() => setShowBuyNowConfirm(false)}
      />

      {/* Zoom obrázku */}
      {imageZoom && auction.imageUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setImageZoom(false)}>
          <button onClick={() => setImageZoom(false)} className="absolute top-6 right-6 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <XIcon className="h-6 w-6 text-white" />
          </button>
          <img src={auction.imageUrl} alt={auction.title} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
