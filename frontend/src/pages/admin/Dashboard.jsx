import React, { useState } from "react";
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

// ---- mock data (swap with real API data) ----
const stats = [
  {
    label: "Today's Orders",
    value: "77",
    delta: "+6",
    icon: ClipboardList,
    color: colors.primaryTeal,
  },
  {
    label: "Revenue",
    value: "\u20B912,450",
    delta: "+9.4%",
    icon: IndianRupee,
    color: colors.mint,
  },
  {
    label: "Customers",
    value: "58",
    delta: "+3",
    icon: Users,
    color: colors.seafoam,
  },
  {
    label: "Employees",
    value: "15",
    delta: "12 present",
    icon: UserCog,
    color: colors.primaryTeal,
  },
];

const orderStatus = [
  { label: "New", count: 12, color: colors.primaryTeal },
  { label: "Processing", count: 18, color: colors.seafoam },
  { label: "Ready", count: 10, color: colors.mint },
  { label: "Delivered", count: 35, color: "#0B6E63" },
  { label: "Cancelled", count: 2, color: colors.danger },
];
const maxStatus = Math.max(...orderStatus.map((s) => s.count));

const recentOrders = [
  {
    id: "#1001",
    customer: "Amit",
    employee: "Rahul",
    amount: "\u20B9450",
    status: "Processing",
  },
  {
    id: "#1002",
    customer: "Ravi",
    employee: "Neha",
    amount: "\u20B9300",
    status: "Ready",
  },
  {
    id: "#1003",
    customer: "Ajay",
    employee: "Mohit",
    amount: "\u20B9700",
    status: "Pickup",
  },
  {
    id: "#1004",
    customer: "Simran",
    employee: "Priya",
    amount: "\u20B9520",
    status: "Delivered",
  },
];

const employeeTasks = [
  { name: "Rahul", orders: 8 },
  { name: "Neha", orders: 5 },
  { name: "Mohit", orders: 10 },
  { name: "Priya", orders: 6 },
];
const maxTasks = Math.max(...employeeTasks.map((e) => e.orders));

const pickups = [
  { time: "10:00 AM", customer: "Amit" },
  { time: "11:30 AM", customer: "Rahul" },
  { time: "1:00 PM", customer: "Mohit" },
];

const deliveries = [
  { time: "2:00 PM", customer: "Ravi" },
  { time: "4:00 PM", customer: "Simran" },
  { time: "6:00 PM", customer: "Ajay" },
];

const inventory = [
  { item: "Detergent", qty: "5 Kg", level: 25, low: true },
  { item: "Laundry Bags", qty: "12", level: 40, low: true },
  { item: "Softener", qty: "2 L", level: 15, low: true },
];

const attendance = [
  { label: "Present", value: 12, icon: UserCheck, color: colors.mint },
  { label: "Absent", value: 2, icon: UserX, color: colors.danger },
  { label: "Late", value: 1, icon: AlarmClock, color: colors.amber },
];

const revenueData = {
  Daily: [
    { label: "Mon", value: 8200 },
    { label: "Tue", value: 9100 },
    { label: "Wed", value: 7600 },
    { label: "Thu", value: 10400 },
    { label: "Fri", value: 11800 },
    { label: "Sat", value: 13200 },
    { label: "Sun", value: 12450 },
  ],
  Weekly: [
    { label: "W1", value: 58000 },
    { label: "W2", value: 62500 },
    { label: "W3", value: 59800 },
    { label: "W4", value: 68200 },
  ],
  Monthly: [
    { label: "Apr", value: 248000 },
    { label: "May", value: 271000 },
    { label: "Jun", value: 265500 },
    { label: "Jul", value: 298000 },
    { label: "Aug", value: 312450 },
  ],
};

const topServices = [
  { name: "Wash & Fold", pct: 38 },
  { name: "Dry Cleaning", pct: 27 },
  { name: "Ironing", pct: 21 },
  { name: "Steam Press", pct: 14 },
];

const recentPayments = [
  { invoice: "INV001", customer: "Amit", amount: "\u20B9500" },
  { invoice: "INV002", customer: "Rahul", amount: "\u20B9300" },
  { invoice: "INV003", customer: "Neha", amount: "\u20B9750" },
];

const statusStyles = {
  Processing: { bg: "#00A8961F", text: "#00A896" },
  Ready: { bg: "#02C39A1F", text: "#028090" },
  Pickup: { bg: "#D4A0171F", text: "#B8791F" },
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

export default function ShopDashboard({ employeeName = "Rahul" }) {
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
          {greeting}, {employeeName} <span>👋</span>
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
              {recentOrders.map((o) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </CardShell>

      {/* Employee Tasks | Pickups | Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <CardShell>
          <SectionTitle>Employee Tasks</SectionTitle>
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
                  {e.orders} orders
                </span>
              </div>
            ))}
          </div>
        </CardShell>

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Clock size={16} color={colors.primaryTeal} /> Today's Pickups
            </span>
          </SectionTitle>
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
        </CardShell>

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Truck size={16} color={colors.seafoam} /> Today's Deliveries
            </span>
          </SectionTitle>
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
        </CardShell>
      </div>

      {/* Low Inventory | Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Package size={16} color={colors.danger} /> Low Inventory
            </span>
          </SectionTitle>
          <div className="space-y-4">
            {inventory.map((item) => (
              <div key={item.item}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span style={{ color: colors.textDark }}>{item.item}</span>
                  <span
                    className="font-medium"
                    style={{
                      color: item.low ? colors.danger : colors.textDark,
                    }}
                  >
                    {item.qty}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: colors.cardTint }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${item.level}%`,
                      backgroundColor: item.low ? colors.danger : colors.mint,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardShell>

        <CardShell>
          <SectionTitle>Attendance</SectionTitle>
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
      </div>

      {/* Revenue Chart | Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <CardShell className="lg:col-span-2">
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
                  tickFormatter={(v) =>
                    `\u20B9${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`
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
                    `\u20B9${v.toLocaleString("en-IN")}`,
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
        </CardShell>

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Sparkles size={16} color={colors.mint} /> Top Services
            </span>
          </SectionTitle>
          <div className="space-y-4">
            {topServices.map((s, i) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span style={{ color: colors.textDark }}>
                    {i + 1}. {s.name}
                  </span>
                  <span style={{ color: colors.textMuted }}>{s.pct}%</span>
                </div>
                <div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: colors.cardTint }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${s.pct}%`,
                      backgroundColor: colors.seafoam,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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
          Recent Payments
        </SectionTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr style={{ color: colors.textMuted }} className="text-left">
                <th className="font-medium px-2 py-2">Invoice</th>
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
