import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Package, Heart, Gift, Copy, Check, LogOut, Trophy, ShieldCheck, Settings, UserPlus, UserCheck, CreditCard, Gavel } from "lucide-react";
import { users, auth as authApi, followApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "../hooks/useTranslation";
import RankBadge from "../components/RankBadge";
import AuctionCard from "../components/AuctionCard";
import type { Auction, WatchlistItem } from "../types";

type Tab = "auctions" | "bids" | "watchlist" | "referral";

export default function Profile() {
  const { t } = useTranslation();
  const { id } = useParams();
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

  useEffect(() => {
    const pid = id || me?.id;
    if (!pid) { setLoading(false); return; }
    setLoading(true);

    if (id && id !== me?.id) {
      users.getProfile(pid).then(setProfile).catch(() => {}).finally(() => setLoading(false));
      if (token) followApi.check(pid).then((r) => setIsFollowing(r.following)).catch(() => {});
    } else if (token) {
      authApi.me().then(setProfile).catch(() => {}).finally(() => setLoading(false));
      users.getMyAuctions().then(setMyAuctions).catch(() => {});
      users.getMyBids().then(setMyBids).catch(() => {});
      users.getWatchlist().then(setWatchlist).catch(() => {});
      authApi.getReferralCode().then((r) => setReferralCode(r.code)).catch(() => {});
    } else {
      users.getProfile(pid).then(setProfile).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id, me?.id, token]);

  const copyReferral = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 w-24 rounded-full bg-[#111B2E]" />
          <div className="h-6 bg-[#111B2E] rounded w-48" />
          <div className="h-32 bg-[#111B2E] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-4 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#009DFF] to-[#00C8FF] text-3xl font-bold font-heading shadow-[0_0_30px_rgba(0,200,255,0.2)]">
              {profile?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading flex items-center gap-3 flex-wrap">
                {profile?.username} <RankBadge rank={profile?.rank} />
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-[#00C8FF]" />
                  {t("profile.trust")}: {profile?.trustScore || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMe && token && (
              <button onClick={async () => { if (!id) return; const r = await followApi.toggle(id); setIsFollowing(r.following); }}
                className={`btn text-sm font-heading ${isFollowing ? "btn-ghost text-[#00C8FF] border border-[rgba(0,200,255,0.3)]" : "btn-primary"}`}>
                {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {isFollowing ? "Sleduji" : "Sledovat"}
              </button>
            )}
            {isMe && <button onClick={logout} className="btn-ghost text-sm"><LogOut className="h-4 w-4" /> {t("profile.signOut")}</button>}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-[rgba(0,200,255,0.08)]">
          {[
            { value: profile?.auctionCount || 0, label: t("profile.auctions") },
            { value: profile?.bidCount || 0, label: t("profile.bids") },
            { value: profile?.totalSales || 0, label: t("profile.sales") },
            { value: "0", label: t("profile.won") },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold font-heading text-[#A7FF00]">{s.value}</p>
              <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {isMe && (
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: "auctions" as Tab, icon: Package, labelKey: "profile.myAuctions" },
            { key: "bids" as Tab, icon: CreditCard, labelKey: "profile.myBids" },
            { key: "watchlist" as Tab, icon: Heart, labelKey: "profile.watchlist" },
            { key: "referral" as Tab, icon: Gift, labelKey: "profile.referral" },
          ].map((tabItem) => {
            const Icon = tabItem.icon;
            return (
              <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
                className={`btn text-sm font-heading ${tab === tabItem.key ? "btn-primary" : "btn-ghost"}`}>
                <Icon className="h-4 w-4" /> {t(tabItem.labelKey)}
              </button>
            );
          })}
        </div>
      )}

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
                      <p className="text-xs text-gray-500">{a.status === "ACTIVE" ? "Probíhá" : "Ukončeno"}</p>
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
    </div>
  );
}
