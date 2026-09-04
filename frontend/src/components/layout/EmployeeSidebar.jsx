import React from "react";
import { NavLink } from "react-router-dom";

import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";

import Avatar from "./Avatar";

import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  PackageCheck,
  Boxes,
  CheckCircle2,
  Users,
  Clock,
  CalendarDays,
  ShieldCheck,
  User,
  Bell,
  LogOut,
  Droplet,
  X,
} from "lucide-react";

// ============================================================
// NAVIGATION
// ============================================================
//
// These are RELATIVE paths.
//
// Employee parent route:
//
// /:slug/employee
//
// Therefore:
//
// to="dashboard"
//      -> /fresh/employee/dashboard
//
// to="pickups"
//      -> /fresh/employee/pickups
//
// ============================================================

const NAV_SECTIONS = [
  {
    label: "Overview",

    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        to: "dashboard",
      },
    ],
  },

  {
    label: "Work",

    items: [
      {
        icon: ClipboardList,
        label: "My Tasks",
        to: "mytask",
      },

      {
        icon: Truck,
        label: "My Pickups",
        to: "pickups",
      },

      {
        icon: PackageCheck,
        label: "My Deliveries",
        to: "deliveries",
      },

      {
        icon: Boxes,
        label: "Orders in Process",
        to: "orders-in-process",
      },

      {
        icon: CheckCircle2,
        label: "Completed Orders",
        to: "completed-orders",
      },
    ],
  },

  {
    label: "Records",

    items: [
      {
        icon: Users,
        label: "Customers",
        to: "customers",
      },

      {
        icon: Clock,
        label: "My Attendance",
        to: "attendance",
      },

      {
        icon: CalendarDays,
        label: "My Leaves",
        to: "leaves",
      },

      {
        icon: ShieldCheck,
        label: "Complaints",
        to: "complaints",
      },
    ],
  },

  {
    label: "Account",

    items: [
      {
        icon: User,
        label: "My Profile",
        to: "profile",
      },

      {
        icon: Bell,
        label: "Notifications",
        to: "notifications",
      },
    ],
  },
];

// ============================================================
// EMPLOYEE SIDEBAR
// ============================================================

export default function EmployeeSidebar() {
  const { isOpen, closeSidebar } = useSidebar();

  const { user, logout } = useAuth();

  // ==========================================================
  // USER INFORMATION
  // ==========================================================

  const name = user?.name || "Employee";

  const role = user?.role || "employee";

  const displayRole =
    role === "employee"
      ? "Staff Member"
      : String(role)
          .replaceAll("_", " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Employee logout error:", error);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      {/* ======================================================
          MOBILE BACKDROP
          ====================================================== */}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside
        className={`
          fixed
          top-0
          left-0
          h-screen
          z-50
          flex
          flex-col
          w-64
          shrink-0
          text-white
          overflow-hidden

          transform
          transition-all
          duration-300
          ease-in-out

          lg:sticky
          lg:translate-x-0
          lg:z-30

          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background:
            "linear-gradient(180deg, #05282A 0%, #0B3B3E 60%, #0B3B3E 100%)",
        }}
      >
        {/* ====================================================
            AMBIENT GLOW
            ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            -top-24
            -left-16
            w-64
            h-64
            rounded-full
            opacity-25
            blur-3xl
          "
          style={{
            background:
              "radial-gradient(circle, #02C39A 0%, #028090 55%, transparent 75%)",
          }}
        />

        {/* ====================================================
            BRAND
            ==================================================== */}

        <div
          className="
            relative
            px-5
            py-6
            flex
            items-center
            gap-3
            border-b
            border-white/10
          "
        >
          {/* Logo */}

          <div
            className="
              w-10
              h-10
              rounded-xl
              flex
              items-center
              justify-center
              shrink-0
              shadow-lg
            "
            style={{
              background:
                "linear-gradient(135deg, #028090 0%, #00A896 55%, #02C39A 100%)",
            }}
          >
            <Droplet size={19} strokeWidth={2} className="text-white" />
          </div>

          {/* Brand text */}

          <div
            className="
              leading-tight
              min-w-0
              flex-1
            "
          >
            <div
              className="
                text-[16px]
                font-bold
                tracking-wide
                truncate
              "
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
              }}
            >
              Laundry
            </div>

            <div
              className="
                text-[10px]
                text-white/45
                tracking-[0.18em]
                -mt-0.5
              "
            >
              MANAGEMENT SYSTEM
            </div>
          </div>

          {/* ==================================================
              MOBILE CLOSE BUTTON
              ================================================== */}

          <button
            type="button"
            className="
              lg:hidden
              flex-shrink-0
            "
            onClick={closeSidebar}
            style={{
              color: "#8FB3B0",
            }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* ====================================================
            NAVIGATION
            ==================================================== */}

        <nav
          className="
            relative
            flex-1
            overflow-y-auto
            scrollbar-thin
            px-3
            py-5
            space-y-6
          "
        >
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {/* Section label */}

              <div
                className="
                    px-3
                    mb-2
                    text-[10px]
                    font-semibold
                    tracking-[0.18em]
                    text-white/35
                    uppercase
                  "
              >
                {section.label}
              </div>

              {/* Section items */}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.label}
                      // IMPORTANT:
                      // Relative path
                      //
                      // dashboard
                      // pickups
                      // profile
                      //
                      // NOT:
                      // /employee/dashboard

                      to={item.to}
                      end
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `
                              group
                              w-full
                              flex
                              items-center
                              justify-between
                              px-2.5
                              py-2.5
                              rounded-xl
                              text-sm
                              transition-all
                              duration-200

                              ${
                                isActive
                                  ? "text-white font-semibold shadow-md"
                                  : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                              }
                            `
                      }
                      style={({ isActive }) =>
                        isActive
                          ? {
                              background:
                                "linear-gradient(90deg, #028090 0%, #00A896 100%)",
                            }
                          : undefined
                      }
                    >
                      {({ isActive }) => (
                        <span
                          className="
                                flex
                                items-center
                                gap-3
                                min-w-0
                              "
                        >
                          {/* Icon */}

                          <span
                            className={`
                                  flex
                                  items-center
                                  justify-center
                                  w-7
                                  h-7
                                  rounded-lg
                                  shrink-0
                                  transition-colors
                                  duration-200

                                  ${
                                    isActive
                                      ? "bg-white/20"
                                      : "bg-white/[0.06] group-hover:bg-white/10"
                                  }
                                `}
                          >
                            <Icon
                              size={15}
                              strokeWidth={2}
                              className={
                                isActive ? "text-white" : "text-white/70"
                              }
                            />
                          </span>

                          {/* Label */}

                          <span className="truncate">{item.label}</span>
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ====================================================
            USER FOOTER
            ==================================================== */}

        <div
          className="
            relative
            border-t
            border-white/10
            px-4
            py-4
            flex
            items-center
            gap-3
          "
        >
          {/* Avatar */}

          <Avatar user={user} className="w-9 h-9 text-[11px]" />

          {/* User information */}

          <div
            className="
              flex-1
              min-w-0
            "
          >
            <div
              className="
                text-sm
                font-semibold
                truncate
              "
            >
              {name}
            </div>

            <div
              className="
                text-[11px]
                capitalize
              "
              style={{
                color: "#7EE8CC",
              }}
            >
              {displayRole}
            </div>
          </div>

          {/* ==================================================
              LOGOUT
              ================================================== */}

          <button
            type="button"
            onClick={handleLogout}
            className="
              text-white/40
              hover:text-white
              transition-colors
              flex-shrink-0
            "
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
