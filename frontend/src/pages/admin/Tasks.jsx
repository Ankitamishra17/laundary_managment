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
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import { taskApi } from "../../api/taskApi";
import { useEmployees } from "../../hooks/useEmployees";
import { getShopCustomers } from "../../api/customerApi";
import { getShopOrders } from "../../api/orderApi";
import StatusPill from "../../components/layout/StatusPill";
import TaskFilterTabs from "../../components/layout/TaskFilterTabs";

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const TASK_TYPE_OPTIONS = Object.entries(TASK_TYPE_LABEL).map(([value, label]) => ({ value, label }));

function formatScheduled(iso) {
  return new Date(iso).toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/* Presentational helpers                                              */
/* ------------------------------------------------------------------ */

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
        <div className="text-[11px] sm:text-xs text-[#6B8482] font-medium truncate">{label}</div>
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

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ hasEmployees }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF7F6" }}>
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

const inputCls =
  "w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition";

/* ------------------------------------------------------------------ */
/* Assign Task Modal                                                   */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  employee_id: "",
  priority: "normal",
  scheduled_time: "",
  order_id: "",
  customer_id: "",
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  notes: "",
};

function AssignTaskModal({
  isOpen,
  onClose,
  employees = [],
  employeesLoading,
  onAssigned,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [selectedTypes, setSelectedTypes] = useState([
    "pickup",
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] =
    useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] =
    useState(false);

  const [orderTasks, setOrderTasks] = useState([]);
  const [orderTasksLoading, setOrderTasksLoading] =
    useState(false);

  // ----------------------------------------------------------
  // Minimum allowed date/time
  // ----------------------------------------------------------

  const minDateTime = useMemo(() => {
    const now = new Date();

    now.setMinutes(
      now.getMinutes() - now.getTimezoneOffset()
    );

    return now.toISOString().slice(0, 16);
  }, []);

  // ----------------------------------------------------------
  // IMPORTANT:
  // This hook MUST be before `if (!isOpen) return null`
  // ----------------------------------------------------------

  const availableEmployees = useMemo(() => {
    if (
      !form.order_id ||
      orderTasks.length === 0
    ) {
      return employees;
    }

    const blockedEmployeeIds = new Set(
      orderTasks
        .filter((task) =>
          selectedTypes.includes(
            task.task_type
          )
        )
        .map((task) =>
          Number(task.employee_id)
        )
    );

    return employees.filter(
      (employee) =>
        !blockedEmployeeIds.has(
          Number(employee.id)
        )
    );
  }, [
    employees,
    orderTasks,
    selectedTypes,
    form.order_id,
  ]);

  // ----------------------------------------------------------
  // Load customers and orders
  // ----------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    // -----------------------------
    // Customers
    // -----------------------------

    setCustomersLoading(true);

    getShopCustomers()
      .then((res) => {
        if (cancelled) return;

        const data = Array.isArray(res?.data)
          ? res.data
          : [];

        setCustomers(data);
      })
      .catch((err) => {
        console.error(
          "Load customers error:",
          err
        );

        if (!cancelled) {
          setCustomers([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCustomersLoading(false);
        }
      });

    // -----------------------------
    // Orders
    // -----------------------------

    setOrdersLoading(true);

    getShopOrders({
      status: "pending",
    })
      .then((res) => {
        if (cancelled) return;

        const data = Array.isArray(res?.data)
          ? res.data
          : [];

        setOrders(data);
      })
      .catch((err) => {
        console.error(
          "Load orders error:",
          err
        );

        if (!cancelled) {
          setOrders([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // ----------------------------------------------------------
  // Load tasks when order changes
  // ----------------------------------------------------------

  useEffect(() => {
    if (!form.order_id) {
      setOrderTasks([]);
      setOrderTasksLoading(false);
      return;
    }

    let cancelled = false;

    setOrderTasksLoading(true);

    taskApi
      .getOrderTasks(form.order_id)
      .then((data) => {
        if (cancelled) return;

        setOrderTasks(
          Array.isArray(data)
            ? data
            : []
        );
      })
      .catch((err) => {
        console.error(
          "Load order tasks error:",
          err
        );

        if (!cancelled) {
          setOrderTasks([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOrderTasksLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.order_id]);

  // ----------------------------------------------------------
  // NOW conditional return
  // ----------------------------------------------------------

  if (!isOpen) {
    return null;
  }

  // ----------------------------------------------------------
  // Form change
  // ----------------------------------------------------------

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ----------------------------------------------------------
  // Customer selection
  // ----------------------------------------------------------

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;

    const customer = customers.find(
      (item) =>
        String(item.id) ===
        String(customerId)
    );

    setForm((prev) => ({
      ...prev,

      customer_id: customerId,

      customer_name:
        customer?.name || "",

      customer_phone:
        customer?.phone || "",

      customer_address: customer
        ? [
            customer.address,
            customer.city,
          ]
            .filter(Boolean)
            .join(", ")
        : "",
    }));

    setError("");
  };

  // ----------------------------------------------------------
  // Customer name manual edit
  // ----------------------------------------------------------

  const handleNameChange = (e) => {
    const { value } = e.target;

    setForm((prev) => ({
      ...prev,

      customer_name: value,

      // If manually changed,
      // saved customer selection is no longer reliable.
      customer_id: "",
    }));

    setError("");
  };

  // ----------------------------------------------------------
  // Task type selection
  // ----------------------------------------------------------

  const toggleTaskType = (type) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter(
          (item) => item !== type
        );
      }

      return [
        ...prev,
        type,
      ];
    });

    // Employee selection may no longer be valid
    // after changing task types.
    setForm((prev) => ({
      ...prev,
      employee_id: "",
    }));

    setError("");
  };

  // ----------------------------------------------------------
  // Reset
  // ----------------------------------------------------------

  const resetAndClose = () => {
    setForm(EMPTY_FORM);

    setSelectedTypes([
      "pickup",
    ]);

    setError("");

    setOrderTasks([]);

    onClose?.();
  };

  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // -----------------------------
    // Task type
    // -----------------------------

    if (selectedTypes.length === 0) {
      const message =
        "Please select at least one task type.";

      setError(message);
      toast.error(message);

      return;
    }

    // -----------------------------
    // Employee
    // -----------------------------

    if (!form.employee_id) {
      const message =
        "Please select an employee.";

      setError(message);
      toast.error(message);

      return;
    }

    // -----------------------------
    // Customer
    // -----------------------------

    if (!form.customer_name.trim()) {
      const message =
        "Customer name is required.";

      setError(message);
      toast.error(message);

      return;
    }

    // -----------------------------
    // Scheduled time
    // -----------------------------

    if (!form.scheduled_time) {
      const message =
        "Scheduled date and time is required.";

      setError(message);
      toast.error(message);

      return;
    }

    const scheduledDate =
      new Date(
        form.scheduled_time
      );

    if (
      Number.isNaN(
        scheduledDate.getTime()
      )
    ) {
      const message =
        "Invalid scheduled date and time.";

      setError(message);
      toast.error(message);

      return;
    }

    if (
      scheduledDate < new Date()
    ) {
      const message =
        "Scheduled time cannot be in the past.";

      setError(message);
      toast.error(message);

      return;
    }

    // -----------------------------
    // Employee duplicate check
    // -----------------------------

    const selectedEmployeeId =
      Number(form.employee_id);

    const employeeAlreadyAssigned =
      form.order_id &&
      orderTasks.some(
        (task) =>
          Number(task.employee_id) ===
            selectedEmployeeId &&
          selectedTypes.includes(
            task.task_type
          )
      );

    if (employeeAlreadyAssigned) {
      const message =
        "This employee is already assigned to one of the selected task types for this order.";

      setError(message);
      toast.error(message);

      return;
    }

    // -----------------------------
    // Payload
    // -----------------------------

    const payload = {
      employee_id:
        selectedEmployeeId,

      task_types:
        selectedTypes,

      priority:
        form.priority,

      scheduled_time:
        form.scheduled_time,

      customer_name:
        form.customer_name.trim(),

      customer_phone:
        form.customer_phone.trim() ||
        null,

      customer_address:
        form.customer_address.trim() ||
        null,

      notes:
        form.notes.trim() ||
        null,
    };

    if (form.order_id) {
      payload.order_id =
        Number(form.order_id);
    }

    // -----------------------------
    // API
    // -----------------------------

    setLoading(true);

    try {
      await taskApi.assignTask(
        payload
      );

      toast.success(
        selectedTypes.length > 1
          ? `${selectedTypes.length} tasks assigned successfully`
          : "Task assigned successfully"
      );

      await onAssigned?.();

      resetAndClose();
    } catch (err) {
      console.error(
        "Assign task error:",
        err
      );

      const message =
        err?.response?.data?.message ||
        "Failed to assign task.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-[#05282A]/60
        backdrop-blur-sm
        p-4
      "
      onMouseDown={(e) => {
        if (
          e.target ===
          e.currentTarget
        ) {
          resetAndClose();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-2xl
          max-h-[92vh]
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-[0_25px_80px_rgba(5,40,42,0.28)]
        "
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >

        {/* HEADER */}
        <div
          className="
            flex items-center
            justify-between
            border-b border-[#E4EFED]
            bg-gradient-to-r
            from-[#F3FBFA]
            to-white
            px-6 py-5
          "
        >
          <div className="flex items-center gap-3">

            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-2xl
                bg-[#DFF5F2]
                text-[#028090]
              "
            >
              <ClipboardList
                size={21}
              />
            </div>

            <div>
              <h2
                className="
                  text-xl
                  font-semibold
                  text-[#12383A]
                "
              >
                Assign Task
              </h2>

              <p className="mt-0.5 text-xs text-[#6B8583]">
                Assign workflow tasks to an employee
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={resetAndClose}
            disabled={loading}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-xl
              border border-[#DCECE9]
              bg-white
              text-[#547371]
              hover:bg-[#F2FAF9]
              hover:text-[#12383A]
              disabled:opacity-50
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[calc(92vh-82px)] overflow-y-auto">

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-6"
          >

            {/* ORDER */}
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
                    ? "Loading orders..."
                    : "No order — standalone task"}
                </option>

                {orders.map((order) => (
                  <option
                    key={order.id}
                    value={order.id}
                  >
                    Order #{order.id}
                    {order.customer?.name
                      ? ` — ${order.customer.name}`
                      : ""}
                    {order.status
                      ? ` (${order.status})`
                      : ""}
                  </option>
                ))}

              </select>

            </Field>


            {/* EMPLOYEE */}
            <Field
              label="Assign To"
              required
            >

              <select
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                required
                disabled={
                  employeesLoading ||
                  orderTasksLoading
                }
                className={inputCls}
              >

                <option value="">
                  {employeesLoading
                    ? "Loading employees..."
                    : orderTasksLoading
                      ? "Checking order tasks..."
                      : availableEmployees.length === 0
                        ? "No available employees"
                        : "Select an employee"}
                </option>

                {availableEmployees.map(
                  (employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name}

                      {employee.designation
                        ? ` — ${employee.designation}`
                        : ""}
                    </option>
                  )
                )}

              </select>

              {form.order_id &&
                orderTasks.length > 0 && (
                  <p className="mt-1 text-[11px] text-[#6B8482]">
                    Employees already assigned to the
                    selected task types are excluded.
                  </p>
                )}

            </Field>


            {/* TASK TYPES */}
            <div>

              <label className="block text-[13px] font-medium text-[#0F2C2E] mb-2">
                Task Types{" "}
                <span className="text-[#B3261E]">
                  *
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                {TASK_TYPE_OPTIONS.map(
                  (option) => {
                    const checked =
                      selectedTypes.includes(
                        option.value
                      );

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          toggleTaskType(
                            option.value
                          )
                        }
                        className={`
                          flex items-center
                          gap-2
                          rounded-xl
                          border
                          px-3 py-2.5
                          text-left
                          text-[12px]
                          font-semibold
                          transition
                          ${
                            checked
                              ? "border-[#028090] bg-[#DFF3F5] text-[#028090]"
                              : "border-[#D8ECEA] bg-white text-[#6B8482] hover:border-[#A9C9C6]"
                          }
                        `}
                      >

                        <span
                          className={`
                            flex h-4 w-4
                            shrink-0
                            items-center
                            justify-center
                            rounded
                            border
                            ${
                              checked
                                ? "border-[#028090] bg-[#028090]"
                                : "border-[#C9DDDA]"
                            }
                          `}
                        >
                          {checked && (
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              className="h-3 w-3 text-white"
                            >
                              <path
                                d="M4 10.5L8 14L16 6"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>

                        {option.label}

                      </button>
                    );
                  }
                )}

              </div>

              {selectedTypes.length > 0 && (
                <div
                  className="
                    mt-2
                    flex flex-wrap
                    items-center
                    gap-1
                    text-[11px]
                    text-[#6B8482]
                  "
                >

                  <span className="font-medium">
                    Workflow:
                  </span>

                  {selectedTypes.map(
                    (type, index) => (
                      <React.Fragment
                        key={type}
                      >

                        {index > 0 && (
                          <span className="text-[#A9C9C6]">
                            →
                          </span>
                        )}

                        <span
                          className="
                            rounded-md
                            bg-[#EEF7F6]
                            px-1.5 py-0.5
                            font-medium
                            text-[#028090]
                          "
                        >
                          {TASK_TYPE_LABEL[type]}
                        </span>

                      </React.Fragment>
                    )
                  )}

                </div>
              )}

            </div>


            {/* PRIORITY */}
            <Field label="Priority">

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="normal">
                  Normal
                </option>

                <option value="urgent">
                  Urgent
                </option>
              </select>

            </Field>


            {/* SCHEDULE */}
            <Field
              label="Scheduled Date & Time"
              required
            >

              <input
                name="scheduled_time"
                type="datetime-local"
                value={
                  form.scheduled_time
                }
                onChange={handleChange}
                min={minDateTime}
                required
                className={inputCls}
              />

              <p className="mt-1 text-[11px] text-[#6B8482]">
                This is the earliest time the employee can
                start the task.
              </p>

            </Field>


            {/* CUSTOMER */}
            <div
              className="
                rounded-2xl
                border border-[#D8ECEA]
                bg-[#FAFDFC]
                p-4
              "
            >

              <div className="mb-4">

                <h3 className="text-sm font-semibold text-[#0F2C2E]">
                  Customer Details
                </h3>

                <p className="mt-0.5 text-[11px] text-[#6B8482]">
                  Select an existing customer or enter
                  details manually.
                </p>

              </div>


              <Field label="Saved Customer">

                <select
                  value={
                    form.customer_id
                  }
                  onChange={
                    handleCustomerSelect
                  }
                  disabled={
                    customersLoading
                  }
                  className={inputCls}
                >

                  <option value="">
                    {customersLoading
                      ? "Loading customers..."
                      : "Choose customer"}
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}

                        {customer.phone
                          ? ` — ${customer.phone}`
                          : ""}
                      </option>
                    )
                  )}

                </select>

              </Field>


              <div className="mt-4">

                <Field
                  label="Customer Name"
                  required
                >

                  <input
                    name="customer_name"
                    value={
                      form.customer_name
                    }
                    onChange={
                      handleNameChange
                    }
                    required
                    placeholder="Customer name"
                    className={inputCls}
                  />

                </Field>

              </div>


              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

                <Field label="Customer Phone">

                  <input
                    name="customer_phone"
                    value={
                      form.customer_phone
                    }
                    onChange={handleChange}
                    placeholder="99XXXXXXXX"
                    className={inputCls}
                  />

                </Field>


                <Field label="Customer Address">

                  <input
                    name="customer_address"
                    value={
                      form.customer_address
                    }
                    onChange={handleChange}
                    placeholder="Sector 62, Noida"
                    className={inputCls}
                  />

                </Field>

              </div>

            </div>


            {/* NOTES */}
            <Field label="Notes">

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any special instructions..."
                className={`${inputCls} resize-none`}
              />

            </Field>


            {/* ERROR */}
            {error && (
              <div
                className="
                  flex items-start
                  gap-2
                  rounded-xl
                  border
                  border-[#F5C6C0]
                  bg-[#FDECEC]
                  px-3.5 py-3
                  text-[12px]
                  text-[#B3261E]
                "
              >
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {error}
                </span>
              </div>
            )}


            {/* WORKFLOW INFO */}
            <div
              className="
                rounded-xl
                border border-[#D8ECEA]
                bg-[#EEF7F6]
                px-4 py-3
              "
            >

              <div className="flex items-start gap-2">

                <Sparkles
                  size={15}
                  className="mt-0.5 text-[#028090]"
                />

                <div>

                  <p className="text-[11px] font-semibold text-[#315957]">
                    Workflow rule
                  </p>

                  <p className="mt-0.5 text-[10px] leading-4 text-[#66817F]">
                    Tasks follow the laundry workflow.
                    Urgent tasks do not bypass scheduled
                    time or previous-task dependency.
                  </p>

                </div>

              </div>

            </div>


            {/* ACTIONS */}
            <div
              className="
                flex flex-col-reverse
                gap-2
                border-t border-[#E6F0EE]
                pt-4
                sm:flex-row
                sm:justify-end
              "
            >

              <button
                type="button"
                onClick={resetAndClose}
                disabled={loading}
                className="
                  rounded-xl
                  border border-[#D8ECEA]
                  bg-white
                  px-5 py-2.5
                  text-sm
                  font-semibold
                  text-[#5A7775]
                  hover:bg-[#F4FAF9]
                  disabled:opacity-50
                "
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={
                  loading ||
                  employeesLoading ||
                  availableEmployees.length === 0
                }
                className="
                  flex items-center
                  justify-center
                  gap-2
                  rounded-xl
                  px-5 py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-lg
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
                style={{
                  background:
                    "linear-gradient(135deg, #028090, #00A896)",
                }}
              >

                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus
                      size={16}
                    />

                    Assign Task
                  </>
                )}

              </button>

            </div>

          </form>

        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Tab switcher                                                        */
/* ------------------------------------------------------------------ */

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
          onClick={() => onChange(key)}
          className={active === key ? "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 bg-white text-[#028090] shadow-sm" : "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 text-[#6B8482] hover:text-[#028090] hover:bg-white/50"}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Task History Tab                                                    */
/* ------------------------------------------------------------------ */

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
      const params = {};
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.customer) params.customer = filters.customer;
      if (filters.order_id) params.order_id = filters.order_id;
      if (filters.task_type) params.task_type = filters.task_type;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const data = await taskApi.getAdminTaskHistory(params);
      setHistory(Array.isArray(data) ? data : []);
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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ employee_id: "", customer: "", order_id: "", task_type: "", status: "", startDate: "", endDate: "" });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-[#D8ECEA] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0F2C2E]">Filter History</h3>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-[#028090] hover:underline font-medium">
              Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={filters.employee_id}
            onChange={(e) => handleFilterChange("employee_id", e.target.value)}
            className={inputCls}
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Customer name"
            value={filters.customer}
            onChange={(e) => handleFilterChange("customer", e.target.value)}
            className={inputCls}
          />
          <input
            type="number"
            placeholder="Order ID"
            value={filters.order_id}
            onChange={(e) => handleFilterChange("order_id", e.target.value)}
            className={inputCls}
          />
          <select
            value={filters.task_type}
            onChange={(e) => handleFilterChange("task_type", e.target.value)}
            className={inputCls}
          >
            <option value="">All Task Types</option>
            {TASK_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className={inputCls}
              placeholder="From"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className={inputCls}
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* History table */}
      <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF7F6" }}>
              <History size={24} className="text-[#028090]" strokeWidth={1.7} />
            </div>
            <p className="text-sm font-medium text-[#0F2C2E]">No task history found</p>
            <p className="text-xs text-[#6B8482] mt-1">Adjust filters or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Order</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Customer</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Task Type</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Employee</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Assigned</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Started</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Completed</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Status</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.id} className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150">
                    <td className="py-3.5 px-5">
                      {t.order ? (
                        <Link to="/admin/orders" className="text-[12px] font-semibold" style={{ color: "#028090" }}>
                          Order #{t.order.id}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[#6B8482]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-[#0F2C2E] font-medium">{t.customer_name}</div>
                      {t.customer_phone && (
                        <div className="text-[11px] text-[#6B8482]">{t.customer_phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-semibold" style={{ color: "#028090" }}>
                        {TASK_TYPE_LABEL[t.task_type] || t.task_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-[#0F2C2E] font-medium">{t.employee?.name || "—"}</div>
                      <div className="text-[11px] text-[#6B8482]">ID: {t.employee_id}</div>
                    </td>
                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">
                      {t.scheduled_time ? formatScheduled(t.scheduled_time) : "—"}
                    </td>
                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">
                      {t.started_at ? formatScheduled(t.started_at) : "—"}
                    </td>
                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">
                      {t.completed_at ? formatScheduled(t.completed_at) : "—"}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-[11px] text-[#6B8482] max-w-[150px] truncate">
                        {t.notes || "—"}
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

/* ------------------------------------------------------------------ */
/* Main Tasks Page                                                     */
/* ------------------------------------------------------------------ */

export default function Tasks() {
  const { employees, loading: employeesLoading } = useEmployees();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAssign, setShowAssign] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskApi.getAllTasks();
      setTasks(Array.isArray(data) ? data : []);
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

  const filtered = useMemo(
    () => (statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter)),
    [tasks, statusFilter],
  );

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
            >
              <Sparkles size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl text-[#0F2C2E] leading-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
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
              onClick={() => setShowAssign(true)}
              disabled={!employeesLoading && employees.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
              title={!employeesLoading && employees.length === 0 ? "Add an employee first" : undefined}
            >
              <Plus size={16} /> Assign Task
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <PageTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "active" ? (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={ClipboardList} label="Total Tasks" value={stats.total} color="#028090" bg="#DFF3F5" />
              <StatCard icon={Clock} label="Pending" value={stats.pending} color="#9A6A12" bg="#FBF0DC" />
              <StatCard icon={Loader2} label="In Progress" value={stats.inProgress} color="#0B3B3E" bg="#DCEBEA" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="#02C39A" bg="#DFF7F1" />
            </div>

            {/* Filter tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <TaskFilterTabs active={statusFilter} onChange={setStatusFilter} />
              {!loading && (
                <span className="text-xs text-[#6B8482]">
                  {filtered.length} task{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Content card */}
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
                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Task</th>
                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Assigned To</th>
                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Customer</th>
                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Scheduled</th>
                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Priority</th>
                        <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t) => (
                        <tr key={t.id} className="border-b border-[#EEF7F6] last:border-0 hover:bg-[#FAFDFC] transition-colors duration-150">
                          <td className="py-3.5 px-5">
                            <div className="font-semibold" style={{ color: "#028090" }}>
                              #{t.id}
                            </div>
                            <div className="text-xs text-[#6B8482] mt-0.5">{TASK_TYPE_LABEL[t.task_type] || t.task_type}</div>
                            {t.order && (
                              <Link
                                to="/admin/orders"
                                className="inline-flex items-center gap-1 text-[11px] font-medium mt-1 px-2 py-0.5 rounded-md"
                                style={{ backgroundColor: "#DFF3F5", color: "#028090" }}
                              >
                                <ClipboardList size={11} /> Order #{t.order.id}
                              </Link>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="text-[#0F2C2E] font-medium">{t.employee?.name || "—"}</div>
                            {t.employee?.designation && (
                              <div className="text-[11px] text-[#6B8482] mt-0.5">{t.employee.designation}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="text-[#0F2C2E] font-medium">{t.customer_name}</div>
                            {t.customer_phone && (
                              <div className="flex items-center gap-1 text-[11px] text-[#6B8482] mt-0.5">
                                <Phone size={11} /> {t.customer_phone}
                              </div>
                            )}
                            {t.customer_address && (
                              <div className="flex items-center gap-1 text-[11px] text-[#6B8482] mt-0.5">
                                <MapPin size={11} /> {t.customer_address}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-[#6B8482] whitespace-nowrap">{formatScheduled(t.scheduled_time)}</td>
                          <td className="py-3.5 px-5">
                            <PriorityPill priority={t.priority} />
                          </td>
                          <td className="py-3.5 px-5">
                            <StatusPill status={t.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Hint when there are no employees */}
            {!employeesLoading && employees.length === 0 && tasks.length === 0 && (
              <div className="flex items-start gap-2.5 rounded-xl border border-[#F3C7B8] bg-[#FBE4DC] px-4 py-3">
                <AlertTriangle size={16} className="text-[#9A2E12] mt-0.5 shrink-0" />
                <p className="text-[13px] text-[#9A2E12]">
                  You need to create an employee first — go to the Employees page and click{" "}
                  <span className="font-semibold">Add Employee</span>.
                </p>
              </div>
            )}
          </>
        ) : (
          <TaskHistoryTab employees={employees} />
        )}
      </div>

      <AssignTaskModal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        employees={employees}
        employeesLoading={employeesLoading}
        onAssigned={fetchTasks}
      />
    </div>
  );
}
