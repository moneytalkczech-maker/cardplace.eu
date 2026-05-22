"use client";

import { useEffect, useState } from "react";
import { Server, Cpu, HardDrive, Activity, Database, Users, ShoppingBag, Gavel, Upload, Layers } from "lucide-react";
import { adminApi } from "@/lib/api";
import AdminLayout from "@/components/layout/AdminLayout";

interface SystemInfo {
  counts: {
    users: number;
    auctions: number;
    bids: number;
    transactions: number;
    uploads: number;
    cards: number;
    databaseCards: number;
    emailTemplates: number;
    legalDocuments: number;
  };
  nodeVersion: string;
  platform: string;
  memoryUsage: { rss: number; heapTotal: number; heapUsed: number; external: number };
  uptime: number;
}

export default function AdminSystem() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    adminApi.getSystemInfo().then(setInfo).catch((err: any) => {
      setError(err.response?.data?.error || "Chyba při načítání systémových informací");
    }).finally(() => setLoading(false));
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  if (loading) {
    return (
      <AdminLayout title="Systém">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-xl bg-[#0B1220]" />
          <div className="h-48 rounded-xl bg-[#0B1220]" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Systém">
        <div className="text-red-400 text-sm py-4 text-center">{error}</div>
      </AdminLayout>
    );
  }

  const counts = info?.counts;
  const mem = info?.memoryUsage;

  const statCards = [
    { label: "Uživatelé", value: counts?.users ?? 0, icon: Users, color: "text-[#00C8FF]" },
    { label: "Aukce", value: counts?.auctions ?? 0, icon: ShoppingBag, color: "text-green-400" },
    { label: "Příhozy", value: counts?.bids ?? 0, icon: Gavel, color: "text-yellow-400" },
    { label: "Transakce", value: counts?.transactions ?? 0, icon: Database, color: "text-purple-400" },
    { label: "Uploady", value: counts?.uploads ?? 0, icon: Upload, color: "text-pink-400" },
    { label: "Karty", value: counts?.cards ?? 0, icon: Layers, color: "text-[#00C8FF]" },
    { label: "DB Karty", value: counts?.databaseCards ?? 0, icon: Database, color: "text-[#A7FF00]" },
    { label: "Email šablony", value: counts?.emailTemplates ?? 0, icon: Activity, color: "text-orange-400" },
    { label: "Právní dok.", value: counts?.legalDocuments ?? 0, icon: Activity, color: "text-red-400" },
  ];

  return (
    <AdminLayout title="Systém">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-heading font-semibold uppercase tracking-wider">{card.label}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold font-heading">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-5 w-5 text-[#00C8FF]" />
            <h2 className="text-lg font-bold font-heading">Systémové informace</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
              <span className="text-gray-400">Node.js verze</span>
              <span className="font-semibold font-heading">{info?.nodeVersion || "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
              <span className="text-gray-400">Platforma</span>
              <span className="font-semibold font-heading">{info?.platform || "—"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Uptime</span>
              <span className="font-semibold font-heading">{info?.uptime ? formatUptime(info.uptime) : "—"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5 text-[#A7FF00]" />
            <h2 className="text-lg font-bold font-heading">Paměť</h2>
          </div>
          {mem && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
                <span className="text-gray-400">RSS</span>
                <span className="font-semibold font-heading">{formatMB(mem.rss)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
                <span className="text-gray-400">Heap total</span>
                <span className="font-semibold font-heading">{formatMB(mem.heapTotal)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
                <span className="text-gray-400">Heap used</span>
                <span className="font-semibold font-heading">{formatMB(mem.heapUsed)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">External</span>
                <span className="font-semibold font-heading">{formatMB(mem.external)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
