"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, Gavel, Wallet, ShoppingBag, TrendingUp, Activity, Zap } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/api";

interface Stats {
  users: number;
  auctions: number;
  bids: number;
  transactions: number;
  collections: number;
}

const statCards = [
  { key: "users" as const, label: "Uživatelé", icon: Users, color: "blue" },
  { key: "auctions" as const, label: "Aukce", icon: Gavel, color: "green" },
  { key: "bids" as const, label: "Příhozy", icon: TrendingUp, color: "purple" },
  { key: "transactions" as const, label: "Transakce", icon: Wallet, color: "amber" },
  { key: "collections" as const, label: "Sbírky", icon: ShoppingBag, color: "cyan" },
];

const colorMap: Record<string, string> = {
  blue: "from-[#00C8FF] to-[#009DFF]",
  green: "from-[#A7FF00] to-[#5CFF00]",
  purple: "from-[#A78BFA] to-[#7C3AED]",
  amber: "from-[#FBBF24] to-[#F59E0B]",
  cyan: "from-[#22D3EE] to-[#06B6D4]",
};

export default function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then((response: any) => {
        const data = response.data || response;
        setStats({
          users: data.users ?? data.userCount ?? 0,
          auctions: data.auctions ?? data.auctionCount ?? 0,
          bids: data.bids ?? data.bidCount ?? 0,
          transactions: data.transactions ?? data.transactionCount ?? 0,
          collections: data.collections ?? data.collectionCount ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Statistiky">
      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[#0B1220]" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stat karty */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((card) => {
              const value = stats?.[card.key] ?? 0;
              const Icon = card.icon;
              return (
                <div key={card.key} className="relative rounded-2xl bg-[#0B1220] border border-[rgba(0,200,255,0.08)] p-5 overflow-hidden group hover:border-[rgba(0,200,255,0.2)] transition-all">
                  <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${colorMap[card.color]} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[card.color]} flex items-center justify-center mb-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-3xl font-bold font-heading text-white mb-1">
                      {value.toLocaleString("cs-CZ")}
                    </p>
                    <p className="text-xs text-gray-500 font-heading uppercase tracking-wider">
                      {card.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rychlé info */}
          <div className="rounded-2xl bg-[#0B1220] border border-[rgba(0,200,255,0.08)] p-6">
            <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#00C8FF]" />
              Přehled platformy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Prům. příhozů na aukci", value: stats && stats.auctions > 0 ? (stats.bids / stats.auctions).toFixed(1) : "0", icon: Zap },
                { label: "Prodané aukce", value: stats?.transactions ?? 0, icon: Wallet, suffix: "transakcí" },
                { label: "Uživatelé s aukcí", value: stats?.users ? `${((stats.auctions / stats.users) * 100).toFixed(0)}%` : "0%", icon: Users, suffix: "má aukci" },
                { label: "Celkem příhozů", value: stats?.bids ?? 0, icon: TrendingUp },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-4 rounded-xl bg-[#0B1220] border border-[rgba(0,200,255,0.06)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-[#00C8FF]" />
                      <span className="text-xs text-gray-500">{item.label}</span>
                    </div>
                    <p className="text-xl font-bold font-heading text-white">{item.value}</p>
                    {item.suffix && <p className="text-xs text-gray-600">{item.suffix}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
