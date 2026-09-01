import React, { useEffect, useMemo, useState } from "react";
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
  Package,
  UserCheck,
  UserX,
  AlarmClock,
  Sparkles,
  Receipt,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getShopOrders, getOrderStats } from "../../api/orderApi";
import { getShopCustomers } from "../../api/customerApi";
import { taskApi } from "../../api/taskApi";
import { useEmployees } from "../../hooks/useEmployees";
import { formatINR } from "../../utils/orderStatus";
import { getAdminDashboard } from "../../api/adminDashboardApi";

const colors = {
  bgDark: "#05282A",
  panelDark: "#0B3B3E",
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
// ORDER STATUS LABEL
// =====================================================

const ORDER_STATUS_LABEL = {
  pending: "Pending",
  picked_up: "Pickup",
  processing: "Processing",
  ready_for_delivery: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// =====================================================
// STATUS STYLES
// =====================================================

const statusStyles = {
  Pending: { bg: "#D4A0171F", text: "#B8791F" },
  Pickup: { bg: "#D4A0171F", text: "#B8791F" },
  Processing: { bg: "#00A8961F", text: "#00A896" },
  Ready: { bg: "#02C39A1F", text: "#028090" },
  "Out for Delivery": { bg: "#0280901F", text: "#028090" },
  Delivered: { bg: "#0B6E631F", text: "#0B6E63" },
  Cancelled: { bg: "#E0645C1F", text: "#E0645C" },
};

// =====================================================
// FORMAT STATUS
// =====================================================

const formatStatus = (status) => {
  if (!status) return "Pending";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

// =====================================================
// BADGE
// =====================================================

const Badge = ({ status }) => {
  const formattedStatus = formatStatus(status);
  const s = statusStyles[formattedStatus] || statusStyles.Processing;

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
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
    style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
  >
    {children}
  </div>
);

// =====================================================
// SECTION TITLE
// =====================================================

const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h3
      className="text-base sm:text-lg"
      style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
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
  const { employees } = useEmployees();

  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("Daily");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch both local data and dashboard API data in parallel
        const [ordersRes, statsRes, customersRes, tasksData, dashRes] =
          await Promise.allSettled([
            getShopOrders(),
            getOrderStats(),
            getShopCustomers(),
            taskApi.getAllTasks().catch(() => []),
            getAdminDashboard(),
          ]);

        if (cancelled) return;

        setOrders(ordersRes.status === "fulfilled" ? ordersRes.value?.data || [] : []);
        setOrderStats(statsRes.status === "fulfilled" ? statsRes.value?.data || null : null);
        setCustomers(customersRes.status === "fulfilled" ? customersRes.value?.data || [] : []);
        setTasks(Array.isArray(tasksData.status === "fulfilled" ? tasksData.value : []) ? tasksData.value : []);
        setDashboard(dashRes.status === "fulfilled" ? dashRes.value?.data || dashRes.value : null);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const adminName = user?.name?.split(" ")[0] || "Admin";

  // ===================================================
  // COMPUTED DATA
  // ===================================================

  const byStatus = {};
  (orderStats?.byStatus || []).forEach((s) => { byStatus[s.status] = s.count; });

  const inProgressCount =
    (byStatus.picked_up || 0) +
    (byStatus.processing || 0) +
    (byStatus.ready_for_delivery || 0) +
    (byStatus.out_for_delivery || 0);

  const activeEmployees = employees.filter((e) => e.status === "active");
  const employeeNameById = new Map(employees.map((e) => [e.id, e.name]));

  // ===================================================
  // STAT CARDS — combine local + dashboard data
  // ===================================================

  const stats = [
    {
      label: "Total Orders",
      value: dashboard?.orders?.total ?? orderStats?.totalOrders ?? orders.length,
      delta: dashboard?.summary?.todayOrders
        ? `+${dashboard.summary.todayOrders} today`
        : `${byStatus.pending || 0} pending`,
      icon: ClipboardList,
      color: colors.primaryTeal,
    },
    {
      label: "Revenue",
      value: formatINR(
        dashboard?.summary?.totalRevenue ||
          orders.filter((o) => o.status === "delivered").reduce((s, o) => s + (Number(o.total_amount) || 0), 0)
      ),
      delta: dashboard?.summary?.todayRevenue
        ? `+${formatINR(dashboard.summary.todayRevenue)} today`
        : `${orders.length} orders`,
      icon: IndianRupee,
      color: colors.mint,
    },
    {
      label: "Customers",
      value: dashboard?.customers?.total ?? customers.length,
      delta: dashboard?.customers?.newToday
        ? `+${dashboard.customers.newToday} today`
        : `${customers.filter((c) => c.city).length} with city`,
      icon: Users,
      color: colors.seafoam,
    },
    {
      label: "Employees",
      value: dashboard?.business?.totalEmployees ?? employees.length,
      delta: `${dashboard?.business?.presentToday ?? activeEmployees.length} present`,
      icon: UserCog,
      color: colors.primaryTeal,
    },
  ];

  // ===================================================
  // ORDER STATUS DISTRIBUTION
  // ===================================================

  const orderStatus = [
    { label: "Pending", count: (dashboard?.orders?.pending ?? byStatus.pending) || 0, color: colors.amber },
    { label: "Processing", count: dashboard?.orders?.processing ?? inProgressCount, color: colors.seafoam },
    { label: "Ready", count: (dashboard?.orders?.ready ?? byStatus.ready_for_delivery) || 0, color: colors.mint },
    { label: "Delivered", count: (dashboard?.orders?.delivered ?? byStatus.delivered) || 0, color: "#0B6E63" },
    { label: "Cancelled", count: (dashboard?.orders?.cancelled ?? byStatus.cancelled) || 0, color: colors.danger },
  ];
  const maxStatus = Math.max(1, ...orderStatus.map((s) => s.count));

  // ===================================================
  // RECENT ORDERS
  // ===================================================

  const recentOrders = (dashboard?.recentOrders || orders).slice(0, 5).map((o) => ({
    id: o.id,
    customer: o.customer?.name || o.customerName || "—",
    employee: o.employee?.name || o.employeeName || employeeNameById.get(o.employee_id) || "—",
    amount: formatCurrency(o.total_amount || o.totalAmount || o.amount || 0),
    status: ORDER_STATUS_LABEL[o.status] || o.status,
  }));

  // ===================================================
  // EMPLOYEE TASKS
  // ===================================================

  const employeeTasks = (dashboard?.employeeTasks ||
    employees
      .map((e) => ({
        name: e.name,
        orders: tasks.filter((t) => t.employee_id === e.id && t.status !== "completed").length,
      }))
      .filter((e) => e.orders > 0)
      .sort((a, b) => b.orders - a.orders)
  ).slice(0, 4);
  const maxTasks = Math.max(1, ...employeeTasks.map((e) => Number(e.orders) || 0));

  // ===================================================
  // PICKUPS / DELIVERIES
  // ===================================================

  const pickups = dashboard?.pickups ||
    orders.filter((o) => o.status === "pending").slice(0, 4).map((o) => ({
      time: o.pickup_time || "—",
      customer: o.customer?.name || o.customerName || `#${o.id}`,
    }));

  const deliveries = dashboard?.deliveries ||
    orders.filter((o) => o.status === "ready_for_delivery" || o.status === "out_for_delivery")
      .slice(0, 4)
      .map((o) => ({
        time: o.delivery_date
          ? new Date(o.delivery_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "—",
        customer: o.customer?.name || o.customerName || `#${o.id}`,
      }));

  // ===================================================
  // LOW INVENTORY
  // ===================================================

  const inventory = dashboard?.lowStockItems || dashboard?.lowInventory || [];

  // ===================================================
  // ATTENDANCE
  // ===================================================

  const attendance = dashboard?.business
    ? [
        { label: "Present", value: dashboard.business.presentToday || 0, icon: UserCheck, color: colors.mint },
        { label: "Absent", value: dashboard.business.absentToday || 0, icon: UserX, color: colors.danger },
        { label: "Employees", value: dashboard.business.totalEmployees || 0, icon: UserCog, color: colors.primaryTeal },
      ]
    : [
        { label: "Active", value: activeEmployees.length, icon: UserCheck, color: colors.mint },
        { label: "Inactive", value: employees.length - activeEmployees.length, icon: UserX, color: colors.danger },
        { label: "With Tasks", value: employeeTasks.length, icon: AlarmClock, color: colors.amber },
      ];

  // ===================================================
  // REVENUE DATA
  // ===================================================

  const revenueData = useMemo(() => {
    // If dashboard API provides revenue data, use it
    if (dashboard?.revenue?.[period]) return dashboard.revenue[period];

    // Otherwise compute from orders
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ key: d.toDateString(), label: d.toLocaleDateString("en-US", { weekday: "short" }), value: 0 });
    }
    const byKey = new Map(days.map((d) => [d.key, d]));
    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      const d = new Date(o.createdAt);
      d.setHours(0, 0, 0, 0);
      const bucket = byKey.get(d.toDateString());
      if (bucket) bucket.value += Number(o.total_amount) || 0;
    });
    return days.map(({ label, value }) => ({ label, value }));
  }, [orders, dashboard, period]);

  // ===================================================
  // TOP SERVICES
  // ===================================================

  const topServices = dashboard?.topServices || dashboard?.charts?.topServices || [];

  // ===================================================
  // RECENT PAYMENTS
  // ===================================================

  const recentPayments = dashboard?.recentPayments ||
    dashboard?.recentTransactions ||
    orders.slice(0, 4).map((o) => ({
      invoice: `ORD-${o.id}`,
      customer: o.customer?.name || "—",
      amount: formatCurrency(o.total_amount || 0),
    }));

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-sm" style={{ color: colors.textMuted }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .row-hover:hover { background-color: ${colors.cardTint}; }
        .period-btn { transition: background-color 0.15s ease, color 0.15s ease; }
      `}</style>

      {/* GREETING HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <h2
          className="text-2xl sm:text-3xl flex items-center gap-2"
          style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
        >
          {greeting}, {adminName} <span>👋</span>
        </h2>
        <span className="text-sm" style={{ color: colors.textMuted }}>{today}</span>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <CardShell key={stat.label}>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${stat.color}1F` }}>
                <stat.icon size={18} color={stat.color} />
              </div>
              <span className="text-xs font-medium" style={{ color: colors.seafoam }}>{stat.delta}</span>
            </div>
            <div className="mt-4 text-2xl sm:text-3xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              {stat.value}
            </div>
            <div className="mt-1 text-xs sm:text-sm" style={{ color: colors.textMuted }}>{stat.label}</div>
          </CardShell>
        ))}
      </div>

      {/* ORDER STATUS */}
      <CardShell className="mt-5">
        <SectionTitle>Order Status</SectionTitle>
        <div className="space-y-3">
          {orderStatus.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <span className="w-24 text-sm flex-shrink-0" style={{ color: colors.textDark }}>{s.label}</span>
              <div className="flex-1 h-2.5 rounded-full" style={{ backgroundColor: colors.cardTint }}>
                <div className="h-2.5 rounded-full transition-all" style={{ width: `${(s.count / maxStatus) * 100}%`, backgroundColor: s.color }} />
              </div>
              <span className="w-8 text-sm text-right font-medium flex-shrink-0" style={{ color: colors.textDark }}>{s.count}</span>
            </div>
          ))}
        </div>
      </CardShell>

      {/* RECENT ORDERS */}
      <CardShell className="mt-5">
        <SectionTitle
          action={
            <a href="/admin/orders" className="flex items-center gap-1 text-xs font-medium" style={{ color: colors.primaryTeal }}>
              View all <ArrowUpRight size={13} />
            </a>
          }
        >
          Recent Orders
        </SectionTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr style={{ color: colors.textMuted }} className="text-left">
                <th className="font-medium px-2 py-2">Order ID</th>
                <th className="font-medium px-2 py-2">Customer</th>
                <th className="font-medium px-2 py-2">Employee</th>
                <th className="font-medium px-2 py-2">Amount</th>
                <th className="font-medium px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((o) => (
                  <tr key={o.id} className="row-hover transition-colors" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                    <td className="px-2 py-3 font-medium" style={{ color: colors.textDark }}>#{o.id}</td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>{o.customer}</td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>{o.employee}</td>
                    <td className="px-2 py-3" style={{ color: colors.textDark }}>{o.amount}</td>
                    <td className="px-2 py-3"><Badge status={o.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-2 py-8 text-center" style={{ color: colors.textMuted }}>No recent orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardShell>

      {/* EMPLOYEE TASKS / PICKUPS / DELIVERIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* EMPLOYEE TASKS */}
        <CardShell>
          <SectionTitle>Employee Tasks</SectionTitle>
          <div className="space-y-3">
            {employeeTasks.length > 0 ? (
              employeeTasks.map((e) => (
                <div key={e.name} className="flex items-center gap-3">
                  <span className="w-14 text-sm flex-shrink-0" style={{ color: colors.textDark }}>{e.name}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: colors.cardTint }}>
                    <div className="h-2 rounded-full" style={{ width: `${((Number(e.orders) || 0) / maxTasks) * 100}%`, backgroundColor: colors.primaryTeal }} />
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: colors.textMuted }}>{e.orders || 0} orders</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>No employee tasks found</p>
            )}
          </div>
        </CardShell>

        {/* PICKUPS */}
        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Clock size={16} color={colors.primaryTeal} /> Today's Pickups
            </span>
          </SectionTitle>
          <div className="space-y-3">
            {pickups.length > 0 ? (
              pickups.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: colors.textDark }}>{p.customer}</span>
                  <span style={{ color: colors.textMuted }}>{p.time}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>No pickups today</p>
            )}
          </div>
        </CardShell>

        {/* DELIVERIES */}
        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Truck size={16} color={colors.seafoam} /> Today's Deliveries
            </span>
          </SectionTitle>
          <div className="space-y-3">
            {deliveries.length > 0 ? (
              deliveries.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: colors.textDark }}>{d.customer}</span>
                  <span style={{ color: colors.textMuted }}>{d.time}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>No deliveries today</p>
            )}
          </div>
        </CardShell>
      </div>

      {/* LOW INVENTORY / ATTENDANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* LOW INVENTORY */}
        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Package size={16} color={colors.danger} /> Low Inventory
            </span>
          </SectionTitle>
          <div className="space-y-4">
            {inventory.length > 0 ? (
              inventory.map((item, index) => {
                const level = Number(item.level ?? item.stockPercentage ?? item.quantity ?? 0);
                const maxStock = Number(item.maximumStock ?? item.quantity ?? 1);
                const pct = Math.min((level / maxStock) * 100, 100);
                const itemName = item.name || item.itemName || "Unknown Item";
                const quantity = item.qty || item.quantity || item.currentStock || 0;

                return (
                  <div key={item.id || index}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span style={{ color: colors.textDark }}>{itemName}</span>
                      <span className="font-medium" style={{ color: colors.danger }}>{quantity}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: colors.cardTint }}>
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: colors.danger }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>No low inventory items</p>
            )}
          </div>
        </CardShell>

        {/* ATTENDANCE */}
        <CardShell>
          <SectionTitle>Attendance</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {attendance.map((a) => (
              <div key={a.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: colors.cardTint }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${a.color}26` }}>
                  <a.icon size={15} color={a.color} />
                </div>
                <div className="text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>{a.value}</div>
                <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{a.label}</div>
              </div>
            ))}
          </div>
        </CardShell>
      </div>

      {/* REVENUE / TOP SERVICES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* REVENUE CHART */}
        <CardShell className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base sm:text-lg flex items-center gap-2" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              <TrendingUp size={17} color={colors.primaryTeal} /> Revenue
            </h3>
            <div className="flex rounded-lg p-1" style={{ backgroundColor: colors.cardTint }}>
              {["Daily", "Weekly", "Monthly"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="period-btn px-3 py-1 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: period === p ? colors.primaryTeal : "transparent",
                    color: period === p ? "#FFFFFF" : colors.textMuted,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 sm:h-72 -ml-2 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={colors.cardBorder} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: colors.textMuted, fontSize: 12 }} axisLine={{ stroke: colors.cardBorder }} tickLine={false} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} width={48} />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.bgDark, border: "none", borderRadius: 10, color: "#FFFFFF" }}
                  labelStyle={{ color: colors.mint }}
                  formatter={(v) => [formatCurrency(v), "Revenue"]}
                />
                <Line type="monotone" dataKey="value" stroke={colors.primaryTeal} strokeWidth={2.5} dot={{ r: 3, fill: colors.mint }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardShell>

        {/* TOP SERVICES */}
        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Sparkles size={16} color={colors.mint} /> Top Services
            </span>
          </SectionTitle>
          <div className="space-y-4">
            {topServices.length > 0 ? (
              topServices.map((s, i) => {
                const percentage = Number(s.pct ?? s.percentage ?? 0);
                return (
                  <div key={s.id || s.name || i}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span style={{ color: colors.textDark }}>{i + 1}. {s.name || s.serviceName || "Unknown"}</span>
                      <span style={{ color: colors.textMuted }}>{percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: colors.cardTint }}>
                      <div className="h-2 rounded-full" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: colors.seafoam }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-center py-4" style={{ color: colors.textMuted }}>No service data found</p>
            )}
          </div>
        </CardShell>
      </div>

      {/* RECENT PAYMENTS */}
      <CardShell className="mt-5">
        <SectionTitle
          action={
            <a href="/admin/payments" className="flex items-center gap-2 text-xs font-medium" style={{ color: colors.primaryTeal }}>
              <Receipt size={14} /> View all
            </a>
          }
        >
          Recent Payments
        </SectionTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr style={{ color: colors.textMuted }} className="text-left">
                <th className="font-medium px-2 py-2">Order</th>
                <th className="font-medium px-2 py-2">Customer</th>
                <th className="font-medium px-2 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length > 0 ? (
                recentPayments.map((p, index) => (
                  <tr key={p.id || p.invoice || index} className="row-hover transition-colors" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                    <td className="px-2 py-3 font-medium" style={{ color: colors.textDark }}>{p.invoice || `#${p.id}`}</td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>{p.customer}</td>
                    <td className="px-2 py-3" style={{ color: colors.textDark }}>{typeof p.amount === "string" ? p.amount : formatCurrency(p.amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-2 py-8 text-center" style={{ color: colors.textMuted }}>No recent payments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardShell>
    </div>
  );
}