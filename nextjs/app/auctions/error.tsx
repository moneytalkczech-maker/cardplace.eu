"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Gavel } from "lucide-react";
import Link from "next/link";

export default function AuctionsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-premium py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#0D1522] border border-[rgba(255,51,102,0.2)] flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="h-8 w-8 text-[#FF3366] opacity-70" />
      </div>
      <h1 className="text-2xl font-bold font-heading text-white mb-2">Aukce se nepodařilo načíst</h1>
      <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
        Nastala chyba při komunikaci se serverem. Zkus stránku obnovit.
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 btn-primary text-sm px-6 py-2.5"
        >
          <RefreshCw className="h-4 w-4" /> Zkusit znovu
        </button>
        <Link href="/" className="flex items-center gap-2 btn-secondary text-sm px-6 py-2.5">
          <Gavel className="h-4 w-4" /> Domů
        </Link>
      </div>
    </div>
  );
}
