import { useEffect, useState } from "react";
import { Shield, Save } from "lucide-react";
import { adminApi } from "../services/api";
import { toast } from "../components/Toast";
import AdminLayout from "../components/AdminLayout";

interface SecuritySetting {
  id: string;
  key: string;
  value: string;
  type: string;
  group: string;
  description: string;
}

export default function AdminSecurity() {
  const [settings, setSettings] = useState<SecuritySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});

  const fetchSettings = () => {
    setLoading(true);
    adminApi.getSecuritySettings().then((data: any) => {
      const arr = Array.isArray(data) ? data : [];
      setSettings(arr);
      const v: Record<string, string> = {};
      arr.forEach((s: SecuritySetting) => { v[s.key] = s.value; });
      setValues(v);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (key: string) => {
    try {
      await adminApi.updateSecuritySetting(key, values[key]);
      toast("success", "Nastavení uloženo");
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při ukládání");
    }
  };

  const labels: Record<string, string> = {
    max_login_attempts: "Max. pokusů o přihlášení",
    lockout_duration: "Doba zablokování (min)",
    require_email_verify: "Vyžadovat ověření emailu",
    rate_limit_auth: "Rate limit auth (za min)",
  };

  return (
    <AdminLayout title="Bezpečnost">
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-[#0B1220]" />)}
        </div>
      ) : settings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Žádná bezpečnostní nastavení</p>
          <p className="text-xs mt-2">Nastavení se automaticky vytvoří při prvním uložení</p>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {settings.map((s) => (
            <div key={s.id || s.key} className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <label className="block text-sm font-heading font-semibold mb-1">
                    {labels[s.key] || s.key}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">{s.description}</p>
                  {s.type === "boolean" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={values[s.key] === "true"}
                        onChange={(e) => setValues({ ...values, [s.key]: e.target.checked ? "true" : "false" })}
                        className="w-4 h-4 rounded border-[rgba(0,200,255,0.2)] bg-[#0B1220] text-[#00C8FF] focus:ring-[#00C8FF]"
                      />
                      <span className="text-sm">{values[s.key] === "true" ? "Ano" : "Ne"}</span>
                    </label>
                  ) : (
                    <input
                      type={s.type === "number" ? "number" : "text"}
                      value={values[s.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                      className="input w-full max-w-xs text-sm"
                    />
                  )}
                </div>
                <button
                  onClick={() => handleSave(s.key)}
                  className="p-2 rounded-lg text-[#A7FF00] hover:bg-[rgba(167,255,0,0.1)] transition-colors shrink-0"
                  title="Uložit"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
