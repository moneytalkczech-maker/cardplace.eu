"use client";
import { useState } from "react";
import { Mail, MessageSquare, Send, Loader2 } from "lucide-react";
import LegalLayout from "@/components/layout/LegalLayout";
import { contact } from "@/lib/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      await contact.submit({ name, email, message });
      setSent(true);
      setName(""); setEmail(""); setMessage("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Zprávu se nepodařilo odeslat. Zkuste to prosím znovu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <LegalLayout title="Kontakt" lastUpdated="14. 5. 2026">
      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Provozovatel</h2>
        <div className="bg-[rgba(0,200,255,0.04)] rounded-lg p-4 text-sm space-y-0.5">
          <p><strong>CardPlace s.r.o.</strong></p>
          <p>Jizerská 5</p>
          <p>463 62 Hejnice</p>
          <p>IČO: 12345678 · DIČ: CZ12345678</p>
          <p className="text-gray-500 text-xs mt-1">Zapsáno v obchodním rejstříku u Městského soudu v Praze, oddíl C, vložka 123456</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Kontaktní informace</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#00C8FF]" />
            <a href="mailto:info@cardplace.eu" className="text-[#00C8FF] hover:underline">info@cardplace.eu</a>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#00C8FF]" />
            <span>Podpora: Po–Pá 9:00–17:00</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">Odpovídáme do 24 hodin v pracovní dny.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Napište nám</h2>
        {sent ? (
          <div className="p-4 rounded-lg bg-[rgba(167,255,0,0.1)] border border-[rgba(167,255,0,0.2)] text-sm text-[#A7FF00]">
            Zpráva byla odeslána. Odpovíme co nejdříve!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}
            <input className="input" placeholder="Vaše jméno" value={name} onChange={(e) => setName(e.target.value)} required disabled={sending} />
            <input type="email" className="input" placeholder="Váš email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={sending} />
            <textarea className="input min-h-[120px]" placeholder="Vaše zpráva…" value={message} onChange={(e) => setMessage(e.target.value)} required disabled={sending} />
            <button type="submit" className="btn-primary font-heading" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Odesílám…" : "Odeslat zprávu"}
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold font-heading text-white mb-3">Technická podpora</h2>
        <p className="text-sm">Pro technické problémy nebo hlášení závad kontaktujte <a href="mailto:info@cardplace.eu" className="text-[#00C8FF]">info@cardplace.eu</a>.</p>
      </section>
    </LegalLayout>
  );
}
