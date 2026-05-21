"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, CheckCircle, XCircle, ChevronDown, ChevronLeft, ChevronRight, Ban } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { useTranslation } from "@/hooks/useTranslation";
import AdminLayout from "@/components/layout/AdminLayout";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  trustScore: number;
  verified: boolean;
  totalSales: number;
  createdAt: string;
}

const ROLES = ["user", "seller", "admin"];

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = (p: number = page) => {
    setLoading(true);
    setError(null);
    adminApi.listUsers(p, 50).then((response: any) => {
      const result = response.data ? response.data : response;
      setUsers(Array.isArray(result) ? result : result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    }).catch((err: any) => {
      setError(err.response?.data?.error || "Chyba při načítání uživatelů");
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(page); }, [page]);

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await adminApi.updateUserRole(id, role);
      fetchUsers();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při změně role");
    }
  };

  const handleVerifyToggle = async (id: string) => {
    try {
      await adminApi.toggleUserVerification(id);
      fetchUsers();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při změně ověření");
    }
  };

  const handleBanToggle = async (id: string, username: string) => {
    try {
      const result = await adminApi.toggleUserBan(id);
      const action = result.banned !== undefined ? (result.banned ? "banned" : "unbanned") : (result.status === "banned" ? "banned" : "unbanned");
      toast("success", action === "banned" ? `Uživatel "${username}" zabanován` : `Uživatel "${username}" odbanován`);
      fetchUsers();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při banování");
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Opravdu chceš smazat uživatele "${username}"? Tato akce je nevratná.`)) return;
    try {
      await adminApi.deleteUser(id);
      toast("success", `Uživatel "${username}" smazán`);
      fetchUsers();
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Chyba při mazání");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title={t("admin.users")}>
      {error && <div className="text-red-400 text-sm py-4 text-center">{error}</div>}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
            placeholder={t("admin.searchUsers")}
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[#0B1220]" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="pb-3 pr-4 font-heading font-semibold">{t("admin.user")}</th>
                <th className="pb-3 pr-4 font-heading font-semibold">{t("admin.email")}</th>
                <th className="pb-3 pr-4 font-heading font-semibold">{t("admin.role")}</th>
                <th className="pb-3 pr-4 font-heading font-semibold">{t("admin.status")}</th>
                <th className="pb-3 pr-4 font-heading font-semibold">{t("admin.trust")}</th>
                <th className="pb-3 pr-4 font-heading font-semibold">{t("admin.verified")}</th>
                <th className="pb-3 pr-4 font-heading font-semibold">{t("admin.sales")}</th>
                <th className="pb-3 font-heading font-semibold">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-[rgba(0,200,255,0.06)]">
                  <td className="py-3 pr-4">
                    <span className="font-heading font-semibold">{u.username}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{u.email}</td>
                  <td className="py-3 pr-4">
                    <div className="relative inline-block">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="appearance-none bg-[#0B1220] border border-[rgba(0,200,255,0.15)] rounded-lg px-3 py-1 pr-8 text-xs font-heading font-semibold cursor-pointer hover:border-[#00C8FF]/30 transition-colors"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r === "admin" ? t("admin.roleAdmin") : r === "seller" ? t("admin.roleSeller") : t("admin.roleUser")}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => handleBanToggle(u.id, u.username)}
                      className={`flex items-center gap-1 text-xs font-heading font-semibold ${
                        u.status === "banned" ? "text-red-400" : "text-[#A7FF00]"
                      } hover:opacity-80 transition-opacity`}
                      title={u.status === "banned" ? t("admin.unbanUser") : t("admin.banUser")}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      {u.status === "banned" ? t("admin.banned") : t("admin.active")}
                    </button>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-12 rounded-full bg-[#0B1220] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#00C8FF] transition-all"
                          style={{ width: `${Math.min(u.trustScore, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{u.trustScore}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => handleVerifyToggle(u.id)}
                      className={`flex items-center gap-1 text-xs font-heading font-semibold ${
                        u.verified ? "text-[#A7FF00]" : "text-gray-600"
                      } hover:opacity-80 transition-opacity`}
                    >
                      {u.verified ? (
                        <><CheckCircle className="h-3.5 w-3.5" /> {t("admin.yes")}</>
                      ) : (
                        <><XCircle className="h-3.5 w-3.5" /> {t("admin.no")}</>
                      )}
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{u.totalSales}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(u.id, u.username)}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      title={t("admin.deleteUser")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    {t("admin.noUsersFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-[rgba(0,200,255,0.08)] mt-6">
          <p className="text-xs text-gray-500">
            {t("admin.totalUsers")}: {total} • {t("admin.page")}: {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500 font-heading font-semibold">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
