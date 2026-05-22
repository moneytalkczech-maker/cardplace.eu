import type { Metadata } from "next";
import ProfileView from "@/components/profile/ProfileView";

const BASE = process.env.EXPRESS_URL || "http://localhost:3001";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${BASE}/api/users/${params.id}/public`, { next: { revalidate: 300 } });
    if (res.ok) {
      const user = await res.json();
      return {
        title: `${user.username} — Profil prodejce | CardPlace.eu`,
        description: `Profil uživatele ${user.username} na CardPlace.eu — ${user.totalSales || 0} prodaných karet, hodnocení důvěry: ${user.trustScore || 0}.`,
        openGraph: {
          title: `${user.username} na CardPlace.eu`,
          description: `Sběratel a prodejce trading cards. Ověřte si profil a aukce.`,
          images: user.avatarUrl ? [{ url: user.avatarUrl }] : [],
        },
      };
    }
  } catch {}
  return { title: "Profil uživatele — CardPlace.eu" };
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  return <ProfileView userId={params.id} />;
}
