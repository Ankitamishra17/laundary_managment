import React from "react";

const STYLES = {
  pending: { color: "#9A6A12", bg: "#FBF0DC", label: "Pending" },
  in_progress: { color: "#0B3B3E", bg: "#DCEBEA", label: "In Progress" },
  completed: { color: "#02C39A", bg: "#DFF7F1", label: "Completed" },
};

export default function StatusPill({ status }) {
  const s = STYLES[status] || STYLES.pending;
  return (
    <span
      className="text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}