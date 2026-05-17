import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/**
 * AdminRoute — chrání admin stránky.
 * Kontroluje nejen existenci tokenu, ale i roli uživatele.
 * Pokud uživatel není admin, přesměruje na homepage.
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role?.toLowerCase() !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
