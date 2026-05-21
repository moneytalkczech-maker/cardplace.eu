"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight, Database } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import AdminLayout from "@/components/layout/AdminLayout";

interface AdminCard {
  id: string;
  name: string;
  setName: string;
  setCode: string;
  category: string;
  cardNumber: string | null;
  rarity: string | null;
  status: string;
  estimatedPrice: number | null;
  createdAt: string;
  _count: { auctions: number };
}

const STATUS_OPTIONS = ["active", "archived", "hidden"];

export default function AdminCards() {
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCards = (p: number = page, s: string = search) => {
    setLoading(true);
    setError(null);
    adminApi.listCards(p, 50, s || undefined).then((response: any) => {
      setCards(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    }).catch((err: any) => {
      setError(err.response?.data?.error || "Chyba při načítání karet");
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCards(page, search); }, [page]);

  const handleSearch = () => { setPage(1); fetchCards(1, search); };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await adminApi.updateCardStatus(id, status);
      toast("success", "Status karty změněn");
      fetchCards();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při změně statusu");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Opravdu smazat kartu "${name}"?`)) return;
    try {
      await adminApi.deleteCard(id);
      toast("success", `Karta "${name}" smazána`);
      fetchCards();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při mazání");
    }
  };

  return (
    <AdminLayout title="Karty">
      {error && <div className="text-red-400 text-sm py-4 text-center">{error}</div>}
      <div className="mb-6 flex gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="input pl-10 w-full"
            placeholder="Hledat karty podle názvu nebo edice..."
          />
        </div>
        <button onClick={handleSearch} className="btn btn-primary text-sm px-4">Hledat</button>
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
                <th className="pb-3 pr-4 font-heading font-semibold">Název</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Edice</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Kategorie</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Číslo</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Rarita</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Status</th>
                <th className="pb-3 pr-4 font-heading font-semibold">Aukcí</th>
                <th className="pb-3 font-heading font-semibold">Akce</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} className="border-t border-[rgba(0,200,255,0.06)]">
                  <td className="py-3 pr-4">
                    <span className="font-heading font-semibold">{c.name}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{c.setName}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-heading font-semibold uppercase text-[#00C8FF]">{c.category}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{c.cardNumber || "—"}</td>
                  <td className="py-3 pr-4 text-gray-400">{c.rarity || "—"}</td>
                  <td className="py-3 pr-4">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className={`appearance-none bg-[#0B1220] border rounded-lg px-3 py-1 pr-8 text-xs font-heading font-semibold cursor-pointer transition-colors ${
                        c.status === "active" ? "border-green-500/30 text-green-400" :
                        c.status === "archived" ? "border-[rgba(0,200,255,0.3)] text-[#00C8FF]" :
                        "border-yellow-500/30 text-yellow-400"
                      }`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s === "active" ? "Aktivní" : s === "archived" ? "Archivováno" : "Skryté"}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{c._count?.auctions ?? 0}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      title="Smazat kartu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Žádné karty nenalezeny
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
