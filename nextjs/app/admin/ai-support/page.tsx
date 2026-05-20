"use client";

import { Headphones, MessageSquare, FileText, Users, Clock } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminAiSupport() {
  return (
    <AdminLayout title="AI Podpora">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5 col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Headphones className="h-5 w-5 text-[#00C8FF]" />
            <h2 className="text-lg font-bold font-heading">AI Asistent podpory</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            AI chatbot pro automatickou podporu uživatelů. Odpovídá na časté dotazy, pomáhá s řešením problémů
            a eskaluje složitější požadavky na operátory.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#0B1220] p-4 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-[#00C8FF]" />
              <p className="text-lg font-bold font-heading">—</p>
              <p className="text-xs text-gray-500">Konverzací dnes</p>
            </div>
            <div className="rounded-lg bg-[#0B1220] p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-[#A7FF00]" />
              <p className="text-lg font-bold font-heading">—</p>
              <p className="text-xs text-gray-500">Aktivních uživatelů</p>
            </div>
            <div className="rounded-lg bg-[#0B1220] p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-lg font-bold font-heading">—</p>
              <p className="text-xs text-gray-500">Prům. doba odpovědi</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#A7FF00]" />
            <h2 className="text-lg font-bold font-heading">Báze znalostí</h2>
          </div>
          <div className="space-y-2">
            {["Jak vytvořit aukci", "Poplatky a provize", "Ověření účtu", "Reklamace"].map((topic) => (
              <div key={topic} className="flex items-center gap-2 rounded-lg bg-[#0B1220] p-3 text-sm">
                <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-300">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(0,200,255,0.08)] bg-[#0B1220] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Headphones className="h-5 w-5 text-[#00C8FF]" />
          <h2 className="text-lg font-bold font-heading">Trénovací data</h2>
        </div>
        <p className="text-sm text-gray-400 mb-3">
          Modul je ve fázi plánování. Po nasazení bude automaticky odpovídat na dotazy uživatelů.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "FAQ odpovědí", count: 0 },
            { label: "Trénovacích vět", count: 0 },
            { label: "Eskalovaných", count: 0 },
            { label: "Spokojenost", count: "—" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-[#0B1220] p-3 text-center">
              <p className="text-lg font-bold font-heading">{item.count}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
