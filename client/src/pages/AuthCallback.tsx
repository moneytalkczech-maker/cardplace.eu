import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

export default function AuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tryRefreshToken } = useAuthStore();

  useEffect(() => {
    // Server už nastavil refreshToken httpOnly cookie.
    // Stačí zavolat refresh endpoint, který cookie použije.
    tryRefreshToken().then((ok) => {
      if (ok) {
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050A12]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00C8FF] mx-auto" />
        <p className="text-gray-500 mt-4 text-sm">{t("auth.googleLoading")}</p>
      </div>
    </div>
  );
}
