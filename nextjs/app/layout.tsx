import type { Metadata } from "next";
import "./globals.css";
import "@/sentry.config";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import Providers from "@/components/providers/Providers";
import ToastContainer from "@/components/ui/Toast";
import CookieConsent from "@/components/ui/CookieConsent";

export const metadata: Metadata = {
  title: "CardPlace.eu — Trading Card Marketplace",
  description: "Moderní aukční platforma pro sběratele trading cards. Skenuj, draž a sbírej Pokémon, MTG, sports karty a další.",
  keywords: "trading cards, pokemon, magic the gathering, karty, aukce, marketplace, sběratelé",
  openGraph: {
    title: "CardPlace.eu",
    description: "Největší CZ/SK marketplace pro sběratelské karty",
    type: "website",
    locale: "cs_CZ",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#050A12] text-gray-100">
        <Providers>
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
          <ToastContainer />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
