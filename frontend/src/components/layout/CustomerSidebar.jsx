import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, PlusCircle, ClipboardList, User, LogOut, X, Shirt, ChevronLeft } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/customer/dashboard", icon: LayoutGrid },
  { label: "New Order", to: "/customer/new-order", icon: PlusCircle },
  { label: "My Orders", to: "/customer/orders", icon: ClipboardList },
  { label: "Profile", to: "/customer/profile", icon: User },
];

export default function CustomerSidebar() {
  const { isOpen, closeSidebar, isCollapsed, toggleCollapse } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const hideLabel = isCollapsed ? "lg:hidden" : "";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen flex flex-col transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${isCollapsed ? "lg:w-[76px]" : "lg:w-64"}`}
        style={{ backgroundColor: "#05282A", fontFamily: "'Inter', sans-serif" }}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-4 py-5 ${isCollapsed ? "lg:justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}>
            <Shirt size={18} color="#FFFFFF" />
          </div>
          <div className={`${hideLabel} min-w-0`}>
            <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              WashFlow
            </div>
            <div className="text-[11px] text-white/50 truncate">Customer</div>
          </div>
          <button className="lg:hidden ml-auto text-white/70" onClick={closeSidebar} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isCollapsed ? "lg:justify-center" : ""
                } ${
                  isActive
                    ? "bg-[#028090] text-white font-medium"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={18} className="shrink-0" />
              <span className={`${hideLabel} truncate`}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className={`flex items-center gap-3 mb-3 ${isCollapsed ? "lg:justify-center" : ""}`}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
            >
              {(user?.name || "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className={`${hideLabel} min-w-0`}>
              <div className="text-sm font-medium text-white truncate">{user?.name || "Customer"}</div>
              <div className="text-[11px] text-white/50 truncate">{user?.email || ""}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#E0645C] hover:bg-white/10 transition-colors ${isCollapsed ? "lg:justify-center" : ""}`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`${hideLabel} truncate`}>Logout</span>
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={toggleCollapse}
          className={`hidden lg:flex items-center justify-center py-3 border-t border-white/10 text-white/50 hover:text-white transition-colors ${isCollapsed ? "" : "gap-2"}`}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft size={16} className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          <span className={`${hideLabel} text-xs`}>Collapse</span>
        </button>
      </aside>
    </>
  );
}
