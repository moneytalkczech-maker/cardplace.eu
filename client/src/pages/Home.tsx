import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Zap, Clock, Shield, Sparkles, ArrowRight, Plus, Gavel } from "lucide-react";
import AuctionCard from "../components/AuctionCard";
import { auctions } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import type { Auction, Transaction } from "../types";

export default function Home() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<Auction[]>([]);
  const [trending, setTrending] = useState<Auction[]>([]);
  const [lastSold, setLastSold] = useState<Transaction[]>([]);

  useEffect(() => {
    auctions.getFeatured().then(setFeatured).catch((err) => console.error("Featured fetch failed:", err));
    auctions.getTrending().then(setTrending).catch((err) => console.error("Trending fetch failed:", err));
    auctions.getLastSold().then(setLastSold).catch((err) => console.error("LastSold fetch failed:", err));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[rgba(0,200,255,0.08)]">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,157,255,0.08)] via-[#050A12] to-[rgba(167,255,0,0.06)]" />
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#00C8FF] opacity-[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#A7FF00] opacity-[0.03] rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,200,255,0.2)] bg-[rgba(0,200,255,0.06)] px-4 py-1.5 text-sm text-[#00C8FF] mb-6 font-heading font-semibold">
                <Sparkles className="h-4 w-4" /> {t("home.hero.badge")}
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-heading leading-[1.05] mb-4">
                Draž.<br />
                <span className="text-gradient">Prodávej.</span><br />
                Sbírej.
              </h1>

              <p className="text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                {t("home.hero.subtitle")}
              </p>

              <div className="flex items-center justify-center lg:justify-start gap-4 flex-wrap">
                <Link to="/auctions" className="btn-primary text-base px-8 py-3 font-heading">
                  {t("home.hero.browse")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/create" className="btn-secondary text-base px-8 py-3 font-heading">
                  <Plus className="h-4 w-4" /> {t("nav.create")}
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 max-w-md mx-auto lg:mx-0">
                {[
                  { value: "724+", label: "Karet v DB" },
                  { value: "Živě", label: "Realtime příhozy" },
                  { value: "VIP", label: "Ověření prodejci" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl font-bold font-heading text-[#00C8FF]">{s.value}</p>
                    <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Card visual */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-72 h-96">
                {/* Card glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00C8FF] to-[#A7FF00] opacity-20 rounded-2xl blur-2xl" />
                {/* Card body */}
                <div className="relative w-full h-full rounded-2xl border-2 border-[rgba(0,200,255,0.3)] bg-[#0B1220] p-6 flex flex-col justify-between shadow-[0_0_60px_rgba(0,200,255,0.1)]">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="badge-blue font-heading">Pokémon</span>
                      <Gavel className="h-5 w-5 text-[#A7FF00]" />
                    </div>
                    <h3 className="font-heading font-bold text-xl text-white mb-1">Charizard</h3>
                    <p className="text-sm text-gray-400">VMAX Rainbow Rare</p>
                    <div className="mt-4 flex gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-[#A7FF00] opacity-[0.3 + i * 0.2]" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[#00C8FF] font-heading">
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">02:14:33</span>
                      <span className="text-gray-500">zbývá</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[rgba(167,255,0,0.08)] border border-[rgba(167,255,0,0.2)]">
                      <p className="text-xs text-gray-400 font-heading uppercase">{t("detail.currentBid")}</p>
                      <p className="text-3xl font-bold font-heading text-[#A7FF00] drop-shadow-[0_0_16px_rgba(167,255,0,0.4)]">
                        1 250 Kč
                      </p>
                    </div>
                    <span className="block btn-primary text-center text-sm py-2.5 font-heading w-full">
                      {t("detail.placeBid")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Zap, label: t("home.features.ai"), desc: t("home.features.aiDesc") },
            { icon: Clock, label: t("home.features.realtime"), desc: t("home.features.realtimeDesc") },
            { icon: Shield, label: t("home.features.trusted"), desc: t("home.features.trustedDesc") },
            { icon: TrendingUp, label: t("home.features.history"), desc: t("home.features.historyDesc") },
          ].map((item) => (
            <div key={item.label} className="card text-center hover:border-[rgba(0,200,255,0.3)] transition-all duration-300">
              <item.icon className="h-8 w-8 mx-auto mb-2 text-[#00C8FF]" />
              <h3 className="font-heading font-bold text-sm">{item.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Auctions */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-heading flex items-center gap-3">
                <Zap className="h-6 w-6 text-[#A7FF00]" /> {t("home.featured")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Nejžhavější aukce, které právě běží</p>
            </div>
            <Link to="/auctions?featured=true" className="btn-secondary text-sm">{t("home.viewAll")}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((a) => <AuctionCard key={a.id} auction={a} />)}
          </div>
        </section>
      )}

      {/* Trending Now */}
      {trending.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-heading flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-[#00C8FF]" /> {t("home.trending")}
                <span className="text-sm font-heading font-semibold text-gray-500 bg-[rgba(255,255,255,0.05)] px-3 py-1 rounded-full border border-[rgba(0,200,255,0.1)]">
                  Týdenní
                </span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Nejžhavější karty tohoto týdne 🔥</p>
            </div>
            <Link to="/auctions?sort=trending" className="btn-secondary text-sm">{t("home.viewAll")}</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trending.map((a, idx) => (
              <div key={a.id} className="relative">
                {/* Rank badge */}
                {idx < 3 && (
                  <div className={`absolute -top-2 -left-2 z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold font-heading shadow-lg ${
                    idx === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white" :
                    idx === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white" :
                    "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                  }`}>
                    #{idx + 1}
                  </div>
                )}
                <AuctionCard key={a.id} auction={a} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Last Sold */}
      {lastSold.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-heading">{t("home.lastSold")}</h2>
            <p className="text-sm text-gray-500 mt-1">Poslední realizované prodeje na CardBid</p>
          </div>
          <div className="card p-0 divide-y divide-[rgba(0,200,255,0.06)]">
            {lastSold.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-4 hover:bg-[rgba(0,200,255,0.03)] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(0,200,255,0.1)] flex items-center justify-center text-[#00C8FF] font-heading font-bold text-sm">
                    {t.auction.card?.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm font-heading">{t.auction.title}</p>
                    <p className="text-xs text-gray-500">{t.buyer.username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold font-heading text-[#A7FF00]">{t.amount.toLocaleString("cs-CZ")} Kč</p>
                  <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString("cs-CZ")}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
