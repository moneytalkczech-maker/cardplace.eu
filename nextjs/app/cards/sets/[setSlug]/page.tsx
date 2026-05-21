"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Grid3X3, Search, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface CardItem {
  id: string; name: string; slug: string; cardNumber: string | null;
  playerName: string | null; team: string | null; rarity: string | null;
  parallel: string | null; imageUrl: string | null; type: string | null;
  priceCardmarketAvg: number | null; priceEbayAvg: number | null;
}

interface CardSet {
  id: string; name: string; slug: string; category: string;
  brand: string | null; year: string | null; description: string | null;
  imageUrl: string | null; totalCards: number | null;
  cards: CardItem[];
}

const RARITY_COLORS: Record<string, string> = {
  "⭐⭐⭐⭐": "text-yellow-400",
  "⭐⭐⭐": "text-purple-400",
  "⭐⭐": "text-[#00C8FF]",
  "⭐": "text-green-400",
};

export default function CardSetDetailPage() {
  const { setSlug } = useParams<{ setSlug: string }>();
  const [set, setSet] = useState<CardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState<string>("");

  useEffect(() => {
    if (!setSlug) return;
    api.get("/card-sets").then((r) => {
      const found = r.data.find((s: any) => s.slug === setSlug);
      if (found) {
        api.get(`/card-sets/${found.id}`).then((r2) => setSet(r2.data)).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, [setSlug]);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-8"><div className="animate-pulse h-96 bg-[#0B1220] rounded-xl" /></div>;
  if (!set) return <div className="mx-auto max-w-6xl px-4 py-8"><p className="text-gray-500">Edice nenalezena</p></div>;

  const filtered = set.cards.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !(c.playerName || "").toLowerCase().includes(q) && !(c.cardNumber || "").toLowerCase().includes(q)) return false;
    }
    if (rarityFilter && c.rarity !== rarityFilter) return false;
    return true;
  });

  const rarities = Array.from(new Set(set.cards.map((c) => c.rarity).filter((r): r is string => !!r)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/cards" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 font-heading">
        <ArrowLeft className="h-4 w-4" /> Zpět na databázi
      </Link>

      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6 mb-8">
        <h1 className="text-3xl font-bold font-heading mb-2">{set.name}</h1>
        {set.brand && <p className="text-sm text-gray-500 mb-1">{set.brand} {set.year ? `• ${set.year}` : ""}</p>}
        {set.description && <p className="text-sm text-gray-400 mt-3">{set.description}</p>}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span><Grid3X3 className="h-4 w-4 inline mr-1" /> {filtered.length} / {set.cards.length} karet</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input className="input pl-10" placeholder="Hledat v edici..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {rarities.map((r) => (
          <button key={r} onClick={() => setRarityFilter(rarityFilter === r ? "" : r)}
            className={`btn text-xs font-heading ${rarityFilter === r ? "btn-primary" : "btn-ghost"}`}>
            {r}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-500">Žádné karty neodpovídají vyhledávání</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((card) => (
            <Link key={card.id} href={`/cards/card/${card.id}`}
              className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4 hover:border-[rgba(0,200,255,0.25)] transition-all group">
              <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-[rgba(0,200,255,0.05)] to-[rgba(0,200,255,0.02)] mb-3 flex items-center justify-center overflow-hidden relative">
                {card.imageUrl ? (
                  <Image src={card.imageUrl} alt={card.name} fill className="object-contain" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                ) : (
                  <span className="text-4xl opacity-20">
                    {set.category === "pokemon" ? "🃏" : "⚽"}
                  </span>
                )}
              </div>
              <h3 className="font-heading font-bold text-sm group-hover:text-[#00C8FF] transition-colors">{card.name}</h3>
              {card.playerName && <p className="text-xs text-gray-500">{card.playerName}</p>}
              <div className="flex items-center justify-between mt-2">
                {card.rarity && <span className={`text-xs font-bold ${RARITY_COLORS[card.rarity] || "text-gray-500"}`}>{card.rarity}</span>}
                {card.cardNumber && <span className="text-xs text-gray-600">{card.cardNumber}</span>}
              </div>
              {card.priceCardmarketAvg && (
                <p className="text-xs text-[#A7FF00] font-bold mt-2">
                  ~{card.priceCardmarketAvg.toLocaleString("cs-CZ")} Kč
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
