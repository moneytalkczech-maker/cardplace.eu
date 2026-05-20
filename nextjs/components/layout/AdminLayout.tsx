"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, ShoppingBag, Gavel, CreditCard, Database,
  Flag, Upload, Bot, ShieldCheck, AlertTriangle, DollarSign,
  HeadphonesIcon, Scale, FileText, Settings, FileSearch,
  Lock, Mail, BarChart3, Server, Menu, X, ChevronDown,
  ChevronRight, LogOut, ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface NavItem { path: string; label: string; icon: any; exact?: boolean; }
interface NavGroup { label: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { path: "/admin/dashboard", label: "Přehled", icon: LayoutDashboard, exact: true },
      { path: "/admin/stats", label: "Statistiky", icon: BarChart3 },
    ],
  },
  {
    label: "Správa",
    items: [
      { path: "/admin/users", label: "Uživatelé", icon: Users },
      { path: "/admin/auctions", label: "Aukce", icon: ShoppingBag },
      { path: "/admin/bids", label: "Příhozy", icon: Gavel },
      { path: "/admin/cards", label: "Karty", icon: CreditCard },
      { path: "/admin/card-database", label: "Databáze karet", icon: Database },
      { path: "/admin/reports", label: "Nahlášení", icon: Flag },
      { path: "/admin/uploads", label: "Uploady", icon: Upload },
    ],
  },
  {
    label: "AI & Data",
    items: [
      { path: "/admin/ai-control", label: "AI Kontrola", icon: Bot },
      { path: "/admin/ai-review", label: "AI Recenze", icon: ShieldCheck },
      { path: "/admin/ai-risk", label: "AI Riziko", icon: AlertTriangle },
      { path: "/admin/ai-pricing", label: "AI Ceny", icon: DollarSign },
      { path: "/admin/ai-support", label: "AI Podpora", icon: HeadphonesIcon },
      { path: "/admin/ai-legal-check", label: "AI Legal Check", icon: Scale },
    ],
  },
  {
    label: "Systém",
    items: [
      { path: "/admin/legal", label: "Právní", icon: FileText },
      { path: "/admin/settings", label: "Nastavení", icon: Settings },
      { path: "/admin/audit-log", label: "Audit Log", icon: FileSearch },
      { path: "/admin/security", label: "Bezpečnost", icon: Lock },
      { path: "/admin/emails", label: "Emaily", icon: Mail },
      { path: "/admin/system", label: "Systém", icon: Server },
    ],
  },
];

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin/dashboard": "Přehled",
  "/admin/stats": "Statistiky",
  "/admin/users": "Uživatelé",
  "/admin/auctions": "Aukce",
  "/admin/bids": "Příhozy",
  "/admin/cards": "Karty",
  "/admin/card-database": "Databáze karet",
  "/admin/reports": "Nahlášení",
  "/admin/uploads": "Uploady",
  "/admin/ai-control": "AI Kontrola",
  "/admin/ai-review": "AI Recenze",
  "/admin/ai-risk": "AI Riziko",
  "/admin/ai-pricing": "AI Ceny",
  "/admin/ai-support": "AI Podpora",
  "/admin/ai-legal-check": "AI Legal Check",
  "/admin/legal": "Právní",
  "/admin/settings": "Nastavení",
  "/admin/audit-log": "Audit Log",
  "/admin/security": "Bezpečnost",
  "/admin/emails": "Emaily",
  "/admin/system": "Systém",
};

export default function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      initial[group.label] = group.items.some((item) => pathname.startsWith(item.path));
    }
    setExpandedGroups(initial);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.path : pathname.startsWith(item.path);

  const currentLabel = BREADCRUMB_MAP[pathname] || title || "Admin";
  const roleLabel = user?.role === "admin" ? "Admin" : user?.role === "seller" ? "Prodejce" : "Uživatel";
  const roleColor = user?.role === "admin" ? "text-red-400 border-red-400/30" : "text-blue-400 border-blue-400/30";

  return (
    <div className="flex min-h-screen bg-[#050A12]">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0B1220] border-r border-[rgba(0,200,255,0.08)] transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} flex flex-col`}>
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[rgba(0,200,255,0.08)] flex-shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C8FF] to-[#009DFF] flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold font-heading text-gradient">CardPlace</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase tracking-wider">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups[group.label];
            const hasActive = group.items.some((item) => isActive(item));
            return (
              <div key={group.label}>
                <button
                  onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }))}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-colors ${hasActive ? "text-[#00C8FF]" : "text-gray-600 hover:text-gray-400"}`}
                >
                  {group.label}
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-heading transition-all ${active ? "bg-[rgba(0,200,255,0.1)] text-[#00C8FF] font-semibold" : "text-gray-400 hover:text-white hover:bg-[rgba(0,0,0,0.2)]"}`}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[rgba(0,200,255,0.08)] p-3 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-heading text-gray-400 hover:text-white hover:bg-[rgba(0,0,0,0.2)] transition-all">
            <ArrowLeft className="h-4 w-4" /> Zpět na web
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-[rgba(0,200,255,0.08)] bg-[#050A12]/90 backdrop-blur-lg flex-shrink-0">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden btn-ghost p-2">
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <nav className="flex items-center gap-2 text-sm font-heading">
                <Link href="/admin/dashboard" className="text-gray-500 hover:text-white transition-colors">Admin</Link>
                <span className="text-gray-600">/</span>
                <span className="text-white font-semibold">{currentLabel}</span>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold font-heading ${roleColor}`}>
                <ShieldCheck className="h-3 w-3" />
                {roleLabel}
              </span>
              {user && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#009DFF] text-xs font-bold text-white">
                    {user.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-gray-300 font-heading text-sm">{user.username}</span>
                </div>
              )}
              <button onClick={() => { logout(); router.push("/"); }} className="btn-ghost p-2 text-gray-500 hover:text-red-400 transition-colors" title="Odhlásit se">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
