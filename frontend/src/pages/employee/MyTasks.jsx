import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  MapPin,
  Phone,
  User,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ClipboardList,
  Truck,
  WashingMachine,
  Shirt,
  PackageCheck,
  Bike,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

import { useMyTasks } from "../../hooks/useMyTasks";

/* ============================================================
   CONSTANTS
============================================================ */

const TASK_TYPE_LABEL = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry Cleaning",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const TASK_TYPE_ICON = {
  pickup: Truck,
  wash: WashingMachine,
  dry: WashingMachine,
  iron: Shirt,
  pack: PackageCheck,
  delivery: Bike,
};

const STATUS_LABEL = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_FILTERS = [
  {
    value: "all",
    label: "All Tasks",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "completed",
    label: "Completed",
  },
];

/* ============================================================
   HELPERS
============================================================ */

const formatTaskType = (type) => TASK_TYPE_LABEL[type] || type || "Task";

const formatStatus = (status) => STATUS_LABEL[status] || status || "Unknown";

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({ status }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 size={14} />
        Completed
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        <Loader2 size={14} />
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      <Clock3 size={14} />
      Pending
    </span>
  );
}

/* ============================================================
   PRIORITY BADGE
============================================================ */

function PriorityBadge({ priority }) {
  if (priority === "urgent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
        <AlertCircle size={13} />
        URGENT
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
      NORMAL
    </span>
  );
}

/* ============================================================
   READY BADGE
============================================================ */

function ReadyBadge({ task }) {
  if (task.status === "completed") {
    return null;
  }

  if (task.status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
        <Play size={12} />
        Active
      </span>
    );
  }

  if (task.isReady) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
        <CheckCircle2 size={12} />
        Ready
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
      <Clock3 size={12} />
      Waiting
    </span>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({ title, value, icon: Icon, description, iconClass }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>

          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TASK ICON
============================================================ */

function TaskIcon({ taskType }) {
  const Icon = TASK_TYPE_ICON[taskType] || ClipboardList;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
      <Icon size={21} />
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({ search }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <ClipboardList size={26} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {search ? "No matching tasks" : "No tasks found"}
      </h3>

      <p className="mt-1 max-w-md text-sm text-gray-500">
        {search
          ? "Try changing your search or status filter."
          : "You currently don't have any tasks assigned to you."}
      </p>
    </div>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function TaskSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
        >
          <div className="flex gap-4">
            <div className="h-11 w-11 rounded-xl bg-gray-200" />

            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-gray-200" />

              <div className="mt-3 h-3 w-48 rounded bg-gray-200" />

              <div className="mt-5 h-10 w-full rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   TASK CARD
============================================================ */

function TaskCard({
  task,
  onStart,
  onComplete,
  updatingTaskId,
  expanded,
  onToggle,
}) {
  const isUpdating = updatingTaskId === task.id;

  const canStart = task.status === "pending" && task.isReady === true;

  const canComplete = task.status === "in_progress";

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        task.priority === "urgent" ? "border-red-200" : "border-gray-200"
      }`}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <TaskIcon taskType={task.task_type} />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  {formatTaskType(task.task_type)}
                </h3>

                <PriorityBadge priority={task.priority} />

                <ReadyBadge task={task} />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                <span>Task #{task.id}</span>

                {task.order_id && <span>Order #{task.order_id}</span>}

                {task.sequence && <span>Step {task.sequence}</span>}
              </div>
            </div>
          </div>

          <StatusBadge status={task.status} />
        </div>

        {/* ====================================================
            CUSTOMER / ORDER INFO
        ==================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <User size={18} className="mt-0.5 shrink-0 text-gray-500" />

              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">Customer</p>

                <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                  {task.customer_name || "—"}
                </p>

                {task.customer_phone && (
                  <a
                    href={`tel:${task.customer_phone}`}
                    className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Phone size={12} />
                    {task.customer_phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <CalendarDays
                size={18}
                className="mt-0.5 shrink-0 text-gray-500"
              />

              <div>
                <p className="text-xs font-medium text-gray-500">
                  Scheduled Time
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDateTime(task.scheduled_time)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            ADDRESS
        ==================================================== */}

        {task.customer_address && (
          <div className="mt-3 rounded-xl bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-gray-500" />

              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">Address</p>

                <p className="mt-1 text-sm text-gray-700">
                  {task.customer_address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            ORDER INFO
        ==================================================== */}

        {task.order && (
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package size={17} className="text-gray-500" />

                <span className="text-sm font-semibold text-gray-800">
                  Order #{task.order.id}
                </span>
              </div>

              <span className="text-xs font-medium capitalize text-gray-500">
                {String(task.order.status || "").replaceAll("_", " ")}
              </span>
            </div>

            {task.order.total_amount !== undefined &&
              task.order.total_amount !== null && (
                <p className="mt-2 text-sm text-gray-600">
                  Amount:{" "}
                  <span className="font-semibold text-gray-900">
                    ₹{Number(task.order.total_amount).toLocaleString("en-IN")}
                  </span>
                </p>
              )}
          </div>
        )}

        {/* ====================================================
            NOTES
        ==================================================== */}

        {task.notes && (
          <div className="mt-3 rounded-xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-xs font-semibold text-yellow-800">Task Notes</p>

            <p className="mt-1 whitespace-pre-wrap text-sm text-yellow-900">
              {task.notes}
            </p>
          </div>
        )}

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {expanded ? (
              <>
                Hide details
                <ChevronUp size={17} />
              </>
            ) : (
              <>
                Show details
                <ChevronDown size={17} />
              </>
            )}
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            {canStart && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onStart(task.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Play size={17} />
                )}
                Start Task
              </button>
            )}

            {canComplete && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onComplete(task.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Mark Complete
              </button>
            )}

            {task.status === "pending" && !task.isReady && (
              <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-500">
                <Clock3 size={16} />
                Waiting for previous task
              </div>
            )}

            {task.status === "completed" && (
              <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-50 px-5 py-2.5 text-sm font-semibold text-green-700">
                <CheckCircle2 size={17} />
                Task Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          EXPANDED DETAILS
      ====================================================== */}

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Assigned Date</p>

              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDate(task.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Started At</p>

              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDateTime(task.started_at)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Completed At</p>

              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDateTime(task.completed_at)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function MyTasks() {
  const {
    tasks,
    stats,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    updateStatus,
    refetch,
  } = useMyTasks("all");

  const [search, setSearch] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const [expandedTaskId, setExpandedTaskId] = useState(null);

  /* ==========================================================
     FILTER TASKS
  ========================================================== */

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tasks;
    }

    return tasks.filter((task) => {
      const taskType = TASK_TYPE_LABEL[task.task_type] || task.task_type;

      const searchableText = [
        task.id,
        task.order_id,
        task.customer_name,
        task.customer_phone,
        task.customer_address,
        task.task_type,
        taskType,
        task.status,
        task.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [tasks, search]);

  /* ==========================================================
     SORT TASKS
  ========================================================== */

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      /*
       * Priority:
       * urgent → normal
       */
      if (a.priority !== b.priority) {
        if (a.priority === "urgent") return -1;

        if (b.priority === "urgent") return 1;
      }

      /*
       * In-progress first
       */
      if (a.status !== b.status) {
        const rank = {
          in_progress: 0,
          pending: 1,
          completed: 2,
        };

        return (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
      }

      /*
       * Workflow sequence
       */
      if (Number(a.sequence || 999) !== Number(b.sequence || 999)) {
        return Number(a.sequence || 999) - Number(b.sequence || 999);
      }

      /*
       * Scheduled time
       */
      return (
        new Date(a.scheduled_time || 0).getTime() -
        new Date(b.scheduled_time || 0).getTime()
      );
    });
  }, [filteredTasks]);

  /* ==========================================================
     HANDLERS
  ========================================================== */

  const handleStart = async (taskId) => {
    try {
      setUpdatingTaskId(taskId);

      await updateStatus(taskId, "in_progress");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      setUpdatingTaskId(taskId);

      await updateStatus(taskId, "completed");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Tasks refreshed");
    } catch {
      // Hook already handles the error.
    }
  };

  const toggleExpanded = (taskId) => {
    setExpandedTaskId((current) => (current === taskId ? null : taskId));
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>

            <p className="mt-1 text-sm text-gray-500">
              View and manage the tasks assigned to you.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to load tasks
              </p>

              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* ====================================================
            STAT CARDS
        ==================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Tasks"
            value={stats.total}
            icon={ClipboardList}
            description="All assigned tasks"
            iconClass="bg-gray-100 text-gray-700"
          />

          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock3}
            description="Tasks waiting to start"
            iconClass="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={Loader2}
            description="Currently working"
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            description="Successfully completed"
            iconClass="bg-green-50 text-green-600"
          />
        </div>

        {/* ====================================================
            FILTER / SEARCH
        ==================================================== */}

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Status tabs */}
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full lg:max-w-sm">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search task, customer, order..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* ====================================================
            TASK COUNT
        ==================================================== */}

        {!loading && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {sortedTasks.length}
              </span>{" "}
              {sortedTasks.length === 1 ? "task" : "tasks"}
            </p>
          </div>
        )}

        {/* ====================================================
            TASK LIST
        ==================================================== */}

        {loading ? (
          <TaskSkeleton />
        ) : sortedTasks.length === 0 ? (
          <EmptyState search={Boolean(search)} />
        ) : (
          <div className="space-y-4">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={handleStart}
                onComplete={handleComplete}
                updatingTaskId={updatingTaskId}
                expanded={expandedTaskId === task.id}
                onToggle={() => toggleExpanded(task.id)}
              />
            ))}
          </div>
        )}

        {/* ====================================================
            WORKFLOW INFO
        ==================================================== */}

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={19} className="mt-0.5 shrink-0 text-blue-600" />

            <div>
              <h3 className="text-sm font-bold text-blue-900">Task workflow</h3>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Tasks follow the order assigned by the shop. A task becomes
                available when all previous workflow tasks for the order are
                completed.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-800">
                {[
                  "Pickup",
                  "Wash",
                  "Dry Cleaning",
                  "Ironing",
                  "Packing",
                  "Delivery",
                ].map((label, index) => (
                  <React.Fragment key={label}>
                    <span className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
                      {index + 1}. {label}
                    </span>

                    {index < 5 && <span>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
