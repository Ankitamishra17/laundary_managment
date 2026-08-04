import React, { useState, useEffect, useRef } from "react";
import { User, Phone, Briefcase, ShieldCheck, Camera, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useMyProfile } from "../../hooks/useMyProfile";

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B8482] mb-1.5">
        <Icon size={13} /> {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECEA] bg-white text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/15 transition-all duration-150";

// Read-only display box for fields the employee cannot edit (set by admin)
const readOnlyClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-[#D8ECEA] bg-[#F3FAF9] text-sm text-[#0F2C2E]";

export default function MyProfile() {
  const {
    profile,
    loading,
    saving,
    error,
    successMsg,
    clearMessages,
    changePassword,
    updateAvatar,
  } = useMyProfile();

  const fileInputRef = useRef(null);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(clearMessages, 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, clearMessages]);

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      alert("New password and confirm password don't match");
      return;
    }
    changePassword(pwForm.currentPassword, pwForm.newPassword).then((ok) => {
      if (ok) setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    });
  };

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) updateAvatar(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans flex items-center justify-center" style={{ background: "#EEF7F6" }}>
        <div className="text-sm text-[#6B8482]">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "#EEF7F6" }}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#0F2C2E]">My Profile</h1>
          <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
            View your details, and manage your account security.
          </p>
        </div>

        {/* Toast messages */}
        {successMsg && (
          <div className="flex items-center gap-2 text-sm text-[#02724F] bg-[#DFF7F1] border border-[#B9E9D9] rounded-xl px-4 py-3">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-[#EEF7F6]">
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <div
                className="w-24 h-24 rounded-2xl p-[3px]"
                style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
              >
                <img
                  src={profile.avatar ? `${import.meta.env.VITE_API_URL}${profile.avatar}` : "https://i.pinimg.com/736x/40/94/d8/4094d87560374b53a40384407e6fa467.jpg"}
                  alt={profile.name}
                  className="w-full h-full rounded-2xl object-cover block"
                  style={{ border: "3px solid white" }}
                />
              </div>
              {/* Employees are allowed to change their photo */}
              <button
                onClick={handleAvatarClick}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md hover:brightness-105 transition-all"
                style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
                title="Change photo"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left">
              <div className="font-serif text-xl text-[#0F2C2E]">{profile.name}</div>
              <div className="text-sm text-[#6B8482] mt-0.5">{profile.email}</div>
              <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                <span
                  className="text-[11px] font-medium px-2.5 py-1 rounded-md capitalize"
                  style={{ background: "#DCEBEA", color: "#0B3B3E" }}
                >
                  {profile.role}
                </span>
                <span
                  className="text-[11px] font-medium px-2.5 py-1 rounded-md capitalize"
                  style={{
                    background: profile.status === "active" ? "#DFF7F1" : "#FBF0DC",
                    color: profile.status === "active" ? "#02724F" : "#9A6A12",
                  }}
                >
                  {profile.status}
                </span>
              </div>
            </div>
          </div>

          {/* Read-only details — set by admin, employee cannot edit */}
          <div className="pt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" icon={User}>
                <div className={readOnlyClass}>{profile.name || "—"}</div>
              </Field>
              <Field label="Phone" icon={Phone}>
                <div className={readOnlyClass}>{profile.phone || "—"}</div>
              </Field>
            </div>

            <Field label="Designation" icon={Briefcase}>
              <div className={readOnlyClass}>{profile.designation || "—"}</div>
            </Field>

            <p className="text-xs text-[#6B8482] pt-1">
              These details are managed by your admin. Contact them if any of this needs to change.
            </p>
          </div>
        </div>

        {/* Change password card */}
        <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#DCEBEA" }}>
              <ShieldCheck size={16} style={{ color: "#0B3B3E" }} />
            </div>
            <div>
              <div className="font-serif text-lg text-[#0F2C2E]">Change Password</div>
              <div className="text-xs text-[#6B8482]">Use a strong password you don't reuse elsewhere.</div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <Field label="Current Password" icon={Lock}>
              <input
                type="password"
                className={inputClass}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="New Password" icon={Lock}>
                <input
                  type="password"
                  className={inputClass}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  minLength={6}
                  required
                />
              </Field>
              <Field label="Confirm New Password" icon={Lock}>
                <input
                  type="password"
                  className={inputClass}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  minLength={6}
                  required
                />
              </Field>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0B3B3E, #028090)" }}
              >
                {saving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}