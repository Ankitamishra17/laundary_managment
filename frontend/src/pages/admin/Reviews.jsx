import React, { useEffect, useState } from "react";
import {
  Star,
  MessageSquare,
  Send,
  Loader2,
  Inbox,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { getShopReviews, getReviewStats, replyToReview } from "../../api/reviewApi";

const C = {
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
  primaryTeal: "#028090",
  mint: "#02C39A",
  amber: "#D4A017",
};

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border p-5 sm:p-6 ${className}`} style={{ backgroundColor: C.bgLight, borderColor: C.cardBorder }}>
    {children}
  </div>
);

function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= rating ? C.amber : "none"}
          stroke={i <= rating ? C.amber : C.cardBorder}
          strokeWidth={2}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [reviewsRes, statsRes] = await Promise.all([
        getShopReviews(),
        getReviewStats(),
      ]);
      setReviews(reviewsRes?.data || []);
      setStats(statsRes?.data || null);
    } catch (err) {
      toast.error("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await replyToReview(replyTarget.id, replyText.trim());
      toast.success("Reply sent successfully.");
      setReplyTarget(null);
      setReplyText("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl flex items-center gap-2" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          <Star size={26} color={C.primaryTeal} /> Customer Reviews
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
          View and respond to customer feedback.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.amber}1F` }}>
              <Star size={18} color={C.amber} />
            </div>
            <div className="mt-3 text-2xl" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>{stats.total}</div>
            <div className="text-xs" style={{ color: C.textMuted }}>Total Reviews</div>
          </Card>
          <Card>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.primaryTeal}1F` }}>
              <TrendingUp size={18} color={C.primaryTeal} />
            </div>
            <div className="mt-3 text-2xl" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>{stats.avgRating || 0}</div>
            <div className="text-xs" style={{ color: C.textMuted }}>Avg Rating</div>
          </Card>
          <Card>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.mint}1F` }}>
              <Star size={18} color={C.mint} />
            </div>
            <div className="mt-3 text-2xl" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>{stats.distribution?.[5] || 0}</div>
            <div className="text-xs" style={{ color: C.textMuted }}>5-Star Reviews</div>
          </Card>
          <Card>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.primaryTeal}1F` }}>
              <MessageSquare size={18} color={C.primaryTeal} />
            </div>
            <div className="mt-3 text-2xl" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>{reviews.filter((r) => r.admin_reply).length}</div>
            <div className="text-xs" style={{ color: C.textMuted }}>Replied</div>
          </Card>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin" style={{ color: C.primaryTeal }} />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: C.cardTint }}>
              <Inbox size={24} color={C.primaryTeal} />
            </div>
            <p className="text-sm font-medium" style={{ color: C.textDark }}>No reviews yet</p>
            <p className="text-xs mt-1" style={{ color: C.textMuted }}>Customer reviews will appear here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={review.rating} />
                    <span className="text-xs" style={{ color: C.textMuted }}>
                      Order #{review.order_id} &middot; {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: C.textDark }}>
                    {review.customer?.name || "Customer"}
                  </div>
                  {review.comment && (
                    <p className="text-sm mt-1" style={{ color: C.textMuted }}>{review.comment}</p>
                  )}

                  {/* Admin reply */}
                  {review.admin_reply && (
                    <div className="mt-3 rounded-xl p-3 text-sm" style={{ backgroundColor: C.cardTint }}>
                      <div className="text-[11px] font-semibold mb-1" style={{ color: C.primaryTeal }}>Your Reply</div>
                      <p style={{ color: C.textDark }}>{review.admin_reply}</p>
                    </div>
                  )}
                </div>

                {!review.admin_reply && (
                  <button
                    onClick={() => setReplyTarget(review)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0 transition hover:brightness-110"
                    style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
                  >
                    <Send size={12} /> Reply
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReplyTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-[0_20px_50px_rgba(5,40,42,0.25)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-4" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>Reply to Review</h2>
            <div className="mb-3">
              <StarRating rating={replyTarget.rating} size={14} />
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>{replyTarget.customer?.name} &middot; Order #{replyTarget.order_id}</p>
              {replyTarget.comment && <p className="text-sm mt-2" style={{ color: C.textDark }}>{replyTarget.comment}</p>}
            </div>
            <form onSubmit={handleReply}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                placeholder="Write your reply..."
                className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none outline-none focus:border-[#028090]"
                style={{ borderColor: C.cardBorder, backgroundColor: C.cardTint, color: C.textDark }}
                required
              />
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setReplyTarget(null)} className="flex-1 rounded-xl py-2.5 text-sm font-medium border" style={{ borderColor: C.cardBorder, color: C.textDark }}>
                  Cancel
                </button>
                <button type="submit" disabled={replying || !replyText.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}>
                  {replying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {replying ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
