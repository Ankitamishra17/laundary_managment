import React from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import Avatar from "./Avatar";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Boxes,
  CheckCircle2,
  Users,
  BarChart3,
  Clock,
  User,
  Bell,
  HelpCircle,
  LogOut,
  Droplet,
  X,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", to: "/employee/dashboard" }],
  },
  {
    label: "Work",
    items: [
      { icon: ClipboardList, label: "My Tasks", to: "/employee/mytask" },
      { icon: Truck, label: "Assigned Pickups", to: "/employee/pickups" },
      { icon: Boxes, label: "Orders in Process", to: "/employee/orders-in-process" },
      { icon: CheckCircle2, label: "Completed Orders", to: "/employee/completed-orders" },
    ],
  },
  {
    label: "Records",
    items: [
      { icon: Users, label: "Customers", to: "/employee/customers" },
      { icon: Boxes, label: "Inventory", to: "/employee/inventory" },
      { icon: BarChart3, label: "Reports", to: "/employee/reports" },
      { icon: Clock, label: "My Attendance", to: "/employee/attendance" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: User, label: "My Profile", to: "/employee/profile" },
      { icon: Bell, label: "Notifications", to: "/employee/notifications" },
      { icon: HelpCircle, label: "Help & Support", to: "/employee/help" },
    ],
  },
];

export default function Sidebar() {
  const { isOpen, closeSidebar } = useSidebar();
  const { user, logout } = useAuth();

  const name = user?.name || "Employee";
  const role = user?.role || "Staff Member";
  const displayRole = role === "employee" ? "Staff Member" : role?.replace("_", " ");

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col w-64 shrink-0 text-white relative overflow-hidden transform transition-all duration-300 ease-in-out
          lg:sticky lg:translate-x-0 lg:z-30
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "linear-gradient(180deg, #05282A 0%, #0B3B3E 60%, #0B3B3E 100%)" }}
      >
        {/* ambient glow, signature element */}
        <div
          className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #02C39A 0%, #028090 55%, transparent 75%)" }}
        />

        {/* Brand */}
        <div className="relative px-5 py-6 flex items-center gap-3 border-b border-white/10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: "linear-gradient(135deg, #028090 0%, #00A896 55%, #02C39A 100%)" }}
          >
            <Droplet size={19} strokeWidth={2} className="text-white" />
          </div>
          <div className="leading-tight min-w-0 flex-1">
            <div
              className="text-[16px] font-bold tracking-wide truncate"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Laundry
            </div>
            <div className="text-[10px] text-white/45 tracking-[0.18em] -mt-0.5">
              MANAGEMENT SYSTEM
            </div>
          </div>
          {/* Mobile close */}
          <button
            className="lg:hidden flex-shrink-0"
            onClick={closeSidebar}
            style={{ color: "#8FB3B0" }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto scrollbar-thin px-3 py-5 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-2 text-[10px] font-semibold tracking-[0.18em] text-white/35 uppercase">
                {section.label}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      end
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `group w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          isActive
                            ? "text-white font-semibold shadow-md"
                            : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                        }`
                      }
                      style={({ isActive }) =>
                        isActive
                          ? { background: "linear-gradient(90deg, #028090 0%, #00A896 100%)" }
                          : undefined
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center gap-3 min-w-0">
                            <span
                              className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors duration-200 ${
                                isActive ? "bg-white/20" : "bg-white/[0.06] group-hover:bg-white/10"
                              }`}
                            >
                              <Icon
                                size={15}
                                strokeWidth={2}
                                className={isActive ? "text-white" : "text-white/70"}
                              />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / user */}
        <div className="relative border-t border-white/10 px-4 py-4 flex items-center gap-3">
          <Avatar user={user} className="w-9 h-9 text-[11px]" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-[11px] capitalize" style={{ color: "#7EE8CC" }}>
              {displayRole}
            </div>
          </div>
          <button
            onClick={logout}
            className="text-white/40 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
