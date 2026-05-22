import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zprávy — CardPortal.eu",
  description: "Komunikuj s kupujícími a prodejci přímo na CardPortal.eu.",
  robots: "noindex",
};

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
