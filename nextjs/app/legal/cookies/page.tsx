import type { Metadata } from "next";
import LegalLayout from "@/components/layout/LegalLayout";

export const metadata: Metadata = {
  title: "Cookies — CardPlace.eu",
  description: "Informace o používání cookies na platformě CardPlace.eu.",
};

export default function LegalCookiesPage() {
  return (
    <LegalLayout title="Cookies" lastUpdated="14. 5. 2026">
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Co jsou cookies?</h2>
        <p>Cookies jsou malé textové soubory, které se ukládají ve vašem prohlížeči při návštěvě webu.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Jaké cookies používáme</h2>
        <h3 className="font-bold text-white mt-4 mb-2">Nezbytné (vždy aktivní)</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Udržení přihlášení</li>
          <li>Bezpečnostní tokeny</li>
          <li>Nastavení cookie preference</li>
        </ul>
        <h3 className="font-bold text-white mt-4 mb-2">Analytické</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Google Analytics / vlastní analytika</li>
          <li>Sledování návštěvnosti</li>
          <li>Zlepšování služeb</li>
        </ul>
        <h3 className="font-bold text-white mt-4 mb-2">Marketingové</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Retargeting reklamy</li>
          <li>Měření účinnosti kampaní</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">localStorage</h2>
        <p>Pro ukládání tokenů a uživatelského nastavení používáme localStorage. Tato data zůstávají ve vašem prohlížeči.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Správa cookies</h2>
        <p>Svůj souhlas můžete kdykoliv změnit v nastavení cookies. Nezbytné cookies nelze deaktivovat.</p>
      </section>
    </LegalLayout>
  );
}
