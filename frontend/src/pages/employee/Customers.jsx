import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Search,
  Inbox,
  Sparkles,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { getShopCustomers } from "../../api/customerApi";
import { taskApi } from "../../api/taskApi";

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const TASK_STATUS_STYLES = {
  pending: { color: "#9A6A12", bg: "#FBF0DC", label: "Pending" },
  in_progress: { color: "#0B3B3E", bg: "#DCEBEA", label: "In Progress" },
  completed: { color: "#02C39A", bg: "#DFF7F1", label: "Completed" },
};

const PRIORITY_STYLES = {
  urgent: { color: "#B3261E", bg: "#FDECEC", label: "URGENT" },
  normal: { color: "#028090", bg: "#DFF3F5", label: "Normal" },
};

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

const colors = {
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
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
/* Customer Card — shows customer info + expandable task list          */
/* ------------------------------------------------------------------ */
function CustomerCard({ group }) {
  const [expanded, setExpanded] = useState(false);
  const { customerName, customerPhone, customerAddress, customerCity, tasks } = group;

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const urgentCount = tasks.filter((t) => t.priority === "urgent").length;

  // Group tasks by order_id to clearly distinguish which task belongs to which order
  const orderGroups = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const key = t.order_id || `solo-${t.id}`;
      if (!map[key]) map[key] = { orderId: t.order_id, order: t.order || null, tasks: [] };
      map[key].tasks.push(t);
    });
    return Object.values(map);
  }, [tasks]);

  return (
    <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#FAFDFC] transition-colors text-left"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: "#DFF3F5", color: "#028090" }}
        >
          {initials(customerName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#0F2C2E]">{customerName}</span>
            <span className="text-[11px] text-[#6B8482]">·</span>
            <span className="text-[11px] text-[#6B8482]">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {customerPhone && (
              <span className="text-[11px] text-[#6B8482] flex items-center gap-1">
                <Phone size={10} /> {customerPhone}
              </span>
            )}
            {customerCity && (
              <span className="text-[11px] text-[#6B8482] flex items-center gap-1">
                <MapPin size={10} /> {customerCity}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {urgentCount > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ color: PRIORITY_STYLES.urgent.color, background: PRIORITY_STYLES.urgent.bg }}
            >
              URGENT
            </span>
          )}
          {inProgressCount > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ color: TASK_STATUS_STYLES.in_progress.color, background: TASK_STATUS_STYLES.in_progress.bg }}
            >
              ACTIVE
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px]">
            {completedCount > 0 && (
              <span className="font-medium" style={{ color: "#02C39A" }}>{completedCount} done</span>
            )}
            {pendingCount > 0 && (
              <span className="font-medium" style={{ color: "#9A6A12" }}>{pendingCount} pending</span>
            )}
          </div>
          {expanded ? (
            <ChevronUp size={16} className="text-[#6B8482]" />
          ) : (
            <ChevronDown size={16} className="text-[#6B8482]" />
          )}
        </div>
      </button>

      {/* Expanded task list */}
      {expanded && (
        <div className="border-t border-[#EEF7F6]">
          {orderGroups.map((og) => (
            <div key={og.orderId || og.tasks[0].id} className="border-b border-[#EEF7F6] last:border-0">
              {/* Order header */}
              <div className="px-5 py-2.5 bg-[#FAFDFC] flex items-center gap-2">
                <ClipboardList size={13} style={{ color: "#028090" }} />
                <span className="text-[12px] font-semibold" style={{ color: "#028090" }}>
                  {og.orderId ? `Order #${og.orderId}` : "Standalone Tasks"}
                </span>
                {og.order?.status && (
                  <span className="text-[10px] text-[#6B8482] bg-[#EEF7F6] px-2 py-0.5 rounded-full">
                    {og.order.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              {/* Task rows */}
              <div className="divide-y divide-[#EEF7F6]">
                {og.tasks.map((t) => {
                  const s = TASK_STATUS_STYLES[t.status] || TASK_STATUS_STYLES.pending;
                  const p = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.normal;
                  return (
                    <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-medium text-[#0F2C2E]">
                            {TASK_TYPE_LABEL[t.task_type] || t.task_type}
                          </span>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                            style={{ color: s.color, background: s.bg }}
                          >
                            {s.label}
                          </span>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                            style={{ color: p.color, background: p.bg }}
                          >
                            {p.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#6B8482]">
                          {t.scheduled_time && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {formatDateTime(t.scheduled_time)}
                            </span>
                          )}
                          {t.started_at && (
                            <span>Started: {formatDateTime(t.started_at)}</span>
                          )}
                          {t.completed_at && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={10} /> {formatDateTime(t.completed_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await taskApi.getMyCustomerTasks();
        if (!cancelled) setAllGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load customer tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const customerGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allGroups;
    return allGroups.filter(
      (g) =>
        g.customerName?.toLowerCase().includes(q) ||
        g.customerPhone?.toLowerCase().includes(q) ||
        g.customerCity?.toLowerCase().includes(q),
    );
  }, [allGroups, search]);

  return (
    <div className="min-h-screen" style={{ background: "#EEF7F6" }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
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
              Customers
            </h1>
            <p className="text-xs sm:text-sm text-[#6B8482] mt-0.5">
              Everyone who has ordered from your laundry — details at a glance.
            </p>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard icon={Users} label="Total Customers" value={allGroups.length} color="#028090" bg="#DFF3F5" />
          <StatCard
            icon={ClipboardList}
            label="Total Tasks"
            value={allGroups.reduce((sum, g) => sum + g.tasks.length, 0)}
            color="#00A896"
            bg="#DFF7F1"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed Tasks"
            value={allGroups.reduce((sum, g) => sum + g.tasks.filter((t) => t.status === "completed").length, 0)}
            color="#0B3B3E"
            bg="#DCEBEA"
          />
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B8482]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email or city…"
            className="w-full rounded-xl border border-[#D8ECEA] bg-white pl-10 pr-4 py-2.5 text-sm text-[#0F2C2E] shadow-[0_1px_2px_rgba(15,44,46,0.04)] outline-none focus:border-[#028090] focus:shadow-[0_0_0_3px_rgba(2,128,144,0.12)] transition"
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="text-sm text-[#9A2E12] bg-[#FBE4DC] border border-[#F3C7B8] rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Customer cards with tasks */}
        {loading ? (
          <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-[#EEF7F6] animate-pulse" />
              ))}
            </div>
          </div>
        ) : customerGroups.length === 0 ? (
          <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-[0_1px_2px_rgba(15,44,46,0.04)] overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EEF7F6" }}>
                <Inbox size={24} className="text-[#028090]" strokeWidth={1.7} />
              </div>
              <p className="text-sm font-medium text-[#0F2C2E]">
                {allGroups.length === 0 ? "No customer tasks yet" : "No customers match your search"}
              </p>
              <p className="text-xs text-[#6B8482] mt-1">
                {allGroups.length === 0
                  ? "When you are assigned tasks for customers, they will appear here."
                  : "Try a different name or phone number."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {customerGroups.map((group) => (
              <CustomerCard key={group.customerName} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
