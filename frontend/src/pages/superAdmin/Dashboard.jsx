import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Store,
  CheckCircle2,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
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
};

// ---- mock data (swap with real API data) ----
const stats = [
  { label: "Total Shops", value: "248", delta: "+8.2%", trend: "up", icon: Store, color: colors.primaryTeal },
  { label: "Active Shops", value: "216", delta: "+4.1%", trend: "up", icon: CheckCircle2, color: colors.seafoam },
  { label: "Revenue (MTD)", value: "\u20B94,82,600", delta: "+12.6%", trend: "up", icon: IndianRupee, color: colors.mint },
  { label: "Expired", value: "17", delta: "-2.3%", trend: "down", icon: AlertTriangle, color: colors.danger },
];

const revenueData = [
  { month: "Feb", revenue: 285000 },
  { month: "Mar", revenue: 312000 },
  { month: "Apr", revenue: 298000 },
  { month: "May", revenue: 351000 },
  { month: "Jun", revenue: 402000 },
  { month: "Jul", revenue: 438000 },
  { month: "Aug", revenue: 482600 },
];

const subscriptionData = [
  { name: "Active", value: 216, color: colors.mint },
  { name: "Trial", value: 15, color: colors.seafoam },
  { name: "Expired", value: 17, color: colors.danger },
];

const recentShops = [
  { name: "Sparkle Laundry Co.", owner: "Rohit Sharma", city: "Noida", status: "Active", joined: "28 Jul 2026" },
  { name: "CleanWave Services", owner: "Priya Nair", city: "Bengaluru", status: "Active", joined: "26 Jul 2026" },
  { name: "FreshFold Express", owner: "Aman Verma", city: "Pune", status: "Trial", joined: "24 Jul 2026" },
  { name: "QuickWash Hub", owner: "Sana Sheikh", city: "Delhi", status: "Expired", joined: "19 Jul 2026" },
  { name: "Urban Laundry", owner: "Vikram Rao", city: "Hyderabad", status: "Active", joined: "17 Jul 2026" },
];

const recentPayments = [
  { shop: "Sparkle Laundry Co.", amount: "\u20B92,499", method: "UPI", status: "Paid", date: "31 Jul 2026" },
  { shop: "CleanWave Services", amount: "\u20B94,999", method: "Card", status: "Paid", date: "30 Jul 2026" },
  { shop: "FreshFold Express", amount: "\u20B91,999", method: "UPI", status: "Pending", date: "29 Jul 2026" },
  { shop: "QuickWash Hub", amount: "\u20B92,499", method: "Card", status: "Failed", date: "27 Jul 2026" },
  { shop: "Urban Laundry", amount: "\u20B94,999", method: "Netbanking", status: "Paid", date: "25 Jul 2026" },
];

const statusStyles = {
  Active: { bg: "#02C39A1F", text: "#028090" },
  Trial: { bg: "#00A8961F", text: "#00A896" },
  Expired: { bg: "#E0645C1F", text: "#E0645C" },
  Paid: { bg: "#02C39A1F", text: "#028090" },
  Pending: { bg: "#F2A93B1F", text: "#B8791F" },
  Failed: { bg: "#E0645C1F", text: "#E0645C" },
};

const Badge = ({ status }) => {
  const s = statusStyles[status] || statusStyles.Active;
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

const SectionTitle = ({ children }) => (
  <h3
    className="text-base sm:text-lg mb-4"
    style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
  >
    {children}
  </h3>
);

export default function Dashboard() {
  const totalSubs = subscriptionData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .row-hover:hover { background-color: ${colors.cardTint}; }
      `}</style>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <CardShell key={stat.label}>
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}1F` }}
              >
                <stat.icon size={18} color={stat.color} />
              </div>
              <span
                className="flex items-center gap-0.5 text-xs font-medium"
                style={{ color: stat.trend === "up" ? colors.seafoam : colors.danger }}
              >
                {stat.trend === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {stat.delta}
              </span>
            </div>
            <div
              className="mt-4 text-2xl sm:text-3xl"
              style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
            >
              {stat.value}
            </div>
            <div className="mt-1 text-xs sm:text-sm" style={{ color: colors.textMuted }}>
              {stat.label}
            </div>
          </CardShell>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <CardShell className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <SectionTitle>Revenue</SectionTitle>
            <span className="text-xs" style={{ color: colors.textMuted }}>
              Last 7 months
            </span>
          </div>
          <div className="h-64 sm:h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.primaryTeal} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={colors.primaryTeal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={colors.cardBorder} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: colors.textMuted, fontSize: 12 }}
                  axisLine={{ stroke: colors.cardBorder }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: colors.textMuted, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `\u20B9${v / 1000}k`}
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
                  formatter={(v) => [`\u20B9${v.toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={colors.primaryTeal}
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardShell>

        <CardShell>
          <SectionTitle>Subscriptions</SectionTitle>
          <div className="h-40 sm:h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="65%"
                  outerRadius="100%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {subscriptionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.bgDark,
                    border: "none",
                    borderRadius: 10,
                    color: "#FFFFFF",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-2xl"
                style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
              >
                {totalSubs}
              </span>
              <span className="text-[11px]" style={{ color: colors.textMuted }}>
                Total shops
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {subscriptionData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2" style={{ color: colors.textDark }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span style={{ color: colors.textMuted }}>{d.value}</span>
              </div>
            ))}
          </div>
        </CardShell>
      </div>

      {/* Recent Shops */}
      <CardShell className="mt-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Recent Shops</SectionTitle>
          <a
            href="#"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: colors.primaryTeal }}
          >
            View all <ArrowUpRight size={13} />
          </a>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr style={{ color: colors.textMuted }} className="text-left">
                <th className="font-medium px-2 py-2">Shop</th>
                <th className="font-medium px-2 py-2">Owner</th>
                <th className="font-medium px-2 py-2">City</th>
                <th className="font-medium px-2 py-2">Status</th>
                <th className="font-medium px-2 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentShops.map((shop) => (
                <tr
                  key={shop.name}
                  className="row-hover transition-colors"
                  style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                >
                  <td className="px-2 py-3 font-medium" style={{ color: colors.textDark }}>
                    {shop.name}
                  </td>
                  <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                    {shop.owner}
                  </td>
                  <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                    {shop.city}
                  </td>
                  <td className="px-2 py-3">
                    <Badge status={shop.status} />
                  </td>
                  <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                    {shop.joined}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardShell>

      {/* Recent Payments */}
      <CardShell className="mt-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Recent Payments</SectionTitle>
          <a
            href="#"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: colors.primaryTeal }}
          >
            View all <ArrowUpRight size={13} />
          </a>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr style={{ color: colors.textMuted }} className="text-left">
                <th className="font-medium px-2 py-2">Shop</th>
                <th className="font-medium px-2 py-2">Amount</th>
                <th className="font-medium px-2 py-2">Method</th>
                <th className="font-medium px-2 py-2">Status</th>
                <th className="font-medium px-2 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p, i) => (
                <tr
                  key={`${p.shop}-${i}`}
                  className="row-hover transition-colors"
                  style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                >
                  <td className="px-2 py-3 font-medium" style={{ color: colors.textDark }}>
                    {p.shop}
                  </td>
                  <td className="px-2 py-3" style={{ color: colors.textDark }}>
                    {p.amount}
                  </td>
                  <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                    {p.method}
                  </td>
                  <td className="px-2 py-3">
                    <Badge status={p.status} />
                  </td>
                  <td className="px-2 py-3" style={{ color: colors.textMuted }}>
                    {p.date}
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