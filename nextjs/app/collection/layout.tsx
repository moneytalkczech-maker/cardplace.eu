import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Moje sbírka — CardPlace.eu",
  description: "Spravuj svou sbírku trading cards. Sleduj hodnotu kolekce, přidávej karty a sdílej sbírku s komunitou.",
  openGraph: {
    title: "Moje sbírka — CardPlace.eu",
    description: "Správa osobní sbírky trading cards.",
    type: "website",
  },
};

export default function CollectionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
