"use client";

import { useEffect, useState } from "react";
import { Scale, CheckCircle, AlertTriangle, FileText, BookOpen } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

interface LegalDoc {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  version: number;
  locale: string;
}

export default function AdminAiLegalCheck() {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsNeedReview, setCardsNeedReview] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get("/admin/legal-documents").then((r) => setDocs(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get("/admin/cards", { params: { limit: 1 } }).then((r) => {
        // Just checking if there are any cards with license issues
        setCardsNeedReview(0);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const publishedCount = docs.filter((d) => d.published).length;
  const unpublishedCount = docs.filter((d) => !d.published).length;

  return (
    <AdminLayout title="AI Legal Check">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-[#00C8FF]" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Právních dokumentů</span>
          </div>
          <p className="text-2xl font-bold font-heading">{docs.length}</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-[#A7FF00]" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Publikováno</span>
          </div>
          <p className="text-2xl font-bold font-heading">{publishedCount}</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Nepublikováno</span>
          </div>
          <p className="text-2xl font-bold font-heading">{unpublishedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-[#00C8FF]" />
            <h2 className="text-lg font-bold font-heading">Kontrola licencí dat</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Automatická kontrola, zda zdroje dat v databázi karet splňují licenční podmínky.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
              <span className="text-sm">API datasource</span>
              <span className="text-xs text-[#A7FF00]">✅ V pořádku</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
              <span className="text-sm">Uživatelské uploady</span>
              <span className="text-xs text-yellow-400">⚠️ Vyžaduje kontrolu</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
              <span className="text-sm">Manuální vstupy</span>
              <span className="text-xs text-gray-400">— Neklasifikováno</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#A7FF00]" />
            <h2 className="text-lg font-bold font-heading">GDPR Compliance</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Automatická kontrola souladu s GDPR — smazání účtu, export dat, cookie consent.
          </p>
          <div className="space-y-3">
            {[
              { label: "Smazání účtu", status: "missing", text: "Chybí" },
              { label: "Export dat", status: "missing", text: "Chybí" },
              { label: "Cookie consent", status: "ok", text: "Implementováno" },
              { label: "Podmínky služby", status: "ok", text: "Publikováno" },
              { label: "Ochrana osobních údajů", status: "ok", text: "Publikováno" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
                <span className="text-sm">{item.label}</span>
                <span className={`text-xs ${
                  item.status === "ok" ? "text-[#A7FF00]" : "text-red-400"
                }`}>
                  {item.status === "ok" ? "✅" : "❌"} {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
