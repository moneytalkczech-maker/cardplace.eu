import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  Package, Heart, Gift, Copy, Check, LogOut, Trophy, ShieldCheck,
  Settings, UserPlus, UserCheck, CreditCard, Gavel, Star, Zap, Crown, Sparkles,
  MessageSquare, BookOpen,
} from "lucide-react";
import { users, auth as authApi, followApi } from "../services/api";
import { payments } from "../services/payments";
import { monetizationApi } from "../services/monetization";
import { useAuthStore } from "../store/authStore";
import { toast } from "../components/Toast";
import { useTranslation } from "../hooks/useTranslation";
import RankBadge from "../components/RankBadge";
import AuctionCard from "../components/AuctionCard";
import type { Auction, WatchlistItem, MonetizationPrices } from "../types";

type Tab = "auctions" | "bids" | "watchlist" | "reviews" | "referral" | "settings";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; username: string };
  transaction: {
    auction: { title: string };
  };
}

export default function Profile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user: me, logout, token } = useAuthStore();
  const isMe = !id || id === me?.id;

  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("auctions");
  const [loading, setLoading] = useState(true);
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [prices, setPrices] = useState<MonetizationPrices | null>(null);
  const [vipLoading, setVipLoading] = useState(false);
  const [verifiedLoading, setVerifiedLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  // Auto-open settings tab if redirected from payment
  useEffect(() => {
    if (searchParams.get("vip") === "success" || searchParams.get("verified") === "success") {
      setTab("settings");
    }
  }, [searchParams]);

  useEffect(() => {
    const pid = id || me?.id;
    if (!pid) { setLoading(false); return; }
    setLoading(true);

    if (id && id !== me?.id) {
      users.getProfile(pid).then(setProfile).catch(() => toast("error", t("profile.loadProfileError"))).finally(() => setLoading(false));
      if (token) followApi.check(pid).then((r) => setIsFollowing(r.following)).catch(() => toast("error", t("profile.loadFollowError")));
      // Load reviews for other users too
      setReviewsLoading(true);
      payments.getReviews(pid).then((data: Review[]) => {
        setReviews(data);
        if (data.length > 0) {
          setAvgRating(data.reduce((sum, r) => sum + r.rating, 0) / data.length);
        }
      }).catch(() => {}).finally(() => setReviewsLoading(false));
    } else if (token) {
      authApi.me().then((u) => { setProfile(u); me && Object.assign(me, u); }).catch(() => toast("error", t("profile.loadProfileError"))).finally(() => setLoading(false));
      users.getMyAuctions().then(setMyAuctions).catch(() => toast("error", t("profile.loadAuctionsError")));
      users.getMyBids().then(setMyBids).catch(() => toast("error", t("profile.loadBidsError")));
      users.getWatchlist()      .then((data: any) => setWatchlist(data.data || data || [])).catch(() => toast("error", t("profile.loadWatchlistError")));
      authApi.getReferralCode().then((r) => setReferralCode(r.code)).catch(() => toast("error", t("profile.loadReferralError")));
      monetizationApi.getPrices().then(setPrices).catch(() => toast("error", t("profile.loadPricesError")));
      // Load reviews
      setReviewsLoading(true);
      payments.getReviews(pid).then((data: Review[]) => {
        setReviews(data);
        if (data.length > 0) {
          setAvgRating(data.reduce((sum, r) => sum + r.rating, 0) / data.length);
        }
      }).catch(() => {}).finally(() => setReviewsLoading(false));
    } else {
      users.getProfile(pid).then(setProfile).catch(() => toast("error", t("profile.loadProfileError"))).finally(() => setLoading(false));
    }
  }, [id, me?.id, token]);

  const copyReferral = () => {
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
    } catch { toast("error", t("profile.vipPurchaseError")); }
    setVipLoading(false);
  };

  const handleVerifiedPurchase = async () => {
    setVerifiedLoading(true);
    try {
      const { url } = await monetizationApi.createVerifiedCheckout();
      window.location.href = url;
    } catch { toast("error", t("profile.verifiedPaymentError")); }
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
  const isVip = p?.vip;
  const isFounder = p?.founder;
  const showSettings = tab === "settings" && isMe;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* Profile Header */}
      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-4 mb-6 relative overflow-hidden">
        {(isVip || isFounder) && (
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
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
                {p?.username} <RankBadge rank={p?.rank} />
                {isFounder && <span className="text-xs font-bold bg-[#FFD700] text-[#050A12] px-2 py-0.5 rounded-full">FOUNDER</span>}
                {isVip && <span className="text-xs font-bold bg-gradient-to-r from-[#00C8FF] to-[#009DFF] text-white px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="h-3 w-3" />VIP</span>}
                {p?.verified && p?.verifiedType === "paid" && <span className="text-xs font-bold bg-[#A7FF00] text-[#050A12] px-2 py-0.5 rounded-full">VERIFIED</span>}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-[#00C8FF]" />
                  {t("profile.trust")}: {p?.trustScore || 0}
                </span>
                {p?.credits !== undefined && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-[#A7FF00]" />
                    {p.credits} {t("profile.credits")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMe && token && (
              <button onClick={async () => { if (!id) return; const r = await followApi.toggle(id); setIsFollowing(r.following); }}
                className={`btn text-sm font-heading ${isFollowing ? "btn-ghost text-[#00C8FF] border border-[rgba(0,200,255,0.3)]" : "btn-primary"}`}>
                {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isFollowing ? t("profile.following") : t("profile.follow")}
              </button>
            )}
            {isMe && <button onClick={logout} className="btn-ghost text-sm"><LogOut className="h-4 w-4" /> {t("profile.signOut")}</button>}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-[rgba(0,200,255,0.08)]">
          {[
            { value: p?.auctionCount || 0, label: t("profile.auctions") },
            { value: p?.bidCount || 0, label: t("profile.bids") },
            { value: p?.totalSales || 0, label: t("profile.sales") },
            { value: avgRating > 0 ? `${avgRating.toFixed(1)} ★` : (p as any)?.wonCount ?? 0, label: avgRating > 0 ? t("profile.rating") : t("profile.won") },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold font-heading text-[#A7FF00]">{s.value}</p>
              <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Collection stats */}
        {((p as any)?.collectionTotalCards > 0 || isMe) && (
          <Link
            to={`/collection/${p?.id}`}
            className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl border border-[rgba(0,200,255,0.12)] bg-[rgba(0,200,255,0.04)] hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.08)] transition-all group"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-[#00C8FF]" />
              <div>
                <p className="text-sm font-heading font-bold text-white group-hover:text-[#00C8FF] transition-colors">
                  {t("profile.collection")}
                </p>
                <p className="text-xs text-gray-500">
                  {(p as any)?.collectionUniqueCards ?? 0} {t("profile.uniqueCards")} · {(p as any)?.collectionTotalCards ?? 0} {t("profile.totalCardsShort")}
                </p>
              </div>
            </div>
            {(p as any)?.collectionValue > 0 && (
              <span className="text-[#A7FF00] font-heading font-bold text-sm">
                {(p as any).collectionValue.toLocaleString("cs-CZ")} Kč
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Tabs */}
      {isMe && (
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: "auctions" as Tab, icon: Package, label: "profile.myAuctions" },
            { key: "bids" as Tab, icon: CreditCard, label: "profile.myBids" },
            { key: "watchlist" as Tab, icon: Heart, label: "profile.watchlist" },
            { key: "reviews" as Tab, icon: Star, label: "profile.reviews" },
            { key: "referral" as Tab, icon: Gift, label: "profile.referral" },
            { key: "settings" as Tab, icon: Sparkles, label: "profile.settings" },
          ].map((tabItem) => {
            const Icon = tabItem.icon;
            return (
              <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
                className={`btn text-sm font-heading ${tab === tabItem.key ? "btn-primary" : "btn-ghost"}`}>
                <Icon className="h-4 w-4" /> {t(tabItem.label)}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      {isMe && tab === "auctions" && (myAuctions.length === 0
        ? <div className="text-center py-16"><Package className="h-16 w-16 mx-auto mb-4 text-gray-600" /><p className="text-lg font-heading font-bold text-gray-400">{t("profile.noAuctions")}</p><Link to="/create" className="btn-primary mt-4 inline-flex font-heading">{t("profile.noAuctionsCta")}</Link></div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{myAuctions.map((a) => <AuctionCard key={a.id} auction={a} />)}</div>
      )}

      {isMe && tab === "bids" && (myBids.length === 0
        ? <div className="text-center py-16"><CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-600" /><p className="text-lg font-heading font-bold text-gray-400">{t("profile.noBids")}</p></div>
        : <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] divide-y divide-[rgba(0,200,255,0.06)]">
            {myBids.map((bid: any) => {
              const a = bid.auction;
              if (!a) return null;
              return (
                <Link key={bid.id} to={`/auctions/${a.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-[rgba(0,200,255,0.03)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(0,200,255,0.08)] flex items-center justify-center">
                      <Gavel className="h-5 w-5 text-[#00C8FF]" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.status === "ACTIVE" ? t("profile.auctionActive") : t("profile.auctionEnded")}</p>
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
      )}

      {isMe && tab === "watchlist" && (watchlist.length === 0
        ? <div className="text-center py-16"><Heart className="h-16 w-16 mx-auto mb-4 text-gray-600" /><p className="text-lg font-heading font-bold text-gray-400">{t("profile.noWatchlist")}</p><Link to="/auctions" className="btn-primary mt-4 inline-flex font-heading">{t("profile.noWatchlistCta")}</Link></div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{watchlist.map((w) => <AuctionCard key={w.id} auction={w.auction} />)}</div>
      )}

      {/* Reviews Tab */}
      {(isMe || (!isMe && !loading)) && tab === "reviews" && (
        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold font-heading text-[#A7FF00]">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
                <div className="flex items-center gap-0.5 mt-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(avgRating) ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{reviews.length} {reviews.length === 1 ? "recenze" : reviews.length < 5 ? "recenze" : "recenzí"}</p>
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

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-[#0B1220] rounded-xl" />
                ))}
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-heading font-bold text-gray-400">{t("profile.noReviews") || "Zatím žádné recenze"}</p>
              <p className="text-sm text-gray-500 mt-1">{t("profile.noReviewsDesc") || "Recenze se zobrazí po dokončení transakce"}</p>
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
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-[#FFD700] text-[#FFD700]" : "text-gray-600"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-300 mt-2">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Gavel className="h-3 w-3" />
                    {review.transaction?.auction?.title || "Aukce"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isMe && tab === "referral" && (
        <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-xl bg-[rgba(167,255,0,0.1)] p-3"><Gift className="h-8 w-8 text-[#A7FF00]" /></div>
            <div><h2 className="text-xl font-bold font-heading">{t("profile.referralTitle")}</h2><p className="text-sm text-gray-500">{t("profile.referralDesc")}</p></div>
          </div>
          {referralCode && (
            <div className="flex items-center gap-2 mb-4">
              <input type="text" readOnly value={`${window.location.origin}/register?ref=${referralCode}`} className="input flex-1 text-sm" />
              <button onClick={copyReferral} className="btn-primary">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>
            </div>
          )}
          <div className="p-4 rounded-xl bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)]">
            <p className="text-sm text-[#00C8FF]">{t("profile.referralReward")}</p>
          </div>
        </div>
      )}

      {/* Settings / Monetization Tab */}
      {showSettings && (
        <div className="space-y-6">
          {/* VIP Subscription */}
          <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-xl bg-gradient-to-br from-[#00C8FF] to-[#009DFF] p-3">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading">{t("profile.vipTitle")}</h2>
                <p className="text-sm text-gray-500">{t("profile.vipSubtitle")}</p>
              </div>
            </div>

            {isVip ? (
              <div className="p-4 rounded-xl bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)]">
                <p className="text-[#00C8FF] font-heading font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5" /> {t("profile.vipActive")}
                </p>
                {p?.vipUntil && (
                  <p className="text-sm text-gray-500 mt-1">
                    {t("profile.vipValidUntil")} {new Date(p.vipUntil).toLocaleDateString("cs-CZ")}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {prices && (
                  <>
                    <PriceCard
                      title={t("profile.vipMonthly")}
                      price={prices.vipMonthly}
                      period={t("profile.vipPeriodMonth")}
                      features={[t("profile.vipFeatureLowerFees"), t("profile.vipFeatureTopPosition"), t("profile.vipFeatureBanner"), t("profile.vipFeatureAnalytics")]}
                      onBuy={() => handleVipPurchase("monthly")}
                      loading={vipLoading}
                    />
                    <PriceCard
                      title={t("profile.vipYearly")}
                      price={prices.vipYearly}
                      period={t("profile.vipPeriodYear")}
                      features={[t("profile.vipFeatureLowerFees"), t("profile.vipFeatureTopPosition"), t("profile.vipFeatureBanner"), t("profile.vipFeatureAnalytics"), t("profile.vipFeatureSave2Months")]}
                      onBuy={() => handleVipPurchase("yearly")}
                      loading={vipLoading}
                      popular
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Verified Badge */}
          <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-xl bg-[rgba(167,255,0,0.1)] p-3">
                <ShieldCheck className="h-8 w-8 text-[#A7FF00]" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading">{t("profile.verifiedTitle")}</h2>
                <p className="text-sm text-gray-500">{t("profile.verifiedSubtitle")}</p>
              </div>
            </div>

            {p?.verified ? (
              <div className="p-4 rounded-xl bg-[rgba(167,255,0,0.06)] border border-[rgba(167,255,0,0.1)]">
                <p className="text-[#A7FF00] font-heading font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> {t("profile.verifiedAccount")}
                </p>
                {p?.verifiedType === "founder" && <p className="text-sm text-gray-500 mt-1">{t("profile.verifiedFounderNote")}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(0,200,255,0.03)]">
                <div>
                  <p className="font-heading font-semibold">{t("profile.verifiedOneTime")}</p>
                  {prices && <p className="text-2xl font-bold font-heading text-[#A7FF00] mt-1">{prices.verifiedPrice} Kč</p>}
                </div>
                <button onClick={handleVerifiedPurchase} disabled={verifiedLoading} className="btn-primary font-heading">
                  {verifiedLoading ? t("profile.verifiedLoading") : t("profile.verifiedButton")}
                </button>
              </div>
            )}
          </div>

          {/* Daily Credit */}
          {p?.credits !== undefined && (
            <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-[rgba(255,215,0,0.1)] p-3">
                  <Zap className="h-8 w-8 text-[#FFD700]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-heading">{t("profile.creditsTitle")}</h2>
                  <p className="text-sm text-gray-500">{t("profile.creditsSubtitle")}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-heading text-[#A7FF00]">{p.credits}</p>
                  <p className="text-xs text-gray-500">{t("profile.creditsAvailable")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Fee Info */}
          {prices && (
            <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
              <h2 className="text-lg font-bold font-heading mb-4">{t("profile.feesTitle")}</h2>
              <p className="text-sm text-gray-500 mb-3">
                {prices.feePhase === "phase1"
                  ? t("profile.feesPhase1")
                  : t("profile.feesActive")}
              </p>
              {prices.feePhase === "phase1" && (
                <div className="p-4 rounded-xl bg-[rgba(167,255,0,0.06)] border border-[rgba(167,255,0,0.1)]">
                  <p className="text-[#A7FF00] font-heading font-semibold">{t("profile.feesZero")}</p>
                  <p className="text-sm text-gray-500 mt-1">{t("profile.feesPhase1Note")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PriceCard({ title, price, period, features, onBuy, loading, popular }: {
  title: string; price: number; period: string; features: string[]; onBuy: () => void; loading: boolean; popular?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={`rounded-xl border p-5 ${popular ? "border-[#00C8FF] bg-[rgba(0,200,255,0.04)]" : "border-[rgba(0,200,255,0.1)] bg-[rgba(0,200,255,0.02)]"}`}>
      {popular && <p className="text-xs font-bold text-[#00C8FF] mb-2">{t("profile.vipBestValue")}</p>}
      <h3 className="text-lg font-bold font-heading">{title}</h3>
      <p className="text-3xl font-bold font-heading text-[#A7FF00] mt-2">{price} Kč<span className="text-sm text-gray-500 font-normal">/{period}</span></p>
      <ul className="mt-4 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
            <Check className="h-4 w-4 text-[#00C8FF]" /> {f}
          </li>
        ))}
      </ul>
      <button onClick={onBuy} disabled={loading} className={`btn font-heading w-full mt-6 ${popular ? "btn-primary" : "btn-ghost border border-[rgba(0,200,255,0.2)]"}`}>
        {loading ? t("profile.vipRedirecting") : `${t("profile.vipSubscribe")} ${title.toLowerCase()}`}
      </button>
    </div>
  );
}
