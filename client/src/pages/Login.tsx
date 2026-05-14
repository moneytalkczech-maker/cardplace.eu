import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Gavel } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "../hooks/useTranslation";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || t("auth.loginError"));
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <div className="text-center mb-8">
        <Gavel className="h-12 w-12 mx-auto mb-4 text-[#00C8FF]" />
        <h1 className="text-3xl font-bold font-heading">{t("auth.welcomeBack")}</h1>
        <p className="text-gray-500 text-sm mt-1">{t("auth.signInDesc")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] p-3 text-sm text-[#F87171]">{error}</div>
        )}
        <div>
          <label className="block text-sm font-heading font-semibold mb-1.5">{t("auth.email")}</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-heading font-semibold mb-1.5">{t("auth.password")}</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary w-full text-base py-3 font-heading">{t("auth.signIn")}</button>
        <p className="text-center text-sm text-gray-500">
          {t("auth.noAccount")}<Link to="/register" className="text-[#00C8FF] hover:text-[#00C8FF]/80 font-heading font-semibold">{t("auth.signUp")}</Link>
        </p>
      </form>
    </div>
  );
}
