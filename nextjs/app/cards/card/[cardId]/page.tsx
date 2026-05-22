import type { Metadata } from "next";
import CardDetailClient from "./_client";

const BASE = process.env.EXPRESS_URL || "http://localhost:3001";

export async function generateMetadata({ params }: { params: { cardId: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${BASE}/api/database-cards/${params.cardId}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const card = await res.json();
      const desc = `${card.name} — ${card.set?.name || ""}${card.rarity ? ` · ${card.rarity}` : ""}. Orientační cena a historický vývoj hodnoty.`;
      return {
        title: `${card.name} — ${card.set?.name || "Karty"} | CardPortal.eu`,
        description: desc.slice(0, 155),
        openGraph: {
          title: `${card.name} — ${card.set?.name || ""}`,
          description: desc.slice(0, 155),
          images: card.imageUrl ? [{ url: card.imageUrl }] : [],
          type: "website",
        },
      };
    }
  } catch {}
  return { title: "Detail karty — CardPortal.eu" };
}

export default function CardDetailPage() {
  return <CardDetailClient />;
}
