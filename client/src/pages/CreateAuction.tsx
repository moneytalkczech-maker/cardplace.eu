import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Upload, Link as LinkIcon, Camera, Loader2 } from "lucide-react";
import { auctions, upload } from "../services/api";
import { searchCards } from "../lib/CardsDB";
import { useTranslation } from "../hooks/useTranslation";

export default function CreateAuction() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startingPrice: "",
    endTime: "",
    cardId: "",
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
    setForm((f) => ({
      ...f,
      cardId: card.id,
      title: card.name,
    }));
    setCardSearch("");
    setCardResults([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await upload.image(file);
      setUploadedImage(URL.createObjectURL(file));
      setForm((f) => ({ ...f, imageUrl: result.url }));
    } catch {
      // fallback to base64 if upload fails
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const minEndTime = new Date();
      minEndTime.setHours(minEndTime.getHours() + 1);
      if (new Date(form.endTime) < minEndTime) {
        setError(t("create.errorMinTime"));
        setSubmitting(false);
        return;
      }
      const result = await auctions.create({
        ...form,
        startingPrice: parseFloat(form.startingPrice),
      });
      navigate(`/auctions/${result.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || t("create.errorGeneric"));
    }
    setSubmitting(false);
  };

  const minEndTime = new Date();
  minEndTime.setHours(minEndTime.getHours() + 1);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t("create.title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-400">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("create.searchCard")}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              className="input pl-10"
              placeholder={t("create.searchPlaceholder")}
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
            />
          </div>
          {cardResults.length > 0 && (
            <div className="mt-1 rounded-lg border border-gray-700 bg-gray-900 max-h-48 overflow-y-auto">
              {cardResults.map((card) => (
                <button
                  key={`${card.setCode}-${card.cardNumber}`}
                  type="button"
                  onClick={() => selectCard(card)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-800 border-b border-gray-800 last:border-0"
                >
                  <span className="font-medium">{card.name}</span>
                  <span className="text-gray-500 ml-2">{card.setName}</span>
                  {card.rarity && <span className="text-yellow-400 ml-2">{card.rarity}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCard && (
          <div className="flex items-center justify-between card">
            <div>
              <p className="font-medium">{selectedCard.name}</p>
              <p className="text-sm text-gray-400">{selectedCard.setName} • {selectedCard.rarity}</p>
            </div>
            <button type="button" onClick={() => { setSelectedCard(null); setForm((f) => ({ ...f, cardId: "", title: "" })); }} className="btn-ghost p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("create.titleLabel")}</label>
          <input
            type="text"
            className="input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("create.description")}</label>
          <textarea
            className="input min-h-[100px] resize-y"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("create.startingPrice")}</label>
            <input
              type="number"
              step="1"
              min="1"
              className="input"
              value={form.startingPrice}
              onChange={(e) => setForm((f) => ({ ...f, startingPrice: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("create.endTime")}</label>
            <input
              type="datetime-local"
              className="input"
              min={minEndTime.toISOString().slice(0, 16)}
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("create.imageLabel")}</label>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setImageTab("upload")} className={`btn text-sm flex-1 ${imageTab === "upload" ? "btn-primary" : "btn-ghost"}`}>
              <Camera className="h-4 w-4" /> {t("create.uploadTab")}
            </button>
            <button type="button" onClick={() => setImageTab("url")} className={`btn text-sm flex-1 ${imageTab === "url" ? "btn-primary" : "btn-ghost"}`}>
              <LinkIcon className="h-4 w-4" /> {t("create.urlTab")}
            </button>
          </div>

          {imageTab === "upload" ? (
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="aspect-video rounded-lg border-2 border-dashed border-gray-700 hover:border-blue-500 cursor-pointer transition-colors flex items-center justify-center bg-gray-800/50"
            >
              {uploading ? (
                <div className="text-center text-blue-400">
                  <Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">{t("common.loading")}</p>
                </div>
              ) : uploadedImage ? (
                <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <div className="text-center text-gray-500">
                  <Upload className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm font-medium">{t("create.dragDrop")}</p>
                  <p className="text-xs mt-1">{t("create.photoHint")}</p>
                </div>
              )}
            </div>
          ) : (
            <input
              type="url"
              className="input"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder={t("create.imagePlaceholder")}
            />
          )}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full text-base py-3">
          {submitting ? t("create.submitting") : t("create.submit")}
        </button>
      </form>
    </div>
  );
}
