import React, { useEffect, useMemo, useState } from "react";
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
  AlertTriangle,
} from "lucide-react";
import {
  getShopOrders,
  getOrderStats,
  updateOrderStatus,
  updateOrderPaymentStatus,
} from "../../api/orderApi";
import { taskApi } from "../../api/taskApi";
import { useEmployees } from "../../hooks/useEmployees";
import {
  statusMeta,
  formatINR,
  formatDateTime,
  formatDate,
} from "../../utils/orderStatus";

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

const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

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
    (a, b) =>
      TASK_SEQUENCE.indexOf(a.task_type) - TASK_SEQUENCE.indexOf(b.task_type),
  );

  return (
    <div>
      <div
        className="text-[11px] uppercase tracking-wide font-semibold mb-2"
        style={{ color: COLORS.muted }}
      >
        Task Assignments
      </div>
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: COLORS.border }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr
              style={{
                backgroundColor: COLORS.light,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <th
                className="text-left font-semibold px-3 py-2"
                style={{ color: COLORS.muted }}
              >
                Task
              </th>
              <th
                className="text-left font-semibold px-3 py-2"
                style={{ color: COLORS.muted }}
              >
                Employee
              </th>
              <th
                className="text-left font-semibold px-3 py-2"
                style={{ color: COLORS.muted }}
              >
                Status
              </th>
              <th
                className="text-right font-semibold px-3 py-2"
                style={{ color: COLORS.muted }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const sm = TASK_STATUS_META[t.status] || TASK_STATUS_META.pending;
              return (
                <tr
                  key={t.id}
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <td
                    className="px-3 py-2.5 font-medium"
                    style={{ color: COLORS.dark }}
                  >
                    {TASK_TYPE_LABEL[t.task_type] || t.task_type}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium" style={{ color: COLORS.dark }}>
                      {t.employee?.name || "—"}
                    </div>
                    {t.employee?.designation && (
                      <div style={{ color: COLORS.muted }}>
                        {t.employee.designation}
                      </div>
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
                        style={{
                          backgroundColor: COLORS.light,
                          color: COLORS.primary,
                          border: `1px solid ${COLORS.border}`,
                        }}
                      >
                        Reassign
                      </button>
                    ) : (
                      <span
                        className="text-[10px]"
                        style={{ color: COLORS.muted }}
                      >
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
/* Conflict modal — used for assignment/reassignment conflicts        */
/* ------------------------------------------------------------------ */
function ConflictModal({ conflict, onClose, onConfirm, submitting = false }) {
  if (!conflict) return null;

  const conflicts = Array.isArray(conflict.conflicts) ? conflict.conflicts : [];
  const title =
    conflict.type === "reassign"
      ? "Employee Schedule Conflict"
      : "Schedule Conflict";

  return (
    <div
      className="fixed inset-0 z-[70] bg-[#05282A]/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-[0_20px_60px_rgba(5,40,42,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#FFF4DF", color: "#9A6A12" }}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3
              className="text-lg font-semibold"
              style={{ color: COLORS.dark }}
            >
              {title}
            </h3>
            <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
              The selected employee already has a task scheduled at the same
              time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: COLORS.light,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.dark,
            }}
          >
            <X size={15} />
          </button>
        </div>

        <div
          className="mt-5 rounded-xl border p-3"
          style={{ borderColor: "#F0D6A1", backgroundColor: "#FFF9EC" }}
        >
          {conflict.employeeName && (
            <div className="text-xs mb-1" style={{ color: COLORS.dark }}>
              <span className="font-semibold">Employee:</span>{" "}
              {conflict.employeeName}
            </div>
          )}
          {conflict.scheduledTime && (
            <div className="text-xs" style={{ color: COLORS.dark }}>
              <span className="font-semibold">Scheduled time:</span>{" "}
              {formatDateTime(conflict.scheduledTime)}
            </div>
          )}
        </div>

        {conflicts.length > 0 && (
          <div className="mt-4 space-y-2">
            <p
              className="text-[11px] uppercase tracking-wide font-semibold"
              style={{ color: COLORS.muted }}
            >
              Conflicting task{conflicts.length > 1 ? "s" : ""}
            </p>
            {conflicts.map((item, index) => (
              <div
                key={item.id || `${item.task_type}-${index}`}
                className="rounded-lg px-3 py-2 border"
                style={{
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.light,
                }}
              >
                <div
                  className="text-xs font-semibold"
                  style={{ color: COLORS.dark }}
                >
                  {TASK_TYPE_LABEL[item.task_type] || item.task_type || "Task"}
                  {item.order_id ? ` · Order #${item.order_id}` : ""}
                </div>
                {item.scheduled_time && (
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: COLORS.muted }}
                  >
                    {formatDateTime(item.scheduled_time)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className="mt-4 rounded-lg px-3 py-2 text-xs"
          style={{ backgroundColor: COLORS.light, color: COLORS.muted }}
        >
          <strong style={{ color: COLORS.dark }}>Assign Anyway</strong> only
          overrides the schedule-conflict warning. It does{" "}
          <strong style={{ color: COLORS.dark }}>not</strong>
          bypass the laundry workflow dependency.
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
            style={{
              backgroundColor: COLORS.light,
              color: COLORS.dark,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            Choose Another Employee
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Assigning…
              </>
            ) : (
              "Assign Anyway"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ReassignModal — change which employee handles a task               */
/* ------------------------------------------------------------------ */
function ReassignModal({
  task,
  employees,
  employeesLoading,
  onClose,
  onReassigned,
  onConflict,
}) {
  const [selectedId, setSelectedId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setSelectedId("");
      setError("");
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    setError("");
    try {
      const updated = await taskApi.reassignTask(
        task.id,
        Number(selectedId),
        false,
      );
      toast.success(updated?.message || "Task reassigned successfully.");
      onReassigned?.();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.conflict) {
        onConflict?.({
          type: "reassign",
          taskId: task.id,
          employeeId: Number(selectedId),
          conflicts: data.conflicts || [],
          employeeName:
            employees.find((emp) => Number(emp.id) === Number(selectedId))
              ?.name || "Selected employee",
          scheduledTime: task.scheduled_time,
          order_id: task.order_id,
        });
      } else {
        setError(data?.message || "Failed to reassign task.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForce = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setError("");
    try {
      const updated = await taskApi.reassignTask(
        task.id,
        Number(selectedId),
        true,
      );
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
            <h2
              className="text-xl font-semibold"
              style={{ color: COLORS.dark }}
            >
              Reassign {TASK_TYPE_LABEL[task.task_type] || task.task_type}
            </h2>
            {task.order_id && (
              <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
                Order #{task.order_id}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: COLORS.light,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.dark,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="mb-4 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: COLORS.light, color: COLORS.muted }}
        >
          Currently assigned to:{" "}
          <span className="font-semibold" style={{ color: COLORS.dark }}>
            {task.employee?.name || "—"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: COLORS.dark }}
            >
              New Employee <span style={{ color: "#B3261E" }}>*</span>
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              disabled={employeesLoading || submitting}
              className={fieldCls}
            >
              <option value="" disabled>
                {employeesLoading ? "Loading…" : "Select employee"}
              </option>
              {employees
                .filter((emp) => emp.status !== "inactive")
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                    {emp.designation ? ` — ${emp.designation}` : ""}
                  </option>
                ))}
            </select>
          </div>

          {error && (
            <div
              className="text-xs rounded-lg px-3 py-2"
              style={{ backgroundColor: "#FBE9E8", color: "#B3261E" }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold"
              style={{
                backgroundColor: COLORS.light,
                color: COLORS.dark,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedId}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Reassigning…
                </>
              ) : (
                "Reassign"
              )}
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
/* Assign Task Modal — order is already selected from Orders page     */
/* ------------------------------------------------------------------ */
function AssignTaskModal({ order, onClose, onAssigned }) {
  const { employees, loading: employeesLoading } = useEmployees();
  const [existingTasks, setExistingTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    if (!order) return;

    let cancelled = false;
    setRows([]);
    setNotes("");
    setError("");
    setConflict(null);
    setLoadingTasks(true);

    taskApi
      .getOrderTasks(order.id)
      .then((data) => {
        if (!cancelled) setExistingTasks(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setExistingTasks([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTasks(false);
      });

    return () => {
      cancelled = true;
    };
  }, [order]);

  const existingTypes = useMemo(
    () => new Set(existingTasks.map((task) => task.task_type)),
    [existingTasks],
  );

  const availableTypes = useMemo(
    () =>
      TASK_TYPE_OPTIONS.filter((option) => !existingTypes.has(option.value)),
    [existingTypes],
  );

  const customerAddress = [order?.customer?.address, order?.customer?.city]
    .filter(Boolean)
    .join(", ");

  const addTask = (taskType) => {
    if (existingTypes.has(taskType)) return;
    setRows((prev) => [
      ...prev,
      {
        id: `${taskType}-${Date.now()}-${Math.random()}`,
        task_type: taskType,
        employee_id: "",
        scheduled_time: "",
        priority: "normal",
      },
    ]);
  };

  const removeTask = (rowId) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const updateRow = (rowId, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const validateRows = () => {
    if (!rows.length) {
      setError("Please add at least one task.");
      return false;
    }

    const now = new Date();
    for (const row of rows) {
      if (!row.employee_id) {
        setError(
          `Please select an employee for ${TASK_TYPE_LABEL[row.task_type]}.`,
        );
        return false;
      }
      if (!row.scheduled_time) {
        setError(
          `Please select a scheduled date & time for ${TASK_TYPE_LABEL[row.task_type]}.`,
        );
        return false;
      }
      if (new Date(row.scheduled_time).getTime() < now.getTime()) {
        setError(
          `Scheduled time for ${TASK_TYPE_LABEL[row.task_type]} cannot be in the past.`,
        );
        return false;
      }
      if (!["normal", "urgent"].includes(row.priority)) {
        setError(`Invalid priority for ${TASK_TYPE_LABEL[row.task_type]}.`);
        return false;
      }
    }

    return true;
  };

  const buildPayload = () => ({
    order_id: order.id,
    customer_name: order.customer?.name || "Customer",
    customer_phone: order.customer?.phone || null,
    customer_address: customerAddress || order.pickup_address || null,
    notes: notes.trim() || null,
    tasks: rows
      .slice()
      .sort(
        (a, b) =>
          TASK_SEQUENCE.indexOf(a.task_type) -
          TASK_SEQUENCE.indexOf(b.task_type),
      )
      .map((row) => ({
        task_type: row.task_type,
        employee_id: Number(row.employee_id),
        scheduled_time: row.scheduled_time,
        priority: row.priority,
      })),
  });

  const submit = async (force = false, payloadOverride = null) => {
    const payload = payloadOverride || buildPayload();
    setSubmitting(true);
    setError("");

    try {
      await taskApi.assignTask(force ? { ...payload, force: true } : payload);
      toast.success(
        `${payload.tasks.length} task${payload.tasks.length === 1 ? "" : "s"} assigned successfully.`,
        { duration: 4000 },
      );
      setConflict(null);
      onAssigned?.(order.id);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.conflict && !force) {
        const firstTask = payload.tasks[0];
        const employee = employees.find(
          (emp) => Number(emp.id) === Number(firstTask?.employee_id),
        );
        setConflict({
          type: "assign",
          payload,
          conflicts: data.conflicts || [],
          employeeName: employee?.name || "Selected employee",
          scheduledTime: firstTask?.scheduled_time,
        });
      } else {
        setError(data?.message || "Failed to assign task.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateRows()) return;
    await submit(false);
  };

  if (!order) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-[0_20px_60px_rgba(5,40,42,0.25)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2
                className="text-2xl text-[#0F2C2E] leading-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Assign Tasks · Order #{order.id}
              </h2>
              <p className="text-[13px] text-[#5A7A79] mt-1">
                {order.customer?.name || "Customer"}
                {order.customer?.phone ? ` · ${order.customer.phone}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Selected order / customer — read only */}
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: COLORS.border,
                backgroundColor: COLORS.light,
              }}
            >
              <div
                className="text-[10px] uppercase tracking-wide font-semibold"
                style={{ color: COLORS.muted }}
              >
                Order
              </div>
              <div
                className="text-sm font-semibold mt-1"
                style={{ color: COLORS.dark }}
              >
                #{order.id}
              </div>
            </div>
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: COLORS.border,
                backgroundColor: COLORS.light,
              }}
            >
              <div
                className="text-[10px] uppercase tracking-wide font-semibold"
                style={{ color: COLORS.muted }}
              >
                Customer
              </div>
              <div
                className="text-sm font-semibold mt-1"
                style={{ color: COLORS.dark }}
              >
                {order.customer?.name || "—"}
              </div>
              <div
                className="text-[11px] mt-0.5"
                style={{ color: COLORS.muted }}
              >
                {order.customer?.phone || "No phone"}
              </div>
            </div>
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: COLORS.border,
                backgroundColor: COLORS.light,
              }}
            >
              <div
                className="text-[10px] uppercase tracking-wide font-semibold"
                style={{ color: COLORS.muted }}
              >
                Address
              </div>
              <div className="text-xs mt-1" style={{ color: COLORS.dark }}>
                {customerAddress || order.pickup_address || "—"}
              </div>
            </div>
          </div>

          <div
            className="mb-5 rounded-xl px-4 py-3 text-[12px]"
            style={{
              backgroundColor: "#F7FBFA",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {/* <div
              className="font-semibold mb-1"
              style={{ color: COLORS.primary }}
            >
              Workflow
            </div>
            <div style={{ color: COLORS.muted }}>
              Pickup → Wash → Dry Cleaning → Ironing → Packing → Delivery. Each
              task can have a different employee, date/time and priority. A task
              becomes ready only when its assigned previous workflow task is
              completed.
            </div> */}
          </div>

          {loadingTasks ? (
            <div
              className="flex items-center justify-center py-10 text-sm"
              style={{ color: COLORS.muted }}
            >
              <Loader2 size={18} className="animate-spin mr-2" /> Checking
              existing tasks…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {existingTypes.size > 0 && (
                <div
                  className="rounded-xl px-4 py-3 text-xs"
                  style={{
                    backgroundColor: "#F1F8F7",
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.muted,
                  }}
                >
                  Already assigned for this order:{" "}
                  <span
                    className="font-semibold"
                    style={{ color: COLORS.dark }}
                  >
                    {TASK_SEQUENCE.filter((type) => existingTypes.has(type))
                      .map((type) => TASK_TYPE_LABEL[type])
                      .join(", ")}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="block text-[13px] font-medium text-[#0F2C2E]">
                    Tasks to Assign <span className="text-[#B3261E]">*</span>
                  </label>
                  <span className="text-[11px]" style={{ color: COLORS.muted }}>
                    {rows.length} selected
                  </span>
                </div>

                {rows.length === 0 ? (
                  <div
                    className="rounded-xl border border-dashed px-4 py-5 text-center text-xs"
                    style={{ borderColor: COLORS.border, color: COLORS.muted }}
                  >
                    Select one or more available task types below.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rows
                      .slice()
                      .sort(
                        (a, b) =>
                          TASK_SEQUENCE.indexOf(a.task_type) -
                          TASK_SEQUENCE.indexOf(b.task_type),
                      )
                      .map((row, index) => (
                        <div
                          key={row.id}
                          className="rounded-xl border p-4"
                          style={{
                            borderColor: COLORS.border,
                            backgroundColor: "#FCFEFD",
                          }}
                        >
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                                style={{
                                  backgroundColor: COLORS.light,
                                  color: COLORS.primary,
                                }}
                              >
                                {index + 1}
                              </span>
                              <div>
                                <div
                                  className="text-sm font-semibold"
                                  style={{ color: COLORS.dark }}
                                >
                                  {TASK_TYPE_LABEL[row.task_type]}
                                </div>
                                <div
                                  className="text-[10px]"
                                  style={{ color: COLORS.muted }}
                                >
                                  Sequence{" "}
                                  {TASK_SEQUENCE.indexOf(row.task_type) + 1}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTask(row.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{
                                color: "#B3261E",
                                backgroundColor: "#FDECEC",
                              }}
                              title="Remove task"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="grid md:grid-cols-3 gap-3">
                            <div>
                              <label
                                className="block text-[11px] font-semibold mb-1.5"
                                style={{ color: COLORS.muted }}
                              >
                                Employee{" "}
                                <span style={{ color: "#B3261E" }}>*</span>
                              </label>
                              <select
                                value={row.employee_id}
                                onChange={(e) =>
                                  updateRow(
                                    row.id,
                                    "employee_id",
                                    e.target.value,
                                  )
                                }
                                required
                                disabled={employeesLoading}
                                className={fieldCls}
                              >
                                <option value="" disabled>
                                  {employeesLoading
                                    ? "Loading…"
                                    : "Select employee"}
                                </option>
                                {employees
                                  .filter((emp) => emp.status !== "inactive")
                                  .map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                      {emp.name}
                                      {emp.designation
                                        ? ` — ${emp.designation}`
                                        : ""}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div>
                              <label
                                className="block text-[11px] font-semibold mb-1.5"
                                style={{ color: COLORS.muted }}
                              >
                                Scheduled Date &amp; Time{" "}
                                <span style={{ color: "#B3261E" }}>*</span>
                              </label>
                              <input
                                type="datetime-local"
                                value={row.scheduled_time}
                                onChange={(e) =>
                                  updateRow(
                                    row.id,
                                    "scheduled_time",
                                    e.target.value,
                                  )
                                }
                                required
                                className={fieldCls}
                              />
                            </div>

                            <div>
                              <label
                                className="block text-[11px] font-semibold mb-1.5"
                                style={{ color: COLORS.muted }}
                              >
                                Priority
                              </label>
                              <select
                                value={row.priority}
                                onChange={(e) =>
                                  updateRow(row.id, "priority", e.target.value)
                                }
                                className={fieldCls}
                              >
                                <option value="normal">Normal</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {availableTypes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableTypes.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => addTask(option.value)}
                        disabled={rows.some(
                          (row) => row.task_type === option.value,
                        )}
                        className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40"
                        style={{
                          borderColor: COLORS.border,
                          backgroundColor: COLORS.light,
                          color: COLORS.primary,
                        }}
                      >
                        + {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special instructions for the assigned employees…"
                  className={`${fieldCls} resize-none`}
                />
              </div>

              {error && (
                <div className="text-[13px] text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] rounded-lg px-3.5 py-2.5">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold"
                  style={{
                    backgroundColor: COLORS.light,
                    color: COLORS.dark,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || loadingTasks || rows.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #028090, #00A896)",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Assigning…
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Assign {rows.length || ""} Task
                      {rows.length === 1 ? "" : "s"}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <ConflictModal
        conflict={conflict}
        onClose={() => setConflict(null)}
        submitting={submitting}
        onConfirm={() => submit(true, conflict.payload)}
      />
    </>
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
  const [reassignConflict, setReassignConflict] = useState(null);
  const { employees, loading: employeesLoading } = useEmployees();

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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

  // Live tracking — refresh every 10s so employee status updates show up immediately.
  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 10000);
    return () => clearInterval(t);
  }, []);

  // Fetch tasks when an order is expanded
  useEffect(() => {
    if (!expanded) {
      setOrderTasks([]);
      return;
    }
    let cancelled = false;
    taskApi
      .getOrderTasks(expanded)
      .then((data) => {
        if (!cancelled) setOrderTasks(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setOrderTasks([]);
      });
    return () => {
      cancelled = true;
    };
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
      toast.error(
        error.response?.data?.message || "Could not update payment status.",
      );
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
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? orders.length,
      icon: Package,
    },
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
    <div
      className="min-h-screen bg-white p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ===================== HEADER ===================== */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl"
            style={{
              fontFamily: "'Libre Baskerville', serif",
              color: COLORS.dark,
            }}
          >
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
              <p
                className="text-2xl font-semibold mt-4 truncate"
                style={{ color: COLORS.dark }}
              >
                {loading ? "—" : card.value}
              </p>
              <p className="text-sm mt-1" style={{ color: COLORS.muted }}>
                {card.title}
              </p>
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
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ borderColor: COLORS.border, backgroundColor: "#FFFFFF" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: COLORS.light }}
          >
            <Package size={24} color={COLORS.primary} />
          </div>
          <p className="text-sm" style={{ color: COLORS.muted }}>
            No orders
            {statusFilter !== "all"
              ? ` with status "${statusMeta(statusFilter).label}"`
              : ""}{" "}
            yet.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div
            className="hidden md:block overflow-x-auto rounded-2xl border"
            style={{ borderColor: COLORS.border }}
          >
            <table
              className="w-full text-sm min-w-[900px]"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <thead>
                <tr
                  className="text-left"
                  style={{
                    color: COLORS.muted,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
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
                          <div
                            className="font-semibold"
                            style={{ color: COLORS.dark }}
                          >
                            #{o.id}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: COLORS.muted }}
                          >
                            {formatDateTime(o.createdAt)}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div
                            className="font-medium flex items-center gap-1.5"
                            style={{ color: COLORS.dark }}
                          >
                            <UserIcon
                              size={13}
                              style={{ color: COLORS.primary }}
                            />
                            {o.customer?.name || "—"}
                          </div>
                          <div
                            className="text-xs mt-0.5 flex items-center gap-1"
                            style={{ color: COLORS.muted }}
                          >
                            <Phone size={11} /> {o.customer?.phone || "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div
                            className="flex items-center gap-1.5"
                            style={{ color: COLORS.dark }}
                          >
                            <Store
                              size={13}
                              style={{ color: COLORS.primary }}
                            />
                            {o.shop?.name || "—"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: COLORS.light,
                              color: COLORS.primary,
                            }}
                          >
                            {(o.items || []).length} item
                            {(o.items || []).length === 1 ? "" : "s"}
                          </span>
                        </td>
                        <td
                          className="px-5 py-4 font-semibold"
                          style={{ color: COLORS.dark }}
                        >
                          {formatINR(o.total_amount)}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={o.payment_status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handlePayment(o.id, e.target.value)
                            }
                            style={selectStyle}
                          >
                            {PAYMENT_STATUSES.map((p) => (
                              <option key={p} value={p}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{
                              backgroundColor: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.color}44`,
                            }}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {o.status !== "out_for_delivery" &&
                              o.status !== "delivered" &&
                              o.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAssignOrder(o);
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:brightness-110"
                                  style={{
                                    background:
                                      "linear-gradient(95deg, #028090, #02C39A)",
                                  }}
                                  title="Assign an employee to this order"
                                >
                                  <UserPlus size={13} /> Assign
                                </button>
                              )}
                            <ChevronDown
                              size={16}
                              className="inline-block transition-transform"
                              style={{
                                color: COLORS.muted,
                                transform: isOpen ? "rotate(180deg)" : "none",
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr
                          style={{ borderBottom: `1px solid ${COLORS.border}` }}
                        >
                          <td
                            colSpan={8}
                            className="px-5 py-5"
                            style={{ backgroundColor: COLORS.light }}
                          >
                            <div className="grid lg:grid-cols-3 gap-5">
                              {/* Items */}
                              <div>
                                <div
                                  className="text-[11px] uppercase tracking-wide font-semibold mb-2"
                                  style={{ color: COLORS.muted }}
                                >
                                  Services / Items
                                </div>
                                <div className="space-y-1.5">
                                  {(o.items || []).map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between gap-3 text-xs"
                                    >
                                      <span style={{ color: COLORS.dark }}>
                                        {item.item_label
                                          ? `${item.item_label} · ${item.name}`
                                          : item.name}
                                        <span style={{ color: COLORS.muted }}>
                                          {" "}
                                          × {item.quantity}
                                        </span>
                                      </span>
                                      <span
                                        className="font-medium"
                                        style={{ color: COLORS.dark }}
                                      >
                                        {formatINR(item.lineTotal)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Pickup / delivery */}
                              <div>
                                <div
                                  className="text-[11px] uppercase tracking-wide font-semibold mb-2"
                                  style={{ color: COLORS.muted }}
                                >
                                  Pickup &amp; Delivery
                                </div>
                                <div
                                  className="space-y-2 text-xs"
                                  style={{ color: COLORS.dark }}
                                >
                                  <div className="flex items-start gap-1.5">
                                    <CalendarDays
                                      size={13}
                                      className="mt-0.5 flex-shrink-0"
                                      style={{ color: COLORS.primary }}
                                    />
                                    <span>
                                      Pickup {formatDate(o.pickup_date)}
                                      {o.pickup_time
                                        ? ` · ${o.pickup_time}`
                                        : ""}
                                      {o.pickup_address
                                        ? ` — ${o.pickup_address}`
                                        : ""}
                                    </span>
                                  </div>
                                  <div className="flex items-start gap-1.5">
                                    <MapPin
                                      size={13}
                                      className="mt-0.5 flex-shrink-0"
                                      style={{ color: COLORS.primary }}
                                    />
                                    <span>
                                      Delivery
                                      {o.delivery_address
                                        ? ` — ${o.delivery_address}`
                                        : ""}
                                    </span>
                                  </div>
                                  {o.delivery_note && (
                                    <div
                                      className="text-xs"
                                      style={{ color: COLORS.muted }}
                                    >
                                      Note: {o.delivery_note}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Customer */}
                              <div>
                                <div
                                  className="text-[11px] uppercase tracking-wide font-semibold mb-2"
                                  style={{ color: COLORS.muted }}
                                >
                                  Customer
                                </div>
                                <div
                                  className="space-y-2 text-xs"
                                  style={{ color: COLORS.dark }}
                                >
                                  <div className="font-medium">
                                    {o.customer?.name || "—"}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Phone
                                      size={12}
                                      style={{ color: COLORS.primary }}
                                    />{" "}
                                    {o.customer?.phone || "—"}
                                  </div>
                                  <div className="flex items-start gap-1.5">
                                    <MapPin
                                      size={12}
                                      className="mt-0.5 flex-shrink-0"
                                      style={{ color: COLORS.primary }}
                                    />
                                    <span>
                                      {[o.customer?.address, o.customer?.city]
                                        .filter(Boolean)
                                        .join(", ") || "No address on file"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Store
                                      size={12}
                                      style={{ color: COLORS.primary }}
                                    />{" "}
                                    {o.shop?.name || "—"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Task Assignments — full-width row below the 3-col grid */}
                            {expanded === o.id && (
                              <div
                                className="mt-5 pt-5 border-t"
                                style={{ borderColor: COLORS.border }}
                              >
                                <TaskAssignmentTable
                                  orderId={o.id}
                                  tasks={orderTasks}
                                  onReassign={(t) => setReassignTarget(t)}
                                  onRefresh={() => {
                                    taskApi
                                      .getOrderTasks(o.id)
                                      .then((d) =>
                                        setOrderTasks(
                                          Array.isArray(d) ? d : [],
                                        ),
                                      );
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

          {/* Mobile card list */}
          <div
            className="md:hidden rounded-2xl border overflow-hidden"
            style={{ borderColor: COLORS.border, backgroundColor: "#FFFFFF" }}
          >
            {filtered.map((o) => {
              const meta = statusMeta(o.status);
              const isOpen = expanded === o.id;
              return (
                <div
                  key={o.id}
                  className="border-b last:border-b-0 p-4"
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div
                      className="font-semibold"
                      style={{ color: COLORS.dark }}
                    >
                      #{o.id}
                    </div>
                    <div
                      className="text-[11px]"
                      style={{ color: COLORS.muted }}
                    >
                      {formatDateTime(o.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon size={13} style={{ color: COLORS.primary }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: COLORS.dark }}
                    >
                      {o.customer?.name || "—"}
                    </span>
                    <span className="text-xs" style={{ color: COLORS.muted }}>
                      &middot; {o.shop?.name || ""}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1 text-xs mb-2"
                    style={{ color: COLORS.muted }}
                  >
                    <Phone size={11} /> {o.customer?.phone || "—"}
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: COLORS.dark }}
                    >
                      {formatINR(o.total_amount)}
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: COLORS.light,
                        color: COLORS.primary,
                      }}
                    >
                      {(o.items || []).length} item
                      {(o.items || []).length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span
                      className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: meta.bg,
                        color: meta.color,
                        borderColor: `${meta.color}44`,
                      }}
                    >
                      {meta.label}
                    </span>
                    <select
                      value={o.payment_status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handlePayment(o.id, e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: COLORS.light,
                        color: COLORS.dark,
                        borderColor: COLORS.border,
                      }}
                    >
                      {PAYMENT_STATUSES.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                    {o.status !== "out_for_delivery" &&
                      o.status !== "delivered" &&
                      o.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignOrder(o);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white"
                          style={{
                            background:
                              "linear-gradient(95deg, #028090, #02C39A)",
                          }}
                        >
                          <UserPlus size={12} /> Assign
                        </button>
                      )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : o.id)}
                    className="w-full mt-3 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-lg border"
                    style={{ borderColor: COLORS.border, color: COLORS.muted }}
                  >
                    {isOpen ? "Hide details" : "View details"}
                    <ChevronDown
                      size={13}
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div
                      className="mt-3 pt-3 border-t space-y-3"
                      style={{ borderColor: COLORS.border }}
                    >
                      <div>
                        <div
                          className="text-[11px] uppercase tracking-wide font-semibold mb-1.5"
                          style={{ color: COLORS.muted }}
                        >
                          Services
                        </div>
                        {(o.items || []).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-0.5"
                          >
                            <span style={{ color: COLORS.dark }}>
                              {item.item_label
                                ? `${item.item_label} · ${item.name}`
                                : item.name}{" "}
                              <span style={{ color: COLORS.muted }}>
                                ×{item.quantity}
                              </span>
                            </span>
                            <span
                              className="font-medium"
                              style={{ color: COLORS.dark }}
                            >
                              {formatINR(item.lineTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {o.pickup_date && (
                        <div className="text-xs" style={{ color: COLORS.dark }}>
                          <span className="font-medium">Pickup:</span>{" "}
                          {formatDate(o.pickup_date)}
                          {o.pickup_time ? ` · ${o.pickup_time}` : ""}
                          {o.pickup_address && (
                            <div className="mt-0.5 flex items-start gap-1">
                              <MapPin
                                size={11}
                                className="mt-0.5 shrink-0"
                                style={{ color: COLORS.primary }}
                              />
                              {o.pickup_address}
                            </div>
                          )}
                        </div>
                      )}
                      {o.delivery_address && (
                        <div className="text-xs" style={{ color: COLORS.dark }}>
                          <span className="font-medium">Delivery:</span>
                          <div className="mt-0.5 flex items-start gap-1">
                            <MapPin
                              size={11}
                              className="mt-0.5 shrink-0"
                              style={{ color: COLORS.primary }}
                            />
                            {o.delivery_address}
                          </div>
                        </div>
                      )}
                      <TaskAssignmentTable
                        orderId={o.id}
                        tasks={orderTasks}
                        onReassign={(t) => setReassignTarget(t)}
                        onRefresh={() => {
                          taskApi
                            .getOrderTasks(o.id)
                            .then((d) =>
                              setOrderTasks(Array.isArray(d) ? d : []),
                            );
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <AssignTaskModal
        order={assignOrder}
        onClose={() => setAssignOrder(null)}
        onAssigned={(orderId) => {
          load();
          if (expanded === orderId) {
            taskApi
              .getOrderTasks(orderId)
              .then((d) => setOrderTasks(Array.isArray(d) ? d : []));
          }
        }}
      />

      <ReassignModal
        task={reassignTarget}
        employees={employees}
        employeesLoading={employeesLoading}
        onClose={() => setReassignTarget(null)}
        onConflict={(data) => {
          setReassignConflict(data);
          setReassignTarget(null);
        }}
        onReassigned={() => {
          if (reassignTarget?.order_id) {
            taskApi
              .getOrderTasks(reassignTarget.order_id)
              .then((d) => setOrderTasks(Array.isArray(d) ? d : []));
          }
          load();
        }}
      />

      <ConflictModal
        conflict={reassignConflict}
        onClose={() => setReassignConflict(null)}
        submitting={false}
        onConfirm={async () => {
          if (!reassignConflict) return;
          try {
            await taskApi.reassignTask(
              reassignConflict.taskId,
              reassignConflict.employeeId,
              true,
            );
            toast.success("Task reassigned successfully.");
            setReassignConflict(null);
            if (reassignConflict.order_id) {
              taskApi
                .getOrderTasks(reassignConflict.order_id)
                .then((d) => setOrderTasks(Array.isArray(d) ? d : []));
            }
            load();
          } catch (err) {
            toast.error(
              err.response?.data?.message || "Failed to reassign task.",
            );
          }
        }}
      />
    </div>
  );
}
