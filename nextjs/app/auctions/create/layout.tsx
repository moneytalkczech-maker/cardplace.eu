import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vytvořit aukci — CardPlace.eu",
  description: "Vytvoř novou aukci pro svou sběratelskou kartu. Nastav cenu, podmínky a délku aukce.",
  robots: "noindex",
};

export default function CreateAuctionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
