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

const ORDER_STATUS_LABEL = {
  pending: "Pending",
  picked_up: "Pickup",
  processing: "Processing",
  ready_for_delivery: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusStyles = {
  Pending: { bg: "#D4A0171F", text: "#B8791F" },
  Pickup: { bg: "#D4A0171F", text: "#B8791F" },
  Processing: { bg: "#00A8961F", text: "#00A896" },
  Ready: { bg: "#02C39A1F", text: "#028090" },
  "Out for Delivery": { bg: "#0280901F", text: "#028090" },
  Delivered: { bg: "#0B6E631F", text: "#0B6E63" },
  Cancelled: { bg: "#E0645C1F", text: "#E0645C" },
};

const Badge = ({ status }) => {
  const s = statusStyles[status] || statusStyles.Processing;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
};

const CardShell = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border p-5 sm:p-6 ${className}`}
    style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
  >
    {children}
  </div>
);

const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between mb-4">
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

export default function ShopDashboard() {
  const { user } = useAuth();
  const { employees } = useEmployees();

  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ordersRes, statsRes, customersRes, tasksData] = await Promise.all([
          getShopOrders(),
          getOrderStats(),
          getShopCustomers(),
          taskApi.getAllTasks().catch(() => []),
        ]);
        if (cancelled) return;
        setOrders(ordersRes?.data || []);
        setOrderStats(statsRes?.data || null);
        setCustomers(customersRes?.data || []);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byStatus = {};
  (orderStats?.byStatus || []).forEach((s) => {
    byStatus[s.status] = s.count;
  });

  const inProgressCount =
    (byStatus.picked_up || 0) +
    (byStatus.processing || 0) +
    (byStatus.ready_for_delivery || 0) +
    (byStatus.out_for_delivery || 0);

  const activeEmployees = employees.filter((e) => e.status === "active");
  const employeeNameById = new Map(employees.map((e) => [e.id, e.name]));

  // ---- Stat cards (real data) ----
  const stats = [
    {
      label: "Total Orders",
      value: orderStats?.totalOrders ?? orders.length,
      delta: `${byStatus.pending || 0} pending`,
      icon: ClipboardList,
      color: colors.primaryTeal,
    },
    {
      label: "Revenue (delivered)",
      value: formatINR(
        orders
          .filter((o) => o.status === "delivered")
          .reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
      ),
      delta: `${orders.length} orders`,
      icon: IndianRupee,
      color: colors.mint,
    },
    {
      label: "Customers",
      value: customers.length,
      delta: `${customers.filter((c) => c.city).length} with city`,
      icon: Users,
      color: colors.seafoam,
    },
    {
      label: "Employees",
      value: employees.length,
      delta: `${activeEmployees.length} active`,
      icon: UserCog,
      color: colors.primaryTeal,
    },
  ];

  // ---- Order status distribution ----
  const orderStatus = [
    { label: "Pending", count: byStatus.pending || 0, color: colors.amber },
    { label: "Processing", count: inProgressCount, color: colors.seafoam },
    { label: "Ready", count: byStatus.ready_for_delivery || 0, color: colors.mint },
    { label: "Delivered", count: byStatus.delivered || 0, color: "#0B6E63" },
    { label: "Cancelled", count: byStatus.cancelled || 0, color: colors.danger },
  ];
  const maxStatus = Math.max(1, ...orderStatus.map((s) => s.count));

  // ---- Recent orders (real) ----
  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: `#${o.id}`,
    customer: o.customer?.name || "—",
    employee: employeeNameById.get(o.employee_id) || "—",
    amount: formatINR(o.total_amount),
    status: ORDER_STATUS_LABEL[o.status] || o.status,
  }));

  // ---- Employee tasks (real) ----
  const employeeTasks = employees
    .map((e) => ({
      name: e.name,
      orders: tasks.filter((t) => t.employee_id === e.id && t.status !== "completed").length,
    }))
    .filter((e) => e.orders > 0)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 4);
  const maxTasks = Math.max(1, ...employeeTasks.map((e) => e.orders));

  // ---- Today's pickups / deliveries (real) ----
  const pickups = orders
    .filter((o) => o.status === "pending")
    .slice(0, 4)
    .map((o) => ({ time: o.pickup_time || "—", customer: o.customer?.name || `#${o.id}` }));

  const deliveries = orders
    .filter((o) => o.status === "ready_for_delivery" || o.status === "out_for_delivery")
    .slice(0, 4)
    .map((o) => ({ time: o.delivery_date ? new Date(o.delivery_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—", customer: o.customer?.name || `#${o.id}` }));

  // ---- Recent payments (real orders) ----
  const recentPayments = orders.slice(0, 4).map((o) => ({
    invoice: `ORD-${o.id}`,
    customer: o.customer?.name || "—",
    amount: formatINR(o.total_amount),
  }));

  // ---- Revenue (last 7 days from real orders) ----
  const revenueData = useMemo(() => {
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
  }, [orders]);

  const attendance = [
    { label: "Active", value: activeEmployees.length, icon: UserCheck, color: colors.mint },
    { label: "Inactive", value: employees.length - activeEmployees.length, icon: UserX, color: colors.danger },
    { label: "With Tasks", value: employeeTasks.length, icon: AlarmClock, color: colors.amber },
  ];

  const [period, setPeriod] = useState("Daily");

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

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .row-hover:hover { background-color: ${colors.cardTint}; }
        .period-btn { transition: background-color 0.15s ease, color 0.15s ease; }
      `}</style>

      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <h2
          className="text-2xl sm:text-3xl flex items-center gap-2"
          style={{
            color: colors.textDark,
            fontFamily: "'Libre Baskerville', serif",
          }}
        >
          {greeting}, {adminName} <span>👋</span>
        </h2>
        <span className="text-sm" style={{ color: colors.textMuted }}>
          {today}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <CardShell key={stat.label}>
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}1F` }}
              >
                <stat.icon size={18} color={stat.color} />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: colors.seafoam }}
              >
                {loading ? "…" : stat.delta}
              </span>
            </div>
            <div
              className="mt-4 text-2xl sm:text-3xl"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              {loading ? "—" : stat.value}
            </div>
            <div
              className="mt-1 text-xs sm:text-sm"
              style={{ color: colors.textMuted }}
            >
              {stat.label}
            </div>
          </CardShell>
        ))}
      </div>

      {/* Order Status */}
      <CardShell className="mt-5">
        <SectionTitle>Order Status</SectionTitle>
        <div className="space-y-3">
          {orderStatus.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <span
                className="w-24 text-sm flex-shrink-0"
                style={{ color: colors.textDark }}
              >
                {s.label}
              </span>
              <div
                className="flex-1 h-2.5 rounded-full"
                style={{ backgroundColor: colors.cardTint }}
              >
                <div
                  className="h-2.5 rounded-full transition-all"
                  style={{
                    width: `${(s.count / maxStatus) * 100}%`,
                    backgroundColor: s.color,
                  }}
                />
              </div>
              <span
                className="w-8 text-sm text-right font-medium flex-shrink-0"
                style={{ color: colors.textDark }}
              >
                {s.count}
              </span>
            </div>
          ))}
        </div>
      </CardShell>

      {/* Recent Orders */}
      <CardShell className="mt-5">
        <SectionTitle
          action={
            <a
              href="#"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: colors.primaryTeal }}
            >
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
              {recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-8 text-center text-sm"
                    style={{ color: colors.textMuted }}
                  >
                    No orders yet — they will appear here as customers place them.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="row-hover transition-colors"
                    style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                  >
                    <td
                      className="px-2 py-3 font-medium"
                      style={{ color: colors.textDark }}
                    >
                      {o.id}
                    </td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                      {o.customer}
                    </td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                      {o.employee}
                    </td>
                    <td className="px-2 py-3" style={{ color: colors.textDark }}>
                      {o.amount}
                    </td>
                    <td className="px-2 py-3">
                      <Badge status={o.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardShell>

      {/* Employee Tasks | Pickups | Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <CardShell>
          <SectionTitle>Employee Tasks</SectionTitle>
          {employeeTasks.length === 0 ? (
            <p className="text-sm" style={{ color: colors.textMuted }}>
              No tasks in progress — assign tasks to see workload here.
            </p>
          ) : (
            <div className="space-y-3">
              {employeeTasks.map((e) => (
                <div key={e.name} className="flex items-center gap-3">
                  <span
                    className="w-14 text-sm flex-shrink-0"
                    style={{ color: colors.textDark }}
                  >
                    {e.name}
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full"
                    style={{ backgroundColor: colors.cardTint }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(e.orders / maxTasks) * 100}%`,
                        backgroundColor: colors.primaryTeal,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: colors.textMuted }}
                  >
                    {e.orders} tasks
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardShell>

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Clock size={16} color={colors.primaryTeal} /> Pending Pickups
            </span>
          </SectionTitle>
          {pickups.length === 0 ? (
            <p className="text-sm" style={{ color: colors.textMuted }}>
              No pending pickups. 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {pickups.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span style={{ color: colors.textDark }}>{p.customer}</span>
                  <span style={{ color: colors.textMuted }}>{p.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardShell>

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Truck size={16} color={colors.seafoam} /> Awaiting Delivery
            </span>
          </SectionTitle>
          {deliveries.length === 0 ? (
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Nothing out for delivery right now.
            </p>
          ) : (
            <div className="space-y-3">
              {deliveries.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span style={{ color: colors.textDark }}>{d.customer}</span>
                  <span style={{ color: colors.textMuted }}>{d.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardShell>
      </div>

      {/* Staff snapshot | Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <CardShell>
          <SectionTitle>Staff Snapshot</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {attendance.map((a) => (
              <div
                key={a.label}
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: colors.cardTint }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: `${a.color}26` }}
                >
                  <a.icon size={15} color={a.color} />
                </div>
                <div
                  className="text-xl"
                  style={{
                    color: colors.textDark,
                    fontFamily: "'Libre Baskerville', serif",
                  }}
                >
                  {a.value}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: colors.textMuted }}
                >
                  {a.label}
                </div>
              </div>
            ))}
          </div>
        </CardShell>

        <CardShell>
          <div className="flex items-center justify-between mb-1">
            <h3
              className="text-base sm:text-lg flex items-center gap-2"
              style={{
                color: colors.textDark,
                fontFamily: "'Libre Baskerville', serif",
              }}
            >
              <TrendingUp size={17} color={colors.primaryTeal} /> Revenue
            </h3>
            <div
              className="flex rounded-lg p-1"
              style={{ backgroundColor: colors.cardTint }}
            >
              {["Daily", "Weekly", "Monthly"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="period-btn px-3 py-1 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor:
                      period === p ? colors.primaryTeal : "transparent",
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
              <LineChart
                data={revenueData}
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
                  tickFormatter={(v) =>
                    `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`
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
                  formatter={(v) => [
                    `₹${Number(v).toLocaleString("en-IN")}`,
                    "Revenue",
                  ]}
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
          <p className="mt-2 text-[11px]" style={{ color: colors.textMuted }}>
            Last 7 days, from real orders.
          </p>
        </CardShell>
      </div>

      {/* Recent Payments */}
      <CardShell className="mt-5">
        <SectionTitle
          action={
            <span
              className="flex items-center gap-2 text-xs font-medium"
              style={{ color: colors.primaryTeal }}
            >
              <Receipt size={14} /> View all
            </span>
          }
        >
          Recent Orders (payments)
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
              {recentPayments.map((p) => (
                <tr
                  key={p.invoice}
                  className="row-hover transition-colors"
                  style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                >
                  <td
                    className="px-2 py-3 font-medium"
                    style={{ color: colors.textDark }}
                  >
                    {p.invoice}
                  </td>
                  <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                    {p.customer}
                  </td>
                  <td className="px-2 py-3" style={{ color: colors.textDark }}>
                    {p.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardShell>
    </div>
  );
}
