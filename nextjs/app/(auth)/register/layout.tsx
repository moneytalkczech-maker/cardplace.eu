import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Registrace — CardPlace.eu",
  description: "Zaregistrujte se zdarma a začněte kupovat, prodávat a skenovat trading cards na CardPlace.eu.",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
