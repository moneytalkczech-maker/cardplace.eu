import { useState, useRef, useEffect } from "react";
import { Save, Camera, Lock, User, Mail, Loader2 } from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "../components/Toast";

export default function Settings() {
  const { t } = useTranslation();
  const { user, loadUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarMsg, setAvatarMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
      setProfileMsg({ type: "success", text: t("settings.profileUpdated") });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.response?.data?.error || t("settings.profileSaveError") });
    }
    setSavingProfile(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: t("settings.passwordsDontMatch") });
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch("/profile/password", { currentPassword: password, newPassword });
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "success", text: t("settings.passwordChanged") });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.response?.data?.error || t("settings.passwordChangeError") });
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
      await api.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadUser();
      setAvatarMsg({ type: "success", text: t("settings.avatarUploaded") });
    } catch (err: any) {
      setAvatarMsg({ type: "error", text: err.response?.data?.error || t("settings.avatarUploadError") });
    }
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-white space-y-8">
      <h1 className="text-3xl font-bold font-heading">{t("settings.title")}</h1>

      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-6 w-6 text-[#00C8FF]" />
          <h2 className="text-xl font-bold font-heading">{t("settings.basicInfo")}</h2>
        </div>

        {profileMsg && (
          <div className={`rounded-xl border p-3 text-sm mb-4 ${profileMsg.type === "success" ? "bg-[rgba(0,200,255,0.08)] border-[rgba(0,200,255,0.2)] text-[#00C8FF]" : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#F87171]"}`}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">
              <Mail className="h-4 w-4 inline mr-1.5 text-gray-500" />
              {t("settings.email")}
            </label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">
              <User className="h-4 w-4 inline mr-1.5 text-gray-500" />
              {t("settings.username")}
            </label>
            <input type="text" className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary font-heading">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("settings.saveChanges")}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-6 w-6 text-[#00C8FF]" />
          <h2 className="text-xl font-bold font-heading">{t("settings.security")}</h2>
        </div>

        {passwordMsg && (
          <div className={`rounded-xl border p-3 text-sm mb-4 ${passwordMsg.type === "success" ? "bg-[rgba(0,200,255,0.08)] border-[rgba(0,200,255,0.2)] text-[#00C8FF]" : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#F87171]"}`}>
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">{t("settings.currentPassword")}</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">{t("settings.newPassword")}</label>
            <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold mb-1.5">{t("settings.confirmNewPassword")}</label>
            <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary font-heading">
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {t("settings.changePassword")}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-[rgba(0,200,255,0.1)] bg-[#0B1220] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Camera className="h-6 w-6 text-[#00C8FF]" />
          <h2 className="text-xl font-bold font-heading">{t("settings.avatar")}</h2>
        </div>

        {avatarMsg && (
          <div className={`rounded-xl border p-3 text-sm mb-4 ${avatarMsg.type === "success" ? "bg-[rgba(0,200,255,0.08)] border-[rgba(0,200,255,0.2)] text-[#00C8FF]" : "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)] text-[#F87171]"}`}>
            {avatarMsg.text}
          </div>
        )}

        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#009DFF] to-[#00C8FF] text-3xl font-bold font-heading shadow-[0_0_30px_rgba(0,200,255,0.2)] overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={t("settings.avatar")} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              user?.username?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-3">{t("settings.avatarHint")}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="btn-secondary font-heading"
            >
              {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploadingAvatar ? t("settings.uploading") : t("settings.selectImage")}
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleAvatarUpload} />
      </div>
    </div>
  );
}
