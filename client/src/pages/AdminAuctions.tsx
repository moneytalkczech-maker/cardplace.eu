import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, XCircle, ChevronLeft, ChevronRight, ExternalLink, Star } from "lucide-react";
import { adminApi } from "../services/api";
import { toast } from "../components/Toast";
import { useTranslation } from "../hooks/useTranslation";
import AdminLayout from "../components/AdminLayout";

interface AdminAuction {
  id: string;
  title: string;
  status: string;
  currentPrice: number;
  createdAt: string;
  endTime: string;
  featured: boolean;
  user: { id: string; username: string };
  _count: { bids: number };
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-[#A7FF00]",
  ENDED: "text-[#00C8FF]",
  CANCELLED: "text-red-400",
  pending_review: "text-yellow-400",
};

export default function AdminAuctions() {
  const { t } = useTranslation();
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchAuctions = (p: number = page) => {
    setLoading(true);
    adminApi.listAuctions(p, 50).then((response: any) => {
      const result = response.data ? response.data : response;
      setAuctions(Array.isArray(result) ? result : result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAuctions(page); }, [page]);

  const handleCancel = async (id: string, title: string) => {
    if (!confirm(`Opravdu chceš zrušit aukci "${title}"?`)) return;
    try {
      await adminApi.cancelAuction(id);
      toast("success", t("admin.auctionCancelled"));
      fetchAuctions(page);
    } catch (err: any) {
      toast("error", err.response?.data?.error || t("admin.cancelError"));
    }
  };

  const handleFeatureToggle = async (id: string) => {
    try {
      const result = await adminApi.toggleAuctionFeature(id);
      toast("success", result.featured ? t("admin.auctionFeatured") : t("admin.auctionUnfeatured"));
      fetchAuctions(page);
    } catch (err: any) {
      toast("error", err.response?.data?.error || t("admin.featureError"));
    }
  };

  const filtered = auctions.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.user?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title={t("admin.auctions")}>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
            placeholder={t("admin.searchAuctions")}
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[#0B1220]" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${STATUS_COLORS[a.status] || "text-gray-500"}`}>
                    {a.status === "ACTIVE" ? t("admin.statusActive") : a.status === "ENDED" ? t("admin.statusEnded") : a.status === "CANCELLED" ? t("admin.statusCancelled") : a.status}
                  </span>
                  {a.featured && (
                    <span className="text-xs font-bold text-[#00C8FF]">⭐ {t("admin.featured")}</span>
                  )}
                </div>
                <p className="font-heading font-semibold text-sm truncate">{a.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {a.user?.username || "?"} · {a.currentPrice} Kč ·{" "}
                  {a._count?.bids ?? 0} {t("admin.bids")} ·{" "}
                  {new Date(a.createdAt).toLocaleDateString("cs-CZ")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleFeatureToggle(a.id)}
                  className={`btn-ghost text-xs p-2 ${a.featured ? "text-[#00C8FF]" : "text-gray-600"}`}
                  title={a.featured ? t("admin.unfeatureAuction") : t("admin.featureAuction")}
                >
                  <Star className={`h-4 w-4 ${a.featured ? "fill-current" : ""}`} />
                </button>
                <Link
                  to={`/auctions/${a.id}`}
                  className="btn-ghost text-xs p-2"
                  title={t("admin.viewAuction")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                {a.status !== "CANCELLED" && a.status !== "ENDED" && (
                  <button
                    onClick={() => handleCancel(a.id, a.title)}
                    className="btn-ghost text-xs text-red-400 p-2"
                    title={t("admin.cancelAuction")}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">{t("admin.noAuctionsFound")}</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-[rgba(0,200,255,0.08)] mt-6">
          <p className="text-xs text-gray-500">
            {t("admin.totalAuctions")}: {total} • {t("admin.page")}: {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500 font-heading font-semibold">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
