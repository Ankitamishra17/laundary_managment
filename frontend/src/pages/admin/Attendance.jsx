import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Clock, CalendarRange, Sparkles } from "lucide-react";

const TABS = [
  { label: "Daily Attendance", to: "/admin/attendance/daily", icon: Clock },
  { label: "Attendance Reports", to: "/admin/attendance/reports", icon: CalendarRange },
];

export default function Attendance() {
  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
          >
            <Sparkles size={18} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl text-[#0F2C2E] leading-tight"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Attendance
            </h1>
            <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
              Track who's in, who's out, and review attendance over time.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-white border border-[#D8ECEA] rounded-2xl w-fit shadow-[0_1px_2px_rgba(15,44,46,0.04)]">
          {TABS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white shadow-md"
                    : "text-[#5A7A79] hover:text-[#0F2C2E] hover:bg-[#EEF7F6]"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: "linear-gradient(135deg, #028090, #00A896)" }
                  : undefined
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </div>

        <Outlet />
      </div>
    </div>
  );
}