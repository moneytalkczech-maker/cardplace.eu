import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Gavel } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "../hooks/useTranslation";

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(email, username, password, referralCode);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || t("auth.registerError"));
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <div className="text-center mb-8">
        <Gavel className="h-12 w-12 mx-auto mb-4 text-[#00C8FF]" />
        <h1 className="text-3xl font-bold font-heading">{t("auth.createAccount")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("auth.joinDesc")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] p-3 text-sm text-[#F87171]">{error}</div>
        )}
        {referralCode && (
          <div className="rounded-xl bg-[rgba(167,255,0,0.1)] border border-[rgba(167,255,0,0.2)] p-3 text-sm text-[#A7FF00]">
            {t("auth.referralApplied")}: {referralCode}
          </div>
        )}
        <div>
          <label className="block text-sm font-heading font-semibold mb-1.5">{t("auth.email")}</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-heading font-semibold mb-1.5">{t("auth.username")}</label>
          <input type="text" className="input" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
        </div>
        <div>
          <label className="block text-sm font-heading font-semibold mb-1.5">{t("auth.password")}</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <button type="submit" className="btn-primary w-full text-base py-3 font-heading">{t("auth.createAccount")}</button>

        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-[rgba(0,200,255,0.1)]" />
          <span className="text-xs text-gray-600 font-heading font-semibold">{t("common.or")}</span>
          <div className="flex-1 h-px bg-[rgba(0,200,255,0.1)]" />
        </div>

        <a href="/api/auth/google"
          className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl border border-[rgba(0,200,255,0.15)] bg-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,200,255,0.06)] transition-colors font-heading font-semibold text-sm">
          <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Registrovat se přes Google
        </a>

        <p className="text-center text-sm text-gray-500">
          {t("auth.hasAccount")}<Link to="/login" className="text-[#00C8FF] hover:text-[#00C8FF]/80 font-heading font-semibold">{t("auth.signIn")}</Link>
        </p>
      </form>
    </div>
  );
}
