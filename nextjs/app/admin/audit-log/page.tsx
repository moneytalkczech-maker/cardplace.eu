"use client";

import { useEffect, useState } from "react";
import { FileSearch, ChevronLeft, ChevronRight, User, Activity } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

interface AuditEntry {
  id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { id: string; username: string };
}

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Přihlášení",
  "auth.register": "Registrace",
  "auction.create": "Vytvoření aukce",
  "auction.bid": "Příhoz",
  "auction.cancel": "Zrušení aukce",
  "admin.deleteUser": "Smazání uživatele",
  "admin.updateRole": "Změna role",
};

function formatAction(action: string): string {
  return ACTION_LABELS[action] || action;
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/admin/audit-log", { params: { page, limit: 30 } })
      .then((r) => r.data)
      .then((response: any) => {
        const result = response.data || response;
        setLogs(Array.isArray(result) ? result : result.data || []);
        setTotalPages(result.totalPages || 1);
        setTotal(result.total || 0);
      })
      .catch((err: any) => {
        setError(err.response?.data?.error || "Chyba při načítání audit logu");
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <AdminLayout title="Audit Log">
      {error && <div className="text-red-400 text-sm py-4 text-center">{error}</div>}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[#0B1220]" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Žádné záznamy</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-[rgba(0,200,255,0.06)] bg-[#0B1220] p-4 hover:border-[rgba(0,200,255,0.15)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(0,200,255,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="h-4 w-4 text-[#00C8FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-heading font-semibold text-white">
                        {formatAction(log.action)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString("cs-CZ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {log.user && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user.username}
                        </span>
                      )}
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      {log.entityId && <span>ID: {log.entityId.slice(0, 12)}...</span>}
                    </div>
                    {log.metadata && (
                      <p className="text-xs text-gray-600 mt-1 font-mono truncate">{log.metadata}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(0,200,255,0.08)]">
              <p className="text-xs text-gray-500">Celkem {total} záznamů</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500 font-heading font-semibold">{page}/{totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
