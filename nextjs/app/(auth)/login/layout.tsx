import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Přihlásit se — CardPlace.eu",
  description: "Přihlaste se do CardPlace.eu a přistupte ke svým aukcím, sbírce a nastavení.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
