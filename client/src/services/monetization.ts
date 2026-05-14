import api from "./api";
import type { MonetizationPrices } from "../types";

export const monetizationApi = {
  getPrices: () => api.get("/monetization/prices").then((r) => r.data as MonetizationPrices),

  createVipCheckout: (plan: "monthly" | "yearly") =>
    api.post("/monetization/vip/create-checkout", { plan }).then((r) => r.data),

  createVerifiedCheckout: () =>
    api.post("/monetization/verified/create-checkout").then((r) => r.data),

  createBoostCheckout: (auctionId: string, boostType: string) =>
    api.post("/monetization/boost/create-checkout", { auctionId, boostType }).then((r) => r.data),

  getFounders: () => api.get("/monetization/founders").then((r) => r.data),
};
