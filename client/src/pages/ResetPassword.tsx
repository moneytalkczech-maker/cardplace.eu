import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import api from "../services/api";
import { useTranslation } from "../hooks/useTranslation";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("reset.passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("reset.passwordsDontMatch"));
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || t("forgot.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-2">{t("reset.invalidLink")}</h1>
          <p className="text-gray-400 mb-6">{t("reset.invalidLinkDesc")}</p>
          <Link to="/forgot-password" className="text-[#00C8FF] hover:underline text-sm">{t("reset.requestNew")}</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-[#A7FF00] mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-2">{t("reset.passwordChanged")}</h1>
          <p className="text-gray-400 mb-6">{t("reset.passwordChangedDesc")}</p>
          <Link to="/login" className="btn-primary inline-block">{t("reset.login")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold font-heading mb-2">{t("reset.title")}</h1>
        <p className="text-gray-400 mb-8">{t("reset.subtitle")}</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t("reset.newPassword")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 w-full" placeholder={t("reset.newPasswordPlaceholder")} required minLength={8} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">{t("reset.confirmPassword")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10 w-full" placeholder={t("reset.confirmPasswordPlaceholder")} required minLength={8} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t("reset.saving") : t("reset.changePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
