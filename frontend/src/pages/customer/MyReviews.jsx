import { useEffect, useState } from "react";
import { Star, Loader2, MessageSquare, Trash2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { submitReview, getMyReviews, deleteMyReview } from "../../api/reviewApi";
import { getMyOrders } from "../../api/orderApi";
import { formatINR } from "../../utils/orderStatus";

const colors = {
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

function StarRating({ value = 0, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readOnly && setHover(s)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className="transition-transform"
          style={{ cursor: readOnly ? "default" : "pointer" }}
        >
          <Star
            size={20}
            fill={s <= (hover || value) ? "#F5A623" : "transparent"}
            color={s <= (hover || value) ? "#F5A623" : colors.cardBorder}
            strokeWidth={1.8}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!window.confirm("Delete this review?")) return;
    setDeleting(true);
    try {
      await deleteMyReview(review.id);
      toast.success("Review deleted.");
      onDelete?.();
    } catch {
      toast.error("Could not delete review.");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-bold"
              style={{ color: colors.textDark }}
            >
              Order #{review.order_id}
            </span>
            <StarRating value={review.rating} readOnly />
          </div>
          <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
            {new Date(review.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 rounded-lg transition-colors hover:bg-red-50"
          title="Delete review"
        >
          {deleting ? (
            <Loader2 size={14} className="animate-spin" color={colors.danger} />
          ) : (
            <Trash2 size={14} color={colors.danger} />
          )}
        </button>
      </div>
      {review.comment && (
        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: colors.textDark }}
        >
          {review.comment}
        </p>
      )}
      {review.admin_reply && (
        <div
          className="mt-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: colors.cardTint }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: colors.primaryTeal }}>
            Shop reply
          </div>
          <p className="text-sm" style={{ color: colors.textDark }}>
            {review.admin_reply}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // form state
  const [selectedOrder, setSelectedOrder] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await getMyReviews();
      setReviews(res.data || []);
    } catch {
      toast.error("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const openForm = async () => {
    setShowForm(true);
    setOrdersLoading(true);
    try {
      const res = await getMyOrders();
      const orders = (res.data || []).filter((o) => o.status === "delivered");
      // Exclude already-reviewed orders
      const reviewedOrderIds = new Set(reviews.map((r) => r.order_id));
      setDeliveredOrders(orders.filter((o) => !reviewedOrderIds.has(o.id)));
    } catch {
      toast.error("Could not load orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return toast.error("Please select an order.");
    if (rating === 0) return toast.error("Please select a rating.");
    setSubmitting(true);
    try {
      await submitReview({
        order_id: Number(selectedOrder),
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Review submitted!");
      setShowForm(false);
      setSelectedOrder("");
      setRating(0);
      setComment("");
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-2xl sm:text-3xl"
            style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
          >
            My reviews
          </h2>
          <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
            Share your experience with your laundry service.
          </p>
        </div>
        <button
          onClick={openForm}
          className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          <Plus size={16} /> Write a review
        </button>
      </div>

      {/* Review form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(5,40,42,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h3
                className="text-xl"
                style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
              >
                Write a review
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.cardTint }}
              >
                <X size={16} color={colors.textDark} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                  Select delivered order <span style={{ color: colors.danger }}>*</span>
                </label>
                {ordersLoading ? (
                  <div className="flex items-center gap-2 py-3 text-sm" style={{ color: colors.textMuted }}>
                    <Loader2 size={14} className="animate-spin" /> Loading orders...
                  </div>
                ) : deliveredOrders.length === 0 ? (
                  <p className="text-sm py-3" style={{ color: colors.textMuted }}>
                    No delivered orders available for review.
                  </p>
                ) : (
                  <select
                    value={selectedOrder}
                    onChange={(e) => setSelectedOrder(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    style={{
                      borderColor: colors.cardBorder,
                      backgroundColor: colors.cardTint,
                      color: colors.textDark,
                    }}
                  >
                    <option value="">Choose an order...</option>
                    {deliveredOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} — {formatINR(o.total_amount)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                  Rating <span style={{ color: colors.danger }}>*</span>
                </label>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                  Your experience
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="How was your laundry experience?"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
                  style={{
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.cardTint,
                    color: colors.textDark,
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !selectedOrder || rating === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><Star size={16} /> Submit review</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
        </div>
      ) : reviews.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#FFF8E7" }}
          >
            <MessageSquare size={24} color="#F5A623" />
          </div>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            You haven't written any reviews yet.
          </p>
          <button
            onClick={openForm}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
          >
            <Star size={15} /> Write your first review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} onDelete={loadReviews} />
          ))}
        </div>
      )}
    </div>
  );
}
