"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package, Heart, Gift, Copy, Check as CheckIcon, LogOut, ShieldCheck,
  UserPlus, UserCheck, CreditCard, Gavel, Star, Zap, Crown,
  Sparkles, MessageSquare, Loader2,
} from "lucide-react";
import { users, auth as authApi, followApi, payments, monetizationApi } from "@/lib/api";
import type { Auction, Bid, User } from "@/types";

interface SimplePrices {
  vipMonthly: number;
  vipYearly: number;
  verifiedPrice: number;
  feePhase: string;
}
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/components/ui/Toast";
import RankBadge from "@/components/ui/RankBadge";

type Tab = "auctions" | "bids" | "watchlist" | "reviews" | "referral" | "settings";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; username: string };
  transaction: { auction: { title: string } };
}

interface Props {
  userId?: string;
}

export default function ProfileView({ userId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: me, logout, token } = useAuthStore();
  const isMe = !userId || userId === me?.id;

  const [profile, setProfile] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("auctions");
  const [loading, setLoading] = useState(true);
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [watchlist, setWatchlist] = useState<Auction[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [prices, setPrices] = useState<SimplePrices | null>(null);
  const [vipLoading, setVipLoading] = useState(false);
  const [verifiedLoading, setVerifiedLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (searchParams.get("vip") === "success" || searchParams.get("verified") === "success") {
      setTab("settings");
    }
  }, [searchParams]);

  useEffect(() => {
    const pid = userId || me?.id;
    if (!pid) { setLoading(false); return; }
    setLoading(true);

    const loadReviews = (id: string) => {
      setReviewsLoading(true);
      payments.getReviews(id).then((data: Review[]) => {
        setReviews(data);
        if (data.length > 0) setAvgRating(data.reduce((s, r) => s + r.rating, 0) / data.length);
      }).catch(() => {
        // reviews are supplementary — don't block profile render on failure
      }).finally(() => setReviewsLoading(false));
    };

    if (userId && userId !== me?.id) {
      users.getProfile(pid).then(setProfile).catch(() => toast("error", "Nepodařilo se načíst profil")).finally(() => setLoading(false));
      if (token) followApi.check(pid).then((r: { following: boolean }) => setIsFollowing(r.following)).catch(() => {});
      loadReviews(pid);
    } else if (token) {
      authApi.me().then((u) => { setProfile(u); }).catch(() => toast("error", "Nepodařilo se načíst profil")).finally(() => setLoading(false));
      users.getMyAuctions().then(setMyAuctions).catch(() => toast("error", "Nepodařilo se načíst aukce"));
      users.getMyBids().then(setMyBids).catch(() => toast("error", "Nepodařilo se načíst příhozy"));
      users.getWatchlist().then(setWatchlist).catch(() => {});
      authApi.getReferralCode().then((r) => setReferralCode(r.code)).catch(() => {});
      monetizationApi.getPrices().then(setPrices).catch(() => {});
      loadReviews(pid);
    } else {
      users.getProfile(pid).then(setProfile).catch(() => toast("error", "Nepodařilo se načíst profil")).finally(() => setLoading(false));
    }
  }, [userId, me?.id, token]);

  const copyReferral = () => {
    if (typeof window === "undefined") return;
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVipPurchase = async (plan: "monthly" | "yearly") => {
    setVipLoading(true);
    try {
      const { url } = await monetizationApi.createVipCheckout(plan);
      window.location.href = url;
    } catch { toast("error", "Nepodařilo se spustit platbu"); }
    setVipLoading(false);
  };

  const handleVerifiedPurchase = async () => {
    setVerifiedLoading(true);
    try {
      const { url } = await monetizationApi.createVerifiedCheckout();
      window.location.href = url;
    } catch { toast("error", "Nepodařilo se spustit platbu"); }
    setVerifiedLoading(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 w-24 rounded-full bg-[#0B1220]" />
          <div className="h-6 bg-[#0B1220] rounded w-48" />
          <div className="h-32 bg-[#0B1220] rounded" />
        </div>
      </div>
    );
  }

  const p = profile || me;
  if (!p) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-gray-400">Profil nenalezen.</p>
        <Link href="/" className="btn-primary mt-4 inline-flex">Domů</Link>
      </div>
    );
  }

  const isVip = p?.vip;
  const isFounder = p?.founder;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-5 mb-6 relative overflow-hidden">
        {(isVip || isFounder) && (
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
            <Crown className="w-full h-full text-[#FFD700]" />
          </div>
        )}
        <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#009DFF] to-[#00C8FF] text-3xl font-bold font-heading shadow-[0_0_30px_rgba(0,200,255,0.2)]">
                {p?.username?.[0]?.toUpperCase() || "?"}
              </div>
              {isFounder && (
                <div className="absolute -top-1 -right-1 bg-[#FFD700] rounded-full p-1 shadow-lg" title="Founder">
                  <Crown className="h-4 w-4 text-[#050A12]" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading flex items-center gap-3 flex-wrap">
                {p?.username}
                <RankBadge rank={p?.rank} />
                {isFounder && <span className="text-xs font-bold bg-[#FFD700] text-[#050A12] px-2 py-0.5 rounded-full">FOUNDER</span>}
                {isVip && (
                  <span className="text-xs font-bold bg-gradient-to-r from-[#00C8FF] to-[#009DFF] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3" />VIP
                  </span>
                )}
                {p?.verified && p?.verifiedType === "paid" && (
                  <span className="text-xs font-bold bg-[#A7FF00] text-[#050A12] px-2 py-0.5 rounded-full">VERIFIED</span>
                )}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-[#00C8FF]" />
                  Důvěra: {p?.trustScore || 0}
                </span>
                {p?.credits !== undefined && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-[#A7FF00]" />
                    {p.credits} kreditů
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!isMe && token && userId && (
              <>
                <button
                  onClick={async () => {
                    const r = await followApi.toggle(userId) as { following: boolean };
                    setIsFollowing(r.following);
                  }}
                  className={`btn text-sm font-heading ${isFollowing ? "btn-ghost text-[#00C8FF] border border-[rgba(0,200,255,0.3)]" : "btn-primary"}`}
                >
                  {isFollowing ? <><UserCheck className="h-4 w-4" /> Sleduješ</> : <><UserPlus className="h-4 w-4" /> Sledovat</>}
                </button>
                <Link href={`/messages?with=${userId}`} className="btn-secondary text-sm font-heading flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> Zpráva
                </Link>
              </>
            )}
            {isMe && (
              <button onClick={() => { logout(); router.push("/"); }} className="btn-ghost text-sm">
                <LogOut className="h-4 w-4" /> Odhlásit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-5 pt-4 border-t border-[rgba(0,200,255,0.08)]">
          {[
            { value: p?.auctionCount || 0, label: "Aukcí" },
            { value: p?.bidCount || 0, label: "Příhozů" },
            { value: p?.totalSales || 0, label: "Prodejů" },
            { value: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : (p?.wonCount ?? 0), label: avgRating > 0 ? "Hodnocení" : "Výher" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold font-heading text-[#A7FF00]">{s.value}</p>
              <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs (only for own profile) */}
      {isMe && (
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { key: "auctions", icon: Package, label: "Moje aukce" },
            { key: "bids", icon: CreditCard, label: "Moje příhozy" },
            { key: "watchlist", icon: Heart, label: "Sledované" },
            { key: "reviews", icon: Star, label: "Recenze" },
            { key: "referral", icon: Gift, label: "Referral" },
            { key: "settings", icon: Sparkles, label: "Prémiové funkce" },
          ] as { key: Tab; icon: React.ComponentType<{ className?: string }>; label: string }[]).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`btn text-sm font-heading ${tab === t.key ? "btn-primary" : "btn-ghost"}`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Auctions tab */}
      {isMe && tab === "auctions" && (
        myAuctions.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-heading font-bold text-gray-400">Zatím nemáš žádné aukce</p>
            <Link href="/auctions/create" className="btn-primary mt-4 inline-flex font-heading">Vytvořit aukci</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myAuctions.map((a) => <AuctionCardSimple key={a.id} auction={a} />)}
          </div>
        )
      )}

      {/* Bids tab */}
      {isMe && tab === "bids" && (
        myBids.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-heading font-bold text-gray-400">Zatím nemáš žádné příhozy</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] divide-y divide-[rgba(0,200,255,0.06)]">
            {myBids.map((bid) => {
              const a = bid.auction;
              if (!a) return null;
              return (
                <Link key={bid.id} href={`/auctions/${a.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-[rgba(0,200,255,0.03)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(0,200,255,0.08)] flex items-center justify-center">
                      <Gavel className="h-5 w-5 text-[#00C8FF]" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.status === "ACTIVE" ? "Probíhá" : "Skončila"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-heading text-[#A7FF00]">{bid.amount.toLocaleString("cs-CZ")} Kč</p>
                    <p className="text-xs text-gray-500">{new Date(bid.createdAt).toLocaleDateString("cs-CZ")}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}

      {/* Watchlist tab */}
      {isMe && tab === "watchlist" && (
        watchlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-heading font-bold text-gray-400">Zatím nic nesleduješ</p>
            <Link href="/auctions" className="btn-primary mt-4 inline-flex font-heading">Prozkoumat aukce</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {watchlist.map((w) => <AuctionCardSimple key={w.id} auction={w} />)}
          </div>
        )
      )}

      {/* Reviews tab */}
      {(isMe ? tab === "reviews" : true) && (!isMe || tab === "reviews") && (
        <ReviewsSection reviews={reviews} loading={reviewsLoading} avgRating={avgRating} />
      )}

      {/* Referral tab */}
      {isMe && tab === "referral" && (
        <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-xl bg-[rgba(167,255,0,0.1)] p-3"><Gift className="h-8 w-8 text-[#A7FF00]" /></div>
            <div>
              <h2 className="text-xl font-bold font-heading">Referral program</h2>
              <p className="text-sm text-gray-500">Pozvi přátele a získej odměnu</p>
            </div>
          </div>
          {referralCode && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={typeof window !== "undefined" ? `${window.location.origin}/register?ref=${referralCode}` : ""}
                className="input flex-1 text-sm"
              />
              <button onClick={copyReferral} className="btn-primary px-3">
                {copied ? <CheckIcon className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
          <div className="p-4 rounded-xl bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)]">
            <p className="text-sm text-[#00C8FF]">Za každého pozvaného uživatele získáš bonus kredity a slevu na poplatky.</p>
          </div>
        </div>
      )}

      {/* Settings / Monetization tab */}
      {isMe && tab === "settings" && (
        <div className="space-y-6">
          {/* VIP */}
          <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-[#00C8FF] to-[#009DFF] p-3">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading">VIP předplatné</h2>
                <p className="text-sm text-gray-500">Nižší poplatky, prioritní pozice, bannery a analytika</p>
              </div>
            </div>
            {isVip ? (
              <div className="p-4 rounded-xl bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)]">
                <p className="text-[#00C8FF] font-heading font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5" /> VIP je aktivní
                </p>
                {p?.vipUntil && (
                  <p className="text-sm text-gray-500 mt-1">
                    Platí do: {new Date(p.vipUntil).toLocaleDateString("cs-CZ")}
                  </p>
                )}
              </div>
            ) : prices ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <PriceCard
                  title="VIP Měsíční"
                  price={prices.vipMonthly}
                  period="měsíc"
                  features={["Nižší poplatky", "Prioritní pozice", "Bannery", "Analytika"]}
                  onBuy={() => handleVipPurchase("monthly")}
                  loading={vipLoading}
                />
                <PriceCard
                  title="VIP Roční"
                  price={prices.vipYearly}
                  period="rok"
                  features={["Nižší poplatky", "Prioritní pozice", "Bannery", "Analytika", "Ušetříš 2 měsíce"]}
                  onBuy={() => handleVipPurchase("yearly")}
                  loading={vipLoading}
                  popular
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Načítám ceny…</div>
            )}
          </div>

          {/* Verified */}
          <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-xl bg-[rgba(167,255,0,0.1)] p-3">
                <ShieldCheck className="h-8 w-8 text-[#A7FF00]" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading">Verified badge</h2>
                <p className="text-sm text-gray-500">Jednorázový poplatek — doživotní ověření identity</p>
              </div>
            </div>
            {p?.verified ? (
              <div className="p-4 rounded-xl bg-[rgba(167,255,0,0.06)] border border-[rgba(167,255,0,0.1)]">
                <p className="text-[#A7FF00] font-heading font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Účet je ověřen
                </p>
                {p?.verifiedType === "founder" && <p className="text-sm text-gray-500 mt-1">Ověřeno jako Founder</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(0,200,255,0.03)] border border-[rgba(0,200,255,0.08)]">
                <div>
                  <p className="font-heading font-semibold">Jednorázový poplatek</p>
                  {prices && <p className="text-2xl font-bold font-heading text-[#A7FF00] mt-1">{prices.verifiedPrice} Kč</p>}
                </div>
                <button onClick={handleVerifiedPurchase} disabled={verifiedLoading} className="btn-primary font-heading">
                  {verifiedLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Přesměrovávám…</> : "Ověřit se"}
                </button>
              </div>
            )}
          </div>

          {/* Credits */}
          {p?.credits !== undefined && (
            <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-[rgba(255,215,0,0.1)] p-3">
                  <Zap className="h-8 w-8 text-[#FFD700]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-heading">Kredity</h2>
                  <p className="text-sm text-gray-500">Použij kredity pro boost aukcí a další výhody</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-heading text-[#A7FF00]">{p.credits}</p>
                  <p className="text-xs text-gray-500">k dispozici</p>
                </div>
              </div>
            </div>
          )}

          {/* Fee info */}
          {prices && (
            <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
              <h2 className="text-lg font-bold font-heading mb-4">Poplatky</h2>
              {prices.feePhase === "phase1" ? (
                <div className="p-4 rounded-xl bg-[rgba(167,255,0,0.06)] border border-[rgba(167,255,0,0.1)]">
                  <p className="text-[#A7FF00] font-heading font-semibold">0 % poplatky (fáze 1)</p>
                  <p className="text-sm text-gray-500 mt-1">Ve fázi 1 jsou všechny prodeje bez poplatků. Využij to!</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Standardní poplatky jsou aktivní.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewsSection({ reviews, loading, avgRating }: { reviews: Review[]; loading: boolean; avgRating: number }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold font-heading text-[#A7FF00]">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
            <div className="flex items-center gap-0.5 mt-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`h-5 w-5 ${star <= Math.round(avgRating) ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`} />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{reviews.length} recenzí</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 w-3">{star}</span>
                  <Star className="h-3 w-3 text-[#FFD700]" />
                  <div className="flex-1 h-2 rounded-full bg-[rgba(0,200,255,0.1)] overflow-hidden">
                    <div className="h-full bg-[#FFD700] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-[#0B1220] rounded-xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-heading font-bold text-gray-400">Zatím žádné recenze</p>
          <p className="text-sm text-gray-500 mt-1">Recenze se zobrazí po dokončení transakce</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#009DFF] text-sm font-bold font-heading">
                    {review.reviewer.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-sm">{review.reviewer.username}</p>
                    <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString("cs-CZ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`} />
                  ))}
                </div>
              </div>
              {review.comment && <p className="text-sm text-gray-300 mt-2">{review.comment}</p>}
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Gavel className="h-3 w-3" />
                {review.transaction?.auction?.title || "Aukce"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuctionCardSimple({ auction }: { auction: Auction }) {
  const now = new Date();
  const end = new Date(auction.endTime);
  const isEnded = end < now;

  return (
    <Link href={`/auctions/${auction.id}`} className="card card-hover block group">
      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#050A12] mb-3 relative">
        {auction.imageUrl ? (
          <Image src={auction.imageUrl} alt={auction.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gavel className="h-10 w-10 text-[rgba(0,200,255,0.2)]" />
          </div>
        )}
      </div>
      <p className="font-heading font-semibold text-sm truncate">{auction.title}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[#A7FF00] font-bold font-heading text-sm">
          {(auction.currentPrice || auction.startingPrice)?.toLocaleString("cs-CZ")} Kč
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-heading font-semibold ${
          isEnded ? "bg-gray-800 text-gray-500" : "bg-[rgba(0,200,255,0.1)] text-[#00C8FF]"
        }`}>
          {isEnded ? "Skončila" : "Aktivní"}
        </span>
      </div>
    </Link>
  );
}

function PriceCard({
  title, price, period, features, onBuy, loading, popular,
}: {
  title: string; price: number; period: string; features: string[]; onBuy: () => void; loading: boolean; popular?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 ${popular ? "border-[#00C8FF] bg-[rgba(0,200,255,0.04)]" : "border-[rgba(0,200,255,0.1)]"}`}>
      {popular && <p className="text-xs font-bold text-[#00C8FF] mb-2">NEJLEPŠÍ HODNOTA</p>}
      <h3 className="text-lg font-bold font-heading">{title}</h3>
      <p className="text-3xl font-bold font-heading text-[#A7FF00] mt-2">
        {price} Kč<span className="text-sm text-gray-500 font-normal">/{period}</span>
      </p>
      <ul className="mt-4 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-[#00C8FF]" /> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onBuy}
        disabled={loading}
        className={`w-full mt-6 font-heading rounded-xl px-4 py-2.5 font-semibold transition-all ${popular ? "btn-primary" : "btn-ghost border border-[rgba(0,200,255,0.2)]"}`}
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Přesměrovávám…</> : `Předplatit ${title.toLowerCase()}`}
      </button>
    </div>
  );
}

