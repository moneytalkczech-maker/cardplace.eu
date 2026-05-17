import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../services/api";
import { useTranslation } from "../hooks/useTranslation";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || t("forgot.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-[#A7FF00] mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-2">{t("forgot.emailSent")}</h1>
          <p className="text-gray-400 mb-6">{t("forgot.emailSentDesc")}</p>
          <Link to="/login" className="text-[#00C8FF] hover:underline text-sm">{t("forgot.backToLogin")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
      <div className="w-full max-w-md">
        <Link to="/login" className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" /> {t("forgot.backToLogin")}
        </Link>

        <h1 className="text-3xl font-bold font-heading mb-2">{t("forgot.title")}</h1>
        <p className="text-gray-400 mb-8">{t("forgot.subtitle")}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t("forgot.emailLabel")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10 w-full" placeholder={t("forgot.emailPlaceholder")} required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t("forgot.sending") : t("forgot.sendLink")}
          </button>
        </form>
      </div>
    </div>
  );
}
