"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus, Scan, Bell, User, LogOut, Menu, X, Gavel, Zap,
  Shield, ChevronDown, Database, Heart, LayoutGrid, Search, Bolt, MessageSquare
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { onOutbid } from "@/lib/socket";
import { useTranslation } from "@/hooks/useTranslation";
import NotificationBell from "@/components/ui/NotificationBell";

const navLinks = [
  { path: "/auctions", label: "nav.auctions", icon: Gavel },
  { path: "/wanted", label: "nav.wanted", icon: Heart },
  { path: "/cards", label: "nav.database", icon: Database },
];

const authLinks = [
  { path: "/collection", label: "nav.collection", icon: LayoutGrid },
];

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/auth-callback"];

export default function Navbar() {
  const { t, locale, setLocale } = useTranslation();
  const { user, token, logout, fetchNotifications } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) return null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const unsub = onOutbid(() => { fetchNotifications(); });
    return () => unsub();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname?.startsWith(path);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#050A12]/95 backdrop-blur-xl border-b border-[rgba(0,200,255,0.1)] shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="container-premium">
          <div className="flex h-18 items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00C8FF] via-[#FF0044] to-[#A7FF00] rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                <div className="relative w-10 h-10 rounded-xl bg-[#050A12] border border-[rgba(0,200,255,0.3)] flex items-center justify-center overflow-hidden">
                  <span className="absolute left-1 text-[#00C8FF] font-bold text-lg font-heading" style={{ textShadow: "0 0 8px rgba(0,200,255,0.5)" }}>C</span>
                  <Bolt className="absolute h-5 w-5 text-[#FF3366] z-10" style={{ filter: "drop-shadow(0 0 4px rgba(255,0,68,0.5))" }} />
                  <span className="absolute right-1 text-[#A7FF00] font-bold text-lg font-heading" style={{ textShadow: "0 0 8px rgba(124,255,0,0.5)" }}>P</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold font-heading">
                  <span className="text-white">Card</span>
                  <span className="text-[#A7FF00]" style={{ textShadow: "0 0 10px rgba(124,255,0,0.3)" }}>Place</span>
                  <span className="text-[#FF3366]" style={{ textShadow: "0 0 10px rgba(255,0,68,0.3)" }}>.eu</span>
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium font-heading transition-all duration-300 ${
                    isActive(link.path) ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {isActive(link.path) && (
                    <span className="absolute inset-0 bg-[rgba(0,200,255,0.1)] rounded-xl border border-[rgba(0,200,255,0.2)]" />
                  )}
                  <span className="relative flex items-center gap-2">
                    <link.icon className="h-4 w-4" />
                    {t(link.label)}
                  </span>
                </Link>
              ))}
              {token && authLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium font-heading transition-all duration-300 ${
                    isActive(link.path) ? "text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {isActive(link.path) && (
                    <span className="absolute inset-0 bg-[rgba(0,200,255,0.1)] rounded-xl border border-[rgba(0,200,255,0.2)]" />
                  )}
                  <span className="relative flex items-center gap-2">
                    <link.icon className="h-4 w-4" />
                    {t(link.label)}
                  </span>
                </Link>
              ))}
            </div>

            {/* Search */}
            <div className="hidden md:flex relative flex-1 max-w-xs mx-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Hledat karty nebo aukce..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(0,200,255,0.1)] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00C8FF] focus:bg-[rgba(0,200,255,0.06)] transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                    router.push(`/auctions?search=${encodeURIComponent((e.target as HTMLInputElement).value.trim())}`);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {token ? (
                <>
                  {user && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(167,255,0,0.08)] border border-[rgba(167,255,0,0.2)]">
                      <Zap className="h-4 w-4 text-[#A7FF00]" />
                      <span className="text-sm font-heading font-bold text-[#A7FF00]">{user.credits ?? 0}</span>
                    </div>
                  )}
                  <Link
                    href="/auctions/create"
                    className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A7FF00] to-[#5CFF00] text-[#050A12] font-semibold font-heading text-sm shadow-lg shadow-[rgba(124,255,0,0.3)] hover:shadow-[rgba(124,255,0,0.5)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <Plus className="h-4 w-4" />
                    {t("nav.create")}
                  </Link>
                  <NotificationBell />
                  {user?.role?.toLowerCase() === "admin" && (
                    <Link
                      href="/admin"
                      className="hidden sm:flex p-2.5 rounded-xl text-[#FF3366] hover:text-[#FF5588] hover:bg-[rgba(255,0,68,0.1)] transition-all duration-300"
                      title="Admin"
                    >
                      <Shield className="h-5 w-5" />
                    </Link>
                  )}
                  {/* User menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#009DFF] to-[#00C8FF] flex items-center justify-center text-sm font-bold text-white">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl glass-strong shadow-xl animate-fade-in-up">
                        <div className="p-3 border-b border-[rgba(0,200,255,0.1)]">
                          <p className="font-heading font-bold text-white">@{user?.username}</p>
                          <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                        <div className="p-2 space-y-1">
                          <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                            <User className="h-4 w-4" /> {t("nav.profile")}
                          </Link>
                          <Link href="/messages" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                            <MessageSquare className="h-4 w-4" /> Zprávy
                          </Link>
                          <Link href="/scan" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                            <Scan className="h-4 w-4" /> {t("nav.scan")}
                          </Link>
                          <button
                            onClick={() => { logout(); router.push("/"); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#FF3366] hover:text-[#FF5588] hover:bg-[rgba(255,0,68,0.1)] transition-colors"
                          >
                            <LogOut className="h-4 w-4" /> {t("nav.logout")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#A7FF00] to-[#5CFF00] text-[#050A12] font-semibold font-heading text-sm shadow-lg shadow-[rgba(124,255,0,0.3)] hover:shadow-[rgba(124,255,0,0.5)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  {t("nav.signin")}
                </Link>
              )}
              <button
                onClick={() => setLocale(locale === "cs" ? "en" : "cs")}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-heading font-bold text-gray-400 hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.06)] transition-all"
                title="Přepnout jazyk / Switch language"
              >
                {locale === "cs" ? "EN" : "CS"}
              </button>
              <button
                className="lg:hidden p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden fixed inset-x-0 top-[72px] bg-[#050A12]/98 backdrop-blur-xl border-b border-[rgba(0,200,255,0.1)] transition-all duration-300 ${menuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <div className="container-premium py-6 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-heading font-medium transition-all ${isActive(link.path) ? "bg-[rgba(0,200,255,0.1)] text-white border border-[rgba(0,200,255,0.2)]" : "text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)]"}`}>
                <link.icon className="h-5 w-5" /> {t(link.label)}
              </Link>
            ))}
            {token && authLinks.map((link) => (
              <Link key={link.path} href={link.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-heading font-medium transition-all ${isActive(link.path) ? "bg-[rgba(0,200,255,0.1)] text-white border border-[rgba(0,200,255,0.2)]" : "text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.04)]"}`}>
                <link.icon className="h-5 w-5" /> {t(link.label)}
              </Link>
            ))}
            <div className="my-4 border-t border-[rgba(0,200,255,0.1)]" />
            {token ? (
              <div className="space-y-2">
                <Link href="/auctions/create" className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#A7FF00] to-[#5CFF00] text-[#050A12] font-semibold font-heading">
                  <Plus className="h-5 w-5" /> {t("nav.create")}
                </Link>
                <div className="flex gap-2">
                  <Link href="/scan" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[rgba(0,200,255,0.2)] text-[#00C8FF] font-heading font-medium">
                    <Scan className="h-5 w-5" /> {t("nav.scan")}
                  </Link>
                  <button
                    onClick={() => setLocale(locale === "cs" ? "en" : "cs")}
                    className="flex items-center justify-center px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-gray-400 font-heading font-bold text-sm"
                  >
                    {locale === "cs" ? "EN" : "CS"}
                  </button>
                  <button onClick={() => { logout(); router.push("/"); }} className="flex items-center justify-center px-4 py-3 rounded-xl border border-[rgba(255,0,68,0.3)] text-[#FF3366]">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#A7FF00] to-[#5CFF00] text-[#050A12] font-semibold font-heading">
                  {t("nav.signin")}
                </Link>
                <button
                  onClick={() => setLocale(locale === "cs" ? "en" : "cs")}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-gray-400 font-heading font-bold text-sm"
                >
                  {locale === "cs" ? "Switch to English" : "Přepnout na češtinu"}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="h-[72px]" />
    </>
  );
}
