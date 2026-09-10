import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  Inbox,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Sparkles,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { taskApi } from "../../api/taskApi";
import { useEmployees } from "../../hooks/useEmployees";
import StatusPill from "../../components/layout/StatusPill";
import TaskFilterTabs from "../../components/layout/TaskFilterTabs";
import { getShopOrders } from "../../api/orderApi";

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

const EMPTY_FORM = {
  order_id: "",
  customer_id: "",
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  notes: "",
};

const EMPTY_ASSIGNMENTS = {
  pickup: { employee_id: "", scheduled_time: "", priority: "normal" },
  wash: { employee_id: "", scheduled_time: "", priority: "normal" },
  dry: { employee_id: "", scheduled_time: "", priority: "normal" },
  iron: { employee_id: "", scheduled_time: "", priority: "normal" },
  pack: { employee_id: "", scheduled_time: "", priority: "normal" },
  delivery: { employee_id: "", scheduled_time: "", priority: "normal" },
};

const inputCls =
  "w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition";

function formatScheduled(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Field({ label, required, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-medium text-[#0F2C2E] mb-1.5">
        {label} {required && <span className="text-[#B3261E]">*</span>}
      </label>
      {children}
    </div>
  );
}

function PriorityPill({ priority }) {
  const urgent = priority === "urgent";
  return (
    <span
      className="text-[11px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap flex items-center gap-1"
      style={{
        color: urgent ? "#B3261E" : "#028090",
        background: urgent ? "#FDECEC" : "#DFF3F5",
      }}
    >
      {urgent && <AlertTriangle size={11} />}
      {urgent ? "Urgent" : "Normal"}
    </span>
  );
}

function InactiveEmployeeBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1"
      style={{ color: "#B3261E", background: "#FDECEC" }}
    >
      <UserX size={10} /> EMPLOYEE INACTIVE
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="group bg-white border border-[#D8ECEA] rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-[0_1px_2px_rgba(15,44,46,0.04)] hover:shadow-[0_8px_24px_rgba(15,44,46,0.08)] hover:-translate-y-0.5 transition-all duration-300">
      <div
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon size={20} style={{ color }} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] sm:text-xs text-[#6B8482] font-medium truncate">
          {label}
        </div>
        <div
          className="text-xl sm:text-2xl text-[#0F2C2E] mt-0.5"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ hasEmployees }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[#EEF7F6]">
        <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
      </div>
      <p className="text-sm font-medium text-[#0F2C2E]">No tasks yet</p>
      <p className="text-xs text-[#6B8482] mt-1">
        {hasEmployees
          ? "Assign a task to an employee to get started."
          : "Create an employee first, then assign tasks to them."}
      </p>
    </div>
  );
}

function ConflictModal({
  title = "Schedule Conflict",
  conflicts = [],
  employeeName,
  scheduledTime,
  loading = false,
  onChooseAnother,
  onAssignAnyway,
}) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-[#05282A]/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => !loading && onChooseAnother()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-[0_20px_60px_rgba(5,40,42,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDECEC] text-[#B3261E] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-xl text-[#0F2C2E]"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              {title}
            </h3>
            <p className="text-[13px] text-[#5A7A79] mt-1">
              {employeeName ? `${employeeName} already has a task` : "This employee already has a task"}
              {scheduledTime ? ` scheduled for ${formatScheduled(scheduledTime)}.` : "."}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onChooseAnother}
            className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {conflicts.length > 0 && (
          <div className="mt-5 rounded-xl border border-[#F3C7B8] bg-[#FBE4DC] p-3.5">
            <div className="text-xs font-bold text-[#9A2E12] mb-2">
              Existing task at the same time
            </div>
            <div className="space-y-2">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="bg-white rounded-lg border border-[#F3C7B8] px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[12px] font-semibold text-[#0F2C2E]">
                        {TASK_TYPE_LABEL[conflict.task_type] || conflict.task_type}
                        {conflict.id ? ` #${conflict.id}` : ""}
                      </div>
                      <div className="text-[11px] text-[#6B8482] mt-0.5">
                        {conflict.order_id ? `Order #${conflict.order_id}` : "Standalone task"}
                        {conflict.customer_name ? ` · ${conflict.customer_name}` : ""}
                      </div>
                    </div>
                    <PriorityPill priority={conflict.priority} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl bg-[#EEF7F6] border border-[#D8ECEA] p-3.5 text-[12px] text-[#496A68] leading-relaxed">
          <strong className="text-[#0F2C2E]">Important:</strong> Assign Anyway only allows the
          schedule overlap. It does not skip the order workflow. If this task is waiting for a
          previous task, the employee will still see it as pending until the dependency is completed.
        </div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onChooseAnother}
            className="px-4 py-2.5 rounded-xl border border-[#D8ECEA] bg-white text-[#0F2C2E] text-sm font-semibold hover:bg-[#EEF7F6] disabled:opacity-50"
          >
            Choose Another Employee
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onAssignAnyway}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Assigning…" : "Assign Anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignTaskModal({ isOpen, onClose, employees, employeesLoading, onAssigned }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [assignments, setAssignments] = useState(EMPTY_ASSIGNMENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderTasks, setOrderTasks] = useState([]);
  const [orderTasksLoading, setOrderTasksLoading] = useState(false);
  const [conflict, setConflict] = useState(null);

  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const response = await getShopOrders({ status: "pending" });
        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) setOrders([]);
        if (!cancelled) setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!form.order_id) {
      setOrderTasks([]);
      return;
    }

    let cancelled = false;
    const loadOrderTasks = async () => {
      setOrderTasksLoading(true);
      try {
        const response = await taskApi.getOrderTasks(form.order_id);
        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        if (!cancelled) setOrderTasks(data);
      } catch {
        if (!cancelled) setOrderTasks([]);
      } finally {
        if (!cancelled) setOrderTasksLoading(false);
      }
    };

    loadOrderTasks();
    return () => {
      cancelled = true;
    };
  }, [form.order_id]);

  const existingTaskTypes = useMemo(
    () => new Set(orderTasks.map((task) => task.task_type)),
    [orderTasks],
  );

  const selectedTasks = useMemo(
    () =>
      Object.entries(assignments)
        .filter(([, assignment]) => assignment.employee_id)
        .map(([task_type, assignment]) => ({
          task_type,
          employee_id: Number(assignment.employee_id),
          scheduled_time: assignment.scheduled_time,
          priority: assignment.priority,
        })),
    [assignments],
  );

  const selectedTaskCount = selectedTasks.length;

  const resetAndClose = useCallback(() => {
    if (loading) return;
    setForm(EMPTY_FORM);
    setAssignments(EMPTY_ASSIGNMENTS);
    setError("");
    setOrderTasks([]);
    setConflict(null);
    onClose();
  }, [loading, onClose]);

  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    const order = orders.find((item) => String(item.id) === String(orderId));
    const customer = order?.customer;

    if (!orderId || !order) {
      setForm(EMPTY_FORM);
      setAssignments(EMPTY_ASSIGNMENTS);
      setOrderTasks([]);
      setConflict(null);
      return;
    }

    setForm((prev) => ({
      ...prev,
      order_id: String(order.id),
      customer_id: customer?.id ? String(customer.id) : "",
      customer_name: customer?.name || order.customer_name || "",
      customer_phone: customer?.phone || order.customer_phone || "",
      customer_address: customer
        ? [customer.address, customer.city].filter(Boolean).join(", ")
        : order.pickup_address || "",
    }));
    setAssignments(EMPTY_ASSIGNMENTS);
    setError("");
    setConflict(null);
  };

  const handleEmployeeChange = (taskType, employeeId) => {
    setAssignments((prev) => ({
      ...prev,
      [taskType]: { ...prev[taskType], employee_id: employeeId },
    }));
  };

  const handleTaskScheduleChange = (taskType, scheduled_time) => {
    setAssignments((prev) => ({
      ...prev,
      [taskType]: { ...prev[taskType], scheduled_time },
    }));
  };

  const handleTaskPriorityChange = (taskType, priority) => {
    setAssignments((prev) => ({
      ...prev,
      [taskType]: { ...prev[taskType], priority },
    }));
  };

  const buildPayload = () => ({
    order_id: Number(form.order_id),
    tasks: selectedTasks,
    customer_name: form.customer_name,
    customer_phone: form.customer_phone || null,
    customer_address: form.customer_address || null,
    notes: form.notes || null,
    ...(form.customer_id ? { customer_id: Number(form.customer_id) } : {}),
  });

  const submitPayload = async (payload, force = false) => {
    setLoading(true);
    try {
      const requestPayload = force ? { ...payload, force: true } : payload;
      await taskApi.assignTask(requestPayload);
      toast.success(
        selectedTaskCount > 1
          ? `${selectedTaskCount} tasks assigned successfully`
          : "Task assigned successfully",
      );
      onAssigned?.();
      resetAndClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.conflict) {
        const conflictEmployeeId = data.conflicts?.[0]?.employee_id;
        const selectedEmployee = employees.find(
          (employee) => Number(employee.id) === Number(conflictEmployeeId),
        );
        setConflict({
          payload,
          conflicts: data.conflicts || [],
          employeeName: selectedEmployee?.name || data.employee?.name || "Selected employee",
          scheduledTime: data.conflicts?.[0]?.scheduled_time || null,
        });
        return;
      }

      const message = data?.message || "Failed to assign task";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setConflict(null);

    if (!form.order_id) {
      setError("Please select an order.");
      return;
    }

    if (!form.customer_name) {
      setError("Customer details could not be loaded from this order.");
      return;
    }

    if (selectedTaskCount === 0) {
      setError("Please assign at least one task to an employee.");
      return;
    }

    for (const task of selectedTasks) {
      if (!task.scheduled_time) {
        setError(`${TASK_TYPE_LABEL[task.task_type]} scheduled date & time is required.`);
        return;
      }
      if (Number.isNaN(new Date(task.scheduled_time).getTime())) {
        setError(`${TASK_TYPE_LABEL[task.task_type]} scheduled time is invalid.`);
        return;
      }
      if (new Date(task.scheduled_time).getTime() < Date.now()) {
        setError(`${TASK_TYPE_LABEL[task.task_type]} scheduled time cannot be in the past.`);
        return;
      }
      if (!["normal", "urgent"].includes(task.priority)) {
        setError(`${TASK_TYPE_LABEL[task.task_type]} priority is invalid.`);
        return;
      }
    }

    const duplicateTaskTypes = selectedTasks.filter((task) =>
      existingTaskTypes.has(task.task_type),
    );
    if (duplicateTaskTypes.length > 0) {
      setError(
        `These task types are already assigned: ${duplicateTaskTypes
          .map((task) => TASK_TYPE_LABEL[task.task_type])
          .join(", ")}`,
      );
      return;
    }

    await submitPayload(buildPayload(), false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={resetAndClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2
                className="text-2xl text-[#0F2C2E] leading-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Assign Tasks
              </h2>
              <p className="text-[13px] text-[#5A7A79] mt-1">
                Assign different workflow tasks to different employees.
              </p>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Order" required>
              <select
                value={form.order_id}
                onChange={handleOrderSelect}
                disabled={ordersLoading || loading}
                className={inputCls}
              >
                <option value="">
                  {ordersLoading ? "Loading orders…" : "Select order"}
                </option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id}
                    {order.customer?.name ? ` — ${order.customer.name}` : ""}
                    {order.status ? ` (${order.status})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            {form.order_id && orderTasksLoading && (
              <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-3 text-xs text-[#6B8482] flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#028090]" />
                Checking existing tasks for this order…
              </div>
            )}

            {form.order_id && !orderTasksLoading && orderTasks.length > 0 && (
              <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-3">
                <div className="text-xs font-semibold text-[#0F2C2E] mb-2">Existing Tasks</div>
                <div className="flex flex-wrap gap-2">
                  {orderTasks.map((task) => (
                    <span
                      key={task.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#D8ECEA] text-[11px] text-[#028090]"
                    >
                      {TASK_TYPE_LABEL[task.task_type] || task.task_type}
                      {task.employee?.name && (
                        <span className="text-[#6B8482]">→ {task.employee.name}</span>
                      )}
                      <span className="text-[#8AA19F]">· {task.status}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[13px] font-medium text-[#0F2C2E]">
                  Task Assignments <span className="text-[#B3261E]">*</span>
                </label>
                <span className="text-[11px] text-[#6B8482]">{selectedTaskCount} selected</span>
              </div>

              <div className="border border-[#D8ECEA] rounded-xl overflow-hidden">
                {TASK_TYPE_OPTIONS.map(({ value: taskType, label }) => {
                  const assignment = assignments[taskType];
                  const alreadyExists = existingTaskTypes.has(taskType);
                  const selectedEmployee = assignment.employee_id;

                  return (
                    <div
                      key={taskType}
                      className={`p-4 border-b last:border-b-0 border-[#EEF7F6] ${
                        alreadyExists ? "bg-[#FAFDFC]" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              selectedEmployee
                                ? "bg-[#02C39A]"
                                : alreadyExists
                                  ? "bg-[#A9C9C6]"
                                  : "bg-[#D8ECEA]"
                            }`}
                          />
                          <span
                            className={`text-[13px] font-semibold ${
                              alreadyExists ? "text-[#8AA19F]" : "text-[#0F2C2E]"
                            }`}
                          >
                            {label}
                          </span>
                          {alreadyExists && (
                            <span className="text-[9px] font-bold uppercase tracking-wide text-[#8AA19F] bg-[#EEF7F6] px-1.5 py-0.5 rounded">
                              Assigned
                            </span>
                          )}
                        </div>
                      </div>

                      {!alreadyExists && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Field label="Employee">
                            <select
                              value={selectedEmployee}
                              onChange={(e) => handleEmployeeChange(taskType, e.target.value)}
                              disabled={employeesLoading || orderTasksLoading || loading}
                              className={inputCls}
                            >
                              <option value="">
                                {employeesLoading ? "Loading employees…" : "Select employee"}
                              </option>
                              {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                  {employee.name}
                                  {employee.designation ? ` — ${employee.designation}` : ""}
                                  {employee.status === "inactive" ? " (Inactive)" : ""}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Scheduled Date & Time">
                            <input
                              type="datetime-local"
                              value={assignment.scheduled_time}
                              min={minDateTime}
                              onChange={(e) => handleTaskScheduleChange(taskType, e.target.value)}
                              disabled={!selectedEmployee || loading}
                              className={`${inputCls} ${!selectedEmployee ? "opacity-60 cursor-not-allowed" : ""}`}
                            />
                          </Field>

                          <Field label="Priority">
                            <select
                              value={assignment.priority}
                              onChange={(e) => handleTaskPriorityChange(taskType, e.target.value)}
                              disabled={!selectedEmployee || loading}
                              className={`${inputCls} ${!selectedEmployee ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <option value="normal">Normal</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </Field>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-[#6B8482]">
                Each workflow task can have its own employee, scheduled time and priority.
              </p>
            </div>

            {selectedTasks.length > 0 && (
              <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-3.5">
                <div className="text-xs font-semibold text-[#0F2C2E] mb-2">Assignment Summary</div>
                <div className="space-y-2">
                  {selectedTasks.map((task) => {
                    const employee = employees.find(
                      (item) => Number(item.id) === Number(task.employee_id),
                    );
                    return (
                      <div
                        key={task.task_type}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white rounded-lg px-3 py-2 border border-[#D8ECEA]"
                      >
                        <div>
                          <div className="text-[12px] font-semibold text-[#0F2C2E]">
                            {TASK_TYPE_LABEL[task.task_type]}
                          </div>
                          <div className="text-[11px] text-[#6B8482]">
                            {employee?.name || "Employee"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#6B8482]">
                            {formatScheduled(task.scheduled_time)}
                          </span>
                          <PriorityPill priority={task.priority} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-[#D8ECEA] bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#0F2C2E]">Customer</div>
                  <div className="text-[11px] text-[#6B8482]">Loaded from the selected order</div>
                </div>
                {form.order_id && <CheckCircle2 size={16} className="text-[#02C39A]" />}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Customer Name" required>
                  <input
                    value={form.customer_name}
                    readOnly
                    className={`${inputCls} cursor-not-allowed bg-[#F5FAF9]`}
                    placeholder="Customer name"
                  />
                </Field>
                <Field label="Customer Phone">
                  <input
                    value={form.customer_phone}
                    readOnly
                    className={`${inputCls} cursor-not-allowed bg-[#F5FAF9]`}
                    placeholder="Phone"
                  />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Customer Address">
                  <input
                    value={form.customer_address}
                    readOnly
                    className={`${inputCls} cursor-not-allowed bg-[#F5FAF9]`}
                    placeholder="Address"
                  />
                </Field>
              </div>
            </div>

            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                disabled={loading}
                placeholder="Any special instructions…"
                className={`${inputCls} resize-none`}
              />
            </Field>

            {error && (
              <div className="text-[13px] text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] rounded-lg px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || selectedTaskCount === 0 || !form.order_id}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
              style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Assigning…
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Assign {selectedTaskCount} Task{selectedTaskCount === 1 ? "" : "s"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {conflict && (
        <ConflictModal
          conflicts={conflict.conflicts}
          employeeName={conflict.employeeName}
          scheduledTime={conflict.scheduledTime}
          loading={loading}
          onChooseAnother={() => setConflict(null)}
          onAssignAnyway={() => submitPayload(conflict.payload, true)}
        />
      )}
    </>
  );
}

const PAGE_TABS = [
  { key: "active", label: "Active Tasks", icon: ClipboardList },
  { key: "history", label: "Task History", icon: History },
];

function PageTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-[#EEF7F6] rounded-xl w-fit">
      {PAGE_TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            active === key
              ? "bg-white text-[#028090] shadow-sm"
              : "text-[#6B8482] hover:text-[#028090] hover:bg-white/50"
          }`}
        >
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );
}

function TaskHistoryTab({ employees }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    employee_id: "",
    customer: "",
    order_id: "",
    task_type: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => Boolean(value)),
      );
      const data = await taskApi.getAdminTaskHistory(params);
      setHistory(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load task history");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () =>
    setFilters({
      employee_id: "",
      customer: "",
      order_id: "",
      task_type: "",
      status: "",
      startDate: "",
      endDate: "",
    });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#D8ECEA] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0F2C2E]">Filter History</h3>
          {Object.values(filters).some(Boolean) && (
            <button type="button" onClick={clearFilters} className="text-xs text-[#028090] hover:underline font-medium">
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <select value={filters.employee_id} onChange={(e) => setFilter("employee_id", e.target.value)} className={inputCls}>
            <option value="">All Employees</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
          </select>
          <input value={filters.customer} onChange={(e) => setFilter("customer", e.target.value)} placeholder="Customer name" className={inputCls} />
          <input type="number" value={filters.order_id} onChange={(e) => setFilter("order_id", e.target.value)} placeholder="Order ID" className={inputCls} />
          <select value={filters.task_type} onChange={(e) => setFilter("task_type", e.target.value)} className={inputCls}>
            <option value="">All Task Types</option>
            {TASK_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)} className={inputCls}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <div className="flex gap-2">
            <input type="date" value={filters.startDate} onChange={(e) => setFilter("startDate", e.target.value)} className={inputCls} />
            <input type="date" value={filters.endDate} onChange={(e) => setFilter("endDate", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">{error}</div>}

      <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
        {loading ? <TableSkeleton /> : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[#EEF7F6]"><History size={24} className="text-[#028090]" /></div>
            <p className="text-sm font-medium text-[#0F2C2E]">No task history found</p>
            <p className="text-xs text-[#6B8482] mt-1">Adjust filters or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                  {['Order', 'Customer', 'Task Type', 'Employee', 'Scheduled', 'Started', 'Completed', 'Status', 'Notes'].map((heading) => (
                    <th key={heading} className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((task) => (
                  <tr key={task.id} className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC]">
                    <td className="py-3.5 px-5">
                      {task.order ? <Link to="/admin/orders" className="text-[12px] font-semibold text-[#028090]">Order #{task.order.id}</Link> : <span className="text-[11px] text-[#6B8482]">—</span>}
                    </td>
                    <td className="py-3.5 px-5"><div className="text-[#0F2C2E] font-medium">{task.customer_name || "—"}</div>{task.customer_phone && <div className="text-[11px] text-[#6B8482]">{task.customer_phone}</div>}</td>
                    <td className="py-3.5 px-5"><span className="text-[12px] font-semibold text-[#028090]">{TASK_TYPE_LABEL[task.task_type] || task.task_type}</span></td>
                    <td className="py-3.5 px-5"><div className="text-[#0F2C2E] font-medium">{task.employee?.name || "—"}</div>{task.employee_id && <div className="text-[11px] text-[#6B8482]">ID: {task.employee_id}</div>}</td>
                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">{formatScheduled(task.scheduled_time)}</td>
                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">{formatScheduled(task.started_at)}</td>
                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">{formatScheduled(task.completed_at)}</td>
                    <td className="py-3.5 px-5"><StatusPill status={task.status} /></td>
                    <td className="py-3.5 px-5"><div className="text-[11px] text-[#6B8482] max-w-[150px] truncate">{task.notes || "—"}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tasks() {
  const { employees, loading: employeesLoading } = useEmployees();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAssign, setShowAssign] = useState(false);
  const [reassignTask, setReassignTask] = useState(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignConflict, setReassignConflict] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskApi.getAllTasks();
      setTasks(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "active"),
    [employees],
  );

  const filtered = useMemo(
    () => (statusFilter === "all" ? tasks : tasks.filter((task) => task.status === statusFilter)),
    [tasks, statusFilter],
  );

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "pending").length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    [tasks],
  );

  const handleReassign = useCallback(
    async (taskId, newEmployeeId, force = false) => {
      setReassignLoading(true);
      try {
        const data = await taskApi.reassignTask(taskId, newEmployeeId, force);
        toast.success("Task reassigned successfully");
        setReassignConflict(null);
        setReassignTask(null);
        await fetchTasks();
        return data;
      } catch (err) {
        const data = err.response?.data;
        if (data?.conflict) {
          const conflictEmployee = activeEmployees.find(
            (employee) => Number(employee.id) === Number(newEmployeeId),
          );
          setReassignConflict({
            taskId,
            newEmployeeId,
            conflicts: data.conflicts || [],
            employeeName: conflictEmployee?.name || data.employee?.name || "Selected employee",
            scheduledTime: data.conflicts?.[0]?.scheduled_time || reassignTask?.scheduled_time || null,
          });
          return;
        }
        toast.error(data?.message || "Failed to reassign task");
      } finally {
        setReassignLoading(false);
      }
    },
    [activeEmployees, fetchTasks, reassignTask],
  );

  const closeReassign = () => {
    if (reassignLoading) return;
    setReassignTask(null);
    setReassignConflict(null);
  };

  return (
    <div className="min-h-screen bg-[#EEF7F6]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}>
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl text-[#0F2C2E] leading-tight" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>Tasks</h1>
              <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">Assign tasks to employees and track their progress.</p>
            </div>
          </div>

          {activeTab === "active" && (
            <button
              type="button"
              onClick={() => setShowAssign(true)}
              disabled={!employeesLoading && employees.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
            >
              <Plus size={16} /> Assign Task
            </button>
          )}
        </div>

        <PageTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "active" ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={ClipboardList} label="Total Tasks" value={stats.total} color="#028090" bg="#DFF3F5" />
              <StatCard icon={Clock} label="Pending" value={stats.pending} color="#9A6A12" bg="#FBF0DC" />
              <StatCard icon={Loader2} label="In Progress" value={stats.inProgress} color="#0B3B3E" bg="#DCEBEA" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="#02C39A" bg="#DFF7F1" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <TaskFilterTabs active={statusFilter} onChange={setStatusFilter} />
              {!loading && <span className="text-xs text-[#6B8482]">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>}
            </div>

            {error && <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">{error}</div>}

            <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
              {loading ? <TableSkeleton /> : filtered.length === 0 ? <EmptyState hasEmployees={employees.length > 0} /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                        {['Task', 'Assigned To', 'Customer', 'Scheduled', 'Priority', 'Status'].map((heading) => (
                          <th key={heading} className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((task) => (
                        <tr key={task.id} className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC]">
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-[#028090]">#{task.id}</div>
                            <div className="text-xs text-[#6B8482] mt-0.5">{TASK_TYPE_LABEL[task.task_type] || task.task_type}</div>
                            {task.order && <Link to="/admin/orders" className="inline-flex items-center gap-1 text-[11px] font-medium mt-1 px-2 py-0.5 rounded-md bg-[#DFF3F5] text-[#028090]"><ClipboardList size={11} />Order #{task.order.id}</Link>}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="text-[#0F2C2E] font-medium">{task.employee?.name || "—"}</div>
                            {task.employee?.designation && <div className="text-[11px] text-[#6B8482] mt-0.5">{task.employee.designation}</div>}
                            {task.employee?.status === "inactive" && task.status !== "completed" && (
                              <div className="mt-1">
                                <InactiveEmployeeBadge />
                                <button type="button" onClick={() => setReassignTask(task)} className="inline-flex items-center gap-1 text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-md text-[#B3261E] bg-[#FEF2F2]">
                                  <RefreshCw size={9} /> Reassign
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="text-[#0F2C2E] font-medium">{task.customer_name || "—"}</div>
                            {task.customer_phone && <div className="flex items-center gap-1 text-[11px] text-[#6B8482] mt-0.5"><Phone size={11} />{task.customer_phone}</div>}
                            {task.customer_address && <div className="flex items-center gap-1 text-[11px] text-[#6B8482] mt-0.5"><MapPin size={11} />{task.customer_address}</div>}
                          </td>
                          <td className="py-3.5 px-5 text-[#6B8482] whitespace-nowrap">{formatScheduled(task.scheduled_time)}</td>
                          <td className="py-3.5 px-5"><PriorityPill priority={task.priority} /></td>
                          <td className="py-3.5 px-5"><StatusPill status={task.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!employeesLoading && employees.length === 0 && tasks.length === 0 && (
              <div className="flex items-start gap-2.5 rounded-xl border border-[#F3C7B8] bg-[#FBE4DC] px-4 py-3">
                <AlertTriangle size={16} className="text-[#9A2E12] mt-0.5 shrink-0" />
                <p className="text-[13px] text-[#9A2E12]">You need to create an employee first — go to the Employees page and click <span className="font-semibold">Add Employee</span>.</p>
              </div>
            )}
          </>
        ) : <TaskHistoryTab employees={employees} />}
      </div>

      <AssignTaskModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        employees={employees}
        employeesLoading={employeesLoading}
        onAssigned={fetchTasks}
      />

      {reassignTask && (
        <div className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeReassign}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-[0_20px_50px_rgba(5,40,42,0.25)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl text-[#0F2C2E]" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>Reassign Task</h2>
                <p className="text-[13px] text-[#5A7A79] mt-1">{TASK_TYPE_LABEL[reassignTask.task_type] || reassignTask.task_type} task{reassignTask.order_id ? ` for Order #${reassignTask.order_id}` : ""}</p>
                <p className="text-[11px] text-[#B3261E] mt-1 font-medium">Currently assigned to: {reassignTask.employee?.name || "Unknown"} (Inactive)</p>
              </div>
              <button type="button" onClick={closeReassign} disabled={reassignLoading} className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] flex items-center justify-center disabled:opacity-50"><X size={16} /></button>
            </div>

            <div className="space-y-3">
              <label className="block text-[13px] font-medium text-[#0F2C2E]">Select Active Employee <span className="text-[#B3261E]">*</span></label>
              {activeEmployees.length === 0 ? (
                <p className="text-[13px] text-[#6B8482] bg-[#EEF7F6] rounded-lg px-3 py-2.5">No active employees available. Please activate an employee first.</p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {activeEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleReassign(reassignTask.id, employee.id, false)}
                      disabled={reassignLoading}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#D8ECEA] text-left transition-all hover:border-[#028090] hover:bg-[#EEF7F6] disabled:opacity-50"
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}>
                        {employee.name?.charAt(0)?.toUpperCase() || "E"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#0F2C2E] truncate">{employee.name}</div>
                        {employee.designation && <div className="text-[11px] text-[#6B8482]">{employee.designation}</div>}
                      </div>
                      {reassignLoading && <Loader2 size={14} className="animate-spin text-[#028090]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {reassignConflict && reassignTask && (
        <ConflictModal
          title="Reassign Schedule Conflict"
          conflicts={reassignConflict.conflicts}
          employeeName={reassignConflict.employeeName}
          scheduledTime={reassignConflict.scheduledTime}
          loading={reassignLoading}
          onChooseAnother={() => setReassignConflict(null)}
          onAssignAnyway={() =>
            handleReassign(
              reassignConflict.taskId,
              reassignConflict.newEmployeeId,
              true,
            )
          }
        />
      )}
    </div>
  );
}
