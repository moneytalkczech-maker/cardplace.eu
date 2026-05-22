"use client";
import Link from "next/link";
import { Gavel, Home, ArrowLeft, Search } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00C8FF] to-[#A7FF00] opacity-10 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#0D1522] to-[#0B1220] border border-[rgba(0,200,255,0.2)] flex items-center justify-center">
            <Gavel className="h-10 w-10 text-[#00C8FF] opacity-50" />
          </div>
        </div>

        <h1 className="text-8xl font-bold font-heading text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-bold font-heading text-white mb-3">{t("404.heading")}</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">{t("404.desc")}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#A7FF00] to-[#5CFF00] text-[#050A12] font-bold font-heading shadow-lg shadow-[rgba(124,255,0,0.3)] hover:shadow-[rgba(124,255,0,0.5)] hover:-translate-y-0.5 transition-all duration-300">
            <Home className="h-5 w-5" /> {t("404.home")}
          </Link>
          <Link href="/auctions" className="flex items-center gap-2 px-8 py-3.5 rounded-2xl border border-[rgba(0,200,255,0.3)] text-[#00C8FF] font-bold font-heading hover:bg-[rgba(0,200,255,0.1)] hover:border-[rgba(0,200,255,0.5)] transition-all duration-300">
            <Search className="h-5 w-5" /> {t("404.auctions")}
          </Link>
        </div>

        <button onClick={() => window.history.back()} className="mt-8 flex items-center gap-2 mx-auto text-sm text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("404.back")}
        </button>
      </div>
    </div>
  );
}
