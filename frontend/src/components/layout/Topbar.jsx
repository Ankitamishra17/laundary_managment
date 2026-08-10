import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, ChevronDown, Shirt } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import Avatar from "./Avatar";

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

// Maps a route segment to a friendly page title
const TITLE_OVERRIDES = {
  dashboard: "Dashboard",
  mytask: "My Tasks",
  myattendance: "My Attendance",
  attendance: "Attendance",
  settings: "Settings",
  profile: "Profile",
  services: "Services",
  employees: "Employees",
  subscriptions: "Subscriptions",
};

function titleize(segment) {
  if (TITLE_OVERRIDES[segment]) return TITLE_OVERRIDES[segment];
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getProfileRoute(role) {
  switch (role) {
    case "admin":
      return "/admin/settings/profile";
    case "super_admin":
      return "/super/settings";
    case "employee":
      return "/employee/profile";
    case "customer":
      return "/customer/profile";
    default:
      return "/login";
  }
}

const Topbar = () => {
  const { openSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const segments = location.pathname.split("/").filter(Boolean);
  const pageTitle = titleize(segments[segments.length - 1] || "dashboard");

  const userName = user?.name || "User";
  const userRole =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "employee"
        ? "Staff Member"
        : user?.role || "User";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const profileRoute = getProfileRoute(user?.role);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-4"
      style={{
        backgroundColor: colors.bgLight,
        borderBottom: `1px solid ${colors.cardBorder}`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .tb-search:focus-within { border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.12); }
        .tb-icon-btn:hover { background-color: ${colors.cardBorder}; }
        .tb-menu-item:hover { background-color: ${colors.cardTint}; }
      `}</style>

      <div className="flex items-center gap-3 min-w-0">
        <button
          className="lg:hidden flex-shrink-0"
          onClick={openSidebar}
          style={{ color: colors.textDark }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 lg:hidden"
          style={{ backgroundColor: colors.primaryTeal }}
        >
          <Shirt size={14} color="#FFFFFF" />
        </div>
        <h1
          className="text-lg sm:text-xl truncate"
          style={{
            color: colors.textDark,
            fontFamily: "'Libre Baskerville', serif",
          }}
        >
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div
          className="tb-search hidden md:flex items-center gap-2 rounded-xl px-3 py-2 w-52 lg:w-72 border transition-shadow"
          style={{
            backgroundColor: colors.cardTint,
            borderColor: colors.cardBorder,
          }}
        >
          <Search
            size={15}
            style={{ color: colors.textMuted }}
            className="flex-shrink-0"
          />
          <input
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: colors.textDark }}
          />
        </div>

        <button
          className="tb-icon-btn relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ backgroundColor: colors.cardTint }}
          aria-label="Notifications"
        >
          <Bell size={16} style={{ color: colors.textDark }} />
          <span
            className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: colors.mint }}
          />
        </button>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2"
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            <Avatar user={user} className="w-9 h-9 text-xs" />
            <div className="hidden sm:block text-left leading-tight">
              <div
                className="text-sm font-medium"
                style={{ color: colors.textDark }}
              >
                {userName}
              </div>
              <div className="text-xs" style={{ color: colors.textMuted }}>
                {userRole}
              </div>
            </div>
            <ChevronDown
              size={14}
              className="hidden sm:block transition-transform"
              style={{
                color: colors.textMuted,
                transform: profileOpen ? "rotate(180deg)" : "none",
              }}
            />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileOpen(false)}
              />
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl shadow-xl py-1.5 z-40 border"
                style={{
                  backgroundColor: colors.bgLight,
                  borderColor: colors.cardBorder,
                }}
              >
                <button
                  className="tb-menu-item w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: colors.textDark }}
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(profileRoute);
                  }}
                >
                  Profile
                </button>
                <button
                  className="tb-menu-item w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: colors.textDark }}
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(profileRoute);
                  }}
                >
                  Account Settings
                </button>
                <div
                  className="my-1 h-px"
                  style={{ backgroundColor: colors.cardBorder }}
                />
                <button
                  onClick={handleLogout}
                  className="tb-menu-item w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: "#E0645C" }}
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
