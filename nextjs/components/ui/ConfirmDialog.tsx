"use client";
import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message,
  confirmLabel = "Potvrdit", cancelLabel = "Zrušit",
  danger, onConfirm, onCancel
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => confirmRef.current?.focus(), 50);
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm mx-4 rounded-xl border border-[rgba(0,200,255,0.15)] bg-[#0B1220] p-6 shadow-2xl animate-scale-in"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${danger ? "bg-[rgba(239,68,68,0.15)]" : "bg-[rgba(0,200,255,0.15)]"}`}>
              <AlertTriangle className={`h-5 w-5 ${danger ? "text-red-400" : "text-[#00C8FF]"}`} />
            </div>
            <h3 className="text-lg font-bold font-heading">{title}</h3>
          </div>
          <button onClick={onCancel} className="btn-ghost p-1"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost text-sm font-heading">{cancelLabel}</button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`text-sm font-heading rounded-xl px-4 py-2 font-semibold transition-all ${
              danger
                ? "bg-[#FF0044] text-white hover:bg-[#FF3366]"
                : "btn-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
