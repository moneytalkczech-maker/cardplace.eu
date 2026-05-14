import { create } from "zustand";
import { auth, users } from "../services/api";
import type { User, Notification } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  notifications: [],
  unreadCount: 0,
  loading: false,

  login: async (email, password) => {
    const data = await auth.login({ email, password });
    localStorage.setItem("token", data.token);
    set({ token: data.token, user: data.user });
  },

  register: async (email, username, password, referralCode) => {
    const data = await auth.register({ email, username, password, referralCode });
    localStorage.setItem("token", data.token);
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, notifications: [], unreadCount: 0 });
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) return;
    set({ loading: true });
    try {
      const user = await auth.me();
      set({ user, loading: false });
    } catch {
      set({ user: null, token: null, loading: false });
      localStorage.removeItem("token");
    }
  },

  fetchNotifications: async () => {
    try {
      const notifications = await users.getNotifications();
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;
      set({ notifications, unreadCount });
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  },

  markNotificationsRead: async () => {
    await users.markNotificationsRead();
    set({ unreadCount: 0 });
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
}));
