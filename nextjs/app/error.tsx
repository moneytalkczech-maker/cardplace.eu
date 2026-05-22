"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF3366] to-[#FF6633] opacity-10 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#0D1522] to-[#0B1220] border border-[rgba(255,51,102,0.3)] flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-[#FF3366] opacity-70" />
          </div>
        </div>

        <h1 className="text-4xl font-bold font-heading text-white mb-3">Něco se pokazilo</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Nastala neočekávaná chyba. Zkus stránku obnovit nebo se vrať na úvodní stránku.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#00C8FF] to-[#0099CC] text-white font-bold font-heading shadow-lg shadow-[rgba(0,200,255,0.3)] hover:shadow-[rgba(0,200,255,0.5)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <RefreshCw className="h-5 w-5" /> Zkusit znovu
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl border border-[rgba(0,200,255,0.3)] text-[#00C8FF] font-bold font-heading hover:bg-[rgba(0,200,255,0.1)] hover:border-[rgba(0,200,255,0.5)] transition-all duration-300"
          >
            <Home className="h-5 w-5" /> Domů
          </Link>
        </div>
      </div>
    </div>
  );
}
