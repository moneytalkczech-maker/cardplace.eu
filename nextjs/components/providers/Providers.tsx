"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { CountdownProvider } from "@/hooks/useCountdown";
import { connectSocket } from "@/lib/socket";

function AuthInit() {
  const { loadUser, token } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (token) connectSocket(token);
  }, [token]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CountdownProvider>
      <AuthInit />
      {children}
    </CountdownProvider>
  );
}
