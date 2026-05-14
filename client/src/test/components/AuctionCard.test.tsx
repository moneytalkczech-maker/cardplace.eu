import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuctionCard from "../../components/AuctionCard";
import type { Auction } from "../../types";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, Link: actual.Link };
});

vi.mock("../../hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "card.currentBid": "Aktuální nabídka",
        "card.startingAt": "Vyvolávací",
        "card.featured": "Doporučené",
        "detail.ended": "Ukončeno",
        "detail.placeBid": "Přihodit",
      };
      return map[key] || key;
    },
  }),
}));

vi.mock("../../components/RankBadge", () => ({
  default: ({ rank }: { rank?: string }) => <span>{rank || "bronze"}</span>,
}));

function createMockAuction(overrides: Partial<Auction> = {}): Auction {
  return {
    id: "test-1",
    title: "Test Auction Card",
    startingPrice: 100,
    currentPrice: 150,
    minIncrement: 10,
    endTime: new Date(Date.now() + 86400000).toISOString(),
    status: "ACTIVE",
    featured: false,
    createdAt: new Date().toISOString(),
    userId: "user-1",
    user: { id: "user-1", username: "testuser", trustScore: 80, rank: "gold" },
    bidCount: 3,
    ...overrides,
  };
}

describe("AuctionCard", () => {
  it("renders the auction title", () => {
    render(
      <MemoryRouter>
        <AuctionCard auction={createMockAuction()} />
      </MemoryRouter>
    );
    expect(screen.getByText("Test Auction Card")).toBeInTheDocument();
  });

  it("renders the current price", () => {
    render(
      <MemoryRouter>
        <AuctionCard auction={createMockAuction()} />
      </MemoryRouter>
    );
    expect(screen.getByText("150 Kč")).toBeInTheDocument();
  });

  it("renders rarity badge when card has rarity", () => {
    render(
      <MemoryRouter>
        <AuctionCard auction={createMockAuction({
          card: { id: "c-1", name: "Charizard", setName: "Base Set", setCode: "base1", rarity: "Rare Holo" },
        })} />
      </MemoryRouter>
    );
    expect(screen.getByText("Rare Holo")).toBeInTheDocument();
  });

  it("does not render rarity badge when card has no rarity", () => {
    render(
      <MemoryRouter>
        <AuctionCard auction={createMockAuction({
          card: { id: "c-1", name: "Charizard", setName: "Base Set", setCode: "base1" },
        })} />
      </MemoryRouter>
    );
    expect(screen.queryByText("Rare Holo")).not.toBeInTheDocument();
  });

  it("renders featured badge when auction is featured", () => {
    render(
      <MemoryRouter>
        <AuctionCard auction={createMockAuction({ featured: true })} />
      </MemoryRouter>
    );
    expect(screen.getByText("Doporučené")).toBeInTheDocument();
  });

  it("renders the starting price", () => {
    render(
      <MemoryRouter>
        <AuctionCard auction={createMockAuction()} />
      </MemoryRouter>
    );
    expect(screen.getByText("100 Kč")).toBeInTheDocument();
  });

  it("renders the username", () => {
    render(
      <MemoryRouter>
        <AuctionCard auction={createMockAuction()} />
      </MemoryRouter>
    );
    expect(screen.getByText("@testuser")).toBeInTheDocument();
  });

  it("renders ended state when auction is past endTime", () => {
    render(
      <MemoryRouter>
        <AuctionCard auction={createMockAuction({
          endTime: new Date(Date.now() - 3600000).toISOString(),
        })} />
      </MemoryRouter>
    );
    expect(screen.getByText("Ukončeno")).toBeInTheDocument();
  });

  it("renders bid count", () => {
    render(
      <MemoryRouter>
        <AuctionCard auction={createMockAuction()} />
      </MemoryRouter>
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
