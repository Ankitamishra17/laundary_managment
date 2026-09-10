import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  ClipboardList,
  IndianRupee,
  Users,
  UserCog,
  Clock,
  Truck,
  UserCheck,
  UserX,
  AlarmClock,
  TrendingUp,
  ArrowUpRight,
  Receipt,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getAdminDashboard } from "../../api/adminDashboardApi";

const colors = {
  bgDark: "#05282A",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
  danger: "#E0645C",
  amber: "#D4A017",
};

// =====================================================
// FORMAT CURRENCY
// =====================================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

// =====================================================
// STATUS STYLES
// =====================================================

const statusStyles = {
  Pending: { bg: "#D4A0171F", text: "#B8791F" },
  New: { bg: "#D4A0171F", text: "#B8791F" },
  Pickup: { bg: "#D4A0171F", text: "#B8791F" },
  Processing: { bg: "#00A8961F", text: "#00A896" },
  Ready: { bg: "#02C39A1F", text: "#028090" },
  "Out For Delivery": { bg: "#0280901F", text: "#028090" },
  Delivered: { bg: "#0B6E631F", text: "#0B6E63" },
  Cancelled: { bg: "#E0645C1F", text: "#E0645C" },
};

// =====================================================
// FORMAT STATUS
// =====================================================

const formatStatus = (status) => {
  if (!status) return "Pending";

  return String(status)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

// =====================================================
// BADGE
// =====================================================

const Badge = ({ status }) => {
  const formattedStatus = formatStatus(status);
  const style = statusStyles[formattedStatus] || statusStyles.Processing;

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {formattedStatus}
    </span>
  );
};

// =====================================================
// CARD SHELL
// =====================================================

const CardShell = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border p-5 sm:p-6 ${className}`}
    style={{
      backgroundColor: colors.bgLight,
      borderColor: colors.cardBorder,
    }}
  >
    {children}
  </div>
);

// =====================================================
// SECTION TITLE
// =====================================================

const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between gap-3 mb-4">
    <h3
      className="text-base sm:text-lg"
      style={{
        color: colors.textDark,
        fontFamily: "'Libre Baskerville', serif",
      }}
    >
      {children}
    </h3>
    {action}
  </div>
);

// =====================================================
// DASHBOARD
// =====================================================

export default function ShopDashboard() {
  const { user } = useAuth();

  const [period, setPeriod] = useState("Daily");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===================================================
  // FETCH DASHBOARD
  // ===================================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAdminDashboard();
        console.log("Admin Dashboard Response:", response);

        setDashboard(response?.data || response);
      } catch (err) {
        console.error("Dashboard Error:", err.response?.data || err.message);
        setError(
          err.response?.data?.message || "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ===================================================
  // DATE / GREETING
  // ===================================================

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const adminName = user?.name?.split(" ")[0] || "Admin";

  // ===================================================
  // STATS
  // ===================================================

  const stats = [
    { label: "Total Orders", value: dashboard?.orders?.total ?? 0, delta: dashboard?.summary?.todayOrders ? `+${dashboard.summary.todayOrders} today` : `${dashboard?.orders?.pending ?? 0} pending`, icon: ClipboardList, color: colors.primaryTeal },
    { label: "Total Revenue", value: formatCurrency(dashboard?.summary?.totalRevenue ?? 0), delta: dashboard?.summary?.todayRevenue ? `Today: ${formatCurrency(dashboard.summary.todayRevenue)}` : "₹0 today", icon: IndianRupee, color: colors.mint },
    { label: "Customers", value: dashboard?.customers?.total ?? 0, delta: dashboard?.customers?.newToday ? `+${dashboard.customers.newToday} today` : "0 today", icon: Users, color: colors.seafoam },
    { label: "Employees", value: dashboard?.business?.totalEmployees ?? 0, delta: `${dashboard?.business?.presentToday ?? 0} present`, icon: UserCog, color: colors.primaryTeal },
  ];

  // ===================================================
  // ORDER STATUS
  // ===================================================

  const orderStatus = [
    { label: "Pending", count: Number(dashboard?.orders?.pending ?? 0), color: colors.amber },
    { label: "Processing", count: Number(dashboard?.orders?.processing ?? 0), color: colors.seafoam },
    { label: "Ready", count: Number(dashboard?.orders?.ready ?? 0), color: colors.mint },
    { label: "Delivered", count: Number(dashboard?.orders?.delivered ?? 0), color: "#0B6E63" },
    { label: "Cancelled", count: Number(dashboard?.orders?.cancelled ?? 0), color: colors.danger },
  ];

  const maxStatus = Math.max(
    ...orderStatus.map((item) => Number(item.count) || 0),
    1,
  );

  // ===================================================
  // DATA
  // ===================================================

  const recentOrders = dashboard?.recentOrders || [];
  const employeeTasks = dashboard?.employeeTasks || [];
  const pickups = dashboard?.pickups || [];
  const deliveries = dashboard?.deliveries || [];
  const recentPayments = dashboard?.recentTransactions || [];

  const maxTasks = Math.max(
    ...employeeTasks.map((item) => Number(item.orders) || 0),
    1,
  );

  // ===================================================
  // ATTENDANCE
  // ===================================================

  const attendance = [
    {
      label: "Present",
      value: dashboard?.attendance?.present || 0,
      icon: UserCheck,
      color: colors.mint,
    },
    {
      label: "Absent",
      value: dashboard?.attendance?.absent || 0,
      icon: UserX,
      color: colors.danger,
    },
    {
      label: "Late",
      value: dashboard?.attendance?.late || 0,
      icon: AlarmClock,
      color: colors.amber,
    },
  ];

  // ===================================================
  // REVENUE
  // ===================================================

  const revenueData = {
    Daily: dashboard?.revenue?.daily || [],
    Weekly: dashboard?.revenue?.weekly || [],
    Monthly: dashboard?.revenue?.monthly || [],
  };

  // ===================================================
  // LOW INVENTORY
  // ===================================================

  const inventory = dashboard?.lowStockItems || [];

  // ===================================================
  // TOP SERVICES
  // ===================================================

  const topServices = dashboard?.topServices || [];

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm" style={{ color: colors.textMuted }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <h2
          className="text-2xl sm:text-3xl flex items-center gap-2"
          style={{
            color: colors.textDark,
            fontFamily: "'Libre Baskerville', serif",
          }}
        >
          {greeting}, {adminName}
          <span>👋</span>
        </h2>
        <span className="text-sm" style={{ color: colors.textMuted }}>
          {today}
        </span>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <CardShell key={stat.label}>
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}1F` }}
                >
                  <Icon size={18} color={stat.color} />
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: colors.seafoam }}
                >
                  {stat.delta}
                </span>
              </div>
              <div
                className="mt-4 text-2xl sm:text-3xl"
                style={{
                  color: colors.textDark,
                  fontFamily: "'Libre Baskerville', serif",
                }}
              >
                {stat.value}
              </div>
              <div
                className="mt-1 text-xs sm:text-sm"
                style={{ color: colors.textMuted }}
              >
                {stat.label}
              </div>
            </CardShell>
          );
        })}
      </div>

      {/* ORDER STATUS */}
      <CardShell className="mt-5">
        <SectionTitle>Order Status</SectionTitle>
        <div className="space-y-3">
          {orderStatus.map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <span
                className="w-24 text-sm flex-shrink-0"
                style={{ color: colors.textDark }}
              >
                {item.label}
              </span>
              <div
                className="flex-1 h-2.5 rounded-full"
                style={{ backgroundColor: colors.cardTint }}
              >
                <div
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: `${(item.count / maxStatus) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span
                className="w-8 text-sm text-right font-medium"
                style={{ color: colors.textDark }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </CardShell>

      {/* RECENT ORDERS */}
      <CardShell className="mt-5">
        <SectionTitle
          action={
           <a 
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: colors.primaryTeal }}
            >
              View all
              <ArrowUpRight size={13} />
            </a>
          }
        >
          Recent Orders
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left" style={{ color: colors.textMuted }}>
                <th className="font-medium px-2 py-2">Order ID</th>
                <th className="font-medium px-2 py-2">Customer</th>
                <th className="font-medium px-2 py-2">Employee</th>
                <th className="font-medium px-2 py-2">Amount</th>
                <th className="font-medium px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-8 text-center"
                    style={{ color: colors.textMuted }}
                  >
                    No recent orders found
                  </td>
                </tr>
              ) : (
                recentOrders.map((order, index) => (
                  <tr
                    key={order.id || index}
                    className="transition-colors hover:bg-[#EEF7F6]"
                    style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                  >
                    <td
                      className="px-2 py-3 font-medium"
                      style={{ color: colors.textDark }}
                    >
                      #{order.id}
                    </td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                      {order.customer?.name ||
                        order.customerName ||
                        "N/A"}
                    </td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                      {order.employee?.name ||
                        order.employeeName ||
                        "Unassigned"}
                    </td>
                    <td
                      className="px-2 py-3"
                      style={{ color: colors.textDark }}
                    >
                      {formatCurrency(
                        order.total_amount || order.totalAmount || 0,
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <Badge status={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardShell>

      {/* TASKS / PICKUPS / DELIVERIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <CardShell>
          <SectionTitle>Employee Tasks</SectionTitle>
          {employeeTasks.length === 0 ? (
            <p
              className="text-sm py-4 text-center"
              style={{ color: colors.textMuted }}
            >
              No employee tasks found
            </p>
          ) : (
            <div className="space-y-3">
              {employeeTasks.map((employee, index) => (
                <div
                  key={employee.id || employee.name || index}
                  className="flex items-center gap-3"
                >
                  <span
                    className="w-20 text-sm truncate"
                    style={{ color: colors.textDark }}
                  >
                    {employee.name || "Employee"}
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full"
                    style={{ backgroundColor: colors.cardTint }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${((Number(employee.orders) || 0) / maxTasks) * 100}%`,
                        backgroundColor: colors.primaryTeal,
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: colors.textMuted }}>
                    {employee.orders || 0} tasks
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardShell>

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Clock size={16} color={colors.primaryTeal} />
              Pending Pickups
            </span>
          </SectionTitle>
          {pickups.length === 0 ? (
            <p
              className="text-sm py-4 text-center"
              style={{ color: colors.textMuted }}
            >
              No pending pickups 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {pickups.map((pickup, index) => (
                <div
                  key={pickup.id || index}
                  className="flex items-center justify-between text-sm gap-3"
                >
                  <span className="truncate" style={{ color: colors.textDark }}>
                    {pickup.customer?.name ||
                      pickup.customerName ||
                      pickup.customer ||
                      "N/A"}
                  </span>
                  <span
                    className="whitespace-nowrap"
                    style={{ color: colors.textMuted }}
                  >
                    {pickup.time || pickup.pickupTime || "N/A"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardShell>

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Truck size={16} color={colors.seafoam} />
              Awaiting Delivery
            </span>
          </SectionTitle>
          {deliveries.length === 0 ? (
            <p
              className="text-sm py-4 text-center"
              style={{ color: colors.textMuted }}
            >
              Nothing out for delivery right now.
            </p>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery, index) => (
                <div
                  key={delivery.id || index}
                  className="flex items-center justify-between text-sm gap-3"
                >
                  <span className="truncate" style={{ color: colors.textDark }}>
                    {delivery.customer?.name ||
                      delivery.customerName ||
                      delivery.customer ||
                      "N/A"}
                  </span>
                  <span
                    className="whitespace-nowrap"
                    style={{ color: colors.textMuted }}
                  >
                    {delivery.time || delivery.deliveryTime || "N/A"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardShell>
      </div>

      {/* LOW INVENTORY / ATTENDANCE / REVENUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* LOW INVENTORY */}
        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              Low Stock Items
            </span>
          </SectionTitle>
          {inventory.length === 0 ? (
            <p
              className="text-sm py-4 text-center"
              style={{ color: colors.textMuted }}
            >
              All stock levels are healthy
            </p>
          ) : (
            <div className="space-y-3">
              {inventory.slice(0, 5).map((item, index) => {
                const level =
                  Number(item.currentStock || 0) /
                    Math.max(Number(item.minStock || 1), 1) *
                    100;
                return (
                  <div key={item.id || index}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span
                        className="truncate"
                        style={{ color: colors.textDark }}
                      >
                        {item.name}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.danger }}
                      >
                        {item.currentStock} {item.unit || ""}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: colors.cardTint }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(level, 100)}%`,
                          backgroundColor: colors.danger,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardShell>

        {/* STAFF SNAPSHOT */}
        <CardShell>
          <SectionTitle>Staff Snapshot</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {attendance.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl p-4 text-center"
                  style={{ backgroundColor: colors.cardTint }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: `${item.color}26` }}
                  >
                    <Icon size={15} color={item.color} />
                  </div>
                  <div
                    className="text-xl"
                    style={{
                      color: colors.textDark,
                      fontFamily: "'Libre Baskerville', serif",
                    }}
                  >
                    {item.value}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: colors.textMuted }}
                  >
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardShell>

        {/* REVENUE CHART */}
        <CardShell>
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3
              className="text-base sm:text-lg flex items-center gap-2"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              <TrendingUp size={17} color={colors.primaryTeal} />
              Revenue
            </h3>
            <div
              className="flex rounded-lg p-1"
              style={{ backgroundColor: colors.cardTint }}
            >
              {["Daily", "Weekly", "Monthly"].map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className="px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition"
                  style={{
                    backgroundColor:
                      period === item ? colors.primaryTeal : "transparent",
                    color: period === item ? "#FFFFFF" : colors.textMuted,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData[period]}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke={colors.cardBorder} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: colors.textMuted, fontSize: 12 }}
                  axisLine={{ stroke: colors.cardBorder }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: colors.textMuted, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    `₹${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`
                  }
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.bgDark,
                    border: "none",
                    borderRadius: 10,
                    color: "#FFFFFF",
                  }}
                  labelStyle={{ color: colors.mint }}
                  formatter={(value) => [formatCurrency(value), "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.primaryTeal}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: colors.mint }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardShell>
      </div>

      {/* RECENT PAYMENTS */}
      <CardShell className="mt-5">
        <SectionTitle
          action={
        <a    
              href="/admin/payments"
              className="flex items-center gap-2 text-xs font-medium"
              style={{ color: colors.primaryTeal }}
            >
              <Receipt size={14} />
              View all
            </a>
          }
        >
          Recent Payments
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-left" style={{ color: colors.textMuted }}>
                <th className="font-medium px-2 py-2">Invoice</th>
                <th className="font-medium px-2 py-2">Customer</th>
                <th className="font-medium px-2 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-2 py-8 text-center"
                    style={{ color: colors.textMuted }}
                  >
                    No recent payments found
                  </td>
                </tr>
              ) : (
                recentPayments.map((payment, index) => (
                  <tr
                    key={payment.id || index}
                    className="transition-colors hover:bg-[#EEF7F6]"
                    style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                  >
                    <td
                      className="px-2 py-3 font-medium"
                      style={{ color: colors.textDark }}
                    >
                      {payment.paymentNumber || `#${payment.id || index}`}
                    </td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                      {payment.customer?.name ||
                        payment.customerName ||
                        payment.customer ||
                        "N/A"}
                    </td>
                    <td
                      className="px-2 py-3"
                      style={{ color: colors.textDark }}
                    >
                      {formatCurrency(payment.amount || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardShell>
    </div>
  );
}