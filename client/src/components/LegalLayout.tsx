import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function LegalLayout({ children, title, lastUpdated }: { children: React.ReactNode; title: string; lastUpdated: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-6 w-6 text-[#00C8FF]" />
        <div>
          <h1 className="text-2xl font-bold font-heading">{title}</h1>
          <p className="text-xs text-gray-600">Poslední aktualizace: {lastUpdated}</p>
        </div>
      </div>
      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6 md:p-8 space-y-6 text-sm text-gray-300 leading-relaxed">
        {children}
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link to="/legal/terms" className="text-[#00C8FF] hover:underline">Obchodní podmínky</Link>
        <Link to="/legal/privacy" className="text-[#00C8FF] hover:underline">Ochrana osobních údajů</Link>
        <Link to="/legal/cookies" className="text-[#00C8FF] hover:underline">Cookies</Link>
        <Link to="/legal/auction-rules" className="text-[#00C8FF] hover:underline">Pravidla aukcí</Link>
        <Link to="/legal/prohibited-items" className="text-[#00C8FF] hover:underline">Zakázané položky</Link>
        <Link to="/contact" className="text-[#00C8FF] hover:underline">Kontakt</Link>
      </div>
    </div>
  );
}
