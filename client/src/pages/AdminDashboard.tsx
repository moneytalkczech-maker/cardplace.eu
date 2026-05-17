import { useEffect, useState } from "react";
import { Users, ShoppingBag, Gavel, CreditCard, Layers, TrendingUp, Activity } from "lucide-react";
import { adminApi } from "../services/api";
import AdminLayout from "../components/AdminLayout";
import { Shield } from "lucide-react";

interface Stats {
  users: number;
  auctions: number;
  bids: number;
  transactions: number;
  collections: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Uživatelé", value: stats?.users ?? 0, icon: Users, color: "text-[#00C8FF]", bg: "bg-[rgba(0,200,255,0.1)]" },
    { label: "Aukce", value: stats?.auctions ?? 0, icon: ShoppingBag, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Příhozy", value: stats?.bids ?? 0, icon: Gavel, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Transakce", value: stats?.transactions ?? 0, icon: CreditCard, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Sbírky", value: stats?.collections ?? 0, icon: Layers, color: "text-pink-400", bg: "bg-pink-500/10" },
  ];

  return (
    <AdminLayout title="Přehled">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse h-28 rounded-xl bg-[#0B1220]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-heading font-semibold text-gray-500 uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold font-heading">{card.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-[#00C8FF]" />
                <h2 className="text-lg font-bold font-heading">Rychlé akce</h2>
              </div>
              <div className="space-y-3">
                <a href="/admin/users" className="block p-3 rounded-lg bg-[#0B1220] hover:bg-[rgba(0,200,255,0.06)] transition-colors">
                  <p className="font-heading font-semibold text-sm">Spravovat uživatele</p>
                  <p className="text-xs text-gray-500 mt-0.5">Změna rolí, ověření, mazání účtů</p>
                </a>
                <a href="/admin/auctions" className="block p-3 rounded-lg bg-[#0B1220] hover:bg-[rgba(0,200,255,0.06)] transition-colors">
                  <p className="font-heading font-semibold text-sm">Spravovat aukce</p>
                  <p className="text-xs text-gray-500 mt-0.5">Zrušení aukcí, kontrola nahlášených</p>
                </a>
                <a href="/admin/reports" className="block p-3 rounded-lg bg-[#0B1220] hover:bg-[rgba(0,200,255,0.06)] transition-colors">
                  <p className="font-heading font-semibold text-sm">Nahlášení</p>
                  <p className="text-xs text-gray-500 mt-0.5">Řešení reportů od uživatelů</p>
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-[#A7FF00]" />
                <h2 className="text-lg font-bold font-heading">Přehled platformy</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
                  <span className="text-gray-400">Celkem uživatelů</span>
                  <span className="font-semibold font-heading">{stats?.users ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
                  <span className="text-gray-400">Aktivních aukcí</span>
                  <span className="font-semibold font-heading">{stats?.auctions ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
                  <span className="text-gray-400">Průměr příhozů na aukci</span>
                  <span className="font-semibold font-heading">
                    {stats?.auctions && stats?.auctions > 0
                      ? ((stats?.bids ?? 0) / stats.auctions).toFixed(1)
                      : "0"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Dokončených transakcí</span>
                  <span className="font-semibold font-heading">{stats?.transactions ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
