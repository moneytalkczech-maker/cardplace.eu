import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import api from "../services/api";
import { useTranslation } from "../hooks/useTranslation";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setStatus("error"); setMessage(t("verify.missingToken")); return; }

    api.post("/auth/verify-email", { token })
      .then(() => { setStatus("success"); setMessage(t("verify.success")); })
      .catch((err) => { setStatus("error"); setMessage(err.response?.data?.error || t("verify.failed")); });
  }, []);

  return (
    <div className="mx-auto max-w-sm px-4 py-20 text-center">
      {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-[#00C8FF] mx-auto mb-4" />}
      {status === "success" && <CheckCircle className="h-12 w-12 text-[#A7FF00] mx-auto mb-4" />}
      {status === "error" && <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />}

      <h1 className="text-2xl font-bold font-heading mb-2">
        {status === "loading" ? t("verify.loading") : message}
      </h1>

      {status === "success" && (
        <Link to="/" className="btn-primary mt-6 inline-flex font-heading">{t("verify.continue")}</Link>
      )}
      {status === "error" && (
        <Link to="/profile" className="btn-ghost mt-6 inline-flex font-heading">{t("verify.tryAgain")}</Link>
      )}
    </div>
  );
}
