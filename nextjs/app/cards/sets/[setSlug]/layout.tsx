import type { Metadata } from "next";

const BASE = process.env.EXPRESS_URL || "http://localhost:3001";

export async function generateMetadata({ params }: { params: { setSlug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${BASE}/api/card-sets`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const sets: { slug: string; name: string; game: string }[] = await res.json();
      const set = sets.find((s) => s.slug === params.setSlug);
      if (set) {
        return {
          title: `${set.name} — ${set.game} | CardPlace.eu`,
          description: `Karty z edice ${set.name} (${set.game}). Prohlédni si databázi karet a najdi aukce na CardPlace.eu.`,
          openGraph: {
            title: `${set.name} — ${set.game}`,
            description: `Databáze karet z edice ${set.name}.`,
          },
        };
      }
    }
  } catch {}
  return {
    title: "Edice karet — CardPlace.eu",
    description: "Databáze sběratelských karet na CardPlace.eu.",
  };
}

export default function SetSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
