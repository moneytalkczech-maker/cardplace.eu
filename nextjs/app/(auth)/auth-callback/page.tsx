"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/hooks/useTranslation";

export default function AuthCallback() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tryRefreshToken } = useAuthStore();

  useEffect(() => {
    tryRefreshToken().then((ok) => {
      router.replace(ok ? "/" : "/login");
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
