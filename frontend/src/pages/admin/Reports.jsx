import React, { useEffect, useState } from "react";
import {
  IndianRupee,
  ClipboardList,
  Users,
  UserCog,
  Package,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Truck,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getAdminDashboard } from "../../api/adminDashboardApi";
import { getShopOrders } from "../../api/orderApi";
import { getShopCustomers } from "../../api/customerApi";
import { formatINR } from "../../utils/orderStatus";

const C = {
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

/* =====================================================
   HELPER COMPONENTS
   ===================================================== */

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border p-5 sm:p-6 transition-shadow duration-200 hover:shadow-md ${className}`}
    style={{ backgroundColor: C.bgLight, borderColor: C.cardBorder }}
  >
    {children}
  </div>
);

const StatIcon = ({ icon: Icon, color, size = 20 }) => (
  <div
    className="w-11 h-11 rounded-xl flex items-center justify-center"
    style={{ backgroundColor: `${color}1A` }}
  >
    <Icon size={size} color={color} />
  </div>
);

const DeltaBadge = ({ value, positive }) => (
  <span
    className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
    style={{
      backgroundColor: positive ? `${C.mint}18` : `${C.danger}18`,
      color: positive ? C.mint : C.danger,
    }}
  >
    {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
    {value}
  </span>
);

const ProgressBar = ({ value, max, color }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 rounded-full w-full" style={{ backgroundColor: C.cardTint }}>
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
};

/* =====================================================
   MAIN COMPONENT
   ===================================================== */

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dashRes, ordersRes, customersRes] = await Promise.allSettled([
          getAdminDashboard(),
          getShopOrders(),
          getShopCustomers(),
        ]);
        if (cancelled) return;
        setDashboard(dashRes.status === "fulfilled" ? dashRes.value?.data || dashRes.value : null);
        setOrders(ordersRes.status === "fulfilled" ? ordersRes.value?.data || [] : []);
        setCustomers(customersRes.status === "fulfilled" ? customersRes.value?.data || [] : []);
      } catch (err) {
        console.error("Reports load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={28} className="animate-spin" style={{ color: C.primaryTeal }} />
      </div>
    );
  }

  /* ---------- Derived Data ---------- */
  const totalRevenue = dashboard?.summary?.totalRevenue || 0;
  const todayRevenue = dashboard?.summary?.todayRevenue || 0;
  const totalExpenses = dashboard?.summary?.totalExpenses || 0;
  const netProfit = dashboard?.summary?.netProfit || 0;
  const pendingPayments = dashboard?.summary?.pendingPayments || 0;

  const totalOrders = dashboard?.orders?.total || orders.length;
  const pendingOrders = dashboard?.orders?.pending || 0;
  const processingOrders = dashboard?.orders?.processing || 0;
  const deliveredOrders = dashboard?.orders?.delivered || orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = dashboard?.orders?.cancelled || orders.filter((o) => o.status === "cancelled").length;
  const avgOrderValue = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0;

  const totalCustomers = dashboard?.customers?.total || customers.length;
  const newCustomersToday = dashboard?.customers?.newToday || 0;
  const totalEmployees = dashboard?.business?.totalEmployees || 0;
  const presentToday = dashboard?.business?.presentToday || 0;
  const totalSuppliers = dashboard?.business?.totalSuppliers || 0;
  const totalInventory = dashboard?.business?.totalInventoryItems || 0;

  /* ---------- Order Status Data for Chart ---------- */
  const orderChartData = [
    { name: "Pending", value: pendingOrders, fill: C.amber },
    { name: "Processing", value: processingOrders, fill: C.seafoam },
    { name: "Delivered", value: deliveredOrders, fill: C.mint },
    { name: "Cancelled", value: cancelledOrders, fill: C.danger },
  ];

  /* ---------- Revenue Summary ---------- */
  const isProfit = netProfit >= 0;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .report-row:hover { background-color: ${C.cardTint}; }
      `}</style>

      {/* =============================================
          HEADER
      ============================================= */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl flex items-center gap-2.5"
            style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}
          >
            <BarChart3 size={28} color={C.primaryTeal} />
            Business Reports
          </h1>
          <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
            Financial overview, order analytics and key business metrics.
          </p>
        </div>
      </div>

      {/* =============================================
          REVENUE HERO CARD
      ============================================= */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${C.bgDark} 0%, ${C.panelDark} 50%, ${C.primaryTeal} 100%)`,
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: C.mint }} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: C.seafoam }} />

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.mint}22` }}>
                <IndianRupee size={17} color={C.mint} />
              </div>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Total Revenue</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              {formatINR(totalRevenue)}
            </div>
            {todayRevenue > 0 && (
              <div className="mt-1.5">
                <DeltaBadge value={`+${formatINR(todayRevenue)} today`} positive />
              </div>
            )}
          </div>

          {/* Total Expenses */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.danger}22` }}>
                <TrendingDown size={17} color={C.danger} />
              </div>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Total Expenses</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              {formatINR(totalExpenses)}
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Supplier + Salary
            </p>
          </div>

          {/* Net Profit */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: isProfit ? `${C.mint}22` : `${C.danger}22` }}>
                {isProfit ? <TrendingUp size={17} color={C.mint} /> : <TrendingDown size={17} color={C.danger} />}
              </div>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Net Profit</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Libre Baskerville', serif", color: isProfit ? C.mint : C.danger }}>
              {formatINR(Math.abs(netProfit))}
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              {isProfit ? "Profitable" : "Loss"} this period
            </p>
          </div>

          {/* Pending Payments */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.amber}22` }}>
                <AlertTriangle size={17} color={C.amber} />
              </div>
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Pending Payments</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "'Libre Baskerville', serif" }}>
              {pendingPayments}
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Awaiting collection
            </p>
          </div>
        </div>
      </div>

      {/* =============================================
          QUICK STATS ROW
      ============================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
        {[
          { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: C.primaryTeal },
          { label: "Delivered", value: deliveredOrders, icon: Truck, color: C.mint },
          { label: "Avg Order", value: formatINR(avgOrderValue), icon: IndianRupee, color: C.seafoam },
          { label: "Customers", value: totalCustomers, icon: Users, color: C.primaryTeal, delta: newCustomersToday > 0 ? `+${newCustomersToday}` : null },
          { label: "Employees", value: totalEmployees, icon: UserCog, color: C.seafoam, delta: `${presentToday} present` },
          { label: "Suppliers", value: totalSuppliers, icon: Package, color: C.mint },
        ].map((s) => (
          <Card key={s.label}>
            <StatIcon icon={s.icon} color={s.color} />
            <div className="mt-3 text-xl font-bold" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              {s.value}
            </div>
            <div className="text-[11px] font-medium mt-0.5" style={{ color: C.textMuted }}>{s.label}</div>
            {s.delta && (
              <div className="mt-1">
                <DeltaBadge value={s.delta} positive />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* =============================================
          ORDER STATUS + CHART ROW
      ============================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* ORDER STATUS BREAKDOWN */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.primaryTeal}1A` }}>
              <ClipboardList size={18} color={C.primaryTeal} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              Order Status
            </h3>
          </div>

          <div className="space-y-4">
            {[
              { label: "Pending", count: pendingOrders, color: C.amber },
              { label: "Processing", count: processingOrders, color: C.seafoam },
              { label: "Delivered", count: deliveredOrders, color: C.mint },
              { label: "Cancelled", count: cancelledOrders, color: C.danger },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm font-medium" style={{ color: C.textDark }}>{s.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: C.textDark }}>{s.count}</span>
                </div>
                <ProgressBar value={s.count} max={Math.max(pendingOrders, processingOrders, deliveredOrders, cancelledOrders, 1)} color={s.color} />
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: C.cardBorder }}>
            <span className="text-xs font-medium" style={{ color: C.textMuted }}>Completion Rate</span>
            <span className="text-sm font-bold" style={{ color: C.mint }}>
              {totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0}%
            </span>
          </div>
        </Card>

        {/* ORDER STATUS BAR CHART */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.seafoam}1A` }}>
              <BarChart3 size={18} color={C.seafoam} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              Orders Overview
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderChartData} barSize={32} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={C.cardBorder} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: C.textMuted, fontSize: 11 }}
                  axisLine={{ stroke: C.cardBorder }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: C.textMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: C.bgDark,
                    border: "none",
                    borderRadius: 10,
                    color: "#FFF",
                    fontSize: 12,
                  }}
                  cursor={{ fill: `${C.primaryTeal}0D` }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {orderChartData.map((entry, index) => (
                    <rect key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* =============================================
          BUSINESS HEALTH ROW
      ============================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue vs Expenses */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.mint}1A` }}>
              <IndianRupee size={18} color={C.mint} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              Financial Summary
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Revenue", value: formatINR(totalRevenue), color: C.mint, pct: 100 },
              { label: "Expenses", value: formatINR(totalExpenses), color: C.danger, pct: totalRevenue > 0 ? Math.min((totalExpenses / totalRevenue) * 100, 100) : 0 },
              { label: "Profit", value: formatINR(Math.abs(netProfit)), color: isProfit ? C.mint : C.danger, pct: totalRevenue > 0 ? Math.min((Math.abs(netProfit) / totalRevenue) * 100, 100) : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: C.textMuted }}>{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
                <ProgressBar value={item.pct} max={100} color={item.color} />
              </div>
            ))}
          </div>
        </Card>

        {/* Staff & Inventory */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.primaryTeal}1A` }}>
              <Users size={18} color={C.primaryTeal} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              Staff & Inventory
            </h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Employees", value: totalEmployees, sub: `${presentToday} present today`, color: C.primaryTeal, icon: UserCog },
              { label: "Suppliers", value: totalSuppliers, sub: "Active partners", color: C.seafoam, icon: Truck },
              { label: "Inventory Items", value: totalInventory, sub: "In stock", color: C.mint, icon: Package },
              { label: "Customers", value: totalCustomers, sub: newCustomersToday > 0 ? `+${newCustomersToday} today` : "All time", color: C.amber, icon: Users },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}1A` }}>
                  <item.icon size={16} color={item.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: C.textDark }}>{item.label}</span>
                    <span className="text-sm font-bold" style={{ color: C.textDark }}>{item.value}</span>
                  </div>
                  <span className="text-[11px]" style={{ color: C.textMuted }}>{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Key Insights */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.amber}1A` }}>
              <TrendingUp size={18} color={C.amber} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              Key Insights
            </h3>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl p-3" style={{ backgroundColor: C.cardTint }}>
              <div className="text-[11px] font-semibold mb-1" style={{ color: C.primaryTeal }}>Completion Rate</div>
              <div className="text-lg font-bold" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                {totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0}%
              </div>
              <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>
                {deliveredOrders} of {totalOrders} orders delivered
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: C.cardTint }}>
              <div className="text-[11px] font-semibold mb-1" style={{ color: C.mint }}>Average Order Value</div>
              <div className="text-lg font-bold" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                {formatINR(avgOrderValue)}
              </div>
              <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>
                Per delivered order
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ backgroundColor: isProfit ? `${C.mint}12` : `${C.danger}12` }}>
              <div className="text-[11px] font-semibold mb-1" style={{ color: isProfit ? C.mint : C.danger }}>
                {isProfit ? "Profit Margin" : "Loss Margin"}
              </div>
              <div className="text-lg font-bold" style={{ color: isProfit ? C.mint : C.danger, fontFamily: "'Libre Baskerville', serif" }}>
                {totalRevenue > 0 ? Math.round((Math.abs(netProfit) / totalRevenue) * 100) : 0}%
              </div>
              <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>
                {isProfit ? "Of total revenue" : "Revenue deficit"}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* =============================================
          LOW STOCK ALERTS
      ============================================= */}
      {dashboard?.lowStockItems?.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.danger}1A` }}>
              <AlertTriangle size={18} color={C.danger} />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                Low Stock Alerts
              </h3>
              <p className="text-[11px]" style={{ color: C.textMuted }}>
                {dashboard.lowStockItems.length} item{dashboard.lowStockItems.length !== 1 ? "s" : ""} need attention
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.cardBorder}` }}>
                  <th className="text-left font-semibold px-3 py-3" style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Item</th>
                  <th className="text-left font-semibold px-3 py-3" style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current</th>
                  <th className="text-left font-semibold px-3 py-3" style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Minimum</th>
                  <th className="text-left font-semibold px-3 py-3" style={{ color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.lowStockItems.map((item, i) => {
                  const qty = item.quantity ?? item.currentStock ?? 0;
                  const min = item.minimumStock ?? item.minStock ?? 1;
                  const severity = qty === 0 ? "Out of Stock" : qty <= min * 0.5 ? "Critical" : "Low";
                  const severityColor = qty === 0 ? C.danger : qty <= min * 0.5 ? C.danger : C.amber;

                  return (
                    <tr key={item.id || i} className="report-row transition-colors" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                      <td className="px-3 py-3.5 font-medium" style={{ color: C.textDark }}>{item.name}</td>
                      <td className="px-3 py-3.5 font-bold" style={{ color: severityColor }}>{qty}</td>
                      <td className="px-3 py-3.5" style={{ color: C.textMuted }}>{min}</td>
                      <td className="px-3 py-3.5">
                        <span
                          className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${severityColor}18`, color: severityColor }}
                        >
                          {severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
