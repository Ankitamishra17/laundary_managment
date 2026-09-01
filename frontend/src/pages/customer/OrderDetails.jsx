import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ClipboardList,
  MapPin,
  CalendarDays,
  X,
  ShoppingBag,
  Loader2,
  Store,
  ArrowLeft,
  ArrowRight,
  PackageSearch,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  UserCheck,
} from "lucide-react";
import { getOrderById, cancelOrder } from "../../api/orderApi";
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

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setNotFound(false);
    try {
      const res = await getOrderById(id);
      if (res.success) {
        setOrder(res.data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(error.response?.data?.message || "Could not load this order.");
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Live tracking — refresh every 5s so the timeline updates quickly
  // as the employee/admin moves the order forward.
  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await cancelOrder(id);
      if (res.success) {
        toast.success("Order cancelled.");
        setConfirmCancel(false);
        load();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not cancel the order.");
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="max-w-lg mx-auto mt-10 text-center rounded-3xl border p-8 sm:p-10" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#FBE9E8" }}>
          <AlertCircle size={24} color="#E0645C" />
        </div>
        <h2 className="mt-5 text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          Order not found
        </h2>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
          We couldn't find that order. It may have been removed, or the link may be wrong.
        </p>
        <Link
          to="/customer/orders"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white transition-all hover:brightness-110"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          <ArrowLeft size={15} /> Back to my orders
        </Link>
      </div>
    );
  }

  const meta = statusMeta(order.status);
  const isPending = order.status === "pending";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Back + header */}
      <div className="mb-6">
        <Link
          to="/customer/orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: colors.primaryTeal }}
        >
          <ArrowLeft size={14} /> All orders
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primaryTeal}1F` }}>
              <PackageSearch size={20} color={colors.primaryTeal} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                Track order #{order.id}
              </h2>
              <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                Placed {formatDateTime(order.createdAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
            <span className="text-base font-semibold" style={{ color: colors.textDark }}>{formatINR(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
        <h3 className="flex items-center gap-2 text-base mb-5" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          <ShoppingBag size={16} color={colors.primaryTeal} /> Order journey
        </h3>
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[560px]">
            <OrderTimeline status={order.status} />
          </div>
        </div>
      </div>

      {/* Task Progress */}
      {order.tasks && order.tasks.length > 0 && (
        <div className="mt-5 rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <h3 className="flex items-center gap-2 text-base mb-5" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
            <Wrench size={16} color={colors.primaryTeal} /> Task progress
          </h3>
          <div className="space-y-3">
            {order.tasks.map((task) => {
              const isCompleted = task.status === "completed";
              const isActive = task.status === "in_progress";
              const taskTypeLabel = {
                pickup: "Pickup",
                wash: "Wash",
                dry: "Dry Cleaning",
                iron: "Ironing",
                pack: "Packing",
                delivery: "Delivery",
              };
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all"
                  style={{
                    backgroundColor: isCompleted ? "#F0FBF6" : isActive ? colors.cardTint : colors.bgLight,
                    borderColor: isCompleted ? "#A3E4CD" : isActive ? `${colors.primaryTeal}40` : colors.cardBorder,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isCompleted ? "#02C39A" : isActive ? `${colors.primaryTeal}20` : colors.cardTint,
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={17} color="#FFFFFF" />
                    ) : isActive ? (
                      <Loader2 size={17} color={colors.primaryTeal} className="animate-spin" />
                    ) : (
                      <Clock size={17} style={{ color: colors.textMuted }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: isCompleted ? "#0B6E63" : colors.textDark }}>
                        {taskTypeLabel[task.task_type] || task.task_type}
                      </span>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isCompleted ? "#DFF7F1" : isActive ? `${colors.primaryTeal}15` : colors.cardTint,
                          color: isCompleted ? "#0B6E63" : isActive ? colors.primaryTeal : colors.textMuted,
                        }}
                      >
                        {isCompleted ? "Completed" : isActive ? "In progress" : "Pending"}
                      </span>
                    </div>
                    {task.started_at && (
                      <div className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                        Started {new Date(task.started_at).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                    {isCompleted && task.completed_at && (
                      <div className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                        Completed {new Date(task.completed_at).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                  {task.notes && (
                    <div className="text-[11px] px-2.5 py-1 rounded-lg max-w-[200px] truncate" style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}>
                      {task.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 grid lg:grid-cols-3 gap-5 lg:gap-6 items-start">
        {/* Left: items + pickup/delivery */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
            <h3 className="flex items-center gap-2 text-base mb-4" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              <ClipboardList size={16} color={colors.primaryTeal} /> Items
            </h3>
            <div className="space-y-3">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium" style={{ color: colors.textDark }}>
                      {item.item_label ? (
                        <>
                          {item.item_label}
                          <span className="text-xs font-normal" style={{ color: colors.textMuted }}>
                            {" "}· {item.name}
                          </span>
                        </>
                      ) : (
                        item.name
                      )}
                      <span className="text-xs font-normal" style={{ color: colors.textMuted }}> × {item.quantity}</span>
                    </div>
                    <div className="text-[11px]" style={{ color: colors.textMuted }}>{formatINR(item.price)} each</div>
                  </div>
                  <span className="font-medium flex-shrink-0" style={{ color: colors.textDark }}>{formatINR(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: colors.cardBorder }}>
              <span className="text-sm" style={{ color: colors.textMuted }}>Total</span>
              <span className="text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                {formatINR(order.total_amount)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
            <h3 className="flex items-center gap-2 text-base mb-4" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              <Store size={16} color={colors.primaryTeal} /> Pickup &amp; delivery
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <CalendarDays size={16} className="mt-0.5 flex-shrink-0" style={{ color: colors.seafoam }} />
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Pickup</div>
                  <div style={{ color: colors.textDark }}>
                    {order.pickup_address || "—"}
                  </div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>
                    {formatDate(order.pickup_date)}{order.pickup_time ? ` · ${order.pickup_time}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: colors.seafoam }} />
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Delivery</div>
                  <div style={{ color: colors.textDark }}>
                    {order.delivery_address || "—"}
                  </div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>
                    {order.delivery_date ? `Preferred ${formatDate(order.delivery_date)}` : "As soon as it's ready"}
                    {order.delivery_note ? ` · ${order.delivery_note}` : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: laundry + actions */}
        <div className="space-y-5">
          <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
            <h3 className="flex items-center gap-2 text-base mb-4" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              <Store size={16} color={colors.primaryTeal} /> Your laundry
            </h3>
            <div className="text-sm font-semibold" style={{ color: colors.textDark }}>{order.shop?.name || "Laundry"}</div>
            {order.shop?.city && <div className="mt-1 text-xs" style={{ color: colors.textMuted }}>{order.shop.city}</div>}
            {order.shop?.phone && (
              <div className="mt-3 rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}>
                Questions? Call <span className="font-semibold" style={{ color: colors.textDark }}>{order.shop.phone}</span>
              </div>
            )}
          </div>

          {isPending && (
            <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: "#FFFBF3", borderColor: "#F0DFB8" }}>
              <h3 className="text-sm font-semibold" style={{ color: colors.textDark }}>Need to cancel?</h3>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: colors.textMuted }}>
                You can cancel while the order is still pending — before we pick it up.
              </p>
              {confirmCancel ? (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 text-xs font-semibold px-3.5 py-2 rounded-lg text-white transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ backgroundColor: "#E0645C" }}
                  >
                    {cancelling ? "Cancelling..." : "Yes, cancel"}
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 text-xs font-semibold px-3.5 py-2 rounded-lg"
                    style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
                  >
                    Keep it
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
                  style={{ color: "#E0645C", backgroundColor: "#FBE9E8" }}
                >
                  <X size={13} /> Cancel order
                </button>
              )}
            </div>
          )}

          {order.status === "delivered" && (
            <div className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: "#F0FBF6", borderColor: "#A3E4CD" }}>
              <h3 className="text-sm font-semibold" style={{ color: colors.textDark }}>How was your experience?</h3>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: colors.textMuted }}>
                Your order has been delivered. Share your feedback by writing a review!
              </p>
              <Link
                to="/customer/reviews"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg text-white transition-all hover:brightness-110"
                style={{ background: "linear-gradient(95deg, #F5A623, #F7C948)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Write a review
              </Link>
            </div>
          )}

          <button
            onClick={() => navigate("/customer/new-order")}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl text-white shadow-lg transition-all hover:brightness-110"
            style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
          >
            Place a new order <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
