import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import type { Auction, User, Bid, Transaction, Notification } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return api.get(url, config).then((r) => r.data as T);
}
function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return api.post(url, data, config).then((r) => r.data as T);
}
function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  return api.patch(url, data).then((r) => r.data as T);
}
function apiDelete<T>(url: string): Promise<T> {
  return api.delete(url).then((r) => r.data as T);
}

// Token injection — must be called after authStore is initialized
export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = apiPost<{ token: string }>("/auth/refresh")
          .then((data) => {
            setApiToken(data.token);
            isRefreshing = false;
            refreshPromise = null;
          })
          .catch(() => {
            isRefreshing = false;
            refreshPromise = null;
            setApiToken(null);
            if (typeof window !== "undefined") window.location.href = "/login";
            throw err;
          });
      }
      try {
        await refreshPromise;
        return api(originalRequest);
      } catch {
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

interface AuctionFilters {
  search?: string;
  sort?: string;
  status?: string;
  category?: string;
  cursor?: string;
}

export const auth = {
  register: (data: { email: string; username: string; password: string; referralCode?: string; acceptedTerms?: boolean; acceptedPrivacy?: boolean }) =>
    apiPost<{ token: string; refreshToken: string; user: User }>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    apiPost<{ token: string; refreshToken: string; user: User }>("/auth/login", data),
  me: () => apiGet<User>("/auth/me"),
  getReferralCode: () => apiGet<{ code: string }>("/auth/referral-code"),
  refresh: () => apiPost<{ token: string }>("/auth/refresh"),
  logout: () => apiPost<{ success: boolean }>("/auth/logout"),
};

export const auctions = {
  getAll: (params?: AuctionFilters) => apiGet<{ data: Auction[]; nextCursor: string | null }>("/auctions", { params }),
  getFeatured: () => apiGet<Auction[]>("/auctions/featured"),
  getTrending: () => apiGet<Auction[]>("/auctions/trending"),
  getLastSold: () => apiGet<Transaction[]>("/auctions/last-sold"),
  getById: (id: string) => apiGet<Auction>(`/auctions/${id}`),
  create: (data: Record<string, unknown>) => apiPost<Auction>("/auctions", data),
  placeBid: (id: string, amount: number, username?: string, maxBid?: number) =>
    apiPost<Bid>(`/auctions/${id}/bid`, { amount, username, maxBid }),
  buyNow: (id: string) => api.post(`/auctions/${id}/buy-now`).then((r) => r.data),
  toggleWatch: (id: string) => apiPost<{ watched: boolean }>(`/auctions/${id}/watch`),
  boost: (id: string) => apiPost<{ featured: boolean; credits: number }>(`/auctions/${id}/boost`),
  delete: (id: string) => apiDelete<{ success: boolean }>(`/auctions/${id}`),
};

export const users = {
  getProfile: (id: string) => apiGet<User & { auctionCount: number; bidCount: number }>(`/users/profile/${id}`),
  getMyAuctions: () => apiGet<Auction[]>("/users/my-auctions"),
  getMyBids: () => apiGet<Bid[]>("/users/my-bids"),
  getWatchlist: () => apiGet<Auction[]>("/users/watchlist"),
  getNotifications: () => apiGet<Notification[]>("/users/notifications"),
  markNotificationsRead: () => apiPost<{ success: boolean }>("/users/notifications/read"),
  markNotificationRead: (id: string) => apiPatch<{ success: boolean }>(`/users/notifications/${id}/read`),
};

export const cards = {
  search: (q: string) => api.get("/cards/search", { params: { q } }).then((r) => r.data),
  getSets: () => api.get("/cards/sets").then((r) => r.data),
  sync: () => api.post("/cards/sync").then((r) => r.data),
};

export const followApi = {
  toggle: (userId: string) => api.post(`/follow/${userId}`).then((r) => r.data),
  check: (userId: string) => api.get(`/follow/${userId}/check`).then((r) => r.data),
  getFollowers: (userId: string) => api.get(`/follow/${userId}/followers`).then((r) => r.data),
  getFollowing: (userId: string) => api.get(`/follow/${userId}/following`).then((r) => r.data),
};

export const wantedApi = {
  getAll: () => api.get("/wanted").then((r) => r.data),
  create: (data: { cardId: string; cardName: string; cardSet?: string; description?: string; maxPrice?: string }) =>
    api.post("/wanted", data).then((r) => r.data),
  remove: (id: string) => api.delete(`/wanted/${id}`).then((r) => r.data),
};

export const adminApi = {
  getStats: () => api.get("/admin/stats").then((r) => r.data),
  listUsers: (page = 1, limit = 50) => api.get("/admin/users", { params: { page, limit } }).then((r) => r.data),
  updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  toggleUserVerification: (id: string) => api.patch(`/admin/users/${id}/verify`).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  toggleUserBan: (id: string) => api.patch(`/admin/users/${id}/ban`).then((r) => r.data),
  listAuctions: (page = 1, limit = 50) => api.get("/admin/auctions", { params: { page, limit } }).then((r) => r.data),
  cancelAuction: (id: string) => api.patch(`/admin/auctions/${id}/cancel`).then((r) => r.data),
  toggleAuctionFeature: (id: string) => api.patch(`/admin/auctions/${id}/feature`).then((r) => r.data),
  listSettings: () => api.get("/admin/settings").then((r) => r.data),
  updateSetting: (id: string, value: string) => api.patch(`/admin/settings/${id}`, { value }).then((r) => r.data),
  listCards: (page = 1, limit = 50, search?: string) => api.get("/admin/cards", { params: { page, limit, search } }).then((r) => r.data),
  updateCardStatus: (id: string, status: string) => api.patch(`/admin/cards/${id}/status`, { status }).then((r) => r.data),
  deleteCard: (id: string) => api.delete(`/admin/cards/${id}`).then((r) => r.data),
  listDatabaseCards: (page = 1, limit = 50, search?: string) => api.get("/admin/card-database", { params: { page, limit, search } }).then((r) => r.data),
  deleteDatabaseCard: (id: string) => api.delete(`/admin/card-database/${id}`).then((r) => r.data),
  listUploads: (page = 1, limit = 50) => api.get("/admin/uploads", { params: { page, limit } }).then((r) => r.data),
  deleteUpload: (id: string) => api.delete(`/admin/uploads/${id}`).then((r) => r.data),
  listEmailTemplates: () => api.get("/admin/email-templates").then((r) => r.data),
  updateEmailTemplate: (id: string, data: { subject?: string; bodyHtml?: string }) => api.patch(`/admin/email-templates/${id}`, data).then((r) => r.data),
  listLegalDocuments: () => api.get("/admin/legal-documents").then((r) => r.data),
  updateLegalDocument: (id: string, data: { title?: string; content?: string; published?: boolean }) => api.patch(`/admin/legal-documents/${id}`, data).then((r) => r.data),
  getSystemInfo: () => api.get("/admin/system").then((r) => r.data),
  getSecuritySettings: () => api.get("/admin/security").then((r) => r.data),
  updateSecuritySetting: (key: string, value: string) => api.patch("/admin/security", { key, value }).then((r) => r.data),
};

export const upload = {
  image: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return api.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
};

export const contact = {
  submit: (data: { name: string; email: string; message: string }) =>
    api.post("/contact", data).then((r) => r.data),
};

export default api;
