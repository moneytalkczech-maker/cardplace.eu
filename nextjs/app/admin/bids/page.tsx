"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gavel, ChevronLeft, ChevronRight, User, Link as LinkIcon } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  user?: { id: string; username: string };
  auction?: { id: string; title: string };
}

export default function AdminBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get("/admin/bids", { params: { page, limit: 30 } })
      .then((r) => r.data)
      .then((response: any) => {
        const result = response.data || response;
        setBids(Array.isArray(result) ? result : result.data || []);
        setTotalPages(result.totalPages || 1);
        setTotal(result.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <AdminLayout title="Příhozy">
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[#0B1220]" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {bids.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Gavel className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Žádné příhozy</p>
            </div>
          ) : (
            bids.map((bid) => (
              <div
                key={bid.id}
                className="rounded-xl border border-[rgba(0,200,255,0.06)] bg-[#0B1220] p-4 hover:border-[rgba(0,200,255,0.15)] transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
                      <Gavel className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-[#A7FF00]">
                        {bid.amount.toLocaleString("cs-CZ")} Kč
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {bid.user?.username || "?"}
                        </span>
                        <span>•</span>
                        <span>{new Date(bid.createdAt).toLocaleString("cs-CZ")}</span>
                      </div>
                    </div>
                  </div>
                  {bid.auction && (
                    <Link
                      href={`/auctions/${bid.auction.id}`}
                      className="flex items-center gap-1.5 text-xs text-[#00C8FF] hover:text-[#33B1FF] transition-colors flex-shrink-0"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline truncate max-w-[200px]">{bid.auction.title}</span>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(0,200,255,0.08)]">
              <p className="text-xs text-gray-500">Celkem {total} příhozů</p>
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
