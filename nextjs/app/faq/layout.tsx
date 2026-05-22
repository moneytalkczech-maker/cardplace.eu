import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Časté dotazy (FAQ) — CardPortal.eu",
  description: "Nejčastější otázky o CardPortal.eu — registrace, aukce, platby, bezpečnost, poplatky.",
};

export default function FAQLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
