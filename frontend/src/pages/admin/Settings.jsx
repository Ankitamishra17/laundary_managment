import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Store,
  User,
  Bell,
  Shield,
  CreditCard,
  Users,
  Package,
  FileText,
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Settings2,
  Link,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { profileApi } from "../../api/profileapi";

const colors = {
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
  danger: "#E0645C",
  amber: "#D4A017",
};

function QuickLinkCard({ icon: Icon, label, description, to, color }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-md hover:border-[#028090]/30"
      style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}1F` }}
      >
        <Icon size={18} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: colors.textDark }}>
          {label}
        </div>
        <div
          className="text-[12px] mt-0.5 truncate"
          style={{ color: colors.textMuted }}
        >
          {description}
        </div>
      </div>
      <ChevronRight size={16} style={{ color: colors.textMuted }} />
    </button>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: colors.cardTint }}
      >
        <Icon size={14} style={{ color: colors.primaryTeal }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px]" style={{ color: colors.textMuted }}>
          {label}
        </div>
        <div
          className="text-sm font-medium truncate"
          style={{ color: colors.textDark }}
        >
          {value || "\u2014"}
        </div>
      </div>
    </div>
  );
}

function NotificationPreference({ label, description, defaultOn }) {
  const [enabled, setEnabled] = useState(defaultOn);
  const [saving, setSaving] = useState(false);

  const handleToggle = () => {
    setSaving(true);
    setTimeout(() => {
      setEnabled((prev) => !prev);
      setSaving(false);
      toast.success(
        `${label} ${!enabled ? "enabled" : "disabled"}`,
      );
    }, 300);
  };

  return (
    <div
      className="flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-colors"
      style={{
        backgroundColor: enabled ? `${colors.mint}08` : colors.cardTint,
        borderColor: enabled ? `${colors.mint}30` : colors.cardBorder,
      }}
    >
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium"
          style={{ color: colors.textDark }}
        >
          {label}
        </div>
        <div
          className="text-[12px] mt-0.5"
          style={{ color: colors.textMuted }}
        >
          {description}
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={saving}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{
          backgroundColor: enabled ? colors.primaryTeal : colors.cardBorder,
        }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ left: enabled ? "24px" : "4px" }}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    profileApi
      .getMyProfile()
      .then((data) => setProfile(data))
      .catch(() => setProfile(user))
      .finally(() => setLoading(false));
  }, []);

  const shopName =
    profile?.shopName || user?.shopName || "Your Laundry";
  const shopCity = profile?.shopCity || user?.shopCity || "";
  const shopPhone =
    profile?.shopPhone ||
    user?.shopPhone ||
    profile?.phone ||
    user?.phone ||
    "";
  const shopEmail = profile?.email || user?.email || "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2
          size={26}
          className="animate-spin"
          style={{ color: colors.primaryTeal }}
        />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mb-6">
        <h2
          className="text-2xl sm:text-3xl flex items-center gap-2"
          style={{
            color: colors.textDark,
            fontFamily: "'Libre Baskerville', serif",
          }}
        >
          <Settings2 size={24} /> Settings
        </h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          Manage your shop settings and preferences
        </p>
      </div>

      {/* SHOP INFO */}
      <div
        className="rounded-2xl border p-6 sm:p-8 mb-5"
        style={{
          backgroundColor: colors.bgLight,
          borderColor: colors.cardBorder,
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.primaryTeal}1F` }}
          >
            <Store size={18} color={colors.primaryTeal} />
          </div>
          <div>
            <h3
              className="text-base font-semibold"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              Shop Information
            </h3>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>
              Your laundry shop details
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-5 mb-4"
          style={{ backgroundColor: colors.cardTint }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{
                background:
                  "linear-gradient(135deg, #028090, #02C39A)",
              }}
            >
              {shopName?.charAt(0)?.toUpperCase() || "L"}
            </div>
            <div>
              <div
                className="text-lg font-semibold"
                style={{
                  color: colors.textDark,
                  fontFamily: "'Libre Baskerville', serif",
                }}
              >
                {shopName}
              </div>
              <div
                className="text-xs"
                style={{ color: colors.textMuted }}
              >
                {shopCity ? `${shopCity} \u2022 ` : ""}
                Laundry Shop
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          <InfoRow icon={Mail} label="Email" value={shopEmail} />
          <InfoRow icon={Phone} label="Phone" value={shopPhone} />
          <InfoRow icon={MapPin} label="City" value={shopCity} />
          <InfoRow
            icon={Calendar}
            label="Subscription Status"
            value={user?.subscriptionStatus || "Active"}
          />
          <InfoRow
            icon={CreditCard}
            label="Plan"
            value={user?.planName || "Basic"}
          />
        </div>
      </div>

      {/* QUICK LINKS */}
      <div
        className="rounded-2xl border p-6 sm:p-8 mb-5"
        style={{
          backgroundColor: colors.bgLight,
          borderColor: colors.cardBorder,
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.seafoam}1F` }}
          >
            <Link size={18} color={colors.seafoam} />
          </div>
          <div>
            <h3
              className="text-base font-semibold"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              Quick Links
            </h3>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>
              Navigate to key settings areas
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <QuickLinkCard
            icon={User}
            label="My Profile"
            description="Update your name, phone, and avatar"
            to="/admin/settings/profile"
            color={colors.primaryTeal}
          />
          <QuickLinkCard
            icon={Users}
            label="Employees"
            description="Manage employee accounts and roles"
            to="/admin/employees"
            color={colors.seafoam}
          />
          <QuickLinkCard
            icon={Package}
            label="Inventory"
            description="Stock levels, suppliers, and purchases"
            to="/admin/inventory"
            color={colors.mint}
          />
          <QuickLinkCard
            icon={CreditCard}
            label="Payments"
            description="Customer, supplier, and salary payments"
            to="/admin/payments"
            color={colors.amber}
          />
          <QuickLinkCard
            icon={Shield}
            label="Complaints"
            description="View and resolve customer complaints"
            to="/admin/complaints"
            color={colors.danger}
          />
          <QuickLinkCard
            icon={FileText}
            label="Invoices"
            description="View and manage invoices"
            to="/admin/invoices"
            color={colors.primaryTeal}
          />
        </div>
      </div>

      {/* NOTIFICATION PREFERENCES */}
      <div
        className="rounded-2xl border p-6 sm:p-8 mb-5"
        style={{
          backgroundColor: colors.bgLight,
          borderColor: colors.cardBorder,
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.mint}1F` }}
          >
            <Bell size={18} color={colors.mint} />
          </div>
          <div>
            <h3
              className="text-base font-semibold"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              Notification Preferences
            </h3>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>
              Choose what notifications you receive
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <NotificationPreference
            label="New Order Alerts"
            description="Get notified when a customer places a new order"
            defaultOn={true}
          />
          <NotificationPreference
            label="Order Status Changes"
            description="Alerts when orders are picked up, processed, or delivered"
            defaultOn={true}
          />
          <NotificationPreference
            label="Low Stock Alerts"
            description="Warnings when inventory items fall below minimum levels"
            defaultOn={true}
          />
          <NotificationPreference
            label="Complaint Notifications"
            description="New complaints and customer replies"
            defaultOn={true}
          />
          <NotificationPreference
            label="Employee Updates"
            description="Leave requests and attendance alerts"
            defaultOn={false}
          />
        </div>
      </div>

      {/* ACCOUNT INFO */}
      <div
        className="rounded-2xl border p-6 sm:p-8"
        style={{
          backgroundColor: colors.bgLight,
          borderColor: colors.cardBorder,
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.amber}1F` }}
          >
            <Shield size={18} color={colors.amber} />
          </div>
          <div>
            <h3
              className="text-base font-semibold"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              Account
            </h3>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>
              Your account details
            </p>
          </div>
        </div>

        <div className="space-y-0.5">
          <InfoRow
            icon={User}
            label="Name"
            value={profile?.name || user?.name}
          />
          <InfoRow
            icon={Mail}
            label="Email"
            value={profile?.email || user?.email}
          />
          <InfoRow
            icon={Phone}
            label="Phone"
            value={profile?.phone || user?.phone}
          />
          <InfoRow
            icon={Shield}
            label="Role"
            value={
              user?.role === "super_admin" ? "Super Admin" : "Admin"
            }
          />
        </div>

        <div className="mt-5">
          <button
            onClick={() => navigate("/admin/settings/profile")}
            className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-105 active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, #028090, #00A896)",
            }}
          >
            <User size={16} /> Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
