import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";

type ConsentLevel = "accepted" | "revoked" | null;

const CONSENT_KEY = "cardplace-cookie-consent";

export function getCookieConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === "accepted";
}

export function revokeCookieConsent(): void {
  localStorage.setItem(CONSENT_KEY, "revoked");
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShow(false);
  };

  const dismiss = () => {
    // Implicitní akceptace pouze nezbytných cookies
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[rgba(0,200,255,0.15)] bg-[#0B1220]/95 backdrop-blur-xl p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <Cookie className="h-6 w-6 text-[#00C8FF] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="font-heading font-bold text-sm">🍪 Cookies</p>
              <button onClick={dismiss} className="p-1 rounded-lg hover:bg-[rgba(0,200,255,0.1)] transition-colors text-gray-500 hover:text-gray-300" aria-label="Zavřít cookie banner">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Tento web používá pouze nezbytné cookies pro fungování (přihlášení, bezpečnost).
              Žádné analytické ani marketingové cookies nejsou používány.{' '}
              <Link to="/legal/cookies" className="text-[#00C8FF] hover:underline">Více informací</Link>
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={accept} className="btn-primary text-xs font-heading px-4 py-2">
                Rozumím
              </button>
              <button onClick={dismiss} className="btn-ghost text-xs font-heading px-4 py-2 text-gray-400">
                Pouze nezbytné
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
