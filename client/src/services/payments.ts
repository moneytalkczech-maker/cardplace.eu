import api from "./api";

export const payments = {
  createCheckout: (auctionId: string) =>
    api.post("/payments/create-checkout", { auctionId }).then((r) => r.data),
  getConfig: () => api.get("/payments/config").then((r) => r.data),
  submitReview: (transactionId: string, rating: number, comment?: string) =>
    api.post("/payments/review", { transactionId, rating, comment }).then((r) => r.data),
  getReviews: (userId: string) =>
    api.get(`/payments/reviews/${userId}`).then((r) => r.data),
};
