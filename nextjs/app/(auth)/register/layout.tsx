import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Registrace — CardPortal.eu",
  description: "Zaregistrujte se zdarma a začněte kupovat, prodávat a skenovat trading cards na CardPortal.eu.",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
