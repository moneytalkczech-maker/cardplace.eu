import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nastavení — CardPlace.eu",
  description: "Spravuj nastavení účtu, bezpečnost a prémiové funkce.",
  robots: "noindex",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
