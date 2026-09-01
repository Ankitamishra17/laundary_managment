import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  X,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";
import { getShopLeaves, reviewLeave, getLeaveStats } from "../../api/leaveApi";

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
  danger: "#E0645C",
};

const LEAVE_TYPE_LABELS = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  paid: "Paid Leave",
  unpaid: "Unpaid Leave",
  other: "Other",
};

const STATUS_META = {
  pending: { label: "Pending", icon: Clock, bg: "#FFF8E7", color: "#9A6A12" },
  approved: { label: "Approved", icon: CheckCircle2, bg: "#DFF7F1", color: "#0B6E63" },
  rejected: { label: "Rejected", icon: XCircle, bg: "#FBE9E8", color: "#B3261E" },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div
      className="bg-white border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4"
      style={{ borderColor: colors.cardBorder }}
    >
      <div
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon size={20} style={{ color }} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] sm:text-xs font-medium truncate" style={{ color: colors.textMuted }}>{label}</div>
        <div className="text-xl sm:text-2xl mt-0.5" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ leave, onClose, onReviewed }) {
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const meta = STATUS_META[leave.status] || STATUS_META.pending;
  const days = (() => {
    const s = new Date(leave.start_date);
    const e = new Date(leave.end_date);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  })();

  const handleReview = async (status) => {
    setLoading(true);
    try {
      await reviewLeave(leave.id, { status, admin_remark: remark.trim() || undefined });
      toast.success(`Leave ${status} successfully.`);
      onReviewed?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to review leave.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(5,40,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
            Review Leave Request
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.cardTint }}>
            <X size={16} color={colors.textDark} />
          </button>
        </div>

        {/* Employee info */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: colors.cardBorder }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.cardTint }}>
            <User size={18} color={colors.primaryTeal} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: colors.textDark }}>{leave.employee?.name || "Employee"}</div>
            <div className="text-xs" style={{ color: colors.textMuted }}>{leave.employee?.designation || "Staff"}</div>
          </div>
        </div>

        {/* Leave details */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.textMuted }}>Type</span>
            <span className="font-medium" style={{ color: colors.textDark }}>
              {LEAVE_TYPE_LABELS[leave.leave_type] || leave.leave_type}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.textMuted }}>Duration</span>
            <span className="font-medium" style={{ color: colors.textDark }}>
              {leave.start_date} → {leave.end_date} ({days} day{days > 1 ? "s" : ""})
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.textMuted }}>Status</span>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              <meta.icon size={11} /> {meta.label}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: colors.textMuted }}>Reason</div>
          <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: colors.cardTint, color: colors.textDark }}>
            {leave.reason}
          </p>
        </div>

        {/* Admin remark */}
        <div className="mb-5">
          <label className="block text-[13px] font-medium mb-1.5" style={{ color: colors.textDark }}>
            Admin Remark (optional)
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
            placeholder="Add a remark for the employee..."
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none resize-none"
            style={{ borderColor: colors.cardBorder, backgroundColor: colors.cardTint, color: colors.textDark }}
          />
        </div>

        {leave.status === "pending" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleReview("approved")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: "#02C39A" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Approve
            </button>
            <button
              onClick={() => handleReview("rejected")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: colors.danger }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Reject
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
            style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

function LeaveRow({ leave, onReview }) {
  const meta = STATUS_META[leave.status] || STATUS_META.pending;
  const days = (() => {
    const s = new Date(leave.start_date);
    const e = new Date(leave.end_date);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  })();

  return (
    <tr
      className="border-b last:border-0 hover:bg-[#FAFDFC] transition-colors cursor-pointer"
      style={{ borderColor: colors.cardBorder }}
      onClick={() => onReview(leave)}
    >
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.cardTint }}>
            <User size={14} color={colors.primaryTeal} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: colors.textDark }}>{leave.employee?.name || "—"}</div>
            <div className="text-[11px]" style={{ color: colors.textMuted }}>{leave.employee?.designation || ""}</div>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-5">
        <span className="text-sm font-medium capitalize" style={{ color: colors.textDark }}>
          {LEAVE_TYPE_LABELS[leave.leave_type] || leave.leave_type}
        </span>
      </td>
      <td className="py-3.5 px-5 text-sm" style={{ color: colors.textMuted }}>
        {leave.start_date} → {leave.end_date}
      </td>
      <td className="py-3.5 px-5 text-sm font-medium" style={{ color: colors.textDark }}>
        {days} day{days > 1 ? "s" : ""}
      </td>
      <td className="py-3.5 px-5">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: meta.bg, color: meta.color }}
        >
          <meta.icon size={11} /> {meta.label}
        </span>
      </td>
      <td className="py-3.5 px-5">
        <div className="text-[11px] truncate max-w-[200px]" style={{ color: colors.textMuted }}>
          {leave.reason}
        </div>
      </td>
    </tr>
  );
}

export default function LeaveReview() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leavesRes, statsRes] = await Promise.allSettled([
        getShopLeaves(),
        getLeaveStats(),
      ]);
      if (leavesRes.status === "fulfilled") setLeaves(leavesRes.value.data || []);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data || {});
    } catch {
      toast.error("Could not load leave data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = filter === "all" ? leaves : leaves.filter((l) => l.status === filter);

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
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
              Leave Requests
            </h1>
            <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
              Review and manage employee leave requests.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={CalendarDays} label="Total" value={stats.total || 0} color="#028090" bg="#DFF3F5" />
          <StatCard icon={Clock} label="Pending" value={stats.pending || 0} color="#9A6A12" bg="#FBF0DC" />
          <StatCard icon={CheckCircle2} label="Approved" value={stats.approved || 0} color="#02C39A" bg="#DFF7F1" />
          <StatCard icon={XCircle} label="Rejected" value={stats.rejected || 0} color="#E0645C" bg="#FBE9E8" />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1 p-1 bg-[#EEF7F6] rounded-xl w-fit">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === tab.key
                    ? "bg-white text-[#028090] shadow-sm"
                    : "text-[#6B8482] hover:text-[#028090] hover:bg-white/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {!loading && (
            <span className="text-xs" style={{ color: colors.textMuted }}>
              {filtered.length} request{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden" style={{ borderColor: colors.cardBorder }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#EEF7F6" }}>
                <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
              </div>
              <p className="text-sm font-medium" style={{ color: colors.textDark }}>No leave requests found</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                {filter === "all" ? "No leave requests yet." : `No ${filter} requests.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: colors.cardBorder, backgroundColor: "#FAFDFC" }}>
                    {["Employee", "Type", "Duration", "Days", "Status", "Reason"].map((h) => (
                      <th key={h} className="text-left font-semibold text-[11px] uppercase tracking-wide py-3.5 px-5" style={{ color: colors.textMuted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((leave) => (
                    <LeaveRow key={leave.id} leave={leave} onReview={setSelectedLeave} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      {selectedLeave && (
        <ReviewModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
          onReviewed={loadData}
        />
      )}
    </div>
  );
}
