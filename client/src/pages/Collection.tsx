import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Plus, Trash2, Minus, Plus as PlusIcon, BookOpen, Loader2, ChevronDown,
  Camera, Download, Search, Filter, TrendingUp, TrendingDown, BarChart2,
  Package, Pencil, X, Check,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { searchCards, type MarketCard } from "../lib/CardsDB";
import api from "../services/api";
import { toast } from "../components/Toast";
import { useTranslation } from "../hooks/useTranslation";
import CollectionChart from "../components/CollectionChart";

const ITEMS_PER_PAGE = 24;

const CONDITIONS = ["NM", "LP", "MP", "HP", "PO"];
const CONDITION_COLOR: Record<string, string> = {
  NM: "text-[#A7FF00]",
  LP: "text-[#00C8FF]",
  MP: "text-yellow-400",
  HP: "text-orange-400",
  PO: "text-red-400",
};

interface CollectionCard {
  id: string;
  cardId: string;
  cardName: string;
  cardSet: string;
  cardRarity?: string | null;
  cardImage?: string | null;
  quantity: number;
  purchasePrice?: number | null;
  marketValue?: number | null;
  condition: string;
  notes?: string | null;
  category?: string | null;
  createdAt: string;
}

interface CollectionValue {
  totalValue: number;
  purchaseValue: number;
  totalCards: number;
  uniqueCards: number;
  gainLoss: number;
}

function useCollection(userId?: string) {
  const { t } = useTranslation();
  const [items, setItems] = useState<CollectionCard[]>([]);
  const [value, setValue] = useState<CollectionValue>({
    totalValue: 0,
    purchaseValue: 0,
    totalCards: 0,
    uniqueCards: 0,
    gainLoss: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      api.get(`/collection/${userId}`).then((r) => setItems(r.data)),
      api.get(`/collection/${userId}/value`).then((r) => setValue(r.data)),
    ])
      .catch(() => toast("error", t("collection.loadError")))
      .finally(() => setLoading(false));
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
  const [condition, setCondition] = useState("NM");
  const [notes, setNotes] = useState("");

  // Filters
  const [filterSearch, setFilterSearch] = useState("");
  const [filterCondition, setFilterCondition] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [chartGroupBy, setChartGroupBy] = useState<"rarity" | "set">("rarity");
  const [showChart, setShowChart] = useState(true);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editPrice, setEditPrice] = useState("");

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
        condition,
        notes: notes || undefined,
      });
      refetch();
      setShowAdd(false);
      setSelectedCard(null);
      setCardSearch("");
      setQuantity(1);
      setPurchasePrice("");
      setCondition("NM");
      setNotes("");
      toast("success", t("collection.addedSuccess"));
    } catch {
      toast("error", t("collection.addError"));
    }
  };

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    try {
      if (newQty <= 0) {
        await api.delete(`/collection/${itemId}`);
      } else {
        await api.patch(`/collection/${itemId}`, { quantity: newQty });
      }
      refetch();
    } catch {
      toast("error", t("collection.saveError"));
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await api.delete(`/collection/${itemId}`);
      refetch();
    } catch {
      toast("error", t("collection.deleteError"));
    }
  };

  const startEdit = (item: CollectionCard) => {
    setEditingId(item.id);
    setEditNotes(item.notes || "");
    setEditCondition(item.condition);
    setEditPrice(item.marketValue != null ? String(item.marketValue) : "");
  };

  const saveEdit = async (itemId: string) => {
    try {
      await api.patch(`/collection/${itemId}`, {
        condition: editCondition,
        notes: editNotes || undefined,
        marketValue: editPrice ? parseFloat(editPrice) : undefined,
      });
      refetch();
      setEditingId(null);
    } catch {
      toast("error", t("collection.saveError"));
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      const res = await api.get(`/collection/${userId}/export/${format}`, {
        responseType: "blob",
      });
      const blob = new Blob(
        [res.data],
        { type: format === "csv" ? "text/csv;charset=utf-8;" : "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sbírka.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast("error", t("collection.exportError"));
    }
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      result = result.filter(
        (i) => i.cardName.toLowerCase().includes(q) || i.cardSet.toLowerCase().includes(q)
      );
    }

    if (filterCondition !== "all") {
      result = result.filter((i) => i.condition === filterCondition);
    }

    result.sort((a, b) => {
      if (sortBy === "name") return a.cardName.localeCompare(b.cardName);
      if (sortBy === "value") {
        const va = (a.marketValue ?? a.purchasePrice ?? 0) * a.quantity;
        const vb = (b.marketValue ?? b.purchasePrice ?? 0) * b.quantity;
        return vb - va;
      }
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [items, filterSearch, filterCondition, sortBy]);

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

  const gainLossPositive = value.gainLoss >= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-[#00C8FF]" /> {t("collection.title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("collection.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {isMe && (
            <>
              <Link
                to="/scan"
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(0,200,255,0.2)] text-[#00C8FF] font-heading font-bold text-sm hover:bg-[rgba(0,200,255,0.08)] transition-all"
              >
                <Camera className="h-4 w-4" />
                {t("collection.scan")}
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[rgba(0,200,255,0.15)] text-gray-400 hover:text-white font-heading font-bold text-sm hover:border-[rgba(0,200,255,0.3)] transition-all">
                  <Download className="h-4 w-4" />
                  {t("collection.export")}
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 bg-[#0B1220] border border-[rgba(0,200,255,0.15)] rounded-xl overflow-hidden shadow-xl min-w-[120px]">
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[rgba(0,200,255,0.06)] transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[rgba(0,200,255,0.06)] transition-colors border-t border-[rgba(0,200,255,0.06)]"
                  >
                    JSON
                  </button>
                </div>
              </div>
              <button onClick={() => setShowAdd(!showAdd)} className="btn-primary font-heading text-sm">
                <Plus className="h-4 w-4" /> {t("collection.addCard")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold font-heading text-[#A7FF00]">{value.uniqueCards}</p>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mt-1">{t("collection.uniqueCards")}</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold font-heading text-[#00C8FF]">{value.totalCards}</p>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mt-1">{t("collection.totalCards")}</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold font-heading text-[#A7FF00]">
            {value.totalValue.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
          </p>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mt-1">{t("collection.marketValue")}</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-1">
            {gainLossPositive ? (
              <TrendingUp className="h-4 w-4 text-[#A7FF00]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <p className={`text-2xl font-bold font-heading ${gainLossPositive ? "text-[#A7FF00]" : "text-red-400"}`}>
              {gainLossPositive ? "+" : ""}
              {value.gainLoss.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
            </p>
          </div>
          <p className="text-xs text-gray-500 font-heading uppercase tracking-wider mt-1">{t("collection.gainLoss")}</p>
        </div>
      </div>

      {/* Chart */}
      {items.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-[#00C8FF]" />
              {t("collection.valueChart")}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartGroupBy("rarity")}
                className={`text-xs px-3 py-1.5 rounded-lg font-heading transition-colors ${chartGroupBy === "rarity" ? "bg-[rgba(0,200,255,0.15)] text-[#00C8FF]" : "text-gray-500 hover:text-white"}`}
              >
                {t("collection.byRarity")}
              </button>
              <button
                onClick={() => setChartGroupBy("set")}
                className={`text-xs px-3 py-1.5 rounded-lg font-heading transition-colors ${chartGroupBy === "set" ? "bg-[rgba(0,200,255,0.15)] text-[#00C8FF]" : "text-gray-500 hover:text-white"}`}
              >
                {t("collection.bySet")}
              </button>
              <button
                onClick={() => setShowChart((s) => !s)}
                className="text-gray-500 hover:text-white transition-colors ml-2"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showChart ? "" : "rotate-180"}`} />
              </button>
            </div>
          </div>
          {showChart && <CollectionChart items={items} groupBy={chartGroupBy} />}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="card mb-6">
          <h2 className="font-heading font-bold text-lg mb-4">{t("collection.addFormTitle")}</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-heading font-semibold mb-1.5">{t("collection.card")}</label>
              <input
                className="input"
                placeholder={t("collection.cardPlaceholder")}
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
              />
              {cardResults.length > 0 && (
                <div className="mt-1 rounded-lg border border-[rgba(0,200,255,0.15)] bg-[#0B1220] max-h-40 overflow-y-auto">
                  {cardResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedCard(c); setCardSearch(c.name); setCardResults([]); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[rgba(0,200,255,0.06)] border-b border-[rgba(0,200,255,0.06)] last:border-0"
                    >
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
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="block text-sm font-heading font-semibold mb-1.5">{t("scan.conditionLabel")}</label>
                <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-heading font-semibold mb-1.5">{t("collection.purchasePrice")}</label>
                <input
                  type="number"
                  className="input"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-heading font-semibold mb-1.5">{t("collection.notes")}</label>
                <input
                  type="text"
                  className="input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("collection.notesPlaceholder")}
                  maxLength={200}
                />
              </div>
            </div>
            <button onClick={handleAdd} disabled={!selectedCard} className="btn-primary font-heading">
              {t("collection.addToCollection")}
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              className="input pl-10 text-sm"
              placeholder={t("collection.search")}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="input text-sm py-2"
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
            >
              <option value="all">{t("collection.allConditions")}</option>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select
            className="input text-sm py-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">{t("collection.sortNewest")}</option>
            <option value="oldest">{t("collection.sortOldest")}</option>
            <option value="name">{t("collection.sortName")}</option>
            <option value="value">{t("collection.sortValue")}</option>
          </select>
          {(filterSearch || filterCondition !== "all") && (
            <span className="text-xs text-gray-500">
              {filteredItems.length} / {items.length}
            </span>
          )}
        </div>
      )}

      {/* Collection grid */}
      {filteredItems.length === 0 && items.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-heading font-bold text-gray-400">{t("collection.empty")}</p>
          <p className="text-sm text-gray-600 mt-1">{t("collection.emptyHint")}</p>
          {isMe && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Link to="/scan" className="btn-primary font-heading text-sm">
                <Camera className="h-4 w-4" /> {t("collection.scan")}
              </Link>
              <button onClick={() => setShowAdd(true)} className="btn-secondary font-heading text-sm">
                <Plus className="h-4 w-4" /> {t("collection.addCard")}
              </button>
            </div>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-10 w-10 mx-auto mb-3 text-gray-600" />
          <p>{t("collection.noResults")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.slice(0, visibleCount).map((item) => {
              const itemValue = (item.marketValue ?? item.purchasePrice ?? 0) * item.quantity;
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="card hover:border-[rgba(0,200,255,0.3)] transition-all">
                  <div className="flex items-start gap-3">
                    {/* Card image */}
                    {item.cardImage && (
                      <img
                        src={item.cardImage}
                        alt={item.cardName}
                        className="w-12 h-16 object-contain rounded flex-shrink-0"
                        loading="lazy"
                      />
                    )}
                    {!item.cardImage && (
                      <div className="w-12 h-16 flex-shrink-0 rounded bg-[#0B1220] border border-[rgba(0,200,255,0.06)] flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-gray-600" />
                      </div>
                    )}

                    {/* Card info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-sm truncate">{item.cardName}</h3>
                      <p className="text-xs text-gray-500 truncate">{item.cardSet}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.cardRarity && (
                          <span className="badge-blue text-xs">{item.cardRarity}</span>
                        )}
                        <span className={`text-xs font-bold ${CONDITION_COLOR[item.condition] || "text-gray-400"}`}>
                          {item.condition}
                        </span>
                      </div>
                      {itemValue > 0 && (
                        <p className="text-sm font-heading font-bold text-[#A7FF00] mt-1">
                          {itemValue.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
                        </p>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isMe && (
                        <>
                          <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="btn-ghost p-1.5">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="font-heading font-bold text-base text-[#00C8FF] min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="btn-ghost p-1.5">
                            <PlusIcon className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {!isMe && (
                        <span className="font-heading font-bold text-base text-[#00C8FF]">×{item.quantity}</span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {item.notes && !isEditing && (
                    <p className="mt-2 text-xs text-gray-500 italic truncate">{item.notes}</p>
                  )}

                  {/* Inline edit */}
                  {isEditing && (
                    <div className="mt-3 pt-3 border-t border-[rgba(0,200,255,0.06)] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className="input text-xs py-1.5"
                          value={editCondition}
                          onChange={(e) => setEditCondition(e.target.value)}
                        >
                          {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                          type="number"
                          className="input text-xs py-1.5"
                          placeholder={t("collection.marketValuePh")}
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                      </div>
                      <input
                        type="text"
                        className="input text-xs py-1.5 w-full"
                        placeholder={t("collection.notesPlaceholder")}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        maxLength={200}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[rgba(0,200,255,0.15)] text-[#00C8FF] text-xs font-bold hover:bg-[rgba(0,200,255,0.25)] transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t("collection.saveEdit")}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg border border-[rgba(0,200,255,0.1)] text-gray-500 text-xs hover:text-white transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Card footer */}
                  {isMe && !isEditing && (
                    <div className="mt-3 pt-3 border-t border-[rgba(0,200,255,0.06)] flex items-center justify-between">
                      <button
                        onClick={() => startEdit(item)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#00C8FF] transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        {t("collection.edit")}
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {visibleCount < filteredItems.length && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount((p) => p + ITEMS_PER_PAGE)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[rgba(0,200,255,0.2)] text-[#00C8FF] font-heading font-bold hover:bg-[rgba(0,200,255,0.08)] transition-all"
              >
                <ChevronDown className="h-4 w-4" />
                {t("collection.loadMore")} ({filteredItems.length - visibleCount} {t("collection.remaining")})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
