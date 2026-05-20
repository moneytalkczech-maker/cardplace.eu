"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setMessage("Chybí ověřovací token."); return; }
    api.post("/auth/verify-email", { token })
      .then(() => { setStatus("success"); setMessage("Email byl úspěšně ověřen!"); })
      .catch((err: any) => { setStatus("error"); setMessage(err.response?.data?.error || "Ověření se nezdařilo."); });
  }, []);

  return (
    <div className="mx-auto max-w-sm px-4 py-20 text-center">
      {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-[#00C8FF] mx-auto mb-4" />}
      {status === "success" && <CheckCircle className="h-12 w-12 text-[#A7FF00] mx-auto mb-4" />}
      {status === "error" && <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />}
      <h1 className="text-2xl font-bold font-heading mb-2">
        {status === "loading" ? "Ověřuji email…" : message}
      </h1>
      {status === "success" && (
        <Link href="/" className="btn-primary mt-6 inline-flex font-heading">Pokračovat</Link>
      )}
      {status === "error" && (
        <Link href="/profile" className="btn-ghost mt-6 inline-flex font-heading">Zkusit znovu</Link>
      )}
    </div>
  );
}
