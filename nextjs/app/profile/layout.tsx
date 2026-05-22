import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Můj profil — CardPortal.eu",
  description: "Spravuj svůj profil, aukce, příhozy a sledované položky na CardPortal.eu.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
