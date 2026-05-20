"use client";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, X, Upload, Link as LinkIcon, Camera, Loader2, Info,
  Eye, Gavel, Clock, ShieldCheck,
} from "lucide-react";
import { auctions, upload } from "@/lib/api";
import { searchCards } from "@/lib/CardsDB";
import { toast } from "@/components/ui/Toast";

const CONDITIONS = [
  { value: "NM", label: "Near Mint", description: "Perfektní stav, jako nová", color: "text-green-400" },
  { value: "LP", label: "Lightly Played", description: "Minimální opotřebení, hranatelné", color: "text-[#00C8FF]" },
  { value: "MP", label: "Moderately Played", description: "Viditelné znaky hraní", color: "text-yellow-400" },
  { value: "HP", label: "Heavily Played", description: "Výrazné poškození", color: "text-orange-400" },
  { value: "DMG", label: "Damaged", description: "Těžce poškozená, nehratelná", color: "text-red-400" },
];

function CreateAuctionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: searchParams.get("name") || "",
    description: "",
    condition: "NM",
    startingPrice: "",
    buyNowPrice: "",
    endTime: "",
    cardId: searchParams.get("card") || "",
    imageUrl: "",
  });

  const [cardSearch, setCardSearch] = useState("");
  const [cardResults, setCardResults] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmedOriginal, setConfirmedOriginal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (cardSearch.length < 2) { setCardResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await searchCards(cardSearch);
      if (!cancelled) setCardResults(results);
    }, 150);
    return () => { clearTimeout(timer); cancelled = true; };
  }, [cardSearch]);

  const selectCard = (card: any) => {
    setSelectedCard(card);
    setForm((f) => ({ ...f, cardId: card.id, title: card.name }));
    setCardSearch("");
    setCardResults([]);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("error", "Podporovány jsou pouze obrázky");
      return;
    }
    setUploading(true);
    try {
      const result = await upload.image(file);
      setUploadedImage(URL.createObjectURL(file));
      setForm((f) => ({ ...f, imageUrl: result.url }));
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setUploadedImage(dataUrl);
        setForm((f) => ({ ...f, imageUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
    setUploading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const minEndTime = new Date();
    minEndTime.setHours(minEndTime.getHours() + 1);
    if (new Date(form.endTime) < minEndTime) {
      setError("Aukce musí trvat alespoň 1 hodinu.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await auctions.create({
        ...form,
        startingPrice: parseFloat(form.startingPrice),
        buyNowPrice: form.buyNowPrice ? parseFloat(form.buyNowPrice) : undefined,
        confirmedOriginal: true,
      });
      router.push(`/auctions/${result.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Nepodařilo se vytvořit aukci. Zkuste to znovu.");
    }
    setSubmitting(false);
  };

  const minEndTime = new Date();
  minEndTime.setHours(minEndTime.getHours() + 1);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="heading-lg mb-2">Vytvořit aukci</h1>
      <p className="text-sm text-gray-500 mb-6">Přidej kartu do aukce a nech ostatní sběratele nabízet</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-900/30 border border-red-800/50 p-3 text-sm text-red-400">{error}</div>
        )}

        {/* Card search */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Vyhledat kartu v databázi</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Název karty, sada…"
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
            />
          </div>
          {cardResults.length > 0 && (
            <div className="mt-1 rounded-xl border border-[rgba(0,200,255,0.15)] bg-[#0B1220] max-h-48 overflow-y-auto shadow-xl">
              {cardResults.map((card) => (
                <button
                  key={`${card.setCode}-${card.cardNumber}`}
                  type="button"
                  onClick={() => selectCard(card)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[rgba(0,200,255,0.06)] border-b border-[rgba(0,200,255,0.08)] last:border-0 transition-colors"
                >
                  <span className="font-medium">{card.name}</span>
                  <span className="text-gray-500 ml-2">{card.setName}</span>
                  {card.rarity && <span className="text-yellow-400 ml-2 text-xs">{card.rarity}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected card chip */}
        {selectedCard && (
          <div className="flex items-center justify-between card py-2.5 px-3">
            <div className="flex items-center gap-3">
              {selectedCard.imageUrl && (
                <img src={selectedCard.imageUrl} alt={selectedCard.name} className="w-10 h-10 rounded-lg object-cover" />
              )}
              <div>
                <p className="font-medium text-sm">{selectedCard.name}</p>
                <p className="text-xs text-gray-500">{selectedCard.setName} · {selectedCard.rarity}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedCard(null); setForm((f) => ({ ...f, cardId: "", title: "" })); }}
              className="btn-ghost p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Název aukce <span className="text-red-400">*</span></label>
          <input
            type="text"
            className="input"
            placeholder="Např. Charizard VMAX Secret Rare"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Popis</label>
          <textarea
            className="input min-h-[90px] resize-y"
            placeholder="Detailní popis stavu karty, případná poškození, bonus…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Stav karty <span className="text-red-400">*</span>
            <span className="text-gray-500 font-normal ml-1 text-xs">(vyžadováno)</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, condition: c.value }))}
                className={`relative p-2 rounded-xl text-center transition-all duration-200 border ${
                  form.condition === c.value
                    ? "border-[#00C8FF] bg-[rgba(0,200,255,0.1)] shadow-sm shadow-[rgba(0,200,255,0.2)]"
                    : "border-[rgba(0,200,255,0.1)] bg-[rgba(0,0,0,0.2)] hover:border-[rgba(0,200,255,0.3)]"
                }`}
              >
                <span className={`block text-sm font-heading font-bold ${c.color}`}>{c.value}</span>
                <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">{c.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
            <Info className="h-3 w-3 flex-shrink-0" />
            {CONDITIONS.find((c) => c.value === form.condition)?.description}
          </p>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Vyvolávací cena (Kč) <span className="text-red-400">*</span></label>
            <input
              type="number"
              step="1"
              min="1"
              className="input"
              placeholder="Např. 100"
              value={form.startingPrice}
              onChange={(e) => setForm((f) => ({ ...f, startingPrice: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Koupit ihned (Kč)</label>
            <input
              type="number"
              step="1"
              min="1"
              className="input"
              placeholder="Volitelné"
              value={form.buyNowPrice}
              onChange={(e) => setForm((f) => ({ ...f, buyNowPrice: e.target.value }))}
            />
          </div>
        </div>

        {/* End time */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Konec aukce <span className="text-red-400">*</span></label>
          <input
            type="datetime-local"
            className="input"
            min={minEndTime.toISOString().slice(0, 16)}
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            required
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Aukce musí trvat alespoň 1 hodinu
          </p>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Fotografie karty</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setImageTab("upload")}
              className={`flex items-center gap-2 text-sm flex-1 px-3 py-2 rounded-xl border transition-all font-heading font-semibold ${
                imageTab === "upload"
                  ? "border-[#00C8FF] bg-[rgba(0,200,255,0.1)] text-[#00C8FF]"
                  : "border-[rgba(0,200,255,0.15)] text-gray-400 hover:border-[rgba(0,200,255,0.3)]"
              }`}
            >
              <Camera className="h-4 w-4" /> Nahrát
            </button>
            <button
              type="button"
              onClick={() => setImageTab("url")}
              className={`flex items-center gap-2 text-sm flex-1 px-3 py-2 rounded-xl border transition-all font-heading font-semibold ${
                imageTab === "url"
                  ? "border-[#00C8FF] bg-[rgba(0,200,255,0.1)] text-[#00C8FF]"
                  : "border-[rgba(0,200,255,0.15)] text-gray-400 hover:border-[rgba(0,200,255,0.3)]"
              }`}
            >
              <LinkIcon className="h-4 w-4" /> URL odkaz
            </button>
          </div>

          {imageTab === "upload" ? (
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`aspect-video rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex items-center justify-center overflow-hidden ${
                isDragOver
                  ? "border-[#00C8FF] bg-[rgba(0,200,255,0.1)] scale-[1.01]"
                  : uploadedImage
                    ? "border-[rgba(0,200,255,0.2)] hover:border-[#00C8FF]"
                    : "border-[rgba(0,200,255,0.15)] hover:border-[rgba(0,200,255,0.4)] bg-[rgba(0,200,255,0.03)]"
              }`}
            >
              {uploading ? (
                <div className="text-center text-[#00C8FF]">
                  <Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Nahrávám…</p>
                </div>
              ) : uploadedImage ? (
                <img src={uploadedImage} alt="Náhled" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-gray-500 select-none">
                  <Upload className="h-10 w-10 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm font-medium">Přetáhni fotku sem nebo klikni</p>
                  <p className="text-xs mt-1 text-gray-600">JPG, PNG, WEBP · max 10 MB</p>
                </div>
              )}
            </div>
          ) : (
            <input
              type="url"
              className="input"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://example.com/karta.jpg"
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Confirm original */}
        <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[rgba(0,200,255,0.1)] bg-[rgba(0,0,0,0.2)] cursor-pointer hover:border-[rgba(0,200,255,0.3)] transition-colors">
          <input
            type="checkbox"
            checked={confirmedOriginal}
            onChange={(e) => setConfirmedOriginal(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[rgba(0,200,255,0.2)] accent-[#00C8FF]"
            required
          />
          <span className="text-sm text-gray-300 leading-snug">
            Potvrzuji, že nabízená karta je originální a odpovídá popisu. Falzifikáty vedou k trvalému banu.{" "}
            <span className="text-red-400">*</span>
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !confirmedOriginal}
          className="btn-primary w-full text-base py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Vytvářím aukci…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Gavel className="h-4 w-4" /> Spustit aukci
            </span>
          )}
        </button>

        {/* Preview */}
        {(form.title || form.description || form.startingPrice) && (
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="w-full text-sm py-2.5 rounded-xl border border-[rgba(0,200,255,0.2)] text-[#00C8FF] hover:bg-[rgba(0,200,255,0.05)] transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" /> Náhled aukce
          </button>
        )}
      </form>

      {/* Preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-[#0B1220] border border-[rgba(0,200,255,0.15)] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[rgba(0,200,255,0.08)]">
              <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#00C8FF]" />
                Náhled aukce
              </h2>
              <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-[rgba(0,200,255,0.1)] transition-colors">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#050A12] border border-[rgba(0,200,255,0.1)] flex items-center justify-center">
                {uploadedImage || form.imageUrl ? (
                  <img src={uploadedImage || form.imageUrl} alt={form.title} className="w-full h-full object-contain" />
                ) : (
                  <Gavel className="h-16 w-16 text-[rgba(0,200,255,0.15)]" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold font-heading">{form.title || "Název aukce"}</h3>
                {form.condition && (
                  <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded ${
                    form.condition === "NM" ? "bg-green-900/40 text-green-300" :
                    form.condition === "LP" ? "bg-[rgba(0,200,255,0.15)] text-[#00C8FF]" :
                    form.condition === "MP" ? "bg-yellow-900/40 text-yellow-300" :
                    form.condition === "HP" ? "bg-orange-900/40 text-orange-300" :
                    "bg-red-900/40 text-red-300"
                  }`}>
                    {form.condition}
                  </span>
                )}
              </div>

              {form.description && (
                <p className="text-sm text-gray-400 leading-relaxed">{form.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-3 bg-[rgba(0,200,255,0.06)] border border-[rgba(0,200,255,0.1)] text-center">
                  <p className="text-xs text-gray-500 font-heading uppercase">Vyvolávací cena</p>
                  <p className="text-2xl font-bold font-heading text-[#A7FF00]">
                    {form.startingPrice ? `${parseFloat(form.startingPrice).toLocaleString("cs-CZ")} Kč` : "—"}
                  </p>
                </div>
                {form.buyNowPrice && (
                  <div className="rounded-xl p-3 bg-[rgba(255,107,53,0.06)] border border-[rgba(255,107,53,0.1)] text-center">
                    <p className="text-xs text-gray-500 font-heading uppercase">Koupit ihned</p>
                    <p className="text-2xl font-bold font-heading text-[#FF6B35]">
                      {parseFloat(form.buyNowPrice).toLocaleString("cs-CZ")} Kč
                    </p>
                  </div>
                )}
              </div>

              {form.endTime && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Konec: {new Date(form.endTime).toLocaleString("cs-CZ")}</span>
                </div>
              )}

              {selectedCard && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(0,200,255,0.04)] border border-[rgba(0,200,255,0.08)]">
                  {selectedCard.imageUrl && (
                    <img src={selectedCard.imageUrl} alt={selectedCard.name} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-heading font-semibold text-sm">{selectedCard.name}</p>
                    <p className="text-xs text-gray-500">{selectedCard.setName} · {selectedCard.rarity}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-[#00C8FF]" />
                <span>Bezpečná aukce</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateAuctionPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8 animate-pulse"><div className="h-96 rounded-xl bg-[#0B1220]" /></div>}>
      <CreateAuctionContent />
    </Suspense>
  );
}
