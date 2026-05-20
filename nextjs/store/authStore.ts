"use client";
import { create } from "zustand";
import { auth, users, setApiToken } from "@/lib/api";
import type { User, Notification } from "@/types";

const LOGGED_IN_KEY = "cardplace_logged_in";

function getLoggedInFlag(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LOGGED_IN_KEY) === "true";
}

function setLoggedInFlag(val: boolean) {
  if (typeof window === "undefined") return;
  if (val) localStorage.setItem(LOGGED_IN_KEY, "true");
  else localStorage.removeItem(LOGGED_IN_KEY);
}

interface AuthState {
  user: User | null;
  token: string | null;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, referralCode?: string, acceptedTerms?: boolean, acceptedPrivacy?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  tryRefreshToken: () => Promise<boolean>;
  fetchNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  notifications: [],
  unreadCount: 0,
  loading: false,
  initialized: false,

  login: async (email, password) => {
    const data = await auth.login({ email, password });
    setLoggedInFlag(true);
    setApiToken(data.token);
    set({ token: data.token, user: data.user, initialized: true });
  },

  register: async (email, username, password, referralCode, acceptedTerms = true, acceptedPrivacy = true) => {
    const data = await auth.register({ email, username, password, referralCode, acceptedTerms, acceptedPrivacy });
    setLoggedInFlag(true);
    setApiToken(data.token);
    set({ token: data.token, user: data.user, initialized: true });
  },

  logout: async () => {
    try { await auth.logout(); } catch { /* ignore */ }
    setLoggedInFlag(false);
    setApiToken(null);
    set({ user: null, token: null, notifications: [], unreadCount: 0, initialized: false });
  },

  tryRefreshToken: async () => {
    try {
      const data = await auth.refresh();
      setLoggedInFlag(true);
      setApiToken(data.token);
      set({ token: data.token, initialized: true });
      return true;
    } catch {
      setLoggedInFlag(false);
      setApiToken(null);
      set({ token: null, user: null, initialized: true });
      return false;
    }
  },

  loadUser: async () => {
    const token = get().token;
    if (!token && !getLoggedInFlag()) {
      set({ initialized: true });
      return;
    }
    if (!token && getLoggedInFlag()) {
      const ok = await get().tryRefreshToken();
      if (!ok) return;
    }
    const currentToken = get().token;
    if (!currentToken) { set({ initialized: true }); return; }
    set({ loading: true });
    try {
      const user = await auth.me();
      set({ user, loading: false, initialized: true });
    } catch {
      setLoggedInFlag(false);
      setApiToken(null);
      set({ user: null, token: null, loading: false, initialized: true });
    }
  },

  fetchNotifications: async () => {
    try {
      const notifications = await users.getNotifications();
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;
      set({ notifications, unreadCount });
    } catch { /* ignore */ }
  },

  markNotificationsRead: async () => {
    await users.markNotificationsRead();
    set({ unreadCount: 0 });
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
}));
