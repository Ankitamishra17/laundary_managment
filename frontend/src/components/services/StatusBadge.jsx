import React from "react";

const styles = {
  Active: { bg: "#02C39A1F", text: "#028090" },
  Inactive: { bg: "#E0645C1F", text: "#E0645C" },
};

const StatusBadge = ({ status, clickable = false }) => {
  const s = styles[status] || styles.Active;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${clickable ? "cursor-pointer" : ""}`}
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
