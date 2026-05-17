import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { toast } from "./Toast";
import api from "../services/api";

const REASONS = [
  { value: "fake", label: "Fake karta / padělek" },
  { value: "stolen_image", label: "Kradený obrázek" },
  { value: "scam", label: "Scam / podvod" },
  { value: "inappropriate", label: "Nevhodný obsah" },
  { value: "suspicious_price", label: "Podezřelá cena" },
  { value: "other", label: "Jiný důvod" },
];

interface Props {
  auctionId: string;
  open: boolean;
  onClose: () => void;
}

export default function ReportModal({ auctionId, open, onClose }: Props) {
  const { token } = useAuthStore();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !token) return;
    setSending(true);

    try {
      await api.post("/reports", { auctionId, reason, description });
      toast("success", "Děkujeme! Nahlášení bylo odesláno.");
      onClose();
    } catch {
      toast("error", "Nepodařilo se odeslat nahlášení.");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[rgba(0,200,255,0.15)] bg-[#0B1220] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="font-heading font-bold">Nahlásit aukci</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select className="input" value={reason} onChange={(e) => setReason(e.target.value)} required>
            <option value="">Vyber důvod...</option>
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <textarea className="input min-h-[100px]" placeholder="Popiš důvod nahlášení (nepovinné)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" disabled={sending || !reason} className="btn-primary w-full font-heading">
            {sending ? "Odesílám..." : "Odeslat nahlášení"}
          </button>
        </form>
      </div>
    </div>
  );
}
