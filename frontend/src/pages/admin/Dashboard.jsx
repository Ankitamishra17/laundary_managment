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
  Package,
  UserCheck,
  UserX,
  AlarmClock,
  Sparkles,
  Receipt,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

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
// STATUS STYLES
// =====================================================

const statusStyles = {
  Processing: { bg: "#00A8961F", text: "#00A896" },
  Ready: { bg: "#02C39A1F", text: "#028090" },
  Pickup: { bg: "#D4A0171F", text: "#B8791F" },
  Delivered: { bg: "#0B6E631F", text: "#0B6E63" },
  Cancelled: { bg: "#E0645C1F", text: "#E0645C" },
  Pending: { bg: "#D4A0171F", text: "#B8791F" },
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
      style={{
        backgroundColor: s.bg,
        color: s.text,
      }}
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

// =====================================================
// DASHBOARD
// =====================================================

export default function ShopDashboard({ employeeName = "Admin" }) {
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

  // ===================================================
  // DYNAMIC STATS
  // ===================================================

  const stats = [
    {
      label: "Today's Orders",
      value: dashboard?.stats?.todayOrders || 0,
      delta: dashboard?.stats?.newOrdersToday
        ? `+${dashboard.stats.newOrdersToday}`
        : "0",
      icon: ClipboardList,
      color: colors.primaryTeal,
    },

    {
      label: "Revenue",
      value: formatCurrency(dashboard?.stats?.todayRevenue || 0),
      delta: dashboard?.stats?.revenueGrowth
        ? `${dashboard.stats.revenueGrowth}%`
        : "0%",
      icon: IndianRupee,
      color: colors.mint,
    },

    {
      label: "Customers",
      value: dashboard?.stats?.totalCustomers || 0,
      delta: dashboard?.stats?.newCustomersToday
        ? `+${dashboard.stats.newCustomersToday}`
        : "0",
      icon: Users,
      color: colors.seafoam,
    },

    {
      label: "Employees",
      value: dashboard?.stats?.totalEmployees || 0,
      delta: `${dashboard?.stats?.presentEmployees || 0} present`,
      icon: UserCog,
      color: colors.primaryTeal,
    },
  ];

  // ===================================================
  // ORDER STATUS
  // ===================================================

  const orderStatus = [
    {
      label: "New",
      count: dashboard?.orderStatus?.new || 0,
      color: colors.primaryTeal,
    },

    {
      label: "Processing",
      count: dashboard?.orderStatus?.processing || 0,
      color: colors.seafoam,
    },

    {
      label: "Ready",
      count: dashboard?.orderStatus?.ready || 0,
      color: colors.mint,
    },

    {
      label: "Delivered",
      count: dashboard?.orderStatus?.delivered || 0,
      color: "#0B6E63",
    },

    {
      label: "Cancelled",
      count: dashboard?.orderStatus?.cancelled || 0,
      color: colors.danger,
    },
  ];

  const maxStatus = Math.max(
    ...orderStatus.map((item) => Number(item.count) || 0),
    1,
  );

  // ===================================================
  // RECENT ORDERS
  // ===================================================

  const recentOrders = dashboard?.recentOrders || [];

  // ===================================================
  // EMPLOYEE TASKS
  // ===================================================

  const employeeTasks = dashboard?.employeeTasks || [];

  const maxTasks = Math.max(
    ...employeeTasks.map((item) => Number(item.orders) || 0),
    1,
  );

  // ===================================================
  // PICKUPS / DELIVERIES
  // ===================================================

  const pickups = dashboard?.pickups || [];

  const deliveries = dashboard?.deliveries || [];

  // ===================================================
  // LOW INVENTORY
  // ===================================================

  const inventory = dashboard?.lowInventory || [];

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
  // TOP SERVICES
  // ===================================================

  const topServices = dashboard?.topServices || [];

  // ===================================================
  // RECENT PAYMENTS
  // ===================================================

  const recentPayments = dashboard?.recentPayments || [];

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div
        className="flex min-h-[400px] items-center justify-center"
        style={{
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          className="text-sm"
          style={{
            color: colors.textMuted,
          }}
        >
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
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

        .row-hover:hover {
          background-color: ${colors.cardTint};
        }

        .period-btn {
          transition:
            background-color 0.15s ease,
            color 0.15s ease;
        }
      `}</style>

      {/* =============================================
          GREETING HEADER
      ============================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <h2
          className="text-2xl sm:text-3xl flex items-center gap-2"
          style={{
            color: colors.textDark,
            fontFamily: "'Libre Baskerville', serif",
          }}
        >
          {greeting}, {employeeName}
          <span>👋</span>
        </h2>

        <span
          className="text-sm"
          style={{
            color: colors.textMuted,
          }}
        >
          {today}
        </span>
      </div>

      {/* =============================================
          STAT CARDS
      ============================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => (
          <CardShell key={stat.label}>
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${stat.color}1F`,
                }}
              >
                <stat.icon size={18} color={stat.color} />
              </div>

              <span
                className="text-xs font-medium"
                style={{
                  color: colors.seafoam,
                }}
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
              style={{
                color: colors.textMuted,
              }}
            >
              {stat.label}
            </div>
          </CardShell>
        ))}
      </div>

      {/* =============================================
          ORDER STATUS
      ============================================= */}

      <CardShell className="mt-5">
        <SectionTitle>Order Status</SectionTitle>

        <div className="space-y-3">
          {orderStatus.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <span
                className="w-24 text-sm flex-shrink-0"
                style={{
                  color: colors.textDark,
                }}
              >
                {s.label}
              </span>

              <div
                className="flex-1 h-2.5 rounded-full"
                style={{
                  backgroundColor: colors.cardTint,
                }}
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
                style={{
                  color: colors.textDark,
                }}
              >
                {s.count}
              </span>
            </div>
          ))}
        </div>
      </CardShell>

      {/* =============================================
          RECENT ORDERS
      ============================================= */}

      <CardShell className="mt-5">
        <SectionTitle
          action={
            <a
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-medium"
              style={{
                color: colors.primaryTeal,
              }}
            >
              View all
              <ArrowUpRight size={13} />
            </a>
          }
        >
          Recent Orders
        </SectionTitle>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr
                style={{
                  color: colors.textMuted,
                }}
                className="text-left"
              >
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
                  <tr
                    key={o.id}
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
                      #{o.id}
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textMuted,
                      }}
                    >
                      {o.customer?.name || o.customerName || "N/A"}
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textMuted,
                      }}
                    >
                      {o.employee?.name || o.employeeName || "Unassigned"}
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textDark,
                      }}
                    >
                      {formatCurrency(
                        o.total_amount || o.totalAmount || o.amount || 0,
                      )}
                    </td>

                    <td className="px-2 py-3">
                      <Badge status={o.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-2 py-8 text-center"
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardShell>

      {/* =============================================
          EMPLOYEE TASKS / PICKUPS / DELIVERIES
      ============================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* EMPLOYEE TASKS */}

        <CardShell>
          <SectionTitle>Employee Tasks</SectionTitle>

          <div className="space-y-3">
            {employeeTasks.length > 0 ? (
              employeeTasks.map((e) => (
                <div key={e.id || e.name} className="flex items-center gap-3">
                  <span
                    className="w-14 text-sm flex-shrink-0"
                    style={{
                      color: colors.textDark,
                    }}
                  >
                    {e.name}
                  </span>

                  <div
                    className="flex-1 h-2 rounded-full"
                    style={{
                      backgroundColor: colors.cardTint,
                    }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${((Number(e.orders) || 0) / maxTasks) * 100}%`,
                        backgroundColor: colors.primaryTeal,
                      }}
                    />
                  </div>

                  <span
                    className="text-xs flex-shrink-0"
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    {e.orders || 0} orders
                  </span>
                </div>
              ))
            ) : (
              <p
                className="text-sm text-center py-4"
                style={{
                  color: colors.textMuted,
                }}
              >
                No employee tasks found
              </p>
            )}
          </div>
        </CardShell>

        {/* PICKUPS */}

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Clock size={16} color={colors.primaryTeal} />
              Today's Pickups
            </span>
          </SectionTitle>

          <div className="space-y-3">
            {pickups.length > 0 ? (
              pickups.map((p, i) => (
                <div
                  key={p.id || i}
                  className="flex items-center justify-between text-sm"
                >
                  <span
                    style={{
                      color: colors.textDark,
                    }}
                  >
                    {p.customer?.name || p.customerName || p.customer || "N/A"}
                  </span>

                  <span
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    {p.time || p.pickupTime || "N/A"}
                  </span>
                </div>
              ))
            ) : (
              <p
                className="text-sm text-center py-4"
                style={{
                  color: colors.textMuted,
                }}
              >
                No pickups today
              </p>
            )}
          </div>
        </CardShell>

        {/* DELIVERIES */}

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Truck size={16} color={colors.seafoam} />
              Today's Deliveries
            </span>
          </SectionTitle>

          <div className="space-y-3">
            {deliveries.length > 0 ? (
              deliveries.map((d, i) => (
                <div
                  key={d.id || i}
                  className="flex items-center justify-between text-sm"
                >
                  <span
                    style={{
                      color: colors.textDark,
                    }}
                  >
                    {d.customer?.name || d.customerName || d.customer || "N/A"}
                  </span>

                  <span
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    {d.time || d.deliveryTime || "N/A"}
                  </span>
                </div>
              ))
            ) : (
              <p
                className="text-sm text-center py-4"
                style={{
                  color: colors.textMuted,
                }}
              >
                No deliveries today
              </p>
            )}
          </div>
        </CardShell>
      </div>

      {/* =============================================
          LOW INVENTORY / ATTENDANCE
      ============================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* LOW INVENTORY */}

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Package size={16} color={colors.danger} />
              Low Inventory
            </span>
          </SectionTitle>

          <div className="space-y-4">
            {inventory.length > 0 ? (
              inventory.map((item, index) => {
                const level =
                  Number(item.level ?? item.stockPercentage ?? 0) || 0;

                const itemName =
                  item.name || item.itemName || item.item || "Unknown Item";

                const quantity =
                  item.qty || item.quantity || item.currentStock || 0;

                return (
                  <div key={item.id || index}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span
                        style={{
                          color: colors.textDark,
                        }}
                      >
                        {itemName}
                      </span>

                      <span
                        className="font-medium"
                        style={{
                          color: colors.danger,
                        }}
                      >
                        {quantity}
                      </span>
                    </div>

                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: colors.cardTint,
                      }}
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
              })
            ) : (
              <p
                className="text-sm text-center py-4"
                style={{
                  color: colors.textMuted,
                }}
              >
                No low inventory items
              </p>
            )}
          </div>
        </CardShell>

        {/* ATTENDANCE */}

        <CardShell>
          <SectionTitle>Attendance</SectionTitle>

          <div className="grid grid-cols-3 gap-3">
            {attendance.map((a) => (
              <div
                key={a.label}
                className="rounded-xl p-4 text-center"
                style={{
                  backgroundColor: colors.cardTint,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{
                    backgroundColor: `${a.color}26`,
                  }}
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
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  {a.label}
                </div>
              </div>
            ))}
          </div>
        </CardShell>
      </div>

      {/* =============================================
          REVENUE / TOP SERVICES
      ============================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* REVENUE CHART */}

        <CardShell className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
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
              style={{
                backgroundColor: colors.cardTint,
              }}
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
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >
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
                  labelStyle={{
                    color: colors.mint,
                  }}
                  formatter={(v) => [formatCurrency(v), "Revenue"]}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.primaryTeal}
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: colors.mint,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardShell>

        {/* TOP SERVICES */}

        <CardShell>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Sparkles size={16} color={colors.mint} />
              Top Services
            </span>
          </SectionTitle>

          <div className="space-y-4">
            {topServices.length > 0 ? (
              topServices.map((s, i) => {
                const percentage = Number(s.pct ?? s.percentage ?? 0) || 0;

                return (
                  <div key={s.id || s.name || i}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span
                        style={{
                          color: colors.textDark,
                        }}
                      >
                        {i + 1}. {s.name || s.serviceName || "Unknown"}
                      </span>

                      <span
                        style={{
                          color: colors.textMuted,
                        }}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: colors.cardTint,
                      }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: colors.seafoam,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p
                className="text-sm text-center py-4"
                style={{
                  color: colors.textMuted,
                }}
              >
                No service data found
              </p>
            )}
          </div>
        </CardShell>
      </div>

      {/* =============================================
          RECENT PAYMENTS
      ============================================= */}

      <CardShell className="mt-5">
        <SectionTitle
          action={
            <a
              href="/admin/payments"
              className="flex items-center gap-2 text-xs font-medium"
              style={{
                color: colors.primaryTeal,
              }}
            >
              <Receipt size={14} />
              View all
            </a>
          }
        >
          Recent Payments
        </SectionTitle>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr
                style={{
                  color: colors.textMuted,
                }}
                className="text-left"
              >
                <th className="font-medium px-2 py-2">Invoice</th>

                <th className="font-medium px-2 py-2">Customer</th>

                <th className="font-medium px-2 py-2">Amount</th>
              </tr>
            </thead>

            <tbody>
              {recentPayments.length > 0 ? (
                recentPayments.map((p, index) => (
                  <tr
                    key={p.id || p.invoice || index}
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
                      {p.invoice ||
                        p.invoiceNo ||
                        p.paymentNumber ||
                        `#${p.id}`}
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textMuted,
                      }}
                    >
                      {p.customer?.name ||
                        p.customerName ||
                        p.customer ||
                        "N/A"}
                    </td>

                    <td
                      className="px-2 py-3"
                      style={{
                        color: colors.textDark,
                      }}
                    >
                      {formatCurrency(p.amount || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="px-2 py-8 text-center"
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    No recent payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardShell>
    </div>
  );
}
