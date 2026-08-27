import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  MessageSquare,
  Send,
  Loader2,
  Inbox,
  UserPlus,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getShopComplaints,
  getComplaintStats,
  updateComplaintStatus,
  assignComplaint,
  adminReplyToComplaint,
} from "../../api/complaintApi";
import { useEmployees } from "../../hooks/useEmployees";

const C = {
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
  primaryTeal: "#028090",
  mint: "#02C39A",
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
  open: { label: "Open", color: C.danger, bg: "#FDECEC", icon: AlertTriangle },
  in_progress: { label: "In Progress", color: C.amber, bg: "#FBF0DC", icon: Clock },
  resolved: { label: "Resolved", color: "#0B6E63", bg: "#DFF7F1", icon: CheckCircle2 },
  closed: { label: "Closed", color: C.textMuted, bg: C.cardTint, icon: XCircle },
};

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border p-5 sm:p-6 ${className}`} style={{ backgroundColor: C.bgLight, borderColor: C.cardBorder }}>
    {children}
  </div>
);

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const { employees } = useEmployees();

  const load = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const [complaintsRes, statsRes] = await Promise.all([
        getShopComplaints(params),
        getComplaintStats(),
      ]);
      setComplaints(complaintsRes?.data || []);
      setStats(statsRes?.data || null);
    } catch (err) {
      toast.error("Could not load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleStatus = async (id, status) => {
    try {
      await updateComplaintStatus(id, status);
      toast.success("Status updated.");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handleAssign = async (complaintId, employeeId) => {
    try {
      await assignComplaint(complaintId, Number(employeeId));
      toast.success("Complaint assigned.");
      setAssignTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign.");
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await adminReplyToComplaint(replyTarget.id, replyText.trim());
      toast.success("Reply sent.");
      setReplyTarget(null);
      setReplyText("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply.");
    } finally {
      setReplying(false);
    }
  };

  const filtered = statusFilter === "all"
    ? complaints
    : complaints.filter((c) => c.status === statusFilter);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl flex items-center gap-2" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          <AlertTriangle size={26} color={C.primaryTeal} /> Complaints
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
          Manage and resolve customer complaints.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Open", value: stats.open, color: C.danger, icon: AlertTriangle },
            { label: "In Progress", value: stats.inProgress, color: C.amber, icon: Clock },
            { label: "Resolved", value: stats.resolved, color: "#0B6E63", icon: CheckCircle2 },
            { label: "Closed", value: stats.closed, color: C.textMuted, icon: XCircle },
          ].map((s) => (
            <Card key={s.label}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: s.color + "1F" }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div className="mt-3 text-2xl" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>{s.value}</div>
              <div className="text-xs" style={{ color: C.textMuted }}>{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => {
          const active = statusFilter === s;
          const meta = STATUS_META[s];
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{ backgroundColor: active ? C.primaryTeal : C.cardTint, color: active ? "#FFF" : C.textMuted, border: `1px solid ${active ? C.primaryTeal : C.cardBorder}` }}>
              {s === "all" ? "All" : meta?.label || s}
            </button>
          );
        })}
      </div>

      {/* Complaints list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin" style={{ color: C.primaryTeal }} />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: C.cardTint }}>
              <Inbox size={24} color={C.primaryTeal} />
            </div>
            <p className="text-sm font-medium" style={{ color: C.textDark }}>No complaints</p>
            <p className="text-xs mt-1" style={{ color: C.textMuted }}>Customer complaints will appear here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const sm = STATUS_META[c.status] || STATUS_META.open;
            const isOpen = expanded === c.id;
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>
                        {sm.label}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: C.cardTint, color: C.primaryTeal }}>
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                      <span className="text-xs" style={{ color: C.textMuted }}>
                        #{c.id} &middot; {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold" style={{ color: C.textDark }}>{c.subject}</h3>
                    <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                      {c.customer?.name || "Customer"} &middot; Order #{c.order_id || "N/A"}
                    </p>

                    {isOpen && (
                      <div className="mt-3">
                        <p className="text-sm" style={{ color: C.textDark }}>{c.description}</p>
                        {c.assignedEmployee && (
                          <p className="text-xs mt-2" style={{ color: C.textMuted }}>Assigned to: <span className="font-semibold" style={{ color: C.textDark }}>{c.assignedEmployee.name}</span></p>
                        )}

                        {/* Replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {c.replies.map((r) => (
                              <div key={r.id} className={`rounded-xl p-3 text-sm ${r.is_admin ? "ml-4" : ""}`}
                                style={{ backgroundColor: r.is_admin ? C.cardTint : "#F5F5F5" }}>
                                <div className="text-[10px] font-semibold mb-1" style={{ color: r.is_admin ? C.primaryTeal : C.textMuted }}>
                                  {r.is_admin ? "Admin" : c.customer?.name || "Customer"}
                                </div>
                                <p style={{ color: C.textDark }}>{r.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => setExpanded(isOpen ? null : c.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: C.cardTint, color: C.primaryTeal, border: `1px solid ${C.cardBorder}` }}>
                      {isOpen ? "Less" : "Details"}
                    </button>
                  </div>
                </div>

                {/* Action bar when expanded */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-2" style={{ borderColor: C.cardBorder }}>
                    {/* Status update */}
                    <select
                      value={c.status}
                      onChange={(e) => handleStatus(c.id, e.target.value)}
                      className="text-xs font-semibold rounded-lg px-3 py-1.5 border cursor-pointer"
                      style={{ borderColor: C.cardBorder, backgroundColor: C.cardTint, color: C.textDark }}>
                      {Object.entries(STATUS_META).map(([key, meta]) => (
                        <option key={key} value={key}>{meta.label}</option>
                      ))}
                    </select>

                    {/* Assign */}
                    <button onClick={() => setAssignTarget(c)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition hover:brightness-110"
                      style={{ borderColor: C.cardBorder, color: C.primaryTeal, backgroundColor: C.cardTint }}>
                      <UserPlus size={12} /> Assign
                    </button>

                    {/* Reply */}
                    <button onClick={() => { setReplyTarget(c); setReplyText(""); }}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:brightness-110"
                      style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}>
                      <Send size={12} /> Reply
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReplyTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-[0_20px_50px_rgba(5,40,42,0.25)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-3" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>Reply to Complaint</h2>
            <p className="text-xs mb-3" style={{ color: C.textMuted }}>{replyTarget.customer?.name} &middot; {replyTarget.subject}</p>
            <form onSubmit={handleReply}>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="Write your reply..."
                className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none outline-none focus:border-[#028090]"
                style={{ borderColor: C.cardBorder, backgroundColor: C.cardTint, color: C.textDark }} required />
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setReplyTarget(null)} className="flex-1 rounded-xl py-2.5 text-sm font-medium border" style={{ borderColor: C.cardBorder, color: C.textDark }}>Cancel</button>
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

      {/* Assign Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAssignTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-[0_20px_50px_rgba(5,40,42,0.25)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-4" style={{ color: C.textDark, fontFamily: "'Libre Baskerville', serif" }}>Assign Complaint</h2>
            <select
              id="assign-employee"
              defaultValue=""
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#028090]"
              style={{ borderColor: C.cardBorder, backgroundColor: C.cardTint, color: C.textDark }}>
              <option value="" disabled>Select employee</option>
              {employees.filter((e) => e.status === "active").map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}{emp.designation ? ` — ${emp.designation}` : ""}</option>
              ))}
            </select>
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setAssignTarget(null)} className="flex-1 rounded-xl py-2.5 text-sm font-medium border" style={{ borderColor: C.cardBorder, color: C.textDark }}>Cancel</button>
              <button type="button" onClick={() => {
                const sel = document.getElementById("assign-employee");
                if (sel.value) handleAssign(assignTarget.id, sel.value);
                else toast.error("Select an employee.");
              }} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}>
                <UserPlus size={14} /> Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
