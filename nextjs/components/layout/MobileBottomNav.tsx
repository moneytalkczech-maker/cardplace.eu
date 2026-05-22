"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gavel, Search, Scan, LayoutGrid, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/auth-callback"];

const guestLinks = [
  { path: "/auctions", icon: Gavel, label: "Aukce" },
  { path: "/cards", icon: Search, label: "Databáze" },
];

const authLinks = [
  { path: "/auctions", icon: Gavel, label: "Aukce" },
  { path: "/scan", icon: Scan, label: "Skenovat" },
  { path: "/collection", icon: LayoutGrid, label: "Sbírka" },
  { path: "/profile", icon: User, label: "Profil" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { token, unreadMessages } = useAuthStore();

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) return null;
  if (pathname.startsWith("/admin")) return null;

  const links = token ? authLinks : guestLinks;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#050A12]/95 backdrop-blur-xl border-t border-[rgba(0,200,255,0.1)] safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {links.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          const isScan = path === "/scan";
          return (
            <Link
              key={path}
              href={path}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
                active
                  ? isScan
                    ? "text-[#A7FF00]"
                    : "text-[#00C8FF]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {isScan ? (
                <div className={`relative -mt-6 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all ${
                  active
                    ? "bg-gradient-to-br from-[#A7FF00] to-[#5CFF00] shadow-[rgba(124,255,0,0.4)]"
                    : "bg-[#0B1220] border border-[rgba(167,255,0,0.3)] shadow-[rgba(0,0,0,0.4)]"
                }`}>
                  <Icon className={`h-5 w-5 ${active ? "text-[#050A12]" : "text-[#A7FF00]"}`} />
                </div>
              ) : (
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {path === "/profile" && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-[#FF3366] text-[8px] font-bold text-white px-0.5">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </div>
              )}
              <span className={`text-[10px] font-heading font-semibold ${isScan ? "mt-1" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
