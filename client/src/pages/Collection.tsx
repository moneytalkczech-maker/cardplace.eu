import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, Trash2, Minus, Plus as PlusIcon, BookOpen, Loader2, ChevronDown } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { searchCards, type MarketCard } from "../lib/CardsDB";
import api from "../services/api";
import { toast } from "../components/Toast";
import { useTranslation } from "../hooks/useTranslation";

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

function useCollection(userId?: string) {
  const { t } = useTranslation();
  const [items, setItems] = useState<CollectionCard[]>([]);
  const [value, setValue] = useState({ totalValue: 0, totalCards: 0, uniqueCards: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      api.get(`/collection/${userId}`).then((r) => setItems(r.data)),
      api.get(`/collection/${userId}/value`).then((r) => setValue(r.data)),
    ]).catch(() => toast("error", t("collection.loadError"))).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [userId]);
  return { items, value, loading, refetch: fetch };
}

export default function Collection() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user: me, token } = useAuthStore();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const userId = id || me?.id || "";
  const isMe = !id || id === me?.id;
  const { items, value, loading, refetch } = useCollection(userId);

  const [showAdd, setShowAdd] = useState(false);
  const [cardSearch, setCardSearch] = useState("");
  const [cardResults, setCardResults] = useState<MarketCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketCard | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState("");

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
      refetch();
      setShowAdd(false);
      setSelectedCard(null);
      setCardSearch("");
      setQuantity(1);
      setPurchasePrice("");
    } catch { toast("error", t("collection.addError")); }
  };

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    try {
      if (newQty <= 0) {
        await api.delete(`/collection/${itemId}`);
      } else {
        await api.patch(`/collection/${itemId}`, { quantity: newQty });
      }
      refetch();
    } catch { toast("error", t("collection.saveError")); }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await api.delete(`/collection/${itemId}`);
      refetch();
    } catch { toast("error", t("collection.deleteError")); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#0B1220] rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-[#0B1220] rounded" />)}
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
            <BookOpen className="h-7 w-7 text-[#00C8FF]" /> {t("collection.title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("collection.subtitle")}</p>
        </div>
        {isMe && (
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary font-heading">
            <Plus className="h-4 w-4" /> {t("collection.addCard")}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold font-heading text-[#A7FF00]">{value.uniqueCards}</p>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">{t("collection.uniqueCards")}</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold font-heading text-[#00C8FF]">{value.totalCards}</p>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">{t("collection.totalCards")}</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold font-heading text-[#A7FF00]">{value.totalValue.toLocaleString("cs-CZ")} Kč</p>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">{t("collection.totalValue")}</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card mb-8">
          <h2 className="font-heading font-bold text-lg mb-4">{t("collection.addFormTitle")}</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-heading font-semibold mb-1.5">{t("collection.card")}</label>
              <input className="input" placeholder={t("collection.cardPlaceholder")} value={cardSearch} onChange={(e) => setCardSearch(e.target.value)} />
              {cardResults.length > 0 && (
                <div className="mt-1 rounded-lg border border-[rgba(0,200,255,0.15)] bg-[#0B1220] max-h-40 overflow-y-auto">
                  {cardResults.map((c) => (
                    <button key={c.id} type="button" onClick={() => { setSelectedCard(c); setCardSearch(c.name); setCardResults([]); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[rgba(0,200,255,0.06)] border-b border-[rgba(0,200,255,0.06)] last:border-0">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-gray-500 ml-2">{c.setName}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedCard && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)] text-sm">
                  {selectedCard.name} <span className="text-gray-500">({selectedCard.setName})</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-heading font-semibold mb-1.5">{t("collection.quantity")}</label>
                <input type="number" min="1" className="input" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <label className="block text-sm font-heading font-semibold mb-1.5">{t("collection.purchasePrice")}</label>
                <input type="number" className="input" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder={t("collection.purchasePricePlaceholder")} />
              </div>
            </div>
            <button onClick={handleAdd} disabled={!selectedCard} className="btn-primary font-heading">{t("collection.addToCollection")}</button>
          </div>
        </div>
      )}

      {/* Collection grid */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-heading font-bold text-gray-400">{t("collection.empty")}</p>
          <p className="text-sm text-gray-600 mt-1">{t("collection.emptyHint")}</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.slice(0, visibleCount).map((item) => (
            <div key={item.id} className="card hover:border-[rgba(0,200,255,0.3)] transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-base truncate">{item.cardName}</h3>
                  <p className="text-xs text-gray-500 truncate">{item.cardSet}</p>
                  {item.cardRarity && <span className="badge-blue mt-1 inline-block">{item.cardRarity}</span>}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="badge-green">{item.condition}</span>
                    {item.purchasePrice && <span>{t("collection.purchasedFor")} {item.purchasePrice} Kč</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isMe && (
                    <>
                      <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="btn-ghost p-1.5">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-heading font-bold text-lg text-[#00C8FF] min-w-[24px] text-center">{item.quantity}</span>
                      <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="btn-ghost p-1.5">
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {!isMe && <span className="font-heading font-bold text-lg text-[#00C8FF]">x{item.quantity}</span>}
                </div>
              </div>
              {isMe && (
                <div className="mt-3 pt-3 border-t border-[rgba(0,200,255,0.06)] flex justify-end">
                  <button onClick={() => handleRemove(item.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {visibleCount < items.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount((p) => p + ITEMS_PER_PAGE)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[rgba(0,200,255,0.2)] text-[#00C8FF] font-heading font-bold hover:bg-[rgba(0,200,255,0.08)] transition-all"
            >
              <ChevronDown className="h-4 w-4" />
              {t("collection.loadMore")} ({items.length - visibleCount} {t("collection.remaining")})
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
