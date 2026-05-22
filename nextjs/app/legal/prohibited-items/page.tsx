import type { Metadata } from "next";
import LegalLayout from "@/components/layout/LegalLayout";

export const metadata: Metadata = {
  title: "Zakázané položky — CardPlace.eu",
  description: "Přehled zakázaných položek a padělků na platformě CardPlace.eu.",
};

export default function LegalProhibitedPage() {
  return (
    <LegalLayout title="Zakázané položky" lastUpdated="14. 5. 2026">
      <section>
        <p className="mb-4">Na platformě CardPlace.eu je přísně zakázáno prodávat následující položky:</p>
        <div className="space-y-4">
          {[
            { title: "Fake / Padělky", desc: "Jakékoliv neoriginální karty vydávané za pravé. Včetně napodobenin slabikářů, textur a log." },
            { title: "Proxy karty", desc: "Vlastní tisky karet, které nejsou originálními produkty vydavatelů. Proxy nejsou povoleny ani s označením \"proxy\"." },
            { title: "Replika / Counterfeit", desc: "Kopie originálních karet bez ohledu na kvalitu zpracování." },
            { title: "Kradené zboží", desc: "Jakékoliv položky, k jejichž prodeji nemá prodávající oprávnění." },
            { title: "Nelegální obsah", desc: "Pornografie, násilí, extremistický obsah a jiné nelegální materiály." },
            { title: "Zavádějící aukce", desc: "Aukce, které klamavě popisují položku, používají kradené fotografie nebo uvádějí kupujícího v omyl." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] p-4">
              <h3 className="font-bold text-red-400 mb-1">❌ {item.title}</h3>
              <p className="text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-lg bg-[rgba(0,200,255,0.04)] border border-[rgba(0,200,255,0.1)]">
          <p className="text-sm font-semibold">Nahlášení podezřelé aukce</p>
          <p className="text-sm text-gray-500 mt-1">Pokud narazíš na podezřelou aukci, použij tlačítko &quot;Nahlásit aukci&quot; na detailu aukce.</p>
        </div>
      </section>
    </LegalLayout>
  );
}
