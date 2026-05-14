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
        <p className="text-center text-sm text-gray-500">
          {t("auth.hasAccount")}<Link to="/login" className="text-[#00C8FF] hover:text-[#00C8FF]/80 font-heading font-semibold">{t("auth.signIn")}</Link>
        </p>
      </form>
    </div>
  );
}
