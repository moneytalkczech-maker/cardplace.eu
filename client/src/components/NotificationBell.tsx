import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, DollarSign, Gavel, Heart, Info, Target } from "lucide-react";
import api from "../services/api";

interface Notification {
  id: string;
  type: "BID" | "OUTBID" | "PAYMENT" | "WANTED" | "NEW_AUCTION";
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const iconMap: Record<string, { icon: typeof Bell; color: string }> = {
  BID: { icon: Gavel, color: "text-yellow-400" },
  OUTBID: { icon: DollarSign, color: "text-red-400" },
  PAYMENT: { icon: Check, color: "text-green-400" },
  WANTED: { icon: Target, color: "text-purple-400" },
  NEW_AUCTION: { icon: Info, color: "text-blue-400" },
};

const defaultIcon = { icon: Info, color: "text-gray-400" };

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "právě teď";
  if (mins < 60) return `před ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "včera";
  if (days < 7) return `před ${days} dny`;
  return new Date(dateStr).toLocaleDateString("cs-CZ");
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data: Notification[] = await api.get("/users/notifications").then((r) => r.data);
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post("/users/notifications/read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await api.patch(`/users/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silently fail
      }
    }
    setIsOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(0,200,255,0.08)] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[rgba(0,200,255,0.15)] bg-[#0B1220] shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,200,255,0.1)]">
            <span className="text-sm font-semibold font-heading text-white">Oznámení</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#009DFF] hover:text-[#33B1FF] transition-colors font-medium"
              >
                Označit vše jako přečtené
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-sm text-gray-500 text-center">
                Žádná oznámení
              </div>
            ) : (
              notifications.slice(0, 30).map((n) => {
                const { icon: NotifIcon, color: iconColor } = iconMap[n.type] || defaultIcon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-[rgba(0,200,255,0.06)] hover:bg-[rgba(0,200,255,0.06)] transition-colors ${
                      !n.read ? "bg-[rgba(0,200,255,0.08)]" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <NotifIcon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug ${
                          !n.read ? "font-medium text-white" : "text-gray-300"
                        }`}
                      >
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
