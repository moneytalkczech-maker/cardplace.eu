"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Heslo musí mít alespoň 8 znaků."); return; }
    if (password !== confirmPassword) { setError("Hesla se neshodují."); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Platnost odkazu vypršela nebo je odkaz neplatný.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-2">Neplatný odkaz</h1>
          <p className="text-gray-400 mb-6">Tento odkaz pro obnovu hesla je neplatný nebo vypršel.</p>
          <Link href="/forgot-password" className="text-[#00C8FF] hover:underline text-sm">Požádat o nový odkaz</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-[#A7FF00] mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-2">Heslo změněno</h1>
          <p className="text-gray-400 mb-6">Tvoje heslo bylo úspěšně změněno.</p>
          <Link href="/login" className="btn-primary inline-block">Přihlásit se</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold font-heading mb-2">Nastavit nové heslo</h1>
        <p className="text-gray-400 mb-8">Zvol si nové heslo pro svůj účet.</p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nové heslo</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 w-full" placeholder="Alespoň 8 znaků" required minLength={8} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Potvrdit nové heslo</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10 w-full" placeholder="Zopakuj heslo" required minLength={8} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Ukládám…</> : "Změnit heslo"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00C8FF]" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
