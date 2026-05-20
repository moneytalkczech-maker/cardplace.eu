import LegalLayout from "@/components/layout/LegalLayout";

export default function LegalFeesPage() {
  return (
    <LegalLayout title="Ceník a poplatky" lastUpdated="14. 5. 2026">
      <section>
        <p className="mb-4">CardPlace.eu si účtuje poplatky za využívání platformy. Všechny ceny jsou uvedeny včetně DPH.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Prodejní poplatek</h2>
        <div className="rounded-xl bg-[#050A12] border border-[rgba(0,200,255,0.1)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,200,255,0.1)]">
                <th className="text-left p-3 font-heading font-semibold text-gray-400">Výše prodeje</th>
                <th className="text-right p-3 font-heading font-semibold text-gray-400">Provize</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[rgba(0,200,255,0.06)]">
                <td className="p-3">Do 500 Kč</td>
                <td className="p-3 text-right text-[#A7FF00] font-heading font-bold">0 %</td>
              </tr>
              <tr className="border-b border-[rgba(0,200,255,0.06)]">
                <td className="p-3">500 – 5 000 Kč</td>
                <td className="p-3 text-right text-[#A7FF00] font-heading font-bold">5 %</td>
              </tr>
              <tr>
                <td className="p-3">Nad 5 000 Kč</td>
                <td className="p-3 text-right text-[#A7FF00] font-heading font-bold">6 %</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">Provize se počítá z konečné prodejní ceny. Founder a VIP účty: 3 %.</p>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">VIP předplatné</h2>
        <div className="rounded-xl bg-[#050A12] border border-[rgba(0,200,255,0.1)] p-4">
          <div className="flex justify-between items-center py-2 border-b border-[rgba(0,200,255,0.06)]">
            <span>VIP Měsíční</span>
            <span className="text-[#A7FF00] font-heading font-bold">199 Kč / měsíc</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>VIP Roční</span>
            <span className="text-[#A7FF00] font-heading font-bold">1 990 Kč / rok</span>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Boost aukcí</h2>
        <div className="rounded-xl bg-[#050A12] border border-[rgba(0,200,255,0.1)] p-4">
          <div className="flex justify-between items-center py-2 border-b border-[rgba(0,200,255,0.06)]">
            <span>TOP pozice</span>
            <span className="text-[#A7FF00] font-heading font-bold">19 Kč</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[rgba(0,200,255,0.06)]">
            <span>Homepage</span>
            <span className="text-[#A7FF00] font-heading font-bold">49 Kč</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Ověření prodejce</span>
            <span className="text-[#A7FF00] font-heading font-bold">199 Kč</span>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Platební poplatky</h2>
        <p>Zpracování plateb zajišťuje Stripe. Neúčtujeme žádné dodatečné poplatky za platbu kartou nebo Google Pay.</p>
      </section>
    </LegalLayout>
  );
}
