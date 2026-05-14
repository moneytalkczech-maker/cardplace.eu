import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { loadUser } = useAuthStore();

  useEffect(() => {
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    if (token && refreshToken) {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      // Načte uživatele z API
      loadUser().then(() => {
        navigate("/", { replace: true });
      });
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050A12]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00C8FF] mx-auto" />
        <p className="text-gray-500 mt-4 text-sm">Přihlašování přes Google...</p>
      </div>
    </div>
  );
}
