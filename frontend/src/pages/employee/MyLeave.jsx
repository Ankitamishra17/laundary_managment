import { useEffect, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Plus,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { applyLeave, getMyLeaves } from "../../api/leaveApi";

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

const LEAVE_TYPES = [
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "paid", label: "Paid Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "other", label: "Other" },
];

const STATUS_META = {
  pending: { label: "Pending", icon: Clock, bg: "#FFF8E7", color: "#9A6A12" },
  approved: { label: "Approved", icon: CheckCircle2, bg: "#DFF7F1", color: "#0B6E63" },
  rejected: { label: "Rejected", icon: XCircle, bg: "#FBE9E8", color: "#B3261E" },
};

function LeaveCard({ leave }) {
  const meta = STATUS_META[leave.status] || STATUS_META.pending;
  const Icon = meta.icon;
  const days = (() => {
    const s = new Date(leave.start_date);
    const e = new Date(leave.end_date);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  })();

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-bold capitalize"
              style={{ color: colors.textDark }}
            >
              {LEAVE_TYPES.find((t) => t.value === leave.leave_type)?.label || leave.leave_type}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              <Icon size={11} /> {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: colors.textMuted }}>
            <CalendarDays size={13} />
            {leave.start_date} → {leave.end_date}
            <span className="font-medium" style={{ color: colors.textDark }}>
              ({days} day{days > 1 ? "s" : ""})
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: colors.textDark }}>
        {leave.reason}
      </p>
      {leave.admin_remark && (
        <div
          className="mt-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: leave.status === "approved" ? "#F0FBF6" : "#FDF2F0" }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: leave.status === "approved" ? "#0B6E63" : "#B3261E" }}>
            Admin remark
          </div>
          <p className="text-sm" style={{ color: colors.textDark }}>
            {leave.admin_remark}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MyLeave() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const res = await getMyLeaves();
      setLeaves(res.data || []);
    } catch {
      toast.error("Could not load leaves.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date || !form.reason.trim()) {
      return toast.error("Please fill in all required fields.");
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      return toast.error("End date cannot be before start date.");
    }
    setSubmitting(true);
    try {
      await applyLeave({
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason.trim(),
      });
      toast.success("Leave request submitted!");
      setShowForm(false);
      setForm({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
            >
              <CalendarDays size={18} className="text-white" />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl"
                style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
              >
                My Leaves
              </h1>
              <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
                Apply for leave and track your requests.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.97] transition-all"
            style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
          >
            <Plus size={16} /> Apply for Leave
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total Requests", value: leaves.length, color: "#028090", bg: "#DFF3F5" },
            { label: "Pending", value: pendingCount, color: "#9A6A12", bg: "#FBF0DC" },
            { label: "Approved", value: approvedCount, color: "#02C39A", bg: "#DFF7F1" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border rounded-2xl p-4 sm:p-5"
              style={{ borderColor: colors.cardBorder }}
            >
              <div className="text-[11px] sm:text-xs font-medium" style={{ color: colors.textMuted }}>
                {s.label}
              </div>
              <div
                className="text-xl sm:text-2xl mt-1"
                style={{ color: s.color, fontFamily: "'Libre Baskerville', serif" }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Apply form modal */}
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
                <h3 className="text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                  Apply for Leave
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
                    Leave Type
                  </label>
                  <select
                    name="leave_type"
                    value={form.leave_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
                  >
                    {LEAVE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                      Start Date <span style={{ color: colors.danger }}>*</span>
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={form.start_date}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                      style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                      End Date <span style={{ color: colors.danger }}>*</span>
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={form.end_date}
                      onChange={handleChange}
                      min={form.start_date}
                      required
                      className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                      style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
                    Reason <span style={{ color: colors.danger }}>*</span>
                  </label>
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    rows={3}
                    required
                    placeholder="Reason for leave..."
                    className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : (
                    <><CalendarDays size={16} /> Submit Request</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Leaves list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
          </div>
        ) : leaves.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl border"
            style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#EEF7F6" }}>
              <CalendarDays size={24} className="text-[#028090]" />
            </div>
            <p className="text-sm font-medium" style={{ color: colors.textDark }}>No leave requests yet</p>
            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
              Apply for leave when you need time off.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave) => (
              <LeaveCard key={leave.id} leave={leave} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
