import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aukce karet — CardPlace.eu",
  description: "Procházej živé aukce Pokémon, MTG, sports karet a dalších sběratelských karet. Přihazuj v reálném čase na CardPlace.eu.",
  openGraph: {
    title: "Aukce karet — CardPlace.eu",
    description: "Živé aukce trading cards. Pokémon, MTG, sports karty a více.",
  },
};

export default function AuctionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
