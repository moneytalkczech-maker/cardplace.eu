"use client";

import { useEffect, useState } from "react";
import { Brain, Database, Activity, Globe, Lock } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

interface DataSource {
  id: string;
  name: string;
  displayName: string;
  type: string;
  status: string;
  lastSyncAt: string | null;
}

export default function AdminAiControl() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/card-data-sources").then((r) => {
      setSources(Array.isArray(r.data) ? r.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const typeColors: Record<string, string> = {
    api: "bg-[rgba(0,200,255,0.1)] text-[#00C8FF]",
    scraper: "bg-yellow-500/10 text-yellow-400",
    manual: "bg-green-500/10 text-green-400",
    import: "bg-purple-500/10 text-purple-400",
  };

  return (
    <AdminLayout title="AI Ovládání">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5 col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-[#00C8FF]" />
            <h2 className="text-lg font-bold font-heading">AI Model Status</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {["OCR Skenování", "Cenový odhad", "Detekce rizik", "Klasifikace karet"].map((model) => (
              <div key={model} className="rounded-lg bg-[#0B1220] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-heading font-semibold">{model}</span>
                  <span className="text-[#A7FF00] text-xs font-heading font-semibold">● Online</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#0B1220] overflow-hidden">
                  <div className="h-full rounded-full bg-[#A7FF00]" style={{ width: `${85 + Math.random() * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-[#A7FF00]" />
            <h2 className="text-lg font-bold font-heading">Rychlé info</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[rgba(0,200,255,0.06)]">
              <span className="text-gray-400">API klíče</span>
              <span className="font-heading font-semibold">3 nakonfigurováno</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Model verze</span>
              <span className="font-heading font-semibold">v2.1.0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-[#00C8FF]" />
          <h2 className="text-lg font-bold font-heading">Zdroje dat</h2>
        </div>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-[#0B1220]" />)}
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Žádné zdroje dat nenalezeny
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${typeColors[s.type] || "bg-gray-500/10 text-gray-400"}`}>
                    {s.type === "api" ? <Globe className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-heading font-semibold">{s.displayName}</p>
                    <p className="text-xs text-gray-500">{s.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.lastSyncAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(s.lastSyncAt).toLocaleDateString("cs-CZ")}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {s.status === "active" ? "Aktivní" : "Neaktivní"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
