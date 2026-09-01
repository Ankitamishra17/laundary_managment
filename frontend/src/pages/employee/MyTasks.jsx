import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ClipboardList,
  Clock,
  Loader2,
  CheckCircle2,
  Phone,
  MapPin,
  Sparkles,
  Inbox,
  X,
  User,
  Mail,
  Building2,
  CalendarDays,
  ShoppingBag,
  ArrowRight,
  History,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useMyTasks } from "../../hooks/useMyTasks";
import { taskApi } from "../../api/taskApi";
import StatusPill from "../../components/layout/StatusPill";
import TaskFilterTabs from "../../components/layout/TaskFilterTabs"

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const TASK_SEQUENCE = ["pickup", "wash", "dry", "iron", "pack", "delivery"];

function statusIcon(status) {
  if (status === "completed") return "✓";
  if (status === "in_progress") return "→";
  return "○";
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/* Stat card — premium tile with icon chip + subtle hover lift         */
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

/* ------------------------------------------------------------------ */
/* Action button — status-aware, single source of truth for CTA style */
/* ------------------------------------------------------------------ */
function TaskAction({ status, onStart, onComplete }) {
  if (status === "pending") {
    return (
      <button
        onClick={onStart}
        className="text-[11px] font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
        style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
      >
        Start Task
      </button>
    );
  }
  if (status === "in_progress") {
    return (
      <button
        onClick={onComplete}
        className="text-[11px] font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
        style={{ background: "linear-gradient(135deg, #00A896, #02C39A)" }}
      >
        Mark Complete
      </button>
    );
  }
  return (
    <span className="text-[11px] font-medium text-[#02C39A] flex items-center gap-1 whitespace-nowrap">
      <CheckCircle2 size={13} /> Done
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Customer Details Modal — shows full customer + order info           */
/* ------------------------------------------------------------------ */
function CustomerDetailModal({ task, onClose }) {
  if (!task) return null;
  const order = task.order;
  const customer = order?.customer;

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
              className="text-xl text-[#0F2C2E] leading-tight"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Customer Details
            </h2>
            <p className="text-[13px] text-[#5A7A79] mt-1">
              Task #{task.id} · {TASK_TYPE_LABEL[task.task_type] || task.task_type}
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

        {/* Customer info */}
        <div className="space-y-3">
          <div className="rounded-xl bg-[#EEF7F6] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}>
                <User size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#0F2C2E]">
                  {customer?.name || task.customer_name || "—"}
                </div>
                {task.customer_phone && (
                  <div className="text-[11px] text-[#6B8482]">{task.customer_phone}</div>
                )}
              </div>
            </div>

            {customer?.email && (
              <div className="flex items-center gap-2 text-xs text-[#6B8482]">
                <Mail size={13} className="shrink-0" style={{ color: "#028090" }} />
                {customer.email}
              </div>
            )}

            {task.customer_address && (
              <div className="flex items-start gap-2 text-xs text-[#6B8482]">
                <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: "#028090" }} />
                <span>{task.customer_address}</span>
              </div>
            )}

            {customer?.city && (
              <div className="flex items-center gap-2 text-xs text-[#6B8482]">
                <Building2 size={13} className="shrink-0" style={{ color: "#028090" }} />
                {customer.city}
              </div>
            )}
          </div>

          {/* Order info */}
          {order && (
            <div className="rounded-xl bg-[#EEF7F6] p-4 space-y-2">
              <div className="text-[11px] uppercase tracking-wide font-semibold text-[#6B8482] mb-2">
                Order #{order.id}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B8482]">
                <ShoppingBag size={13} className="shrink-0" style={{ color: "#028090" }} />
                Status: <span className="font-medium text-[#0F2C2E]">{order.status?.replace(/_/g, " ")}</span>
              </div>
              {order.total_amount != null && (
                <div className="flex items-center gap-2 text-xs text-[#6B8482]">
                  <span className="font-medium text-[#0F2C2E]">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                </div>
              )}
              {order.pickup_address && (
                <div className="flex items-start gap-2 text-xs text-[#6B8482]">
                  <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: "#028090" }} />
                  <span>Pickup: {order.pickup_address}</span>
                </div>
              )}
              {order.delivery_address && (
                <div className="flex items-start gap-2 text-xs text-[#6B8482]">
                  <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: "#02C39A" }} />
                  <span>Delivery: {order.delivery_address}</span>
                </div>
              )}
              {order.delivery_note && (
                <div className="text-xs text-[#6B8482] italic">Note: {order.delivery_note}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF7F6" }}>
        <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
      </div>
      <p className="text-sm font-medium text-[#0F2C2E]">No tasks assigned for today</p>
      <p className="text-xs text-[#6B8482] mt-1">Enjoy the break — new tasks will show up here.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading skeleton — feels premium instead of a bare "loading…" text  */
/* ------------------------------------------------------------------ */
function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TaskGroups — groups tasks by order and shows sequential workflow    */
/* ------------------------------------------------------------------ */
function TaskGroups({ tasks, onCustomerClick, onUpdateStatus, detailLoading }) {
  // Group tasks by order_id; tasks without an order are standalone.
  const groups = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const key = t.order_id || `solo-${t.id}`;
      if (!map[key]) {
        map[key] = { orderId: t.order_id, order: t.order || null, items: [] };
      }
      map[key].items.push(t);
    });
    // Sort tasks within each group by sequence
    Object.values(map).forEach((g) => {
      g.items.sort(
        (a, b) => TASK_SEQUENCE.indexOf(a.task_type) - TASK_SEQUENCE.indexOf(b.task_type),
      );
    });
    return Object.values(map);
  }, [tasks]);

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const completedCount = group.items.filter((t) => t.status === "completed").length;
        const total = group.items.length;
        const allDone = completedCount === total;
        const firstTask = group.items[0];

        return (
          <div
            key={group.orderId || group.items[0].id}
            className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden"
          >
            {/* Group header */}
            <div className="px-5 py-3.5 border-b border-[#EEF7F6] bg-[#FAFDFC] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {group.orderId ? (
                  <span className="text-sm font-semibold" style={{ color: "#028090" }}>
                    Order #{group.orderId}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-[#6B8482]">Standalone</span>
                )}
                {group.items.some((t) => t.priority === "urgent") && (
                  <span className="text-[10px] font-bold text-[#B3261E] bg-[#FDECEC] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <AlertTriangle size={10} /> URGENT
                  </span>
                )}
                {firstTask?.customer_name && (
                  <button
                    onClick={() => onCustomerClick(firstTask.id)}
                    className="text-xs text-[#6B8482] hover:text-[#028090] hover:underline"
                    disabled={detailLoading}
                  >
                    {firstTask.customer_name}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Progress bar */}
                <div className="flex items-center gap-1">
                  {group.items.map((t, i) => (
                    <React.Fragment key={t.id}>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          t.status === "completed"
                            ? "bg-[#02C39A] text-white"
                            : t.status === "in_progress"
                              ? "bg-[#028090] text-white animate-pulse"
                              : "bg-[#EEF7F6] text-[#A9C9C6] border border-[#D8ECEA]"
                        }`}
                        title={`${TASK_TYPE_LABEL[t.task_type] || t.task_type}: ${t.status}`}
                      >
                        {t.status === "completed" ? "✓" : i + 1}
                      </div>
                      {i < group.items.length - 1 && (
                        <div
                          className={`w-4 h-0.5 ${
                            t.status === "completed" ? "bg-[#02C39A]" : "bg-[#D8ECEA]"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <span className="text-[11px] font-medium text-[#6B8482]">
                  {completedCount}/{total}
                </span>
                {allDone && (
                  <span className="text-[11px] font-semibold text-[#02C39A] bg-[#DFF7F1] px-2 py-0.5 rounded-full">
                    Done
                  </span>
                )}
              </div>
            </div>

            {/* Task rows */}
            <div className="divide-y divide-[#EEF7F6]">
              {group.items.map((t) => {
                const isActive = t.status === "in_progress";
                const isCompleted = t.status === "completed";
                const isPending = t.status === "pending";
                return (
                  <div
                    key={t.id}
                    className={`px-5 py-3.5 flex items-center gap-4 transition-colors ${
                      isActive ? "bg-[#EEF7F6]" : "hover:bg-[#FAFDFC]"
                    }`}
                  >
                    {/* Status icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[13px] font-bold ${
                        isCompleted
                          ? "bg-[#DFF7F1] text-[#02C39A]"
                          : isActive
                            ? "bg-[#028090] text-white"
                            : "bg-[#EEF7F6] text-[#A9C9C6] border border-[#D8ECEA]"
                      }`}
                    >
                      {isCompleted ? "✓" : isActive ? "▶" : "○"}
                    </div>

                    {/* Task info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0F2C2E]">
                          {TASK_TYPE_LABEL[t.task_type] || t.task_type}
                        </span>
                        {t.priority === "urgent" && (
                          <span className="text-[10px] font-bold text-[#B3261E] bg-[#FDECEC] px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertTriangle size={10} /> URGENT
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-semibold text-[#028090] bg-[#DFF3F5] px-2 py-0.5 rounded-full">
                            ACTIVE
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-semibold text-[#02C39A] bg-[#DFF7F1] px-2 py-0.5 rounded-full">
                            DONE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-[#6B8482] flex items-center gap-1">
                          <Clock size={10} /> {formatTime(t.scheduled_time)}
                        </span>
                        {t.customer_phone && (
                          <span className="text-[11px] text-[#6B8482] flex items-center gap-1">
                            <Phone size={10} /> {t.customer_phone}
                          </span>
                        )}
                        {t.customer_address && (
                          <span className="text-[11px] text-[#6B8482] hidden sm:flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin size={10} className="shrink-0" /> <span className="truncate">{t.customer_address}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <span className="text-[11px] font-medium text-[#02C39A] flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle2 size={13} /> Done
                        </span>
                      ) : isActive ? (
                        <button
                          onClick={() => onUpdateStatus(t.id, "completed")}
                          className="text-[11px] font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
                          style={{ background: "linear-gradient(135deg, #00A896, #02C39A)" }}
                        >
                          Mark Complete
                        </button>
                      ) : isPending ? (
                        <button
                          onClick={() => onUpdateStatus(t.id, "in_progress")}
                          className="text-[11px] font-semibold px-3.5 py-1.5 rounded-lg text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
                          style={{ background: "linear-gradient(135deg, #028090, #00A896)" }}
                        >
                          Start Task
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

/* ------------------------------------------------------------------ */
/* Employee Task History Tab                                           */
/* ------------------------------------------------------------------ */

function EmployeeTaskHistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    task_type: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.task_type) params.task_type = filters.task_type;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const data = await taskApi.getMyTaskHistory(params);
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
    setFilters({ task_type: "", status: "", startDate: "", endDate: "" });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const inputCls =
    "w-full rounded-lg border border-[#D8ECEA] bg-[#EEF7F6] px-3 py-2.5 text-sm text-[#0F2C2E] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition";

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={filters.task_type}
            onChange={(e) => handleFilterChange("task_type", e.target.value)}
            className={inputCls}
          >
            <option value="">All Task Types</option>
            {Object.entries(TASK_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
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
          <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EEF7F6] bg-[#FAFDFC]">
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Order</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Customer</th>
                  <th className="text-left font-semibold text-[11px] uppercase tracking-wide text-[#6B8482] py-3.5 px-5">Task Type</th>
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
                        <span className="text-[12px] font-semibold" style={{ color: "#028090" }}>Order #{t.order.id}</span>
                      ) : (
                        <span className="text-[11px] text-[#6B8482]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-[#0F2C2E] font-medium">{t.customer_name}</div>
                      {t.customer_phone && <div className="text-[11px] text-[#6B8482]">{t.customer_phone}</div>}
                    </td>
                    <td className="py-3.5 px-5"><span className="text-[12px] font-semibold" style={{ color: "#028090" }}>{TASK_TYPE_LABEL[t.task_type] || t.task_type}</span></td>
                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">{formatDateTime(t.scheduled_time)}</td>
                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">{formatDateTime(t.started_at)}</td>
                    <td className="py-3.5 px-5 text-[11px] text-[#6B8482] whitespace-nowrap">{formatDateTime(t.completed_at)}</td>
                    <td className="py-3.5 px-5"><StatusPill status={t.status} /></td>
                    <td className="py-3.5 px-5"><div className="text-[11px] text-[#6B8482] max-w-[150px] truncate">{t.notes || "—"}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-[#EEF7F6]">
            {history.map((t) => (
              <div key={t.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold" style={{ color: "#028090" }}>{t.order ? `Order #${t.order.id}` : "Standalone"}</span>
                  <StatusPill status={t.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0F2C2E]">{t.customer_name}</span>
                  <span className="text-xs font-semibold" style={{ color: "#028090" }}>{TASK_TYPE_LABEL[t.task_type] || t.task_type}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[#6B8482]">
                  <span>Assigned: {formatDateTime(t.scheduled_time)}</span>
                </div>
                {(t.started_at || t.completed_at) && (
                  <div className="flex items-center gap-4 text-[11px] text-[#6B8482]">
                    {t.started_at && <span>Started: {formatDateTime(t.started_at)}</span>}
                    {t.completed_at && <span>Completed: {formatDateTime(t.completed_at)}</span>}
                  </div>
                )}
                {t.notes && <div className="text-[11px] text-[#6B8482]">Note: {t.notes}</div>}
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main MyTasks Page                                                   */
/* ------------------------------------------------------------------ */

export default function MyTasks({ initialStatus = "all" }) {
  const {
    tasks = [],
    stats = { total: 0, pending: 0, inProgress: 0, completed: 0 },
    statusFilter,
    setStatusFilter,
    loading,
    error,
    updateStatus,
  } = useMyTasks(initialStatus);

  const [selectedTask, setSelectedTask] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const handleCustomerClick = useCallback(async (taskId) => {
    setDetailLoading(true);
    try {
      const task = await taskApi.getTaskById(taskId);
      setSelectedTask(task);
    } catch {
      // fallback: show basic info from the list
      const basic = tasks.find((t) => t.id === taskId);
      if (basic) setSelectedTask(basic);
    } finally {
      setDetailLoading(false);
    }
  }, [tasks]);

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
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
                My Tasks
              </h1>
              <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
                Everything assigned to you.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <PageTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "active" ? (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={ClipboardList} label="Total Today" value={stats.total} color="#028090" bg="#DFF3F5" />
              <StatCard icon={Clock} label="Pending" value={stats.pending} color="#9A6A12" bg="#FBF0DC" />
              <StatCard icon={Loader2} label="In Progress" value={stats.inProgress} color="#0B3B3E" bg="#DCEBEA" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="#02C39A" bg="#DFF7F1" />
            </div>

            {/* Filter tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <TaskFilterTabs active={statusFilter} onChange={setStatusFilter} />
              {!loading && (
                <span className="text-xs text-[#6B8482]">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Grouped task cards */}
            {loading ? (
              <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
                <TableSkeleton />
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
                <EmptyState />
              </div>
            ) : (
              <TaskGroups
                tasks={tasks}
                onCustomerClick={handleCustomerClick}
                onUpdateStatus={updateStatus}
                detailLoading={detailLoading}
              />
            )}
          </>
        ) : (
          <EmployeeTaskHistoryTab />
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedTask && (
        <CustomerDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}