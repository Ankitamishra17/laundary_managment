import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, ChevronDown, Shirt } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

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

const Topbar = () => {
  const { openSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const rawTitle =
    location.pathname.split("/").filter(Boolean).pop() || "dashboard";
  const pageTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

  // TODO: replace with the logged-in admin from your auth context/store
  const adminName = "Ankita Mishra";
  const adminRole = "Super Admin";
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

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
        {/* On mobile this opens the slide-in drawer (openSidebar).
            Desktop collapse is a separate control that lives inside SuperSidebar itself. */}
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
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: colors.seafoam }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div
                className="text-sm font-medium"
                style={{ color: colors.textDark }}
              >
                {adminName}
              </div>
              <div className="text-xs" style={{ color: colors.textMuted }}>
                {adminRole}
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
                >
                  Profile
                </button>
                <button
                  className="tb-menu-item w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: colors.textDark }}
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
