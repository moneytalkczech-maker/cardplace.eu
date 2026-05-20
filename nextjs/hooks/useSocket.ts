"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { connectSocket, disconnectSocket, joinUser } from "@/lib/socket";

export function useSocket() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    connectSocket(token);
    joinUser();
    return () => { disconnectSocket(); };
  }, [token]);
}
