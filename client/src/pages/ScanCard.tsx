import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, Scan, X, AlertCircle, Loader2, Sparkles, Check,
  ArrowRight, Search, Brain, BookOpen, PackagePlus, CheckCircle2,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { searchCards } from "../lib/CardsDB";
import type { MarketCard } from "../lib/CardsDB";
import api from "../services/api";
import { toast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";

const CONDITIONS = ["NM", "LP", "MP", "HP", "PO"];

export default function ScanCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ detected: boolean; confidence: number } | null>(null);
  const [error, setError] = useState("");
  const [cardSearch, setCardSearch] = useState("");
  const [cardResults, setCardResults] = useState<MarketCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketCard | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [autoMatched, setAutoMatched] = useState(false);

  // Add to collection state
  const [addMode, setAddMode] = useState(false);
  const [addCondition, setAddCondition] = useState("NM");
  const [addQuantity, setAddQuantity] = useState(1);
  const [addPrice, setAddPrice] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [addedToCollection, setAddedToCollection] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setResult(null);
      setError("");
      setSelectedCard(null);
      setOcrText("");
      setOcrConfidence(0);
      setAutoMatched(false);
      setAddMode(false);
      setAddedToCollection(false);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setScanning(true);
    setError("");
    setOcrText("");
    setAutoMatched(false);
    setAddedToCollection(false);

    try {
      const CardDetectionService = (await import("../services/CardDetectionService")).default;
      const OcrService = (await import("../services/OcrService")).default;
      const detector = CardDetectionService.getInstance();
      const ocr = OcrService.getInstance();

      const img = new Image();
      img.src = image;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });

      const det = await detector.detectCardPresence(img);
      setResult(det);

      if (!det.detected) {
        setError(t("scan.noCardDetected"));
        setScanning(false);
        return;
      }

      const ocrResult = await ocr.recognize(img);
      const cleaned = ocr.extractCardName(ocrResult.text);

      if (cleaned && cleaned.length > 2) {
        setOcrText(cleaned);
        setOcrConfidence(Math.round(ocrResult.confidence));

        const matches = await searchCards(cleaned);
        if (matches.length > 0) {
          const best = matches[0];
          setSelectedCard(best);
          setCardSearch(best.name);
          setAutoMatched(true);
          if (best.estimatedPrice) {
            setAddPrice(String(best.estimatedPrice));
          }
        } else {
          setCardSearch(cleaned);
        }
      }
    } catch {
      setError(t("scan.modelError"));
    }
    setScanning(false);
  };

  const handleAddToCollection = async () => {
    if (!selectedCard || !user) return;
    setAddingToCollection(true);
    try {
      await api.post("/collection", {
        cardId: selectedCard.id,
        cardName: selectedCard.name,
        cardSet: selectedCard.setName,
        cardRarity: selectedCard.rarity,
        cardImage: selectedCard.imageUrl,
        quantity: addQuantity,
        purchasePrice: addPrice ? parseFloat(addPrice) : undefined,
        condition: addCondition,
        notes: addNotes || undefined,
      });
      setAddedToCollection(true);
      setAddMode(false);
      toast("success", t("scan.addedToCollection"));
    } catch {
      toast("error", t("collection.addError"));
    }
    setAddingToCollection(false);
  };

  const createAuction = () => {
    if (selectedCard) {
      navigate(`/create?card=${selectedCard.id}&name=${encodeURIComponent(selectedCard.name)}`);
    }
  };

  const resetAll = () => {
    setImage(null);
    setResult(null);
    setError("");
    setSelectedCard(null);
    setOcrText("");
    setAddMode(false);
    setAddedToCollection(false);
    setAddPrice("");
    setAddNotes("");
    setAddQuantity(1);
    setAddCondition("NM");
  };

  useEffect(() => {
    if (cardSearch.length < 2 || autoMatched) {
      if (!autoMatched) setCardResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await searchCards(cardSearch);
      if (!cancelled) setCardResults(results);
    }, 150);
    return () => { clearTimeout(timer); cancelled = true; };
  }, [cardSearch, autoMatched]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,200,255,0.2)] bg-[rgba(0,200,255,0.12)] px-4 py-1.5 text-sm text-[#00C8FF] mb-4">
          <Sparkles className="h-4 w-4" /> {t("scan.badge")}
        </div>
        <h1 className="text-3xl font-bold">{t("scan.title")}</h1>
        <p className="text-gray-500 mt-2">{t("scan.subtitle")}</p>
      </div>

      {/* Upload area */}
      <div className="card mb-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="aspect-[4/3] rounded-lg border-2 border-dashed border-[rgba(0,200,255,0.15)] hover:border-[#00C8FF] cursor-pointer transition-colors flex items-center justify-center bg-[rgba(0,200,255,0.05)]"
        >
          {image ? (
            <img src={image} alt="Uploaded card" loading="lazy" className="w-full h-full object-contain rounded-lg" />
          ) : (
            <div className="text-center text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">{t("scan.upload")}</p>
              <p className="text-sm mt-1">{t("scan.photoHint")}</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {image && (
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleScan} disabled={scanning} className="btn-primary flex-1 text-base py-3">
            {scanning ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {t("scan.scanning")}</>
            ) : (
              <><Scan className="h-5 w-5" /> {t("scan.identify")}</>
            )}
          </button>
          <button onClick={resetAll} className="btn-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/20 rounded-lg p-4 mb-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {result?.detected && (
        <div className="card mb-6 border-[rgba(167,255,0,0.3)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-[rgba(167,255,0,0.15)] p-2">
              <Check className="h-6 w-6 text-[#A7FF00]" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg">{t("scan.detected")}</p>
              <p className="text-sm text-gray-400">
                {t("scan.detectionLabel")}: {result.confidence}%
                {ocrText && <> · OCR: {ocrConfidence}%</>}
              </p>
            </div>
          </div>

          {/* OCR result */}
          {ocrText && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)] mb-3">
              <Brain className="h-4 w-4 text-[#00C8FF] flex-shrink-0" />
              <span className="text-sm text-gray-300">
                {t("scan.ocrLabel")} <strong className="text-white">{ocrText}</strong>
              </span>
              {autoMatched && (
                <span className="text-xs text-[#A7FF00] ml-auto">{t("scan.autoMatch")}</span>
              )}
            </div>
          )}

          {/* Manual search fallback */}
          {!autoMatched && (
            <>
              <p className="text-sm text-gray-500 mb-3">{t("scan.selectCard")}</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder={t("scan.cardPlaceholder")}
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                />
              </div>
              {cardResults.length > 0 && (
                <div className="mb-3 rounded-lg border border-[rgba(0,200,255,0.15)] bg-[#0B1220] max-h-40 overflow-y-auto">
                  {cardResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCard(c);
                        setCardSearch(c.name);
                        setCardResults([]);
                        if (c.estimatedPrice) setAddPrice(String(c.estimatedPrice));
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[rgba(0,200,255,0.06)] border-b border-[rgba(0,200,255,0.06)] last:border-0"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-gray-500 ml-2">{c.setName}</span>
                      {c.estimatedPrice && (
                        <span className="ml-auto float-right text-[#A7FF00] text-xs font-bold">
                          {c.estimatedPrice.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Selected card + actions */}
          {selectedCard && !addedToCollection && !addMode && (
            <div className="rounded-lg bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)] p-3">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="font-heading font-bold">{selectedCard.name}</p>
                  <p className="text-xs text-gray-400">{selectedCard.setName}</p>
                  {selectedCard.rarity && (
                    <span className="badge-blue mt-1 inline-block">{selectedCard.rarity}</span>
                  )}
                </div>
                {selectedCard.imageUrl && (
                  <img
                    src={selectedCard.imageUrl}
                    alt={selectedCard.name}
                    className="w-12 h-16 object-contain rounded"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddMode(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#A7FF00] text-[#050A12] font-heading font-bold text-sm hover:bg-[#c0ff3c] transition-colors"
                >
                  <PackagePlus className="h-4 w-4" />
                  {t("scan.addToCollection")}
                </button>
                <button
                  onClick={createAuction}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[rgba(0,200,255,0.3)] text-[#00C8FF] font-heading font-bold text-sm hover:bg-[rgba(0,200,255,0.08)] transition-colors"
                >
                  {t("scan.createAuction")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Add to collection form */}
          {addMode && selectedCard && (
            <div className="rounded-lg bg-[rgba(167,255,0,0.05)] border border-[rgba(167,255,0,0.2)] p-4">
              <h3 className="font-heading font-bold text-sm text-[#A7FF00] mb-3 flex items-center gap-2">
                <PackagePlus className="h-4 w-4" />
                {t("scan.addToCollection")}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("scan.conditionLabel")}</label>
                  <select
                    className="input text-sm"
                    value={addCondition}
                    onChange={(e) => setAddCondition(e.target.value)}
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("collection.quantity")}</label>
                  <input
                    type="number"
                    min="1"
                    className="input text-sm"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">{t("collection.purchasePrice")} (Kč)</label>
                <input
                  type="number"
                  className="input text-sm"
                  placeholder="0"
                  value={addPrice}
                  onChange={(e) => setAddPrice(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">{t("collection.notes")}</label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder={t("collection.notesPlaceholder")}
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCollection}
                  disabled={addingToCollection}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#A7FF00] text-[#050A12] font-heading font-bold text-sm hover:bg-[#c0ff3c] disabled:opacity-50 transition-colors"
                >
                  {addingToCollection ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t("scan.addingToCollection")}</>
                  ) : (
                    <><PackagePlus className="h-4 w-4" /> {t("collection.addToCollection")}</>
                  )}
                </button>
                <button
                  onClick={() => setAddMode(false)}
                  className="px-3 py-2.5 rounded-xl border border-[rgba(0,200,255,0.2)] text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Success state */}
          {addedToCollection && (
            <div className="rounded-lg bg-[rgba(167,255,0,0.08)] border border-[rgba(167,255,0,0.3)] p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-[#A7FF00] flex-shrink-0" />
              <div className="flex-1">
                <p className="font-heading font-bold text-sm text-[#A7FF00]">{t("scan.addedToCollection")}</p>
                <p className="text-xs text-gray-400">{selectedCard.name}</p>
              </div>
              <button
                onClick={() => navigate("/collection")}
                className="flex items-center gap-1 text-xs text-[#00C8FF] hover:underline"
              >
                <BookOpen className="h-3 w-3" />
                {t("scan.viewCollection")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
