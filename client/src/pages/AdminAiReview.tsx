import { useEffect, useState } from "react";
import { SearchCheck, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import api from "../services/api";

interface Auction {
  id: string;
  title: string;
  status: string;
  aiRiskLevel: string | null;
  aiRiskScore: number | null;
  createdAt: string;
  user: { username: string };
}

export default function AdminAiReview() {
  const [pending, setPending] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/auctions", { params: { limit: 20 } }).then((r) => {
      const data = r.data?.data || [];
      setPending(data.filter((a: Auction) => a.aiRiskLevel === "high" || a.aiRiskLevel === "critical"));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="AI Review">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Čeká na review</span>
          </div>
          <p className="text-2xl font-bold font-heading">{pending.length}</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-[#A7FF00]" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Schváleno AI</span>
          </div>
          <p className="text-2xl font-bold font-heading">—</p>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-gray-500 font-heading font-semibold uppercase">Odmítnuto AI</span>
          </div>
          <p className="text-2xl font-bold font-heading">—</p>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
        <div className="flex items-center gap-2 mb-4">
          <SearchCheck className="h-5 w-5 text-[#00C8FF]" />
          <h2 className="text-lg font-bold font-heading">Aukce vyžadující review</h2>
        </div>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-[#0B1220]" />)}
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Všechny aukce jsou v pořádku</p>
            <p className="text-xs mt-1">Žádné položky nevyžadují AI review</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-[#0B1220] p-3">
                <div>
                  <p className="text-sm font-heading font-semibold">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.user?.username} • {new Date(a.createdAt).toLocaleDateString("cs-CZ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.aiRiskLevel === "critical" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {a.aiRiskLevel === "critical" ? "Kritické" : "Vysoké riziko"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
