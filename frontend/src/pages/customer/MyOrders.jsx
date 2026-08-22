import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ClipboardList,
  MapPin,
  CalendarDays,
  X,
  ShoppingBag,
  Loader2,
  Sparkles,
  Store,
  ArrowUpRight,
  Package,
  Percent,
  Truck,
} from "lucide-react";
import { getMyOrders, cancelOrder } from "../../api/orderApi";
import OrderTimeline from "../../components/customer/OrderTimeline";
import { statusMeta, formatINR, formatDateTime, formatDate } from "../../utils/orderStatus";

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

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getMyOrders();
      if (res.success) setOrders(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  };

  // Live tracking — refresh every 5s so employee/admin updates show up
  // quickly on the customer dashboard.
  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (id) => {
    try {
      const res = await cancelOrder(id);
      if (res.success) {
        toast.success("Order cancelled successfully.");
        setConfirmCancel(null);
        load();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not cancel the order.");
      setConfirmCancel(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          My orders
        </h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          Track every order from pickup to delivery.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${colors.mint}1F` }}>
            <ShoppingBag size={24} color={colors.mint} />
          </div>
          <p className="text-sm" style={{ color: colors.textMuted }}>You haven't placed any orders yet.</p>
          <Link
            to="/customer/new-order"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
          >
            <Sparkles size={15} /> Place your first order
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((o) => {
            const meta = statusMeta(o.status);
            const isPending = o.status === "pending";
            const subtotal = (o.items || []).reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);

            return (
              <div key={o.id} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
                {/* ── Order Header ── */}
                <div className="px-5 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: colors.cardBorder, backgroundColor: `${colors.primaryTeal}08` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primaryTeal}1F` }}>
                      <ClipboardList size={18} color={colors.primaryTeal} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold" style={{ color: colors.textDark }}>Order #{o.id}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: meta.bg, color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{formatDateTime(o.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={`/customer/orders/${o.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white transition-all hover:brightness-110"
                      style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
                    >
                      Track <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* ── Pickup / Delivery Info ── */}
                <div className="px-5 sm:px-6 py-3.5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 border-b" style={{ borderColor: colors.cardBorder }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
                    <Store size={14} style={{ color: colors.seafoam }} /> {o.shop?.name || "Laundry"}
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: colors.textMuted }}>
                    <CalendarDays size={14} style={{ color: colors.seafoam }} /> Pickup {formatDate(o.pickup_date)}
                    {o.pickup_time ? ` · ${o.pickup_time}` : ""}
                  </div>
                  {o.pickup_address && (
                    <div className="flex items-start gap-2 text-xs min-w-0" style={{ color: colors.textMuted }}>
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color: colors.seafoam }} />
                      <span className="truncate" title={o.pickup_address}>Pickup: {o.pickup_address}</span>
                    </div>
                  )}
                  {o.delivery_address && (
                    <div className="flex items-start gap-2 text-xs min-w-0" style={{ color: colors.textMuted }}>
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color: colors.seafoam }} />
                      <span className="truncate" title={o.delivery_address}>Delivery: {o.delivery_address}</span>
                    </div>
                  )}
                </div>

                {/* ── Timeline ── */}
                <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: colors.cardBorder }}>
                  <div className="overflow-x-auto pb-1">
                    <div className="min-w-[560px]">
                      <OrderTimeline status={o.status} />
                    </div>
                  </div>
                </div>

                {/* ── Items & Pricing ── */}
                <div className="px-5 sm:px-6 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={14} style={{ color: colors.primaryTeal }} />
                    <span className="text-[13px] font-semibold" style={{ color: colors.textDark }}>Order Items</span>
                  </div>

                  {/* Item rows */}
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.cardBorder }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#FAFDFC] border-b" style={{ borderColor: colors.cardBorder }}>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wide py-2.5 px-4" style={{ color: colors.textMuted }}>Item / Service</th>
                          <th className="text-center text-[11px] font-semibold uppercase tracking-wide py-2.5 px-3" style={{ color: colors.textMuted }}>Qty</th>
                          <th className="text-right text-[11px] font-semibold uppercase tracking-wide py-2.5 px-4" style={{ color: colors.textMuted }}>Unit Price</th>
                          <th className="text-right text-[11px] font-semibold uppercase tracking-wide py-2.5 px-4" style={{ color: colors.textMuted }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(o.items || []).map((item) => (
                          <tr key={item.id} className="border-b last:border-0" style={{ borderColor: colors.cardBorder }}>
                            <td className="py-2.5 px-4">
                              <span className="font-medium" style={{ color: colors.textDark }}>
                                {item.item_label ? (
                                  <>
                                    {item.item_label}
                                    <span className="text-xs font-normal ml-1" style={{ color: colors.textMuted }}>· {item.name}</span>
                                  </>
                                ) : (
                                  item.name
                                )}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center" style={{ color: colors.textMuted }}>{item.quantity}</td>
                            <td className="py-2.5 px-4 text-right" style={{ color: colors.textMuted }}>{formatINR(item.price)}</td>
                            <td className="py-2.5 px-4 text-right font-medium" style={{ color: colors.textDark }}>{formatINR(item.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Price Summary ── */}
                  <div className="mt-4 flex justify-end">
                    <div className="w-full sm:w-72">
                      <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: colors.cardBorder, backgroundColor: `${colors.primaryTeal}05` }}>
                        <div className="flex justify-between text-[13px]" style={{ color: colors.textMuted }}>
                          <span>Subtotal ({(o.items || []).length} item{(o.items || []).length !== 1 ? "s" : ""})</span>
                          <span>{formatINR(subtotal)}</span>
                        </div>
                        {o.discount > 0 && (
                          <div className="flex justify-between text-[13px]" style={{ color: "#0B6E63" }}>
                            <span className="flex items-center gap-1"><Percent size={12} /> Discount</span>
                            <span>-{formatINR(o.discount)}</span>
                          </div>
                        )}
                        {o.delivery_charge > 0 && (
                          <div className="flex justify-between text-[13px]" style={{ color: colors.textMuted }}>
                            <span className="flex items-center gap-1"><Truck size={12} /> Delivery</span>
                            <span>+{formatINR(o.delivery_charge)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between text-sm font-bold" style={{ borderColor: colors.cardBorder, color: colors.textDark }}>
                          <span>Total</span>
                          <span>{formatINR(o.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]" style={{ color: colors.textMuted }}>
                          <span>Payment</span>
                          <span className="capitalize font-medium" style={{ color: o.payment_status === "paid" ? "#0B6E63" : o.payment_status === "partial" ? "#9A6A12" : colors.textMuted }}>
                            {o.payment_status || "unpaid"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Cancel ── */}
                {isPending && (
                  <div className="px-5 sm:px-6 py-3.5 border-t flex justify-end" style={{ borderColor: colors.cardBorder }}>
                    {confirmCancel === o.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: colors.textMuted }}>Cancel this order?</span>
                        <button
                          onClick={() => handleCancel(o.id)}
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white"
                          style={{ backgroundColor: "#E0645C" }}
                        >
                          Yes, cancel
                        </button>
                        <button
                          onClick={() => setConfirmCancel(null)}
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-lg"
                          style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
                        >
                          Keep it
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancel(o.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
                        style={{ color: "#E0645C", backgroundColor: "#FBE9E8" }}
                      >
                        <X size={13} /> Cancel order
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
