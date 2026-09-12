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

function AssignTaskModal({ isOpen, onClose, employees, employeesLoading, onAssigned }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTypes, setSelectedTypes] = useState(["pickup"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderTasks, setOrderTasks] = useState([]);
  const [orderTasksLoading, setOrderTasksLoading] = useState(false);

  // Minimum datetime — prevents selecting past dates/times.
  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  // Load the shop's customers so the admin can pick one instead of typing
  // the customer details by hand.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setCustomersLoading(true);
    getShopCustomers()
      .then((res) => {
        if (!cancelled) setCustomers(res.data || []);
      })
      .catch(() => {
        /* customers are optional — manual entry still works */
      })
      .finally(() => {
        if (!cancelled) setCustomersLoading(false);
      });

    // Load pending/processing orders for the admin to link tasks to
    setOrdersLoading(true);
    import("../../api/orderApi").then(({ getShopOrders }) => {
      getShopOrders({ status: "pending" })
        .then((res) => {
          if (!cancelled) setOrders(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => {
          /* orders are optional */
        })
        .finally(() => {
          if (!cancelled) setOrdersLoading(false);
        });
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // When an order is selected, load its existing tasks to filter employees
  useEffect(() => {
    if (!form.order_id) {
      setOrderTasks([]);
      return;
    }
    let cancelled = false;
    setOrderTasksLoading(true);
    taskApi.getOrderTasks(form.order_id)
      .then((res) => {
        if (!cancelled) setOrderTasks(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) setOrderTasks([]);
      })
      .finally(() => {
        if (!cancelled) setOrderTasksLoading(false);
      });
    return () => { cancelled = true; };
  }, [form.order_id]);

  if (!isOpen) return null;

  // Filter employees: exclude those who already have the same selected task types for the selected order.
  // Business rule: Same Order + Same Task + Same Employee = BLOCKED
  const availableEmployees = useMemo(() => {
    if (!form.order_id || orderTasks.length === 0) return employees;
    // Find employee_ids that already have any of the selected task types for this order
    const blockedEmployeeIds = new Set(
      orderTasks
        .filter((t) => selectedTypes.includes(t.task_type))
        .map((t) => t.employee_id)
    );
    return employees.filter((emp) => !blockedEmployeeIds.has(emp.id));
  }, [employees, orderTasks, selectedTypes, form.order_id]);

  // Picking a customer from the dropdown auto-fills name / phone / address.
  const handleCustomerSelect = (e) => {
    const id = e.target.value;
    const customer = customers.find((c) => String(c.id) === id);
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

  const handleNameChange = (e) => {
    const { value } = e.target;
    setForm((prev) => ({
      ...prev,
      customer_name: value,
      // Once the admin edits the name manually, the dropdown selection is stale
      customer_id: "",
    }));
  };

  const resetAndClose = () => {
    setForm(EMPTY_FORM);
    setSelectedTypes(["pickup"]);
    setError("");
    setOrderTasks([]);
    onClose();
  };

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
    setLoading(true);
    try {
      // Validate scheduled_time is not in the past
      if (form.scheduled_time && new Date(form.scheduled_time) < new Date()) {
        setError("Scheduled time cannot be in the past.");
        setLoading(false);
        return;
      }
      const payload = {
        employee_id: Number(form.employee_id),
        task_types: selectedTypes,
        priority: form.priority,
        scheduled_time: form.scheduled_time,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone || null,
        customer_address: form.customer_address || null,
        notes: form.notes || null,
      };
      if (form.order_id) payload.order_id = Number(form.order_id);
      await taskApi.assignTask(payload);
      toast.success(selectedTypes.length > 1 ? `${selectedTypes.length} tasks assigned successfully` : "Task assigned successfully");
      onAssigned?.();
      resetAndClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to assign task";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05282A]/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={resetAndClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_20px_50px_rgba(5,40,42,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2
              className="text-2xl text-[#0F2C2E] leading-tight"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Assign Task
            </h2>
            <p className="text-[13px] text-[#5A7A79] mt-1">Assign a new task to an employee</p>
          </div>
          <button
            onClick={resetAndClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-[#EEF7F6] border border-[#D8ECEA] text-[#0F2C2E] flex items-center justify-center hover:bg-[#DFF3F5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Link to Order (optional)">
            <select
              name="order_id"
              value={form.order_id}
              onChange={handleChange}
              disabled={ordersLoading}
              className={inputCls}
            >
              <option value="">
                {ordersLoading ? "Loading orders…" : "No order (standalone task)"}
              </option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  Order #{o.id}{o.customer?.name ? ` — ${o.customer.name}` : ""} ({o.status})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Assign To" required>
            <select
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              required
              disabled={employeesLoading}
              className={inputCls}
            >
              <option value="" disabled>
                {employeesLoading ? "Loading employees…" : availableEmployees.length === 0 ? "No available employees" : "Select an employee"}
              </option>
              {availableEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                  {emp.designation ? ` — ${emp.designation}` : ""}
                  {emp.status === "inactive" ? " (inactive)" : ""}
                </option>
              ))}
            </select>
            {form.order_id && orderTasks.length > 0 && (
              <p className="mt-1 text-[11px] text-[#6B8482]">
                Only showing employees available for the selected task types on this order.
              </p>
            )}
          </Field>

          <div>
            <label className="block text-[13px] font-medium text-[#0F2C2E] mb-2">
              Task Types <span className="text-[#B3261E]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TASK_TYPE_OPTIONS.map((opt) => {
                const checked = selectedTypes.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium cursor-pointer transition-all ${checked
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
                      className={"w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors " + (checked ? "border-[#028090] bg-[#028090]" : "border-[#D8ECEA]")}
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
            <Field label="Priority">
              <select name="priority" value={form.priority} onChange={handleChange} className={inputCls}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
          </div>

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

          <Field label="Customer" required>
            <select
              value={form.customer_id}
              onChange={handleCustomerSelect}
              className={inputCls + " cursor-pointer"}
            >
              <option value="" disabled>
                {customersLoading
                  ? "Loading customers…"
                  : "Choose from saved customers"}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? " | " + c.phone : ""}
                </option>
              ))}
            </select>
            {!customersLoading && customers.length > 0 && (
              <p className="mt-1 text-[11px] text-[#6B8482]">
                Pick a customer to auto-fill their details below.
              </p>
            )}
          </Field>

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

          <Field label="Notes">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Any special instructions…"
              className={inputCls + " resize-none"}
            />
          </Field>

          {error && (
            <div className="text-[13px] text-[#B3261E] bg-[#FDECEC] border border-[#F5C6C0] rounded-lg px-3.5 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition hover:brightness-105 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
          >
            {loading ? (
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
