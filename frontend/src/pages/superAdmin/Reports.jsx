import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Users,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  RefreshCw,
  CalendarDays,
  TrendingUp,
  UserCog,
  UserRound,
  Store,
  FileText,
  Search,
  XCircle,
} from "lucide-react";

import api from "../../api/axios";

// =====================================================
// COLORS
// =====================================================

const colors = {
  primary: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",

  dark: "#0F2C2E",
  muted: "#5C7A78",

  bg: "#F7FBFA",
  white: "#FFFFFF",

  border: "#D8ECEA",
  soft: "#EEF7F6",

  red: "#DC2626",
  redBg: "#FEF2F2",

  orange: "#EA580C",
  orangeBg: "#FFF7ED",

  green: "#16A34A",
  greenBg: "#F0FDF4",

  blue: "#2563EB",
  blueBg: "#EFF6FF",

  purple: "#7C3AED",
  purpleBg: "#F5F3FF",
};

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (date) => {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDaysRemaining = (date) => {
  if (!date) return null;

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const endDate = new Date(date);

  if (Number.isNaN(endDate.getTime())) {
    return null;
  }

  endDate.setHours(0, 0, 0, 0);

  return Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

const getSubscriptionStatus = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "active") {
    return {
      background: colors.greenBg,
      color: colors.green,
    };
  }

  if (value === "expired") {
    return {
      background: colors.redBg,
      color: colors.red,
    };
  }

  if (value === "cancelled" || value === "canceled") {
    return {
      background: "#F3F4F6",
      color: "#6B7280",
    };
  }

  if (value === "paid") {
    return {
      background: colors.greenBg,
      color: colors.green,
    };
  }

  if (value === "pending") {
    return {
      background: colors.orangeBg,
      color: colors.orange,
    };
  }

  if (value === "failed") {
    return {
      background: colors.redBg,
      color: colors.red,
    };
  }

  return {
    background: colors.soft,
    color: colors.primary,
  };
};

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}) => {
  return (
    <div
      className="rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: colors.white,
        borderColor: colors.border,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-sm font-medium"
            style={{
              color: colors.muted,
            }}
          >
            {title}
          </p>

          <h3
            className="mt-2 truncate text-2xl font-bold sm:text-3xl"
            style={{
              color: colors.dark,
            }}
          >
            {value}
          </h3>

          {subtitle && (
            <p
              className="mt-1 text-xs"
              style={{
                color: colors.muted,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: iconBg,
            color: iconColor,
          }}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({ status }) => {
  const style = getSubscriptionStatus(status);

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: style.background,
        color: style.color,
      }}
    >
      {status || "-"}
    </span>
  );
};

// =====================================================
// TABLE HEADER
// =====================================================

const TableHeader = ({ children }) => {
  return (
    <th
      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
      style={{
        color: colors.muted,
      }}
    >
      {children}
    </th>
  );
};

// =====================================================
// TABLE CELL
// =====================================================

const TableCell = ({ children, className = "" }) => {
  return (
    <td
      className={`px-5 py-4 text-sm ${className}`}
      style={{
        color: colors.muted,
      }}
    >
      {children}
    </td>
  );
};

// =====================================================
// USER PROGRESS
// =====================================================

const UserProgress = ({ label, value = 0, total = 0, icon: Icon }) => {
  const safeValue = Number(value || 0);
  const safeTotal = Number(total || 0);

  const percentage =
    safeTotal > 0 ? Math.round((safeValue / safeTotal) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            size={17}
            style={{
              color: colors.primary,
            }}
          />

          <span
            className="text-sm font-medium"
            style={{
              color: colors.dark,
            }}
          >
            {label}
          </span>
        </div>

        <span
          className="text-sm font-semibold"
          style={{
            color: colors.dark,
          }}
        >
          {safeValue}
        </span>
      </div>

      <div
        className="mt-2 h-2 overflow-hidden rounded-full"
        style={{
          backgroundColor: colors.soft,
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: colors.primary,
          }}
        />
      </div>

      <p
        className="mt-1 text-xs"
        style={{
          color: colors.muted,
        }}
      >
        {percentage}% of total users
      </p>
    </div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const SuperAdminReport = () => {
  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // ===================================================
  // FETCH REPORT
  // ===================================================

  const fetchReport = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/superadmin/reports");

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message || "Failed to fetch super admin report.",
        );
      }

      setReport(response.data.data || {});
    } catch (err) {
      console.error("Super Admin Report Error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load super admin report.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchReport();
  }, []);

  // ===================================================
  // DATA
  // ===================================================

  const overview = report?.overview || {};

  const revenue = report?.revenue || {};

  const plans = report?.plans || {};

  const expiringSubscriptions = Array.isArray(
    report?.expiringSubscriptions?.data,
  )
    ? report.expiringSubscriptions.data
    : [];

  const recentSubscriptions = Array.isArray(report?.recentSubscriptions)
    ? report.recentSubscriptions
    : [];

  const shops = Array.isArray(report?.shops) ? report.shops : [];

  // ===================================================
  // FILTER SHOPS
  // ===================================================

  const filteredShops = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return shops;
    }

    return shops.filter((shop) => {
      const searchableText = [
        shop.name,
        shop.shopCode,
        shop.ownerName,
        shop.email,
        shop.phone,
        shop.city,
        shop.state,
        shop.subscriptionPlan,
        shop.subscriptionStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(value);
    });
  }, [shops, search]);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div
        className="min-h-screen p-4 sm:p-6 lg:p-8"
        style={{
          backgroundColor: colors.bg,
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-lg bg-gray-200" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-32 rounded-2xl bg-gray-200" />
              ))}
            </div>

            <div className="h-32 rounded-2xl bg-gray-200" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="h-72 rounded-2xl bg-gray-200" />
              <div className="h-72 rounded-2xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR WITHOUT DATA
  // ===================================================

  if (error && !report) {
    return (
      <div
        className="min-h-screen p-4 sm:p-6 lg:p-8"
        style={{
          backgroundColor: colors.bg,
        }}
      >
        <div className="mx-auto max-w-2xl">
          <div
            className="rounded-2xl border p-8 text-center"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.border,
            }}
          >
            <XCircle
              size={44}
              className="mx-auto"
              style={{
                color: colors.red,
              }}
            />

            <h2
              className="mt-4 text-xl font-bold"
              style={{
                color: colors.dark,
              }}
            >
              Unable to load report
            </h2>

            <p
              className="mt-2 text-sm"
              style={{
                color: colors.muted,
              }}
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() => fetchReport()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{
                backgroundColor: colors.primary,
              }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8"
      style={{
        backgroundColor: colors.bg,
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText
                size={23}
                style={{
                  color: colors.primary,
                }}
              />

              <h1
                className="text-2xl font-bold sm:text-3xl"
                style={{
                  color: colors.dark,
                }}
              >
                Super Admin Report
              </h1>
            </div>

            <p
              className="mt-1 text-sm"
              style={{
                color: colors.muted,
              }}
            >
              Overview of shops, subscriptions, revenue and users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchReport(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: colors.primary,
            }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =================================================
            ERROR WHEN REFRESH FAILS
        ================================================= */}

        {error && report && (
          <div
            className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
            style={{
              backgroundColor: colors.redBg,
              borderColor: "#FECACA",
              color: colors.red,
            }}
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">Could not refresh report</p>

              <p className="mt-0.5 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Shops"
            value={overview.totalShops || 0}
            subtitle="Registered shops"
            icon={Building2}
            iconBg={colors.soft}
            iconColor={colors.primary}
          />

          <StatCard
            title="Active Shops"
            value={overview.activeShops || 0}
            subtitle="Currently active"
            icon={CheckCircle2}
            iconBg={colors.greenBg}
            iconColor={colors.green}
          />

          <StatCard
            title="Expired Shops"
            value={overview.expiredShops || 0}
            subtitle="Subscription expired"
            icon={Clock3}
            iconBg={colors.redBg}
            iconColor={colors.red}
          />

          <StatCard
            title="Total Users"
            value={overview.totalUsers || 0}
            subtitle="Active users across shops"
            icon={Users}
            iconBg={colors.orangeBg}
            iconColor={colors.orange}
          />
        </div>

        {/* =================================================
            REVENUE SUMMARY
        ================================================= */}

        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-lg font-bold"
                style={{
                  color: colors.dark,
                }}
              >
                Revenue Summary
              </h2>

              <p
                className="mt-1 text-sm"
                style={{
                  color: colors.muted,
                }}
              >
                Subscription revenue overview.
              </p>
            </div>

            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: colors.greenBg,
                color: colors.green,
              }}
            >
              <IndianRupee size={20} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* TOTAL */}

            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: colors.greenBg,
              }}
            >
              <p
                className="text-xs font-medium"
                style={{
                  color: colors.muted,
                }}
              >
                Total Revenue
              </p>

              <p
                className="mt-2 text-2xl font-bold"
                style={{
                  color: colors.green,
                }}
              >
                {formatCurrency(revenue.total ?? overview.totalRevenue)}
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color: colors.muted,
                }}
              >
                All paid subscriptions
              </p>
            </div>

            {/* MTD */}

            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: colors.soft,
              }}
            >
              <p
                className="text-xs font-medium"
                style={{
                  color: colors.muted,
                }}
              >
                Revenue MTD
              </p>

              <p
                className="mt-2 text-2xl font-bold"
                style={{
                  color: colors.primary,
                }}
              >
                {formatCurrency(revenue.mtd ?? overview.revenueMTD)}
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color: colors.muted,
                }}
              >
                Revenue received this month
              </p>
            </div>

            {/* MONTHLY PLAN */}

            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: colors.orangeBg,
              }}
            >
              <p
                className="text-xs font-medium"
                style={{
                  color: colors.muted,
                }}
              >
                Monthly Plan Revenue
              </p>

              <p
                className="mt-2 text-2xl font-bold"
                style={{
                  color: colors.orange,
                }}
              >
                {formatCurrency(
                  revenue.monthlyPlan ?? overview.monthlyPlanRevenue,
                )}
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color: colors.muted,
                }}
              >
                From monthly plans
              </p>
            </div>

            {/* YEARLY PLAN */}

            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: colors.purpleBg,
              }}
            >
              <p
                className="text-xs font-medium"
                style={{
                  color: colors.muted,
                }}
              >
                Yearly Plan Revenue
              </p>

              <p
                className="mt-2 text-2xl font-bold"
                style={{
                  color: colors.purple,
                }}
              >
                {formatCurrency(
                  revenue.yearlyPlan ?? overview.yearlyPlanRevenue,
                )}
              </p>

              <p
                className="mt-1 text-xs"
                style={{
                  color: colors.muted,
                }}
              >
                From yearly plans
              </p>
            </div>
          </div>

          {/* PAYMENT COUNT */}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.bg,
              }}
            >
              <p
                className="text-xs"
                style={{
                  color: colors.muted,
                }}
              >
                Paid Subscriptions
              </p>

              <p
                className="mt-1 text-xl font-bold"
                style={{
                  color: colors.green,
                }}
              >
                {revenue.paidSubscriptionCount ??
                  overview.paidSubscriptionCount ??
                  0}
              </p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.bg,
              }}
            >
              <p
                className="text-xs"
                style={{
                  color: colors.muted,
                }}
              >
                Unpaid Subscriptions
              </p>

              <p
                className="mt-1 text-xl font-bold"
                style={{
                  color: colors.orange,
                }}
              >
                {revenue.unpaidSubscriptionCount ??
                  overview.unpaidSubscriptionCount ??
                  0}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            SUBSCRIPTION + USER SUMMARY
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* SUBSCRIPTIONS */}

          <div
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{
                    color: colors.dark,
                  }}
                >
                  Subscription Summary
                </h2>

                <p
                  className="mt-1 text-sm"
                  style={{
                    color: colors.muted,
                  }}
                >
                  Current subscription status.
                </p>
              </div>

              <CreditCard
                size={22}
                style={{
                  color: colors.primary,
                }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryBox
                label="Active"
                value={overview.activeSubscriptions}
                bg={colors.greenBg}
                color={colors.green}
              />

              <SummaryBox
                label="Expired"
                value={overview.expiredSubscriptions}
                bg={colors.redBg}
                color={colors.red}
              />

              <SummaryBox
                label="Cancelled"
                value={overview.cancelledSubscriptions}
                bg="#F3F4F6"
                color="#6B7280"
              />

              <SummaryBox
                label="Total"
                value={overview.totalSubscriptions}
                bg={colors.soft}
                color={colors.primary}
              />

              <SummaryBox
                label="Monthly Plans"
                value={plans.monthly}
                bg={colors.orangeBg}
                color={colors.orange}
              />

              <SummaryBox
                label="Yearly Plans"
                value={plans.yearly}
                bg={colors.blueBg}
                color={colors.blue}
              />
            </div>
          </div>

          {/* USERS */}

          <div
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{
                    color: colors.dark,
                  }}
                >
                  User Summary
                </h2>

                <p
                  className="mt-1 text-sm"
                  style={{
                    color: colors.muted,
                  }}
                >
                  Active users across all shops.
                </p>
              </div>

              <Users
                size={22}
                style={{
                  color: colors.primary,
                }}
              />
            </div>

            <div className="mt-6 space-y-5">
              <UserProgress
                label="Admins"
                value={overview.adminCount}
                total={overview.totalUsers}
                icon={UserCog}
              />

              <UserProgress
                label="Employees"
                value={overview.employeeCount}
                total={overview.totalUsers}
                icon={UserRound}
              />

              
            </div>
          </div>
        </div>

        {/* =================================================
            EXPIRING SUBSCRIPTIONS
        ================================================= */}

        <div
          className="rounded-2xl border"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.border,
          }}
        >
          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={20}
                  style={{
                    color: colors.orange,
                  }}
                />

                <h2
                  className="text-lg font-bold"
                  style={{
                    color: colors.dark,
                  }}
                >
                  Subscriptions Expiring Soon
                </h2>
              </div>

              <p
                className="mt-1 text-sm"
                style={{
                  color: colors.muted,
                }}
              >
                Active subscriptions expiring within the next 3 days.
              </p>
            </div>

            <span
              className="w-fit rounded-full px-3 py-1 text-xs font-bold"
              style={{
                backgroundColor:
                  expiringSubscriptions.length > 0
                    ? colors.orangeBg
                    : colors.greenBg,

                color:
                  expiringSubscriptions.length > 0
                    ? colors.orange
                    : colors.green,
              }}
            >
              {expiringSubscriptions.length}{" "}
              {expiringSubscriptions.length === 1
                ? "Subscription"
                : "Subscriptions"}
            </span>
          </div>

          {expiringSubscriptions.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle2
                size={40}
                className="mx-auto"
                style={{
                  color: colors.green,
                }}
              />

              <p
                className="mt-3 font-semibold"
                style={{
                  color: colors.dark,
                }}
              >
                No subscriptions expiring soon
              </p>

              <p
                className="mt-1 text-sm"
                style={{
                  color: colors.muted,
                }}
              >
                Everything looks good for the next 3 days.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr
                    style={{
                      backgroundColor: colors.soft,
                    }}
                  >
                    <TableHeader>Shop</TableHeader>
                    <TableHeader>Owner</TableHeader>
                    <TableHeader>Plan</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Expiry</TableHeader>
                    <TableHeader>Remaining</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {expiringSubscriptions.map((subscription) => {
                    const days = getDaysRemaining(
                      subscription.endDate || subscription.subscriptionEnd,
                    );

                    return (
                      <tr
                        key={subscription.id}
                        className="border-t transition-colors hover:bg-gray-50"
                        style={{
                          borderColor: colors.border,
                        }}
                      >
                        <TableCell>
                          <div>
                            <p
                              className="font-semibold"
                              style={{
                                color: colors.dark,
                              }}
                            >
                              {subscription.shop?.name || "-"}
                            </p>

                            <p
                              className="text-xs"
                              style={{
                                color: colors.muted,
                              }}
                            >
                              {subscription.shop?.shopCode || "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {subscription.shop?.ownerName || "-"}
                        </TableCell>

                        <TableCell>{subscription.plan || "-"}</TableCell>

                        <TableCell>
                          {formatCurrency(subscription.amount)}
                        </TableCell>

                        <TableCell>
                          {formatDate(
                            subscription.endDate ||
                              subscription.subscriptionEnd,
                          )}
                        </TableCell>

                        <TableCell>
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                days !== null && days <= 1
                                  ? colors.red
                                  : colors.orange,
                            }}
                          >
                            {days === null
                              ? "-"
                              : days < 0
                                ? "Expired"
                                : days === 0
                                  ? "Expires today"
                                  : `${days} day${days === 1 ? "" : "s"} left`}
                          </span>
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =================================================
            RECENT SUBSCRIPTIONS
        ================================================= */}

        <div
          className="rounded-2xl border"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.border,
          }}
        >
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <CalendarDays
                size={20}
                style={{
                  color: colors.primary,
                }}
              />

              <h2
                className="text-lg font-bold"
                style={{
                  color: colors.dark,
                }}
              >
                Recent Subscriptions
              </h2>
            </div>

            <p
              className="mt-1 text-sm"
              style={{
                color: colors.muted,
              }}
            >
              Latest subscription activity.
            </p>
          </div>

          {recentSubscriptions.length === 0 ? (
            <div className="p-10 text-center">
              <CreditCard
                size={36}
                className="mx-auto"
                style={{
                  color: colors.muted,
                }}
              />

              <p
                className="mt-3 text-sm"
                style={{
                  color: colors.muted,
                }}
              >
                No subscriptions found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr
                    style={{
                      backgroundColor: colors.soft,
                    }}
                  >
                    <TableHeader>Shop</TableHeader>
                    <TableHeader>Plan</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Payment</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Start</TableHeader>
                    <TableHeader>End</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {recentSubscriptions.map((subscription) => (
                    <tr
                      key={subscription.id}
                      className="border-t transition-colors hover:bg-gray-50"
                      style={{
                        borderColor: colors.border,
                      }}
                    >
                      <TableCell>
                        <div>
                          <p
                            className="font-semibold"
                            style={{
                              color: colors.dark,
                            }}
                          >
                            {subscription.shop?.name || "-"}
                          </p>

                          <p
                            className="text-xs"
                            style={{
                              color: colors.muted,
                            }}
                          >
                            {subscription.shop?.shopCode || "-"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>{subscription.plan || "-"}</TableCell>

                      <TableCell>
                        {formatCurrency(subscription.amount)}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={subscription.paymentStatus || "-"}
                        />
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={subscription.status || "-"} />
                      </TableCell>

                      <TableCell>
                        {formatDate(subscription.startDate)}
                      </TableCell>

                      <TableCell>{formatDate(subscription.endDate)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =================================================
            SHOP REPORT
        ================================================= */}

        <div
          className="rounded-2xl border"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.border,
          }}
        >
          <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Store
                  size={20}
                  style={{
                    color: colors.primary,
                  }}
                />

                <h2
                  className="text-lg font-bold"
                  style={{
                    color: colors.dark,
                  }}
                >
                  Shop Report
                </h2>
              </div>

              <p
                className="mt-1 text-sm"
                style={{
                  color: colors.muted,
                }}
              >
                Complete overview of registered shops.
              </p>
            </div>

            <div
              className="flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 lg:w-80"
              style={{
                backgroundColor: colors.soft,
                borderColor: colors.border,
              }}
            >
              <Search
                size={16}
                style={{
                  color: colors.muted,
                }}
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search shop, owner, email..."
                className="w-full bg-transparent text-sm outline-none"
                style={{
                  color: colors.dark,
                }}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="shrink-0"
                  style={{
                    color: colors.muted,
                  }}
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          </div>

          {filteredShops.length === 0 ? (
            <div className="p-10 text-center">
              <Building2
                size={38}
                className="mx-auto"
                style={{
                  color: colors.muted,
                }}
              />

              <p
                className="mt-3 text-sm"
                style={{
                  color: colors.muted,
                }}
              >
                {search ? "No shops match your search." : "No shops found."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead>
                  <tr
                    style={{
                      backgroundColor: colors.soft,
                    }}
                  >
                    <TableHeader>Shop</TableHeader>
                    <TableHeader>Owner</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Plan</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Start</TableHeader>
                    <TableHeader>End</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {filteredShops.map((shop) => (
                    <tr
                      key={shop.id}
                      className="border-t transition-colors hover:bg-gray-50"
                      style={{
                        borderColor: colors.border,
                      }}
                    >
                      {/* SHOP */}

                      <TableCell>
                        <div>
                          <p
                            className="font-semibold"
                            style={{
                              color: colors.dark,
                            }}
                          >
                            {shop.name || "-"}
                          </p>

                          <p
                            className="text-xs"
                            style={{
                              color: colors.muted,
                            }}
                          >
                            {shop.shopCode || "-"}
                          </p>
                        </div>
                      </TableCell>

                      {/* OWNER */}

                      <TableCell>
                        <div>
                          <p
                            className="font-medium"
                            style={{
                              color: colors.dark,
                            }}
                          >
                            {shop.ownerName || "-"}
                          </p>

                          {shop.email && (
                            <p
                              className="max-w-[220px] truncate text-xs"
                              style={{
                                color: colors.muted,
                              }}
                            >
                              {shop.email}
                            </p>
                          )}

                          {shop.phone && (
                            <p
                              className="text-xs"
                              style={{
                                color: colors.muted,
                              }}
                            >
                              {shop.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* LOCATION */}

                      <TableCell>
                        {shop.city || shop.state
                          ? `${shop.city || ""}${
                              shop.city && shop.state ? ", " : ""
                            }${shop.state || ""}`
                          : "-"}
                      </TableCell>

                      {/* PLAN */}

                      <TableCell>{shop.subscriptionPlan || "-"}</TableCell>

                      {/* AMOUNT */}

                      <TableCell>
                        {formatCurrency(shop.subscriptionAmount)}
                      </TableCell>

                      {/* START */}

                      <TableCell>
                        {formatDate(shop.subscriptionStart)}
                      </TableCell>

                      {/* END */}

                      <TableCell>{formatDate(shop.subscriptionEnd)}</TableCell>

                      {/* STATUS */}

                      <TableCell>
                        <StatusBadge status={shop.subscriptionStatus || "-"} />
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            className="border-t px-5 py-3 text-xs"
            style={{
              borderColor: colors.border,
              color: colors.muted,
            }}
          >
            Showing {filteredShops.length} of {shops.length} shops
          </div>
        </div>

        {/* =================================================
            REPORT FOOTER
        ================================================= */}

        <div
          className="flex flex-col gap-2 rounded-2xl border p-4 text-xs sm:flex-row sm:items-center sm:justify-between"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.border,
            color: colors.muted,
          }}
        >
          <div className="flex items-center gap-2">
            <FileText size={15} />

            <span>Super Admin consolidated report</span>
          </div>

          <span>Last refreshed: {new Date().toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// SUMMARY BOX
// =====================================================

const SummaryBox = ({ label, value = 0, bg, color }) => {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: bg,
      }}
    >
      <p
        className="text-xs"
        style={{
          color: colors.muted,
        }}
      >
        {label}
      </p>

      <p
        className="mt-1 text-2xl font-bold"
        style={{
          color,
        }}
      >
        {value || 0}
      </p>
    </div>
  );
};

export default SuperAdminReport;
