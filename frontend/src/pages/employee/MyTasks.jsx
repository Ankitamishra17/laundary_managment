import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  History,
  ListChecks,
  Plus,
  Trash2,
  PackageOpen,
  X,
} from "lucide-react";

import toast from "react-hot-toast";

import { useMyTasks } from "../../hooks/useMyTasks";
import { taskApi } from "../../api/taskApi";
import { getInventoryItems } from "../../api/inventoryApi";

/* ============================================================
   BRAND TOKENS
============================================================ */

const colors = {
  bgDark: "#05282A",
  panelDark: "#0B3B3E",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#51787C",
  danger: "#E0645C",
  amber: "#B8791F",
};

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

/*
 * Only these tasks can consume inventory.
 *
 * Pickup and Delivery never ask for material usage.
 */
const MATERIAL_TASK_TYPES = ["wash", "dry", "iron", "pack"];

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
];

/* ============================================================
   HELPERS
============================================================ */

const formatTaskType = (type) =>
  TASK_TYPE_LABEL[type] || type || "Task";

const formatStatus = (status) =>
  STATUS_LABEL[status] || status || "Unknown";

const canUseMaterials = (taskType) =>
  MATERIAL_TASK_TYPES.includes(taskType);

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

const getInventoryArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({ status }) {
  if (status === "completed") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          backgroundColor: `${colors.mint}1F`,
          color: colors.primaryTeal,
        }}
      >
        <CheckCircle2 size={14} />
        Completed
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          backgroundColor: `${colors.seafoam}1F`,
          color: colors.seafoam,
        }}
      >
        <Loader2 size={14} />
        In Progress
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        backgroundColor: "#F2A93B1F",
        color: colors.amber,
      }}
    >
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
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
        style={{
          backgroundColor: `${colors.danger}1A`,
          color: colors.danger,
        }}
      >
        <AlertCircle size={13} />
        URGENT
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: colors.cardTint,
        color: colors.textMuted,
      }}
    >
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
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{
          backgroundColor: `${colors.seafoam}1F`,
          color: colors.seafoam,
        }}
      >
        <Play size={12} />
        Active
      </span>
    );
  }

  if (task.isReady) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{
          backgroundColor: `${colors.mint}1F`,
          color: colors.primaryTeal,
        }}
      >
        <CheckCircle2 size={12} />
        Ready
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: colors.cardTint,
        color: colors.textMuted,
      }}
    >
      <Clock3 size={12} />
      Waiting
    </span>
  );
}

/* ============================================================
   INVENTORY USAGE BADGE
============================================================ */

function InventoryUsageBadge({ taskType }) {
  if (!canUseMaterials(taskType)) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: `${colors.primaryTeal}12`,
        color: colors.primaryTeal,
      }}
    >
      <PackageOpen size={12} />
      Inventory Usage
    </span>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  iconBg,
  iconColor,
}) {
  return (
    <div
      className="rounded-2xl border p-5 shadow-sm"
      style={{
        backgroundColor: colors.bgLight,
        borderColor: colors.cardBorder,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: colors.textMuted }}
          >
            {title}
          </p>

          <h3
            className="mt-2 text-2xl"
            style={{
              color: colors.textDark,
              fontFamily: "'Libre Baskerville', serif",
            }}
          >
            {value}
          </h3>

          {description && (
            <p
              className="mt-1 text-xs"
              style={{ color: colors.textMuted }}
            >
              {description}
            </p>
          )}
        </div>

        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: iconBg,
            color: iconColor,
          }}
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
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{
        backgroundColor: colors.cardTint,
        color: colors.primaryTeal,
      }}
    >
      <Icon size={21} />
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({ search, title, subtitle }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center"
      style={{
        borderColor: colors.cardBorder,
        backgroundColor: colors.bgLight,
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.cardTint,
          color: colors.textMuted,
        }}
      >
        <ClipboardList size={26} />
      </div>

      <h3
        className="mt-4 text-base"
        style={{
          color: colors.textDark,
          fontFamily: "'Libre Baskerville', serif",
        }}
      >
        {search ? "No matching tasks" : title || "No tasks found"}
      </h3>

      <p
        className="mt-1 max-w-md text-sm"
        style={{ color: colors.textMuted }}
      >
        {search
          ? "Try changing your search or status filter."
          : subtitle ||
            "You currently don't have any tasks assigned to you."}
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
          className="animate-pulse rounded-2xl border p-5"
          style={{
            borderColor: colors.cardBorder,
            backgroundColor: colors.bgLight,
          }}
        >
          <div className="flex gap-4">
            <div
              className="h-11 w-11 rounded-xl"
              style={{ backgroundColor: colors.cardTint }}
            />

            <div className="flex-1">
              <div
                className="h-4 w-32 rounded"
                style={{ backgroundColor: colors.cardTint }}
              />

              <div
                className="mt-3 h-3 w-48 rounded"
                style={{ backgroundColor: colors.cardTint }}
              />

              <div
                className="mt-5 h-10 w-full rounded"
                style={{
                  backgroundColor: colors.cardTint,
                  opacity: 0.6,
                }}
              />
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

  const canStart =
    task.status === "pending" && task.isReady === true;

  const canComplete = task.status === "in_progress";

  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-sm transition"
      style={{
        backgroundColor: colors.bgLight,
        borderColor:
          task.priority === "urgent"
            ? `${colors.danger}4D`
            : colors.cardBorder,
      }}
    >
      <div className="p-5">
        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <TaskIcon taskType={task.task_type} />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className="text-base font-bold"
                  style={{ color: colors.textDark }}
                >
                  {formatTaskType(task.task_type)}
                </h3>

                <PriorityBadge priority={task.priority} />

                <ReadyBadge task={task} />

                <InventoryUsageBadge
                  taskType={task.task_type}
                />
              </div>

              <div
                className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                style={{ color: colors.textMuted }}
              >
                <span>Task #{task.id}</span>

                {task.order_id && (
                  <span>Order #{task.order_id}</span>
                )}

                {task.sequence && (
                  <span>Step {task.sequence}</span>
                )}
              </div>
            </div>
          </div>

          <StatusBadge status={task.status} />
        </div>

        {/* CUSTOMER / ORDER INFO */}
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: colors.cardTint }}
          >
            <div className="flex items-start gap-3">
              <User
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: colors.textMuted }}
              />

              <div className="min-w-0">
                <p
                  className="text-xs font-medium"
                  style={{ color: colors.textMuted }}
                >
                  Customer
                </p>

                <p
                  className="mt-1 truncate text-sm font-semibold"
                  style={{ color: colors.textDark }}
                >
                  {task.customer_name || "—"}
                </p>

                {task.customer_phone && (
                  <a
                    href={`tel:${task.customer_phone}`}
                    className="mt-1 flex items-center gap-1 text-xs hover:underline"
                    style={{ color: colors.primaryTeal }}
                  >
                    <Phone size={12} />
                    {task.customer_phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: colors.cardTint }}
          >
            <div className="flex items-start gap-3">
              <CalendarDays
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: colors.textMuted }}
              />

              <div>
                <p
                  className="text-xs font-medium"
                  style={{ color: colors.textMuted }}
                >
                  Scheduled Time
                </p>

                <p
                  className="mt-1 text-sm font-semibold"
                  style={{ color: colors.textDark }}
                >
                  {formatDateTime(task.scheduled_time)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ADDRESS */}
        {task.customer_address && (
          <div
            className="mt-3 rounded-xl p-4"
            style={{ backgroundColor: colors.cardTint }}
          >
            <div className="flex items-start gap-3">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: colors.textMuted }}
              />

              <div className="min-w-0">
                <p
                  className="text-xs font-medium"
                  style={{ color: colors.textMuted }}
                >
                  Address
                </p>

                <p
                  className="mt-1 text-sm"
                  style={{ color: colors.textDark }}
                >
                  {task.customer_address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ORDER INFO */}
        {task.order && (
          <div
            className="mt-3 rounded-xl border p-4"
            style={{
              borderColor: colors.cardBorder,
              backgroundColor: colors.bgLight,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package
                  size={17}
                  style={{ color: colors.textMuted }}
                />

                <span
                  className="text-sm font-semibold"
                  style={{ color: colors.textDark }}
                >
                  Order #{task.order.id}
                </span>
              </div>

              <span
                className="text-xs font-medium capitalize"
                style={{ color: colors.textMuted }}
              >
                {String(task.order.status || "").replaceAll(
                  "_",
                  " ",
                )}
              </span>
            </div>

            {task.order.total_amount !== undefined &&
              task.order.total_amount !== null && (
                <p
                  className="mt-2 text-sm"
                  style={{ color: colors.textMuted }}
                >
                  Amount:{" "}
                  <span
                    className="font-semibold"
                    style={{ color: colors.textDark }}
                  >
                    ₹
                    {Number(
                      task.order.total_amount,
                    ).toLocaleString("en-IN")}
                  </span>
                </p>
              )}
          </div>
        )}

        {/* NOTES */}
        {task.notes && (
          <div
            className="mt-3 rounded-xl border p-4"
            style={{
              borderColor: "#F2A93B4D",
              backgroundColor: "#F2A93B14",
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: colors.amber }}
            >
              Task Notes
            </p>

            <p
              className="mt-1 whitespace-pre-wrap text-sm"
              style={{ color: colors.textDark }}
            >
              {task.notes}
            </p>
          </div>
        )}

        {/* INVENTORY INFORMATION */}
        {canUseMaterials(task.task_type) &&
          task.status === "in_progress" && (
            <div
              className="mt-3 flex items-start gap-3 rounded-xl border p-4"
              style={{
                borderColor: `${colors.primaryTeal}33`,
                backgroundColor: `${colors.primaryTeal}08`,
              }}
            >
              <PackageOpen
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: colors.primaryTeal }}
              />

              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: colors.primaryTeal }}
                >
                  Inventory Usage
                </p>

                <p
                  className="mt-1 text-xs leading-5"
                  style={{ color: colors.textMuted }}
                >
                  When you complete this task, you can record
                  the materials used. Inventory will be reduced
                  automatically.
                </p>
              </div>
            </div>
          )}

        {/* ACTIONS */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: colors.textMuted }}
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
                className="tt-start-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
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
                className="tt-complete-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={17} />
                )}

                {canUseMaterials(task.task_type)
                  ? "Complete & Record Usage"
                  : "Mark Complete"}
              </button>
            )}

            {task.status === "pending" && !task.isReady && (
              <div
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
                style={{
                  backgroundColor: colors.cardTint,
                  color: colors.textMuted,
                }}
              >
                <Clock3 size={16} />
                Waiting for previous task
              </div>
            )}

            {task.status === "completed" && (
              <div
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                style={{
                  backgroundColor: `${colors.mint}1F`,
                  color: colors.primaryTeal,
                }}
              >
                <CheckCircle2 size={17} />
                Task Completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXPANDED DETAILS */}
      {expanded && (
        <div
          className="border-t px-5 py-4"
          style={{
            borderColor: colors.cardBorder,
            backgroundColor: colors.cardTint,
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: colors.textMuted }}
              >
                Assigned Date
              </p>

              <p
                className="mt-1 text-sm font-semibold"
                style={{ color: colors.textDark }}
              >
                {formatDate(task.createdAt)}
              </p>
            </div>

            <div>
              <p
                className="text-xs font-medium"
                style={{ color: colors.textMuted }}
              >
                Started At
              </p>

              <p
                className="mt-1 text-sm font-semibold"
                style={{ color: colors.textDark }}
              >
                {formatDateTime(task.started_at)}
              </p>
            </div>

            <div>
              <p
                className="text-xs font-medium"
                style={{ color: colors.textMuted }}
              >
                Completed At
              </p>

              <p
                className="mt-1 text-sm font-semibold"
                style={{ color: colors.textDark }}
              >
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
   HISTORY TASK CARD
============================================================ */

function HistoryTaskCard({ task }) {
  const customer = task.order?.customer || {};

  const customerName =
    task.customer_name || customer.name || "—";

  const customerPhone =
    task.customer_phone || customer.phone;

  const customerAddress =
    task.customer_address ||
    customer.address ||
    task.order?.delivery_address;

  return (
    <div
      className="overflow-hidden rounded-2xl border p-5 shadow-sm"
      style={{
        backgroundColor: colors.bgLight,
        borderColor: colors.cardBorder,
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <TaskIcon taskType={task.task_type} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="text-base font-bold"
                style={{ color: colors.textDark }}
              >
                {formatTaskType(task.task_type)}
              </h3>

              <PriorityBadge priority={task.priority} />

              <InventoryUsageBadge
                taskType={task.task_type}
              />
            </div>

            <div
              className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              style={{ color: colors.textMuted }}
            >
              <span>Task #{task.id}</span>

              {(task.order_id || task.order?.id) && (
                <span>
                  Order #{task.order_id || task.order?.id}
                </span>
              )}
            </div>
          </div>
        </div>

        <StatusBadge status={task.status} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.cardTint }}
        >
          <div className="flex items-start gap-3">
            <User
              size={17}
              className="mt-0.5 shrink-0"
              style={{ color: colors.textMuted }}
            />

            <div className="min-w-0">
              <p
                className="text-xs font-medium"
                style={{ color: colors.textMuted }}
              >
                Customer
              </p>

              <p
                className="mt-1 truncate text-sm font-semibold"
                style={{ color: colors.textDark }}
              >
                {customerName}
              </p>

              {customerPhone && (
                <a
                  href={`tel:${customerPhone}`}
                  className="mt-1 flex items-center gap-1 text-xs hover:underline"
                  style={{ color: colors.primaryTeal }}
                >
                  <Phone size={12} />
                  {customerPhone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.cardTint }}
        >
          <div className="flex items-start gap-3">
            <CalendarDays
              size={17}
              className="mt-0.5 shrink-0"
              style={{ color: colors.textMuted }}
            />

            <div>
              <p
                className="text-xs font-medium"
                style={{ color: colors.textMuted }}
              >
                Scheduled
              </p>

              <p
                className="mt-1 text-sm font-semibold"
                style={{ color: colors.textDark }}
              >
                {formatDateTime(task.scheduled_time)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {customerAddress && (
        <div
          className="mt-3 rounded-xl p-4"
          style={{ backgroundColor: colors.cardTint }}
        >
          <div className="flex items-start gap-3">
            <MapPin
              size={17}
              className="mt-0.5 shrink-0"
              style={{ color: colors.textMuted }}
            />

            <div className="min-w-0">
              <p
                className="text-xs font-medium"
                style={{ color: colors.textMuted }}
              >
                Address
              </p>

              <p
                className="mt-1 text-sm"
                style={{ color: colors.textDark }}
              >
                {customerAddress}
              </p>
            </div>
          </div>
        </div>
      )}

      {task.order && (
        <div
          className="mt-3 rounded-xl border p-4"
          style={{ borderColor: colors.cardBorder }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package
                size={16}
                style={{ color: colors.textMuted }}
              />

              <span
                className="text-sm font-semibold"
                style={{ color: colors.textDark }}
              >
                Order #{task.order.id}
              </span>
            </div>

            <span
              className="text-xs font-medium capitalize"
              style={{ color: colors.textMuted }}
            >
              {String(task.order.status || "").replaceAll(
                "_",
                " ",
              )}
            </span>
          </div>

          {task.order.total_amount !== undefined &&
            task.order.total_amount !== null && (
              <p
                className="mt-2 text-sm"
                style={{ color: colors.textMuted }}
              >
                Amount:{" "}
                <span
                  className="font-semibold"
                  style={{ color: colors.textDark }}
                >
                  ₹
                  {Number(
                    task.order.total_amount,
                  ).toLocaleString("en-IN")}
                </span>
              </p>
            )}
        </div>
      )}

      {task.notes && (
        <div
          className="mt-3 rounded-xl border p-4"
          style={{
            borderColor: "#F2A93B4D",
            backgroundColor: "#F2A93B14",
          }}
        >
          <p
            className="text-xs font-semibold"
            style={{ color: colors.amber }}
          >
            Task Notes
          </p>

          <p
            className="mt-1 whitespace-pre-wrap text-sm"
            style={{ color: colors.textDark }}
          >
            {task.notes}
          </p>
        </div>
      )}

      <div
        className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3"
        style={{ borderColor: colors.cardBorder }}
      >
        <div>
          <p
            className="text-xs font-medium"
            style={{ color: colors.textMuted }}
          >
            Assigned Date
          </p>

          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: colors.textDark }}
          >
            {formatDate(task.createdAt)}
          </p>
        </div>

        <div>
          <p
            className="text-xs font-medium"
            style={{ color: colors.textMuted }}
          >
            Started At
          </p>

          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: colors.textDark }}
          >
            {formatDateTime(task.started_at)}
          </p>
        </div>

        <div>
          <p
            className="text-xs font-medium"
            style={{ color: colors.textMuted }}
          >
            Completed At
          </p>

          <p
            className="mt-1 text-sm font-semibold"
            style={{ color: colors.textDark }}
          >
            {formatDateTime(task.completed_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MATERIAL USAGE MODAL
============================================================ */

function MaterialUsageModal({
  open,
  task,
  materials,
  inventoryItems,
  inventoryLoading,
  submitting,
  onClose,
  onAddMaterial,
  onUpdateMaterial,
  onRemoveMaterial,
  onSubmit,
  onCompleteWithoutMaterials,
}) {
  if (!open || !task) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="material-modal-title"
      >
        {/* MODAL HEADER */}
        <div
          className="flex items-start justify-between border-b px-5 py-4"
          style={{ borderColor: colors.cardBorder }}
        >
          <div>
            <div className="flex items-center gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${colors.primaryTeal}12`,
                  color: colors.primaryTeal,
                }}
              >
                <PackageOpen size={20} />
              </div>

              <div>
                <h2
                  id="material-modal-title"
                  className="text-lg font-bold"
                  style={{ color: colors.textDark }}
                >
                  Complete {formatTaskType(task.task_type)}
                </h2>

                <p
                  className="text-xs"
                  style={{ color: colors.textMuted }}
                >
                  Record materials used during this task.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: colors.textMuted }}
          >
            <X size={19} />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="overflow-y-auto px-5 py-5">
          {/* TASK INFO */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: colors.cardTint }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p
                  className="text-[11px] font-medium"
                  style={{ color: colors.textMuted }}
                >
                  Task
                </p>

                <p
                  className="mt-1 text-sm font-semibold"
                  style={{ color: colors.textDark }}
                >
                  #{task.id}
                </p>
              </div>

              <div>
                <p
                  className="text-[11px] font-medium"
                  style={{ color: colors.textMuted }}
                >
                  Order
                </p>

                <p
                  className="mt-1 text-sm font-semibold"
                  style={{ color: colors.textDark }}
                >
                  {task.order_id
                    ? `#${task.order_id}`
                    : "—"}
                </p>
              </div>

              <div>
                <p
                  className="text-[11px] font-medium"
                  style={{ color: colors.textMuted }}
                >
                  Customer
                </p>

                <p
                  className="mt-1 truncate text-sm font-semibold"
                  style={{ color: colors.textDark }}
                >
                  {task.customer_name || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* INVENTORY LOADING */}
          {inventoryLoading ? (
            <div
              className="mt-5 flex items-center justify-center rounded-xl border p-8"
              style={{ borderColor: colors.cardBorder }}
            >
              <div className="flex items-center gap-2 text-sm">
                <Loader2
                  size={18}
                  className="animate-spin"
                  style={{ color: colors.primaryTeal }}
                />
                <span style={{ color: colors.textMuted }}>
                  Loading inventory...
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* MATERIAL HEADER */}
              <div className="mt-6 flex items-center justify-between gap-3">
                <div>
                  <h3
                    className="text-sm font-bold"
                    style={{ color: colors.textDark }}
                  >
                    Materials Used
                  </h3>

                  <p
                    className="mt-1 text-xs"
                    style={{ color: colors.textMuted }}
                  >
                    Select the inventory items and quantity used.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={onAddMaterial}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor: `${colors.primaryTeal}12`,
                    color: colors.primaryTeal,
                  }}
                >
                  <Plus size={15} />
                  Add Material
                </button>
              </div>

              {/* MATERIAL ROWS */}
              {materials.length === 0 ? (
                <div
                  className="mt-4 rounded-xl border border-dashed p-7 text-center"
                  style={{ borderColor: colors.cardBorder }}
                >
                  <PackageOpen
                    size={28}
                    className="mx-auto"
                    style={{ color: colors.textMuted }}
                  />

                  <p
                    className="mt-2 text-sm font-semibold"
                    style={{ color: colors.textDark }}
                  >
                    No materials added
                  </p>

                  <p
                    className="mt-1 text-xs"
                    style={{ color: colors.textMuted }}
                  >
                    If you used inventory, click Add Material.
                  </p>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={onAddMaterial}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: colors.primaryTeal,
                    }}
                  >
                    <Plus size={16} />
                    Add Material
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {materials.map((material, index) => {
                    const selectedItem = inventoryItems.find(
                      (item) =>
                        Number(item.id) ===
                        Number(material.inventoryItemId),
                    );

                    const availableStock = Number(
                      selectedItem?.currentStock || 0,
                    );

                    const quantity = Number(
                      material.quantity || 0,
                    );

                    const exceedsStock =
                      quantity > availableStock;

                    return (
                      <div
                        key={`${index}-${material.inventoryItemId}`}
                        className="rounded-xl border p-4"
                        style={{
                          borderColor: exceedsStock
                            ? `${colors.danger}66`
                            : colors.cardBorder,
                          backgroundColor: exceedsStock
                            ? `${colors.danger}08`
                            : colors.bgLight,
                        }}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p
                            className="text-xs font-semibold"
                            style={{ color: colors.textDark }}
                          >
                            Material #{index + 1}
                          </p>

                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                              onRemoveMaterial(index)
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ color: colors.danger }}
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {/* INVENTORY ITEM */}
                          <div>
                            <label
                              className="mb-1.5 block text-xs font-semibold"
                              style={{
                                color: colors.textMuted,
                              }}
                            >
                              Inventory Item
                            </label>

                            <select
                              value={
                                material.inventoryItemId || ""
                              }
                              disabled={submitting}
                              onChange={(event) =>
                                onUpdateMaterial(
                                  index,
                                  "inventoryItemId",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                              style={{
                                borderColor:
                                  colors.cardBorder,
                                color: colors.textDark,
                                backgroundColor:
                                  colors.bgLight,
                              }}
                            >
                              <option value="">
                                Select material
                              </option>

                              {inventoryItems.map((item) => (
                                <option
                                  key={item.id}
                                  value={item.id}
                                >
                                  {item.name} —{" "}
                                  {Number(
                                    item.currentStock || 0,
                                  )}{" "}
                                  {item.unit}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* QUANTITY */}
                          <div>
                            <label
                              className="mb-1.5 block text-xs font-semibold"
                              style={{
                                color: colors.textMuted,
                              }}
                            >
                              Quantity
                            </label>

                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={material.quantity}
                                disabled={submitting}
                                onChange={(event) =>
                                  onUpdateMaterial(
                                    index,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                                placeholder="Enter quantity"
                                className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none"
                                style={{
                                  borderColor: exceedsStock
                                    ? colors.danger
                                    : colors.cardBorder,
                                  color: colors.textDark,
                                  backgroundColor:
                                    colors.bgLight,
                                }}
                              />

                              <div
                                className="flex min-w-[80px] items-center justify-center rounded-xl px-3 text-xs font-semibold"
                                style={{
                                  backgroundColor:
                                    colors.cardTint,
                                  color: colors.textMuted,
                                }}
                              >
                                {selectedItem?.unit || "Unit"}
                              </div>
                            </div>

                            {selectedItem && (
                              <p
                                className="mt-1.5 text-[11px]"
                                style={{
                                  color: exceedsStock
                                    ? colors.danger
                                    : colors.textMuted,
                                }}
                              >
                                Available:{" "}
                                {availableStock}{" "}
                                {selectedItem.unit}
                                {exceedsStock &&
                                  " — quantity exceeds available stock"}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* NOTES */}
                        <div className="mt-3">
                          <label
                            className="mb-1.5 block text-xs font-semibold"
                            style={{
                              color: colors.textMuted,
                            }}
                          >
                            Notes
                          </label>

                          <input
                            type="text"
                            value={material.notes || ""}
                            disabled={submitting}
                            onChange={(event) =>
                              onUpdateMaterial(
                                index,
                                "notes",
                                event.target.value,
                              )
                            }
                            placeholder="Optional note"
                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                            style={{
                              borderColor: colors.cardBorder,
                              color: colors.textDark,
                              backgroundColor:
                                colors.bgLight,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* IMPORTANT INFO */}
          <div
            className="mt-5 flex items-start gap-3 rounded-xl border p-4"
            style={{
              borderColor: `${colors.primaryTeal}33`,
              backgroundColor: `${colors.primaryTeal}08`,
            }}
          >
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
              style={{ color: colors.primaryTeal }}
            />

            <p
              className="text-xs leading-5"
              style={{ color: colors.textMuted }}
            >
              Inventory will be deducted only after the task
              completion is successfully processed. If there is
              insufficient stock, the task will not be completed.
            </p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div
          className="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end"
          style={{ borderColor: colors.cardBorder }}
        >
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: colors.cardBorder,
              color: colors.textMuted,
              backgroundColor: colors.bgLight,
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={onCompleteWithoutMaterials}
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: colors.cardBorder,
              color: colors.primaryTeal,
              backgroundColor: colors.cardTint,
            }}
          >
            Complete Without Materials
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background:
                "linear-gradient(95deg, #028090, #02C39A)",
            }}
          >
            {submitting ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                Complete Task
              </>
            )}
          </button>
        </div>
      </div>
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
  const [updatingTaskId, setUpdatingTaskId] =
    useState(null);

  const [expandedTaskId, setExpandedTaskId] =
    useState(null);

  /* ==========================================================
     VIEW
  ========================================================== */

  const [view, setView] = useState("current");

  /* ==========================================================
     HISTORY
  ========================================================== */

  const [historySearch, setHistorySearch] =
    useState("");

  const [historyTasks, setHistoryTasks] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState("");

  const historyLoadedRef = useRef(false);

  /* ==========================================================
     INVENTORY / MATERIAL USAGE
  ========================================================== */

  const [showMaterialModal, setShowMaterialModal] =
    useState(false);

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [materials, setMaterials] =
    useState([]);

  const [inventoryItems, setInventoryItems] =
    useState([]);

  const [inventoryLoading, setInventoryLoading] =
    useState(false);

  const [materialSubmitting, setMaterialSubmitting] =
    useState(false);

  /* ==========================================================
     LOAD INVENTORY
  ========================================================== */

  const loadInventoryItems = useCallback(async () => {
    try {
      setInventoryLoading(true);

      const response = await getInventoryItems();

      const items = getInventoryArray(response);

      const activeItems = items.filter(
        (item) =>
          item.status === "Active" &&
          item.isDeleted !== true,
      );

      setInventoryItems(activeItems);
    } catch (err) {
      console.error(
        "Load inventory items error:",
        err,
      );

      setInventoryItems([]);

      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load inventory items.",
      );
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  /* ==========================================================
     LOAD HISTORY
  ========================================================== */

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const data =
        await taskApi.getMyTaskHistory({
          status: "completed",
        });

      const list = Array.isArray(data)
        ? data
        : [];

      setHistoryTasks(
        list.filter(
          (task) => task.status === "completed",
        ),
      );

      historyLoadedRef.current = true;
    } catch (err) {
      console.error(
        "Load task history error:",
        err,
      );

      setHistoryTasks([]);

      setHistoryError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load task history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  /* ==========================================================
     LOAD HISTORY ON TAB OPEN
  ========================================================== */

  useEffect(() => {
    if (
      view === "history" &&
      !historyLoadedRef.current
    ) {
      loadHistory();
    }
  }, [view, loadHistory]);

  /* ==========================================================
     HISTORY FILTER
  ========================================================== */

  const filteredHistoryTasks = useMemo(() => {
    const query = historySearch
      .trim()
      .toLowerCase();

    if (!query) {
      return historyTasks;
    }

    return historyTasks.filter((task) => {
      const customer =
        task.order?.customer || {};

      const searchableText = [
        task.id,
        task.order_id,
        task.order?.id,
        task.customer_name ||
          customer.name,
        task.customer_phone ||
          customer.phone,
        task.task_type,
        TASK_TYPE_LABEL[task.task_type],
        task.status,
        task.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [historyTasks, historySearch]);

  /* ==========================================================
     HISTORY SORT
  ========================================================== */

  const sortedHistoryTasks = useMemo(() => {
    return [...filteredHistoryTasks].sort(
      (a, b) => {
        const aTime = new Date(
          a.completed_at ||
            a.scheduled_time ||
            0,
        ).getTime();

        const bTime = new Date(
          b.completed_at ||
            b.scheduled_time ||
            0,
        ).getTime();

        return bTime - aTime;
      },
    );
  }, [filteredHistoryTasks]);

  /* ==========================================================
     ACTIVE TASKS
  ========================================================== */

  const activeTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status !== "completed",
      ),
    [tasks],
  );

  /* ==========================================================
     FILTER CURRENT TASKS
  ========================================================== */

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return activeTasks;
    }

    return activeTasks.filter((task) => {
      const taskType =
        TASK_TYPE_LABEL[task.task_type] ||
        task.task_type;

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
  }, [activeTasks, search]);

  /* ==========================================================
     SORT CURRENT TASKS
  ========================================================== */

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      /*
       * Urgent first
       */
      if (a.priority !== b.priority) {
        if (a.priority === "urgent") {
          return -1;
        }

        if (b.priority === "urgent") {
          return 1;
        }
      }

      /*
       * In progress first
       */
      if (a.status !== b.status) {
        const rank = {
          in_progress: 0,
          pending: 1,
          completed: 2,
        };

        return (
          (rank[a.status] ?? 9) -
          (rank[b.status] ?? 9)
        );
      }

      /*
       * Workflow sequence
       */
      if (
        Number(a.sequence || 999) !==
        Number(b.sequence || 999)
      ) {
        return (
          Number(a.sequence || 999) -
          Number(b.sequence || 999)
        );
      }

      /*
       * Scheduled time
       */
      return (
        new Date(
          a.scheduled_time || 0,
        ).getTime() -
        new Date(
          b.scheduled_time || 0,
        ).getTime()
      );
    });
  }, [filteredTasks]);

  /* ==========================================================
     START TASK
  ========================================================== */

  const handleStart = async (taskId) => {
    try {
      setUpdatingTaskId(taskId);

      await updateStatus(
        taskId,
        "in_progress",
      );
    } catch (error) {
      console.error(
        "Start task error:",
        error,
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  /* ==========================================================
     COMPLETE TASK
  ========================================================== */

  const handleComplete = async (taskId) => {
    const task = tasks.find(
      (item) => item.id === taskId,
    );

    if (!task) {
      return;
    }

    /*
     * Pickup and Delivery:
     * No inventory popup.
     */
    if (!canUseMaterials(task.task_type)) {
      try {
        setUpdatingTaskId(taskId);

        await updateStatus(
          taskId,
          "completed",
          [],
        );
      } catch (error) {
        console.error(
          "Complete task error:",
          error,
        );
      } finally {
        setUpdatingTaskId(null);
      }

      return;
    }

    /*
     * Wash / Dry / Iron / Pack:
     * Open inventory usage modal.
     */
    setSelectedTask(task);
    setMaterials([]);
    setShowMaterialModal(true);

    /*
     * Load latest stock.
     */
    await loadInventoryItems();
  };

  /* ==========================================================
     ADD MATERIAL
  ========================================================== */

  const addMaterial = () => {
    setMaterials((current) => [
      ...current,
      {
        inventoryItemId: "",
        quantity: "",
        notes: "",
      },
    ]);
  };

  /* ==========================================================
     UPDATE MATERIAL
  ========================================================== */

  const updateMaterial = (
    index,
    field,
    value,
  ) => {
    setMaterials((current) =>
      current.map((material, materialIndex) =>
        materialIndex === index
          ? {
              ...material,
              [field]: value,
            }
          : material,
      ),
    );
  };

  /* ==========================================================
     REMOVE MATERIAL
  ========================================================== */

  const removeMaterial = (index) => {
    setMaterials((current) =>
      current.filter(
        (_, materialIndex) =>
          materialIndex !== index,
      ),
    );
  };

  /* ==========================================================
     CLOSE MATERIAL MODAL
  ========================================================== */

  const closeMaterialModal = () => {
    if (materialSubmitting) {
      return;
    }

    setShowMaterialModal(false);
    setSelectedTask(null);
    setMaterials([]);
  };

  /* ==========================================================
     COMPLETE WITHOUT MATERIALS
  ========================================================== */

  const completeWithoutMaterials = async () => {
    if (!selectedTask) {
      return;
    }

    try {
      setMaterialSubmitting(true);
      setUpdatingTaskId(selectedTask.id);

      await updateStatus(
        selectedTask.id,
        "completed",
        [],
      );

      setShowMaterialModal(false);
      setSelectedTask(null);
      setMaterials([]);

      toast.success(
        "Task completed successfully.",
      );
    } catch (error) {
      console.error(
        "Complete without materials error:",
        error,
      );
    } finally {
      setMaterialSubmitting(false);
      setUpdatingTaskId(null);
    }
  };

  /* ==========================================================
     SUBMIT MATERIAL USAGE + COMPLETE
  ========================================================== */

  const submitMaterialUsage = async () => {
    if (!selectedTask) {
      return;
    }

    /*
     * Validate rows.
     */
    const invalidRows = materials.some(
      (material) =>
        !material.inventoryItemId ||
        !Number.isFinite(
          Number(material.quantity),
        ) ||
        Number(material.quantity) <= 0,
    );

    if (invalidRows) {
      toast.error(
        "Please select a material and enter a valid quantity.",
      );
      return;
    }

    /*
     * Frontend stock validation.
     *
     * Backend will perform the final authoritative check.
     */
    for (const material of materials) {
      const inventoryItem =
        inventoryItems.find(
          (item) =>
            Number(item.id) ===
            Number(material.inventoryItemId),
        );

      if (!inventoryItem) {
        toast.error(
          "One of the selected inventory items is no longer available.",
        );
        return;
      }

      const availableStock = Number(
        inventoryItem.currentStock || 0,
      );

      const requestedQuantity = Number(
        material.quantity,
      );

      if (requestedQuantity > availableStock) {
        toast.error(
          `${inventoryItem.name}: only ${availableStock} ${inventoryItem.unit} available.`,
        );
        return;
      }
    }

    const payloadMaterials = materials.map(
      (material) => ({
        inventoryItemId: Number(
          material.inventoryItemId,
        ),
        quantity: Number(
          material.quantity,
        ),
        notes:
          material.notes?.trim() || null,
      }),
    );

    try {
      setMaterialSubmitting(true);
      setUpdatingTaskId(selectedTask.id);

      /*
       * IMPORTANT:
       *
       * We send materials to the task completion API.
       *
       * We do NOT call createStockOut() here.
       *
       * Backend should deduct inventory and complete
       * the task inside the same DB transaction.
       */
      await updateStatus(
        selectedTask.id,
        "completed",
        payloadMaterials,
      );

      setShowMaterialModal(false);
      setSelectedTask(null);
      setMaterials([]);

      toast.success(
        "Task completed and inventory usage recorded.",
      );

      /*
       * Refresh task board so the completed task disappears
       * and next workflow task becomes available.
       */
      await refetch();
    } catch (error) {
      console.error(
        "Complete task with materials error:",
        error,
      );
    } finally {
      setMaterialSubmitting(false);
      setUpdatingTaskId(null);
    }
  };

  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = async () => {
    try {
      await refetch();

      toast.success("Tasks refreshed");
    } catch {
      // Hook handles the error.
    }
  };

  /* ==========================================================
     HISTORY REFRESH
  ========================================================== */

  const handleHistoryRefresh = async () => {
    try {
      historyLoadedRef.current = false;

      await loadHistory();

      toast.success(
        "Task history refreshed",
      );
    } catch {
      // loadHistory handles the error.
    }
  };

  /* ==========================================================
     TOGGLE EXPANDED
  ========================================================== */

  const toggleExpanded = (taskId) => {
    setExpandedTaskId((current) =>
      current === taskId ? null : taskId,
    );
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
      style={{
        backgroundColor: colors.cardTint,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

        .tt-search:focus-within {
          border-color: ${colors.primaryTeal};
          box-shadow: 0 0 0 3px ${colors.primaryTeal}26;
        }

        .tt-view-btn {
          transition:
            background-color 0.15s ease,
            color 0.15s ease;
        }

        .tt-status-btn {
          transition:
            background-color 0.15s ease,
            color 0.15s ease;
        }

        .tt-refresh-btn:hover {
          background-color: ${colors.cardTint};
        }

        .tt-start-btn {
          background:
            linear-gradient(
              95deg,
              ${colors.primaryTeal},
              ${colors.mint}
            );

          transition: filter 0.15s ease;
        }

        .tt-start-btn:hover {
          filter: brightness(1.06);
        }

        .tt-complete-btn {
          background:
            linear-gradient(
              95deg,
              ${colors.mint},
              ${colors.seafoam}
            );

          transition: filter 0.15s ease;
        }

        .tt-complete-btn:hover {
          filter: brightness(1.06);
        }
      `}</style>

      <div className="mx-auto max-w-7xl">
        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1
              className="text-2xl"
              style={{
                color: colors.textDark,
                fontFamily:
                  "'Libre Baskerville', serif",
              }}
            >
              My Tasks
            </h1>

            <p
              className="mt-1 text-sm"
              style={{ color: colors.textMuted }}
            >
              View and manage the tasks assigned to
              you.
            </p>
          </div>

          <button
            type="button"
            onClick={
              view === "current"
                ? handleRefresh
                : handleHistoryRefresh
            }
            disabled={
              view === "current"
                ? loading
                : historyLoading
            }
            className="tt-refresh-btn inline-flex w-fit items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: colors.cardBorder,
              backgroundColor: colors.bgLight,
              color: colors.textDark,
            }}
          >
            <RefreshCw
              size={17}
              className={
                (
                  view === "current"
                    ? loading
                    : historyLoading
                )
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* ====================================================
            VIEW TOGGLE
        ==================================================== */}

        <div
          className="mb-6 inline-flex gap-1 rounded-2xl border p-1"
          style={{
            borderColor: colors.cardBorder,
            backgroundColor: colors.bgLight,
          }}
        >
          <button
            type="button"
            onClick={() => setView("current")}
            className="tt-view-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor:
                view === "current"
                  ? colors.primaryTeal
                  : "transparent",
              color:
                view === "current"
                  ? "#FFFFFF"
                  : colors.textMuted,
            }}
          >
            <ListChecks size={16} />
            Employee Tasks
          </button>

          <button
            type="button"
            onClick={() => setView("history")}
            className="tt-view-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor:
                view === "history"
                  ? colors.primaryTeal
                  : "transparent",
              color:
                view === "history"
                  ? "#FFFFFF"
                  : colors.textMuted,
            }}
          >
            <History size={16} />
            Task History
          </button>
        </div>

        {/* ====================================================
            CURRENT TASKS
        ==================================================== */}

        {view === "current" && (
          <>
            {/* ERROR */}
            {error && (
              <div
                className="mb-6 flex items-start gap-3 rounded-xl border p-4"
                style={{
                  borderColor: `${colors.danger}4D`,
                  backgroundColor: `${colors.danger}0D`,
                }}
              >
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                  style={{ color: colors.danger }}
                />

                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: colors.danger }}
                  >
                    Unable to load tasks
                  </p>

                  <p
                    className="mt-1 text-sm"
                    style={{ color: colors.danger }}
                  >
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* STATS */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Tasks"
                value={stats.total}
                icon={ClipboardList}
                description="All assigned tasks"
                iconBg={`${colors.primaryTeal}1A`}
                iconColor={colors.primaryTeal}
              />

              <StatCard
                title="Pending"
                value={stats.pending}
                icon={Clock3}
                description="Tasks waiting to start"
                iconBg="#F2A93B1F"
                iconColor={colors.amber}
              />

              <StatCard
                title="In Progress"
                value={stats.inProgress}
                icon={Loader2}
                description="Currently working"
                iconBg={`${colors.seafoam}1F`}
                iconColor={colors.seafoam}
              />

              <StatCard
                title="Completed"
                value={stats.completed}
                icon={CheckCircle2}
                description="Successfully completed"
                iconBg={`${colors.mint}1F`}
                iconColor={colors.primaryTeal}
              />
            </div>

            {/* FILTER / SEARCH */}
            <div
              className="mb-5 rounded-2xl border p-4 shadow-sm"
              style={{
                borderColor: colors.cardBorder,
                backgroundColor: colors.bgLight,
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((filter) => {
                    const active =
                      statusFilter ===
                      filter.value;

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() =>
                          setStatusFilter(
                            filter.value,
                          )
                        }
                        className="tt-status-btn rounded-xl px-4 py-2 text-sm font-semibold"
                        style={{
                          backgroundColor:
                            active
                              ? colors.primaryTeal
                              : colors.cardTint,
                          color: active
                            ? "#FFFFFF"
                            : colors.textMuted,
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="tt-search relative w-full rounded-xl border transition-shadow lg:max-w-sm"
                  style={{
                    borderColor:
                      colors.cardBorder,
                    backgroundColor:
                      colors.cardTint,
                  }}
                >
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{
                      color: colors.textMuted,
                    }}
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search task, customer, order..."
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
                    style={{
                      color: colors.textDark,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* TASK COUNT */}
            {!loading && (
              <div className="mb-4 flex items-center justify-between">
                <p
                  className="text-sm"
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  Showing{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color: colors.textDark,
                    }}
                  >
                    {sortedTasks.length}
                  </span>{" "}
                  {sortedTasks.length === 1
                    ? "task"
                    : "tasks"}
                </p>
              </div>
            )}

            {/* TASK LIST */}
            {loading ? (
              <TaskSkeleton />
            ) : sortedTasks.length === 0 ? (
              <EmptyState
                search={Boolean(search)}
              />
            ) : (
              <div className="space-y-4">
                {sortedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStart={handleStart}
                    onComplete={handleComplete}
                    updatingTaskId={
                      updatingTaskId
                    }
                    expanded={
                      expandedTaskId ===
                      task.id
                    }
                    onToggle={() =>
                      toggleExpanded(
                        task.id,
                      )
                    }
                  />
                ))}
              </div>
            )}

            {/* WORKFLOW INFO */}
            <div
              className="mt-6 rounded-2xl border p-5"
              style={{
                borderColor: `${colors.primaryTeal}33`,
                backgroundColor: colors.cardTint,
              }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                  style={{
                    color: colors.primaryTeal,
                  }}
                />

                <div>
                  <h3
                    className="text-sm"
                    style={{
                      color: colors.textDark,
                      fontFamily:
                        "'Libre Baskerville', serif",
                    }}
                  >
                    Task workflow
                  </h3>

                  <p
                    className="mt-1 text-sm leading-6"
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    Tasks follow the order assigned by
                    the shop. A task becomes available
                    when all previous workflow tasks for
                    the order are completed.
                  </p>

                  <div
                    className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold"
                    style={{
                      color: colors.primaryTeal,
                    }}
                  >
                    {[
                      "Pickup",
                      "Wash",
                      "Dry Cleaning",
                      "Ironing",
                      "Packing",
                      "Delivery",
                    ].map((label, index) => (
                      <React.Fragment key={label}>
                        <span
                          className="rounded-lg px-2.5 py-1.5 shadow-sm"
                          style={{
                            backgroundColor:
                              colors.bgLight,
                          }}
                        >
                          {index + 1}. {label}
                        </span>

                        {index < 5 && (
                          <span
                            style={{
                              color:
                                colors.textMuted,
                            }}
                          >
                            →
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* INVENTORY INFO */}
                  {/* <div
                    className="mt-4 rounded-xl border p-3"
                    style={{
                      borderColor: `${colors.primaryTeal}26`,
                      backgroundColor:
                        colors.bgLight,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <PackageOpen
                        size={16}
                        className="mt-0.5 shrink-0"
                        style={{
                          color:
                            colors.primaryTeal,
                        }}
                      />

                      <p
                        className="text-xs leading-5"
                        style={{
                          color:
                            colors.textMuted,
                        }}
                      >
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              colors.textDark,
                          }}
                        >
                          Inventory:
                        </span>{" "}
                        Wash, Dry Cleaning, Ironing and
                        Packing tasks can record material
                        usage when completed. Pickup and
                        Delivery do not consume inventory.
                      </p>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ====================================================
            TASK HISTORY
        ==================================================== */}

        {view === "history" && (
          <>
            {/* HISTORY ERROR */}
            {historyError && (
              <div
                className="mb-6 flex items-start gap-3 rounded-xl border p-4"
                style={{
                  borderColor: `${colors.danger}4D`,
                  backgroundColor: `${colors.danger}0D`,
                }}
              >
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                  style={{
                    color: colors.danger,
                  }}
                />

                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: colors.danger,
                    }}
                  >
                    Unable to load task history
                  </p>

                  <p
                    className="mt-1 text-sm"
                    style={{
                      color: colors.danger,
                    }}
                  >
                    {historyError}
                  </p>
                </div>
              </div>
            )}

            {/* HISTORY SEARCH */}
            <div
              className="mb-5 rounded-2xl border p-4 shadow-sm"
              style={{
                borderColor: colors.cardBorder,
                backgroundColor: colors.bgLight,
              }}
            >
              <div
                className="tt-search relative w-full rounded-xl border transition-shadow lg:max-w-sm"
                style={{
                  borderColor:
                    colors.cardBorder,
                  backgroundColor:
                    colors.cardTint,
                }}
              >
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{
                    color: colors.textMuted,
                  }}
                />

                <input
                  type="text"
                  value={historySearch}
                  onChange={(event) =>
                    setHistorySearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search past task, customer, order..."
                  className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
                  style={{
                    color: colors.textDark,
                  }}
                />
              </div>
            </div>

            {/* HISTORY COUNT */}
            {!historyLoading && (
              <div className="mb-4 flex items-center justify-between">
                <p
                  className="text-sm"
                  style={{
                    color: colors.textMuted,
                  }}
                >
                  Showing{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color: colors.textDark,
                    }}
                  >
                    {sortedHistoryTasks.length}
                  </span>{" "}
                  {sortedHistoryTasks.length ===
                  1
                    ? "task"
                    : "tasks"}
                </p>
              </div>
            )}

            {/* HISTORY LIST */}
            {historyLoading ? (
              <TaskSkeleton />
            ) : sortedHistoryTasks.length === 0 ? (
              <EmptyState
                search={Boolean(historySearch)}
                title="No task history yet"
                subtitle="Tasks you've completed in the past will appear here."
              />
            ) : (
              <div className="space-y-4">
                {sortedHistoryTasks.map(
                  (task) => (
                    <HistoryTaskCard
                      key={task.id}
                      task={task}
                    />
                  ),
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================
          MATERIAL USAGE MODAL
      ======================================================== */}

      <MaterialUsageModal
        open={showMaterialModal}
        task={selectedTask}
        materials={materials}
        inventoryItems={inventoryItems}
        inventoryLoading={inventoryLoading}
        submitting={materialSubmitting}
        onClose={closeMaterialModal}
        onAddMaterial={addMaterial}
        onUpdateMaterial={updateMaterial}
        onRemoveMaterial={removeMaterial}
        onSubmit={submitMaterialUsage}
        onCompleteWithoutMaterials={
          completeWithoutMaterials
        }
      />
    </div>
  );
}