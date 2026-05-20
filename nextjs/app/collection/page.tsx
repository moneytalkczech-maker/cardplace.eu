"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Minus, Plus as PlusIcon, BookOpen, ChevronDown, Search, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { searchCards, type MarketCard } from "@/lib/CardsDB";
import api from "@/lib/api";
import { toast } from "@/components/ui/Toast";

const ITEMS_PER_PAGE = 24;

interface CollectionCard {
  id: string;
  cardId: string;
  cardName: string;
  cardSet: string;
  cardRarity?: string;
  cardImage?: string;
  quantity: number;
  purchasePrice?: number;
  condition: string;
}

export default function CollectionPage() {
  const { user: me, token } = useAuthStore();
  const [items, setItems] = useState<CollectionCard[]>([]);
  const [stats, setStats] = useState({ totalValue: 0, totalCards: 0, uniqueCards: 0 });
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const [showAdd, setShowAdd] = useState(false);
  const [cardSearch, setCardSearch] = useState("");
  const [cardResults, setCardResults] = useState<MarketCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketCard | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState("");

  const userId = me?.id;

  const loadCollection = () => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      api.get(`/collection/${userId}`).then((r) => setItems(r.data)),
      api.get(`/collection/${userId}/value`).then((r) => setStats(r.data)),
    ]).catch(() => toast("error", "Nepodařilo se načíst sbírku")).finally(() => setLoading(false));
  };

  useEffect(() => { loadCollection(); }, [userId]);

  useEffect(() => {
    if (cardSearch.length < 2) { setCardResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await searchCards(cardSearch);
      if (!cancelled) setCardResults(results);
    }, 150);
    return () => { clearTimeout(timer); cancelled = true; };
  }, [cardSearch]);

  const handleAdd = async () => {
    if (!selectedCard || !token) return;
    try {
      await api.post("/collection", {
        cardId: selectedCard.id,
        cardName: selectedCard.name,
        cardSet: selectedCard.setName,
        cardRarity: selectedCard.rarity,
        cardImage: selectedCard.imageUrl,
        quantity,
        purchasePrice: purchasePrice || undefined,
      });
      loadCollection();
      setShowAdd(false);
      setSelectedCard(null);
      setCardSearch("");
      setQuantity(1);
      setPurchasePrice("");
      toast("success", "Karta přidána do sbírky");
    } catch { toast("error", "Nepodařilo se přidat kartu"); }
  };

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    try {
      if (newQty <= 0) {
        await api.delete(`/collection/${itemId}`);
      } else {
        await api.patch(`/collection/${itemId}`, { quantity: newQty });
      }
      loadCollection();
    } catch { toast("error", "Nepodařilo se uložit změnu"); }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await api.delete(`/collection/${itemId}`);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch { toast("error", "Nepodařilo se odstranit kartu"); }
  };

  if (!me) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-600" />
        <p className="text-lg font-heading font-bold text-gray-400">Pro přístup ke sbírce se musíš přihlásit</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex font-heading">Přihlásit se</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#0B1220] rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-[#0B1220] rounded" />)}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 bg-[#0B1220] rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-[#00C8FF]" />
            Moje sbírka
          </h1>
          <p className="text-gray-500 mt-1">Správa a přehled tvojí kolekce karet</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary font-heading"
        >
          <Plus className="h-4 w-4" /> Přidat kartu
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center py-4">
          <p className="text-3xl font-bold font-heading text-[#A7FF00]">{stats.uniqueCards}</p>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mt-1">Unikátní karty</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold font-heading text-[#00C8FF]">{stats.totalCards}</p>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mt-1">Celkem kusů</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold font-heading text-[#A7FF00]">{stats.totalValue.toLocaleString("cs-CZ")} Kč</p>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mt-1">Odhadovaná hodnota</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Přidat kartu do sbírky</h2>
            <button onClick={() => setShowAdd(false)} className="btn-ghost p-1"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-heading font-semibold mb-1.5">Karta</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  className="input pl-10"
                  placeholder="Název karty…"
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                />
              </div>
              {cardResults.length > 0 && (
                <div className="mt-1 rounded-xl border border-[rgba(0,200,255,0.15)] bg-[#0B1220] max-h-40 overflow-y-auto shadow-xl">
                  {cardResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedCard(c); setCardSearch(c.name); setCardResults([]); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[rgba(0,200,255,0.06)] border-b border-[rgba(0,200,255,0.06)] last:border-0 transition-colors"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-gray-500 ml-2">{c.setName}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedCard && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)] text-sm flex items-center justify-between">
                  <span>{selectedCard.name} <span className="text-gray-500">({selectedCard.setName})</span></span>
                  <button onClick={() => { setSelectedCard(null); setCardSearch(""); }} className="text-gray-500 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-heading font-semibold mb-1.5">Počet kusů</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="block text-sm font-heading font-semibold mb-1.5">Nákupní cena (Kč)</label>
                <input
                  type="number"
                  className="input"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="Volitelné"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!selectedCard}
              className="btn-primary font-heading disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> Přidat do sbírky
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-heading font-bold text-gray-400">Sbírka je zatím prázdná</p>
          <p className="text-sm text-gray-600 mt-1">Přidej svou první kartu pomocí tlačítka výše</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.slice(0, visibleCount).map((item) => (
              <div key={item.id} className="card hover:border-[rgba(0,200,255,0.3)] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    {item.cardImage && (
                      <img src={item.cardImage} alt={item.cardName} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-sm truncate">{item.cardName}</h3>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{item.cardSet}</p>
                      {item.cardRarity && (
                        <span className="badge-blue mt-1.5 inline-block text-[10px]">{item.cardRarity}</span>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                        <span className="badge-green">{item.condition}</span>
                        {item.purchasePrice && <span>{item.purchasePrice} Kč/ks</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      className="btn-ghost p-1.5 rounded-lg"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-heading font-bold text-base text-[#00C8FF] min-w-[28px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      className="btn-ghost p-1.5 rounded-lg"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[rgba(0,200,255,0.06)] flex items-center justify-between">
                  <Link
                    href={`/auctions/create?name=${encodeURIComponent(item.cardName)}`}
                    className="text-xs text-[#00C8FF] hover:underline font-heading"
                  >
                    Vydražit kartu →
                  </Link>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="btn-ghost p-1.5 text-red-400 hover:text-red-300 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {visibleCount < items.length && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount((v) => v + ITEMS_PER_PAGE)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[rgba(0,200,255,0.2)] text-[#00C8FF] font-heading font-bold hover:bg-[rgba(0,200,255,0.08)] transition-all"
              >
                <ChevronDown className="h-4 w-4" />
                Načíst více ({items.length - visibleCount} zbývá)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
