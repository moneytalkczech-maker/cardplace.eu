import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import api from "../services/api";

export default function AdminAiPricing() {
  const [stats, setStats] = useState<{ users: number; auctions: number; bids: number; transactions: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="AI Pricing">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5 col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-[#00C8FF]" />
            <h2 className="text-lg font-bold font-heading">AI Cenový odhad</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            AI model odhaduje ceny karet na základě historických transakcí, eBay a Cardmarket dat.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#0B1220] p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[#A7FF00]" />
                <span className="text-xs text-gray-500 font-heading font-semibold">Odhadovaná cena</span>
              </div>
              <div className="text-2xl font-bold font-heading">—</div>
            </div>
            <div className="rounded-lg bg-[#0B1220] p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-[#00C8FF]" />
                <span className="text-xs text-gray-500 font-heading font-semibold">Nejnižší</span>
              </div>
              <div className="text-2xl font-bold font-heading">—</div>
            </div>
            <div className="rounded-lg bg-[#0B1220] p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-gray-500 font-heading font-semibold">Poslední prodej</span>
              </div>
              <div className="text-2xl font-bold font-heading">—</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-[#A7FF00]" />
            <h2 className="text-lg font-bold font-heading">Statistiky</h2>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 rounded-lg bg-[#0B1220]" />)}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
                <span className="text-gray-400">Transakcí</span>
                <span className="font-heading font-semibold">{stats?.transactions ?? 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
                <span className="text-gray-400">Aukcí</span>
                <span className="font-heading font-semibold">{stats?.auctions ?? 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Uživatelů</span>
                <span className="font-heading font-semibold">{stats?.users ?? 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-[#00C8FF]" />
          <h2 className="text-lg font-bold font-heading">Plánované funkce</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: "Trénování modelu", desc: "Automatické trénování na transakcích", status: "planned" },
            { name: "Batch predikce", desc: "Hromadný odhad cen pro edice", status: "planned" },
            { name: "Cenová historie", desc: "Grafy vývoje cen karet", status: "planned" },
            { name: "API pro vývojáře", desc: "Veřejné API pro cenové odhady", status: "planned" },
          ].map((f) => (
            <div key={f.name} className="rounded-lg bg-[#0B1220] p-4">
              <p className="text-sm font-heading font-semibold mb-1">{f.name}</p>
              <p className="text-xs text-gray-500 mb-2">{f.desc}</p>
              <span className="text-xs text-gray-600 italic">Plánováno</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
