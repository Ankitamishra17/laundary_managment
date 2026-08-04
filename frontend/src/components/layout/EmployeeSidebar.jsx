import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Boxes,
  CheckCircle2,
  Users,
  BarChart3,
  User,
  Bell,
  HelpCircle,
  LogOut,
  Droplet,
} from "lucide-react";

// each item now carries a real route ("to") — this is what wires up navigation
const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", to: "/employee/dashboard" }],
  },
  {
    label: "Work",
    items: [
      { icon: ClipboardList, label: "My Tasks", to: "/employee/mytask", badge: 5 },
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
    ],
  },
  {
    label: "Account",
    items: [
      { icon: User, label: "My Profile", to: "/employee/profile" },
      { icon: Bell, label: "Notifications", to: "/employee/notifications", badge: 3 },
      { icon: HelpCircle, label: "Help & Support", to: "/employee/help" },
    ],
  },
];

export default function Sidebar({
  user = { name: "Vikram Kumar", role: "Staff Member", avatarUrl: "https://i.pinimg.com/736x/40/94/d8/4094d87560374b53a40384407e6fa467.jpg" },
  onLogout = () => {},
}) {
  return (
    <aside
      className="w-64 shrink-0 h-screen flex flex-col text-white relative overflow-hidden"
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
        <div className="leading-tight min-w-0">
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
                        {item.badge ? (
                          <span
                            className="text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0"
                            style={
                              isActive
                                ? { background: "#05282A", color: "#02C39A" }
                                : { background: "#02C39A", color: "#05282A" }
                            }
                          >
                            {item.badge}
                          </span>
                        ) : null}
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
        <div
          className="p-[2px] rounded-full shrink-0"
          style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover block"
            style={{ border: "2px solid #0B3B3E" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{user.name}</div>
          <div className="text-[11px]" style={{ color: "#7EE8CC" }}>
            {user.role}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-white/40 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}