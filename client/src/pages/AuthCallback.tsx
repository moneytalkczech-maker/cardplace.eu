import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login: storeLogin } = useAuthStore();

  useEffect(() => {
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    if (token && refreshToken) {
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      storeLogin("", "");
    }
    navigate("/", { replace: true });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050A12]">
      <Loader2 className="h-8 w-8 animate-spin text-[#00C8FF]" />
    </div>
  );
}
