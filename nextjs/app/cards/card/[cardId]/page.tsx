"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import api from "@/lib/api";

interface CardDetail {
  id: string; name: string; slug: string; cardNumber: string | null;
  playerName: string | null; team: string | null; rarity: string | null;
  parallel: string | null; type: string | null; imageUrl: string | null;
  description: string | null;
  priceCardmarketLow: number | null; priceCardmarketAvg: number | null; priceCardmarketTrend: number | null;
  priceEbayAvg: number | null; priceEbayMedian: number | null; priceEbayLastSold: number | null;
  currency: string | null; pricesUpdatedAt: string | null;
  set: { id: string; name: string; slug: string; category: string; brand: string | null; year: string | null };
  priceSnapshots: any[];
}

export default function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cardId) return;
    api.get(`/database-cards/${cardId}`).then((r) => setCard(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [cardId]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><div className="animate-pulse h-96 bg-[#0B1220] rounded-xl" /></div>;
  if (!card) return <div className="mx-auto max-w-4xl px-4 py-8"><p className="text-gray-500">Karta nenalezena</p></div>;

  const hasPrices = card.priceCardmarketAvg || card.priceEbayAvg;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/cards/sets/${card.set.slug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 font-heading">
        <ArrowLeft className="h-4 w-4" /> Zpět na {card.set.name}
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-[rgba(0,200,255,0.08)] to-[rgba(0,200,255,0.02)] border border-[rgba(0,200,255,0.1)] flex items-center justify-center overflow-hidden">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} loading="lazy" className="w-full h-full object-contain" />
          ) : (
            <span className="text-8xl opacity-10">{card.set.category === "pokemon" ? "🃏" : "⚽"}</span>
          )}
        </div>

        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold font-heading mb-1">{card.name}</h1>
            <p className="text-sm text-gray-500">{card.set.name} • {card.cardNumber || ""}</p>
          </div>

          <div className="space-y-0 text-sm divide-y divide-[rgba(0,200,255,0.06)]">
            {card.playerName && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Hráč/Postava</span>
                <span className="font-medium">{card.playerName}</span>
              </div>
            )}
            {card.team && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Tým/Frakce</span>
                <span className="font-medium">{card.team}</span>
              </div>
            )}
            {card.rarity && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Rarita</span>
                <span className="font-medium">{card.rarity}</span>
              </div>
            )}
            {card.parallel && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Paralelní verze</span>
                <span className="font-medium">{card.parallel}</span>
              </div>
            )}
            {card.type && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Typ</span>
                <span className="font-medium">{card.type}</span>
              </div>
            )}
            {card.description && (
              <div className="py-2">
                <p className="text-gray-500 mb-1">Popis</p>
                <p className="text-gray-300">{card.description}</p>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-[rgba(167,255,0,0.15)] bg-[rgba(167,255,0,0.04)] p-5">
            <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#A7FF00]" /> Orientační cena
            </h2>

            {!hasPrices ? (
              <p className="text-sm text-gray-500">Zatím nejsou k dispozici žádná cenová data.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-[rgba(0,0,0,0.2)] p-4">
                  <h3 className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider mb-3">Cardmarket</h3>
                  <div className="space-y-2 text-sm">
                    {card.priceCardmarketLow !== null && (
                      <div className="flex justify-between"><span className="text-gray-500">Nejnižší</span><span className="font-bold">{card.priceCardmarketLow.toLocaleString("cs-CZ")} Kč</span></div>
                    )}
                    {card.priceCardmarketAvg !== null && (
                      <div className="flex justify-between"><span className="text-gray-500">Průměrná</span><span className="font-bold text-[#A7FF00]">{card.priceCardmarketAvg.toLocaleString("cs-CZ")} Kč</span></div>
                    )}
                    {card.priceCardmarketTrend !== null && (
                      <div className="flex justify-between"><span className="text-gray-500">Trend</span><span>{card.priceCardmarketTrend.toLocaleString("cs-CZ")} Kč</span></div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-[rgba(0,0,0,0.2)] p-4">
                  <h3 className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider mb-3">eBay</h3>
                  <div className="space-y-2 text-sm">
                    {card.priceEbayAvg !== null && (
                      <div className="flex justify-between"><span className="text-gray-500">Průměr</span><span className="font-bold text-[#A7FF00]">{card.priceEbayAvg.toLocaleString("cs-CZ")} Kč</span></div>
                    )}
                    {card.priceEbayMedian !== null && (
                      <div className="flex justify-between"><span className="text-gray-500">Medián</span><span>{card.priceEbayMedian.toLocaleString("cs-CZ")} Kč</span></div>
                    )}
                    {card.priceEbayLastSold !== null && (
                      <div className="flex justify-between"><span className="text-gray-500">Poslední prodej</span><span>{card.priceEbayLastSold.toLocaleString("cs-CZ")} Kč</span></div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {card.pricesUpdatedAt && (
              <div className="flex items-center gap-1 mt-4 text-xs text-gray-600">
                <Clock className="h-3 w-3" /> Poslední aktualizace: {new Date(card.pricesUpdatedAt).toLocaleDateString("cs-CZ")}
              </div>
            )}
            <div className="flex items-start gap-2 mt-3 text-xs text-gray-600">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Ceny jsou orientační a mohou se lišit podle stavu karty, gradingu, edice, rarity, dopravy a aktuální poptávky.</span>
            </div>
          </div>

          <div className="mt-6">
            <Link href={`/cards/sets/${card.set.slug}`}
              className="btn-ghost text-sm font-heading w-full justify-center inline-flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> Zobrazit všechny karty v {card.set.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
