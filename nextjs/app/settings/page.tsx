"use client";
import { useState, useRef, useEffect } from "react";
import { Save, Camera, Lock, User, Mail, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/components/ui/Toast";

type Msg = { type: "success" | "error"; text: string } | null;

export default function SettingsPage() {
  const { user, loadUser, logout } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState<Msg>(null);
  const [passwordMsg, setPasswordMsg] = useState<Msg>(null);
  const [avatarMsg, setAvatarMsg] = useState<Msg>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await api.patch("/profile", { username, email });
      await loadUser();
      setProfileMsg({ type: "success", text: "Profil byl uložen." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.response?.data?.error || "Nepodařilo se uložit profil." });
    }
    setSavingProfile(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Hesla se neshodují." });
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch("/profile/password", { currentPassword: password, newPassword });
      setPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordMsg({ type: "success", text: "Heslo bylo změněno." });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.response?.data?.error || "Nepodařilo se změnit heslo." });
    }
    setSavingPassword(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarMsg(null);
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await api.post("/profile/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await loadUser();
      setAvatarMsg({ type: "success", text: "Avatar byl nahrán." });
    } catch (err: any) {
      setAvatarMsg({ type: "error", text: err.response?.data?.error || "Nepodařilo se nahrát avatar." });
    }
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== user?.username) return;
    setDeletingAccount(true);
    try {
      await api.post("/profile/delete-account", { confirmDelete: "DELETE_MY_ACCOUNT" });
      logout();
      router.push("/");
    } catch (err: any) {
      toast("error", err.response?.data?.error || "Nepodařilo se smazat účet.");
      setDeletingAccount(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold font-heading">Nastavení účtu</h1>

      {/* Profile */}
      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-6 w-6 text-[#00C8FF]" />
          <h2 className="text-xl font-bold font-heading">Základní informace</h2>
        </div>
        {profileMsg && <StatusMsg msg={profileMsg} />}
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">
              <Mail className="h-4 w-4 inline mr-1.5 text-gray-500" />Email
            </label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">
              <User className="h-4 w-4 inline mr-1.5 text-gray-500" />Uživatelské jméno
            </label>
            <input type="text" className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary font-heading">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Uložit změny
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-6 w-6 text-[#00C8FF]" />
          <h2 className="text-xl font-bold font-heading">Zabezpečení</h2>
        </div>
        {passwordMsg && <StatusMsg msg={passwordMsg} />}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">Současné heslo</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">Nové heslo</label>
            <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">Potvrdit nové heslo</label>
            <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary font-heading">
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Změnit heslo
          </button>
        </form>
      </div>

      {/* Avatar */}
      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Camera className="h-6 w-6 text-[#00C8FF]" />
          <h2 className="text-xl font-bold font-heading">Profilový obrázek</h2>
        </div>
        {avatarMsg && <StatusMsg msg={avatarMsg} />}
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#009DFF] to-[#00C8FF] text-3xl font-bold font-heading shadow-[0_0_30px_rgba(0,200,255,0.2)] overflow-hidden flex-shrink-0">
            {(user as any)?.avatarUrl ? (
              <img src={(user as any).avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.username?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-3">JPG nebo PNG, max 5 MB. Doporučujeme čtvercový obrázek.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="btn-secondary font-heading"
            >
              {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploadingAvatar ? "Nahrávám…" : "Vybrat obrázek"}
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleAvatarUpload} />
      </div>

      {/* Delete Account */}
      <div className="rounded-xl border border-[rgba(239,68,68,0.2)] bg-[#0B1220] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="h-6 w-6 text-red-400" />
          <h2 className="text-xl font-bold font-heading text-red-400">Smazat účet</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Tato akce je nevratná. Smaže se tvůj účet, všechny aukce a data. Pro potvrzení zadej své uživatelské jméno{" "}
          <span className="font-bold text-white">@{user?.username}</span>.
        </p>
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <input
            type="text"
            className="input border-[rgba(239,68,68,0.3)] focus:border-red-400"
            placeholder={`Zadej "${user?.username}" pro potvrzení`}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <button
            type="submit"
            disabled={deletingAccount || deleteConfirm !== user?.username}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600/20 border border-red-600/40 text-red-400 font-heading font-bold text-sm hover:bg-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Trvale smazat účet
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusMsg({ msg }: { msg: { type: "success" | "error"; text: string } }) {
  return (
    <div className={`rounded-xl border p-3 text-sm mb-4 ${
      msg.type === "success"
        ? "bg-[rgba(0,200,255,0.08)] border-[rgba(0,200,255,0.2)] text-[#00C8FF]"
        : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-red-400"
    }`}>
      {msg.text}
    </div>
  );
}
