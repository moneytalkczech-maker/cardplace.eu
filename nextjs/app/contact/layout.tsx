import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kontakt — CardPlace.eu",
  description: "Kontaktujte tým CardPlace.eu. Otázky, spolupráce, nahlášení problémů.",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
