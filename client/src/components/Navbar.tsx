import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Scan, Bell, User, LogOut, Menu, X, Gavel, Zap, Sun, Moon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { onOutbid } from "../services/socket";
import { useTranslation } from "../hooks/useTranslation";
import { toggleTheme, getTheme } from "../lib/theme";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { t } = useTranslation();
  const { user, token, logout, notifications, unreadCount, fetchNotifications, markNotificationsRead } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setThemeState] = useState(getTheme());
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) fetchNotifications();
    const interval = setInterval(() => {
      if (token) fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const unsub = onOutbid(() => {
      fetchNotifications();
    });
    return () => unsub();
  }, [token]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handler = () => setThemeState(getTheme());
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-[rgba(0,200,255,0.1)] bg-[#050A12]/90 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-bold font-heading">
            <img src="/logo.svg" alt="CardBid" className="h-9 w-9" />
            <span className="hidden sm:inline text-gradient">CardBid</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/auctions" className="btn-ghost">{t("nav.auctions")}</Link>
            <Link to="/wanted" className="btn-ghost">Poptávky</Link>
            <Link to="/cards" className="btn-ghost">Databáze</Link>
            {token && <Link to="/collection" className="btn-ghost">Sbírka</Link>}
            {token && (
              <>
                <Link to="/create" className="btn-primary text-sm"><Plus className="h-4 w-4" />{t("nav.create")}</Link>
                <Link to="/scan" className="btn-ghost"><Scan className="h-4 w-4" />{t("nav.scan")}</Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost" title={theme === "dark" ? "Světlý režim" : "Tmavý režim"}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {token ? (
              <>
                {/* Credits */}
                {user && (
                  <span className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(167,255,0,0.1)] border border-[rgba(167,255,0,0.2)] text-xs font-heading font-bold text-[#A7FF00]">
                    <Zap className="h-3.5 w-3.5" />
                    {user.credits ?? 0}
                  </span>
                )}
                <NotificationBell />
                <Link to="/profile" className="btn-ghost gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#009DFF] text-xs font-bold">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden lg:inline text-sm font-heading">{user?.username}</span>
                </Link>
                <button onClick={() => { logout(); navigate("/"); }} className="btn-ghost" title={t("nav.logout")}>
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm">{t("nav.signin")}</Link>
            )}
            <button className="md:hidden btn-ghost" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[rgba(0,200,255,0.1)] py-3 space-y-1">
            <Link to="/auctions" className="btn-ghost w-full justify-start" onClick={() => setMenuOpen(false)}>{t("nav.auctions")}</Link>
            {token && (
              <>
                <Link to="/create" className="btn-primary w-full justify-start" onClick={() => setMenuOpen(false)}><Plus className="h-4 w-4" />{t("nav.create")}</Link>
                <Link to="/scan" className="btn-ghost w-full justify-start" onClick={() => setMenuOpen(false)}>{t("nav.scan")}</Link>
                <Link to="/profile" className="btn-ghost w-full justify-start" onClick={() => setMenuOpen(false)}>Profil</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
