import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Scan, X, AlertCircle, Loader2, Sparkles, Check, ArrowRight, Search } from "lucide-react";
import CardDetectionService from "../services/CardDetectionService";
import { useTranslation } from "../hooks/useTranslation";
import { searchCards } from "../lib/CardsDB";
import type { MarketCard } from "../lib/CardsDB";

export default function ScanCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ detected: boolean; confidence: number } | null>(null);
  const [error, setError] = useState("");
  const [cardSearch, setCardSearch] = useState("");
  const [cardResults, setCardResults] = useState<MarketCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketCard | null>(null);
  const detector = CardDetectionService.getInstance();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setResult(null);
      setError("");
      setSelectedCard(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setScanning(true);
    setError("");

    try {
      const img = new Image();
      img.src = image;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });

      const det = await detector.detectCardPresence(img);
      setResult(det);
      if (!det.detected) {
        setError("Na fotografii nebyla rozpoznána žádná karta. Zkus kvalitnější snímek.");
      }
    } catch {
      setError("Nepodařilo se načíst AI model. Zkus to znovu.");
    }
    setScanning(false);
  };

  useEffect(() => {
    if (cardSearch.length < 2) { setCardResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await searchCards(cardSearch);
      if (!cancelled) setCardResults(results);
    }, 150);
    return () => { clearTimeout(timer); cancelled = true; };
  }, [cardSearch]);

  const createAuction = () => {
    if (selectedCard) {
      navigate(`/create?card=${selectedCard.id}&name=${encodeURIComponent(selectedCard.name)}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-800 bg-blue-900/30 px-4 py-1.5 text-sm text-blue-400 mb-4">
          <Sparkles className="h-4 w-4" /> {t("scan.badge")}
        </div>
        <h1 className="text-3xl font-bold">{t("scan.title")}</h1>
        <p className="text-gray-500 mt-2">{t("scan.subtitle")}</p>
      </div>

      <div className="card mb-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-700 hover:border-blue-500 cursor-pointer transition-colors flex items-center justify-center bg-gray-800/50"
        >
          {image ? (
            <img src={image} alt="Uploaded card" className="w-full h-full object-contain rounded-lg" />
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
          <button onClick={() => { setImage(null); setResult(null); setError(""); setSelectedCard(null); }} className="btn-secondary">
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
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-[rgba(167,255,0,0.15)] p-2">
              <Check className="h-6 w-6 text-[#A7FF00]" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg">Karta detekována! ✅</p>
              <p className="text-sm text-gray-400">Spolehlivost: {result.confidence}%</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3">Vyber kartu ze seznamu a vytvoř aukci:</p>

          {/* Card search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Napiš název karty..."
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
            />
          </div>
          {cardResults.length > 0 && (
            <div className="mb-3 rounded-lg border border-[rgba(0,200,255,0.15)] bg-[#0B1220] max-h-40 overflow-y-auto">
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)]">
              <div>
                <p className="font-heading font-bold">{selectedCard.name}</p>
                <p className="text-xs text-gray-400">{selectedCard.setName}</p>
              </div>
              <button onClick={createAuction} className="btn-primary text-sm font-heading">
                Vytvořit aukci <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
