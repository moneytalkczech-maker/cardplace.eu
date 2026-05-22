"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Bolt, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !acceptedPrivacy) {
      setError(t("auth.acceptTermsError"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await register(email, username, password, referralCode || undefined, acceptedTerms, acceptedPrivacy);
      router.push("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t("auth.registerError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050A12]">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#A7FF00] rounded-full opacity-[0.02] blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-[#00C8FF] rounded-full opacity-[0.02] blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-sm px-4 py-16 w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#050A12] border border-[rgba(124,255,0,0.3)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[rgba(124,255,0,0.1)]">
            <div className="relative">
              <span className="text-[#00C8FF] font-bold text-2xl font-heading absolute -left-4" style={{ textShadow: "0 0 8px rgba(0,200,255,0.5)" }}>C</span>
              <Bolt className="h-6 w-6 text-[#FF3366]" style={{ filter: "drop-shadow(0 0 4px rgba(255,0,68,0.5))" }} />
              <span className="text-[#A7FF00] font-bold text-2xl font-heading absolute -right-4" style={{ textShadow: "0 0 8px rgba(124,255,0,0.5)" }}>P</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold font-heading">
            <span className="text-gradient-green">Vytvořit</span>
            <span className="text-white"> účet</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t("auth.registerDesc")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-[rgba(255,0,68,0.1)] border border-[rgba(255,0,68,0.2)] p-3 text-sm text-[#FF3366]">{error}</div>
          )}
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5 text-gray-300">{t("auth.email")}</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5 text-gray-300">{t("auth.username")}</label>
            <input type="text" className="input" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5 text-gray-300">{t("auth.password")}</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5 text-gray-300 flex justify-between">
              <span>{t("auth.referralCode")}</span>
              <span className="text-gray-600 font-normal text-xs">{t("auth.optional")}</span>
            </label>
            <input type="text" className="input" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
          </div>

          <div className="space-y-2 pt-1">
            {[
              { val: acceptedTerms, set: setAcceptedTerms, label: <>Souhlasím s <Link href="/legal/terms" target="_blank" className="text-[#00C8FF] hover:underline">obchodními podmínkami</Link></> },
              { val: acceptedPrivacy, set: setAcceptedPrivacy, label: <>Souhlasím se <Link href="/legal/privacy" target="_blank" className="text-[#00C8FF] hover:underline">zpracováním osobních údajů</Link></> },
            ].map(({ val, set, label }, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded border transition-all mt-0.5 flex items-center justify-center ${val ? "bg-[#A7FF00] border-[#A7FF00]" : "border-[rgba(0,200,255,0.3)] bg-transparent"}`}
                  onClick={() => set(!val)}
                >
                  {val && <Check className="h-3 w-3 text-[#050A12]" />}
                </div>
                <span className="text-sm text-gray-400">{label}</span>
              </label>
            ))}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full text-base py-3">
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting ? t("auth.registering") : t("auth.register")}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="text-[#00C8FF] hover:text-[#00C8FF]/80 font-heading font-semibold">{t("auth.signIn")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
