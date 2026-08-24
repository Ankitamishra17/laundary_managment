import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Users,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  XCircle,
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
} from "lucide-react";

import api from "../../api/axios";

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
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
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
  endDate.setHours(0, 0, 0, 0);

  return Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
};

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
          <p className="text-sm font-medium" style={{ color: colors.muted }}>
            {title}
          </p>

          <h3
            className="mt-2 text-2xl sm:text-3xl font-bold truncate"
            style={{ color: colors.dark }}
          >
            {value}
          </h3>

          {subtitle && (
            <p className="mt-1 text-xs" style={{ color: colors.muted }}>
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

const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();

  let background = colors.soft;
  let color = colors.primary;

  if (normalized === "active") {
    background = colors.greenBg;
    color = colors.green;
  }

  if (normalized === "expired") {
    background = colors.redBg;
    color = colors.red;
  }

  if (normalized === "cancelled") {
    background = "#F3F4F6";
    color = "#6B7280";
  }

  if (normalized === "paid") {
    background = colors.greenBg;
    color = colors.green;
  }

  if (normalized === "pending") {
    background = colors.orangeBg;
    color = colors.orange;
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: background,
        color,
      }}
    >
      {status || "-"}
    </span>
  );
};

const SuperAdminReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchReport = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/superadmin/reports");

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to fetch report.");
      }

      setReport(response.data.data);
    } catch (err) {
      console.error("Super Admin Report Error:", err);

      setError(
        err.response?.data?.message || err.message || "Unable to load report.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const overview = report?.overview || {};
  const plans = report?.plans || {};

  const expiringSubscriptions = report?.expiringSubscriptions?.data || [];

  const recentSubscriptions = report?.recentSubscriptions || [];

  const shops = report?.shops || [];

  const filteredShops = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return shops;

    return shops.filter((shop) => {
      return (
        shop.name?.toLowerCase().includes(value) ||
        shop.ownerName?.toLowerCase().includes(value) ||
        shop.email?.toLowerCase().includes(value) ||
        shop.shopCode?.toLowerCase().includes(value) ||
        shop.city?.toLowerCase().includes(value)
      );
    });
  }, [shops, search]);

  if (loading) {
    return (
      <div
        className="min-h-full p-4 sm:p-6 lg:p-8"
        style={{
          backgroundColor: colors.bg,
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded-lg bg-gray-200" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-32 rounded-2xl bg-gray-200" />
              ))}
            </div>

            <div className="h-80 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div
        className="min-h-full p-4 sm:p-6 lg:p-8"
        style={{
          backgroundColor: colors.bg,
        }}
      >
        <div className="mx-auto max-w-2xl">
          <div
            className="rounded-2xl border p-6 text-center"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.border,
            }}
          >
            <AlertTriangle
              size={40}
              className="mx-auto"
              style={{ color: colors.red }}
            />

            <h2
              className="mt-4 text-lg font-semibold"
              style={{ color: colors.dark }}
            >
              Unable to load report
            </h2>

            <p className="mt-2 text-sm" style={{ color: colors.muted }}>
              {error}
            </p>

            <button
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

  return (
    <div
      className="min-h-full p-4 sm:p-6 lg:p-8"
      style={{
        backgroundColor: colors.bg,
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* =========================================
            HEADER
        ========================================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText size={22} style={{ color: colors.primary }} />

              <h1
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: colors.dark }}
              >
                Super Admin Report
              </h1>
            </div>

            <p className="mt-1 text-sm" style={{ color: colors.muted }}>
              Overview of shops, subscriptions, revenue and users.
            </p>
          </div>

          <button
            onClick={() => fetchReport(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{
              backgroundColor: colors.primary,
            }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* =========================================
            OVERVIEW CARDS
        ========================================= */}
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
            title="Total Revenue"
            value={formatCurrency(overview.totalRevenue)}
            subtitle="Paid subscriptions"
            icon={IndianRupee}
            iconBg={colors.greenBg}
            iconColor={colors.green}
          />
        </div>

        {/* =========================================
            SECOND STATS
        ========================================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active Subscriptions"
            value={overview.activeSubscriptions || 0}
            subtitle="Currently active"
            icon={CreditCard}
            iconBg={colors.blueBg}
            iconColor={colors.blue}
          />

          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(overview.monthlyRevenue)}
            subtitle={`${plans.monthly || 0} monthly plans`}
            icon={TrendingUp}
            iconBg={colors.soft}
            iconColor={colors.primary}
          />

          <StatCard
            title="Yearly Revenue"
            value={formatCurrency(overview.yearlyRevenue)}
            subtitle={`${plans.yearly || 0} yearly plans`}
            icon={TrendingUp}
            iconBg="#F5F3FF"
            iconColor="#7C3AED"
          />

          <StatCard
            title="Total Users"
            value={overview.totalUsers || 0}
            subtitle="Users across shops"
            icon={Users}
            iconBg={colors.orangeBg}
            iconColor={colors.orange}
          />
        </div>

        {/* =========================================
            SUBSCRIPTION + USERS
        ========================================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Subscription Summary */}
          <div
            className="rounded-2xl border p-5"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{ color: colors.dark }}
                >
                  Subscription Summary
                </h2>

                <p className="mt-1 text-sm" style={{ color: colors.muted }}>
                  Current subscription status
                </p>
              </div>

              <CreditCard size={22} style={{ color: colors.primary }} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: colors.greenBg,
                }}
              >
                <p className="text-xs" style={{ color: colors.muted }}>
                  Active
                </p>

                <p
                  className="mt-1 text-2xl font-bold"
                  style={{ color: colors.green }}
                >
                  {overview.activeSubscriptions || 0}
                </p>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: colors.redBg,
                }}
              >
                <p className="text-xs" style={{ color: colors.muted }}>
                  Expired
                </p>

                <p
                  className="mt-1 text-2xl font-bold"
                  style={{ color: colors.red }}
                >
                  {overview.expiredSubscriptions || 0}
                </p>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: colors.orangeBg,
                }}
              >
                <p className="text-xs" style={{ color: colors.muted }}>
                  Monthly
                </p>

                <p
                  className="mt-1 text-2xl font-bold"
                  style={{ color: colors.orange }}
                >
                  {plans.monthly || 0}
                </p>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: colors.blueBg,
                }}
              >
                <p className="text-xs" style={{ color: colors.muted }}>
                  Yearly
                </p>

                <p
                  className="mt-1 text-2xl font-bold"
                  style={{ color: colors.blue }}
                >
                  {plans.yearly || 0}
                </p>
              </div>
            </div>
          </div>

          {/* User Summary */}
          <div
            className="rounded-2xl border p-5"
            style={{
              backgroundColor: colors.white,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{ color: colors.dark }}
                >
                  User Summary
                </h2>

                <p className="mt-1 text-sm" style={{ color: colors.muted }}>
                  Active users across all shops
                </p>
              </div>

              <Users size={22} style={{ color: colors.primary }} />
            </div>

            <div className="mt-5 space-y-4">
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

              <UserProgress
                label="Customers"
                value={overview.customerCount}
                total={overview.totalUsers}
                icon={Users}
              />
            </div>
          </div>
        </div>

        {/* =========================================
            EXPIRING SUBSCRIPTIONS
        ========================================= */}
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
                <AlertTriangle size={20} style={{ color: colors.orange }} />

                <h2
                  className="text-lg font-bold"
                  style={{ color: colors.dark }}
                >
                  Subscriptions Expiring Soon
                </h2>
              </div>

              <p className="mt-1 text-sm" style={{ color: colors.muted }}>
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
            <div className="p-8 text-center">
              <CheckCircle2
                size={38}
                className="mx-auto"
                style={{ color: colors.green }}
              />

              <p className="mt-3 font-semibold" style={{ color: colors.dark }}>
                No subscriptions expiring soon
              </p>

              <p className="mt-1 text-sm" style={{ color: colors.muted }}>
                Everything looks good for the next 3 days.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
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
                    <TableHeader>Expiry Date</TableHeader>
                    <TableHeader>Remaining</TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {expiringSubscriptions.map((subscription) => {
                    const days = getDaysRemaining(subscription.endDate);

                    return (
                      <tr
                        key={subscription.id}
                        className="border-t"
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

                        <TableCell>{subscription.plan}</TableCell>

                        <TableCell>
                          {formatCurrency(subscription.amount)}
                        </TableCell>

                        <TableCell>
                          {formatDate(subscription.endDate)}
                        </TableCell>

                        <TableCell>
                          <span
                            className="font-semibold"
                            style={{
                              color: days <= 1 ? colors.red : colors.orange,
                            }}
                          >
                            {days === 0
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

        {/* =========================================
            RECENT SUBSCRIPTIONS
        ========================================= */}
        <div
          className="rounded-2xl border"
          style={{
            backgroundColor: colors.white,
            borderColor: colors.border,
          }}
        >
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <CalendarDays size={20} style={{ color: colors.primary }} />

              <h2 className="text-lg font-bold" style={{ color: colors.dark }}>
                Recent Subscriptions
              </h2>
            </div>

            <p className="mt-1 text-sm" style={{ color: colors.muted }}>
              Latest subscription activity.
            </p>
          </div>

          {recentSubscriptions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: colors.muted }}>
                No subscriptions found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
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
                      className="border-t"
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

                      <TableCell>{subscription.plan}</TableCell>

                      <TableCell>
                        {formatCurrency(subscription.amount)}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={subscription.paymentStatus} />
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={subscription.status} />
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

        {/* =========================================
            ALL SHOPS
        ========================================= */}
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
                <Store size={20} style={{ color: colors.primary }} />

                <h2
                  className="text-lg font-bold"
                  style={{ color: colors.dark }}
                >
                  Shop Report
                </h2>
              </div>

              <p className="mt-1 text-sm" style={{ color: colors.muted }}>
                Complete overview of registered shops.
              </p>
            </div>

            <div
              className="flex w-full items-center gap-2 rounded-xl border px-3 py-2 lg:w-72"
              style={{
                backgroundColor: colors.soft,
                borderColor: colors.border,
              }}
            >
              <Search size={16} style={{ color: colors.muted }} />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shop..."
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: colors.dark }}
              />
            </div>
          </div>

          {filteredShops.length === 0 ? (
            <div className="p-8 text-center">
              <Building2
                size={36}
                className="mx-auto"
                style={{ color: colors.muted }}
              />

              <p className="mt-3 text-sm" style={{ color: colors.muted }}>
                No shops found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
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
                      className="border-t"
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
                            {shop.name}
                          </p>

                          <p
                            className="text-xs"
                            style={{
                              color: colors.muted,
                            }}
                          >
                            {shop.shopCode}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p
                            className="font-medium"
                            style={{
                              color: colors.dark,
                            }}
                          >
                            {shop.ownerName}
                          </p>

                          <p
                            className="text-xs"
                            style={{
                              color: colors.muted,
                            }}
                          >
                            {shop.email}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {shop.city}, {shop.state}
                      </TableCell>

                      <TableCell>{shop.subscriptionPlan}</TableCell>

                      <TableCell>
                        {formatCurrency(shop.subscriptionAmount)}
                      </TableCell>

                      <TableCell>
                        {formatDate(shop.subscriptionStart)}
                      </TableCell>

                      <TableCell>{formatDate(shop.subscriptionEnd)}</TableCell>

                      <TableCell>
                        <StatusBadge status={shop.subscriptionStatus} />
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
      </div>
    </div>
  );
};

// =====================================================
// TABLE COMPONENTS
// =====================================================

const TableHeader = ({ children }) => {
  return (
    <th
      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
      style={{ color: colors.muted }}
    >
      {children}
    </th>
  );
};

const TableCell = ({ children }) => {
  return (
    <td className="px-5 py-4 text-sm" style={{ color: colors.muted }}>
      {children}
    </td>
  );
};

// =====================================================
// USER PROGRESS
// =====================================================

const UserProgress = ({ label, value = 0, total = 0, icon: Icon }) => {
  const percentage =
    total > 0 ? Math.round((Number(value) / Number(total)) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={17} style={{ color: colors.primary }} />

          <span className="text-sm font-medium" style={{ color: colors.dark }}>
            {label}
          </span>
        </div>

        <span className="text-sm font-semibold" style={{ color: colors.dark }}>
          {value || 0}
        </span>
      </div>

      <div
        className="mt-2 h-2 overflow-hidden rounded-full"
        style={{
          backgroundColor: colors.soft,
        }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: colors.primary,
          }}
        />
      </div>

      <p className="mt-1 text-xs" style={{ color: colors.muted }}>
        {percentage}% of total users
      </p>
    </div>
  );
};

export default SuperAdminReport;
