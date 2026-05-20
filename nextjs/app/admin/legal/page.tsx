"use client";

import { useEffect, useState } from "react";
import { BookOpen, Edit3, X, Save, CheckCircle, XCircle } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import AdminLayout from "@/components/layout/AdminLayout";

interface LegalDocument {
  id: string;
  slug: string;
  title: string;
  content: string;
  locale: string;
  version: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminLegal() {
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const fetchDocs = () => {
    setLoading(true);
    adminApi.listLegalDocuments().then((data: any) => {
      setDocs(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, []);

  const startEdit = (d: LegalDocument) => {
    setEditing(d.id);
    setEditTitle(d.title);
    setEditContent(d.content);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async (id: string) => {
    try {
      await adminApi.updateLegalDocument(id, { title: editTitle, content: editContent });
      toast("success", "Dokument uložen");
      cancelEdit();
      fetchDocs();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při ukládání");
    }
  };

  const togglePublish = async (id: string, currentlyPublished: boolean) => {
    try {
      await adminApi.updateLegalDocument(id, { published: !currentlyPublished });
      toast("success", currentlyPublished ? "Dokument skryt" : "Dokument publikován");
      fetchDocs();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při publikování");
    }
  };

  return (
    <AdminLayout title="Právní dokumenty">
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-[#0B1220]" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Žádné právní dokumenty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((d) => (
            <div key={d.id} className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-[#00C8FF]" />
                      <h3 className="font-heading font-bold text-sm">{d.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#0B1220] text-gray-400 uppercase">{d.locale}</span>
                      <span className="text-xs text-gray-500">v{d.version}</span>
                    </div>
                    {editing !== d.id && (
                      <p className="text-xs text-gray-500 mt-1">
                        Slug: <code className="text-[#00C8FF]">{d.slug}</code>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePublish(d.id, d.published)}
                      className={`p-2 rounded-lg transition-colors ${
                        d.published ? "text-[#A7FF00] hover:bg-[rgba(167,255,0,0.1)]" : "text-gray-600 hover:text-gray-400"
                      }`}
                      title={d.published ? "Skrýt" : "Publikovat"}
                    >
                      {d.published ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </button>
                    {editing !== d.id ? (
                      <button onClick={() => startEdit(d)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => saveEdit(d.id)} className="p-2 rounded-lg text-[#A7FF00] hover:bg-[rgba(167,255,0,0.1)] transition-colors">
                          <Save className="h-4 w-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editing === d.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-heading font-semibold">Název</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-heading font-semibold">Obsah</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={12}
                        className="input w-full text-sm font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-2">
                    <span>Poslední úprava: {new Date(d.updatedAt).toLocaleString("cs-CZ")}</span>
                    {d.published && d.publishedAt && (
                      <span className="ml-4">Publikováno: {new Date(d.publishedAt).toLocaleString("cs-CZ")}</span>
                    )}
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
