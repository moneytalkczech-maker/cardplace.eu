import LegalLayout from "../components/LegalLayout";

export default function LegalPrivacyPage() {
  return (
    <LegalLayout title="Ochrana osobních údajů (GDPR)" lastUpdated="14. 5. 2026">
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">1. Správce osobních údajů</h2>
        <div className="bg-[rgba(0,200,255,0.04)] rounded-lg p-4 text-sm">
          <p><strong>CardPlace s.r.o.</strong></p>
          <p>Jizerská 5, 463 62 Hejnice</p>
          <p>IČO: 12345678</p>
          <p>DIČ: CZ12345678</p>
          <p className="text-gray-500 text-xs mt-1">Zapsáno v obchodním rejstříku u Městského soudu v Praze, oddíl C, vložka 123456</p>
          <p className="mt-2">Email: info@cardplace.eu</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">2. Jaká data sbíráme</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Emailová adresa</li>
          <li>Uživatelské jméno</li>
          <li>IP adresa</li>
          <li>User-Agent</li>
          <li>Informace o aukcích a příhozech</li>
          <li>Cookies a údaje o návštěvnosti</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">3. Účel zpracování</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provoz platformy a zprostředkování aukcí</li>
          <li>Komunikace s uživateli</li>
          <li>Bezpečnost a prevence podvodů</li>
          <li>Analytika a zlepšování služeb</li>
          <li>Plnění zákonných povinností</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">4. Doba uchovávání</h2>
        <p>Osobní údaje uchováváme po dobu trvání uživatelského účtu a maximálně 3 roky po jeho deaktivaci, pokud zákon nestanoví jinak.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">5. Práva uživatelů</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Právo na přístup k osobním údajům</li>
          <li>Právo na opravu nepřesných údajů</li>
          <li>Právo na výmaz („právo být zapomenut")</li>
          <li>Právo na omezení zpracování</li>
          <li>Právo na přenositelnost údajů</li>
          <li>Právo vznést námitku proti zpracování</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">6. Cookies</h2>
        <p>Používáme nezbytné, analytické a marketingové cookies. Podrobnosti viz <a href="/legal/cookies" className="text-[#00C8FF]">Cookies policy</a>.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">7. Třetí strany</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Stripe — zpracování plateb</li>
          <li>Resend — odesílání emailů</li>
          <li>Sentry — monitoring chyb</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">8. Kontakt</h2>
        <p>Veškeré dotazy ohledně zpracování osobních údajů: <a href="mailto:info@cardplace.eu" className="text-[#00C8FF]">info@cardplace.eu</a></p>
      </section>
    </LegalLayout>
  );
}
