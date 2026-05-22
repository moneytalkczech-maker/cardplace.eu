"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, SortAsc, Loader2, Gavel } from "lucide-react";
import { auctions } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { useCountdown } from "@/hooks/useCountdown";
import { useTranslation } from "@/hooks/useTranslation";
import type { Auction } from "@/types";

const sortOptions = [
  { value: "endingSoon", label: "Končí brzy" },
  { value: "newest", label: "Nejnovější" },
  { value: "priceAsc", label: "Nejlevnější" },
  { value: "priceDesc", label: "Nejdražší" },
  { value: "popular", label: "Nejoblíbenější" },
];

const statusOptions = [
  { value: "", label: "Všechny" },
  { value: "active", label: "Aktivní" },
  { value: "ended", label: "Ukončené" },
];

const categories = [
  "Pokémon", "Magic: The Gathering", "Yu-Gi-Oh!", "Sportovní Karty",
  "One Piece", "Dragon Ball", "Naruto", "Disney Lorcana",
];

function AuctionCard({ auction }: { auction: Auction }) {
  const countdown = useCountdown(auction.endTime);

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="card group block hover:border-[rgba(0,200,255,0.2)] hover:shadow-card-hover transition-all animate-fade-in"
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-[rgba(0,200,255,0.04)] mb-3 relative">
        {auction.imageUrl ? (
          <Image
            src={auction.imageUrl}
            alt={auction.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🃏</div>
        )}
        {auction.featured && (
          <span className="absolute top-2 left-2 badge-green text-[10px] px-2 py-0.5">⭐ Featured</span>
        )}
        {auction.status === "ended" && (
          <div className="absolute inset-0 bg-[#050A12]/60 flex items-center justify-center">
            <span className="text-sm font-heading font-bold text-gray-400">Ukončena</span>
          </div>
        )}
      </div>

      <h3 className="font-heading font-semibold text-sm text-white truncate mb-2">{auction.title}</h3>

      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500">Aktuální cena</p>
          <p className="font-heading font-bold text-[#A7FF00]">
            {auction.currentPrice.toLocaleString("cs-CZ")} Kč
          </p>
        </div>
        <div className="text-right">
          {!countdown.isEnded ? (
            <>
              <p className="text-xs text-gray-500">Zbývá</p>
              <p className={`text-xs font-mono font-bold ${countdown.isEndingToday ? "text-[#FF3366] animate-countdown-pulse" : countdown.isEndingSoon ? "text-orange-400" : "text-gray-300"}`}>
                {countdown.hours > 0 ? `${countdown.hours}h ` : ""}{countdown.minutes}m {countdown.seconds}s
              </p>
            </>
          ) : (
            <span className="badge-red text-xs">Skončila</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>@{auction.user?.username}</span>
        <span>{auction._count?.bids ?? auction.bidCount ?? 0} příhozů</span>
      </div>
    </Link>
  );
}

export default function AuctionsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("endingSoon");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchAuctions = useCallback(async (reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = {
        search: search || undefined,
        sort: sort || undefined,
        status: status || undefined,
        category: category || undefined,
        cursor: reset ? undefined : cursor || undefined,
      };
      const data = await auctions.getAll(params as Record<string, string>);
      if (reset) {
        setItems(data.data || []);
      } else {
        setItems((prev) => [...prev, ...(data.data || [])]);
      }
      setCursor(data.nextCursor);
    } catch (err: any) {
      if (reset) toast("error", err.response?.data?.error || "Nepodařilo se načíst aukce");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, sort, status, category, cursor]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAuctions(true), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, sort, status, category]);

  return (
    <div className="container-premium py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="heading-lg text-white">Aukce</h1>
          <p className="text-gray-500 text-sm mt-1">Sběratelské karty z celého světa</p>
        </div>
        <Link href="/auctions/create" className="btn-primary hidden md:flex">
          <Gavel className="h-4 w-4" />
          Vytvořit aukci
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Hledat karty..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary p-2.5 flex-shrink-0 ${showFilters ? "bg-[rgba(0,200,255,0.1)]" : ""}`}
        >
          <Filter className="h-5 w-5" />
        </button>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="card mb-4 flex flex-wrap gap-3 animate-slide-down">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select className="input text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-gray-500 mb-1 block">Kategorie</label>
            <select className="input text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Všechny kategorie</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton aspect-square rounded-lg mb-3" />
              <div className="skeleton h-4 rounded mb-2 w-3/4" />
              <div className="skeleton h-3 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🃏</p>
          <p className="text-gray-400 font-heading text-lg">Žádné aukce nenalezeny</p>
          <p className="text-gray-600 text-sm mt-1">Zkuste jiný vyhledávací dotaz nebo filtr</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
          {cursor && (
            <div className="text-center mt-8">
              <button
                onClick={() => fetchAuctions(false)}
                disabled={loadingMore}
                className="btn-secondary px-8"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Načíst další"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
