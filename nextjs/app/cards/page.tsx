"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Search, Filter, Grid3X3 } from "lucide-react";
import api from "@/lib/api";

interface CardSet {
  id: string; name: string; slug: string; category: string;
  brand: string | null; year: string | null; imageUrl: string | null;
  cardCount: number; totalCards: number | null;
}

const CATEGORIES = ["pokemon", "sports"] as const;
const CATEGORY_NAMES: Record<string, string> = {
  pokemon: "Pokémon", sports: "Sportovní",
};

export default function CardDatabasePage() {
  const [sets, setSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    setError(null);
    api.get("/card-sets").then((r) => setSets(r.data)).catch((err: any) => {
      setError(err.response?.data?.error || "Nepodařilo se načíst edice karet");
    }).finally(() => setLoading(false));
  }, []);

  const filtered = sets.filter((s) => {
    if (category && s.category !== category) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Database className="h-8 w-8 text-[#00C8FF]" />
        <h1 className="text-3xl font-bold font-heading">Databáze karet</h1>
      </div>

      {error && <div className="text-red-400 text-sm py-4 text-center mb-4">{error}</div>}

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input className="input pl-10" placeholder="Hledat edici..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(category === cat ? "" : cat)}
            className={`btn text-sm font-heading ${category === cat ? "btn-primary" : "btn-ghost"}`}>
            <Filter className="h-4 w-4" /> {CATEGORY_NAMES[cat]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-5 animate-pulse">
              <div className="h-8 bg-[rgba(0,200,255,0.05)] rounded w-3/4 mb-3" />
              <div className="h-4 bg-[rgba(0,200,255,0.05)] rounded w-1/2 mb-2" />
              <div className="h-4 bg-[rgba(0,200,255,0.05)] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Database className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-heading font-bold text-gray-400">Žádné edice nenalezeny</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((set) => (
            <Link key={set.id} href={`/cards/sets/${set.slug}`}
              className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-5 hover:border-[rgba(0,200,255,0.3)] transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-lg group-hover:text-[#00C8FF] transition-colors">{set.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{set.brand || ""} {set.year ? `• ${set.year}` : ""}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  set.category === "pokemon" ? "bg-red-900/30 text-red-400" : "bg-[rgba(0,200,255,0.12)] text-[#00C8FF]"
                }`}>
                  {CATEGORY_NAMES[set.category] || set.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span><Grid3X3 className="h-3 w-3 inline mr-1" />{set.cardCount} / {set.totalCards || "?"} karet</span>
                <span className="text-[#00C8FF] text-xs font-heading font-semibold group-hover:underline">
                  Zobrazit karty →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
