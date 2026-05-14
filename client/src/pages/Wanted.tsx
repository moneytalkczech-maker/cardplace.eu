import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, X, Target, Gavel, Loader2 } from "lucide-react";
import { wantedApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { searchCards } from "../lib/CardsDB";
import type { MarketCard } from "../lib/CardsDB";

interface WantedItem {
  id: string;
  cardId: string;
  cardName: string;
  cardSet: string;
  description?: string;
  maxPrice?: number;
  status: string;
  createdAt: string;
  user: { id: string; username: string; trustScore: number };
}

export default function Wanted() {
  const { token } = useAuthStore();
  const [wanted, setWanted] = useState<WantedItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [cardSearch, setCardSearch] = useState("");
  const [cardResults, setCardResults] = useState<MarketCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketCard | null>(null);
  const [description, setDescription] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wantedApi.getAll().then(setWanted).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (cardSearch.length < 2) { setCardResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await searchCards(cardSearch);
      if (!cancelled) setCardResults(results);
    }, 150);
    return () => { clearTimeout(timer); cancelled = true; };
  }, [cardSearch]);

  const handleSubmit = async () => {
    if (!selectedCard || !token) return;
    setSubmitting(true);
    try {
      const result = await wantedApi.create({
        cardId: selectedCard.id,
        cardName: selectedCard.name,
        cardSet: selectedCard.setName,
        description,
        maxPrice: maxPrice || undefined,
      });
      setWanted((prev) => [result, ...prev]);
      setShowForm(false);
      setSelectedCard(null);
      setCardSearch("");
      setDescription("");
      setMaxPrice("");
    } catch {}
    setSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    try {
      await wantedApi.remove(id);
      setWanted((prev) => prev.map((w) => w.id === id ? { ...w, status: "FULFILLED" } : w));
    } catch {}
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
            <Target className="h-7 w-7 text-[#00C8FF]" /> Hledané karty
          </h1>
          <p className="text-gray-500 mt-1">Dej vědět, co sháníš — prodejci ti nabídnou</p>
        </div>
        {token && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary font-heading">
            <Plus className="h-4 w-4" /> Přidat poptávku
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card mb-8">
          <h2 className="font-heading font-bold text-lg mb-4">Nová poptávka</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-heading font-semibold mb-1.5">Karta</label>
              <input className="input" placeholder="Název karty..." value={cardSearch} onChange={(e) => setCardSearch(e.target.value)} />
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
            <div>
              <label className="block text-sm font-heading font-semibold mb-1.5">Popis (volitelné)</label>
              <textarea className="input min-h-[60px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Stav, edice, specifikace..." />
            </div>
            <div>
              <label className="block text-sm font-heading font-semibold mb-1.5">Max. cena (volitelné)</label>
              <input type="number" className="input" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Např. 1000" />
            </div>
            <button onClick={handleSubmit} disabled={submitting || !selectedCard} className="btn-primary font-heading">
              {submitting ? "Ukládám..." : "Přidat poptávku"}
            </button>
          </div>
        </div>
      )}

      {/* Wanted list */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#00C8FF]" />
        </div>
      ) : wanted.length === 0 ? (
        <div className="text-center py-20">
          <Target className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg font-heading font-bold text-gray-400">Zatím nikdo nic nehledá</p>
          <p className="text-sm text-gray-600 mt-1">Buď první a přidej poptávku</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wanted.map((w) => (
            <div key={w.id} className={`card ${w.status === "FULFILLED" ? "opacity-40" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="rounded-xl bg-[rgba(0,200,255,0.1)] p-3 mt-0.5">
                    <Target className="h-6 w-6 text-[#00C8FF]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg">{w.cardName}</h3>
                    {w.cardSet && <p className="text-sm text-gray-400">{w.cardSet}</p>}
                    {w.description && <p className="text-sm text-gray-500 mt-1">{w.description}</p>}
                    {w.maxPrice && (
                      <p className="text-sm text-[#A7FF00] font-heading font-semibold mt-1">
                        Max: {w.maxPrice.toLocaleString("cs-CZ")} Kč
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>@{w.user.username}</span>
                      <span>{new Date(w.createdAt).toLocaleDateString("cs-CZ")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {w.status === "ACTIVE" && (
                    <>
                      <Link to={`/auctions?search=${encodeURIComponent(w.cardName)}`} className="btn-secondary text-sm font-heading">
                        <Gavel className="h-4 w-4" /> Nabídnout
                      </Link>
                      {token && (
                        <button onClick={() => handleRemove(w.id)} className="btn-ghost text-sm">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                  {w.status === "FULFILLED" && (
                    <span className="badge-green">Vyřešeno</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
