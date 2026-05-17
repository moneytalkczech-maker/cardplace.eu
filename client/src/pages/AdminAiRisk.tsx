import { useEffect, useState } from "react";
import { ShieldAlert, TrendingUp, Users, Ban, Activity } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import api from "../services/api";

interface Auction {
  id: string;
  title: string;
  aiRiskLevel: string | null;
  aiRiskScore: number | null;
  aiRiskReason: string | null;
  status: string;
  user: { username: string };
}

export default function AdminAiRisk() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/auctions", { params: { limit: 100 } }).then((r) => {
      setAuctions(r.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const riskCounts = {
    low: auctions.filter((a) => a.aiRiskLevel === "low" || !a.aiRiskLevel).length,
    medium: auctions.filter((a) => a.aiRiskLevel === "medium").length,
    high: auctions.filter((a) => a.aiRiskLevel === "high").length,
    critical: auctions.filter((a) => a.aiRiskLevel === "critical").length,
  };

  return (
    <AdminLayout title="AI Risk">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-[#A7FF00]" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Nízké riziko</span>
          </div>
          <p className="text-2xl font-bold font-heading">{riskCounts.low}</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Střední riziko</span>
          </div>
          <p className="text-2xl font-bold font-heading">{riskCounts.medium}</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Vysoké riziko</span>
          </div>
          <p className="text-2xl font-bold font-heading">{riskCounts.high}</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Ban className="h-4 w-4 text-red-400" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Kritické</span>
          </div>
          <p className="text-2xl font-bold font-heading">{riskCounts.critical}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-[#00C8FF]" />
          <h2 className="text-lg font-bold font-heading">AI Risk Detection</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Automatická detekce rizikových aukcí pomocí AI. Systém analyzuje ceny, chování uživatelů a další faktory.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-[#0B1220] p-4 text-center">
            <p className="text-2xl font-bold font-heading text-[#00C8FF]">{auctions.length}</p>
            <p className="text-xs text-gray-500 mt-1">Celkem analyzováno</p>
          </div>
          <div className="rounded-lg bg-[#0B1220] p-4 text-center">
            <p className="text-2xl font-bold font-heading text-yellow-400">{riskCounts.high + riskCounts.critical}</p>
            <p className="text-xs text-gray-500 mt-1">K vyřešení</p>
          </div>
          <div className="rounded-lg bg-[#0B1220] p-4 text-center">
            <p className="text-2xl font-bold font-heading text-[#A7FF00]">{riskCounts.low}%</p>
            <p className="text-xs text-gray-500 mt-1">Bezpečné aukce</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
