import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Zap, Clock, Shield, Sparkles, ArrowRight, Gavel, Award, Users, CheckCircle } from "lucide-react";
import type { Auction } from "@/types";

async function fetchHomeData() {
  const base = process.env.EXPRESS_URL || "http://localhost:3001";
  const headers = { "Content-Type": "application/json" };

  try {
    const [featuredRes, statsRes] = await Promise.allSettled([
      fetch(`${base}/api/auctions/featured`, { headers, next: { revalidate: 60 } }),
      fetch(`${base}/api/admin/stats`, { headers, next: { revalidate: 300 } }),
    ]);

    const featured = featuredRes.status === "fulfilled" && featuredRes.value.ok
      ? await featuredRes.value.json() : [];
    const stats = statsRes.status === "fulfilled" && statsRes.value.ok
      ? await statsRes.value.json() : {};

    return { featured: featured as Auction[], stats };
  } catch {
    return { featured: [], stats: {} };
  }
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M+";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
  return String(n);
}

const categories = [
  { name: "Pokémon", icon: "🔥", color: "from-yellow-500/20 to-red-500/20", border: "border-yellow-500/20" },
  { name: "Magic: The Gathering", icon: "✨", color: "from-blue-500/20 to-purple-500/20", border: "border-blue-500/20" },
  { name: "Yu-Gi-Oh!", icon: "⚡", color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/20" },
  { name: "Sportovní Karty", icon: "🏆", color: "from-green-500/20 to-emerald-500/20", border: "border-green-500/20" },
  { name: "One Piece", icon: "⚓", color: "from-orange-500/20 to-red-500/20", border: "border-orange-500/20" },
  { name: "Dragon Ball", icon: "🌟", color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/20" },
];

const features = [
  { icon: Zap, title: "AI Scanner", desc: "Identifikuj karty okamžitě pomocí Claude AI — žádné ruční zadávání", color: "text-[#A7FF00]", bg: "bg-[rgba(124,255,0,0.1)]" },
  { icon: Clock, title: "Živé aukce", desc: "Real-time příhozy, okamžité notifikace, anti-sniping ochrana", color: "text-[#00C8FF]", bg: "bg-[rgba(0,200,255,0.1)]" },
  { icon: Shield, title: "Bezpečný obchod", desc: "Ověřeni prodejci, Stripe platby, ochrana kupujících", color: "text-purple-400", bg: "bg-purple-500/10" },
  { icon: TrendingUp, title: "Cenová databáze", desc: "Historické ceny, trendy, odhad hodnoty vaší sbírky", color: "text-amber-400", bg: "bg-amber-500/10" },
];

export default async function HomePage() {
  const { featured, stats } = await fetchHomeData();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[rgba(0,200,255,0.06)] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[rgba(124,255,0,0.04)] rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[rgba(255,0,68,0.02)] rounded-full blur-3xl" />
        </div>

        <div className="container-premium text-center">
          <div className="badge-blue inline-flex items-center gap-2 mb-6">
            <Sparkles className="h-4 w-4" />
            Největší CZ/SK Card Marketplace
          </div>

          <h1 className="heading-xl mb-4">
            <span className="text-white">Dražte. </span>
            <span className="text-[#A7FF00]" style={{ textShadow: "0 0 30px rgba(124,255,0,0.2)" }}>Prodávejte. </span>
            <span className="text-[#00C8FF]" style={{ textShadow: "0 0 30px rgba(0,200,255,0.2)" }}>Sbírejte.</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Moderní tržiště pro sběratele. Skenuj karty s AI, draž v reálném čase a buduj svou sbírku.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <Link href="/auctions" className="btn-primary text-base px-8 py-3">
              <Gavel className="h-5 w-5" />
              Procházet aukce
            </Link>
            <Link href="/scan" className="btn-secondary text-base px-8 py-3">
              <Zap className="h-5 w-5" />
              AI Scanner
            </Link>
          </div>

          {/* Trust stats */}
          {stats && (
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              {[
                { icon: CheckCircle, label: "Zdarma registrace" },
                { icon: Shield, label: "Bezpečné platby" },
                { icon: Award, label: "Ověření prodejci" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#A7FF00]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats bar */}
      {stats.userCount !== undefined && (
        <section className="border-y border-[rgba(0,200,255,0.08)] bg-[rgba(0,200,255,0.03)] py-6">
          <div className="container-premium">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { label: "Aktivních uživatelů", value: formatCount(stats.userCount || 0) },
                { label: "Aktivních aukcí", value: formatCount(stats.auctionCount || 0) },
                { label: "Prodaných karet", value: formatCount(stats.completedAuctions || 0) },
                { label: "Celkový obrat", value: `${formatCount(stats.totalSales || 0)} Kč` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-2xl font-heading font-bold text-[#00C8FF]">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Auctions */}
      {featured.length > 0 && (
        <section className="py-14">
          <div className="container-premium">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="heading-lg text-white">Doporučené aukce</h2>
                <p className="text-gray-500 text-sm mt-1">Nejžhavější aukce, které právě běží</p>
              </div>
              <Link href="/auctions" className="btn-ghost text-sm flex items-center gap-1">
                Zobrazit vše <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {featured.slice(0, 8).map((auction) => (
                <AuctionCardSimple key={auction.id} auction={auction} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-14 border-t border-[rgba(0,200,255,0.06)]">
        <div className="container-premium">
          <div className="text-center mb-10">
            <div className="badge-green inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4" />
              Proč CardPortal.eu?
            </div>
            <h2 className="heading-lg text-white mb-2">Vše co potřebujete pro <span className="text-gradient">sběratelské karty</span></h2>
            <p className="text-gray-500 max-w-xl mx-auto">Moderní platforma s AI technologií pro správné ocenění, živé aukce a maximální bezpečnost.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="card hover:scale-[1.02] transition-transform">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-heading font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 border-t border-[rgba(0,200,255,0.06)]">
        <div className="container-premium">
          <div className="text-center mb-8">
            <h2 className="heading-lg text-white mb-2">Prohlédněte si kategorie</h2>
            <p className="text-gray-500">Najděte svou oblíbenou sběratelskou sérii</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/auctions?category=${encodeURIComponent(cat.name)}`}
                className={`card p-4 text-center hover:scale-[1.03] transition-transform bg-gradient-to-br ${cat.color} border ${cat.border}`}
              >
                <span className="text-3xl block mb-2">{cat.icon}</span>
                <p className="text-xs font-heading font-semibold text-white leading-tight">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-[rgba(0,200,255,0.06)]">
        <div className="container-premium text-center">
          <div className="max-w-2xl mx-auto card-premium p-10 rounded-2xl">
            <h2 className="heading-lg text-white mb-3">Připraveni začít sbírat?</h2>
            <p className="text-gray-400 mb-6">
              Připojte se k tisícům sběratelů a objevte vzácné karty za skvělé ceny. Registrace je zdarma.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register" className="btn-primary px-8 py-3 text-base">
                <Users className="h-5 w-5" />
                Vytvořit účet zdarma
              </Link>
              <Link href="/auctions" className="btn-secondary px-8 py-3 text-base">
                Prohlédnout aukce
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuctionCardSimple({ auction }: { auction: Auction }) {
  const endDate = new Date(auction.endTime);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const ended = diff <= 0;

  return (
    <Link href={`/auctions/${auction.id}`} className="card group block hover:border-[rgba(0,200,255,0.2)] hover:shadow-card-hover transition-all">
      <div className="aspect-square rounded-lg overflow-hidden bg-[rgba(0,200,255,0.04)] mb-3 relative">
        {auction.imageUrl ? (
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🃏</div>
        )}
      </div>
      <h3 className="font-heading font-semibold text-sm text-white truncate mb-1">{auction.title}</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Aktuální cena</p>
          <p className="font-heading font-bold text-[#A7FF00]">
            {auction.currentPrice.toLocaleString("cs-CZ")} Kč
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Zbývá</p>
          <p className={`text-xs font-mono ${ended ? "text-[#FF3366]" : hours < 6 ? "text-orange-400" : "text-gray-300"}`}>
            {ended ? "Skončila" : `${hours}h ${mins}m`}
          </p>
        </div>
      </div>
    </Link>
  );
}
