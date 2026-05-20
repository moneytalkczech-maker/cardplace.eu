"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
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
      setError(err.response?.data?.error || "Nepodařilo se odeslat email. Zkuste to znovu.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-[#A7FF00] mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-heading mb-2">Email odeslán</h1>
          <p className="text-gray-400 mb-6">Zkontroluj svou emailovou schránku a klikni na odkaz pro obnovu hesla.</p>
          <Link href="/login" className="text-[#00C8FF] hover:underline text-sm">Zpět na přihlášení</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#050A12]">
      <div className="w-full max-w-md">
        <Link href="/login" className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" /> Zpět na přihlášení
        </Link>
        <h1 className="text-3xl font-bold font-heading mb-2">Zapomenuté heslo</h1>
        <p className="text-gray-400 mb-8">Zadej svůj email a pošleme ti odkaz pro obnovu hesla.</p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Emailová adresa</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10 w-full" placeholder="tvuj@email.cz" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Odesílám…</> : "Odeslat odkaz"}
          </button>
        </form>
      </div>
    </div>
  );
}
