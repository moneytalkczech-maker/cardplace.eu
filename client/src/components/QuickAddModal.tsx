import { useState } from "react";
import { X, PackagePlus, Loader2, Check } from "lucide-react";
import api from "../services/api";
import { toast } from "./Toast";
import { useAuthStore } from "../store/authStore";

const CONDITIONS = ["NM", "LP", "MP", "HP", "PO"];

export interface QuickAddCard {
  id: string;
  name: string;
  setName: string;
  rarity?: string | null;
  imageUrl?: string | null;
  estimatedPrice?: number | null;
}

interface Props {
  card: QuickAddCard;
  onClose: () => void;
  onAdded?: () => void;
}

export default function QuickAddModal({ card, onClose, onAdded }: Props) {
  const { user } = useAuthStore();
  const [condition, setCondition] = useState("NM");
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [marketValue, setMarketValue] = useState(
    card.estimatedPrice ? String(Math.round(card.estimatedPrice)) : ""
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleAdd = async () => {
    if (!user) {
      toast("error", "Pro přidání do sbírky se musíš přihlásit");
      return;
    }
    setSaving(true);
    try {
      await api.post("/collection", {
        cardId: card.id,
        cardName: card.name,
        cardSet: card.setName,
        cardRarity: card.rarity || undefined,
        cardImage: card.imageUrl || undefined,
        quantity,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        marketValue: marketValue ? parseFloat(marketValue) : undefined,
        condition,
        notes: notes || undefined,
      });
      setDone(true);
      toast("success", `${card.name} přidáno do sbírky`);
      onAdded?.();
      setTimeout(onClose, 1200);
    } catch {
      toast("error", "Nepodařilo se přidat do sbírky");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-[rgba(167,255,0,0.2)] bg-[#080E1B] shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} className="w-10 h-14 object-contain rounded flex-shrink-0" />
          ) : (
            <div className="w-10 h-14 flex-shrink-0 rounded bg-[#0B1220] border border-[rgba(0,200,255,0.1)] flex items-center justify-center text-lg">🃏</div>
          )}
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-base truncate">{card.name}</h2>
            <p className="text-xs text-gray-500 truncate">{card.setName}</p>
            {card.rarity && <span className="text-xs text-[#00C8FF]">{card.rarity}</span>}
          </div>
        </div>

        {done ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[#A7FF00]">
            <Check className="h-6 w-6" />
            <span className="font-heading font-bold">Přidáno do sbírky!</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Stav</label>
                <select
                  className="input text-sm py-2"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Počet</label>
                <input
                  type="number"
                  min="1"
                  className="input text-sm py-2"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pořizovací cena (Kč)</label>
                <input
                  type="number"
                  min="0"
                  className="input text-sm py-2"
                  placeholder="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Tržní hodnota (Kč)
                  {card.estimatedPrice && (
                    <span className="text-[#A7FF00] ml-1 text-[10px]">auto</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  className="input text-sm py-2"
                  placeholder="0"
                  value={marketValue}
                  onChange={(e) => setMarketValue(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Poznámka</label>
              <input
                type="text"
                className="input text-sm py-2"
                placeholder="Volitelná poznámka..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#A7FF00] text-[#050A12] font-heading font-bold text-sm hover:bg-[#c0ff3c] disabled:opacity-50 transition-colors mt-1"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Přidávám...</>
              ) : (
                <><PackagePlus className="h-4 w-4" /> Přidat do sbírky</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
