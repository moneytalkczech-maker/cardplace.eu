import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Přihlásit se — CardPortal.eu",
  description: "Přihlaste se do CardPortal.eu a přistupte ke svým aukcím, sbírce a nastavení.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
