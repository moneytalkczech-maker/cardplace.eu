import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Hledané karty — CardPlace.eu",
  description: "Komunita sběratelů hledá konkrétní karty. Přidej svou wishlist nebo najdi kupce pro karty, které prodáváš.",
  keywords: "hledané karty, trading card wishlist, sběratelé karet, wanted cards",
  openGraph: {
    title: "Hledané karty — CardPlace.eu",
    description: "Wishlist komunity — co sběratelé aktuálně hledají.",
    type: "website",
  },
};

export default function WantedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
