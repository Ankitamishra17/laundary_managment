import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Repeat,
  BarChart3,
  Settings,
  LogOut,
  Shirt,
  X,
  ChevronLeft,
  FileText,
} from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

const colors = {
  bgDark: "#05282A",
  panelDark: "#0B3B3E",
  primaryTeal: "#028090",
  mint: "#02C39A",
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
  { label: "Shops", icon: Store, path: "shops" },
  { label: "Subscriptions", icon: Repeat, path: "subscriptions" },
  { label: "Invoices", icon: FileText, path: "invoices" },
  { label: "Reports", icon: BarChart3, path: "reports" },
  { label: "Settings", icon: Settings, path: "settings" },
];

const SuperSidebar = () => {
  const { isOpen, closeSidebar, isCollapsed, toggleCollapse } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Note: isCollapsed is a desktop-only concept. Labels are hidden with
  // `lg:hidden` (not a plain conditional) so the mobile drawer always shows
  // full text even if isCollapsed happens to be true from a previous
  // desktop session.
  const hideLabel = isCollapsed ? "lg:hidden" : "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .sb-item { transition: background-color 0.15s ease, color 0.15s ease; }
        .sb-item:not(.sb-item-active):hover { background-color: ${colors.panelDark}; color: #FFFFFF; }
        .sb-logout:hover { background-color: #E0645C1A; }
      `}</style>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col flex-shrink-0 transform transition-all duration-300 ease-in-out
          lg:sticky lg:translate-x-0 lg:z-30
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
        style={{
          backgroundColor: colors.bgDark,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* decorative corner circle — clipped by its own layer so it never
            covers the floating collapse button below */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full"
            style={{ backgroundColor: colors.panelDark, opacity: 0.5 }}
          />
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-8 z-20 w-6 h-6 rounded-full items-center justify-center border-2"
          style={{
            backgroundColor: colors.primaryTeal,
            borderColor: colors.bgDark,
          }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={13}
            color="#FFFFFF"
            style={{
              transform: isCollapsed ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {/* Logo row */}
        <div className="relative z-10 flex items-center justify-between px-5 py-6 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: colors.primaryTeal }}
            >
              <Shirt size={16} color="#FFFFFF" />
            </div>
            <span
              className={`${hideLabel} text-sm tracking-[0.15em] uppercase truncate`}
              style={{ color: colors.mint, fontWeight: 600 }}
            >
              Laundry OS
            </span>
          </div>
          <button
            className="lg:hidden flex-shrink-0"
            onClick={closeSidebar}
            style={{ color: "#8FB3B0" }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="relative z-10 flex-1 px-3 mt-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={closeSidebar}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `sb-item ${isActive ? "sb-item-active" : ""} w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                  isCollapsed ? "lg:justify-center" : ""
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? colors.primaryTeal : "transparent",
                color: isActive ? "#FFFFFF" : "#A9C9C6",
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <item.icon size={17} className="flex-shrink-0" />
              <span className={`${hideLabel} truncate`}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div
          className="relative z-10 px-3 pb-6 pt-4 flex-shrink-0"
          style={{ borderTop: `1px solid ${colors.panelDark}` }}
        >
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={`sb-logout w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mt-3 transition-colors ${
              isCollapsed ? "lg:justify-center" : ""
            }`}
            style={{ color: "#E0645C" }}
          >
            <LogOut size={17} className="flex-shrink-0" />
            <span className={hideLabel}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SuperSidebar;
