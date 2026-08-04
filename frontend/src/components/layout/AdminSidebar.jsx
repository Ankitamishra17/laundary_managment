// src/components/layout/AdminSidebar.jsx
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";

import {
  LayoutGrid,
  Package,
  Users,
  UserCog,
  ClipboardList,
  Shirt,
  Boxes,
  Clock,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  WashingMachine,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid, to: "/admin/dashboard" },
  { label: "Orders", icon: Package, to: "/admin/orders" },
  { label: "Customers", icon: Users, to: "/admin/customers" },
  { label: "Employees", icon: UserCog, to: "/admin/employees" },
  { label: "Tasks", icon: ClipboardList, to: "/admin/tasks" },
  { label: "Services", icon: Shirt, to: "/admin/services" },
  {
    label: "Inventory",
    icon: Boxes,
    children: [
      { label: "Stock In / Out", to: "/admin/inventory/stock" },
      { label: "Suppliers", to: "/admin/inventory/suppliers" },
      { label: "Purchase History", to: "/admin/inventory/purchases" },
      { label: "Low Stock Alerts", to: "/admin/inventory/low-stock" },
    ],
  },
  {
    label: "Attendance",
    icon: Clock,
    children: [
      { label: "Daily Attendance", to: "/admin/attendance/daily" },
      { label: "Attendance Reports", to: "/admin/attendance/reports" },
    ],
  },
  { label: "Payroll", icon: Wallet, to: "/admin/payroll" },
  {
    label: "Payments",
    icon: CreditCard,
    children: [
      { label: "Payment History", to: "/admin/payments/history" },
      { label: "Pending Payments", to: "/admin/payments/pending" },
      { label: "Refunds", to: "/admin/payments/refunds" },
    ],
  },
  { label: "Reports", icon: BarChart3, to: "/admin/reports" },
  {
    label: "Settings",
    icon: Settings,
    children: [{ label: "Profile", to: "/admin/settings/profile" }],
  },
];

// Palette, spelled out once so nothing silently falls back to white again
const COLORS = {
  dark: "#05282A",
  dark2: "#0B3B3E",
  primary: "#028090",
  accent: "#02C39A",
};

export default function AdminSidebar() {
  const { logout } = useAuth();
  const [openGroups, setOpenGroups] = useState({ Inventory: true });

  function toggleGroup(label) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <aside
      className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0"
      style={{ backgroundColor: COLORS.dark, color: "rgba(255,255,255,0.8)" }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-6 h-20 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: COLORS.accent }}
        >
          <WashingMachine size={20} style={{ color: COLORS.dark }} />
        </div>
        <div className="leading-tight">
          <p
            style={{
              fontFamily: "'Libre Baskerville', serif",
              color: "#fff",
              fontSize: 18,
            }}
          >
            Laundry
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              letterSpacing: "0.03em",
              color: "rgba(255,255,255,0.5)",
              marginTop: -2,
            }}
          >
            Management System
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {NAV_ITEMS.map(({ label, icon: Icon, to, children }) => {
          const isOpen = !!openGroups[label];

          if (!children) {
            return (
              <NavLink
                key={label}
                to={to}
                style={({ isActive }) => ({
                  backgroundColor: isActive ? COLORS.primary : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                  fontWeight: isActive ? 500 : 400,
                })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:!bg-white/10 hover:!text-white"
              >
                <Icon size={18} className="shrink-0" />
                {label}
              </NavLink>
            );
          }

          return (
            <div key={label}>
              <button
                onClick={() => toggleGroup(label)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/10 hover:text-white"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                <Icon size={18} className="shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                <ChevronDown
                  size={15}
                  className="transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                />
              </button>

              <div
                className="grid transition-all duration-200 ease-in-out"
                style={{
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="overflow-hidden">
                  <div
                    className="ml-8 mt-0.5 mb-1 space-y-0.5 pl-3"
                    style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        style={({ isActive }) => ({
                          color: isActive
                            ? COLORS.accent
                            : "rgba(255,255,255,0.55)",
                          fontWeight: isActive ? 500 : 400,
                        })}
                        className="block px-3 py-2 rounded-lg text-[13px] transition-colors hover:!text-white"
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Account */}
      <div
        className="p-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/10"
          style={{
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fca5a5")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
          }
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
