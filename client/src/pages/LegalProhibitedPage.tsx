import LegalLayout from "../components/LegalLayout";

export default function LegalProhibitedPage() {
  return (
    <LegalLayout title="Zakázané položky" lastUpdated="14. 5. 2026">
      <section>
        <p className="mb-4">Na platformě CardPlace.eu je přísně zakázáno prodávat následující položky:</p>

        <div className="space-y-4">
          <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] p-4">
            <h3 className="font-bold text-red-400 mb-1">❌ Fake / Padělky</h3>
            <p className="text-sm">Jakékoliv neoriginální karty vydávané za pravé. Včetně napodobenin slabikářů, textur a log.</p>
          </div>

          <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] p-4">
            <h3 className="font-bold text-red-400 mb-1">❌ Proxy karty</h3>
            <p className="text-sm">Vlastní tisky karet, které nejsou originálními produkty vydavatelů. Proxy nejsou povoleny ani s označením "proxy".</p>
          </div>

          <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] p-4">
            <h3 className="font-bold text-red-400 mb-1">❌ Replika / Counterfeit</h3>
            <p className="text-sm">Kopie originálních karet bez ohledu na kvalitu zpracování.</p>
          </div>

          <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] p-4">
            <h3 className="font-bold text-red-400 mb-1">❌ Kradené zboží</h3>
            <p className="text-sm">Jakékoliv položky, k jejichž prodeji nemá prodávající oprávnění.</p>
          </div>

          <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] p-4">
            <h3 className="font-bold text-red-400 mb-1">❌ Nelegální obsah</h3>
            <p className="text-sm">Pornografie, násilí, extremistický obsah a jiné nelegální materiály.</p>
          </div>

          <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] p-4">
            <h3 className="font-bold text-red-400 mb-1">❌ Zavádějící aukce</h3>
            <p className="text-sm">Aukce, které klamavě popisují položku, používají kradené fotografie nebo uvádějí kupujícího v omyl.</p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-[rgba(0,200,255,0.04)] border border-[rgba(0,200,255,0.1)]">
          <p className="text-sm font-semibold">Nahlášení podezřelé aukce</p>
          <p className="text-sm text-gray-500 mt-1">Pokud narazíš na podezřelou aukci, použij tlačítko "Nahlásit aukci" na detailu aukce.</p>
        </div>
      </section>
    </LegalLayout>
  );
}
