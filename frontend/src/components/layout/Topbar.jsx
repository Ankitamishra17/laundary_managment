import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  Shirt,
  AlertTriangle,
  Package,
} from "lucide-react";

import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
// import Avatar from "./Avatar";

import {
  getNotifications,
  getUnreadNotificationCount,
} from "../../api/notificationApi";

const colors = {
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
  danger: "#DC2626",
};

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
  inventory: "Inventory",
  suppliers: "Suppliers",
};

function titleize(segment) {
  if (TITLE_OVERRIDES[segment]) {
    return TITLE_OVERRIDES[segment];
  }

  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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

  // ============================================
  // NOTIFICATION STATE
  // ============================================

  const [notificationOpen, setNotificationOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [notificationCount, setNotificationCount] = useState(0);

  const [notificationLoading, setNotificationLoading] = useState(false);

  // ============================================
  // ONLY ADMIN GETS LOW STOCK NOTIFICATIONS
  // ============================================

  const isAdmin = user?.role === "admin";

  // ============================================
  // PAGE TITLE
  // ============================================

  const segments = location.pathname.split("/").filter(Boolean);

  const pageTitle = titleize(segments[segments.length - 1] || "dashboard");

  // ============================================
  // USER
  // ============================================

  const userName = user?.name || "User";

  const userRole =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "employee"
        ? "Staff Member"
        : user?.role === "admin"
          ? "Admin"
          : user?.role || "User";

  // ============================================
  // LOAD NOTIFICATIONS
  // ============================================

  const loadNotifications = async () => {
    // Don't call notification API for
    // super_admin / employee / customer
    if (!isAdmin) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }

    try {
      setNotificationLoading(true);

      const [notificationResponse, countResponse] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(notificationResponse?.data || []);

      setNotificationCount(Number(countResponse?.count || 0));
    } catch (error) {
      console.error("Notification Load Error:", error);

      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setNotificationLoading(false);
    }
  };

  // ============================================
  // LOAD WHEN ADMIN LOGS IN / TOPBAR LOADS
  // ============================================

  useEffect(() => {
    if (isAdmin) {
      loadNotifications();
    } else {
      setNotifications([]);
      setNotificationCount(0);
    }
  }, [isAdmin]);

  // ============================================
  // OPEN NOTIFICATIONS
  // ============================================

  const handleNotificationClick = async () => {
    const newState = !notificationOpen;

    setNotificationOpen(newState);

    if (newState && isAdmin) {
      await loadNotifications();
    }
  };

  // ============================================
  // LOGOUT
  // ============================================

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
      {/* ========================================
          STYLES
      ======================================== */}

      <style>{`
        .tb-search:focus-within {
          border-color: ${colors.primaryTeal};
          box-shadow: 0 0 0 3px rgba(2, 128, 144, 0.12);
        }

        .tb-icon-btn:hover {
          background-color: ${colors.cardBorder};
        }

        .tb-menu-item:hover {
          background-color: ${colors.cardTint};
        }

        .notification-item:hover {
          background-color: ${colors.cardTint};
        }
      `}</style>

      {/* ========================================
          LEFT SIDE
      ======================================== */}

      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Menu */}

        <button
          type="button"
          className="lg:hidden flex-shrink-0"
          onClick={openSidebar}
          style={{
            color: colors.textDark,
          }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Mobile Logo */}

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 lg:hidden"
          style={{
            backgroundColor: colors.primaryTeal,
          }}
        >
          <Shirt size={14} color="#FFFFFF" />
        </div>

        {/* Page Title */}

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

      {/* ========================================
          RIGHT SIDE
      ======================================== */}

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* ======================================
            SEARCH
        ====================================== */}

        <div
          className="tb-search hidden md:flex items-center gap-2 rounded-xl px-3 py-2 w-52 lg:w-72 border transition-shadow"
          style={{
            backgroundColor: colors.cardTint,
            borderColor: colors.cardBorder,
          }}
        >
          <Search
            size={15}
            style={{
              color: colors.textMuted,
            }}
            className="flex-shrink-0"
          />

          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm outline-none w-full"
            style={{
              color: colors.textDark,
            }}
          />
        </div>

        {/* ======================================
            NOTIFICATION
            ONLY ADMIN
        ====================================== */}

        {isAdmin && (
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={handleNotificationClick}
              className="tb-icon-btn relative w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: colors.cardTint,
              }}
              aria-label="Notifications"
              aria-expanded={notificationOpen}
            >
              <Bell
                size={17}
                style={{
                  color: colors.textDark,
                }}
              />

              {/* Notification Count */}

              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    backgroundColor: colors.danger,
                  }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {/* ==================================
                NOTIFICATION DROPDOWN
            ================================== */}

            {notificationOpen && (
              <>
                {/* Overlay */}

                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setNotificationOpen(false)}
                />

                {/* Dropdown */}

                <div
                  className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl shadow-xl border z-40 overflow-hidden"
                  style={{
                    backgroundColor: colors.bgLight,
                    borderColor: colors.cardBorder,
                  }}
                >
                  {/* Header */}

                  <div
                    className="px-4 py-4 border-b"
                    style={{
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3
                          className="text-sm font-semibold"
                          style={{
                            color: colors.textDark,
                          }}
                        >
                          Notifications
                        </h3>

                        <p
                          className="text-xs mt-1"
                          style={{
                            color: colors.textMuted,
                          }}
                        >
                          Low stock alerts
                        </p>
                      </div>

                      {notificationCount > 0 && (
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: "#FEE2E2",
                            color: colors.danger,
                          }}
                        >
                          {notificationCount} Alert
                          {notificationCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Loading */}

                  {notificationLoading ? (
                    <div className="p-8 text-center">
                      <div
                        className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
                        style={{
                          borderColor: colors.cardBorder,
                          borderTopColor: colors.primaryTeal,
                        }}
                      />

                      <p
                        className="text-xs mt-3"
                        style={{
                          color: colors.textMuted,
                        }}
                      >
                        Loading notifications...
                      </p>
                    </div>
                  ) : notifications.length === 0 ? (
                    /* Empty */

                    <div className="p-8 text-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{
                          backgroundColor: colors.cardTint,
                        }}
                      >
                        <Bell
                          size={21}
                          style={{
                            color: colors.textMuted,
                          }}
                        />
                      </div>

                      <p
                        className="text-sm font-medium"
                        style={{
                          color: colors.textDark,
                        }}
                      >
                        No low stock alerts
                      </p>

                      <p
                        className="text-xs mt-1"
                        style={{
                          color: colors.textMuted,
                        }}
                      >
                        Your inventory is looking good.
                      </p>
                    </div>
                  ) : (
                    /* Notifications */

                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.map((notification) => {
                        const item = notification.inventoryItem;

                        return (
                          <div
                            key={notification.id}
                            className="notification-item p-4 border-b transition-colors"
                            style={{
                              borderColor: colors.cardBorder,
                            }}
                          >
                            <div className="flex gap-3">
                              {/* Icon */}

                              <div
                                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                                style={{
                                  backgroundColor: "#FEF2F2",
                                }}
                              >
                                <AlertTriangle
                                  size={17}
                                  className="text-red-500"
                                />
                              </div>

                              {/* Content */}

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className="text-sm font-semibold"
                                    style={{
                                      color: colors.textDark,
                                    }}
                                  >
                                    {notification.title}
                                  </p>
                                </div>

                                {/* Item Name */}

                                <div className="flex items-center gap-1.5 mt-2">
                                  <Package
                                    size={14}
                                    style={{
                                      color: colors.primaryTeal,
                                    }}
                                  />

                                  <p
                                    className="text-sm font-semibold truncate"
                                    style={{
                                      color: colors.primaryTeal,
                                    }}
                                  >
                                    {item?.name || "Inventory Item"}
                                  </p>
                                </div>

                                {/* Stock */}

                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <div
                                    className="rounded-lg px-2.5 py-2"
                                    style={{
                                      backgroundColor: "#FEF2F2",
                                    }}
                                  >
                                    <p
                                      className="text-[10px]"
                                      style={{
                                        color: colors.textMuted,
                                      }}
                                    >
                                      Current Stock
                                    </p>

                                    <p className="text-xs font-semibold text-red-600 mt-0.5">
                                      {item?.currentStock ?? 0}{" "}
                                      {item?.unit || ""}
                                    </p>
                                  </div>

                                  <div
                                    className="rounded-lg px-2.5 py-2"
                                    style={{
                                      backgroundColor: colors.cardTint,
                                    }}
                                  >
                                    <p
                                      className="text-[10px]"
                                      style={{
                                        color: colors.textMuted,
                                      }}
                                    >
                                      Minimum Stock
                                    </p>

                                    <p
                                      className="text-xs font-semibold mt-0.5"
                                      style={{
                                        color: colors.textDark,
                                      }}
                                    >
                                      {item?.minStock ?? 0} {item?.unit || ""}
                                    </p>
                                  </div>
                                </div>

                                {/* Message */}

                                <p
                                  className="text-xs mt-2 leading-5"
                                  style={{
                                    color: colors.textMuted,
                                  }}
                                >
                                  {notification.message}
                                </p>

                                {/* Date */}

                                <p
                                  className="text-[10px] mt-2"
                                  style={{
                                    color: colors.textMuted,
                                  }}
                                >
                                  {notification.createdAt
                                    ? new Date(
                                        notification.createdAt,
                                      ).toLocaleString("en-IN")
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ======================================
            PROFILE
        ====================================== */}

        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            className="flex items-center gap-2"
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            {/* <Avatar user={user} className="w-9 h-9 text-xs" /> */}

            <div className="hidden sm:block text-left leading-tight">
              <div
                className="text-sm font-medium"
                style={{
                  color: colors.textDark,
                }}
              >
                {userName}
              </div>

              <div
                className="text-xs"
                style={{
                  color: colors.textMuted,
                }}
              >
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

          {/* Profile Dropdown */}

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
                  type="button"
                  className="tb-menu-item w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{
                    color: colors.textDark,
                  }}
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(profileRoute);
                  }}
                >
                  Profile
                </button>

                <button
                  type="button"
                  className="tb-menu-item w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{
                    color: colors.textDark,
                  }}
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(profileRoute);
                  }}
                >
                  Account Settings
                </button>

                <div
                  className="my-1 h-px"
                  style={{
                    backgroundColor: colors.cardBorder,
                  }}
                />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="tb-menu-item w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{
                    color: "#E0645C",
                  }}
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
