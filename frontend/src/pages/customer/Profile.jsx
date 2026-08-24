import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  User as UserIcon,
  Mail,
  Phone,
  Store,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  Loader2,
  MapPin,
  Camera,
  ImagePlus,
} from "lucide-react";
import { getPublicShops } from "../../api/shopApi";
import { getMyCustomerProfile } from "../../api/customerApi";
import { profileApi } from "../../api/profileapi";
import { createPassword } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../../components/layout/Avatar";

const colors = {
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB — matches the backend upload limit

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();
  const [shopName, setShopName] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Upload a new profile photo: validate type/size, save it via the existing
  // profile-avatar API, then update the shared auth user so the navbar and
  // dropdown show the new photo immediately.
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const result = await profileApi.updateAvatar(file);
      if (result?.avatar) {
        updateUser({ avatar: result.avatar });
        toast.success("Profile photo updated!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not upload the photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicShops();
        if (res.success) {
          const shop = res.data.find((s) => String(s.id) === String(user?.shopId));
          if (shop) setShopName(`${shop.name}, ${shop.city}`);
        }
      } catch {
        /* best-effort — no need to bother the user */
      }
    })();
  }, [user?.shopId]);

  // Saved address comes from the customer profile record.
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyCustomerProfile();
        if (res.success) setCustomerProfile(res.data);
      } catch {
        /* best-effort — no need to bother the user */
      }
    })();
  }, []);

  const savedAddress = [customerProfile?.address, customerProfile?.city]
    .filter(Boolean)
    .join(", ");

  const handlePassword = async (e) => {
    e.preventDefault();

    if (!pw.current || !pw.next || !pw.confirm) {
      toast.error("Please fill all password fields.");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (pw.next.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await createPassword({
        currentPassword: pw.current,
        newPassword: pw.next,
        confirmPassword: pw.confirm,
      });
      if (res.success) {
        toast.success("Password updated successfully.");
        setPw({ current: "", next: "", confirm: "" });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all";
  const inputStyle = {
    backgroundColor: colors.cardTint,
    color: colors.textDark,
    borderColor: colors.cardBorder,
  };

  const rows = [
    { icon: UserIcon, label: "Full name", value: user?.name || "—" },
    { icon: Mail, label: "Email", value: user?.email || "—" },
    { icon: Phone, label: "Phone", value: user?.phone || "—" },
    { icon: Store, label: "Default laundry", value: shopName || (user?.shopId ? `Laundry #${user.shopId}` : "—") },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .cp-input:focus { outline: none; border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px rgba(2,128,144,0.14); background-color: #FFFFFF; }
      `}</style>

      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          My profile
        </h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          Your account details and security settings.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* Account details */}
        <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="flex items-center gap-4">
            {/* Profile photo with an upload button on the corner */}
            <div className="relative flex-shrink-0">
              <Avatar user={user} className="w-16 h-16 text-xl" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
                title="Change profile photo"
                aria-label="Change profile photo"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="min-w-0">
              <div className="text-lg truncate" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                {user?.name || "Customer"}
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full mt-1" style={{ backgroundColor: `${colors.mint}1F`, color: colors.seafoam }}>
                <CheckCircle2 size={11} /> Active account
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
            style={{ color: colors.primaryTeal, backgroundColor: `${colors.primaryTeal}12` }}
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
            {uploading ? "Uploading…" : user?.avatar ? "Change photo" : "Upload photo"}
          </button>

          <div className="mt-6 space-y-4">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colors.primaryTeal}1F` }}>
                  <r.icon size={17} color={colors.primaryTeal} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>{r.label}</div>
                  <div className="text-sm font-medium truncate" style={{ color: colors.textDark }}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>

          {savedAddress && (
            <div
              className="mt-6 rounded-xl p-4 flex items-start gap-3"
              style={{ backgroundColor: colors.cardTint, border: `1px solid ${colors.cardBorder}` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colors.primaryTeal}1F` }}>
                <MapPin size={16} color={colors.primaryTeal} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Saved address</div>
                <div className="text-sm font-medium mt-0.5 leading-relaxed" style={{ color: colors.textDark }}>{savedAddress}</div>
              </div>
            </div>
          )}

          <p className="mt-6 text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>
            Need to update your name, email or phone? Contact your laundry's help desk.
          </p>
        </div>

        {/* Change password */}
        <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <h3 className="flex items-center gap-2 text-base sm:text-lg" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
            <Lock size={17} color={colors.primaryTeal} /> Change password
          </h3>
          <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>
            Choose a strong password you don't use elsewhere.
          </p>

          <form onSubmit={handlePassword} className="mt-5 space-y-4">
            {[
              { key: "current", label: "Current password", placeholder: "Enter current password" },
              { key: "next", label: "New password", placeholder: "At least 6 characters" },
              { key: "confirm", label: "Confirm new password", placeholder: "Repeat new password" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>{f.label}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                  <input
                    type={show[f.key] ? "text" : "password"}
                    value={pw[f.key]}
                    onChange={(e) => setPw((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className={`${inputClass} cp-input pr-10`}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => ({ ...s, [f.key]: !s[f.key] }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: colors.textMuted }}
                    aria-label={`Toggle ${f.label} visibility`}
                  >
                    {show[f.key] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
