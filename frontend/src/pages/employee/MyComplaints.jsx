import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getMyAssignedComplaints,
  resolveComplaint,
  employeeReplyToComplaint,
} from "../../api/complaintApi";

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
  amber: "#D4A017",
};

const CATEGORY_LABELS = {
  quality: "Quality Issue",
  delay: "Service Delay",
  damage: "Damage",
  billing: "Billing Issue",
  service: "Poor Service",
  other: "Other",
};

const STATUS_META = {
  open: { label: "Open", bg: "#FBE9E8", color: "#B3261E", icon: AlertTriangle },
  in_progress: { label: "In Progress", bg: "#FFF8E7", color: "#9A6A12", icon: Clock },
  resolved: { label: "Resolved", bg: "#DFF7F1", color: "#0B6E63", icon: CheckCircle2 },
  closed: { label: "Closed", bg: "#EEF7F6", color: "#5C7A78", icon: ShieldCheck },
};

function ComplaintCard({ complaint, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [showResolve, setShowResolve] = useState(false);

  const meta = STATUS_META[complaint.status] || STATUS_META.open;
  const replies = complaint.replies || [];

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await employeeReplyToComplaint(complaint.id, replyText.trim());
      toast.success("Reply sent.");
      setReplyText("");
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send reply.");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveComplaint(complaint.id, resolutionNote.trim() || undefined);
      toast.success("Complaint marked as resolved.");
      setShowResolve(false);
      setResolutionNote("");
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resolve complaint.");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 sm:px-6 py-4 flex items-start gap-4"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: meta.bg }}
        >
          <meta.icon size={18} color={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: colors.textDark }}>
              {complaint.subject}
            </span>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: colors.textMuted }}>
            <span>{CATEGORY_LABELS[complaint.category] || complaint.category}</span>
            {complaint.customer && <span>&middot; {complaint.customer.name}</span>}
            {complaint.order_id && <span>&middot; Order #{complaint.order_id}</span>}
            <span>&middot; {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 sm:px-6 pb-5 space-y-4 border-t" style={{ borderColor: colors.cardBorder }}>
          {/* Description */}
          <p className="text-sm leading-relaxed pt-4" style={{ color: colors.textDark }}>
            {complaint.description}
          </p>

          {/* Image */}
          {complaint.image_url && (
            <div className="mt-2">
              <a href={complaint.image_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={complaint.image_url}
                  alt="Complaint evidence"
                  className="h-32 rounded-lg object-cover border cursor-pointer hover:brightness-90 transition"
                  style={{ borderColor: colors.cardBorder }}
                />
              </a>
            </div>
          )}

          {/* Order info */}
          {complaint.order && (
            <div className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}>
              Order #{complaint.order.id} — Status: {complaint.order.status}
            </div>
          )}

          {/* Thread */}
          {replies.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: colors.primaryTeal }}>
                <MessageSquare size={12} /> Conversation
              </div>
              {replies.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl px-4 py-2.5"
                  style={{
                    backgroundColor: r.is_admin ? colors.cardTint : "#F0FAF8",
                    border: `1px solid ${r.is_admin ? colors.cardBorder : "transparent"}`,
                  }}
                >
                  <div className="text-[11px] font-semibold mb-0.5" style={{ color: r.is_admin ? colors.primaryTeal : "#0B6E63" }}>
                    {r.is_admin ? "Admin" : "Employee"}
                  </div>
                  <p className="text-sm" style={{ color: colors.textDark }}>{r.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply form */}
          {complaint.status !== "resolved" && complaint.status !== "closed" && (
            <form onSubmit={handleReply} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add a reply..."
                className="flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-all hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: colors.primaryTeal }}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          )}

          {/* Resolve button */}
          {complaint.status !== "resolved" && complaint.status !== "closed" && (
            <div className="pt-1">
              {!showResolve ? (
                <button
                  onClick={() => setShowResolve(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(95deg, #02C39A, #028090)" }}
                >
                  <CheckCircle2 size={16} /> Mark as Resolved
                </button>
              ) : (
                <div className="rounded-xl p-4 border" style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint }}>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.textDark }}>
                    Add a resolution note (optional):
                  </p>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={2}
                    placeholder="Describe how the issue was resolved..."
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none mb-3"
                    style={{ borderColor: colors.cardBorder, backgroundColor: colors.bgLight, color: colors.textDark }}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowResolve(false); setResolutionNote(""); }}
                      className="px-4 py-2 text-sm font-medium rounded-lg border"
                      style={{ borderColor: colors.cardBorder, color: colors.textDark }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResolve}
                      disabled={resolving}
                      className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:brightness-110 disabled:opacity-50"
                      style={{ background: "linear-gradient(95deg, #02C39A, #028090)" }}
                    >
                      {resolving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      {resolving ? "Resolving..." : "Confirm Resolve"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await getMyAssignedComplaints();
      setComplaints(res.data || []);
    } catch {
      toast.error("Could not load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const filtered = filter === "all" ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-2xl sm:text-3xl flex items-center gap-2"
          style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
        >
          <ShieldCheck size={26} color={colors.primaryTeal} /> My Assigned Complaints
        </h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          View and resolve complaints assigned to you.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => {
          const active = filter === s;
          const meta = STATUS_META[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? colors.primaryTeal : colors.cardTint,
                color: active ? "#FFF" : colors.textMuted,
                border: `1px solid ${active ? colors.primaryTeal : colors.cardBorder}`,
              }}
            >
              {s === "all" ? "All" : meta?.label || s}
            </button>
          );
        })}
      </div>

      {/* Complaints list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#DFF7F1" }}
          >
            <ShieldCheck size={24} color={colors.mint} />
          </div>
          <p className="text-sm font-medium" style={{ color: colors.textDark }}>
            No complaints assigned
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            {filter === "all" ? "No complaints have been assigned to you yet." : `No ${filter.replace("_", " ")} complaints.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ComplaintCard key={c.id} complaint={c} onUpdate={loadComplaints} />
          ))}
        </div>
      )}
    </div>
  );
}
