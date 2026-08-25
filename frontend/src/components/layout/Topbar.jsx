import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  Shirt,
  AlertTriangle,
  Package,
  CalendarDays,
  ShoppingBag,
  XCircle,
  CheckCircle2,
  BellRing,
} from "lucide-react";

import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "../../api/notificationApi";

import {
  getSuperAdminNotifications,
  getSuperAdminUnreadNotificationCount,
} from "../../api/subscriptionNotificationApi";

import Avatar from "./Avatar";

// =====================================================
// COLORS
// =====================================================

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
  dangerBg: "#FEF2F2",

  success: "#059669",
  successBg: "#ECFDF5",

  info: "#2563EB",
  infoBg: "#EFF6FF",

  warningBg: "#FFFBEB",
  warningBorder: "#FDE68A",
  warningText: "#92400E",
  warningIcon: "#D97706",
};

// =====================================================
// PAGE TITLE
// =====================================================

const TITLE_OVERRIDES = {
  dashboard: "Dashboard",

  mytask: "My Tasks",
  mytasks: "My Tasks",

  myattendance: "My Attendance",
  attendance: "Attendance",

  settings: "Settings",
  profile: "Profile",

  services: "Services",
  employees: "Employees",

  subscriptions: "Subscriptions",
  inventory: "Inventory",
  suppliers: "Suppliers",

  orders: "Orders",
  customers: "Customers",

  tasks: "Tasks",
  payroll: "Payroll",

  payments: "Payments",
  transactions: "All Transactions",
  customer: "Customer Payments",
  supplier: "Supplier Payments",
  salary: "Employee Payments",

  reports: "Reports",

  stock: "Stock In / Out",
  purchases: "Purchase",
  "low-stock": "Low Stock Alerts",

  daily: "Daily Attendance",
};

// =====================================================
// TITLE FORMATTER
// =====================================================

function titleize(segment) {
  if (!segment) return "Dashboard";

  if (TITLE_OVERRIDES[segment]) {
    return TITLE_OVERRIDES[segment];
  }

  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// =====================================================
// PROFILE ROUTE
// =====================================================

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

// =====================================================
// NOTIFICATION HELPERS
// =====================================================

function getNotificationKind(notification) {
  const type = String(notification?.type || "").toLowerCase();

  if (type === "low_stock" || type === "low-stock") {
    return "low_stock";
  }

  if (
    type === "subscription_expiring" ||
    type === "subscription_expires_today"
  ) {
    return "subscription";
  }

  if (
    type === "order_cancelled" ||
    String(notification?.title || "")
      .toLowerCase()
      .includes("cancel")
  ) {
    return "order_cancelled";
  }

  if (
    type === "order" ||
    type === "new_order" ||
    type === "order_status" ||
    type.includes("order")
  ) {
    return "order";
  }

  return "general";
}

function NotificationIcon({ notification, isSuperAdmin }) {
  const kind = getNotificationKind(notification);

  if (isSuperAdmin || kind === "subscription") {
    return (
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.warningBg,
        }}
      >
        <CalendarDays
          size={17}
          style={{
            color: colors.warningIcon,
          }}
        />
      </div>
    );
  }

  if (kind === "low_stock") {
    return (
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.dangerBg,
        }}
      >
        <AlertTriangle
          size={17}
          style={{
            color: colors.danger,
          }}
        />
      </div>
    );
  }

  if (kind === "order_cancelled") {
    return (
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.dangerBg,
        }}
      >
        <XCircle
          size={17}
          style={{
            color: colors.danger,
          }}
        />
      </div>
    );
  }

  if (kind === "order") {
    return (
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.successBg,
        }}
      >
        <ShoppingBag
          size={17}
          style={{
            color: colors.success,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
      style={{
        backgroundColor: colors.infoBg,
      }}
    >
      <BellRing
        size={17}
        style={{
          color: colors.info,
        }}
      />
    </div>
  );
}

// =====================================================
// TOPBAR COMPONENT
// =====================================================

const Topbar = () => {
  const { openSidebar } = useSidebar();
  const { user, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  // ===================================================
  // PROFILE STATE
  // ===================================================

  const [profileOpen, setProfileOpen] = useState(false);

  // ===================================================
  // NOTIFICATION STATE
  // ===================================================

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // ===================================================
  // USER ROLES
  // ===================================================

  const isAdmin = user?.role === "admin";
  const isSuperAdmin = user?.role === "super_admin";

  const canReceiveNotifications = isAdmin || isSuperAdmin;

  // ===================================================
  // PAGE TITLE
  // ===================================================

  const segments = location.pathname.split("/").filter(Boolean);

  const pageTitle = titleize(segments[segments.length - 1] || "dashboard");

  // ===================================================
  // USER DETAILS
  // ===================================================

  const userName = user?.name || "User";

  const userRole =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "employee"
        ? "Staff Member"
        : user?.role === "admin"
          ? "Admin"
          : user?.role || "User";

  // ===================================================
  // LOAD NOTIFICATIONS
  // ===================================================

  const loadNotifications = useCallback(async () => {
    if (!canReceiveNotifications) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }

    try {
      setNotificationLoading(true);

      // =================================================
      // ADMIN
      // General notifications API:
      // LOW_STOCK + ORDER + CANCELLED + FUTURE TYPES
      // =================================================

      if (isAdmin) {
        const [notificationResponse, countResponse] = await Promise.all([
          getNotifications(),
          getUnreadNotificationCount(),
        ]);

        setNotifications(
          Array.isArray(notificationResponse) ? notificationResponse : [],
        );

        setNotificationCount(Number(countResponse || 0));
        return;
      }

      // =================================================
      // SUPER ADMIN
      // Separate subscription notification system
      // =================================================

      if (isSuperAdmin) {
        const [notificationResponse, countResponse] = await Promise.all([
          getSuperAdminNotifications(),
          getSuperAdminUnreadNotificationCount(),
        ]);

        setNotifications(
          Array.isArray(notificationResponse?.data)
            ? notificationResponse.data
            : [],
        );

        setNotificationCount(
          Number(countResponse?.data?.count ?? countResponse?.count ?? 0),
        );
      }
    } catch (error) {
      console.error("Notification Load Error:", error);

      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setNotificationLoading(false);
    }
  }, [canReceiveNotifications, isAdmin, isSuperAdmin]);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ===================================================
  // AUTO REFRESH
  // Checks every 30 seconds for new orders / low stock
  // ===================================================

  useEffect(() => {
    if (!canReceiveNotifications) return undefined;

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [canReceiveNotifications, loadNotifications]);

  // ===================================================
  // NOTIFICATION BELL CLICK
  // ===================================================

  const handleNotificationClick = async () => {
    const newState = !notificationOpen;

    setNotificationOpen(newState);

    if (newState) {
      setProfileOpen(false);
      await loadNotifications();
    }
  };

  // ===================================================
  // INDIVIDUAL NOTIFICATION CLICK
  // ===================================================

  const handleNotificationItemClick = async (notification) => {
    try {
      // Only general admin notifications use this API.
      // Super admin subscription notifications remain separate.
      if (isAdmin && !notification.isRead) {
        await markNotificationAsRead(notification.id);

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );

        setNotificationCount((previous) => Math.max(0, previous - 1));
      }

      // Navigate if notification has a route
      if (notification.link) {
        setNotificationOpen(false);
        navigate(notification.link);
      }
    } catch (error) {
      console.error("Mark Notification Read Error:", error);

      // Still allow navigation
      if (notification.link) {
        setNotificationOpen(false);
        navigate(notification.link);
      }
    }
  };

  // ===================================================
  // PROFILE CLICK
  // ===================================================

  const handleProfileClick = () => {
    setProfileOpen((previous) => {
      const newState = !previous;

      if (newState) {
        setNotificationOpen(false);
      }

      return newState;
    });
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  // ===================================================
  // PROFILE ROUTE
  // ===================================================

  const profileRoute = getProfileRoute(user?.role);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-4 sm:px-6"
      style={{
        backgroundColor: colors.bgLight,
        borderBottom: `1px solid ${colors.cardBorder}`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
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

        .notification-unread {
          border-left: 3px solid ${colors.primaryTeal};
        }
      `}</style>

      {/* =================================================
          LEFT SIDE
      ================================================= */}

      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="flex-shrink-0 lg:hidden"
          onClick={openSidebar}
          style={{ color: colors.textDark }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full lg:hidden"
          style={{
            backgroundColor: colors.primaryTeal,
          }}
        >
          <Shirt size={14} color="#FFFFFF" />
        </div>

        <h1
          className="truncate text-lg sm:text-xl"
          style={{
            color: colors.textDark,
            fontFamily: "'Libre Baskerville', serif",
          }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        {/* SEARCH */}

        <div
          className="tb-search hidden w-52 items-center gap-2 rounded-xl border px-3 py-2 transition-shadow md:flex lg:w-72"
          style={{
            backgroundColor: colors.cardTint,
            borderColor: colors.cardBorder,
          }}
        >
          <Search
            size={15}
            className="flex-shrink-0"
            style={{
              color: colors.textMuted,
            }}
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none"
            style={{
              color: colors.textDark,
            }}
          />
        </div>

        {/* =================================================
            NOTIFICATION BELL
        ================================================= */}

        {canReceiveNotifications && (
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={handleNotificationClick}
              className="tb-icon-btn relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
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

              {notificationCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{
                    backgroundColor: colors.danger,
                  }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION DROPDOWN */}

            {notificationOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setNotificationOpen(false)}
                />

                <div
                  className="absolute right-0 z-40 mt-3 w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border shadow-xl"
                  style={{
                    backgroundColor: colors.bgLight,
                    borderColor: colors.cardBorder,
                  }}
                >
                  {/* HEADER */}

                  <div
                    className="border-b px-4 py-4"
                    style={{
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
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
                          className="mt-1 text-xs"
                          style={{
                            color: colors.textMuted,
                          }}
                        >
                          {isSuperAdmin
                            ? "Subscription expiry alerts"
                            : "Low stock, orders and other alerts"}
                        </p>
                      </div>

                      {notificationCount > 0 && (
                        <span
                          className="rounded-full px-2 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: isSuperAdmin
                              ? colors.warningBg
                              : colors.dangerBg,

                            color: isSuperAdmin
                              ? colors.warningText
                              : colors.danger,
                          }}
                        >
                          {notificationCount} Unread
                        </span>
                      )}
                    </div>
                  </div>

                  {/* LOADING */}

                  {notificationLoading ? (
                    <div className="p-8 text-center">
                      <div
                        className="mx-auto h-6 w-6 animate-spin rounded-full border-2"
                        style={{
                          borderColor: colors.cardBorder,
                          borderTopColor: colors.primaryTeal,
                        }}
                      />

                      <p
                        className="mt-3 text-xs"
                        style={{
                          color: colors.textMuted,
                        }}
                      >
                        Loading notifications...
                      </p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div
                        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
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
                        {isSuperAdmin
                          ? "No subscription alerts"
                          : "No notifications"}
                      </p>

                      <p
                        className="mt-1 text-xs"
                        style={{
                          color: colors.textMuted,
                        }}
                      >
                        {isSuperAdmin
                          ? "All subscriptions are currently active."
                          : "New orders and inventory alerts will appear here."}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.map((notification) => {
                        const item = notification.inventoryItem;

                        const kind = getNotificationKind(notification);

                        const isUnread = notification.isRead === false;

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              handleNotificationItemClick(notification)
                            }
                            className={`notification-item w-full border-b p-4 text-left transition-colors ${
                              isUnread ? "notification-unread" : ""
                            }`}
                            style={{
                              borderColor: colors.cardBorder,
                              backgroundColor: isUnread
                                ? "#F8FCFB"
                                : colors.bgLight,
                            }}
                          >
                            <div className="flex gap-3">
                              <NotificationIcon
                                notification={notification}
                                isSuperAdmin={isSuperAdmin}
                              />

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

                                  {isUnread && (
                                    <span
                                      className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                                      style={{
                                        backgroundColor: colors.primaryTeal,
                                      }}
                                    />
                                  )}
                                </div>

                                {/* LOW STOCK */}

                                {kind === "low_stock" && (
                                  <>
                                    <div className="mt-2 flex items-center gap-1.5">
                                      <Package
                                        size={14}
                                        style={{
                                          color: colors.primaryTeal,
                                        }}
                                      />

                                      <p
                                        className="truncate text-sm font-semibold"
                                        style={{
                                          color: colors.primaryTeal,
                                        }}
                                      >
                                        {item?.name || "Inventory Item"}
                                      </p>
                                    </div>

                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                      <div
                                        className="rounded-lg px-2.5 py-2"
                                        style={{
                                          backgroundColor: colors.dangerBg,
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

                                        <p
                                          className="mt-0.5 text-xs font-semibold"
                                          style={{
                                            color: colors.danger,
                                          }}
                                        >
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
                                          className="mt-0.5 text-xs font-semibold"
                                          style={{
                                            color: colors.textDark,
                                          }}
                                        >
                                          {item?.minStock ?? 0}{" "}
                                          {item?.unit || ""}
                                        </p>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* SUPER ADMIN SUBSCRIPTION */}

                                {isSuperAdmin && (
                                  <div
                                    className="mt-2 rounded-lg px-3 py-3"
                                    style={{
                                      backgroundColor: colors.warningBg,
                                      border: `1px solid ${colors.warningBorder}`,
                                    }}
                                  >
                                    <div className="flex items-start gap-2">
                                      <CalendarDays
                                        size={14}
                                        className="mt-0.5 flex-shrink-0"
                                        style={{
                                          color: colors.warningIcon,
                                        }}
                                      />

                                      <p
                                        className="text-xs leading-5"
                                        style={{
                                          color: colors.warningText,
                                        }}
                                      >
                                        {notification.message}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* ADMIN ORDER / GENERAL MESSAGE */}

                                {!isSuperAdmin && (
                                  <p
                                    className="mt-2 text-xs leading-5"
                                    style={{
                                      color: colors.textMuted,
                                    }}
                                  >
                                    {notification.message}
                                  </p>
                                )}

                                {/* ORDER LABEL */}

                                {kind === "order" && (
                                  <div
                                    className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium"
                                    style={{
                                      backgroundColor: colors.successBg,
                                      color: colors.success,
                                    }}
                                  >
                                    <CheckCircle2 size={11} />
                                    Order Notification
                                  </div>
                                )}

                                {kind === "order_cancelled" && (
                                  <div
                                    className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium"
                                    style={{
                                      backgroundColor: colors.dangerBg,
                                      color: colors.danger,
                                    }}
                                  >
                                    <XCircle size={11} />
                                    Order Cancelled
                                  </div>
                                )}

                                {/* DATE */}

                                <p
                                  className="mt-2 text-[10px]"
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
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* =================================================
            PROFILE
        ================================================= */}

        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={handleProfileClick}
            className="flex items-center gap-2"
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            <Avatar user={user} className="h-9 w-9 text-xs" />

            <div className="hidden text-left leading-tight sm:block">
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
              className="hidden transition-transform sm:block"
              style={{
                color: colors.textMuted,
                transform: profileOpen ? "rotate(180deg)" : "none",
              }}
            />
          </button>

          {/* PROFILE DROPDOWN */}

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileOpen(false)}
              />

              <div
                className="absolute right-0 z-40 mt-2 w-48 rounded-xl border py-1.5 shadow-xl"
                style={{
                  backgroundColor: colors.bgLight,
                  borderColor: colors.cardBorder,
                }}
              >
                <button
                  type="button"
                  className="tb-menu-item w-full px-4 py-2 text-left text-sm transition-colors"
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
                  className="tb-menu-item w-full px-4 py-2 text-left text-sm transition-colors"
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
                  className="tb-menu-item w-full px-4 py-2 text-left text-sm transition-colors"
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
