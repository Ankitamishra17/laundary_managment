import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext.jsx";

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
  Star,
  AlertTriangle,
  CalendarDays,
  LogOut,
  ChevronDown,
  ChevronLeft,
  WashingMachine,
  X,
  FileText,
} from "lucide-react";

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
    to: "/admin/inventory",
    children: [
      { label: "Stock In / Out", to: "/admin/inventory/stock" },
      { label: "Suppliers", to: "/admin/inventory/suppliers" },
      { label: "Purchase", to: "/admin/inventory/purchases" },
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
    to: "/admin/payments",
    children: [
      { label: "All Transactions", to: "/admin/payments/transactions" },
      { label: "Customer Payments", to: "/admin/payments/customer" },
      { label: "Supplier Payments", to: "/admin/payments/supplier" },
      { label: "Employee Payments", to: "/admin/payments/salary" },
      { label: "Payment Reports", to: "/admin/payments/reports" },
    ],
  },
  { label: "Leaves", icon: CalendarDays, to: "/admin/leaves" },
  { label: "Reports", icon: BarChart3, to: "/admin/reports" },
  { label: "Reviews", icon: Star, to: "/admin/reviews" },
  { label: "Complaints", icon: AlertTriangle, to: "/admin/complaints" },
  { label: "Invoices", icon: FileText, to: "/admin/invoices" },
];

export default function AdminSidebar() {
  const { isOpen, closeSidebar, isCollapsed, toggleCollapse } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [openGroups, setOpenGroups] = useState({
    Inventory: true,
    Attendance: false,
    Payments: false,
  });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  const hideLabel = isCollapsed ? "lg:hidden" : "";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 flex flex-col shrink-0 bg-[#05282A] text-white/80 font-['Inter'] transform transition-all duration-300 ease-in-out lg:sticky lg:translate-x-0 lg:z-30 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-8 z-20 w-6 h-6 rounded-full items-center justify-center border-2 bg-[#028090] border-[#05282A]"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={13} color="#FFFFFF" className={`transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`} />
        </button>

        <div className="flex items-center justify-between gap-3 px-5 h-20 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#02C39A]">
              <WashingMachine size={20} className="text-[#05282A]" />
            </div>
            <div className={`${hideLabel} min-w-0`}>
              <p className="font-['Libre_Baskerville'] text-white text-[18px] leading-tight truncate">Laundry</p>
              <p className="text-[11px] tracking-[0.03em] text-white/50 -mt-0.5 truncate">Management System</p>
            </div>
          </div>
          <button type="button" className="lg:hidden shrink-0 text-white/60 hover:text-white" onClick={closeSidebar} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, to, children }) => {
            const isGroupOpen = !!openGroups[label];

            if (!children) {
              return (
                <NavLink
                  key={label}
                  to={to}
                  onClick={closeSidebar}
                  title={isCollapsed ? label : undefined}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isCollapsed ? "lg:justify-center" : ""} ${isActive ? "bg-[#028090] text-white font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className={`${hideLabel} truncate`}>{label}</span>
                </NavLink>
              );
            }

            return (
              <div key={label}>
                <div className="flex items-center">
                  <NavLink
                    to={to || "#"}
                    onClick={(e) => { if (!to) { e.preventDefault(); toggleGroup(label); } else { closeSidebar(); } }}
                    title={isCollapsed ? label : undefined}
                    className={({ isActive }) => `flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isCollapsed ? "lg:justify-center" : ""} ${isActive ? "bg-[#028090] text-white font-medium" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className={`${hideLabel} truncate`}>{label}</span>
                  </NavLink>
                  <button type="button" onClick={() => toggleGroup(label)} aria-expanded={isGroupOpen} aria-label={`Toggle ${label}`} className={`${hideLabel} px-2 py-2.5 rounded-lg text-white/70 hover:bg-white/10`}>
                    <ChevronDown size={15} className={`transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
                <div className={`${hideLabel} grid transition-all duration-200 ease-in-out`} style={{ gridTemplateRows: isGroupOpen ? "1fr" : "0fr", opacity: isGroupOpen ? 1 : 0 }}>
                  <div className="overflow-hidden">
                    <div className="ml-8 mt-0.5 mb-1 space-y-0.5 pl-3 border-l border-white/10">
                      {children.map((child) => (
                        <NavLink key={child.to} to={child.to} onClick={closeSidebar} className={({ isActive }) => `block px-3 py-2 rounded-lg text-[13px] transition-colors truncate ${isActive ? "text-[#02C39A] font-medium" : "text-white/55 hover:text-white"}`}>
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

        <div className="p-3 shrink-0 border-t border-white/10">
          <button type="button" onClick={handleLogout} title={isCollapsed ? "Logout" : undefined} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 transition-colors hover:bg-red-500/10 hover:text-red-400 ${isCollapsed ? "lg:justify-center" : ""}`}>
            <LogOut size={18} className="shrink-0" />
            <span className={hideLabel}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
