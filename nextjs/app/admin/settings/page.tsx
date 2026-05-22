"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { adminApi } from "@/lib/api";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  group: string;
  description?: string;
}

const GROUP_LABELS: Record<string, string> = {
  general: "Obecné",
  fees: "Poplatky",
  legal: "Právní",
  ai: "AI",
  email: "Email",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setError(null);
    adminApi.listSettings()
      .then((data: SiteSetting[]) => {
        setSettings(data);
        const vals: Record<string, string> = {};
        data.forEach((s) => { vals[s.id] = s.value; });
        setEditedValues(vals);
      })
      .catch((err: any) => {
        setError(err.response?.data?.error || "Chyba při načítání nastavení");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (setting: SiteSetting) => {
    const newValue = editedValues[setting.id];
    if (newValue === setting.value) return;
    setSaving(setting.id);
    try {
      await adminApi.updateSetting(setting.id, newValue);
      setSuccess(`"${setting.key}" uloženo`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || "Chyba při ukládání");
    } finally {
      setSaving(null);
    }
  };

  const grouped = settings.reduce<Record<string, SiteSetting[]>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  return (
    <AdminLayout title="Nastavení">
      {error && <div className="text-red-400 text-sm py-4 text-center">{error}</div>}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-[#0B1220]" />
          ))}
        </div>
      ) : settings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Žádná nastavení. Nejprve přidej záznamy do SiteSetting tabulky.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {success && (
            <div className="p-4 rounded-xl bg-[rgba(167,255,0,0.1)] border border-[rgba(167,255,0,0.2)] text-sm text-[#A7FF00]">
              {success}
            </div>
          )}

          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="rounded-2xl bg-[#0B1220] border border-[rgba(0,200,255,0.08)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(0,200,255,0.08)]">
                <h3 className="font-heading font-bold text-lg">
                  {GROUP_LABELS[group] || group}
                </h3>
              </div>
              <div className="divide-y divide-[rgba(0,200,255,0.06)]">
                {items.map((setting) => (
                  <div key={setting.id} className="px-6 py-4 flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <label className="text-sm font-heading font-semibold text-white">
                        {setting.key}
                      </label>
                      {setting.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                      )}
                      <p className="text-[10px] text-gray-500 mt-0.5 font-mono">Typ: {setting.type}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 w-72">
                      <input
                        type={setting.type === "number" ? "number" : "text"}
                        className="input text-sm"
                        value={editedValues[setting.id] ?? ""}
                        onChange={(e) => setEditedValues((prev) => ({ ...prev, [setting.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => handleSave(setting)}
                        disabled={saving === setting.id || editedValues[setting.id] === setting.value}
                        className="btn-ghost p-2 text-xs flex-shrink-0 disabled:opacity-30"
                      >
                        {saving === setting.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
