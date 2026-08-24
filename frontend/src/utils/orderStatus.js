// Shared order-status helpers for the customer-facing pages.

export const ORDER_STATUS_META = {
  pending: { label: "Pending", color: "#9A6A12", bg: "#FBF0DC" },
  picked_up: { label: "Picked Up", color: "#028090", bg: "#E0F4F4" },
  processing: { label: "Processing", color: "#0B3B3E", bg: "#DCEBEA" },
  ready_for_delivery: { label: "Ready", color: "#00A896", bg: "#DFF6F2" },
  out_for_delivery: { label: "Out for Delivery", color: "#028090", bg: "#E0F4F4" },
  delivered: { label: "Delivered", color: "#0B6E63", bg: "#DFF7F1" },
  cancelled: { label: "Cancelled", color: "#E0645C", bg: "#FBE9E8" },
};

// Ordered journey for the timeline (cancelled is shown separately).
export const ORDER_JOURNEY = ["pending", "picked_up", "processing", "ready_for_delivery", "out_for_delivery", "delivered"];

export const ACTIVE_STATUSES = ["pending", "picked_up", "processing", "ready_for_delivery", "out_for_delivery"];

export function statusMeta(status) {
  return ORDER_STATUS_META[status] || ORDER_STATUS_META.pending;
}

export function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value) {
  if (!value) return "—";
  // Date-only strings ("2026-08-15") parse as UTC midnight in JS, which can
  // shift a day in negative-offset timezones — parse them as local instead.
  const d =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Which journey step an order has reached (index into ORDER_JOURNEY).
export function journeyIndex(status) {
  const idx = ORDER_JOURNEY.indexOf(status);
  return idx === -1 ? 0 : idx;
}
