import { describe, it, expect } from "vitest";
import { auth, auctions, users, cards, followApi, wantedApi, upload } from "../services/api";

describe("API service exports", () => {
  it("exports all API service modules", () => {
    expect(auth).toBeDefined();
    expect(auctions).toBeDefined();
    expect(users).toBeDefined();
    expect(cards).toBeDefined();
    expect(followApi).toBeDefined();
    expect(wantedApi).toBeDefined();
    expect(upload).toBeDefined();
  });

  it("auth module has expected methods", () => {
    expect(typeof auth.register).toBe("function");
    expect(typeof auth.login).toBe("function");
    expect(typeof auth.me).toBe("function");
    expect(typeof auth.getReferralCode).toBe("function");
  });

  it("auctions module has expected methods", () => {
    expect(typeof auctions.getAll).toBe("function");
    expect(typeof auctions.getById).toBe("function");
    expect(typeof auctions.create).toBe("function");
    expect(typeof auctions.placeBid).toBe("function");
    expect(typeof auctions.toggleWatch).toBe("function");
    expect(typeof auctions.boost).toBe("function");
  });
});
