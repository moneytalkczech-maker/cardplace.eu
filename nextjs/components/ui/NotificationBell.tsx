"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/hooks/useTranslation";

export default function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, markNotificationsRead } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open && unreadCount > 0) markNotificationsRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
        aria-label={t("nav.notifications")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#FF3366] text-[10px] font-bold text-white px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl glass-strong shadow-xl animate-fade-in-up z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[rgba(0,200,255,0.1)]">
            <span className="font-heading font-semibold text-white">{t("nav.notifications")}</span>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">{t("nav.noNotifications")}</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-[rgba(0,200,255,0.06)] last:border-0 transition-colors ${!n.read ? "bg-[rgba(0,200,255,0.04)]" : ""}`}
                >
                  <p className={`text-sm ${n.read ? "text-gray-400" : "text-white"}`}>{n.message}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(n.createdAt).toLocaleString("cs-CZ")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
