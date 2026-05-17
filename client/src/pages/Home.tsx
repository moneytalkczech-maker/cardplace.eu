import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  TrendingUp, Zap, Clock, Shield, Sparkles, ArrowRight, Plus, Gavel, 
  Award, Users, CheckCircle, Star, Flame, ChevronRight, PlayCircle,
  RefreshCw, Upload, CreditCard, Package, Bolt
} from "lucide-react";
import AuctionCard from "../components/AuctionCard";
import api, { auctions } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import type { Auction, Transaction } from "../types";

interface PlatformStats {
  userCount: number;
  auctionCount: number;
  completedAuctions: number;
  totalSales: number;
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M+";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
  return String(n);
}

// Categories — counts will be dynamically updated from real data
const categoryIcons: Record<string, { icon: string; color: string }> = {
  "Pokémon": { icon: "🔥", color: "from-yellow-500/20 to-red-500/20" },
  "Magic: The Gathering": { icon: "✨", color: "from-blue-500/20 to-purple-500/20" },
  "Yu-Gi-Oh!": { icon: "⚡", color: "from-purple-500/20 to-pink-500/20" },
  "Sportovní Karty": { icon: "🏆", color: "from-green-500/20 to-emerald-500/20" },
};

export default function Home() {
  const { t } = useTranslation();
  const features = [
    {
      icon: Zap,
      title: t("home.features.ai"),
      description: t("home.features.aiDesc"),
      color: "green"
    },
    {
      icon: Clock,
      title: t("home.features.realtime"),
      description: t("home.features.realtimeDesc"),
      color: "blue"
    },
    {
      icon: Shield,
      title: t("home.features.trusted"),
      description: t("home.features.trustedDesc"),
      color: "purple"
    },
    {
      icon: TrendingUp,
      title: t("home.features.history"),
      description: t("home.features.historyDesc"),
      color: "amber"
    },
  ];
  const [featured, setFeatured] = useState<Auction[]>([]);
  const [trending, setTrending] = useState<Auction[]>([]);
  const [lastSold, setLastSold] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredData, trendingData, soldData, statsData] = await Promise.all([
          auctions.getFeatured(),
          auctions.getTrending(),
          auctions.getLastSold(),
          api.get("/api/admin/stats").then(r => r.data).catch(() => ({
            userCount: 0,
            auctionCount: 0,
            completedAuctions: 0,
            totalSales: 0,
          })),
        ]);
        setFeatured(featuredData);
        setTrending(trendingData);
        setLastSold(soldData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const trustStats = stats ? [
    { value: formatCount(stats.userCount), label: t("home.trust.users"), icon: Users },
    { value: formatCount(stats.completedAuctions), label: t("home.trust.cardsSold"), icon: CheckCircle },
    { value: stats.totalSales > 0 ? "100%" : "0", label: t("home.trust.transactions"), icon: Shield },
    { value: `${stats.totalSales > 0 ? "★".repeat(5) : "-----"}`, label: t("home.trust.rating"), icon: Star },
  ] : [
    { value: "---", label: t("home.trust.users"), icon: Users },
    { value: "---", label: t("home.trust.cardsSold"), icon: CheckCircle },
    { value: "---", label: t("home.trust.transactions"), icon: Shield },
    { value: "-----", label: t("home.trust.rating"), icon: Star },
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#00C8FF] rounded-full opacity-[0.03] blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#A7FF00] rounded-full opacity-[0.03] blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#00C8FF] to-[#A7FF00] rounded-full opacity-[0.02] blur-[150px]" />
          {/* Red orb for lightning accent */}
          <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-[#FF0044] rounded-full opacity-[0.02] blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(0,200,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
          
          {/* Lightning bolt decoration */}
          <div className="absolute top-0 right-1/4 w-1 h-full bg-gradient-to-b from-transparent via-[#FF0044] to-transparent opacity-5 skew-x-[-15deg]" />
        </div>

        <div className="relative container-premium py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(0,200,255,0.08)] border border-[rgba(0,200,255,0.2)] text-[#00C8FF] text-sm font-heading font-semibold animate-fade-in-up">
                <Sparkles className="h-4 w-4" />
                <span>{t("home.hero.badge")}</span>
              </div>

              {/* Headline */}
              <h1 className="heading-xl animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                <span className="text-white">{t("home.hero.title1")}</span>
                <br />
                <span className="text-gradient">{t("home.hero.title2")}</span>
                <br />
                <span className="text-white">{t("home.hero.title3")}</span>
              </h1>

              {/* Tagline */}
              <p className="text-lg font-heading font-semibold tracking-wider animate-fade-in-up" style={{ animationDelay: "150ms" }}>
                <span className="text-[#00C8FF]" style={{ textShadow: "0 0 10px rgba(0,200,255,0.3)" }}>from</span>
                <span className="text-white mx-2">passion</span>
                <span className="text-[#FF3366] mx-2" style={{ textShadow: "0 0 10px rgba(255,0,68,0.3)" }}>to</span>
                <span className="text-[#A7FF00]" style={{ textShadow: "0 0 10px rgba(124,255,0,0.3)" }}>collection</span>
              </p>

              {/* Subtitle */}
              <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                {t("home.hero.subtitle")}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <Link 
                  to="/auctions" 
                  className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#A7FF00] to-[#5CFF00] text-[#050A12] font-bold font-heading text-lg shadow-lg shadow-[rgba(124,255,0,0.4)] hover:shadow-[rgba(124,255,0,0.6)] hover:-translate-y-1 transition-all duration-300"
                >
                  {t("home.hero.browse")}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/create" 
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-[rgba(0,200,255,0.3)] text-[#00C8FF] font-bold font-heading text-lg hover:bg-[rgba(0,200,255,0.1)] hover:border-[rgba(0,200,255,0.5)] transition-all duration-300"
                >
                  <Plus className="h-5 w-5" />
                  {t("home.hero.create")}
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-[#A7FF00]" />
                  <span>{t("home.hero.trustFree")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="h-4 w-4 text-[#00C8FF]" />
                  <span>{t("home.hero.trustSecure")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Award className="h-4 w-4 text-[#A7FF00]" />
                  <span>{t("home.hero.trustVerified")}</span>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="hidden lg:flex items-center justify-center animate-fade-in-up" style={{ animationDelay: "500ms" }}>
              <div className="relative">
                {/* Glow Effects */}
                <div className="absolute -inset-10 bg-gradient-to-r from-[#00C8FF] via-[#FF0044] to-[#A7FF00] opacity-20 blur-3xl rounded-full animate-pulse" />
                
                {/* Main Card */}
                <div className="relative w-80 rounded-3xl overflow-hidden glass-strong shadow-2xl animate-float">
                  {/* Card Header */}
                  <div className="relative h-64 bg-gradient-to-br from-[#0D1522] to-[#0B1220]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,200,255,0.15),transparent_50%)]" />
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="badge-blue">{t("home.demoCard.badge")}</span>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[rgba(124,255,0,0.15)] border border-[rgba(124,255,0,0.3)]">
                        <Flame className="h-3 w-3 text-[#A7FF00]" />
                        <span className="text-xs font-bold text-[#A7FF00]">{t("home.demoCard.hot")}</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-40 h-56 rounded-xl bg-gradient-to-br from-[#00C8FF]/20 to-[#A7FF00]/20 border border-[rgba(0,200,255,0.2)] flex items-center justify-center">
                        <span className="text-6xl">🔥</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-heading font-bold text-xl">{t("home.demoCard.title")}</h3>
                      <p className="text-sm text-gray-400">{t("home.demoCard.subtitle")}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(0,200,255,0.1)] border border-[rgba(0,200,255,0.2)] text-[#00C8FF] text-sm font-heading">
                        <Clock className="h-4 w-4" />
                        <span>02:14:33</span>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-gradient-to-r from-[rgba(124,255,0,0.15)] to-[rgba(124,255,0,0.05)] border border-[rgba(124,255,0,0.2)]">
                      <p className="text-xs text-gray-400 font-heading uppercase mb-1">{t("home.demoCard.bidLabel")}</p>
                      <p className="text-3xl font-bold font-heading text-[#A7FF00] drop-shadow-[0_0_16px_rgba(167,255,0,0.4)]">
                        12,500 Kč
                      </p>
                    </div>
                    
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#A7FF00] to-[#5CFF00] text-[#050A12] font-bold font-heading shadow-lg shadow-[rgba(124,255,0,0.3)]">
                      {t("home.demoCard.bidButton")}
                    </button>
                  </div>
                </div>

                {/* Floating Stats Card */}
                <div className="absolute -right-8 top-1/4 p-4 rounded-2xl glass shadow-xl animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C8FF] to-[#009DFF] flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t("home.demoCard.change24h")}</p>
                      <p className="font-heading font-bold text-[#00C8FF]">+15%</p>
                    </div>
                  </div>
                </div>

                {/* Floating Stats Card */}
                <div className="absolute -left-8 bottom-1/4 p-4 rounded-2xl glass shadow-xl animate-float" style={{ animationDelay: "2s" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A7FF00] to-[#5CFF00] flex items-center justify-center">
                      <Award className="h-5 w-5 text-[#050A12]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t("home.demoCard.trustLabel")}</p>
                      <p className="font-heading font-bold text-[#A7FF00]">{t("home.demoCard.trustScore")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Stats Bar */}
          <div className="mt-20 pt-12 border-t border-[rgba(0,200,255,0.1)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {trustStats.map((stat, index) => (
                <div 
                  key={stat.label} 
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(0,200,255,0.08)] border border-[rgba(0,200,255,0.15)] mb-3">
                    <stat.icon className="h-6 w-6 text-[#00C8FF]" />
                  </div>
                  <p className="text-2xl font-bold font-heading text-white">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,200,255,0.02)] to-transparent" />
        
        <div className="container-premium relative">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(0,200,255,0.08)] border border-[rgba(0,200,255,0.15)] text-[#00C8FF] text-sm font-heading font-semibold mb-6">
              {t("home.why.badge")}
            </span>
            <h2 className="heading-lg mb-4" dangerouslySetInnerHTML={{ __html: t("home.why.heading") }} />
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("home.why.desc")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group p-6 rounded-2xl bg-[#0B1220] border border-[rgba(0,200,255,0.08)] hover:border-[rgba(0,200,255,0.2)] transition-all duration-500 hover:-translate-y-2 ${
                  activeFeature === index ? "border-[rgba(0,200,255,0.3)] shadow-lg shadow-[rgba(0,200,255,0.1)]" : ""
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
                  feature.color === "green" ? "bg-[rgba(124,255,0,0.1)] group-hover:bg-[rgba(124,255,0,0.2)]" :
                  feature.color === "blue" ? "bg-[rgba(0,200,255,0.1)] group-hover:bg-[rgba(0,200,255,0.2)]" :
                  feature.color === "purple" ? "bg-[rgba(167,139,250,0.1)] group-hover:bg-[rgba(167,139,250,0.2)]" :
                  "bg-[rgba(251,191,36,0.1)] group-hover:bg-[rgba(251,191,36,0.2)]"
                }`}>
                  <feature.icon className={`h-7 w-7 ${
                    feature.color === "green" ? "text-[#A7FF00]" :
                    feature.color === "blue" ? "text-[#00C8FF]" :
                    feature.color === "purple" ? "text-[#A78BFA]" :
                    "text-[#FBBF24]"
                  }`} />
                </div>
                <h3 className="font-heading font-bold text-xl mb-2 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(167,255,0,0.02)] to-transparent" />
        <div className="container-premium relative">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(167,255,0,0.08)] border border-[rgba(167,255,0,0.15)] text-[#A7FF00] text-sm font-heading font-semibold mb-6">
              <PlayCircle className="h-4 w-4" />
              {t("home.howItWorks.badge") || "Jednoduché"}
            </span>
            <h2 className="heading-lg mb-4">{t("home.howItWorks.heading") || "Jak to funguje?"}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t("home.howItWorks.desc") || "Stačí 3 kroky a můžeš začít obchodovat"}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                icon: Upload,
                title: t("home.howItWorks.step1Title") || "Vytvoř aukci",
                desc: t("home.howItWorks.step1Desc") || "Nahraj fotku karty, nastav cenu a délku aukce. AI ti pomůže s vyplněním.",
                color: "from-[#00C8FF] to-[#009DFF]",
              },
              {
                step: "2",
                icon: Gavel,
                title: t("home.howItWorks.step2Title") || "Přihazuj nebo prodávej",
                desc: t("home.howItWorks.step2Desc") || "Sleduj příhozy v reálném čase. Anti-sniping ochrání každou aukci.",
                color: "from-[#A7FF00] to-[#5CFF00]",
              },
              {
                step: "3",
                icon: Package,
                title: t("home.howItWorks.step3Title") || "Bezpečná platba",
                desc: t("home.howItWorks.step3Desc") || "Platba přes Stripe. Ochrana kupujícího i prodejce.",
                color: "from-purple-500 to-pink-500",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                {/* Step number */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#050A12] border-2 border-[#00C8FF] flex items-center justify-center text-sm font-bold font-heading text-[#00C8FF]">
                  {item.step}
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 text-white">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link to="/register" className="inline-flex items-center gap-2 text-[#00C8FF] hover:text-[#33B1FF] font-heading font-semibold transition-colors">
              {t("home.howItWorks.cta") || "Začni zdarma →"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

        {/* Categories Section */}
      <section className="py-20">
        <div className="container-premium">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="heading-md">{t("home.categories.heading")}</h2>
              <p className="text-gray-400 mt-2">{t("home.categories.subtitle")}</p>
            </div>
            <Link 
              to="/auctions" 
              className="hidden sm:flex items-center gap-2 text-[#00C8FF] hover:text-[#33B1FF] font-heading font-semibold transition-colors"
            >
              {t("home.categories.all")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(categoryIcons).map(([name, cfg]) => (
              <Link
                key={name}
                to={`/auctions?category=${encodeURIComponent(name)}`}
                className="group relative p-6 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cfg.color} opacity-50 group-hover:opacity-70 transition-opacity`} />
                <div className="absolute inset-0 bg-[#0B1220]/80" />
                <div className="relative">
                  <span className="text-4xl mb-4 block">{cfg.icon}</span>
                  <h3 className="font-heading font-bold text-lg mb-1">{name}</h3>
                  <p className="text-sm text-gray-400">{stats?.auctionCount ? `${Math.max(1, Math.floor(stats.auctionCount / 4))} aukcí` : "0 aukcí"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Auctions */}
      {featured.length > 0 && (
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(124,255,0,0.02)] via-transparent to-transparent" />
          
          <div className="container-premium relative">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A7FF00] to-[#5CFF00] flex items-center justify-center shadow-lg shadow-[rgba(124,255,0,0.3)]">
                    <Sparkles className="h-5 w-5 text-[#050A12]" />
                  </div>
                  <h2 className="heading-md">{t("home.featured")}</h2>
                </div>
                <p className="text-gray-400">{t("home.featured.subtitle")}</p>
              </div>
              <Link 
                to="/auctions?featured=true" 
                className="btn-secondary"
              >
                {t("home.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((auction, index) => (
                <AuctionCard key={auction.id} auction={auction} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Section */}
      {trending.length > 0 && (
        <section className="py-20">
          <div className="container-premium">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C8FF] to-[#009DFF] flex items-center justify-center shadow-lg shadow-[rgba(0,200,255,0.3)]">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="heading-md">{t("home.trending")}</h2>
                  <span className="px-3 py-1 rounded-full bg-[rgba(0,200,255,0.1)] border border-[rgba(0,200,255,0.2)] text-[#00C8FF] text-sm font-heading">
                    {t("home.trending.weekly")}
                  </span>
                </div>
                <p className="text-gray-400">{t("home.trending.subtitle")}</p>
              </div>
              <Link 
                to="/auctions?sort=trending" 
                className="btn-secondary"
              >
                {t("home.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trending.map((auction, index) => (
                <div key={auction.id} className="relative">
                  {index < 3 && (
                    <div className={`absolute -top-3 -left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-heading shadow-lg ${
                      index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white" :
                      index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white" :
                      "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                    }`}>
                      #{index + 1}
                    </div>
                  )}
                  <AuctionCard auction={auction} index={index} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Last Sold Section */}
      {lastSold.length > 0 && (
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,200,255,0.02)] to-transparent" />
          
          <div className="container-premium relative">
            <div className="mb-10">
              <h2 className="heading-md mb-2">{t("home.lastSold")}</h2>
              <p className="text-gray-400">{t("home.lastSold.subtitle")}</p>
            </div>

            <div className="card p-0 overflow-hidden">
              {lastSold.map((transaction, index) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between px-6 py-5 hover:bg-[rgba(0,200,255,0.03)] transition-colors border-b border-[rgba(0,200,255,0.06)] last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgba(0,200,255,0.15)] to-[rgba(0,200,255,0.05)] flex items-center justify-center text-[#00C8FF] font-heading font-bold text-lg border border-[rgba(0,200,255,0.1)]">
                      {transaction.auction.card?.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium font-heading text-white">{transaction.auction.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{t("home.lastSold.buyer")}: {transaction.buyer.username}</span>
                        <span>•</span>
                        <span>{new Date(transaction.createdAt).toLocaleDateString("cs-CZ")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-heading text-[#A7FF00] drop-shadow-[0_0_8px_rgba(167,255,0,0.3)]">
                      {transaction.amount.toLocaleString("cs-CZ")} Kč
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-[#A7FF00]/70">
                      <CheckCircle className="h-3 w-3" />
                      {t("home.lastSold.sold")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24">
        <div className="container-premium">
          <div className="relative p-12 lg:p-16 rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00C8FF]/10 via-[#0B1220] to-[#A7FF00]/10" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2300C8FF%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
            
            <div className="relative text-center max-w-3xl mx-auto">
              <h2 className="heading-lg mb-6">
                {t("home.cta.heading")}
              </h2>
              <p className="text-gray-400 text-lg mb-10">
                {t("home.cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/register" 
                  className="px-10 py-4 rounded-2xl bg-gradient-to-r from-[#A7FF00] to-[#5CFF00] text-[#050A12] font-bold font-heading text-lg shadow-xl shadow-[rgba(124,255,0,0.4)] hover:shadow-[rgba(124,255,0,0.6)] hover:-translate-y-1 transition-all duration-300"
                >
                  {t("home.cta.create")}
                </Link>
                <Link 
                  to="/auctions" 
                  className="px-10 py-4 rounded-2xl border border-[rgba(0,200,255,0.3)] text-[#00C8FF] font-bold font-heading text-lg hover:bg-[rgba(0,200,255,0.1)] transition-all duration-300"
                >
                  {t("home.cta.browse")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
