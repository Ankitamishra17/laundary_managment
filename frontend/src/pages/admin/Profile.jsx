import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  Loader2,
  Camera,
  CheckCircle2,
  Store,
} from "lucide-react";
import { profileApi } from "../../api/profileapi";
import { useAuth } from "../../context/AuthContext";

const colors = {
  bgDark: "#05282A",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const inputCls =
  "w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    profileApi
      .getMyProfile()
      .then((data) => {
        setProfile(data);
        setForm({ name: data?.name || user?.name || "", phone: data?.phone || "" });
      })
      .catch(() => {
        // Fall back to the cached user from AuthContext
        setProfile(user);
        setForm({ name: user?.name || "", phone: user?.phone || "" });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await profileApi.updateAvatar(file);
      const avatar = data?.avatar;
      if (avatar) {
        setProfile((prev) => ({ ...(prev || {}), avatar }));
        updateUser({ avatar });
        toast.success("Profile photo updated.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await profileApi.updateMyProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
      });
      setProfile(data);
      updateUser({ name: data.name, phone: data.phone });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      const res = await profileApi.changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      if (res?.success) {
        toast.success("Password changed.");
        setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password.");
    } finally {
      setPwSaving(false);
    }
  };

  const displayName = profile?.name || user?.name || "Admin";
  const roleLabel =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "admin"
        ? "Admin"
        : user?.role || "User";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={26} className="animate-spin" style={{ color: colors.primaryTeal }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-2xl sm:text-3xl"
          style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
        >
          My Profile
        </h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          Manage your account details and password.
        </p>
      </div>

      {/* Account card */}
      <div
        className="rounded-2xl border p-6 sm:p-8"
        style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
      >
        {/* Avatar row */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {profile?.avatar ? (
              <img
                src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${profile.avatar}`}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2"
                style={{ borderColor: colors.primaryTeal }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold"
                style={{ background: "linear-gradient(135deg, #028090, #02C39A)", color: "#FFFFFF" }}
              >
                {initials(displayName)}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
              style={{ backgroundColor: colors.primaryTeal }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>
          <div className="min-w-0">
            <div
              className="text-xl font-semibold truncate"
              style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
            >
              {displayName}
            </div>
            <div
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: colors.cardTint, color: colors.primaryTeal }}
            >
              <ShieldCheck size={12} /> {roleLabel}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8482]" />
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">
                Phone
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8482]" />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8482]" />
                <input
                  value={profile?.email || user?.email || ""}
                  disabled
                  className={`${inputCls} pl-9 opacity-70 cursor-not-allowed`}
                />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: colors.textMuted }}>
                Email is managed by your super admin.
              </p>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Shop</label>
              <div className="relative">
                <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8482]" />
                <input
                  value={user?.shopName || "Your laundry"}
                  disabled
                  className={`${inputCls} pl-9 opacity-70 cursor-not-allowed`}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 transition hover:brightness-105 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Password card */}
      <div
        className="rounded-2xl border p-6 sm:p-8 mt-5"
        style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
      >
        <h3
          className="flex items-center gap-2 text-base mb-1"
          style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
        >
          <KeyRound size={16} color={colors.primaryTeal} /> Change password
        </h3>
        <p className="text-xs mb-5" style={{ color: colors.textMuted }}>
          Use at least 6 characters. You'll stay logged in after changing it.
        </p>

        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Current password</label>
            <input
              type="password"
              value={pw.currentPassword}
              onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
              required
              className={inputCls}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">New password</label>
              <input
                type="password"
                value={pw.newPassword}
                onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
                required
                minLength={6}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Confirm new password</label>
              <input
                type="password"
                value={pw.confirmPassword}
                onChange={(e) => setPw((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
                minLength={6}
                className={inputCls}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 transition hover:brightness-105 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #0B3B3E, #028090)" }}
          >
            {pwSaving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            {pwSaving ? "Changing…" : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
