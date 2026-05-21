"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { useTranslation } from "@/hooks/useTranslation";
import AdminLayout from "@/components/layout/AdminLayout";

interface Report {
  id: string; reason: string; description: string | null; status: string; createdAt: string;
  auction: { id: string; title: string; status: string };
  reporter: { id: string; username: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400",
  reviewed: "text-[#00C8FF]",
  resolved: "text-[#A7FF00]",
  rejected: "text-red-400",
};

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const REASON_LABELS: Record<string, string> = {
    fake: t("admin.reasonFake"),
    stolen_image: t("admin.reasonStolen"),
    scam: t("admin.reasonScam"),
    inappropriate: t("admin.reasonInappropriate"),
    suspicious_price: t("admin.reasonPrice"),
    other: t("admin.reasonOther"),
  };

  const fetchReports = () => {
    setError(null);
    const params = filter ? `?status=${filter}` : "";
    api.get(`/reports${params}`).then((r) => setReports(r.data)).catch((err: any) => {
      setError(err.response?.data?.error || "Chyba při načítání nahlášení");
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/reports/${id}`, { status });
      toast("success", t("admin.reportUpdated"));
      fetchReports();
    } catch {
      toast("error", t("admin.reportUpdateError"));
    }
  };

  return (
    <AdminLayout title={t("admin.reports")}>
      {error && <div className="text-red-400 text-sm py-4 text-center">{error}</div>}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "pending", "reviewed", "resolved", "rejected"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`btn text-sm font-heading ${filter === s ? "btn-primary" : "btn-ghost"}`}>
            {s ? t(`admin.status${s.charAt(0).toUpperCase() + s.slice(1)}`) : t("admin.all")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">{[1,2,3].map((i) => <div key={i} className="h-16 bg-[#0B1220] rounded-xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-500">{t("admin.noReports")}</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${STATUS_COLORS[r.status] || ""}`}>
                      {t(`admin.status${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`)}
                    </span>
                    <span className="text-xs text-gray-600">| {new Date(r.createdAt).toLocaleDateString("cs-CZ")}</span>
                  </div>
                  <p className="font-heading font-semibold text-sm">{r.auction?.title || "?"}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("admin.reason")}: {REASON_LABELS[r.reason] || r.reason} | {t("admin.reportedBy")}: {r.reporter?.username || "?"} | {t("admin.auctionStatus")}: {r.auction?.status}
                  </p>
                  {r.description && <p className="text-xs text-gray-400 mt-1 italic">"{r.description}"</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/auctions/${r.auction?.id}`} className="btn-ghost text-xs"><ExternalLink className="h-3 w-3" /></Link>
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => updateStatus(r.id, "reviewed")} className="btn-ghost text-xs text-[#00C8FF]">{t("admin.review")}</button>
                      <button onClick={() => updateStatus(r.id, "resolved")} className="btn-ghost text-xs text-[#A7FF00]">{t("admin.resolve")}</button>
                      <button onClick={() => updateStatus(r.id, "rejected")} className="btn-ghost text-xs text-red-400">{t("admin.reject")}</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
