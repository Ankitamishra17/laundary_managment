import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Plus,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  submitComplaint,
  getMyComplaints,
  customerReplyToComplaint,
} from "../../api/complaintApi";
import { getMyOrders } from "../../api/orderApi";

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

const CATEGORIES = [
  { value: "quality", label: "Quality Issue" },
  { value: "delay", label: "Delay" },
  { value: "damage", label: "Damage" },
  { value: "billing", label: "Billing" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

const STATUS_META = {
  open: { label: "Open", bg: "#FBE9E8", color: "#B3261E" },
  in_progress: { label: "In Progress", bg: "#FFF8E7", color: "#9A6A12" },
  resolved: { label: "Resolved", bg: "#DFF7F1", color: "#0B6E63" },
  closed: { label: "Closed", bg: "#EEF7F6", color: "#5C7A78" },
};

function ComplaintCard({ complaint, onReply }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const meta = STATUS_META[complaint.status] || STATUS_META.open;
  const replies = complaint.replies || [];

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await customerReplyToComplaint(complaint.id, replyText.trim());
      toast.success("Reply sent.");
      setReplyText("");
      onReply?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send reply.");
    } finally {
      setSending(false);
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
          <ShieldAlert size={18} color={meta.color} />
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
            <span className="capitalize">{complaint.category}</span>
            {complaint.order_id && <span>· Order #{complaint.order_id}</span>}
            <span>· {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
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
              <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${complaint.image_url}`} target="_blank" rel="noopener noreferrer">
                <img
                  src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${complaint.image_url}`}
                  alt="Complaint evidence"
                  className="h-32 rounded-lg object-cover border cursor-pointer hover:brightness-90 transition"
                  style={{ borderColor: colors.cardBorder }}
                />
              </a>
            </div>
          )}

          {/* Admin reply */}
          {complaint.admin_reply && (
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: colors.cardTint }}>
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: colors.primaryTeal }}>
                Shop reply
              </div>
              <p className="text-sm" style={{ color: colors.textDark }}>
                {complaint.admin_reply}
              </p>
            </div>
          )}

          {/* Thread */}
          {replies.length > 0 && (
            <div className="space-y-2">
              {replies.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl px-4 py-2.5"
                  style={{
                    backgroundColor: r.is_admin ? colors.cardTint : "#FAFDFC",
                    border: `1px solid ${r.is_admin ? colors.cardBorder : "transparent"}`,
                  }}
                >
                  <div className="text-[11px] font-semibold mb-0.5" style={{ color: r.is_admin ? colors.primaryTeal : colors.textMuted }}>
                    {r.is_admin ? "Shop" : "You"}
                  </div>
                  <p className="text-sm" style={{ color: colors.textDark }}>{r.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply form */}
          {complaint.status !== "closed" && (
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
        </div>
      )}
    </div>
  );
}

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // form state
  const [form, setForm] = useState({
    order_id: "",
    category: "",
    subject: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await getMyComplaints();
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

  const openForm = async () => {
    setShowForm(true);
    setOrdersLoading(true);
    try {
      const res = await getMyOrders();
      setOrders(res.data || []);
    } catch {
      // Non-critical
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5 MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.subject.trim() || !form.description.trim()) {
      return toast.error("Please fill in all required fields.");
    }
    setSubmitting(true);
    try {
      await submitComplaint(
        {
          order_id: form.order_id ? Number(form.order_id) : undefined,
          category: form.category,
          subject: form.subject.trim(),
          description: form.description.trim(),
        },
        imageFile,
      );
      toast.success("Complaint submitted.");
      setShowForm(false);
      setForm({ order_id: "", category: "", subject: "", description: "" });
      setImageFile(null);
      setImagePreview(null);
      loadComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit complaint.");
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
            My complaints
          </h2>
          <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
            Track and manage your support requests.
          </p>
        </div>
        <button
          onClick={openForm}
          className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          <Plus size={16} /> File complaint
        </button>
      </div>

      {/* Complaint form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(5,40,42,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <h3
                className="text-xl"
                style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
              >
                File a complaint
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
                  Related order (optional)
                </label>
                {ordersLoading ? (
                  <div className="flex items-center gap-2 py-3 text-sm" style={{ color: colors.textMuted }}>
                    <Loader2 size={14} className="animate-spin" /> Loading orders...
                  </div>
                ) : (
                  <select
                    name="order_id"
                    value={form.order_id}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
                  >
                    <option value="">No specific order</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>Order #{o.id} ({o.status})</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                  Category <span style={{ color: colors.danger }}>*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
                >
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                  Subject <span style={{ color: colors.danger }}>*</span>
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief summary of your issue"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                  Description <span style={{ color: colors.danger }}>*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                  Photo evidence (optional)
                </label>
                <label
                  className="flex items-center gap-3 w-full rounded-lg border px-3 py-3 text-sm cursor-pointer transition-colors hover:bg-white/50"
                  style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
                >
                  <Camera size={18} color={colors.primaryTeal} />
                  <span>{imageFile ? imageFile.name : "Choose an image (JPG, PNG, max 5 MB)"}</span>
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                </label>
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover border" style={{ borderColor: colors.cardBorder }} />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: colors.danger }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><AlertTriangle size={16} /> Submit complaint</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complaints list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
        </div>
      ) : complaints.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#DFF7F1" }}
          >
            <ShieldAlert size={24} color={colors.mint} />
          </div>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            No complaints filed yet.
          </p>
          <button
            onClick={openForm}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
          >
            <Plus size={15} /> File your first complaint
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} onReply={loadComplaints} />
          ))}
        </div>
      )}
    </div>
  );
}
