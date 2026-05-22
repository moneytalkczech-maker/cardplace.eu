import type { Metadata } from "next";
import AuctionDetailClient from "./_client";

const BASE = process.env.EXPRESS_URL || "http://localhost:3001";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${BASE}/api/auctions/${params.id}`, { next: { revalidate: 0 } });
    if (res.ok) {
      const auction = await res.json();
      const desc = auction.description
        ? auction.description.slice(0, 155)
        : `Aukce: ${auction.title} — aktuální cena ${(auction.currentPrice || 0).toLocaleString("cs-CZ")} Kč`;
      return {
        title: `${auction.title} — CardPlace.eu`,
        description: desc,
        openGraph: {
          title: auction.title,
          description: desc,
          images: auction.imageUrl ? [{ url: auction.imageUrl }] : [],
          type: "website",
        },
      };
    }
  } catch {}
  return { title: "Aukce — CardPlace.eu" };
}

export default function AuctionDetailPage() {
  return <AuctionDetailClient />;
}
