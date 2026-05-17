import LegalLayout from "../components/LegalLayout";

export default function LegalAuctionRulesPage() {
  return (
    <LegalLayout title="Pravidla aukcí" lastUpdated="14. 5. 2026">
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">1. Závaznost příhozu</h2>
        <p>Každý příhoz je finančně závazný. Přihazováním uživatel souhlasí s koupí karty za danou cenu v případě výhry.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">2. Anti-sniping</h2>
        <p>Pokud je příhoz podán v posledních 2 minutách aukce, čas se automaticky prodlužuje o 2 minuty. To zajišťuje spravedlivou šanci všem zájemcům.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">3. Fake policy</h2>
        <p className="text-red-400 font-semibold">Prodej padělků, replik, proxy karet nebo jakýchkoliv neoriginálních položek je přísně zakázán. Porušení vede k okamžitému zablokování účtu.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">4. Neodeslané zboží</h2>
        <p>Pokud prodávající neodešle zboží do 14 dnů od dokončení platby, kupující má právo na plný refund. Opakované porušení vede k banu.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">5. Scam a chargebacky</h2>
        <p>Podvodné jednání je trestné a bude hlášeno Policii ČR. CardPlace.eu spolupracuje s orgány činnými v trestním řízení.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">6. Refundy</h2>
        <p>Refund je možný v případě, že zboží neodpovídá popisu nebo nebylo doručeno. Nárok je třeba uplatnit do 14 dnů.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">7. Moderace</h2>
        <p>CardPlace.eu si vyhrazuje právo zrušit aukci, blokovat uživatele nebo omezit funkce v případě porušení pravidel.</p>
      </section>
    </LegalLayout>
  );
}
