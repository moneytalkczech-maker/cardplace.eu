"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050A12] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[#0D1522] border border-[rgba(255,51,102,0.3)] flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-[#FF3366]" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-white mb-2">Chyba admin stránky</h1>
        <p className="text-gray-500 text-sm mb-6">
          {error.message || "Nastala neočekávaná chyba při načítání admin sekce."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C8FF] text-[#050A12] font-bold font-heading text-sm hover:bg-[#33B1FF] transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Zkusit znovu
          </button>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[rgba(0,200,255,0.2)] text-[#00C8FF] font-heading text-sm hover:bg-[rgba(0,200,255,0.08)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
