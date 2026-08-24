import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ClipboardList,
  IndianRupee,
  Truck,
  PackageCheck,
  ArrowUpRight,
  PlusCircle,
  ShoppingBag,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { getMyOrders } from "../../api/orderApi";
import { useAuth } from "../../context/AuthContext";
import { ACTIVE_STATUSES, statusMeta, formatINR, formatDateTime, formatDate } from "../../utils/orderStatus";

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
};

const StatusPill = ({ status }) => {
  const meta = statusMeta(status);
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyOrders();
        if (res.success) setOrders(res.data || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load your orders.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  const totalSpent = delivered.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const nextPickup = orders.find((o) => ["pending", "picked_up"].includes(o.status));

  const stats = [
    { label: "Total orders", value: orders.length, icon: ClipboardList, color: colors.primaryTeal },
    { label: "In progress", value: active.length, icon: Truck, color: colors.seafoam },
    { label: "Delivered", value: delivered.length, icon: PackageCheck, color: colors.mint },
    { label: "Total spent", value: formatINR(totalSpent), icon: IndianRupee, color: colors.primaryTeal },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .cd-row:hover { background-color: ${colors.cardTint}; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2
            className="text-2xl sm:text-3xl"
            style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
          >
            {greeting}, {user?.name?.split(" ")[0] || "there"} 
          </h2>
          <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
            {today} · Your laundry, handled.
          </p>
        </div>
        <button
          onClick={() => navigate("/customer/new-order")}
          className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          <PlusCircle size={16} /> New order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border p-5"
            style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${s.color}1F` }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
            <div className="mt-4 text-2xl sm:text-3xl truncate" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              {s.value}
            </div>
            <div className="mt-1 text-xs sm:text-sm" style={{ color: colors.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next pickup + quick CTA */}
      {nextPickup && (
        <div
          className="mt-5 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ background: "linear-gradient(120deg, #05282A, #0B3B3E)", border: "1px solid #02809055" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#02C39A22" }}>
              <CalendarClock size={20} color="#02C39A" />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                Order #{nextPickup.id} — next pickup
              </div>
              <div className="mt-1 text-sm" style={{ color: "#A9C9C6" }}>
                {nextPickup.shop?.name || "Your laundry"} · Pickup {formatDate(nextPickup.pickup_date)}
                {nextPickup.pickup_time ? ` at ${nextPickup.pickup_time}` : ""} · {formatINR(nextPickup.total_amount)}
              </div>
            </div>
          </div>
          <Link
            to="/customer/orders"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110 self-start sm:self-auto"
            style={{ backgroundColor: "#028090" }}
          >
            Track order <ArrowUpRight size={15} />
          </Link>
        </div>
      )}

      {/* Recent orders */}
      <div
        className="mt-5 rounded-2xl border p-5 sm:p-6"
        style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg flex items-center gap-2" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
            <ShoppingBag size={17} color={colors.primaryTeal} /> Recent orders
          </h3>
          {orders.length > 0 && (
            <Link to="/customer/orders" className="flex items-center gap-1 text-xs font-medium" style={{ color: colors.primaryTeal }}>
              View all <ArrowUpRight size={13} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-[#028090] border-t-transparent animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${colors.mint}1F` }}>
              <Sparkles size={24} color={colors.mint} />
            </div>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              No orders yet — fresh laundry is one click away.
            </p>
            <button
              onClick={() => navigate("/customer/new-order")}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              <PlusCircle size={15} /> Place your first order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left" style={{ color: colors.textMuted }}>
                  <th className="font-medium px-2 py-2">Order</th>
                  <th className="font-medium px-2 py-2">Laundry</th>
                  <th className="font-medium px-2 py-2">Placed</th>
                  <th className="font-medium px-2 py-2">Amount</th>
                  <th className="font-medium px-2 py-2">Status</th>
                  <th className="font-medium px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr
                    key={o.id}
                    className="cd-row transition-colors cursor-pointer"
                    style={{ borderTop: `1px solid ${colors.cardBorder}` }}
                    onClick={() => navigate("/customer/orders")}
                  >
                    <td className="px-2 py-3 font-medium" style={{ color: colors.textDark }}>#{o.id}</td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>{o.shop?.name || "—"}</td>
                    <td className="px-2 py-3" style={{ color: colors.textMuted }}>{formatDateTime(o.createdAt)}</td>
                    <td className="px-2 py-3 font-medium" style={{ color: colors.textDark }}>{formatINR(o.total_amount)}</td>
                    <td className="px-2 py-3"><StatusPill status={o.status} /></td>
                    <td className="px-2 py-3 text-right">
                      <ArrowUpRight size={15} style={{ color: colors.textMuted }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
