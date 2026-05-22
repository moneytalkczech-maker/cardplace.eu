import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aukce karet — CardPortal.eu",
  description: "Procházej živé aukce Pokémon, MTG, sports karet a dalších sběratelských karet. Přihazuj v reálném čase na CardPortal.eu.",
  openGraph: {
    title: "Aukce karet — CardPortal.eu",
    description: "Živé aukce trading cards. Pokémon, MTG, sports karty a více.",
  },
};

export default function AuctionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
