"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, Scan, X, AlertCircle, Loader2, Sparkles, Check,
  ArrowRight, Search, Brain, Upload, RefreshCw, Zap, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { searchCards } from "@/lib/CardsDB";
import type { MarketCard } from "@/lib/CardsDB";
import type { CardScanResult } from "@/lib/anthropic";

type ScanPhase = "idle" | "uploading" | "analyzing" | "matching" | "done";

const gameLabels: Record<string, string> = {
  pokemon: "Pokémon",
  mtg: "Magic: The Gathering",
  yugioh: "Yu-Gi-Oh!",
  sports: "Sports Cards",
  other: "Other",
};

const conditionColors: Record<string, string> = {
  NM: "text-[#A7FF00]",
  LP: "text-[#00C8FF]",
  MP: "text-yellow-400",
  HP: "text-orange-400",
  DMG: "text-[#FF3366]",
};

export default function ScanPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [result, setResult] = useState<CardScanResult | null>(null);
  const [error, setError] = useState("");
  const [cardSearch, setCardSearch] = useState("");
  const [cardResults, setCardResults] = useState<MarketCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MarketCard | null>(null);
  const [autoMatched, setAutoMatched] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const phaseLabel: Record<ScanPhase, string> = {
    idle: "",
    uploading: "Odesílám obrázek...",
    analyzing: "AI analyzuje kartu...",
    matching: "Hledám v databázi...",
    done: "",
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setImageFile(file);
      setResult(null);
      setError("");
      setSelectedCard(null);
      setAutoMatched(false);
      setCardSearch("");
      setCardResults([]);
      setPhase("idle");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  const handleScan = async () => {
    if (!imageFile && !image) return;
    setPhase("uploading");
    setError("");
    setAutoMatched(false);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (image) {
        // Data URL fallback
        const res = await fetch(image);
        const blob = await res.blob();
        formData.append("image", blob, "card.jpg");
      }

      setPhase("analyzing");
      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Scan failed" }));
        throw new Error(err.error || "Scan failed");
      }

      const scanResult: CardScanResult = await response.json();
      setResult(scanResult);

      if (scanResult.detected && scanResult.cardName) {
        setPhase("matching");
        const matches = await searchCards(scanResult.cardName);
        if (matches.length > 0) {
          setSelectedCard(matches[0]);
          setCardSearch(matches[0].name);
          setAutoMatched(true);
        } else {
          setCardSearch(scanResult.cardName);
        }
      }

      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed. Please try again.");
      setPhase("idle");
    }
  };

  const reset = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
    setError("");
    setSelectedCard(null);
    setAutoMatched(false);
    setCardSearch("");
    setCardResults([]);
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    }, 200);
    return () => { clearTimeout(timer); cancelled = true; };
  }, [cardSearch, autoMatched]);

  const createAuction = () => {
    if (selectedCard) {
      router.push(`/auctions/create?card=${selectedCard.id}&name=${encodeURIComponent(selectedCard.name)}`);
    }
  };

  const isScanning = phase === "uploading" || phase === "analyzing" || phase === "matching";

  return (
    <div className="container-premium py-8 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="badge-blue inline-flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4" />
          AI Scanner powered by Claude
        </div>
        <h1 className="heading-xl mb-2">
          <span className="text-gradient">Skenovat</span> kartu
        </h1>
        <p className="text-gray-400 text-lg">
          Nahraj fotografii karty a AI ji okamžitě identifikuje
        </p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-5"
      >
        <div
          onClick={() => !isScanning && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative aspect-[4/3] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 flex items-center justify-center overflow-hidden
            ${isDragging
              ? "border-[#00C8FF] bg-[rgba(0,200,255,0.08)] scale-[1.01]"
              : image
                ? "border-[rgba(0,200,255,0.2)] bg-[rgba(0,200,255,0.03)]"
                : "border-[rgba(0,200,255,0.12)] bg-[rgba(0,200,255,0.03)] hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.06)]"
            }`}
        >
          {image ? (
            <>
              <img
                src={image}
                alt="Card to scan"
                className="w-full h-full object-contain rounded-lg"
              />
              {/* Scanning overlay */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#050A12]/70 flex flex-col items-center justify-center rounded-lg"
                  >
                    {/* Scanning line */}
                    <motion.div
                      className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#00C8FF] to-transparent"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{ boxShadow: "0 0 12px #00C8FF" }}
                    />
                    <div className="glass rounded-xl px-6 py-4 text-center">
                      <Loader2 className="h-8 w-8 text-[#00C8FF] animate-spin mx-auto mb-2" />
                      <p className="text-[#00C8FF] font-heading font-semibold">
                        {phaseLabel[phase]}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(0,200,255,0.1)] flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-[#00C8FF]" />
              </div>
              <p className="font-heading font-semibold text-lg text-white mb-1">
                Nahrát fotografii karty
              </p>
              <p className="text-gray-500 text-sm mb-3">
                Klikněte nebo přetáhněte soubor sem
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                <span>JPG, PNG, WebP</span>
                <span>•</span>
                <span>Max 10 MB</span>
              </div>
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
      </motion.div>

      {/* Action buttons */}
      <AnimatePresence>
        {image && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-3 mb-6"
          >
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="btn-primary flex-1 text-base py-3"
            >
              {isScanning ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> {phaseLabel[phase]}</>
              ) : (
                <><Zap className="h-5 w-5" /> Identifikovat s AI</>
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="btn-secondary p-3"
              title="Nahrát jiný obrázek"
            >
              <Upload className="h-5 w-5" />
            </button>
            <button
              onClick={reset}
              disabled={isScanning}
              className="btn-ghost p-3"
              title="Resetovat"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-900/30 rounded-xl p-4 mb-4"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Result */}
      <AnimatePresence>
        {result && phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border-[rgba(167,255,0,0.2)] mb-6"
          >
            {result.detected ? (
              <>
                {/* Detection header */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="rounded-xl bg-[rgba(167,255,0,0.12)] p-3 flex-shrink-0">
                    <Check className="h-6 w-6 text-[#A7FF00]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="heading-md text-[#A7FF00] mb-1">Karta identifikována</h2>
                    <div className="flex flex-wrap gap-2">
                      {result.game && (
                        <span className="badge-blue text-xs">{gameLabels[result.game] || result.game}</span>
                      )}
                      {result.confidence !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          result.confidence >= 80
                            ? "bg-[rgba(167,255,0,0.1)] border-[rgba(167,255,0,0.2)] text-[#A7FF00]"
                            : result.confidence >= 50
                              ? "bg-[rgba(0,200,255,0.1)] border-[rgba(0,200,255,0.2)] text-[#00C8FF]"
                              : "bg-[rgba(255,51,102,0.1)] border-[rgba(255,51,102,0.2)] text-[#FF3366]"
                        }`}>
                          {result.confidence}% jistota
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card info grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {result.cardName && (
                    <div className="col-span-2 p-3 rounded-lg bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)]">
                      <p className="text-xs text-gray-500 mb-1">Název karty</p>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-[#00C8FF] flex-shrink-0" />
                        <span className="font-heading font-bold text-white">{result.cardName}</span>
                      </div>
                    </div>
                  )}
                  {result.setName && (
                    <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                      <p className="text-xs text-gray-500 mb-1">Sada</p>
                      <p className="text-sm font-medium text-white">{result.setName}</p>
                    </div>
                  )}
                  {result.rarity && (
                    <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                      <p className="text-xs text-gray-500 mb-1">Rarita</p>
                      <p className="text-sm font-medium text-white">{result.rarity}</p>
                    </div>
                  )}
                  {result.condition && (
                    <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                      <p className="text-xs text-gray-500 mb-1">Stav</p>
                      <p className={`text-sm font-bold font-heading ${conditionColors[result.condition] || "text-white"}`}>
                        {result.condition}
                      </p>
                    </div>
                  )}
                  {result.language && result.language !== "en" && (
                    <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                      <p className="text-xs text-gray-500 mb-1">Jazyk</p>
                      <p className="text-sm font-medium text-white uppercase">{result.language}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {result.notes && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(0,200,255,0.04)] border border-[rgba(0,200,255,0.08)] mb-4 text-sm text-gray-400">
                    <Info className="h-4 w-4 text-[#00C8FF] flex-shrink-0 mt-0.5" />
                    {result.notes}
                  </div>
                )}

                {/* Auto-match badge */}
                {autoMatched && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-[#A7FF00]">
                    <Check className="h-3.5 w-3.5" />
                    Automaticky spárováno s databází
                  </div>
                )}

                {/* Manual search */}
                {!autoMatched && (
                  <>
                    <p className="text-sm text-gray-500 mb-3">
                      Vyberte kartu z databáze nebo upřesněte název:
                    </p>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        className="input pl-10"
                        placeholder="Hledat v databázi..."
                        value={cardSearch}
                        onChange={(e) => setCardSearch(e.target.value)}
                      />
                    </div>
                    <AnimatePresence>
                      {cardResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mb-3 rounded-xl border border-[rgba(0,200,255,0.15)] bg-[#0B1220] max-h-44 overflow-y-auto"
                        >
                          {cardResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setSelectedCard(c); setCardSearch(c.name); setCardResults([]); }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[rgba(0,200,255,0.06)] border-b border-[rgba(0,200,255,0.06)] last:border-0 transition-colors"
                            >
                              <span className="font-medium text-white">{c.name}</span>
                              <span className="text-gray-500 ml-2 text-xs">{c.setName}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Selected card + CTA */}
                {selectedCard && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.15)]"
                  >
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-white truncate">{selectedCard.name}</p>
                      <p className="text-xs text-gray-400">{selectedCard.setName}</p>
                    </div>
                    <button onClick={createAuction} className="btn-primary text-sm ml-3 flex-shrink-0">
                      Vytvořit aukci
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}

                {/* Rescan button */}
                <button
                  onClick={handleScan}
                  className="btn-ghost w-full mt-3 text-sm text-gray-500"
                >
                  <RefreshCw className="h-4 w-4" />
                  Skenovat znovu
                </button>
              </>
            ) : (
              /* Not detected */
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-[rgba(255,51,102,0.1)] flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-7 w-7 text-[#FF3366]" />
                </div>
                <h3 className="heading-md text-[#FF3366] mb-2">Karta nenalezena</h3>
                <p className="text-gray-400 text-sm mb-1">
                  {result.notes || "AI nedokázala identifikovat sběratelskou kartu."}
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Zkuste jiný úhel nebo lepší osvětlení.
                </p>

                {/* Manual search fallback */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="Hledat kartu ručně..."
                    value={cardSearch}
                    onChange={(e) => setCardSearch(e.target.value)}
                  />
                </div>
                <AnimatePresence>
                  {cardResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-3 rounded-xl border border-[rgba(0,200,255,0.15)] bg-[#0B1220] max-h-44 overflow-y-auto text-left"
                    >
                      {cardResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setSelectedCard(c); setCardSearch(c.name); setCardResults([]); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-[rgba(0,200,255,0.06)] border-b border-[rgba(0,200,255,0.06)] last:border-0"
                        >
                          <span className="font-medium text-white">{c.name}</span>
                          <span className="text-gray-500 ml-2 text-xs">{c.setName}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedCard && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.15)]">
                    <div className="min-w-0 text-left">
                      <p className="font-heading font-bold text-white truncate">{selectedCard.name}</p>
                      <p className="text-xs text-gray-400">{selectedCard.setName}</p>
                    </div>
                    <button onClick={createAuction} className="btn-primary text-sm ml-3 flex-shrink-0">
                      Vytvořit aukci <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <button onClick={reset} className="btn-ghost text-sm mt-3 text-gray-500">
                  <RefreshCw className="h-4 w-4" /> Zkusit znovu
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      {!image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="font-heading font-semibold text-sm text-gray-400 mb-3 uppercase tracking-wider">
            Tipy pro lepší výsledky
          </h3>
          <ul className="space-y-2 text-sm text-gray-500">
            {[
              "Fotografujte kartu na tmavém pozadí",
              "Dbejte na dobré osvětlení bez odlesků",
              "Karta musí být celá viditelná ve snímku",
              "Používejte minimálně 5 MPx fotoaparát",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#00C8FF] mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
