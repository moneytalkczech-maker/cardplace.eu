import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Můj profil — CardPlace.eu",
  description: "Spravuj svůj profil, aukce, příhozy a sledované položky na CardPlace.eu.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
