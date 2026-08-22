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
} from "lucide-react";
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
      className="text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap"
      style={{
        color: urgent ? "#B3261E" : "#028090",
        background: urgent ? "#FDECEC" : "#DFF3F5",
      }}
    >
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
  task_type: "pickup",
  priority: "normal",
  scheduled_time: "",
  customer_id: "",
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  notes: "",
};

function AssignTaskModal({ isOpen, onClose, employees, employeesLoading, onAssigned }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

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
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
    setError("");
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await taskApi.assignTask({
        employee_id: Number(form.employee_id),
        task_type: form.task_type,
        priority: form.priority,
        scheduled_time: form.scheduled_time,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone || null,
        customer_address: form.customer_address || null,
        notes: form.notes || null,
      });
      onAssigned?.();
      resetAndClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign task");
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
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Task Type" required>
              <select name="task_type" value={form.task_type} onChange={handleChange} className={inputCls}>
                {TASK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>

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
              required
              className={inputCls}
            />
          </Field>

          <Field label="Customer" required>
            <select
              value={form.customer_id}
              onChange={handleCustomerSelect}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="" disabled>
                {customersLoading
                  ? "Loading customers…"
                  : "Choose from saved customers"}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
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

export default function Tasks() {
  const { employees, loading: employeesLoading } = useEmployees();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAssign, setShowAssign] = useState(false);

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

          <button
            onClick={() => setShowAssign(true)}
            disabled={!employeesLoading && employees.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
            title={!employeesLoading && employees.length === 0 ? "Add an employee first" : undefined}
          >
            <Plus size={16} /> Assign Task
          </button>
        </div>

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
                            to={`/admin/orders`}
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
