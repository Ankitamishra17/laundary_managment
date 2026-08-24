// import React from "react";
// import {
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
// import {
//   Store,
//   CheckCircle2,
//   IndianRupee,
//   AlertTriangle,
//   TrendingUp,
//   TrendingDown,
//   ArrowUpRight,
// } from "lucide-react";

// const colors = {
//   bgDark: "#05282A",
//   panelDark: "#0B3B3E",
//   primaryTeal: "#028090",
//   seafoam: "#00A896",
//   mint: "#02C39A",
//   bgLight: "#FFFFFF",
//   cardTint: "#EEF7F6",
//   cardBorder: "#D8ECEA",
//   textDark: "#0F2C2E",
//   textMuted: "#5C7A78",
//   danger: "#E0645C",
// };

// // ---- mock data (swap with real API data) ----
// const stats = [
//   { label: "Total Shops", value: "248", delta: "+8.2%", trend: "up", icon: Store, color: colors.primaryTeal },
//   { label: "Active Shops", value: "216", delta: "+4.1%", trend: "up", icon: CheckCircle2, color: colors.seafoam },
//   { label: "Revenue (MTD)", value: "\u20B94,82,600", delta: "+12.6%", trend: "up", icon: IndianRupee, color: colors.mint },
//   { label: "Expired", value: "17", delta: "-2.3%", trend: "down", icon: AlertTriangle, color: colors.danger },
// ];

// const revenueData = [
//   { month: "Feb", revenue: 285000 },
//   { month: "Mar", revenue: 312000 },
//   { month: "Apr", revenue: 298000 },
//   { month: "May", revenue: 351000 },
//   { month: "Jun", revenue: 402000 },
//   { month: "Jul", revenue: 438000 },
//   { month: "Aug", revenue: 482600 },
// ];

// const subscriptionData = [
//   { name: "Active", value: 216, color: colors.mint },
//   { name: "Trial", value: 15, color: colors.seafoam },
//   { name: "Expired", value: 17, color: colors.danger },
// ];

// const recentShops = [
//   { name: "Sparkle Laundry Co.", owner: "Rohit Sharma", city: "Noida", status: "Active", joined: "28 Jul 2026" },
//   { name: "CleanWave Services", owner: "Priya Nair", city: "Bengaluru", status: "Active", joined: "26 Jul 2026" },
//   { name: "FreshFold Express", owner: "Aman Verma", city: "Pune", status: "Trial", joined: "24 Jul 2026" },
//   { name: "QuickWash Hub", owner: "Sana Sheikh", city: "Delhi", status: "Expired", joined: "19 Jul 2026" },
//   { name: "Urban Laundry", owner: "Vikram Rao", city: "Hyderabad", status: "Active", joined: "17 Jul 2026" },
// ];

// const recentPayments = [
//   { shop: "Sparkle Laundry Co.", amount: "\u20B92,499", method: "UPI", status: "Paid", date: "31 Jul 2026" },
//   { shop: "CleanWave Services", amount: "\u20B94,999", method: "Card", status: "Paid", date: "30 Jul 2026" },
//   { shop: "FreshFold Express", amount: "\u20B91,999", method: "UPI", status: "Pending", date: "29 Jul 2026" },
//   { shop: "QuickWash Hub", amount: "\u20B92,499", method: "Card", status: "Failed", date: "27 Jul 2026" },
//   { shop: "Urban Laundry", amount: "\u20B94,999", method: "Netbanking", status: "Paid", date: "25 Jul 2026" },
// ];

// const statusStyles = {
//   Active: { bg: "#02C39A1F", text: "#028090" },
//   Trial: { bg: "#00A8961F", text: "#00A896" },
//   Expired: { bg: "#E0645C1F", text: "#E0645C" },
//   Paid: { bg: "#02C39A1F", text: "#028090" },
//   Pending: { bg: "#F2A93B1F", text: "#B8791F" },
//   Failed: { bg: "#E0645C1F", text: "#E0645C" },
// };

// const Badge = ({ status }) => {
//   const s = statusStyles[status] || statusStyles.Active;
//   return (
//     <span
//       className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
//       style={{ backgroundColor: s.bg, color: s.text }}
//     >
//       {status}
//     </span>
//   );
// };

// const CardShell = ({ children, className = "" }) => (
//   <div
//     className={`rounded-2xl border p-5 sm:p-6 ${className}`}
//     style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
//   >
//     {children}
//   </div>
// );

// const SectionTitle = ({ children }) => (
//   <h3
//     className="text-base sm:text-lg mb-4"
//     style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
//   >
//     {children}
//   </h3>
// );







































// export default function Dashboard() {
//   const totalSubs = subscriptionData.reduce((sum, d) => sum + d.value, 0);

//   return (
//     <div style={{ fontFamily: "'Inter', sans-serif" }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
//         .row-hover:hover { background-color: ${colors.cardTint}; }
//       `}</style>

//       {/* Stat cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
//         {stats.map((stat) => (
//           <CardShell key={stat.label}>
//             <div className="flex items-start justify-between">
//               <div
//                 className="w-10 h-10 rounded-full flex items-center justify-center"
//                 style={{ backgroundColor: `${stat.color}1F` }}
//               >
//                 <stat.icon size={18} color={stat.color} />
//               </div>
//               <span
//                 className="flex items-center gap-0.5 text-xs font-medium"
//                 style={{ color: stat.trend === "up" ? colors.seafoam : colors.danger }}
//               >
//                 {stat.trend === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
//                 {stat.delta}
//               </span>
//             </div>
//             <div
//               className="mt-4 text-2xl sm:text-3xl"
//               style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
//             >
//               {stat.value}
//             </div>
//             <div className="mt-1 text-xs sm:text-sm" style={{ color: colors.textMuted }}>
//               {stat.label}
//             </div>
//           </CardShell>
//         ))}
//       </div>

//       {/* Charts row */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
//         <CardShell className="lg:col-span-2">
//           <div className="flex items-center justify-between mb-1">
//             <SectionTitle>Revenue</SectionTitle>
//             <span className="text-xs" style={{ color: colors.textMuted }}>
//               Last 7 months
//             </span>
//           </div>
//           <div className="h-64 sm:h-72 -ml-2">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
//                 <defs>
//                   <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor={colors.primaryTeal} stopOpacity={0.35} />
//                     <stop offset="100%" stopColor={colors.primaryTeal} stopOpacity={0} />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid stroke={colors.cardBorder} vertical={false} />
//                 <XAxis
//                   dataKey="month"
//                   tick={{ fill: colors.textMuted, fontSize: 12 }}
//                   axisLine={{ stroke: colors.cardBorder }}
//                   tickLine={false}
//                 />
//                 <YAxis
//                   tick={{ fill: colors.textMuted, fontSize: 12 }}
//                   axisLine={false}
//                   tickLine={false}
//                   tickFormatter={(v) => `\u20B9${v / 1000}k`}
//                   width={48}
//                 />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: colors.bgDark,
//                     border: "none",
//                     borderRadius: 10,
//                     color: "#FFFFFF",
//                   }}
//                   labelStyle={{ color: colors.mint }}
//                   formatter={(v) => [`\u20B9${v.toLocaleString("en-IN")}`, "Revenue"]}
//                 />
//                 <Area
//                   type="monotone"
//                   dataKey="revenue"
//                   stroke={colors.primaryTeal}
//                   strokeWidth={2.5}
//                   fill="url(#revenueFill)"
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </CardShell>

//         <CardShell>
//           <SectionTitle>Subscriptions</SectionTitle>
//           <div className="h-40 sm:h-48 relative">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={subscriptionData}
//                   dataKey="value"
//                   nameKey="name"
//                   innerRadius="65%"
//                   outerRadius="100%"
//                   paddingAngle={3}
//                   stroke="none"
//                 >
//                   {subscriptionData.map((entry) => (
//                     <Cell key={entry.name} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: colors.bgDark,
//                     border: "none",
//                     borderRadius: 10,
//                     color: "#FFFFFF",
//                   }}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
//               <span
//                 className="text-2xl"
//                 style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
//               >
//                 {totalSubs}
//               </span>
//               <span className="text-[11px]" style={{ color: colors.textMuted }}>
//                 Total shops
//               </span>
//             </div>
//           </div>
//           <div className="mt-4 space-y-2">
//             {subscriptionData.map((d) => (
//               <div key={d.name} className="flex items-center justify-between text-sm">
//                 <span className="flex items-center gap-2" style={{ color: colors.textDark }}>
//                   <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
//                   {d.name}
//                 </span>
//                 <span style={{ color: colors.textMuted }}>{d.value}</span>
//               </div>
//             ))}
//           </div>
//         </CardShell>
//       </div>

//       {/* Recent Shops */}
//       <CardShell className="mt-5">
//         <div className="flex items-center justify-between mb-4">
//           <SectionTitle>Recent Shops</SectionTitle>
//           <a
//             href="#"
//             className="flex items-center gap-1 text-xs font-medium"
//             style={{ color: colors.primaryTeal }}
//           >
//             View all <ArrowUpRight size={13} />
//           </a>
//         </div>
//         <div className="overflow-x-auto -mx-2">
//           <table className="w-full text-sm min-w-[560px]">
//             <thead>
//               <tr style={{ color: colors.textMuted }} className="text-left">
//                 <th className="font-medium px-2 py-2">Shop</th>
//                 <th className="font-medium px-2 py-2">Owner</th>
//                 <th className="font-medium px-2 py-2">City</th>
//                 <th className="font-medium px-2 py-2">Status</th>
//                 <th className="font-medium px-2 py-2">Joined</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentShops.map((shop) => (
//                 <tr
//                   key={shop.name}
//                   className="row-hover transition-colors"
//                   style={{ borderTop: `1px solid ${colors.cardBorder}` }}
//                 >
//                   <td className="px-2 py-3 font-medium" style={{ color: colors.textDark }}>
//                     {shop.name}
//                   </td>
//                   <td className="px-2 py-3" style={{ color: colors.textMuted }}>
//                     {shop.owner}
//                   </td>
//                   <td className="px-2 py-3" style={{ color: colors.textMuted }}>
//                     {shop.city}
//                   </td>
//                   <td className="px-2 py-3">
//                     <Badge status={shop.status} />
//                   </td>
//                   <td className="px-2 py-3" style={{ color: colors.textMuted }}>
//                     {shop.joined}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </CardShell>

//       {/* Recent Payments */}
//       <CardShell className="mt-5">
//         <div className="flex items-center justify-between mb-4">
//           <SectionTitle>Recent Payments</SectionTitle>
//           <a
//             href="#"
//             className="flex items-center gap-1 text-xs font-medium"
//             style={{ color: colors.primaryTeal }}
//           >
//             View all <ArrowUpRight size={13} />
//           </a>
//         </div>
//         <div className="overflow-x-auto -mx-2">
//           <table className="w-full text-sm min-w-[560px]">
//             <thead>
//               <tr style={{ color: colors.textMuted }} className="text-left">
//                 <th className="font-medium px-2 py-2">Shop</th>
//                 <th className="font-medium px-2 py-2">Amount</th>
//                 <th className="font-medium px-2 py-2">Method</th>
//                 <th className="font-medium px-2 py-2">Status</th>
//                 <th className="font-medium px-2 py-2">Date</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentPayments.map((p, i) => (
//                 <tr
//                   key={`${p.shop}-${i}`}
//                   className="row-hover transition-colors"
//                   style={{ borderTop: `1px solid ${colors.cardBorder}` }}
//                 >
//                   <td className="px-2 py-3 font-medium" style={{ color: colors.textDark }}>
//                     {p.shop}
//                   </td>
//                   <td className="px-2 py-3" style={{ color: colors.textDark }}>
//                     {p.amount}
//                   </td>
//                   <td className="px-2 py-3" style={{ color: colors.textMuted }}>
//                     {p.method}
//                   </td>
//                   <td className="px-2 py-3">
//                     <Badge status={p.status} />
//                   </td>
//                   <td className="px-2 py-3" style={{ color: colors.textMuted }}>
//                     {p.date}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </CardShell>
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";

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
  RefreshCw,
} from "lucide-react";

import { getShops } from "../../api/shopApi";
import { getSubscriptions } from "../../api/subscriptionApi";

// =====================================================
// COLORS
// =====================================================

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
  warning: "#F2A93B",
};

// =====================================================
// CARD
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

const SectionTitle = ({ children }) => (
  <h3
    className="text-base sm:text-lg mb-4"
    style={{
      color: colors.textDark,
      fontFamily: "'Libre Baskerville', serif",
    }}
  >
    {children}
  </h3>
);

// =====================================================
// STATUS BADGE
// =====================================================

const statusStyles = {
  Active: {
    bg: "#02C39A1F",
    text: "#028090",
  },

  Expired: {
    bg: "#E0645C1F",
    text: "#E0645C",
  },

  Cancelled: {
    bg: "#F2A93B1F",
    text: "#B8791F",
  },

  Paid: {
    bg: "#02C39A1F",
    text: "#028090",
  },

  Pending: {
    bg: "#F2A93B1F",
    text: "#B8791F",
  },

  Failed: {
    bg: "#E0645C1F",
    text: "#E0645C",
  },

  Refunded: {
    bg: "#00A8961F",
    text: "#00A896",
  },
};

const Badge = ({ status }) => {
  const style = statusStyles[status] || statusStyles.Active;

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {status}
    </span>
  );
};

// =====================================================
// HELPERS
// =====================================================

const getArrayData = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.rows)) {
    return response.data.rows;
  }

  if (Array.isArray(response?.rows)) {
    return response.rows;
  }

  return [];
};

const formatCurrency = (value) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getShopName = (shop) => {
  return shop?.name || shop?.shopName || "Unnamed Shop";
};

const getOwnerName = (shop) => {
  return (
    shop?.ownerName ||
    shop?.owner?.name ||
    shop?.user?.name ||
    shop?.name ||
    "-"
  );
};

const getCity = (shop) => {
  return shop?.city || shop?.address?.city || "-";
};

// =====================================================
// DASHBOARD
// =====================================================

export default function Dashboard() {
  // ===================================================
  // STATE
  // ===================================================

  const [shops, setShops] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  // ===================================================
  // FETCH DATA
  // ===================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [shopsResponse, subscriptionsResponse] = await Promise.all([
        getShops(),
        getSubscriptions(),
      ]);

      const shopData = getArrayData(shopsResponse);

      const subscriptionData = getArrayData(subscriptionsResponse);

      setShops(shopData);
      setSubscriptions(subscriptionData);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard API Error:", err);

      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // ===================================================
  // AUTO REFRESH
  // Every 60 seconds
  // ===================================================

  useEffect(() => {
    const interval = setInterval(loadDashboard, 60000);

    return () => clearInterval(interval);
  }, []);

  // ===================================================
  // STATISTICS
  // ===================================================

  const stats = useMemo(() => {
    const totalShops = shops.length;

    const activeShops = shops.filter(
      (shop) => shop.status === "Active" || shop.isActive === true,
    ).length;

    const expiredShops = subscriptions.filter(
      (subscription) => subscription.status === "Expired",
    ).length;

    // Current month
    const now = new Date();

    const currentYear = now.getFullYear();

    const currentMonth = now.getMonth();

    const monthlyRevenue = subscriptions
      .filter((subscription) => {
        if (subscription.paymentStatus !== "Paid") {
          return false;
        }

        if (!subscription.createdAt) {
          return false;
        }

        const date = new Date(subscription.createdAt);

        return (
          date.getFullYear() === currentYear && date.getMonth() === currentMonth
        );
      })
      .reduce((sum, subscription) => sum + Number(subscription.amount || 0), 0);

    return {
      totalShops,
      activeShops,
      expiredShops,
      monthlyRevenue,
    };
  }, [shops, subscriptions]);

  // ===================================================
  // SUBSCRIPTION CHART
  // ===================================================

  const subscriptionData = useMemo(() => {
    const active = subscriptions.filter(
      (item) => item.status === "Active",
    ).length;

    const expired = subscriptions.filter(
      (item) => item.status === "Expired",
    ).length;

    const cancelled = subscriptions.filter(
      (item) => item.status === "Cancelled",
    ).length;

    return [
      {
        name: "Active",
        value: active,
        color: colors.mint,
      },

      {
        name: "Expired",
        value: expired,
        color: colors.danger,
      },

      {
        name: "Cancelled",
        value: cancelled,
        color: colors.warning,
      },
    ].filter((item) => item.value > 0);
  }, [subscriptions]);

  // ===================================================
  // REVENUE BY MONTH
  // ===================================================

  const revenueData = useMemo(() => {
    const months = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      months.push({
        year: date.getFullYear(),

        month: date.getMonth(),

        label: date.toLocaleDateString("en-IN", {
          month: "short",
        }),

        revenue: 0,
      });
    }

    subscriptions.forEach((subscription) => {
      if (subscription.paymentStatus !== "Paid") {
        return;
      }

      if (!subscription.createdAt) {
        return;
      }

      const date = new Date(subscription.createdAt);

      const month = months.find(
        (item) =>
          item.year === date.getFullYear() && item.month === date.getMonth(),
      );

      if (month) {
        month.revenue += Number(subscription.amount || 0);
      }
    });

    return months;
  }, [subscriptions]);

  // ===================================================
  // RECENT SHOPS
  // ===================================================

  const recentShops = useMemo(() => {
    return [...shops]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [shops]);

  // ===================================================
  // RECENT PAYMENTS
  // ===================================================

  const recentPayments = useMemo(() => {
    return [...subscriptions]
      .filter((subscription) => subscription.paymentStatus)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [subscriptions]);

  // ===================================================
  // TOTAL SUBSCRIPTIONS
  // ===================================================

  const totalSubscriptions = subscriptionData.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div
        className="min-h-[400px] flex items-center justify-center"
        style={{
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="text-center">
          <RefreshCw
            size={28}
            className="animate-spin mx-auto"
            style={{
              color: colors.primaryTeal,
            }}
          />

          <p
            className="mt-3 text-sm"
            style={{
              color: colors.textMuted,
            }}
          >
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap'
        );

        .row-hover:hover {
          background-color:
            ${colors.cardTint};
        }

      `}</style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="text-xl sm:text-2xl"
            style={{
              color: colors.textDark,
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            Super Admin Dashboard
          </h2>

          {lastUpdated && (
            <p
              className="text-xs mt-1"
              style={{
                color: colors.textMuted,
              }}
            >
              Last updated {lastUpdated.toLocaleTimeString("en-IN")}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border"
          style={{
            color: colors.primaryTeal,
            borderColor: colors.cardBorder,
            backgroundColor: colors.cardTint,
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="mb-5 rounded-xl p-4 border"
          style={{
            backgroundColor: "#FEF2F2",
            borderColor: "#FECACA",
            color: colors.danger,
          }}
        >
          {error}
        </div>
      )}

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* TOTAL SHOPS */}

        <CardShell>
          <div className="flex items-start justify-between">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `${colors.primaryTeal}1F`,
              }}
            >
              <Store size={18} color={colors.primaryTeal} />
            </div>
          </div>

          <div
            className="mt-4 text-2xl sm:text-3xl"
            style={{
              color: colors.textDark,
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            {stats.totalShops}
          </div>

          <div
            className="mt-1 text-xs sm:text-sm"
            style={{
              color: colors.textMuted,
            }}
          >
            Total Shops
          </div>
        </CardShell>

        {/* ACTIVE SHOPS */}

        <CardShell>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${colors.seafoam}1F`,
            }}
          >
            <CheckCircle2 size={18} color={colors.seafoam} />
          </div>

          <div
            className="mt-4 text-2xl sm:text-3xl"
            style={{
              color: colors.textDark,
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            {stats.activeShops}
          </div>

          <div
            className="mt-1 text-xs sm:text-sm"
            style={{
              color: colors.textMuted,
            }}
          >
            Active Shops
          </div>
        </CardShell>

        {/* REVENUE */}

        <CardShell>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${colors.mint}1F`,
            }}
          >
            <IndianRupee size={18} color={colors.mint} />
          </div>

          <div
            className="mt-4 text-2xl sm:text-3xl"
            style={{
              color: colors.textDark,
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            {formatCurrency(stats.monthlyRevenue)}
          </div>

          <div
            className="mt-1 text-xs sm:text-sm"
            style={{
              color: colors.textMuted,
            }}
          >
            Revenue (MTD)
          </div>
        </CardShell>

        {/* EXPIRED */}

        <CardShell>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${colors.danger}1F`,
            }}
          >
            <AlertTriangle size={18} color={colors.danger} />
          </div>

          <div
            className="mt-4 text-2xl sm:text-3xl"
            style={{
              color: colors.textDark,
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            {stats.expiredShops}
          </div>

          <div
            className="mt-1 text-xs sm:text-sm"
            style={{
              color: colors.textMuted,
            }}
          >
            Expired Subscriptions
          </div>
        </CardShell>
      </div>

      {/* =================================================
          CHARTS
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* REVENUE */}

        <CardShell className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <SectionTitle>Revenue</SectionTitle>

            <span
              className="text-xs"
              style={{
                color: colors.textMuted,
              }}
            >
              Last 7 months
            </span>
          </div>

          <div className="h-64 sm:h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={colors.primaryTeal}
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="100%"
                      stopColor={colors.primaryTeal}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke={colors.cardBorder} vertical={false} />

                <XAxis
                  dataKey="label"
                  tick={{
                    fill: colors.textMuted,
                    fontSize: 12,
                  }}
                  axisLine={{
                    stroke: colors.cardBorder,
                  }}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: colors.textMuted,
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                  width={48}
                />

                <Tooltip
                  formatter={(value) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{
                    backgroundColor: colors.bgDark,
                    border: "none",
                    borderRadius: 10,
                    color: "#FFFFFF",
                  }}
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

        {/* SUBSCRIPTIONS */}

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

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-2xl"
                style={{
                  color: colors.textDark,
                  fontFamily: "'Libre Baskerville', serif",
                }}
              >
                {totalSubscriptions}
              </span>

              <span
                className="text-[11px]"
                style={{
                  color: colors.textMuted,
                }}
              >
                Total Subscriptions
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {subscriptionData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <span
                  className="flex items-center gap-2"
                  style={{
                    color: colors.textDark,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />

                  {item.name}
                </span>

                <span
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </CardShell>
      </div>

      {/* =================================================
          RECENT SHOPS
      ================================================= */}

      <CardShell className="mt-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Recent Shops</SectionTitle>

          <button
            type="button"
            onClick={() => (window.location.href = "/super/shops")}
            className="flex items-center gap-1 text-xs font-medium"
            style={{
              color: colors.primaryTeal,
            }}
          >
            View all
            <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr
                style={{
                  color: colors.textMuted,
                }}
                className="text-left"
              >
                <th className="font-medium px-2 py-2">Shop</th>

                <th className="font-medium px-2 py-2">Owner</th>

                <th className="font-medium px-2 py-2">City</th>

                <th className="font-medium px-2 py-2">Status</th>

                <th className="font-medium px-2 py-2">Joined</th>
              </tr>
            </thead>

            <tbody>
              {recentShops.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-8"
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    No shops found.
                  </td>
                </tr>
              ) : (
                recentShops.map((shop) => (
                  <tr
                    key={shop.id}
                    className="row-hover transition-colors"
                    style={{
                      borderTop: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <td
                      className="px-2 py-3 font-medium"
                      style={{
                        color: colors.textDark,
                      }}
                    >
                      {getShopName(shop)}
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textMuted,
                      }}
                    >
                      {getOwnerName(shop)}
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textMuted,
                      }}
                    >
                      {getCity(shop)}
                    </td>

                    <td className="px-2 py-3">
                      <Badge
                        status={
                          shop.status || (shop.isActive ? "Active" : "Expired")
                        }
                      />
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textMuted,
                      }}
                    >
                      {formatDate(shop.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardShell>

      {/* =================================================
          RECENT PAYMENTS
      ================================================= */}

      <CardShell className="mt-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Recent Payments</SectionTitle>

          <button
            type="button"
            onClick={() => (window.location.href = "/super/subscriptions")}
            className="flex items-center gap-1 text-xs font-medium"
            style={{
              color: colors.primaryTeal,
            }}
          >
            View all
            <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr
                style={{
                  color: colors.textMuted,
                }}
                className="text-left"
              >
                <th className="font-medium px-2 py-2">Shop</th>

                <th className="font-medium px-2 py-2">Amount</th>

                <th className="font-medium px-2 py-2">Method</th>

                <th className="font-medium px-2 py-2">Status</th>

                <th className="font-medium px-2 py-2">Date</th>
              </tr>
            </thead>

            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-8"
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    No payments found.
                  </td>
                </tr>
              ) : (
                recentPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="row-hover transition-colors"
                    style={{
                      borderTop: `1px solid ${colors.cardBorder}`,
                    }}
                  >
                    <td
                      className="px-2 py-3 font-medium"
                      style={{
                        color: colors.textDark,
                      }}
                    >
                      {payment.shop?.name ||
                        payment.shopName ||
                        `Shop #${payment.shopId}`}
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textDark,
                      }}
                    >
                      {formatCurrency(payment.amount)}
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textMuted,
                      }}
                    >
                      {payment.paymentMethod || "-"}
                    </td>

                    <td className="px-2 py-3">
                      <Badge status={payment.paymentStatus} />
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textMuted,
                      }}
                    >
                      {formatDate(payment.createdAt)}
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
