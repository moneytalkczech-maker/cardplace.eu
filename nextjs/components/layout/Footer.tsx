"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

const HIDDEN_ON = ["/admin", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/auth-callback"];

export default function Footer() {
  const { t } = useTranslation();
  const pathname = usePathname();

  if (HIDDEN_ON.some((r) => pathname?.startsWith(r))) return null;

  return (
    <footer className="border-t border-[rgba(0,200,255,0.06)] py-8 mt-auto">
      <div className="container-premium">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-600">
          <Link href="/legal/terms" className="hover:text-gray-400 transition-colors">{t("footer.terms")}</Link>
          <Link href="/legal/privacy" className="hover:text-gray-400 transition-colors">{t("footer.privacy")}</Link>
          <Link href="/legal/cookies" className="hover:text-gray-400 transition-colors">{t("footer.cookies")}</Link>
          <Link href="/legal/auction-rules" className="hover:text-gray-400 transition-colors">{t("footer.auctionRules")}</Link>
          <Link href="/legal/prohibited-items" className="hover:text-gray-400 transition-colors">{t("footer.prohibited")}</Link>
          <Link href="/contact" className="hover:text-gray-400 transition-colors">{t("footer.contact")}</Link>
          <Link href="/faq" className="hover:text-gray-400 transition-colors">FAQ</Link>
          <Link href="/legal/fees" className="hover:text-gray-400 transition-colors">Ceník a poplatky</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-gray-500 mt-3">
          <span>Card data © <a href="https://pokemontcg.io" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">Pokémon TCG API</a> (CC0)</span>
          <span>Magic data © <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">Scryfall</a> (CC0)</span>
          <span>Yu-Gi-Oh! data © <a href="https://ygoprodeck.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">YGOPRODeck</a></span>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          © {new Date().getFullYear()} CardPlace s.r.o. {t("footer.rights")}
        </p>
        <p className="text-[10px] text-gray-600 text-center mt-1">
          IČO: 12345678 • Sídlo: Praha, Česká republika
        </p>
      </div>
    </footer>
  );
}
