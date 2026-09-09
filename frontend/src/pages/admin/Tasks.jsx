import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {
  ClipboardList,
  Clock,
  Loader2,
  CheckCircle2,
  Phone,
  MapPin,
  Sparkles,
  Inbox,
  Plus,
  X,
  AlertTriangle,
  UserPlus,
  History,
  UserX,
  RefreshCw,
} from "lucide-react";

import toast from "react-hot-toast";

import { taskApi } from "../../api/taskApi";
import { useEmployees } from "../../hooks/useEmployees";
import { getShopCustomers } from "../../api/customerApi";

import StatusPill from "../../components/layout/StatusPill";
import TaskFilterTabs from "../../components/layout/TaskFilterTabs";

/* ================================================================
   TASK CONSTANTS
================================================================ */

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPE_LABEL).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

/* ================================================================
   HELPERS
================================================================ */

function formatScheduled(iso) {
  if (!iso) return "—";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ================================================================
   PRESENTATIONAL HELPERS
================================================================ */

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="group bg-white border border-[#D8ECEA] rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-[0_1px_2px_rgba(15,44,46,0.04)] hover:shadow-[0_8px_24px_rgba(15,44,46,0.08)] hover:-translate-y-0.5 transition-all duration-300">
      <div
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
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
          style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}


/* ================================================================
   PRIORITY PILL
================================================================ */

/* ------------------------------------------------------------------ */
/* Inactive Employee Badge                                              */
/* ------------------------------------------------------------------ */

function InactiveEmployeeBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1"
      style={{ color: "#B3261E", background: "#FDECEC" }}>
      <UserX size={10} /> EMPLOYEE INACTIVE
    </span>
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

/* ================================================================
   TABLE SKELETON
================================================================ */

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse"
        />
      ))}
    </div>
  );
}

/* ================================================================
   EMPTY STATE
================================================================ */

function EmptyState({ hasEmployees }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "#EEF7F6" }}
      >
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

/* ================================================================
   FIELD
================================================================ */

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

/* ================================================================
   COMMON INPUT CLASS
================================================================ */

const inputCls =
  "w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition";

/* ================================================================
   EMPTY FORM
================================================================ */

const EMPTY_FORM = {
  priority: "normal",
  scheduled_time: "",
  order_id: "",
  customer_id: "",
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  notes: "",
};

/*
 * Each task type gets its own employee.
 *
 * Example:
 *
 * pickup   -> employee 5
 * wash     -> employee 7
 * dry      -> employee 7
 * iron     -> employee 8
 * pack     -> employee 8
 * delivery -> employee 5
 */
const EMPTY_ASSIGNMENTS = {
  pickup: "",
  wash: "",
  dry: "",
  iron: "",
  pack: "",
  delivery: "",
};

/* ================================================================
   ASSIGN TASK MODAL
================================================================ */

function AssignTaskModal({
  isOpen,
  onClose,
  employees,
  employeesLoading,
  onAssigned,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [assignments, setAssignments] = useState(EMPTY_ASSIGNMENTS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [orderTasks, setOrderTasks] = useState([]);
  const [orderTasksLoading, setOrderTasksLoading] = useState(false);

  /* --------------------------------------------------------------
     Minimum date/time
  -------------------------------------------------------------- */

  const minDateTime = useMemo(() => {
    const now = new Date();

    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

    return now.toISOString().slice(0, 16);
  }, []);

  /* --------------------------------------------------------------
     Load customers + orders
  -------------------------------------------------------------- */

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadModalData = async () => {
      setCustomersLoading(true);
      setOrdersLoading(true);

      try {
        const customerRes = await getShopCustomers();

        if (!cancelled) {
          setCustomers(
            Array.isArray(customerRes?.data)
              ? customerRes.data
              : Array.isArray(customerRes)
                ? customerRes
                : [],
          );
        }
      } catch {
        if (!cancelled) {
          setCustomers([]);
        }
      } finally {
        if (!cancelled) {
          setCustomersLoading(false);
        }
      }

      try {
        const { getShopOrders } = await import("../../api/orderApi");

        const orderRes = await getShopOrders({
          status: "pending",
        });

        if (!cancelled) {
          setOrders(
            Array.isArray(orderRes?.data)
              ? orderRes.data
              : Array.isArray(orderRes)
                ? orderRes
                : [],
          );
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    };

    loadModalData();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  /* --------------------------------------------------------------
     Load existing tasks for selected order
  -------------------------------------------------------------- */

  useEffect(() => {
    if (!form.order_id) {
      setOrderTasks([]);
      return;
    }

    let cancelled = false;

    const loadOrderTasks = async () => {
      setOrderTasksLoading(true);

      try {
        const res = await taskApi.getOrderTasks(form.order_id);

        if (!cancelled) {
          const data = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];

          setOrderTasks(data);
        }
      } catch {
        if (!cancelled) {
          setOrderTasks([]);
        }
      } finally {
        if (!cancelled) {
          setOrderTasksLoading(false);
        }
      }
    };

    loadOrderTasks();

    return () => {
      cancelled = true;
    };
  }, [form.order_id]);

  /* --------------------------------------------------------------
     Existing task types
  -------------------------------------------------------------- */

  const existingTaskTypes = useMemo(() => {
    return new Set(orderTasks.map((task) => task.task_type));
  }, [orderTasks]);

  /* --------------------------------------------------------------
     Available employees
  -------------------------------------------------------------- */

  const getAvailableEmployees = useCallback(
    (taskType) => {
      if (existingTaskTypes.has(taskType)) {
        return [];
      }

      return employees;
    },
    [employees, existingTaskTypes],
  );

  /* --------------------------------------------------------------
     Reset
  -------------------------------------------------------------- */

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setAssignments(EMPTY_ASSIGNMENTS);
    setError("");
    setOrderTasks([]);

    onClose();
  };

  /* --------------------------------------------------------------
     Form change
  -------------------------------------------------------------- */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* --------------------------------------------------------------
     Employee assignment change
  -------------------------------------------------------------- */

  const handleEmployeeChange = (taskType, employeeId) => {
    setAssignments((prev) => ({
      ...prev,
      [taskType]: employeeId,
    }));
  };

  /* --------------------------------------------------------------
     Customer selection
  -------------------------------------------------------------- */

  const handleCustomerSelect = (e) => {
    const id = e.target.value;

    if (!id) {
      setForm((prev) => ({
        ...prev,
        customer_id: "",
      }));

      return;
    }

    const customer = customers.find((item) => String(item.id) === String(id));

    setForm((prev) => ({
      ...prev,
      customer_id: id,
      customer_name: customer?.name || "",
      customer_phone: customer?.phone || "",
      customer_address: customer
        ? [customer.address, customer.city].filter(Boolean).join(", ")
        : "",
    }));
  };

  /* --------------------------------------------------------------
     Customer name manual change
  -------------------------------------------------------------- */

  const handleNameChange = (e) => {
    const { value } = e.target;

    setForm((prev) => ({
      ...prev,
      customer_name: value,
      customer_id: "",
    }));
  };

  /* --------------------------------------------------------------
     Group task assignments by employee
  -------------------------------------------------------------- */

  const selectedAssignments = useMemo(() => {
    const grouped = {};

    Object.entries(assignments).forEach(([taskType, employeeId]) => {
      if (!employeeId) return;

      const employeeIdNumber = Number(employeeId);

      if (!grouped[employeeIdNumber]) {
        grouped[employeeIdNumber] = {
          employee_id: employeeIdNumber,
          task_types: [],
        };
      }

      grouped[employeeIdNumber].task_types.push(taskType);
    });

    return Object.values(grouped);
  }, [assignments]);

  /* --------------------------------------------------------------
     Number of selected tasks
  -------------------------------------------------------------- */

  const selectedTaskCount = useMemo(() => {
    return Object.values(assignments).filter(Boolean).length;
  }, [assignments]);

  /* --------------------------------------------------------------
     Submit
  -------------------------------------------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    /* No task selected */
    if (selectedTaskCount === 0) {
      setError("Please assign at least one task to an employee.");

      return;
    }

    /* Scheduled time validation */
    if (
      form.scheduled_time &&
      new Date(form.scheduled_time).getTime() < Date.now()
    ) {
      setError("Scheduled time cannot be in the past.");

      return;
    }

    /* Prevent duplicate task types */
    const duplicateTaskTypes = Object.keys(assignments).filter(
      (taskType) => assignments[taskType] && existingTaskTypes.has(taskType),
    );

    if (duplicateTaskTypes.length > 0) {
      setError(
        `These task types are already assigned: ${duplicateTaskTypes
          .map((type) => TASK_TYPE_LABEL[type] || type)
          .join(", ")}`,
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * New API payload.
       *
       * Example:
       *
       * assignments: [
       *   {
       *     employee_id: 5,
       *     task_types: ["pickup", "delivery"]
       *   },
       *   {
       *     employee_id: 7,
       *     task_types: ["wash", "dry"]
       *   }
       * ]
       */
      const payload = {
        assignments: selectedAssignments,

        priority: form.priority,

        scheduled_time: form.scheduled_time,

        customer_name: form.customer_name,

        customer_phone: form.customer_phone || null,

        customer_address: form.customer_address || null,

        notes: form.notes || null,
      };

      if (form.order_id) {
        payload.order_id = Number(form.order_id);
      }

      if (form.customer_id) {
        payload.customer_id = Number(form.customer_id);
      }

      await taskApi.assignTask(payload);

      toast.success(
        selectedTaskCount > 1
          ? `${selectedTaskCount} tasks assigned successfully`
          : "Task assigned successfully",
      );

      onAssigned?.();

      resetAndClose();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to assign task";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={resetAndClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ------------------------------------------------------
            Header
        ------------------------------------------------------ */}

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2
              className="text-2xl text-[#0F2C2E] leading-tight"
              style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
              }}
            >
              Assign Tasks
            </h2>

            <p className="text-[13px] text-[#5A7A79] mt-1">
              Assign different tasks to different employees.
            </p>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center hover:bg-[#DFF3F5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ----------------------------------------------------
              Order
          ---------------------------------------------------- */}

          <Field label="Link to Order (optional)">
            <select
              name="order_id"
              value={form.order_id}
              onChange={handleChange}
              disabled={ordersLoading}
              className={inputCls}
            >
              <option value="">
                {ordersLoading
                  ? "Loading orders…"
                  : "No order (standalone task)"}
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

          {/* ----------------------------------------------------
              Existing tasks
          ---------------------------------------------------- */}

          {form.order_id && orderTasksLoading && (
            <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-3 text-xs text-[#6B8482] flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#028090]" />
              Checking existing tasks for this order…
            </div>
          )}

          {form.order_id && !orderTasksLoading && orderTasks.length > 0 && (
            <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] px-4 py-3">
              <div className="text-xs font-semibold text-[#0F2C2E] mb-2">
                Existing Tasks
              </div>

              <div className="flex flex-wrap gap-2">
                {orderTasks.map((task) => (
                  <span
                    key={task.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#D8ECEA] text-[11px] text-[#028090]"
                  >
                    {TASK_TYPE_LABEL[task.task_type] || task.task_type}

                    {task.employee?.name && (
                      <span className="text-[#6B8482]">
                        → {task.employee.name}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              Task → Employee assignment
          ---------------------------------------------------- */}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] font-medium text-[#0F2C2E]">
                Task Assignments <span className="text-[#B3261E]">*</span>
              </label>

              <span className="text-[11px] text-[#6B8482]">
                {selectedTaskCount} selected
              </span>
            </div>

            <div className="border border-[#D8ECEA] rounded-xl overflow-hidden">
              {TASK_TYPE_OPTIONS.map((option) => {
                const taskType = option.value;

                const selectedEmployee = assignments[taskType];

                const alreadyExists = existingTaskTypes.has(taskType);

                const availableEmployees = getAvailableEmployees(taskType);

                return (
                  <div
                    key={taskType}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 border-b last:border-b-0 border-[#EEF7F6] ${
                      alreadyExists ? "bg-[#FAFDFC]" : "bg-white"
                    }`}
                  >
                    {/* Task name */}

                    <div className="flex items-center gap-2 min-w-[140px]">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
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
                        {option.label}
                      </span>

                      {alreadyExists && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-[#8AA19F] bg-[#EEF7F6] px-1.5 py-0.5 rounded">
                          Assigned
                        </span>
                      )}
                    </div>

                    {/* Employee */}

                    <div className="flex-1">
                      <select
                        value={selectedEmployee}
                        onChange={(e) =>
                          handleEmployeeChange(taskType, e.target.value)
                        }
                        disabled={
                          employeesLoading ||
                          orderTasksLoading ||
                          alreadyExists ||
                          availableEmployees.length === 0
                        }
                        className={`${inputCls} ${
                          alreadyExists ? "cursor-not-allowed opacity-60" : ""
                        }`}
                      >
                        <option value="">
                          {alreadyExists
                            ? "Task already assigned"
                            : employeesLoading
                              ? "Loading employees…"
                              : availableEmployees.length === 0
                                ? "No employees available"
                                : "Select employee"}
                        </option>

                        {availableEmployees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}

                            {employee.designation
                              ? ` — ${employee.designation}`
                              : ""}

                            {employee.status === "inactive"
                              ? " (inactive)"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-2 text-[11px] text-[#6B8482]">
              Each task can be assigned to a different employee. You can also
              assign multiple tasks to the same employee.
            </p>
          </div>

          {/* ----------------------------------------------------
              Assignment summary
          ---------------------------------------------------- */}

          {selectedAssignments.length > 0 && (
            <div className="rounded-xl border border-[#D8ECEA] bg-[#EEF7F6] p-3.5">
              <div className="text-xs font-semibold text-[#0F2C2E] mb-2">
                Assignment Summary
              </div>

              <div className="space-y-2">
                {selectedAssignments.map((assignment) => {
                  const employee = employees.find(
                    (item) =>
                      Number(item.id) === Number(assignment.employee_id),
                  );

                  return (
                    <div
                      key={assignment.employee_id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 bg-white rounded-lg px-3 py-2 border border-[#D8ECEA]"
                    >
                      <span className="text-[12px] font-semibold text-[#0F2C2E]">
                        {employee?.name || "Employee"}
                      </span>

                      <div className="flex flex-wrap gap-1">
                        {assignment.task_types.map((taskType) => (
                          <span
                            key={taskType}
                            className="px-1.5 py-0.5 rounded bg-[#DFF3F5] text-[#028090] text-[10px] font-semibold"
                          >
                            {TASK_TYPE_LABEL[taskType] || taskType}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              Priority
          ---------------------------------------------------- */}

          <Field label="Priority">
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="normal">Normal</option>

              <option value="urgent">Urgent</option>
            </select>
          </Field>

          {/* ----------------------------------------------------
              Scheduled time
          ---------------------------------------------------- */}

          <Field label="Scheduled Date & Time" required>
            <input
              name="scheduled_time"
              type="datetime-local"
              value={form.scheduled_time}
              onChange={handleChange}
              min={minDateTime}
              required
              className={inputCls}
            />
          </Field>

          {/* ----------------------------------------------------
              Customer
          ---------------------------------------------------- */}

          <Field label="Customer">
            <select
              value={form.customer_id}
              onChange={handleCustomerSelect}
              disabled={customersLoading}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">
                {customersLoading
                  ? "Loading customers…"
                  : "Choose from saved customers (optional)"}
              </option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}

                  {customer.phone ? ` · ${customer.phone}` : ""}
                </option>
              ))}
            </select>

            {!customersLoading && customers.length > 0 && (
              <p className="mt-1 text-[11px] text-[#6B8482]">
                Pick a customer to auto-fill their details below.
              </p>
            )}
          </Field>

          {/* ----------------------------------------------------
              Customer name
          ---------------------------------------------------- */}

          <Field label="Customer Name" required>
            <input
              name="customer_name"
              value={form.customer_name}
              onChange={handleNameChange}
              required
              placeholder="e.g. Ananya Verma"
              className={inputCls}
            />
          </Field>

          {/* ----------------------------------------------------
              Phone + address
          ---------------------------------------------------- */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Customer Phone">
              <input
                name="customer_phone"
                value={form.customer_phone}
                onChange={handleChange}
                placeholder="99XXXXXXXX"
                className={inputCls}
              />
            </Field>

            <Field label="Customer Address">
              <input
                name="customer_address"
                value={form.customer_address}
                onChange={handleChange}
                placeholder="Sector 62, Noida"
                className={inputCls}
              />
            </Field>
          </div>

          {/* ----------------------------------------------------
              Notes
          ---------------------------------------------------- */}

          <Field label="Notes">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Any special instructions…"
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* ----------------------------------------------------
              Error
          ---------------------------------------------------- */}

          {error && (
            <div className="text-[13px] text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          {/* ----------------------------------------------------
              Submit
          ---------------------------------------------------- */}

          <button
            type="submit"
            disabled={loading || selectedTaskCount === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition hover:brightness-105 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #028090, #00A896)",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Assigning…
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Assign{" "}
                {selectedTaskCount > 0
                  ? `${selectedTaskCount} Task${
                      selectedTaskCount > 1 ? "s" : ""
                    }`
                  : "Tasks"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ================================================================
   PAGE TABS
================================================================ */

const PAGE_TABS = [
  {
    key: "active",
    label: "Active Tasks",
    icon: ClipboardList,
  },
  {
    key: "history",
    label: "Task History",
    icon: History,
  },
];

function PageTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-[#EEF7F6] rounded-xl w-fit">
      {PAGE_TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
            active === key
              ? "bg-white text-[#028090] shadow-sm"
              : "text-[#6B8482] hover:text-[#028090] hover:bg-white/50"
          }`}
        >
          <Icon size={14} />

          {label}
        </button>
      ))}
    </div>
  );
}

/* ================================================================
   TASK HISTORY TAB
================================================================ */

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

  /* --------------------------------------------------------------
     Fetch history
  -------------------------------------------------------------- */

  const fetchHistory = useCallback(async () => {
    setLoading(true);

    try {
      const params = {};

      if (filters.employee_id) {
        params.employee_id = filters.employee_id;
      }

      if (filters.customer) {
        params.customer = filters.customer;
      }

      if (filters.order_id) {
        params.order_id = filters.order_id;
      }

      if (filters.task_type) {
        params.task_type = filters.task_type;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.startDate) {
        params.startDate = filters.startDate;
      }

      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const data = await taskApi.getAdminTaskHistory(params);

      setHistory(
        Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [],
      );

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

  /* --------------------------------------------------------------
     Filter change
  -------------------------------------------------------------- */

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* --------------------------------------------------------------
     Clear filters
  -------------------------------------------------------------- */

  const clearFilters = () => {
    setFilters({
      employee_id: "",
      customer: "",
      order_id: "",
      task_type: "",
      status: "",
      startDate: "",
      endDate: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      {/* --------------------------------------------------------
          Filters
      -------------------------------------------------------- */}

      <div className="bg-white border border-[#D8ECEA] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0F2C2E]">
            Filter History
          </h3>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-[#028090] hover:underline font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Employee */}

          <select
            value={filters.employee_id}
            onChange={(e) => handleFilterChange("employee_id", e.target.value)}
            className={inputCls}
          >
            <option value="">All Employees</option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>

          {/* Customer */}

          <input
            type="text"
            placeholder="Customer name"
            value={filters.customer}
            onChange={(e) => handleFilterChange("customer", e.target.value)}
            className={inputCls}
          />

          {/* Order */}

          <input
            type="number"
            placeholder="Order ID"
            value={filters.order_id}
            onChange={(e) => handleFilterChange("order_id", e.target.value)}
            className={inputCls}
          />

          {/* Task type */}

          <select
            value={filters.task_type}
            onChange={(e) => handleFilterChange("task_type", e.target.value)}
            className={inputCls}
          >
            <option value="">All Task Types</option>

            {TASK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Status */}

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className={inputCls}
          >
            <option value="">All Statuses</option>

            <option value="pending">Pending</option>

            <option value="in_progress">In Progress</option>

            <option value="completed">Completed</option>
          </select>

          {/* Dates */}

          <div className="flex gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className={inputCls}
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------
          Error
      -------------------------------------------------------- */}

      {error && (
        <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* --------------------------------------------------------
          History table
      -------------------------------------------------------- */}

      <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "#EEF7F6",
              }}
            >
              <History size={24} className="text-[#028090]" strokeWidth={1.7} />
            </div>

            <p className="text-sm font-medium text-[#0F2C2E]">
              No task history found
            </p>

            <p className="text-xs text-[#6B8482] mt-1">
              Adjust filters or check back later.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Order
                  </th>

                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Customer
                  </th>

                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Task Type
                  </th>

                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Employee
                  </th>

                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Scheduled
                  </th>

                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Started
                  </th>

                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Completed
                  </th>

                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Status
                  </th>

                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                    Notes
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150"
                  >
                    {/* Order */}

                    <td className="py-3.5 px-5">
                      {task.order ? (
                        <Link
                          to="/admin/orders"
                          className="text-[12px] font-semibold text-[#028090]"
                        >
                          Order #{task.order.id}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[#6B8482]">—</span>
                      )}
                    </td>

                    {/* Customer */}

                    <td className="py-3.5 px-5">
                      <div className="text-[#0F2C2E] font-medium">
                        {task.customer_name || "—"}
                      </div>

                      {task.customer_phone && (
                        <div className="text-[11px] text-[#6B8482]">
                          {task.customer_phone}
                        </div>
                      )}
                    </td>

                    {/* Task type */}

                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-semibold text-[#028090]">
                        {TASK_TYPE_LABEL[task.task_type] || task.task_type}
                      </span>
                    </td>

                    {/* Employee */}

                    <td className="py-3.5 px-5">
                      <div className="text-[#0F2C2E] font-medium">
                        {task.employee?.name || "—"}
                      </div>

                      {task.employee_id && (
                        <div className="text-[11px] text-[#6B8482]">
                          ID: {task.employee_id}
                        </div>
                      )}
                    </td>

                    {/* Scheduled */}

                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">
                      {formatScheduled(task.scheduled_time)}
                    </td>

                    {/* Started */}

                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">
                      {formatScheduled(task.started_at)}
                    </td>

                    {/* Completed */}

                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">
                      {formatScheduled(task.completed_at)}
                    </td>

                    {/* Status */}

                    <td className="py-3.5 px-5">
                      <StatusPill status={task.status} />
                    </td>

                    {/* Notes */}

                    <td className="py-3.5 px-5">
                      <div className="text-[11px] text-[#6B8482] max-w-[150px] truncate">
                        {task.notes || "—"}
                      </div>
                    </td>
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

/* ================================================================
   MAIN TASKS PAGE
================================================================ */

export default function Tasks() {
  const { employees, loading: employeesLoading } = useEmployees();

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [showAssign, setShowAssign] = useState(false);
  const [reassignTask, setReassignTask] = useState(null);
  const [reassignLoading, setReassignLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("active");

  /* --------------------------------------------------------------
     Fetch tasks
  -------------------------------------------------------------- */

  const fetchTasks = useCallback(async () => {
    setLoading(true);

    try {
      const data = await taskApi.getAllTasks();

      setTasks(
        Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [],
      );

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


  /* --------------------------------------------------------------
     Filter tasks
  -------------------------------------------------------------- */

  const handleReassign = useCallback(async (taskId, newEmployeeId) => {
    setReassignLoading(true);
    try {
      await taskApi.reassignTask(taskId, newEmployeeId);
      toast.success("Task reassigned successfully");
      setReassignTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reassign task");
    } finally {
      setReassignLoading(false);
    }
  }, [fetchTasks]);

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === "active"),
    [employees],
  );


  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  /* --------------------------------------------------------------
     Stats
  -------------------------------------------------------------- */

  const stats = useMemo(
    () => ({
      total: tasks.length,

      pending: tasks.filter((task) => task.status === "pending").length,

      inProgress: tasks.filter((task) => task.status === "in_progress").length,

      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    [tasks],
  );

  /* ==============================================================
     RENDER
  ============================================================== */

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#EEF7F6",
      }}
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #028090, #02C39A)",
              }}
            >
              <Sparkles size={18} className="text-white" strokeWidth={2} />
            </div>

            <div>
              <h1
                className="text-2xl sm:text-3xl text-[#0F2C2E] leading-tight"
                style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                }}
              >
                Tasks
              </h1>

              <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
                Assign tasks to employees and track their progress.
              </p>
            </div>
          </div>

          {activeTab === "active" && (
            <button
              type="button"
              onClick={() => setShowAssign(true)}
              disabled={!employeesLoading && employees.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: "linear-gradient(135deg, #028090, #00A896)",
              }}
              title={
                !employeesLoading && employees.length === 0
                  ? "Add an employee first"
                  : undefined
              }
            >
              <Plus size={16} />
              Assign Task
            </button>
          )}
        </div>

        {/* ======================================================
            PAGE TABS
        ====================================================== */}

        <PageTabs active={activeTab} onChange={setActiveTab} />

        {/* ======================================================
            ACTIVE TASKS
        ====================================================== */}

        {activeTab === "active" ? (
          <>
            {/* --------------------------------------------------
                KPI
            -------------------------------------------------- */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                icon={ClipboardList}
                label="Total Tasks"
                value={stats.total}
                color="#028090"
                bg="#DFF3F5"
              />

              <StatCard
                icon={Clock}
                label="Pending"
                value={stats.pending}
                color="#9A6A12"
                bg="#FBF0DC"
              />

              <StatCard
                icon={Loader2}
                label="In Progress"
                value={stats.inProgress}
                color="#0B3B3E"
                bg="#DCEBEA"
              />

              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={stats.completed}
                color="#02C39A"
                bg="#DFF7F1"
              />
            </div>

            {/* --------------------------------------------------
                Status filters
            -------------------------------------------------- */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <TaskFilterTabs
                active={statusFilter}
                onChange={setStatusFilter}
              />

              {!loading && (
                <span className="text-xs text-[#6B8482]">
                  {filtered.length} task
                  {filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* --------------------------------------------------
                Error
            -------------------------------------------------- */}

            {error && (
              <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* --------------------------------------------------
                Tasks table
            -------------------------------------------------- */}

            <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
              {loading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <EmptyState hasEmployees={employees.length > 0} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                          Task
                        </th>

                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                          Assigned To
                        </th>

                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                          Customer
                        </th>

                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                          Scheduled
                        </th>

                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                          Priority
                        </th>

                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((task) => (
                        <tr
                          key={task.id}
                          className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150"
                        >
                          {/* Task */}

                          <td className="py-3.5 px-5">
                            <div
                              className="font-semibold"
                              style={{
                                color: "#028090",
                              }}
                            >
                              #{task.id}
                            </div>

                            <div className="text-xs text-[#6B8482] mt-0.5">
                              {TASK_TYPE_LABEL[task.task_type] ||
                                task.task_type}
                            </div>

                            {task.order && (
                              <Link
                                to="/admin/orders"
                                className="inline-flex items-center gap-1 text-[11px] font-medium mt-1 px-2 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: "#DFF3F5",
                                  color: "#028090",
                                }}
                              >
                                <ClipboardList size={11} />
                                Order #{task.order.id}
                              </Link>
                            )}
                          </td>

                          {/* Employee */}

                          <td className="py-3.5 px-5">
                            <div className="text-[#0F2C2E] font-medium">
                              {task.employee?.name || "—"}
                            </div>

                            {task.employee?.designation && (
                              <div className="text-[11px] text-[#6B8482] mt-0.5">
                                {task.employee.designation}
                              </div>
                            )}

                            {task.employee?.status === "inactive" && task.status !== "completed" && (
                              <div className="mt-1">
                                <InactiveEmployeeBadge />
                                <button
                                  onClick={() => setReassignTask(task)}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-md transition-colors hover:bg-[#FDECEC]"
                                  style={{ color: "#B3261E", background: "#FEF2F2" }}
                                >
                                  <RefreshCw size={9} /> Reassign
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Customer */}

                          <td className="py-3.5 px-5">
                            <div className="text-[#0F2C2E] font-medium">
                              {task.customer_name || "—"}
                            </div>

                            {task.customer_phone && (
                              <div className="flex items-center gap-1 text-[11px] text-[#6B8482] mt-0.5">
                                <Phone size={11} />

                                {task.customer_phone}
                              </div>
                            )}

                            {task.customer_address && (
                              <div className="flex items-center gap-1 text-[11px] text-[#6B8482] mt-0.5">
                                <MapPin size={11} />

                                {task.customer_address}
                              </div>
                            )}
                          </td>

                          {/* Scheduled */}

                          <td className="py-3.5 px-5 text-[#6B8482] whitespace-nowrap">
                            {formatScheduled(task.scheduled_time)}
                          </td>

                          {/* Priority */}

                          <td className="py-3.5 px-5">
                            <PriorityPill priority={task.priority} />
                          </td>

                          {/* Status */}

                          <td className="py-3.5 px-5">
                            <StatusPill status={task.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* --------------------------------------------------
                No employees warning
            -------------------------------------------------- */}

            {!employeesLoading &&
              employees.length === 0 &&
              tasks.length === 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#F3C7B8] bg-[#FBE4DC] px-4 py-3">
                  <AlertTriangle
                    size={16}
                    className="text-[#9A2E12] mt-0.5 shrink-0"
                  />

                  <p className="text-[13px] text-[#9A2E12]">
                    You need to create an employee first — go to the Employees
                    page and click{" "}
                    <span className="font-semibold">Add Employee</span>.
                  </p>
                </div>
              )}
          </>
        ) : (
          /* ====================================================
             HISTORY
          ==================================================== */

          <TaskHistoryTab employees={employees} />
        )}
      </div>

      {/* ========================================================
          ASSIGN TASK MODAL
      ======================================================== */}

      <AssignTaskModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        employees={employees}
        employeesLoading={employeesLoading}
        onAssigned={fetchTasks}
      />

      {/* Reassign Modal */}
      {reassignTask && (
        <div
          className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !reassignLoading && setReassignTask(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2
                  className="text-xl text-[#0F2C2E] leading-tight"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Reassign Task
                </h2>
                <p className="text-[13px] text-[#5A7A79] mt-1">
                  {TASK_TYPE_LABEL[reassignTask.task_type] || reassignTask.task_type} task
                  {reassignTask.order_id ? ` for Order #${reassignTask.order_id}` : ""}
                </p>
                <p className="text-[11px] text-[#B3261E] mt-1 font-medium">
                  Currently assigned to: {reassignTask.employee?.name || "Unknown"} (Inactive)
                </p>
              </div>
              <button
                onClick={() => !reassignLoading && setReassignTask(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center hover:bg-[#DFF3F5] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[13px] font-medium text-[#0F2C2E]">
                Select Active Employee <span className="text-[#B3261E]">*</span>
              </label>

              {activeEmployees.length === 0 ? (
                <p className="text-[13px] text-[#6B8482] bg-[#EEF7F6] rounded-lg px-3 py-2.5">
                  No active employees available. Please activate an employee first.
                </p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {activeEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleReassign(reassignTask.id, emp.id)}
                      disabled={reassignLoading}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#D8ECEA] text-left transition-all hover:border-[#028090] hover:bg-[#EEF7F6] disabled:opacity-50"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
                      >
                        {emp.name?.charAt(0)?.toUpperCase() || "E"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#0F2C2E] truncate">
                          {emp.name}
                        </div>
                        {emp.designation && (
                          <div className="text-[11px] text-[#6B8482]">
                            {emp.designation}
                          </div>
                        )}
                      </div>
                      {reassignLoading && (
                        <Loader2 size={14} className="animate-spin text-[#028090]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
