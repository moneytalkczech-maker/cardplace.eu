import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Databáze karet — CardPlace.eu",
  description: "Prohledej databázi trading cards — Pokémon, MTG, Yu-Gi-Oh!, sports karty a další. Zjisti ceny, rarity a dostupné aukce.",
  keywords: "trading card databáze, pokémon karty, MTG karty, sports karty ceny, sběratelské karty",
  openGraph: {
    title: "Databáze karet — CardPlace.eu",
    description: "Kompletní databáze sběratelských karet s cenami a aukcemi.",
    type: "website",
  },
};

export default function CardsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
