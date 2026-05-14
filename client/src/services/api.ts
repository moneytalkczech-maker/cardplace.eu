import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

interface AuctionFilters {
  search?: string;
  sort?: string;
  status?: string;
  category?: string;
}

export const auth = {
  register: (data: { email: string; username: string; password: string; referralCode?: string }) =>
    api.post("/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  getReferralCode: () => api.get("/auth/referral-code").then((r) => r.data),
};

export const auctions = {
  getAll: (params?: AuctionFilters) => api.get("/auctions", { params }).then((r) => r.data),
  getFeatured: () => api.get("/auctions/featured").then((r) => r.data),
  getTrending: () => api.get("/auctions/trending").then((r) => r.data),
  getLastSold: () => api.get("/auctions/last-sold").then((r) => r.data),
  getById: (id: string) => api.get(`/auctions/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post("/auctions", data).then((r) => r.data),
  placeBid: (id: string, amount: number, username?: string) =>
    api.post(`/auctions/${id}/bid`, { amount, username }).then((r) => r.data),
  toggleWatch: (id: string) => api.post(`/auctions/${id}/watch`).then((r) => r.data),
  boost: (id: string) => api.post(`/auctions/${id}/boost`).then((r) => r.data),
  delete: (id: string) => api.delete(`/auctions/${id}`).then((r) => r.data),
};

export const users = {
  getProfile: (id: string) => api.get(`/users/profile/${id}`).then((r) => r.data),
  getMyAuctions: () => api.get("/users/my-auctions").then((r) => r.data),
  getMyBids: () => api.get("/users/my-bids").then((r) => r.data),
  getWatchlist: () => api.get("/users/watchlist").then((r) => r.data),
  getNotifications: () => api.get("/users/notifications").then((r) => r.data),
  markNotificationsRead: () => api.post("/users/notifications/read").then((r) => r.data),
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

export const upload = {
  image: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return api.post("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
};

export default api;
