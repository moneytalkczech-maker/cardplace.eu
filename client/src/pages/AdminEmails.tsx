import { useEffect, useState } from "react";
import { Mail, Edit3, X, Save } from "lucide-react";
import { adminApi } from "../services/api";
import { toast } from "../components/Toast";
import AdminLayout from "../components/AdminLayout";

interface EmailTemplate {
  id: string;
  key: string;
  subject: string;
  bodyHtml: string;
  locale: string;
  variables: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminEmails() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  const fetchTemplates = () => {
    setLoading(true);
    adminApi.listEmailTemplates().then((data: any) => {
      setTemplates(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const startEdit = (t: EmailTemplate) => {
    setEditing(t.id);
    setEditSubject(t.subject);
    setEditBody(t.bodyHtml);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditSubject("");
    setEditBody("");
  };

  const saveEdit = async (id: string) => {
    try {
      await adminApi.updateEmailTemplate(id, { subject: editSubject, bodyHtml: editBody });
      toast("success", "Šablona uložena");
      cancelEdit();
      fetchTemplates();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při ukládání");
    }
  };

  return (
    <AdminLayout title="Emailové šablony">
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-[#0B1220]" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Žádné emailové šablony</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-[#00C8FF]" />
                      <h3 className="font-heading font-bold text-sm">{t.key}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#0B1220] text-gray-400 uppercase">{t.locale}</span>
                    </div>
                    {editing !== t.id ? (
                      <p className="text-sm text-gray-400 mt-1">{t.subject}</p>
                    ) : null}
                  </div>
                  {editing !== t.id ? (
                    <button onClick={() => startEdit(t)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(t.id)} className="p-2 rounded-lg text-[#A7FF00] hover:bg-[rgba(167,255,0,0.1)] transition-colors">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {editing === t.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-heading font-semibold">Předmět</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-heading font-semibold">HTML tělo</label>
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={8}
                        className="input w-full text-sm font-mono"
                      />
                    </div>
                    {t.variables && (
                      <div className="text-xs text-gray-500">
                        <span className="font-heading font-semibold">Proměnné: </span>
                        {t.variables}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-2">
                    <span>Poslední úprava: {new Date(t.updatedAt).toLocaleString("cs-CZ")}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
