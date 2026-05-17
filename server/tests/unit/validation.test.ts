import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createAuctionSchema,
  bidSchema,
  completeTransactionSchema,
  auctionQuerySchema,
} from "../../src/utils/validation";

describe("Validation Schemas", () => {
  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        username: "testuser",
        password: "Password123",
        acceptedTerms: true,
        acceptedPrivacy: true,
        confirmedAge: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty email", () => {
      const result = registerSchema.safeParse({
        email: "",
        username: "testuser",
        password: "Password123",
        acceptedTerms: true,
        acceptedPrivacy: true,
        confirmedAge: true,
      });
      expect(result.success).toBe(false);
    });

    it("should reject weak password (no uppercase)", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
        acceptedTerms: true,
        acceptedPrivacy: true,
        confirmedAge: true,
      });
      expect(result.success).toBe(false);
    });

    it("should reject weak password (too short)", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        username: "testuser",
        password: "Pass1",
        acceptedTerms: true,
        acceptedPrivacy: true,
        confirmedAge: true,
      });
      expect(result.success).toBe(false);
    });

    it("should reject username too long", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        username: "a".repeat(31),
        password: "Password123",
        acceptedTerms: true,
        acceptedPrivacy: true,
        confirmedAge: true,
      });
      expect(result.success).toBe(false);
    });

    it("should reject without terms acceptance", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        username: "testuser",
        password: "Password123",
        acceptedTerms: false,
        acceptedPrivacy: true,
        confirmedAge: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty email", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "anypassword",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createAuctionSchema", () => {
    it("should accept valid auction data", () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result = createAuctionSchema.safeParse({
        title: "Charizard Base Set",
        description: "Rare card",
        startingPrice: 100,
        endTime: futureDate,
        confirmedOriginal: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid buyNowPrice higher than startingPrice", () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result = createAuctionSchema.safeParse({
        title: "Charizard Base Set",
        startingPrice: 100,
        buyNowPrice: 500,
        endTime: futureDate,
        confirmedOriginal: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject buyNowPrice lower than startingPrice", () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result = createAuctionSchema.safeParse({
        title: "Charizard Base Set",
        startingPrice: 500,
        buyNowPrice: 100,
        endTime: futureDate,
        confirmedOriginal: true,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative buyNowPrice", () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result = createAuctionSchema.safeParse({
        title: "Charizard Base Set",
        startingPrice: 100,
        buyNowPrice: -50,
        endTime: futureDate,
        confirmedOriginal: true,
      });
      expect(result.success).toBe(false);
    });

    it("should reject title too long", () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const result = createAuctionSchema.safeParse({
        title: "a".repeat(201),
        startingPrice: 100,
        endTime: futureDate,
        confirmedOriginal: true,
      });
      expect(result.success).toBe(false);
    });

    it("should reject past endTime", () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const result = createAuctionSchema.safeParse({
        title: "Charizard Base Set",
        startingPrice: 100,
        endTime: pastDate,
        confirmedOriginal: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("bidSchema", () => {
    it("should accept valid bid", () => {
      const result = bidSchema.safeParse({ amount: 100 });
      expect(result.success).toBe(true);
    });

    it("should accept valid bid with maxBid", () => {
      const result = bidSchema.safeParse({ amount: 100, maxBid: 500 });
      expect(result.success).toBe(true);
    });

    it("should reject negative amount", () => {
      const result = bidSchema.safeParse({ amount: -50 });
      expect(result.success).toBe(false);
    });

    it("should reject zero amount", () => {
      const result = bidSchema.safeParse({ amount: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject negative maxBid", () => {
      const result = bidSchema.safeParse({ amount: 100, maxBid: -50 });
      expect(result.success).toBe(false);
    });

    it("should reject zero maxBid", () => {
      const result = bidSchema.safeParse({ amount: 100, maxBid: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe("completeTransactionSchema", () => {
    it("should accept valid auctionId", () => {
      const result = completeTransactionSchema.safeParse({ auctionId: "clx1234567890" });
      expect(result.success).toBe(true);
    });

    it("should reject empty auctionId", () => {
      const result = completeTransactionSchema.safeParse({ auctionId: "" });
      expect(result.success).toBe(false);
    });

    it("should reject too long auctionId", () => {
      const result = completeTransactionSchema.safeParse({ auctionId: "a".repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe("auctionQuerySchema", () => {
    it("should accept valid search query", () => {
      const result = auctionQuerySchema.safeParse({ search: "charizard", sort: "ending" });
      expect(result.success).toBe(true);
    });

    it("should reject search query too long", () => {
      const result = auctionQuerySchema.safeParse({ search: "a".repeat(201) });
      expect(result.success).toBe(false);
    });

    it("should reject invalid category", () => {
      const result = auctionQuerySchema.safeParse({ category: "invalid" });
      expect(result.success).toBe(false);
    });

    it("should accept valid category", () => {
      const result = auctionQuerySchema.safeParse({ category: "pokemon" });
      expect(result.success).toBe(true);
    });
  });
});
