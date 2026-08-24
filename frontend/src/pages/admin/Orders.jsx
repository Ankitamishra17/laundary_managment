import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Package,
  ClipboardList,
  Truck,
  PackageCheck,
  XCircle,
  IndianRupee,
  RefreshCw,
  ChevronDown,
  Phone,
  MapPin,
  Store,
  CalendarDays,
  User as UserIcon,
  UserPlus,
  Loader2,
  X,
} from "lucide-react";
import {
  getShopOrders,
  getOrderStats,
  updateOrderStatus,
  updateOrderPaymentStatus,
} from "../../api/orderApi";
import { taskApi } from "../../api/taskApi";
import { useEmployees } from "../../hooks/useEmployees";
import { statusMeta, formatINR, formatDateTime, formatDate } from "../../utils/orderStatus";

const COLORS = {
  dark: "#05282A",
  primary: "#028090",
  accent: "#02C39A",
  light: "#EEF7F6",
  border: "#D8ECEA",
  muted: "#5C7A78",
};

const ORDER_STATUSES = [
  "pending",
  "picked_up",
  "processing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES = ["unpaid", "paid", "partial"];

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry Cleaning",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPE_LABEL).map(([value, label]) => ({ value, label }));

const TASK_SEQUENCE = ["pickup", "wash", "dry", "iron", "pack", "delivery"];

const TASK_STATUS_META = {
  pending: { label: "Pending", color: "#9A6A12", bg: "#FBF0DC" },
  in_progress: { label: "In Progress", color: "#028090", bg: "#DFF3F5" },
  completed: { label: "Completed", color: "#02C39A", bg: "#DFF7F1" },
};

/* ------------------------------------------------------------------ */
/* Task Assignment Table — shows which employee handles which task     */
/* ------------------------------------------------------------------ */
function TaskAssignmentTable({ orderId, tasks, onReassign, onRefresh }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-xs py-3" style={{ color: COLORS.muted }}>
        No tasks assigned yet.
      </div>
    );
  }

  // Sort by sequence
  const sorted = [...tasks].sort(
    (a, b) => TASK_SEQUENCE.indexOf(a.task_type) - TASK_SEQUENCE.indexOf(b.task_type),
  );

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: COLORS.muted }}>
        Task Assignments
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: COLORS.border }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: COLORS.light, borderBottom: `1px solid ${COLORS.border}` }}>
              <th className="text-left font-semibold px-3 py-2" style={{ color: COLORS.muted }}>Task</th>
              <th className="text-left font-semibold px-3 py-2" style={{ color: COLORS.muted }}>Employee</th>
              <th className="text-left font-semibold px-3 py-2" style={{ color: COLORS.muted }}>Status</th>
              <th className="text-right font-semibold px-3 py-2" style={{ color: COLORS.muted }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const sm = TASK_STATUS_META[t.status] || TASK_STATUS_META.pending;
              return (
                <tr key={t.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color: COLORS.dark }}>
                    {TASK_TYPE_LABEL[t.task_type] || t.task_type}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium" style={{ color: COLORS.dark }}>
                      {t.employee?.name || "—"}
                    </div>
                    {t.employee?.designation && (
                      <div style={{ color: COLORS.muted }}>{t.employee.designation}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: sm.bg, color: sm.color }}
                    >
                      {sm.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {t.status !== "completed" ? (
                      <button
                        onClick={() => onReassign(t)}
                        className="text-[10px] font-semibold px-2 py-1 rounded-md transition hover:brightness-110"
                        style={{ backgroundColor: COLORS.light, color: COLORS.primary, border: `1px solid ${COLORS.border}` }}
                      >
                        Reassign
                      </button>
                    ) : (
                      <span className="text-[10px]" style={{ color: COLORS.muted }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ReassignModal — change which employee handles a task               */
/* ------------------------------------------------------------------ */
function ReassignModal({ task, employees, employeesLoading, onClose, onReassigned }) {
  const [selectedId, setSelectedId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    setError("");
    try {
      const updated = await taskApi.reassignTask(task.id, Number(selectedId));
      toast.success(updated?.message || "Task reassigned successfully.");
      onReassigned?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reassign task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: COLORS.dark }}>
              Reassign {TASK_TYPE_LABEL[task.task_type] || task.task_type}
            </h2>
            {task.order_id && (
              <p className="text-xs mt-1" style={{ color: COLORS.muted }}>Order #{task.order_id}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: COLORS.light, border: `1px solid ${COLORS.border}`, color: COLORS.dark }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: COLORS.light, color: COLORS.muted }}>
          Currently assigned to: <span className="font-semibold" style={{ color: COLORS.dark }}>{task.employee?.name || "—"}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium mb-1.5" style={{ color: COLORS.dark }}>
              New Employee <span style={{ color: "#B3261E" }}>*</span>
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              disabled={employeesLoading}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.light, color: COLORS.dark }}
            >
              <option value="" disabled>
                {employeesLoading ? "Loading…" : "Select employee"}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}{emp.designation ? ` — ${emp.designation}` : ""}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "#FBE9E8", color: "#B3261E" }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors" style={{ backgroundColor: COLORS.light, color: COLORS.dark, border: `1px solid ${COLORS.border}` }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedId}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Reassigning…</> : "Reassign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const fieldCls =
  "w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition";

/* ------------------------------------------------------------------ */
/* Assign Task Modal — assign an employee to handle this order         */
/* ------------------------------------------------------------------ */
function AssignTaskModal({ order, onClose, onAssigned }) {
  const { employees, loading: employeesLoading } = useEmployees();
  const [form, setForm] = useState({
    employee_id: "",
    priority: "normal",
    scheduled_time: "",
    notes: "",
  });
  const [selectedTypes, setSelectedTypes] = useState(["pickup", "wash", "iron", "delivery"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!order) return null;

  const customerAddress = [order.customer?.address, order.customer?.city]
    .filter(Boolean)
    .join(", ");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (selectedTypes.length === 0) {
      setError("Please select at least one task type.");
      return;
    }
    setSubmitting(true);
    try {
      await taskApi.assignTask({
        order_id: order.id,
        employee_id: Number(form.employee_id),
        task_types: selectedTypes,
        priority: form.priority,
        scheduled_time: form.scheduled_time,
        customer_name: order.customer?.name,
        customer_phone: order.customer?.phone,
        customer_address: customerAddress || order.pickup_address,
        notes: form.notes || null,
      });
      toast.success(`${selectedTypes.length} task(s) assigned to employee.`, { duration: 4000 });
      onAssigned?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2
              className="text-2xl text-[#0F2C2E] leading-tight"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Assign task · Order #{order.id}
            </h2>
            <p className="text-[13px] text-[#5A7A79] mt-1">
              {order.customer?.name || "Customer"}
              {order.customer?.phone ? ` · ${order.customer.phone}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center hover:bg-[#DFF3F5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="mb-5 rounded-xl px-4 py-3 text-[13px]"
          style={{ backgroundColor: "#EEF7F6", color: "#0F2C2E" }}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-1" style={{ color: "#028090" }}>
            <MapPin size={12} /> Pickup address
          </div>
          <span className="text-xs" style={{ color: "#5A7A79" }}>
            {order.pickup_address || "—"}
          </span>
          {customerAddress && (
            <>
              <div className="flex items-center gap-1.5 text-xs font-semibold mt-2 mb-1" style={{ color: "#028090" }}>
                <MapPin size={12} /> Delivery address
              </div>
              <span className="text-xs" style={{ color: "#5A7A79" }}>{customerAddress}</span>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">
              Assign To <span className="text-[#B3261E]">*</span>
            </label>
            <select
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              required
              disabled={employeesLoading}
              className={fieldCls}
            >
              <option value="" disabled>
                {employeesLoading ? "Loading employees…" : "Select an employee"}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                  {emp.designation ? ` — ${emp.designation}` : ""}
                  {emp.status === "inactive" ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0F2C2E] mb-2">
              Tasks to Assign <span className="text-[#B3261E]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TASK_TYPE_OPTIONS.map((opt) => {
                const checked = selectedTypes.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium cursor-pointer transition-all ${
                      checked
                        ? "border-[#028090] bg-[#DFF3F5] text-[#028090]"
                        : "border-[#D8ECEA] bg-white text-[#6B8482] hover:border-[#A9C9C6]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedTypes((prev) =>
                          checked
                            ? prev.filter((t) => t !== opt.value)
                            : [...prev, opt.value]
                        );
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked ? "border-[#028090] bg-[#028090]" : "border-[#D8ECEA]"
                      }`}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {opt.label}
                  </label>
                );
              })}
            </div>
            {selectedTypes.length > 1 && (
              <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-[#6B8482]">
                <span className="font-medium">Order:</span>
                {selectedTypes.map((t, i) => (
                  <span key={t} className="inline-flex items-center gap-1">
                    {i > 0 && <span className="text-[#A9C9C6]">→</span>}
                    <span className="px-1.5 py-0.5 rounded bg-[#EEF7F6] text-[#028090] font-medium">
                      {TASK_TYPE_LABEL[t] || t}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className={fieldCls}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Scheduled Date &amp; Time *</label>
            <input
              name="scheduled_time"
              type="datetime-local"
              value={form.scheduled_time}
              onChange={handleChange}
              required
              className={fieldCls}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Any special instructions…"
              className={`${fieldCls} resize-none`}
            />
          </div>

          {error && (
            <div className="text-[13px] text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition hover:brightness-105 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Assigning…
              </>
            ) : (
              <>
                <UserPlus size={16} /> Assign Task
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [assignOrder, setAssignOrder] = useState(null);
  const [orderTasks, setOrderTasks] = useState([]);
  const [reassignTarget, setReassignTarget] = useState(null);
  const { employees, loading: employeesLoading } = useEmployees();

  const load = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        getShopOrders(),
        getOrderStats(),
      ]);
      setOrders(ordersRes?.data || []);
      setStats(statsRes?.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Fetch tasks when an order is expanded
  useEffect(() => {
    if (!expanded) { setOrderTasks([]); return; }
    let cancelled = false;
    taskApi.getOrderTasks(expanded)
      .then((data) => { if (!cancelled) setOrderTasks(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setOrderTasks([]); });
    return () => { cancelled = true; };
  }, [expanded]);

  const handleStatus = async (id, status) => {
    try {
      const res = await updateOrderStatus(id, status);
      if (res.success) {
        toast.success("Order status updated.");
        load();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update status.");
    }
  };

  const handlePayment = async (id, payment_status) => {
    try {
      const res = await updateOrderPaymentStatus(id, payment_status);
      if (res.success) {
        toast.success("Payment status updated.");
        load();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update payment status.");
    }
  };

  // ---- Stats ----
  const byStatus = {};
  (stats?.byStatus || []).forEach((s) => {
    byStatus[s.status] = s.count;
  });

  const inProgressCount =
    (byStatus.picked_up || 0) +
    (byStatus.processing || 0) +
    (byStatus.ready_for_delivery || 0) +
    (byStatus.out_for_delivery || 0);

  const cards = [
    { title: "Total Orders", value: stats?.totalOrders ?? orders.length, icon: Package },
    { title: "Pending", value: byStatus.pending || 0, icon: ClipboardList },
    { title: "In Progress", value: inProgressCount, icon: Truck },
    { title: "Delivered", value: byStatus.delivered || 0, icon: PackageCheck },
    { title: "Cancelled", value: byStatus.cancelled || 0, icon: XCircle },
    {
      title: "Revenue (delivered)",
      value: formatINR(
        orders
          .filter((o) => o.status === "delivered")
          .reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
      ),
      icon: IndianRupee,
    },
  ];

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const selectStyle = {
    backgroundColor: COLORS.light,
    color: COLORS.dark,
    borderColor: COLORS.border,
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "10px",
    padding: "6px 8px",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div className="min-h-screen bg-white p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ===================== HEADER ===================== */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "'Libre Baskerville', serif", color: COLORS.dark }}>
            Orders
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
            Manage customer orders from pickup to delivery.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shrink-0 transition hover:opacity-90"
          style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* ===================== SUMMARY CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl p-5 border"
              style={{ borderColor: COLORS.border, backgroundColor: "#FFFFFF" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: COLORS.light, color: COLORS.primary }}
              >
                <Icon size={21} />
              </div>
              <p className="text-2xl font-semibold mt-4 truncate" style={{ color: COLORS.dark }}>
                {loading ? "—" : card.value}
              </p>
              <p className="text-sm mt-1" style={{ color: COLORS.muted }}>{card.title}</p>
            </div>
          );
        })}
      </div>

      {/* ===================== FILTERS ===================== */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {["all", ...ORDER_STATUSES].map((status) => {
          const active = statusFilter === status;
          const meta = status === "all" ? { label: "All" } : statusMeta(status);
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? COLORS.primary : COLORS.light,
                color: active ? "#FFFFFF" : COLORS.muted,
                border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* ===================== ORDERS TABLE ===================== */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[#028090] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: COLORS.border, backgroundColor: "#FFFFFF" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS.light }}>
            <Package size={24} color={COLORS.primary} />
          </div>
          <p className="text-sm" style={{ color: COLORS.muted }}>
            No orders{statusFilter !== "all" ? ` with status "${statusMeta(statusFilter).label}"` : ""} yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: COLORS.border }}>
          <table className="w-full text-sm min-w-[900px]" style={{ backgroundColor: "#FFFFFF" }}>
            <thead>
              <tr className="text-left" style={{ color: COLORS.muted, borderBottom: `1px solid ${COLORS.border}` }}>
                <th className="font-medium px-5 py-3">Order</th>
                <th className="font-medium px-5 py-3">Customer</th>
                <th className="font-medium px-5 py-3">Laundry</th>
                <th className="font-medium px-5 py-3">Items</th>
                <th className="font-medium px-5 py-3">Total</th>
                <th className="font-medium px-5 py-3">Payment</th>
                <th className="font-medium px-5 py-3">Status</th>
                <th className="font-medium px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const meta = statusMeta(o.status);
                const isOpen = expanded === o.id;
                return (
                  <React.Fragment key={o.id}>
                    <tr
                      className="transition-colors cursor-pointer"
                      style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        backgroundColor: isOpen ? COLORS.light : "#FFFFFF",
                      }}
                      onClick={() => setExpanded(isOpen ? null : o.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold" style={{ color: COLORS.dark }}>#{o.id}</div>
                        <div className="text-xs mt-0.5" style={{ color: COLORS.muted }}>{formatDateTime(o.createdAt)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium flex items-center gap-1.5" style={{ color: COLORS.dark }}>
                          <UserIcon size={13} style={{ color: COLORS.primary }} />
                          {o.customer?.name || "—"}
                        </div>
                        <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: COLORS.muted }}>
                          <Phone size={11} /> {o.customer?.phone || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5" style={{ color: COLORS.dark }}>
                          <Store size={13} style={{ color: COLORS.primary }} />
                          {o.shop?.name || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: COLORS.light, color: COLORS.primary }}
                        >
                          {(o.items || []).length} item{(o.items || []).length === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold" style={{ color: COLORS.dark }}>{formatINR(o.total_amount)}</td>
                      <td className="px-5 py-4">
                        <select
                          value={o.payment_status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handlePayment(o.id, e.target.value)}
                          style={selectStyle}
                        >
                          {PAYMENT_STATUSES.map((p) => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative">
                          <select
                            value={o.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStatus(o.id, e.target.value)}
                            style={{
                              ...selectStyle,
                              backgroundColor: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.color}44`,
                              paddingRight: "24px",
                              appearance: "none",
                            }}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{statusMeta(s).label}</option>
                            ))}
                          </select>
                          <ChevronDown
                            size={12}
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                            style={{ color: meta.color }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {o.status !== "delivered" && o.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignOrder(o);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:brightness-110"
                              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
                              title="Assign an employee to this order"
                            >
                              <UserPlus size={13} /> Assign
                            </button>
                          )}
                          <ChevronDown
                            size={16}
                            className="inline-block transition-transform"
                            style={{ color: COLORS.muted, transform: isOpen ? "rotate(180deg)" : "none" }}
                          />
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td colSpan={8} className="px-5 py-5" style={{ backgroundColor: COLORS.light }}>
                          <div className="grid lg:grid-cols-3 gap-5">
                            {/* Items */}
                            <div>
                              <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: COLORS.muted }}>
                                Services / Items
                              </div>
                              <div className="space-y-1.5">
                                {(o.items || []).map((item) => (
                                  <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                                    <span style={{ color: COLORS.dark }}>
                                      {item.item_label ? `${item.item_label} · ${item.name}` : item.name}
                                      <span style={{ color: COLORS.muted }}> × {item.quantity}</span>
                                    </span>
                                    <span className="font-medium" style={{ color: COLORS.dark }}>{formatINR(item.lineTotal)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Pickup / delivery */}
                            <div>
                              <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: COLORS.muted }}>
                                Pickup &amp; Delivery
                              </div>
                              <div className="space-y-2 text-xs" style={{ color: COLORS.dark }}>
                                <div className="flex items-start gap-1.5">
                                  <CalendarDays size={13} className="mt-0.5 flex-shrink-0" style={{ color: COLORS.primary }} />
                                  <span>
                                    Pickup {formatDate(o.pickup_date)}{o.pickup_time ? ` · ${o.pickup_time}` : ""}
                                    {o.pickup_address ? ` — ${o.pickup_address}` : ""}
                                  </span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color: COLORS.primary }} />
                                  <span>Delivery{o.delivery_address ? ` — ${o.delivery_address}` : ""}</span>
                                </div>
                                {o.delivery_note && (
                                  <div className="text-xs" style={{ color: COLORS.muted }}>Note: {o.delivery_note}</div>
                                )}
                              </div>
                            </div>

                            {/* Customer */}
                            <div>
                              <div className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: COLORS.muted }}>
                                Customer
                              </div>
                              <div className="space-y-2 text-xs" style={{ color: COLORS.dark }}>
                                <div className="font-medium">{o.customer?.name || "—"}</div>
                                <div className="flex items-center gap-1.5">
                                  <Phone size={12} style={{ color: COLORS.primary }} /> {o.customer?.phone || "—"}
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <MapPin size={12} className="mt-0.5 flex-shrink-0" style={{ color: COLORS.primary }} />
                                  <span>
                                    {[o.customer?.address, o.customer?.city].filter(Boolean).join(", ") || "No address on file"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Store size={12} style={{ color: COLORS.primary }} /> {o.shop?.name || "—"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Task Assignments — full-width row below the 3-col grid */}
                          {expanded === o.id && (
                            <div className="mt-5 pt-5 border-t" style={{ borderColor: COLORS.border }}>
                              <TaskAssignmentTable
                                orderId={o.id}
                                tasks={orderTasks}
                                onReassign={(t) => setReassignTarget(t)}
                                onRefresh={() => {
                                  taskApi.getOrderTasks(o.id).then((d) => setOrderTasks(Array.isArray(d) ? d : []));
                                }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AssignTaskModal
        order={assignOrder}
        onClose={() => setAssignOrder(null)}
        onAssigned={load}
      />

      <ReassignModal
        task={reassignTarget}
        employees={employees}
        employeesLoading={employeesLoading}
        onClose={() => setReassignTarget(null)}
        onReassigned={() => {
          if (reassignTarget?.order_id) {
            taskApi.getOrderTasks(reassignTarget.order_id).then((d) => setOrderTasks(Array.isArray(d) ? d : []));
          }
          load();
        }}
      />
    </div>
  );
}
