import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Skener karet — CardPortal.eu",
  description: "Naskenuj trading card pomocí Claude AI. Okamžitá identifikace — Pokémon, MTG, Yu-Gi-Oh!, sports karty. Zjisti název, raritu, stav a orientační cenu.",
  keywords: "AI scanner, trading card identifikace, pokemon skener, MTG scanner, carte scan",
  openGraph: {
    title: "AI Skener karet — CardPortal.eu",
    description: "Okamžitá identifikace trading cards pomocí Claude AI — stačí jeden snímek.",
    type: "website",
  },
};

export default function ScanLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
