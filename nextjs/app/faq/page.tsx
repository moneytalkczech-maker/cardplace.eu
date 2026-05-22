"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import LegalLayout from "@/components/layout/LegalLayout";

const faqs = [
  { q: "Co je CardPortal.eu?", a: "CardPortal.eu je aukční platforma specializovaná na sběratelské karty — Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sportovní karty a další. Nabízíme bezpečné prostředí pro nákup a prodej karet s real-time přihazováním, AI ochranou proti podvodům a transparentními poplatky." },
  { q: "Jak vytvořím aukci?", a: "Po registraci a ověření emailu klikněte na 'Vytvořit aukci'. Nahrajte fotku karty, vyplňte název, popis, stav karty (NM/LP/MP/HP/DMG), nastavte vyvolávací cenu a délku aukce. Potvrďte originalitu zboží a publikujte." },
  { q: "Jak fungují příhozy?", a: "Příhozy jsou závazné. Minimální navýšení je 1 Kč. Pokud zbývá méně než 2 minuty do konce, aukce se automaticky prodlouží o 2 minuty (anti-sniping ochrana). Příhozy probíhají v reálném čase." },
  { q: "Mohu přihazovat na vlastní aukci?", a: "Ne, přihazování na vlastní aukci je blokováno. Jde o ochranu proti manipulaci s cenou (shilling)." },
  { q: "Jaké jsou poplatky?", a: "V beta fázi jsou všechny poplatky 0%. Po spuštění bude poplatek prodejce progresivní: 0% do 500 Kč, 5% od 500 do 5000 Kč, 6% nad 5000 Kč. VIP a Founders mají sníženou sazbu 3%. Kupující neplatí žádné poplatky." },
  { q: "Jak probíhá platba?", a: "Po vyhrané aukci kupující zaplatí přes Stripe (kreditní karta, Apple Pay, Google Pay). Prodejce obdrží platbu po odečtení poplatku platformy." },
  { q: "Co se stane, když aukce skončí bez příhozů?", a: "Aukce se automaticky označí jako 'ENDED'. Položka zůstane ve vašem profilu a můžete ji znovu vystavit nebo smazat." },
  { q: "Jak mohu nahlásit podezřelou aukci?", a: "Na detailu každé aukce je tlačítko 'Nahlásit'. Vyberte důvod a přidejte popis. Náš tým report zpracuje do 24 hodin." },
  { q: "Jak funguje ověření prodejce?", a: "Ověření prodejce je volitelné — za jednorázový poplatek 199 Kč získáte verified badge, což zvyšuje důvěru kupujících. Ověření zahrnuje kontrolu identity." },
  { q: "Co je VIP účet?", a: "VIP účet (199 Kč/měsíc nebo 1990 Kč/rok) nabízí snížené poplatky (3%), prioritu v search, VIP badge a další výhody." },
  { q: "Jak mohu smazat svůj účet?", a: "V nastavení profilu najdete možnost 'Smazat účet'. Tato akce je nevratná — smaže všechny vaše aukce, příhozy, data a osobní informace v souladu s GDPR." },
  { q: "Jaké karty mohu prodávat?", a: "Pokémon, Magic: The Gathering, Yu-Gi-Oh!, sportovní karty a další sběratelské karty. Zakázány jsou padělky, kradené zboží a neoriginální produkty." },
  { q: "Jak funguje AI ochrana?", a: "Náš AI systém automaticky kontroluje každou aukci na podezřelé chování — nové účty s vysokými cenami, riziková slova v popisu, neobvyklé bidding patterny." },
  { q: "Mohu komunikovat s kupujícím/prodejcem?", a: "Ano, po vyhrané aukci můžete komunikovat přes platformu. Doporučujeme veškerou komunikaci vést přes CardPortal.eu." },
  { q: "Co dělat, když nastane problém?", a: "Nejprve kontaktujte druhou stranu přes platformu. Pokud se problém nevyřeší, využijte report nebo kontaktujte podporu na info@cardportal.eu do 48 hodin." },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <LegalLayout title="Časté dotazy (FAQ)" lastUpdated="17. 5. 2026">
      <div className="mb-6 flex items-center gap-3">
        <HelpCircle className="h-6 w-6 text-[#00C8FF]" />
        <p className="text-sm text-gray-400">
          Odpovědi na nejčastější otázky. Nenašli jste? <a href="/contact" className="text-[#00C8FF] hover:underline">Napište nám</a>.
        </p>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-xl border border-[rgba(0,200,255,0.08)] overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[rgba(0,200,255,0.03)] transition-colors"
            >
              <span className="font-heading font-semibold text-sm pr-4 text-white">{faq.q}</span>
              {openIndex === i
                ? <ChevronUp className="h-5 w-5 text-[#00C8FF] shrink-0" />
                : <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />}
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-[rgba(0,200,255,0.06)] pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-5 rounded-xl bg-[rgba(0,200,255,0.04)] border border-[rgba(0,200,255,0.1)] text-center">
        <p className="text-sm text-gray-400 mb-3">Stále máte otázky?</p>
        <a href="/contact" className="btn-primary font-heading inline-flex items-center gap-2">
          Napište nám
        </a>
      </div>
    </LegalLayout>
  );
}
