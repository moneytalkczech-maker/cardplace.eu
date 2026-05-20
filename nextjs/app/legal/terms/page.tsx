import LegalLayout from "@/components/layout/LegalLayout";

export default function LegalTermsPage() {
  return (
    <LegalLayout title="Obchodní podmínky" lastUpdated="14. 5. 2026">
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">1. Úvodní ustanovení</h2>
        <p>Tyto obchodní podmínky upravují vztahy mezi provozovatelem platformy CardPlace.eu a uživateli služby.</p>
        <p className="mt-2">Provozovatelem je:</p>
        <div className="bg-[rgba(0,200,255,0.04)] rounded-lg p-4 mt-2 text-sm">
          <p><strong>CardPlace s.r.o.</strong></p>
          <p>Jizerská 5</p>
          <p>463 62 Hejnice</p>
          <p>Česká republika</p>
          <p>IČO: 12345678</p>
          <p>DIČ: CZ12345678</p>
          <p className="text-gray-500 text-xs mt-1">Zapsáno v obchodním rejstříku u Městského soudu v Praze, oddíl C, vložka 123456</p>
          <p className="mt-2">Email: info@cardplace.eu</p>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">2. Registrace a uživatelský účet</h2>
        <p>Registrací uživatel potvrzuje, že se seznámil s obchodními podmínkami a souhlasí s nimi. Uživatel je povinen poskytnout pravdivé údaje a chránit své přihlašovací údaje.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">3. Pravidla aukcí</h2>
        <p>Vytvořením aukce se prodávající zavazuje k prodeji položky. Příhoz je závazný. V případě neplnění povinností může být uživatel zablokován.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">4. Závaznost příhozů</h2>
        <p>Každý příhoz je finančně závazný. V případě výher aukce je kupující povinen zaplatit konečnou cenu včetně případných poplatků.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">5. Odpovědnost uživatelů</h2>
        <p>Uživatelé odpovídají za pravdivost údajů o prodávaných položkách. Prodávající odpovídá za to, že položka odpovídá popisu a fotografiím.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">6. Zákaz fake karet</h2>
        <p className="text-red-400 font-semibold">Je přísně zakázáno prodávat padělky, repliky, proxy karty, neoriginální výtisky či jakékoliv kopie sběratelských karet vydávané za originální.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">7. Scam policy</h2>
        <p>Jakékoliv podvodné jednání, včetně neodeslání zboží, klamavého popisu nebo zneužití důvěry, je důvodem k okamžitému zablokování účtu a může být nahlášeno Policii ČR.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">8. VIP účty</h2>
        <p>VIP účty poskytují dodatečné funkce za měsíční nebo roční poplatek. Předplatné se automaticky obnovuje, pokud není zrušeno.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">9. Moderace a sankce</h2>
        <p>CardPlace.eu si vyhrazuje právo moderovat obsah, mazat aukce a blokovat uživatele v případě porušení pravidel.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">10. Omezení odpovědnosti</h2>
        <p>CardPlace s.r.o. nenese odpovědnost za obsah aukcí vytvořených uživateli, kvalitu prodávaných položek ani za jednání mezi kupujícími a prodávajícími. Platforma slouží pouze jako zprostředkovatel.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">11. Řešení sporů</h2>
        <p>Spory mezi uživateli se řeší primárně smírně. Spory s provozovatelem řeší příslušný soud České republiky.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">12. Odstoupení od smlouvy</h2>
        <p>Spotřebitel má právo odstoupit od smlouvy do 14 dnů od převzetí zboží bez uvedení důvodu (§ 1829 NOZ). Pro uplatnění práva zašli email na <a href="mailto:info@cardplace.eu" className="text-[#00C8FF]">info@cardplace.eu</a>.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">13. Reklamace</h2>
        <p>V případě, že zboží neodpovídá popisu, kontaktuj prodávajícího do 14 dnů od doručení přes platformu.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">14. Mimosoudní řešení sporů</h2>
        <p>Subjektem mimosoudního řešení je Česká obchodní inspekce (<a href="https://www.coi.cz" target="_blank" rel="noopener" className="text-[#00C8FF]">www.coi.cz</a>).</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">15. Kontakt</h2>
        <p>Veškeré dotazy: <a href="mailto:info@cardplace.eu" className="text-[#00C8FF]">info@cardplace.eu</a></p>
      </section>
    </LegalLayout>
  );
}
