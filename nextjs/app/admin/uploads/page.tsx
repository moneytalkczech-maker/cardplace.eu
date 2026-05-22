"use client";

import { useEffect, useState } from "react";
import { Upload, Image, FileText, Trash2, ChevronLeft, ChevronRight, HardDrive } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import AdminLayout from "@/components/layout/AdminLayout";

interface AdminUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  user: { id: string; username: string } | null;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminUploads() {
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalSize, setTotalSize] = useState(0);

  const fetchUploads = (p: number = page) => {
    setLoading(true);
    setError(null);
    adminApi.listUploads(p, 50).then((response: { data: AdminUpload[]; total: number; totalPages: number }) => {
      setUploads(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
      setTotalSize(response.data.reduce((acc, u) => acc + u.size, 0));
    }).catch((err: any) => {
      setError(err.response?.data?.error || "Chyba při načítání uploadů");
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUploads(page); }, [page]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Opravdu smazat soubor "${name}"?`)) return;
    try {
      await adminApi.deleteUpload(id);
      toast("success", `Soubor "${name}" smazán`);
      fetchUploads();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při mazání");
    }
  };

  const getIcon = (mime: string) => {
    if (mime.startsWith("image/")) return <Image className="h-4 w-4 text-[#00C8FF]" />;
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  return (
    <AdminLayout title="Uploady">
      {error && <div className="text-red-400 text-sm py-4 text-center">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="h-4 w-4 text-[#00C8FF]" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase tracking-wider">Celkem souborů</span>
          </div>
          <p className="text-2xl font-bold font-heading">{total}</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="h-4 w-4 text-[#A7FF00]" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase tracking-wider">Velikost (aktuální str.)</span>
          </div>
          <p className="text-2xl font-bold font-heading">{formatSize(totalSize)}</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Image className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase tracking-wider">Obrázků</span>
          </div>
          <p className="text-2xl font-bold font-heading">{uploads.filter((u) => u.mimeType.startsWith("image/")).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 rounded-xl bg-[#0B1220]" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="pb-3 pr-4 font-heading font-semibold">Soubor</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Typ</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Velikost</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Entita</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Uživatel</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Datum</th>
                <th className="pb-3 font-heading font-semibold">Akce</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => (
                <tr key={u.id} className="border-t border-[rgba(0,200,255,0.06)]">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {getIcon(u.mimeType)}
                      <span className="font-heading font-semibold truncate max-w-[200px]">{u.originalName}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">{u.mimeType}</td>
                  <td className="py-3 pr-4 text-gray-400">{formatSize(u.size)}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#0B1220] text-gray-400">
                      {u.entityType || "—"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{u.user?.username || "—"}</td>
                  <td className="py-3 pr-4 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(u.id, u.originalName)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      title="Smazat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {uploads.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Žádné nahrané soubory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-[rgba(0,200,255,0.08)] mt-6">
          <p className="text-xs text-gray-500">Celkem: {total} • Stránka: {page} / {totalPages}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500 font-heading font-semibold">{page}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
